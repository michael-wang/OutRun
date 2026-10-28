import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root=process.env.OUTRUN_EVIDENCE_ROOT??'docs/evidence/v0.6/p0';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const [name,actIndex,duration] of [['coast-canyon',1,26],['canyon-city',2,26],['city-coast',0,26],['journey',-1,185]]){
 if(process.env.OUTRUN_CAPTURE_CASE&&process.env.OUTRUN_CAPTURE_CASE!==name)continue;
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,recordVideo:{dir:root,size:{width:960,height:432}}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173/')&&!r.url().startsWith('data:'))requests.push(r.url());});
 await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 const setup=await page.evaluate(async index=>{const g=window.__drive,acts=g.acts(),length=g.snapshot().trackLength,boundary=index===0?length:acts[Math.max(0,index)].start,start=index===-1?0:boundary-1200;g.reset({distance:start,speed:230/3.6});const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),driver=scriptedDriver();window.captureDriver=setInterval(()=>{const s=g.snapshot();g.controls(driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample)));},25);window.frameIntervals=[];let last=performance.now();window.probeFrames=true;const frame=t=>{window.frameIntervals.push(t-last);last=t;if(window.probeFrames)requestAnimationFrame(frame);};requestAnimationFrame(frame);return {start,boundary,acts,length};},actIndex);
 const rows=[],began=Date.now();let photographed=false;
 await page.screenshot({path:`${root}/${name}-start.png`});
 while(Date.now()-began<duration*1000){const r=await page.evaluate(()=>({state:window.__drive.snapshot(),scene:window.__drive.scenery(),wheels:window.__drive.wheels()}));rows.push(r);if(!photographed&&r.state.distance>=setup.boundary&&actIndex>=0){photographed=true;await page.screenshot({path:`${root}/${name}-boundary.png`});}await page.waitForTimeout(100);}
 const perf=await page.evaluate(()=>{clearInterval(window.captureDriver);window.probeFrames=false;const values=window.frameIntervals.slice(1).sort((a,b)=>a-b);return {frames:values.length,medianMs:values[Math.floor(values.length*.5)],p95Ms:values[Math.floor(values.length*.95)],maxMs:Math.max(...values),heapBytes:performance.memory?.usedJSHeapSize};});
 await page.screenshot({path:`${root}/${name}-end.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${name}.webm`);unlinkSync(await video.path());
 const result={name,setup,errors,requests,perf,simulatedSeconds:rows.at(-1).state.elapsed,offRoad:rows.filter(r=>r.state.offRoad).length,rows};writeFileSync(`${root}/${name}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:undefined}));
}
await browser.close();
