const puppeteer = require('puppeteer-core');
const SHOT = '/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad';
const FILE = 'file://' + require('path').join(__dirname, '..', 'demo', 'advert-script.html');
const errs = [];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
    userDataDir: SHOT + '/chrome-page', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-device-scale-factor=1'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 900 });
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
  await p.goto(FILE, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  // force all reveals visible + disable smooth scroll so captures land precisely
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); });
  await new Promise(r => setTimeout(r, 300));
  const H = await p.evaluate(() => document.body.scrollHeight);
  const counts = await p.evaluate(() => ({
    beats: document.querySelectorAll('.beat').length,
    voParas: document.querySelectorAll('#vo p').length,
    shots: document.querySelectorAll('#shots tr').length,
    wins: document.querySelectorAll('.win').length,
    turn1: document.getElementById('turn1').textContent.length,
  }));
  // hero
  await p.screenshot({ path: SHOT + '/pg-hero.png' });
  // timeline top: scroll to first beat
  await p.evaluate(() => document.getElementById('timeline').scrollIntoView());
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: SHOT + '/pg-beats.png' });
  // teleprompter + demo
  await p.evaluate(() => document.getElementById('vo').scrollIntoView());
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: SHOT + '/pg-vo.png' });
  // wins
  await p.evaluate(() => document.getElementById('wins').scrollIntoView());
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: SHOT + '/pg-wins.png' });
  await b.close();
  console.log('page height:', H, '| counts:', JSON.stringify(counts), '| JS errors:', errs.length ? errs : 'none');
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
