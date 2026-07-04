/* ===== Adapt — client logic (vanilla, zero deps) ===== */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get profile() { return localStorage.getItem('adapt.profile') || null; },
  set profile(v) { v ? localStorage.setItem('adapt.profile', v) : localStorage.removeItem('adapt.profile'); },
};

async function api(route, body) {
  try {
    const r = await fetch('/api/' + route, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) { return { ok: false, error: 'network' }; }
}

/* ---------- accessibility toolbar ---------- */
let scale = +(localStorage.getItem('adapt.scale') || 100);
function applyScale() { document.documentElement.style.setProperty('--user-scale', scale + '%'); localStorage.setItem('adapt.scale', scale); }
applyScale();
$('#btnTextUp').onclick = () => { scale = Math.min(150, scale + 10); applyScale(); };
$('#btnTextDown').onclick = () => { scale = Math.max(80, scale - 10); applyScale(); };
$('#btnDysFont').onclick = e => { const on = document.body.classList.toggle('dys-font'); e.currentTarget.setAttribute('aria-pressed', on); };
$('#btnContrast').onclick = e => { const on = document.body.classList.toggle('hi-contrast'); e.currentTarget.setAttribute('aria-pressed', on); };
$('#btnReset').onclick = () => { store.profile = null; location.reload(); };

/* ---------- profile picker ---------- */
function setProfile(p) {
  store.profile = p;
  document.documentElement.setAttribute('data-profile', p);
  $('#pickPanel').classList.remove('active');
  $('#pickPanel').hidden = true;
  $('#workspace').hidden = false;
  if (window.innerWidth <= 760) { $('#wiznav').hidden = false; showStep(0); }
}
$$('.pcard').forEach(c => c.onclick = () => {
  $$('.pcard').forEach(x => x.setAttribute('aria-checked', 'false'));
  c.setAttribute('aria-checked', 'true');
  setTimeout(() => setProfile(c.dataset.p), 160);
});
if (store.profile) setProfile(store.profile);

/* ---------- tabs / mobile wizard ---------- */
const TABS = ['reader', 'explain', 'teach'];
function selectTab(name) {
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name));
  $$('#workspace > .panel, #workspace [id^="tab-"]').forEach(p => p.classList.remove('active'));
  $('#tab-' + name).classList.add('active');
}
$$('.tab').forEach(t => t.onclick = () => selectTab(t.dataset.tab));
let step = 0;
function showStep(i) { step = Math.max(0, Math.min(2, i)); selectTab(TABS[step]); $('#wizPrev').style.visibility = step ? 'visible' : 'hidden'; $('#wizNext').textContent = step === 2 ? 'Done' : 'Next →'; }
$('#wizNext').onclick = () => showStep(step + 1);
$('#wizPrev').onclick = () => showStep(step - 1);

/* ---------- emphasis renderer (word-anchor bolding; never "Bionic Reading") ---------- */
let emphasisOn = true;
$('#btnEmph').onclick = e => { emphasisOn = !emphasisOn; e.currentTarget.setAttribute('aria-pressed', emphasisOn); renderReader(lastReader); };
function emphasize(text) {
  const frag = document.createDocumentFragment();
  text.split(/(\s+)/).forEach(tok => {
    if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
    const lead = tok.match(/^[^A-Za-z]*/)[0], trail = tok.match(/[^A-Za-z]*$/)[0];
    const core = tok.slice(lead.length, tok.length - trail.length);
    if (lead) frag.appendChild(document.createTextNode(lead));
    if (emphasisOn && core.length > 3) {
      const n = Math.ceil(core.length * 0.45);
      const b = document.createElement('strong'); b.className = 'em'; b.textContent = core.slice(0, n);
      const rest = document.createElement('span'); rest.className = 'dim'; rest.textContent = core.slice(n);
      frag.appendChild(b); frag.appendChild(rest);
    } else frag.appendChild(document.createTextNode(core));
    if (trail) frag.appendChild(document.createTextNode(trail));
  });
  return frag;
}

/* ---------- text clamp ---------- */
$('#srcText').addEventListener('input', e => {
  const over = e.target.value.length > 5000;
  $('#clampBanner').hidden = !over;
  if (over) e.target.value = e.target.value.slice(0, 5000);
});

function skeleton(el) { el.innerHTML = '<div class="skel w90"></div><div class="skel w70"></div><div class="skel"></div><div class="skel w70"></div>'; }
function tagSource(el, src) { el.hidden = false; el.textContent = src === 'live' ? 'live · Gemini' : src === 'cache' ? 'cached' : 'offline demo'; }

/* ---------- READER ---------- */
let lastReader = null;
$('#btnReader').onclick = async () => {
  const text = $('#srcText').value.trim();
  if (!text) { $('#srcText').focus(); return; }
  skeleton($('#readerOut')); $('#readerSrc').hidden = true;
  const r = await api('reader', { text, profile: store.profile });
  if (!r.ok) { $('#readerOut').innerHTML = `<p class="hint">${r.message || 'Could not adapt this right now — try again in a moment.'}</p>`; return; }
  lastReader = r.data; tagSource($('#readerSrc'), r.source); renderReader(r.data);
};
function renderReader(data) {
  if (!data) return;
  const out = $('#readerOut'); out.innerHTML = '';
  const terms = new Set((data.flagged_terms || []).map(t => t.toLowerCase()));
  data.chunks.forEach(ch => {
    const p = document.createElement('p'); p.className = 'chunk';
    p.appendChild(emphasize(ch));
    out.appendChild(p);
  });
  if (terms.size) {
    out.querySelectorAll('.dim, strong.em, .chunk').forEach(() => {}); // (kept simple; terms shown as chips)
    const chip = document.createElement('p'); chip.className = 'hint';
    chip.textContent = 'Kept as-is: ' + [...terms].join(', ');
    out.appendChild(chip);
  }
  attachFocusMode(out);
}
/* ADHD focus-dimming on hover/tap (not IntersectionObserver) */
function attachFocusMode(container) {
  if (store.profile !== 'adhd') return;
  const ps = [...container.querySelectorAll('p')];
  const focus = t => ps.forEach(p => { p.style.opacity = p === t ? '1' : '.3'; p.style.filter = p === t ? 'none' : 'blur(.4px)'; });
  const clear = () => ps.forEach(p => { p.style.opacity = ''; p.style.filter = ''; });
  ps.forEach(p => { p.onmouseenter = () => focus(p); p.onmouseleave = clear; p.ontouchstart = () => focus(p); });
}

/* ---------- EXPLAIN ---------- */
let explainStyle = 'analogy';
$$('#styleSeg button').forEach(b => b.onclick = () => {
  $$('#styleSeg button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true'); explainStyle = b.dataset.s;
});
$('#btnExplain').onclick = async () => {
  const text = $('#expText').value.trim();
  if (!text) { $('#expText').focus(); return; }
  skeleton($('#explainOut')); $('#explainSrc').hidden = true;
  const r = await api('explain', { text: text.slice(0, 5000), style: explainStyle, profile: store.profile });
  if (!r.ok) { $('#explainOut').innerHTML = `<p class="hint">${r.message || 'Could not explain this right now.'}</p>`; return; }
  tagSource($('#explainSrc'), r.source);
  const out = $('#explainOut'); out.innerHTML = '';
  const d = r.data;
  if (d.core_idea_summary) { const h = document.createElement('h3'); h.textContent = d.core_idea_summary; out.appendChild(h); }
  if (d.style_used === 'step_by_step') {
    const ol = document.createElement('ol'); ol.style.paddingLeft = '1.3rem';
    d.explanation.forEach(s => { const li = document.createElement('li'); li.style.marginBottom = '.6rem'; li.appendChild(emphasize(s)); ol.appendChild(li); });
    out.appendChild(ol);
  } else {
    d.explanation.forEach(par => { const p = document.createElement('p'); p.appendChild(emphasize(par)); out.appendChild(p); });
  }
  attachFocusMode(out);
};

/* ---------- TEACH IT BACK ---------- */
let ttsOn = true, history = [], turn = 0, finalized = false, refConcept = '', topic = '';
const MAX_TURNS = 10;
$('#btnTTS').onclick = e => { ttsOn = !ttsOn; e.currentTarget.setAttribute('aria-pressed', ttsOn); if (!ttsOn) speechSynthesis.cancel(); };

$('#btnStartTeach').onclick = () => {
  topic = $('#topicInput').value.trim() || 'this concept';
  refConcept = $('#refText').value.trim();
  history = []; turn = 0; finalized = false;
  $('#teachStage').hidden = false; $('#report').classList.remove('on');
  $('#chat').innerHTML = ''; $('#btnFinalize').hidden = true;
  updateTurn();
  pushGem(`Oh nice — you're going to teach me about ${topic}? I don't really know it yet. Start me off with the basics — what is it, in your own words?`);
  $('#teachInput').focus();
};
function updateTurn() {
  $('#turnCount').textContent = `Turn ${turn} / ${MAX_TURNS}`;
  $('#turnFill').style.width = (turn / MAX_TURNS * 100) + '%';
}
function bubble(role, text) {
  const d = document.createElement('div'); d.className = 'msg ' + role;
  if (role === 'gem') { const w = document.createElement('div'); w.className = 'who'; w.textContent = 'GEM'; d.appendChild(w); }
  d.appendChild(document.createTextNode(text));
  $('#chat').appendChild(d); $('#chat').scrollTop = $('#chat').scrollHeight;
  return d;
}
function pushGem(text) {
  history.push({ role: 'gem', text }); bubble('gem', text);
  if (ttsOn) speak(text);
  // termination line → reveal finalize
  if (/Let's pause here and see what we mapped out/i.test(text) || turn >= MAX_TURNS) {
    $('#btnFinalize').hidden = false;
    $('#btnFinalize').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = store.profile === 'dyslexia' ? 0.9 : 1.0; u.pitch = 1.05;
    speechSynthesis.speak(u);
  } catch (e) {}
}

async function sendTurn() {
  const val = $('#teachInput').value.trim();
  if (!val || finalized) return;
  $('#teachInput').value = ''; autoGrow();
  history.push({ role: 'user', text: val }); bubble('user', val);
  turn++; updateTurn();

  const typing = document.createElement('div'); typing.className = 'gem-typing'; typing.textContent = 'Gem is thinking…';
  $('#chat').appendChild(typing); $('#chat').scrollTop = $('#chat').scrollHeight;

  // hard cap: force the termination line client-side
  if (turn >= MAX_TURNS) {
    typing.remove();
    pushGem("Wow, I think I finally get the big picture of how this fits together! Let's pause here and see what we mapped out.");
    return;
  }
  const r = await api('dialogue', { history, profile: store.profile });
  typing.remove();
  if (!r.ok) { pushGem("Hmm, my brain glitched for a second — say that part again?"); return; }
  pushGem(r.data.reply);
}
$('#btnSend').onclick = sendTurn;
const grow = $('#teachInput');
function autoGrow() { grow.style.height = 'auto'; grow.style.height = Math.min(120, grow.scrollHeight) + 'px'; }
grow.addEventListener('input', autoGrow);
grow.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTurn(); } });

/* ---- Web Speech voice (bonus layer; typed is primary) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, recording = false;
$('#btnMic').onclick = () => {
  if (!SR) { $('#teachInput').placeholder = 'Voice not supported in this browser — just type here.'; $('#teachInput').focus(); return; }
  if (recording) { stopRec(); return; }
  try {
    recog = new SR(); recog.lang = 'en-GB'; recog.interimResults = true; recog.continuous = true;
    let finalT = '';
    recog.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalT += t + ' '; else interim += t;
      }
      $('#teachInput').value = (finalT + interim).trim(); autoGrow();
    };
    recog.onerror = () => stopRec();
    recog.onend = () => { if (recording) stopRec(); };
    recog.start(); recording = true;
    $('#btnMic').classList.add('rec'); $('#wave').classList.add('on');
  } catch (e) { $('#teachInput').focus(); }
};
function stopRec() { recording = false; try { recog && recog.stop(); } catch (e) {} $('#btnMic').classList.remove('rec'); $('#wave').classList.remove('on'); }
// simulated waveform bars (CSS only — no AudioContext, safe on iOS/stage)
(() => { const w = $('#wave'); for (let i = 0; i < 16; i++) { const b = document.createElement('i'); b.style.animationDelay = (i * 0.05) + 's'; w.appendChild(b); } })();
// spacebar toggles record when mic focused
$('#btnMic').addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); $('#btnMic').click(); } });

/* ---- FINALIZE → wow report ---- */
$('#btnFinalize').onclick = async () => {
  finalized = true; speechSynthesis.cancel();
  const transcript = history.map((h, i) => ({ turn_index: i, role: h.role === 'gem' ? 'gem' : 'user', text: h.text }));
  $('#btnFinalize').textContent = 'Mapping…'; $('#btnFinalize').disabled = true;
  const r = await api('finalize', { transcript, reference_concept: refConcept || topic, profile: store.profile });
  $('#btnFinalize').textContent = 'See what we mapped out →'; $('#btnFinalize').disabled = false;
  if (r.error === 'insufficient_transcript') { alert(r.message); finalized = false; return; }
  if (!r.ok) { alert(r.message || 'Could not build the report — try again.'); finalized = false; return; }
  renderReport(r.data, transcript);
};

function renderReport(d, transcript) {
  const rep = $('#report'); rep.classList.add('on');
  // score ring
  const score = Math.max(0, Math.min(100, d.understanding_score || 0));
  const color = score >= 80 ? 'var(--emerald)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const C = 2 * Math.PI * 52;
  const arc = $('#ringArc');
  arc.style.stroke = color;
  let cur = 0; const tick = () => { cur += Math.max(1, Math.round((score - cur) / 6)); if (cur > score) cur = score; $('#ringNum').textContent = cur; arc.style.strokeDashoffset = C * (1 - cur / 100); if (cur < score) requestAnimationFrame(tick); };
  arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C; requestAnimationFrame(tick);
  $('#ringNum').setAttribute('fill', 'var(--text)');
  // trend + benchmark
  const bench = d.benchmark === 'reference_text' ? 'checked against your source text' : 'judged on how clear and consistent your explanation was';
  const arrow = d.trend === 'improving' ? '↗ getting clearer' : d.trend === 'declining' ? '↘ drifted a bit' : '→ steady';
  $('#trendLine').textContent = `${arrow} · ${bench}`;
  // strengths
  const sp = $('#strengthPills'); sp.innerHTML = '';
  (d.strengths || []).forEach(s => { const el = document.createElement('span'); el.className = 'pill good'; el.textContent = '✓ ' + s; sp.appendChild(el); });
  if (!(d.strengths || []).length) { const el = document.createElement('span'); el.className = 'hint'; el.textContent = 'Teach a bit more and strengths will show here.'; sp.appendChild(el); }
  // gaps
  const gl = $('#gapList'); gl.innerHTML = '';
  (d.gaps || []).forEach((g, i) => {
    const card = document.createElement('div'); card.className = 'gapcard';
    const head = document.createElement('button'); head.className = 'gaphead'; head.setAttribute('aria-expanded', 'false');
    head.innerHTML = `<span style="display:flex;gap:.5rem;align-items:center;"><span class="dot"></span>${escapeHtml(g.missing_point)}</span><span>＋</span>`;
    const body = document.createElement('div'); body.className = 'gapbody';
    const inner = document.createElement('div'); inner.className = 'inner';
    inner.innerHTML = `<div class="peer-hint">💬 ${escapeHtml(g.peer_hint)}</div>`;
    body.appendChild(inner); card.appendChild(head); card.appendChild(body);
    head.onclick = () => { const open = body.classList.toggle('open'); head.setAttribute('aria-expanded', open); head.querySelector('span:last-child').textContent = open ? '−' : '＋'; };
    gl.appendChild(card);
  });
  if (!(d.gaps || []).length) { gl.innerHTML = '<p class="hint">No clear gaps — you covered it well.</p>'; }
  // follow-ups
  const fl = $('#followList'); fl.innerHTML = '';
  (d.follow_up_questions || []).forEach(q => { const li = document.createElement('li'); li.style.marginBottom = '.4rem'; li.textContent = q; fl.appendChild(li); });
  // improved explanation
  const imp = $('#improved'); imp.innerHTML = '';
  (d.improved_explanation || []).forEach(sec => {
    const wrap = document.createElement('div'); wrap.className = 'imp-sec';
    const h = document.createElement('h4'); h.textContent = sec.section_heading; wrap.appendChild(h);
    (sec.content_paragraphs || []).forEach(par => { const p = document.createElement('p'); p.appendChild(emphasize(par)); wrap.appendChild(p); });
    imp.appendChild(wrap);
  });
  // transcript with gap badges at turn_index
  const gapTurns = {}; (d.gaps || []).forEach(g => gapTurns[g.turn_index] = true);
  const tr = $('#transcript'); tr.innerHTML = '';
  transcript.forEach(t => {
    const el = document.createElement('div'); el.className = 't-turn';
    el.innerHTML = `<b>${t.role === 'gem' ? 'Gem' : 'You'}:</b> ${escapeHtml(t.text)}` + (gapTurns[t.turn_index] ? '<span class="gapbadge">gap here</span>' : '');
    tr.appendChild(el);
  });
  rep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* health ping (dev aid) */
fetch('/api/health').then(r => r.json()).then(h => console.log('Adapt API:', h)).catch(() => {});
