// Desktop touch emulation: resource/workload evidence, not a phone thermal benchmark.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.argv[2]??'candidate',seconds=Number(process.argv[3]??100);
const root=`docs/evidence/coast-r84/performance/${label}`;await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true,deviceScaleFactor:2.75}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  const p=WebGL2RenderingContext.prototype;let offscreen=false,width=0,height=0;
  window.glWork={draws:0,offscreenDraws:0,offscreenViewportPixels:0};
  for(const name of ['bindFramebuffer','viewport','drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
   const original=p[name];p[name]=function(...args){
    if(name==='bindFramebuffer'&&(args[0]===this.FRAMEBUFFER||args[0]===this.DRAW_FRAMEBUFFER))offscreen=!!args[1];
    else if(name==='viewport'){width=args[2];height=args[3];}
    else if(name.startsWith('draw')){window.glWork.draws++;if(offscreen){window.glWork.offscreenDraws++;window.glWork.offscreenViewportPixels+=width*height;}}
    return original.apply(this,args);
   };
  }
 });
 await page.goto(process.env.COAST_SOAK_URL??'http://127.0.0.1:5180/');
 await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 await page.evaluate(()=>{
  const g=window.__drive;g.reset({distance:0,speed:65});g.manual(false);
  window.trace=[];window.frameTimes=[];window.longFrames=[];let previous=0,frames=0;
  function frame(t){if(previous){window.frameTimes.push(t-previous);if(t-previous>40)window.longFrames.push({ms:t-previous,d:g.snapshot().distance,index:g.journey().index,preparing:g.journey().preparing});}previous=t;frames++;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});},50);
  window.glWork={draws:0,offscreenDraws:0,offscreenViewportPixels:0};
  window.sampler=setInterval(()=>{const s=g.snapshot(),stream=g.streaming(),j=g.journey();window.trace.push({wall:performance.now(),elapsed:s.elapsed,d:s.distance,offRoad:s.offRoad,frames,work:{...window.glWork},render:g.scenery().render,memory:g.scenery().memory,heap:performance.memory?.usedJSHeapSize,nature:g.coastNature(),water:g.coastWater(),journey:{index:j.index,preparing:j.preparing,prepared:j.prepared},stream:{chunks:stream.chunks.length,queued:stream.queued,retiring:stream.retiring,fatal:stream.fatal}});frames=0;window.glWork={draws:0,offscreenDraws:0,offscreenViewportPixels:0};},1000);
 });
 await page.waitForTimeout(seconds*1000);
 const result=await page.evaluate(()=>{clearInterval(window.driver);clearInterval(window.sampler);window.__drive.manual(true);const frames=window.frameTimes.sort((a,b)=>a-b),q=p=>frames[Math.ceil(frames.length*p)-1];return {trace:window.trace,longFrames:window.longFrames,frames:{count:frames.length,p50:q(.5),p95:q(.95),p99:q(.99),worst:frames.at(-1),over50:frames.filter(x=>x>=50).length},journey:window.__drive.journey(),state:window.__drive.snapshot()};});
 await page.screenshot({path:`${root}/finish.png`});
 await writeFile(`${root}/soak.json`,JSON.stringify({browser:'Desktop Edge, touch emulation, 960x432 CSS pixels, DPR 2.75; not physical Pixel 8',errors,...result},null,2));
 const windows=[result.trace.slice(5,20),result.trace.slice(45,65),result.trace.slice(-15)].map(a=>({samples:a.length,fps:a.reduce((n,x)=>n+x.frames,0)/a.length,drawsPerFrame:a.reduce((n,x)=>n+x.work.draws,0)/a.reduce((n,x)=>n+x.frames,0),offscreenPixelsPerFrame:a.reduce((n,x)=>n+x.work.offscreenViewportPixels,0)/a.reduce((n,x)=>n+x.frames,0),geometries:[Math.min(...a.map(x=>x.memory.geometries)),Math.max(...a.map(x=>x.memory.geometries))],textures:[Math.min(...a.map(x=>x.memory.textures)),Math.max(...a.map(x=>x.memory.textures))]}));
 console.log(JSON.stringify({label,errors,frames:result.frames,windows,journey:result.journey.index}));
 assert.deepEqual(errors,[]);assert.ok(result.trace.every(x=>!x.offRoad&&!x.stream.fatal));
}finally{await browser.close();}
