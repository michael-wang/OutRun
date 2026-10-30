import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const root=process.env.OUTRUN_EVIDENCE_ROOT??'docs/evidence/traffic-impact';
test('arcade traffic impacts: real rendering, recovery, sound and mobile performance',async({browser})=>{
 mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});const connect=AudioNode.prototype.connect;(AudioNode.prototype as any).connect=function(destination:any,...args:any[]){if(destination instanceof AudioDestinationNode){const sink=this.context.createMediaStreamDestination();(window as any).audioCapture=sink;connect.call(this,sink);}return (connect as any).call(this,destination,...args);};});
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:350,speed:0});});await stageReady(page);
 const car=await page.evaluate(()=>({...((window as any).__drive.trafficSchedule().find((a:any)=>a.id===62)),lateral:-1.75}));
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const w=window as any,canvas=document.querySelector('canvas')!,stream=new MediaStream([...canvas.captureStream(30).getVideoTracks(),...w.audioCapture.stream.getAudioTracks()]);w.chunks=[];w.recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'});w.recorder.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.recorder.start();});
 const results=[];
 for(const name of ['clean','side','rear']){
  await page.evaluate(({name,car})=>{const g=(window as any).__drive;g.reset({distance:car.distance-(name==='side'?4.8:22),lateral:car.lateral+(name==='clean'?5.55:name==='side'?3:0),speed:name==='side'?36:75});}, {name,car});await stageReady(page);
  await page.evaluate(name=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot(),t=g.traffic();g.controls({gas:true,brake:false,steer:name==='side'&&t.impacts===0?-.65:name==='clean'?Math.min(1,s.requiredSteer+(3.8-s.lateral)*.4):s.requiredSteer+(t.impacts>0&&s.elapsed>.8?(3.8-s.lateral)*.3:0)});},16);},name);
  const rows=[];let shot=false;
  for(let i=0;i<(name==='clean'?12:24);i++){
   await page.waitForTimeout(125);const r=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),traffic:g.traffic(),impact:g.trafficImpact(),clearance:g.trafficClearance(),tires:g.tireEffects(),ready:g.streaming().ready,perf:g.perf()};});rows.push(r);expect(r.ready).toBe(true);expect(r.clearance.every((c:any)=>c.gap>-.05)).toBe(true);
   if(!shot&&(name==='clean'?i===8:r.traffic.impacts>0&&Math.abs(r.impact.yaw)>.035)){await page.screenshot({path:`${root}/${name}.png`,scale:'css'});shot=true;}
  }
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
  expect(shot).toBe(true);expect(rows.at(-1)!.traffic.impacts).toBe(name==='clean'?0:1);
  if(name==='clean'){expect(rows.every(r=>r.impact.sparks.particles===0)).toBe(true);expect(rows.some(r=>r.traffic.actors.some((a:any)=>a.id===car.id&&a.distance<r.state.distance-8))).toBe(true);}
  else {expect(rows.some(r=>Math.abs(r.impact.yaw)>.05)).toBe(true);expect(rows.some(r=>r.traffic.reactions.some((a:any)=>Math.abs(a.offset)>.3))).toBe(true);expect(rows.some(r=>r.impact.sparks.particles>0)).toBe(true);expect(rows.at(-1)!.state.speed).toBeGreaterThan(25);}
  if(name==='rear'){expect(Math.abs(rows.at(-1)!.state.lateral)).toBeLessThan(5.5);expect(rows.some(r=>r.state.audio.skidIntensity>0&&r.state.audio.skidLevel>0&&r.tires.particles>0&&r.tires.segments>0)).toBe(true);}
  expect(rows.slice(8).every(r=>r.perf.fps>=30)).toBe(true);results.push({name,rows});
 }
 const bytes=await page.evaluate(async()=>{const w=window as any;await new Promise<void>(r=>{w.recorder.onstop=()=>r();w.recorder.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/drive.webm`,Buffer.from(bytes));
 await page.locator('#pause').tap();await page.locator('#l2-replay').tap();await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.traffic().reactions.length)).toBe(0);expect(await page.evaluate(()=>(window as any).__drive.trafficImpact().velocity)).toBe(0);expect(errors).toEqual([]);
 writeFileSync(`${root}/results.json`,JSON.stringify({environment:'Edge 915x412 touch DPR2; 4x CPU slowdown; desktop GPU, not physical Pixel 8',audioRecorded:true,results:results.map(({name,rows})=>({name,rows:rows.map(r=>({time:r.state.elapsed,speedKmh:r.state.speed*3.6,lateral:r.state.lateral,playerYaw:r.impact.yaw,playerSlide:r.impact.slide,skid:r.state.audio.skidIntensity,squeal:r.state.audio.skidLevel,smoke:r.tires.particles,marks:r.tires.segments,impacts:r.traffic.impacts,sparks:r.impact.sparks.particles,minClearance:Math.min(...r.clearance.map((c:any)=>c.gap)),fps:r.perf.fps,ready:r.ready,traffic:r.traffic.reactions.map((a:any)=>({id:a.id,offset:a.offset,yaw:a.yaw,slide:a.slide,skid:a.skidIntensity}))}))}))},null,2));await context.close();
});

test('car bus truck and waffle impacts retain separation and clear on reset',async({page})=>{
 await page.goto('/');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 for(const type of [0,1,2,3]){
  await page.evaluate(type=>{const g=(window as any).__drive;g.reset({distance:g.trafficSchedule().find((a:any)=>a.type===type).distance-100,speed:0});},type);await stageReady(page);
  const actor=await page.evaluate(type=>(window as any).__drive.traffic().actors.find((a:any)=>a.type===type),type);
  await page.evaluate(a=>(window as any).__drive.reset({distance:a.distance-14,lateral:a.lateral,speed:75}),actor);await stageReady(page);
  const rows=await page.evaluate(()=>{const g=(window as any).__drive,out=[];for(let i=0;i<120;i++){const s=g.snapshot();g.advance(1/120,{gas:true,brake:false,steer:s.requiredSteer});out.push({traffic:g.traffic(),clearance:g.trafficClearance(),ready:g.streaming().ready});}return out;});
  expect(rows.some(r=>r.traffic.lastEvent?.type===type)).toBe(true);expect(rows.filter((r,i)=>r.traffic.impacts>(i?rows[i-1].traffic.impacts:0)&&r.traffic.lastEvent?.actorId===actor.id)).toHaveLength(1);expect(rows.every(r=>r.ready&&r.clearance.every((c:any)=>c.gap>-.05))).toBe(true);
  await page.evaluate(()=>(window as any).__drive.reset({distance:12000,speed:0}));await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.traffic().reactions.length)).toBe(0);
 }
});
