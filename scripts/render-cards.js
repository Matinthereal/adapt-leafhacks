// Render each title card in cards.html to a 1920x1080 PNG for the promo video.
const puppeteer = require('puppeteer-core');
const path = require('path');
const ASSETS = path.join(__dirname, '..', 'demo', 'assets');
const CARDS = ['intro', 'stat', 'science', 'tech', 'outro'];
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
    userDataDir: '/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad/chrome-cards',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file://' + path.join(ASSETS, 'cards.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800)); // fonts settle
  for (let i = 0; i < CARDS.length; i++) {
    const id = CARDS[i];
    await page.evaluate(cur => { document.querySelectorAll('.card').forEach(c => c.style.display = c.id === 'card-' + cur ? 'flex' : 'none'); }, id);
    await new Promise(r => setTimeout(r, 150));
    const el = await page.$('#card-' + id);
    await el.screenshot({ path: `${ASSETS}/card-${i}-${id}.png` });
    console.log('rendered card-' + i + '-' + id + '.png');
  }
  await browser.close();
})().catch(e => { console.error('CARD RENDER CRASH:', e.message); process.exit(1); });
