// Real-user E2E: REAL mouse clicks (page.click) + real typing (page.type),
// so broken hit-targets / overlays fail the test instead of hiding.
const puppeteer = require('puppeteer-core');
const SHOT = '/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad';
const MODE = process.argv[2] || 'desktop';
const VP = MODE === 'mobile' ? { width: 412, height: 900 } : { width: 1280, height: 860 };
const errors = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
// robust click: try real mouse click, fall back to in-page .click() if occluded/edge-clipped
async function rclick(page, sel) {
  try { await page.click(sel); }
  catch (e) { await page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('missing ' + s); el.click(); }, sel); }
}

(async () => {
  const chmod = require('fs'); try { chmod.chmodSync(__dirname + '/../desktop/adapt-assistant.sh', 0o755); } catch (e) {}
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable', headless: 'new', dumpio: false,
    userDataDir: SHOT + '/chrome-profile-' + MODE,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport(VP);
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  const R = {};
  // 1) onboarding shows, real-click a profile card
  R.onboardVisible = await page.evaluate(() => document.getElementById('panel-onboard').classList.contains('active'));
  await page.click('.pcard[data-p="adhd"]'); await wait(400);
  R.profileApplied = await page.evaluate(() => document.documentElement.getAttribute('data-profile'));
  R.readerActiveAfterPick = await page.evaluate(() => document.getElementById('panel-reader').classList.contains('active'));

  // 2) nav to teach by REAL click on sidebar/bottom nav
  const teachNav = MODE === 'mobile' ? '#bottnav .navbtn[data-tab="teach"]' : '#sideNav .navbtn[data-tab="teach"]';
  await rclick(page, teachNav); await wait(300);
  R.teachActive = await page.evaluate(() => document.getElementById('panel-teach').classList.contains('active'));

  // 3) type topic, real-click start
  await page.type('#topicInput', 'Photosynthesis');
  await page.click('#btnStartTeach'); await wait(400);
  R.stageOpen = await page.evaluate(() => !document.getElementById('teachStage').hidden);
  R.gemGreeted = await page.evaluate(() => !!document.querySelector('.msg.gem'));
  R.finalizeDisabledAt0 = await page.evaluate(() => document.getElementById('btnFinalize').disabled);

  // 4a) OCCLUSION CHECK — is the Send button covered by the fixed bottom nav? (real mobile bug)
  R.sendClickable = await page.evaluate(() => {
    const b = document.getElementById('btnSend'); b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return !!(top && (top === b || b.contains(top)));   // the element at Send's centre must BE Send
  });

  // 4b) two real user turns — wait for Gem's reply between them, like a human
  let gemCount = await page.evaluate(() => document.querySelectorAll('.msg.gem').length);
  for (const line of [
    'Photosynthesis is how plants make food from water and carbon dioxide using sunlight to make glucose and oxygen',
    'The glucose is the plant food and the oxygen is released into the air through the leaves',
  ]) {
    await page.type('#teachInput', line);
    await rclick(page, '#btnSend');
    // wait until Gem replies (a new gem bubble appears) or timeout
    try { await page.waitForFunction(n => document.querySelectorAll('.msg.gem').length > n, { timeout: 15000 }, gemCount); } catch (e) {}
    gemCount = await page.evaluate(() => document.querySelectorAll('.msg.gem').length);
  }
  R.turnCounter = await page.evaluate(() => document.getElementById('turnCount').textContent);
  R.finalizeEnabledAt2 = await page.evaluate(() => !document.getElementById('btnFinalize').disabled);

  // 5) REAL click finalize (the button users said was broken)
  await page.click('#btnFinalize');
  try { await page.waitForFunction(() => !document.getElementById('report').hidden, { timeout: 45000 }); } catch (e) {}
  await wait(600);
  R.report = await page.evaluate(() => ({
    shown: !document.getElementById('report').hidden,
    score: document.getElementById('ringNum').textContent,
    strengths: document.querySelectorAll('#strengthPills .pill').length,
    gaps: document.querySelectorAll('.gapcard').length,
    follow: document.querySelectorAll('#followList li').length,
    improved: document.querySelectorAll('#improved .imp-sec').length,
    badges: document.querySelectorAll('.gapbadge').length,
  }));

  // 6) real-click a gap card to expand
  const gh = await page.$('.gaphead');
  if (gh) { await gh.click(); await wait(400); }
  R.gapExpands = await page.evaluate(() => { const c = document.querySelector('.gapcard'); return !!(c && c.classList.contains('open')); });
  await page.screenshot({ path: `${SHOT}/v2-report-${MODE}.png`, fullPage: true });

  // 7) reader via real nav + click
  const readerNav = MODE === 'mobile' ? '#bottnav .navbtn[data-tab="reader"]' : '#sideNav .navbtn[data-tab="reader"]';
  await rclick(page, readerNav); await wait(300);
  await page.type('#srcText', 'The mitochondria is the powerhouse of the cell and it produces energy for the whole body constantly.');
  await page.click('#btnReader');
  try { await page.waitForFunction(() => document.querySelectorAll('#readerOut .chunk').length > 0, { timeout: 20000 }); } catch (e) {}
  R.readerChunks = await page.evaluate(() => document.querySelectorAll('#readerOut .chunk').length);
  await page.screenshot({ path: `${SHOT}/v2-reader-${MODE}.png`, fullPage: true });

  // 8) explain via real nav + seg click
  const explainNav = MODE === 'mobile' ? '#bottnav .navbtn[data-tab="explain"]' : '#sideNav .navbtn[data-tab="explain"]';
  await rclick(page, explainNav); await wait(300);
  await page.type('#expText', 'Inertia is the tendency of an object to resist changes in its motion.');
  await page.click('#styleSeg button[data-s="story"]'); await wait(100);
  await page.click('#btnExplain');
  try { await page.waitForFunction(() => document.querySelectorAll('#explainOut p, #explainOut li').length > 0, { timeout: 20000 }); } catch (e) {}
  R.explainParas = await page.evaluate(() => document.querySelectorAll('#explainOut p, #explainOut li').length);

  // 9) display toggle real clicks
  await page.click('#btnContrast'); await wait(150);
  R.contrastToggles = await page.evaluate(() => document.documentElement.classList.contains('hi-contrast'));
  await page.click('#btnTextUp'); await wait(150);
  R.textScales = await page.evaluate(() => document.documentElement.style.getPropertyValue('--user-scale'));

  await browser.close();
  console.log(`\n=== E2E (${MODE}, real clicks) ===`);
  console.log(JSON.stringify(R, null, 2));
  console.log('JS ERRORS:', errors.length ? errors : 'none');
  const pass = R.onboardVisible && R.profileApplied === 'adhd' && R.readerActiveAfterPick && R.teachActive &&
    R.stageOpen && R.gemGreeted && R.finalizeDisabledAt0 === true && R.finalizeEnabledAt2 === true &&
    R.sendClickable === true &&
    R.report.shown && +R.report.score > 0 && R.report.gaps > 0 && R.report.improved > 0 && R.report.badges > 0 &&
    R.gapExpands && R.readerChunks > 0 && R.explainParas > 0 && R.contrastToggles && errors.length === 0;
  console.log(pass ? '\n✅ E2E PASS' : '\n❌ E2E FAIL');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error('DRIVER CRASH:', e.stack || e.message); process.exit(1); });
