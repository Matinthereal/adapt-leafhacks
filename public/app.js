/* ===== Adapt v2 — client logic (vanilla, event-delegated, zero deps) ===== */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LS = {
  get: (k, d) => { try { return localStorage.getItem('adapt.' + k) ?? d; } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem('adapt.' + k, v); } catch (e) {} },
  del: (k) => { try { localStorage.removeItem('adapt.' + k); } catch (e) {} },
};

/* ---------- status (live vs demo) ---------- */
function setStatus(kind, txt) {
  const dot = $('#statusDot'), t = $('#statusTxt');
  if (!dot) return;
  dot.className = 'dot ' + (kind || '');
  t.textContent = txt;
}
async function api(route, body) {
  try {
    const r = await fetch('/api/' + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.source === 'live') setStatus('live', 'Gemini · live');
    else if (j.source === 'fallback') setStatus('demo', 'demo mode');
    return j;
  } catch (e) { setStatus('demo', 'offline · demo mode'); return { ok: false, error: 'network' }; }
}
fetch('/api/health').then(r => r.json()).then(h => setStatus(h.keyed ? 'live' : 'demo', h.keyed ? 'Gemini · ready' : 'demo mode')).catch(() => setStatus('demo', 'offline'));

/* ---------- app mode (desktop assistant window) ---------- */
if (new URLSearchParams(location.search).has('app')) document.documentElement.classList.add('appmode');

/* ---------- display toolbar ---------- */
let scale = +LS.get('scale', 100);
const applyScale = () => { document.documentElement.style.setProperty('--user-scale', scale + '%'); LS.set('scale', scale); };
applyScale();
const applyFlag = (cls, key, btn) => {
  const on = LS.get(key, '0') === '1';
  document.documentElement.classList.toggle(cls, on);
  if (btn) btn.setAttribute('aria-pressed', on);
};
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  switch (b.id) {
    case 'btnTextUp': scale = Math.min(150, scale + 10); applyScale(); break;
    case 'btnTextDown': scale = Math.max(80, scale - 10); applyScale(); break;
    case 'btnDysFont': LS.set('dysfont', LS.get('dysfont', '0') === '1' ? '0' : '1'); applyFlag('dys-font', 'dysfont', b); break;
    case 'btnContrast': LS.set('contrast', LS.get('contrast', '0') === '1' ? '0' : '1'); applyFlag('hi-contrast', 'contrast', b); break;
  }
});
applyFlag('dys-font', 'dysfont', $('#btnDysFont'));
applyFlag('hi-contrast', 'contrast', $('#btnContrast'));

/* ---------- profile + panels ---------- */
const PANELS = ['onboard', 'reader', 'explain', 'teach'];
function showPanel(name) {
  PANELS.forEach(p => { const el = $('#panel-' + p); if (el) el.classList.toggle('active', p === name); });
  $$('.navbtn').forEach(n => n.setAttribute('aria-selected', String(n.dataset.tab === name)));
  LS.set('tab', name);
  window.scrollTo({ top: 0 });
}
function setProfile(p, { navigate = true } = {}) {
  LS.set('profile', p);
  document.documentElement.setAttribute('data-profile', p);
  $$('#profileChips .chip').forEach(c => {
    const on = c.dataset.p === p;
    c.setAttribute('aria-checked', String(on)); c.setAttribute('aria-pressed', String(on));
  });
  if (navigate) showPanel(LS.get('tab', 'reader') === 'onboard' ? 'reader' : LS.get('tab', 'reader'));
}
/* onboarding cards + sidebar chips + nav — one delegated handler */
document.addEventListener('click', e => {
  const card = e.target.closest('.pcard');
  if (card) { setProfile(card.dataset.p); return; }
  const chip = e.target.closest('#profileChips .chip');
  if (chip) { setProfile(chip.dataset.p, { navigate: false }); return; }
  const nav = e.target.closest('.navbtn');
  if (nav && nav.dataset.tab) { showPanel(nav.dataset.tab); return; }
});
/* boot: restore or onboard */
const savedProfile = LS.get('profile', null);
if (savedProfile) { setProfile(savedProfile, { navigate: false }); showPanel(LS.get('tab', 'reader')); }
else showPanel('onboard');

/* ---------- emphasis renderer ---------- */
let emphasisOn = LS.get('emph', '1') === '1';
const emphBtn = $('#btnEmph'); if (emphBtn) emphBtn.setAttribute('aria-pressed', emphasisOn);
function emphasize(text) {
  const frag = document.createDocumentFragment();
  String(text).split(/(\s+)/).forEach(tok => {
    if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
    const lead = tok.match(/^[^A-Za-z]*/)[0], trail = tok.match(/[^A-Za-z]*$/)[0];
    const core = tok.slice(lead.length, tok.length - (trail.length || 0));
    if (lead) frag.appendChild(document.createTextNode(lead));
    if (emphasisOn && core.length > 3) {
      const n = Math.ceil(core.length * 0.45);
      const b = document.createElement('strong'); b.className = 'em'; b.textContent = core.slice(0, n);
      const r = document.createElement('span'); r.className = 'dim'; r.textContent = core.slice(n);
      frag.append(b, r);
    } else frag.appendChild(document.createTextNode(core));
    if (trail) frag.appendChild(document.createTextNode(trail));
  });
  return frag;
}
document.addEventListener('click', e => {
  if (e.target.closest('#btnEmph')) {
    emphasisOn = !emphasisOn; LS.set('emph', emphasisOn ? '1' : '0');
    $('#btnEmph').setAttribute('aria-pressed', emphasisOn);
    if (lastReader) renderReader(lastReader);
  }
});

/* ---------- helpers ---------- */
function skeleton(el) { el.innerHTML = '<div class="skelrow" style="width:92%"></div><div class="skelrow" style="width:70%"></div><div class="skelrow"></div><div class="skelrow" style="width:64%"></div>'; }
function tagSource(el, src) { el.hidden = false; el.className = 'srcbadge' + (src === 'live' ? ' live' : ''); el.textContent = src === 'live' ? '● live · Gemini' : src === 'cache' ? 'cached' : 'offline demo'; }
function needText(ta, btn) { ta.focus(); ta.classList.add('shake'); btn.classList.add('shake'); setTimeout(() => { ta.classList.remove('shake'); btn.classList.remove('shake'); }, 500); }
function busy(btn, on, label) {
  if (on) { btn.dataset.label = btn.textContent; btn.innerHTML = '<span class="spin"></span> ' + label; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}
function attachFocusMode(container) {
  if ((LS.get('profile', '') !== 'adhd')) return;
  const ps = [...container.querySelectorAll('p, li')];
  const focus = t => ps.forEach(p => { p.style.opacity = p === t ? '1' : '.32'; p.style.filter = p === t ? 'none' : 'blur(.4px)'; });
  const clear = () => ps.forEach(p => { p.style.opacity = ''; p.style.filter = ''; });
  ps.forEach(p => { p.addEventListener('mouseenter', () => focus(p)); p.addEventListener('mouseleave', clear); p.addEventListener('touchstart', () => focus(p), { passive: true }); });
}
const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- READER ---------- */
let lastReader = null;
$('#srcText').addEventListener('input', e => {
  const over = e.target.value.length > 5000;
  $('#clampBanner').hidden = !over;
  if (over) e.target.value = e.target.value.slice(0, 5000);
});
$('#btnReader').addEventListener('click', async () => {
  const text = $('#srcText').value.trim();
  if (!text) return needText($('#srcText'), $('#btnReader'));
  const btn = $('#btnReader'); busy(btn, true, 'Adapting…');
  skeleton($('#readerOut')); $('#readerSrc').hidden = true;
  const r = await api('reader', { text, profile: LS.get('profile', 'classic') });
  busy(btn, false);
  if (!r.ok) { $('#readerOut').innerHTML = `<div class="empty"><span class="big">😴</span>${escapeHtml(r.message || 'Could not adapt this right now — try again in a moment.')}</div>`; return; }
  lastReader = r.data; tagSource($('#readerSrc'), r.source); renderReader(r.data);
});
function renderReader(data) {
  const out = $('#readerOut'); out.innerHTML = '';
  (data.chunks || []).forEach(ch => { const p = document.createElement('p'); p.className = 'chunk'; p.appendChild(emphasize(ch)); out.appendChild(p); });
  if (data.flagged_terms && data.flagged_terms.length) {
    const t = document.createElement('p'); t.className = 'hint'; t.style.marginTop = '.8rem';
    t.textContent = 'Kept as-is: ' + data.flagged_terms.join(', ');
    out.appendChild(t);
  }
  attachFocusMode(out);
}

/* ---------- EXPLAIN ---------- */
let explainStyle = 'analogy';
$('#styleSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#styleSeg button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true'); explainStyle = b.dataset.s;
});
$('#btnExplain').addEventListener('click', async () => {
  const text = $('#expText').value.trim();
  if (!text) return needText($('#expText'), $('#btnExplain'));
  const btn = $('#btnExplain'); busy(btn, true, 'Thinking…');
  skeleton($('#explainOut')); $('#explainSrc').hidden = true;
  const r = await api('explain', { text: text.slice(0, 5000), style: explainStyle, profile: LS.get('profile', 'classic') });
  busy(btn, false);
  if (!r.ok) { $('#explainOut').innerHTML = `<div class="empty"><span class="big">😴</span>${escapeHtml(r.message || 'Could not explain this right now.')}</div>`; return; }
  tagSource($('#explainSrc'), r.source);
  const out = $('#explainOut'); out.innerHTML = '';
  const d = r.data;
  if (d.core_idea_summary) { const h = document.createElement('h3'); h.style.marginBottom = '.6rem'; h.textContent = d.core_idea_summary; out.appendChild(h); }
  if (d.style_used === 'step_by_step') {
    const ol = document.createElement('ol'); ol.style.paddingLeft = '1.3rem';
    (d.explanation || []).forEach(s => { const li = document.createElement('li'); li.style.marginBottom = '.6rem'; li.appendChild(emphasize(s)); ol.appendChild(li); });
    out.appendChild(ol);
  } else (d.explanation || []).forEach(par => { const p = document.createElement('p'); p.appendChild(emphasize(par)); out.appendChild(p); });
  attachFocusMode(out);
});

/* ---------- TEACH IT BACK ---------- */
const MAX_TURNS = 10, MIN_TURNS_TO_FINISH = 2;
let ttsOn = true, history = [], turn = 0, finalized = false, refConcept = '', topic = '', inflight = false;

function speak(text) {
  if (!ttsOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = LS.get('profile', '') === 'dyslexia' ? 0.9 : 1.0; u.pitch = 1.05; u.lang = 'en-GB';
    speechSynthesis.speak(u);
  } catch (e) {}
}
function updateTurn() {
  $('#turnCount').textContent = `Turn ${turn} / ${MAX_TURNS}`;
  $('#turnFill').style.width = (turn / MAX_TURNS * 100) + '%';
  const fin = $('#btnFinalize');
  const ready = turn >= MIN_TURNS_TO_FINISH;
  fin.disabled = !ready;
  fin.title = ready ? '' : 'Teach Gem a little more first';
}
function bubble(role, text) {
  const chat = $('#chat');
  if (role === 'gem') {
    const row = document.createElement('div'); row.className = 'gemrow';
    row.innerHTML = '<div class="avatar" aria-hidden="true">🤔</div>';
    const d = document.createElement('div'); d.className = 'msg gem'; d.appendChild(document.createTextNode(text));
    row.appendChild(d); chat.appendChild(row);
  } else {
    const d = document.createElement('div'); d.className = 'msg user'; d.appendChild(document.createTextNode(text)); chat.appendChild(d);
  }
  chat.scrollTop = chat.scrollHeight;
}
function pushGem(text) {
  history.push({ role: 'gem', text }); bubble('gem', text); speak(text);
  if (/Let's pause here and see what we mapped out/i.test(text)) {
    $('#btnFinalize').disabled = false;
    $('#btnFinalize').classList.remove('ghost');
    $('#btnFinalize').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function startSession() {
  topic = $('#topicInput').value.trim() || 'this concept';
  refConcept = $('#refText').value.trim();
  history = []; turn = 0; finalized = false;
  $('#teachSetup').hidden = true; $('#teachStage').hidden = false; $('#report').hidden = true;
  $('#chat').innerHTML = '';
  $('#btnFinalize').classList.add('ghost');
  updateTurn();
  pushGem(`Oh nice — you're going to teach me about ${topic}? I don't really know it yet. Start me off with the basics — what is it, in your own words?`);
  $('#teachInput').focus();
}
$('#btnStartTeach').addEventListener('click', startSession);
$('#topicInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); startSession(); } });
$('#btnRestartTeach').addEventListener('click', () => { speechSynthesis?.cancel?.(); $('#teachStage').hidden = true; $('#teachSetup').hidden = false; $('#report').hidden = true; });
$('#btnTTS').addEventListener('click', e => { ttsOn = !ttsOn; e.currentTarget.setAttribute('aria-pressed', ttsOn); if (!ttsOn) try { speechSynthesis.cancel(); } catch (err) {} });

async function sendTurn() {
  const ta = $('#teachInput');
  const val = ta.value.trim();
  if (finalized || inflight) return;              // busy — Send is disabled + shows a spinner, never a dead click
  if (!val) return needText(ta, $('#btnSend'));
  ta.value = ''; autoGrow();
  history.push({ role: 'user', text: val }); bubble('user', val);
  turn++; updateTurn();

  if (turn >= MAX_TURNS) {
    pushGem("Wow, I think I finally get the big picture of how this fits together! Let's pause here and see what we mapped out.");
    return;
  }
  inflight = true;
  const send = $('#btnSend'); send.disabled = true; send.dataset.label = send.textContent; send.innerHTML = '<span class="spin"></span>';
  const typing = document.createElement('div'); typing.className = 'typing'; typing.innerHTML = '<i></i><i></i><i></i>';
  $('#chat').appendChild(typing); $('#chat').scrollTop = $('#chat').scrollHeight;
  const r = await api('dialogue', { history, profile: LS.get('profile', 'classic') });
  typing.remove(); inflight = false;
  send.disabled = false; send.textContent = send.dataset.label || 'Send';
  pushGem(r.ok ? r.data.reply : "Hmm, my brain glitched for a second — say that part again?");
  ta.focus();
}
$('#btnSend').addEventListener('click', sendTurn);
const grow = $('#teachInput');
function autoGrow() { grow.style.height = 'auto'; grow.style.height = Math.min(130, grow.scrollHeight) + 'px'; }
grow.addEventListener('input', autoGrow);
grow.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTurn(); } });

/* ---- voice: record → transcribe via our Gemini key (works through VPNs / filtered
   networks, unlike the browser's Web Speech which needs Google's servers). Typed input
   is always the primary path. ---- */
const micBtn = $('#btnMic');
let mediaRec = null, audioChunks = [], recording = false, recStream = null, recTimer = null;
// getUserMedia needs a secure context: https OR localhost. A phone on the LAN over plain
// http can't record — detect and say so, so typing is obviously the path there.
const secureCtx = window.isSecureContext || ['localhost', '127.0.0.1'].includes(location.hostname);

function micStatus(msg, isError) {
  const el = $('#micStatus'); if (!el) return;
  el.textContent = msg || '';
  el.style.color = isError ? 'var(--bad)' : 'var(--muted)';
}
function micUnavailable() {
  if (!navigator.mediaDevices || !window.MediaRecorder) return 'Voice needs a modern browser — just type your answer instead.';
  if (!secureCtx) return 'Voice recording needs a secure link. On the laptop open http://localhost:3000; on a phone, just type here.';
  return null;
}
(function initMic() {
  const why = micUnavailable();
  if (why) { micBtn.style.opacity = '.45'; micBtn.title = why; }
})();

function blobToB64(blob) {
  return new Promise(res => { const fr = new FileReader(); fr.onloadend = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(blob); });
}
function stopRec() {
  if (!recording) return;
  recording = false; clearTimeout(recTimer);
  micBtn.classList.remove('rec'); micBtn.setAttribute('aria-pressed', 'false');
  try { mediaRec && mediaRec.state !== 'inactive' && mediaRec.stop(); } catch (e) {}
}
async function onStopRec() {
  try { recStream && recStream.getTracks().forEach(t => t.stop()); } catch (e) {}
  if (!audioChunks.length) { micStatus('Didn’t catch anything — tap the mic and try again, or type.', true); return; }
  const blob = new Blob(audioChunks, { type: (mediaRec && mediaRec.mimeType) || 'audio/webm' });
  micStatus('⏳ Transcribing your answer…');
  const b64 = await blobToB64(blob);
  const r = await api('transcribe', { audio: b64, mime: blob.type || 'audio/webm' });
  if (r.ok && r.text) {
    const cur = $('#teachInput').value.trim();
    $('#teachInput').value = (cur ? cur + ' ' : '') + r.text; autoGrow();
    micStatus('✓ Got it — edit if you like, then Send.');
    $('#teachInput').focus();
  } else {
    micStatus(r.message || 'Couldn’t transcribe that — just type your answer instead.', true);
  }
}
micBtn.addEventListener('click', async () => {
  const why = micUnavailable();
  if (why) { micStatus(why, true); $('#teachInput').focus(); return; }
  if (recording) { micStatus('⏳ Finishing up…'); stopRec(); return; }
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    micStatus('Microphone blocked. Click the padlock in the address bar → allow the mic, then try again — or just type.', true);
    return;
  }
  audioChunks = [];
  const pref = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  const mime = pref.find(t => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  try {
    mediaRec = new MediaRecorder(recStream, mime ? { mimeType: mime } : undefined);
  } catch (e) { mediaRec = new MediaRecorder(recStream); }
  mediaRec.ondataavailable = e => { if (e.data && e.data.size) audioChunks.push(e.data); };
  mediaRec.onstop = onStopRec;
  mediaRec.start();
  recording = true; micBtn.classList.add('rec'); micBtn.setAttribute('aria-pressed', 'true');
  micStatus('🔴 Recording… tap the mic again when you’re done.');
  recTimer = setTimeout(() => recording && stopRec(), 45000); // hard cap 45s
});

/* ---- finalize → wow report ---- */
$('#btnFinalize').addEventListener('click', async () => {
  if (finalized) return;
  try { speechSynthesis.cancel(); } catch (e) {}
  const btn = $('#btnFinalize'); busy(btn, true, 'Mapping your understanding…');
  const transcript = history.map((h, i) => ({ turn_index: i, role: h.role === 'gem' ? 'gem' : 'user', text: h.text }));
  const r = await api('finalize', { transcript, reference_concept: refConcept || topic, profile: LS.get('profile', 'classic') });
  busy(btn, false);
  if (r.error === 'insufficient_transcript') { pushGem(r.message); return; }
  if (!r.ok) { pushGem(r.message || 'I lost my notes for a second — press the map button again?'); return; }
  finalized = true;
  renderReport(r.data, transcript);
});
$('#btnTeachAgain')?.addEventListener('click', () => { $('#report').hidden = true; startSession(); });
$('#btnNewTopic')?.addEventListener('click', () => { $('#topicInput').value = ''; $('#refText').value = ''; $('#report').hidden = true; $('#teachStage').hidden = true; $('#teachSetup').hidden = false; $('#topicInput').focus(); });

function renderReport(d, transcript) {
  const rep = $('#report'); rep.hidden = false;
  const score = Math.max(0, Math.min(100, d.understanding_score || 0));
  const color = score >= 80 ? 'var(--good)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
  const C = 2 * Math.PI * 52;
  const arc = $('#ringArc'); arc.style.stroke = color;
  arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C;
  let cur = 0;
  const tick = () => { cur += Math.max(1, Math.round((score - cur) / 6)); if (cur > score) cur = score; $('#ringNum').textContent = cur; arc.style.strokeDashoffset = C * (1 - cur / 100); if (cur < score) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);

  const bench = d.benchmark === 'reference_text' ? 'checked against your source text' : 'judged on clarity and consistency';
  const arrow = d.trend === 'improving' ? '↗ getting clearer as you went' : d.trend === 'declining' ? '↘ drifted a little' : '→ steady throughout';
  $('#trendLine').textContent = `${arrow} · ${bench}`;

  const sp = $('#strengthPills'); sp.innerHTML = '';
  (d.strengths || []).forEach(s => { const el = document.createElement('span'); el.className = 'pill'; el.textContent = '✓ ' + s; sp.appendChild(el); });
  if (!(d.strengths || []).length) sp.innerHTML = '<span class="hint">Teach a bit more and strengths will show here.</span>';

  const gl = $('#gapList'); gl.innerHTML = '';
  (d.gaps || []).forEach(g => {
    const card = document.createElement('div'); card.className = 'gapcard';
    card.innerHTML = `
      <button class="gaphead" aria-expanded="false"><span class="gdot"></span><span>${escapeHtml(g.missing_point)}</span><span class="chev">▾</span></button>
      <div class="gapbody"><div><div class="inner"><div class="peer-hint"><span>💬</span><span>${escapeHtml(g.peer_hint)}</span></div></div></div></div>`;
    card.querySelector('.gaphead').addEventListener('click', () => {
      const open = card.classList.toggle('open');
      card.querySelector('.gaphead').setAttribute('aria-expanded', open);
    });
    gl.appendChild(card);
  });
  if (!(d.gaps || []).length) gl.innerHTML = '<div class="empty"><span class="big">🌟</span>No clear gaps — you covered it well.</div>';

  const fl = $('#followList'); fl.innerHTML = '';
  (d.follow_up_questions || []).forEach(q => { const li = document.createElement('li'); li.textContent = q; fl.appendChild(li); });

  const imp = $('#improved'); imp.innerHTML = '';
  (d.improved_explanation || []).forEach(sec => {
    const wrap = document.createElement('div'); wrap.className = 'imp-sec';
    const h = document.createElement('h4'); h.textContent = sec.section_heading; wrap.appendChild(h);
    (sec.content_paragraphs || []).forEach(par => { const p = document.createElement('p'); p.appendChild(emphasize(par)); wrap.appendChild(p); });
    imp.appendChild(wrap);
  });

  const gapTurns = new Set((d.gaps || []).map(g => g.turn_index));
  const tr = $('#transcript'); tr.innerHTML = '';
  transcript.forEach(t => {
    const el = document.createElement('div'); el.className = 't-turn';
    el.innerHTML = `<b>${t.role === 'gem' ? 'Gem' : 'You'}:</b> ${escapeHtml(t.text)}` + (gapTurns.has(t.turn_index) ? '<span class="gapbadge">GAP HERE</span>' : '');
    tr.appendChild(el);
  });

  attachFocusMode(imp);
  rep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
