// End-to-end UI driver: profile -> teach-it-back -> finalize -> assert wow report.
// Uses in-page clicks (evaluate) to bypass any fixed-overlay hit-testing.
const puppeteer = require('puppeteer-core');
const SHOT = '/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad';
const VP = process.argv[2] === 'mobile' ? { width: 430, height: 900 } : { width: 1280, height: 900 };
const errors = [];
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
const setVal = (page, sel, v) => page.evaluate((s, val) => { const el = document.querySelector(s); el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, sel, v);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    dumpio: true,
    userDataDir: SHOT + '/chrome-profile',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(VP);
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  await click(page, '.pcard[data-p="adhd"]'); await wait(400);
  console.log('workspace shown:', await page.evaluate(() => !document.getElementById('workspace').hidden));

  await page.evaluate(() => [...document.querySelectorAll('.tab')].find(x => x.dataset.tab === 'teach').click()); await wait(200);
  await setVal(page, '#topicInput', 'Photosynthesis');
  await click(page, '#btnStartTeach'); await wait(400);
  console.log('stage open:', await page.evaluate(() => !document.getElementById('teachStage').hidden), '| gem greeted:', await page.evaluate(() => !!document.querySelector('.msg.gem')));

  for (const line of [
    'Photosynthesis is how plants make food from water and carbon dioxide using sunlight to make glucose and oxygen',
    'The glucose is the food and the oxygen is released into the air through the leaves',
  ]) {
    await setVal(page, '#teachInput', line);
    await click(page, '#btnSend');
    await wait(1000);
  }
  console.log('turn counter:', await page.evaluate(() => document.getElementById('turnCount').textContent),
    '| total msgs:', await page.evaluate(() => document.querySelectorAll('.msg').length));

  await page.evaluate(() => { document.getElementById('btnFinalize').hidden = false; });
  await click(page, '#btnFinalize'); await wait(1500);

  const report = await page.evaluate(() => ({
    on: document.getElementById('report').classList.contains('on'),
    score: document.getElementById('ringNum').textContent,
    strengths: document.querySelectorAll('#strengthPills .pill').length,
    gaps: document.querySelectorAll('.gapcard').length,
    follow: document.querySelectorAll('#followList li').length,
    improved: document.querySelectorAll('#improved .imp-sec').length,
    badges: document.querySelectorAll('.gapbadge').length,
  }));
  console.log('REPORT:', JSON.stringify(report));

  await page.evaluate(() => { const h = document.querySelector('.gaphead'); if (h) h.click(); }); await wait(400);
  const gapOpen = await page.evaluate(() => { const b = document.querySelector('.gapbody'); return !!(b && b.classList.contains('open')); });
  console.log('gap card expands:', gapOpen);
  await page.screenshot({ path: SHOT + '/adapt-report.png', fullPage: true });

  await page.evaluate(() => [...document.querySelectorAll('.tab')].find(x => x.dataset.tab === 'reader').click());
  await setVal(page, '#srcText', 'Test paragraph about anything at all here to adapt.');
  await click(page, '#btnReader'); await wait(900);
  const readerChunks = await page.evaluate(() => document.querySelectorAll('#readerOut .chunk').length);
  console.log('reader chunks:', readerChunks);
  await page.screenshot({ path: SHOT + '/adapt-reader.png', fullPage: true });

  // explain
  await page.evaluate(() => [...document.querySelectorAll('.tab')].find(x => x.dataset.tab === 'explain').click());
  await setVal(page, '#expText', 'Electrical resistance opposes current flow.');
  await click(page, '#btnExplain'); await wait(900);
  const explainOut = await page.evaluate(() => document.querySelectorAll('#explainOut p, #explainOut li').length);
  console.log('explain paragraphs:', explainOut);

  await browser.close();
  console.log('\nJS ERRORS:', errors.length ? errors : 'none');
  const pass = report.on && +report.score > 0 && report.gaps > 0 && report.improved > 0 && report.badges > 0 && gapOpen && readerChunks > 0 && explainOut > 0 && errors.length === 0;
  console.log(pass ? '\n✅ E2E PASS' : '\n❌ E2E FAIL');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error('DRIVER CRASH:', e.stack || e.message); process.exit(1); });
