const puppeteer = require('puppeteer-core');
const SHOT='/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad';
(async()=>{
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',
    userDataDir:SHOT+'/chrome-mic',
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:3000/',{waitUntil:'networkidle0'});
  await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
  await p.evaluate(()=>document.querySelector('.pcard[data-p="classic"]').click()); await new Promise(r=>setTimeout(r,300));
  await p.evaluate(()=>[...document.querySelectorAll('.navbtn')].find(x=>x.dataset.tab==='teach').click()); await new Promise(r=>setTimeout(r,200));
  await p.evaluate(()=>{document.getElementById('topicInput').value='Photosynthesis';document.getElementById('btnStartTeach').click();}); await new Promise(r=>setTimeout(r,400));
  const micDimmed = await p.evaluate(()=>getComputedStyle(document.getElementById('btnMic')).opacity);
  const secure = await p.evaluate(()=>window.isSecureContext);
  // click mic
  await p.evaluate(()=>document.getElementById('btnMic').click());
  await new Promise(r=>setTimeout(r,1500));
  const status = await p.evaluate(()=>document.getElementById('micStatus').textContent);
  const recClass = await p.evaluate(()=>document.getElementById('btnMic').classList.contains('rec'));
  console.log(JSON.stringify({secureCtx:secure, micOpacity:micDimmed, statusAfterClick:status, listening:recClass, errors:errs.length?errs:'none'}));
  await b.close();
})().catch(e=>{console.error('CRASH',e.message);process.exit(1);});
