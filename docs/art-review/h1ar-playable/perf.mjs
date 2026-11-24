import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const variant=process.argv[2]||'new';
const browser=await chromium.launch({channel:'chrome',args:['--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:900},serviceWorkers:'block'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(variant==='old')await page.route('**/coast-blonde-bob.glb',r=>r.fulfill({status:404,body:'baseline fallback'}));
try{
 await page.goto('http://127.0.0.1:5194/?at=350&trafficSeed=42&fpsdiag=1');
 await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 await page.evaluate(()=>{window.__drive.manual(true);window.__drive.reset({distance:7590,speed:120/3.6,lateral:0});});
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.waitForTimeout(3000);
 const start=await page.evaluate(()=>window.__driveFpsDiagnostics.report());
 await page.evaluate(async()=>{
  const q=window.__drive;q.manual(false);const begin=performance.now();
  await new Promise(resolve=>{const loop=now=>{
   const s=q.driveState();q.controls({gas:s.speed*3.6<120,brake:s.speed*3.6>122,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
   if(now-begin<10000)requestAnimationFrame(loop);else resolve();
  };requestAnimationFrame(loop);});
  q.manual(true);q.controls(undefined);
 });
 const finish=await page.evaluate(()=>({report:window.__driveFpsDiagnostics.report(),state:window.__drive.driveState()}));
 await writeFile('test-results/h1ar-playable/perf-'+variant+'.json',JSON.stringify({variant,start,finish,errors},null,2));
 console.log(JSON.stringify({variant,errors}));
}finally{await browser.close();}
