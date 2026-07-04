// Adapt — zero-dependency Node server: static files + Gemini proxy.
// The GEMINI_API_KEY lives in .env and NEVER reaches the browser.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// ---------- config ----------
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const FB_DIR = path.join(ROOT, 'fallbacks');
const FB_AUTO = path.join(FB_DIR, 'auto');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MODEL_ALT = 'gemini-flash-latest'; // second try on 429/5xx
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';

// read .env by hand (zero deps)
function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch (e) { /* no .env — rely on real env */ }
}
loadEnv();
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) console.error('WARNING: GEMINI_API_KEY missing — every route will serve fallbacks.');

// ---------- shared system-instruction opening (Kumial) ----------
const SHARED_TONE = `TONE: You are a warm, patient, plain-spoken, encouraging study companion for students aged 15-18 — never a rigid examiner, never a robotic form letter, accessible but never childish or patronising.
SAFETY: Never sound clinical or diagnostic. Never mention conditions or disabilities. Stick entirely to the academic content provided. If input is ambiguous or outside common knowledge, represent the original text faithfully — invent nothing.
CONSISTENCY: Keep the same voice at all times.`;

// profile tone rules (Shaheer)
function profileRules(profile) {
  if (profile === 'dyslexia') return 'PROFILE: Sentences under 12 words. One idea per sentence. No subordinate clauses, no semicolons. Concrete nouns over abstract. Plain, high-frequency vocabulary.';
  if (profile === 'adhd') return 'PROFILE: Active verbs, varied sentence length, engaging question hooks. Build momentum through structure — never exclamation marks, emoji, or filler enthusiasm.';
  return 'PROFILE: Warm, neutral peer curiosity.';
}

// ---------- route definitions ----------
const ROUTES = {
  reader: {
    system: (b) => `${SHARED_TONE}
You are a reading-accessibility assistant. Re-render the text the student gives you into short, self-contained chunks. Each chunk is one idea, sentences under ~18 words. Adjust vocabulary simplicity and chunk size for the profile. Preserve ALL factual data — simplify and re-format, do NOT summarise, add nothing new.
${profileRules(b.profile)}`,
    user: (b) => `Re-render this text into accessible chunks:\n\n${b.text}`,
    schema: {
      type: 'OBJECT',
      properties: {
        chunks: { type: 'ARRAY', items: { type: 'STRING' }, description: 'ordered short self-contained chunks' },
        flagged_terms: { type: 'ARRAY', items: { type: 'STRING' }, description: 'technical terms kept as-is' },
      },
      required: ['chunks'],
    },
    validate: (b) => (b.text && b.text.trim().length > 0) || 'empty input',
    sane: (d) => Array.isArray(d.chunks) && d.chunks.length > 0 && d.chunks.every(c => c && c.trim()),
  },

  explain: {
    system: (b) => `${SHARED_TONE}
Re-explain the student's text strictly in the requested style. Frame it as "a way of understanding", never a clinical claim about how the student's brain works. Stay accurate to the source material.
Styles: analogy = compare the concept to something concrete and familiar; story = narrate it with a clear beginning, middle and end; step_by_step = an ordered sequence of steps.
${profileRules(b.profile)}`,
    user: (b) => `Style: ${b.style}\n\nExplain this:\n\n${b.text}`,
    schema: {
      type: 'OBJECT',
      properties: {
        style_used: { type: 'STRING', enum: ['analogy', 'story', 'step_by_step'] },
        core_idea_summary: { type: 'STRING', description: 'one short sentence heading' },
        explanation: { type: 'ARRAY', items: { type: 'STRING' }, description: 'paragraphs, or ordered steps for step_by_step' },
      },
      required: ['style_used', 'explanation'],
    },
    validate: (b) => (['analogy', 'story', 'step_by_step'].includes(b.style) || 'unrecognised style')
      && ((b.text && b.text.trim().length > 0) || 'empty input'),
    sane: (d) => Array.isArray(d.explanation) && d.explanation.length > 0,
  },

  dialogue: { // Phase 1 — "Gem" the confused peer. Plain text, no schema.
    system: (b) => `You are Gem, a peer classmate being taught an academic concept right now by the user. You are the learner — never a tutor, examiner, or AI assistant.
INPUT FORMAT: Each turn arrives as: [User said: "{stt_text}" | Reminder: stay in character as Gem, max 3 sentences, end with one specific question]
The conversation history you receive is already pre-sliced to the last 10 turns by the application. Treat it as the complete available context.
INPUT RESILIENCE: Text comes from a speech-to-text engine. Ignore fillers ("um", "like"), stutters, missing punctuation, and phonetic errors. Infer conceptual intent charitably.
BEHAVIOURAL RULES: Never lecture, define, correct, or answer. If the user is wrong, process it as YOUR confusion, never their mistake. You know NOTHING about the topic beyond what the user has said — never fill gaps from your own knowledge. Max 3 sentences per turn. End every turn with exactly ONE specific question tied directly to the user's last statement. Generic questions are prohibited. If the user contradicts an earlier turn, voice it as your own confusion: "Wait, I'm mixing myself up — I thought you said X did Y earlier, but now it sounds like Z?" If the user is stuck, sparse, or frustrated, drop all confusion immediately and reassure: "No stress — want to try that part with an everyday analogy instead?" Never use the words "score", "gap", "assess", "evaluate", or any evaluation vocabulary. Never sarcastic, robotic, lecture-y, or falsely enthusiastic.
${profileRules(b.profile)}
TERMINATION: At turn 8-10 (a hard cap the app enforces), or the moment the user signals they are done, respond fully in character with exactly: "Wow, I think I finally get the big picture of how this fits together! Let's pause here and see what we mapped out."`,
    schema: null,
    validate: (b) => (Array.isArray(b.history) && b.history.length > 0) || 'empty history',
  },

  finalize: { // Phase 2 — rigorous analysis engine (Shaheer's final schema)
    system: (b) => `You are a rigorous analysis engine. Input: the complete indexed transcript array of a Teach-it-Back session (user = teacher, Gem = learner) plus a reference_concept field (source text, topic title, or empty).
EVALUATION RULES:
1. HONESTY: Judge only what the transcript explicitly evidences. Never credit knowledge the user didn't state. Never fabricate gaps or strengths.
2. BENCHMARK MODES: MODE A (reference_concept contains source text): judge accuracy and completeness against it. Set benchmark = "reference_text". MODE B (title only or empty): do NOT invent a fact baseline. Judge internal consistency, structural logic, and coherence of the explanation itself. Set benchmark = "self_consistency".
3. STT CHARITY: Never lower the score for transcription artifacts, typos, or broken syntax where conceptual intent is discernible.
4. TREND: Assess progression across the session — "improving", "steady", or "declining".
5. GAP LOCATIONS: Reference gaps by turn_index only. Never reproduce transcript text. Write each gap's peer_hint in Gem's voice: supportive, non-punitive.
6. The improved_explanation rewrites the student's explanation properly, structured in sections. ${profileRules(b.profile)}`,
    user: (b) => `reference_concept: ${JSON.stringify(b.reference_concept || '')}\n\ntranscript: ${JSON.stringify(b.transcript)}`,
    schema: {
      type: 'OBJECT',
      properties: {
        understanding_score: { type: 'INTEGER' },
        benchmark: { type: 'STRING', enum: ['reference_text', 'self_consistency'] },
        trend: { type: 'STRING', enum: ['improving', 'steady', 'declining'] },
        strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        gaps: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              turn_index: { type: 'INTEGER' },
              missing_point: { type: 'STRING' },
              peer_hint: { type: 'STRING' },
            },
            required: ['turn_index', 'missing_point', 'peer_hint'],
          },
        },
        follow_up_questions: { type: 'ARRAY', items: { type: 'STRING' } },
        improved_explanation: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              section_heading: { type: 'STRING' },
              content_paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['section_heading', 'content_paragraphs'],
          },
        },
      },
      required: ['understanding_score', 'benchmark', 'trend', 'strengths', 'gaps', 'follow_up_questions', 'improved_explanation'],
    },
    // SUFFICIENCY enforced server-side (schema-forced output can't return an error object):
    validate: (b) => {
      if (!Array.isArray(b.transcript) || b.transcript.length === 0) return 'empty transcript';
      const substantive = b.transcript.filter(t => t.role === 'user' && isSubstantive(t.text));
      if (substantive.length < 2) return 'insufficient_transcript';
      return true;
    },
    sane: (d) => Number.isInteger(d.understanding_score) && Array.isArray(d.gaps) && Array.isArray(d.follow_up_questions),
    post: (d) => { d.understanding_score = Math.max(0, Math.min(100, d.understanding_score)); return d; },
  },
};

// a substantive turn contains a concept-specific word, not a bare acknowledgment
function isSubstantive(text) {
  if (!text) return false;
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return false;
  return !/^(yes|no|ok|okay|yeah|i don'?t know|idk|sure|fine|hmm+)[.!?]*$/i.test(text.trim());
}

// ---------- Gemini call with retry + model fallback ----------
function callGemini(model, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    fetch(`${GEMINI}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).then(async r => {
      clearTimeout(t);
      const body = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(`gemini ${r.status}`); e.status = r.status; e.body = body; return reject(e); }
      resolve(body);
    }).catch(e => { clearTimeout(t); reject(e); });
  });
}

// Circuit breaker: when the key is quota-blocked, stop hammering it and serve
// fallbacks INSTANTLY (no dead-air on stage). Self-heals after a cooldown so a
// recovered key goes live again on its own.
const breaker = { fails: 0, openUntil: 0 };
function circuitOpen() { return Date.now() < breaker.openUntil; }
function noteFail(status) {
  if (status === 429 || (status && status >= 500)) {
    if (++breaker.fails >= 2) breaker.openUntil = Date.now() + 45000;
  }
}
function noteOk() { breaker.fails = 0; breaker.openUntil = 0; }

async function askGemini(route, body) {
  if (!KEY) throw new Error('no key');
  if (circuitOpen()) { const e = new Error('circuit open — serving fallback'); e.circuit = true; throw e; }
  const def = ROUTES[route];
  const payload = {
    systemInstruction: { parts: [{ text: def.system(body) }] },
    contents: buildContents(route, body),
    generationConfig: def.schema
      ? { responseMimeType: 'application/json', responseSchema: def.schema, temperature: 0.4 }
      : { temperature: 0.9, maxOutputTokens: 500 },
  };
  const attempts = [[MODEL, 0], [MODEL_ALT, 800]]; // primary, then one quick alt-model retry
  let lastErr;
  for (const [model, wait] of attempts) {
    if (wait) await new Promise(r => setTimeout(r, wait));
    try {
      const resp = await callGemini(model, payload, route === 'finalize' ? 45000 : 20000);
      const text = resp?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      if (!text) throw new Error('empty candidate');
      let data = def.schema ? JSON.parse(text) : { reply: text.trim() };
      if (def.sane && !def.sane(data)) throw new Error('sanity check failed');
      if (def.post) data = def.post(data);
      noteOk();
      return data;
    } catch (e) {
      lastErr = e;
      noteFail(e.status);
      if (e.status && e.status !== 429 && e.status < 500) break; // 4xx that isn't quota: don't hammer
    }
  }
  throw lastErr;
}

function buildContents(route, body) {
  if (route === 'dialogue') {
    const hist = body.history.slice(-10); // server-side slice too — never trust the client
    return hist.map((h, i) => ({
      role: h.role === 'gem' ? 'model' : 'user',
      parts: [{
        text: h.role === 'gem' ? h.text
          : (i === hist.length - 1
            ? `[User said: "${h.text}" | Reminder: stay in character as Gem, max 3 sentences, end with one specific question]`
            : h.text),
      }],
    }));
  }
  return [{ role: 'user', parts: [{ text: ROUTES[route].user(body) }] }];
}

// ---------- fallbacks + cache ----------
const memCache = new Map(); // hash(route+body) -> data  (zero-latency rehearsed demo path)
function cacheKey(route, body) {
  return crypto.createHash('sha1').update(route + JSON.stringify(body)).digest('hex');
}
function readFallback(route) {
  for (const p of [path.join(FB_AUTO, `${route}.json`), path.join(FB_DIR, `${route}.json`)]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* try next */ }
  }
  return null;
}
function saveAuto(route, data) {
  try {
    fs.mkdirSync(FB_AUTO, { recursive: true });
    fs.writeFileSync(path.join(FB_AUTO, `${route}.json`), JSON.stringify(data, null, 2));
  } catch (e) { /* non-fatal */ }
}

// ---------- http ----------
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  // --- API ---
  if (url.pathname.startsWith('/api/')) {
    const route = url.pathname.slice(5);
    if (route === 'health') return sendJSON(res, 200, { ok: true, model: MODEL, keyed: !!KEY });
    if (!ROUTES[route]) return sendJSON(res, 404, { ok: false, error: 'unknown route' });
    if (req.method !== 'POST') return sendJSON(res, 405, { ok: false, error: 'POST only' });

    let body;
    try { body = JSON.parse(await readBody(req)); } catch (e) { return sendJSON(res, 400, { ok: false, error: 'bad json' }); }
    if (typeof body.text === 'string') body.text = body.text.slice(0, 5000); // hard clamp

    const v = ROUTES[route].validate ? ROUTES[route].validate(body) : true;
    if (v === 'insufficient_transcript') {
      return sendJSON(res, 200, { ok: false, error: 'insufficient_transcript', message: 'Not enough explanation captured to assess — try again with more detail.' });
    }
    if (v !== true) return sendJSON(res, 400, { ok: false, error: String(v) });

    const ck = cacheKey(route, body);
    if (memCache.has(ck)) return sendJSON(res, 200, { ok: true, source: 'cache', data: memCache.get(ck) });

    try {
      const data = await askGemini(route, body);
      memCache.set(ck, data);
      if (route !== 'dialogue') saveAuto(route, data); // refresh canned copy with every live success
      return sendJSON(res, 200, { ok: true, source: 'live', data });
    } catch (e) {
      if (!e.circuit) console.error(`[${route}] live call failed:`, e.status || '', e.message);
      let fb = readFallback(route);
      // dialogue fallback rotates through varied peer questions by turn, so offline Gem never repeats itself
      if (fb && route === 'dialogue' && Array.isArray(fb.replies)) {
        const userTurns = (body.history || []).filter(h => h.role === 'user').length;
        fb = { reply: fb.replies[Math.min(userTurns - 1, fb.replies.length - 1)] || fb.replies[0] };
      }
      if (fb) return sendJSON(res, 200, { ok: true, source: 'fallback', data: fb });
      return sendJSON(res, 200, { ok: false, error: 'unavailable', message: 'Gem needs a moment — try again in a few seconds.' });
    }
  }

  // --- static ---
  let file = path.normalize(path.join(PUB, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = ''; req.on('data', c => { s += c; if (s.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(s)); req.on('error', reject);
  });
}
function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const lan = Object.values(nets).flat().find(n => n && n.family === 'IPv4' && !n.internal);
  console.log(`Adapt running:
  local:  http://localhost:${PORT}
  LAN:    http://${lan ? lan.address : '?'}:${PORT}   <- point the phone/QR here (same wifi)`);
});
