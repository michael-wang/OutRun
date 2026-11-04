import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const root='docs/evidence/coast-r7';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5180/?showcase=coast');
 await page.waitForFunction(()=>window.__drive?.streaming()?.ready,{timeout:120000});
 await page.evaluate(()=>{
  const g=window.__drive;g.reset({distance:350,speed:55});window.trace=[];window.framesMs=[];let last=0;
  function frame(t){if(last)window.framesMs.push(t-last);last=t;if(g.snapshot().mode==='playing')requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<72,brake:s.speed>73,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});if(s.mode!=='playing')clearInterval(window.driver);},50);
  window.sampler=setInterval(()=>{const s=g.snapshot();window.trace.push({elapsed:s.elapsed,d:s.distance,offRoad:s.offRoad,surface:s.surfaceError,render:g.scenery().render,memory:g.scenery().memory,nature:g.coastNature(),stream:g.streamFrame()});},1000);
 });
 await page.waitForFunction(()=>window.__drive.snapshot().mode==='paused',null,{timeout:240000,polling:1000});
 const result=await page.evaluate(()=>{clearInterval(window.sampler);const frames=window.framesMs.sort((a,b)=>a-b),q=p=>frames[Math.ceil(frames.length*p)-1];return {state:window.__drive.snapshot(),telemetry:window.__drive.telemetry(),stream:window.__drive.streaming(),trace:window.trace,frames:{count:frames.length,p50:q(.5),p95:q(.95),p99:q(.99),worst:frames.at(-1),over50:frames.filter(x=>x>=50).length}};});
 await page.screenshot({path:`${root}/mobile-finish.png`});
 await writeFile(`${root}/mobile-drive.json`,JSON.stringify({browser:'Headless Edge, 960x432 touch emulation on desktop GPU; not a physical phone benchmark',errors,...result},null,2));
 console.log(JSON.stringify({errors,d:result.state.distance,frames:result.frames,samples:result.trace.length,offRoadSamples:result.trace.filter(x=>x.offRoad).length}));
 if(errors.length||result.state.distance<10340||result.trace.some(x=>x.offRoad))process.exitCode=1;
}finally{await browser.close();}
