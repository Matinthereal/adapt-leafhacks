const puppeteer=require('puppeteer-core');
const path=require('path');
const SHOT='/tmp/claude-1000/-home-matindarwish-brain/99c18be6-396e-4e42-9a6c-350ca9225ac4/scratchpad';
(async()=>{
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',
    userDataDir:SHOT+'/chrome-pdf',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const p=await b.newPage();
  await p.goto('file://'+path.join(__dirname,'..','demo','live-pitch-print.html'),{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,600));
  await p.pdf({path:path.join(__dirname,'..','demo','Adapt-Live-Pitch.pdf'),format:'A4',printBackground:true,
    margin:{top:'14mm',bottom:'14mm',left:'12mm',right:'12mm'}});
  await b.close(); console.log('PDF written');
})().catch(e=>{console.error('CRASH',e.message);process.exit(1);});
