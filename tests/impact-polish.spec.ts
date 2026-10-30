import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const before=process.env.POLISH_BEFORE==='1',root='docs/evidence/impact-polish',phase=before?'before':'after';
test('compact trails remain continuous with 30 Hz rendering at high speed',async({page})=>{
 test.skip(before);await page.setViewportSize({width:915,height:412});await page.goto('/');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:4150,speed:78});});await stageReady(page);
 for(let i=0;i<12;i++)await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();g.advance(1/30,{gas:true,brake:false,steer:s.requiredSteer-s.lateral*.08});});
 const fx=await page.evaluate(()=>(window as any).__drive.tireEffects());expect(fx.particles).toBeGreaterThan(0);expect(fx.segments).toBeGreaterThan(0);await page.screenshot({path:'test-results/polish-30fps.png'});
});
test('identical smoke dust and traffic shadow viewpoints',async({page})=>{
 mkdirSync(`${root}/${phase}`,{recursive:true});await page.setViewportSize({width:915,height:412});await page.goto('/');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 for(const [name,distance,lateral] of [['drift',4150,0],['dust',1000,8.5]] as const){
  await page.evaluate(v=>(window as any).__drive.reset({...v,speed:65}),{distance,lateral});await stageReady(page);
  for(let i=0;i<36;i++)await page.evaluate(name=>{const g=(window as any).__drive,s=g.snapshot();g.advance(1/60,{gas:true,brake:false,steer:s.requiredSteer-(name==='drift'?s.lateral*.08:0)});},name);
  await page.screenshot({path:`${root}/${phase}/${name}.png`});const s=await page.evaluate(()=>(window as any).__drive.snapshot());if(name==='drift')expect(s.audio.skidIntensity).toBeGreaterThan(.7);if(!before&&name==='dust')expect(s.audio.gravelLevel).toBeGreaterThan(0);
 }
 await page.evaluate(()=>(window as any).__drive.reset({distance:350,speed:0}));const actor=await page.evaluate(()=>(window as any).__drive.traffic().actors.find((a:any)=>a.id===0));const shadows=[];
 for(const gap of [200,100,50,25]){await page.evaluate(({actor,gap})=>(window as any).__drive.reset({distance:actor.distance-gap,speed:0,lateral:0}),{actor,gap});await stageReady(page);await page.screenshot({path:`${root}/${phase}/shadow-${gap}.png`});const t=await page.evaluate(()=>(window as any).__drive.traffic());if(!before){expect(t.contactShadows).toBe(t.actors.filter((a:any)=>a.visible).length);expect(t.shadowCasting).toBe(false);}shadows.push({gap,actor:t.actors.find((a:any)=>a.id===0),contactShadows:t.contactShadows});}
 writeFileSync(`${root}/${phase}/shadows.json`,JSON.stringify(shadows,null,2));
});

test('mobile presentation recording with actual game audio',async({browser})=>{
 test.skip(before);const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});const connect=AudioNode.prototype.connect;(AudioNode.prototype as any).connect=function(destination:any,...args:any[]){if(destination instanceof AudioDestinationNode){const sink=this.context.createMediaStreamDestination();(window as any).audioCapture=sink;connect.call(this,sink);}return (connect as any).call(this,destination,...args);};});
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:350,speed:0});});const car=await page.evaluate(()=>(window as any).__drive.traffic().actors.find((a:any)=>a.id===0));
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const w=window as any,canvas=document.querySelector('canvas')!,stream=new MediaStream([...canvas.captureStream(30).getVideoTracks(),...w.audioCapture.stream.getAudioTracks()]);w.chunks=[];w.recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'});w.recorder.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.recorder.start();});
 const results=[];
 for(const name of ['clean','drift','dust','side','rear']){
  await page.evaluate(()=>(window as any).recorder.pause());
  await page.evaluate(({name,car})=>{const g=(window as any).__drive;g.reset({distance:name==='drift'?4150:name==='dust'?1000:car.distance-(name==='side'?4.8:22),lateral:name==='drift'?0:name==='dust'?8.5:car.lateral+(name==='clean'?5.55:name==='side'?3:0),speed:name==='side'?36:name==='drift'||name==='dust'?65:75});}, {name,car});await stageReady(page);
  await page.evaluate(name=>{(window as any).recorder.resume();const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot(),t=g.traffic();let steer=s.requiredSteer;if(name==='drift')steer-=s.lateral*.08;else if(name==='clean')steer+=(3.8-s.lateral)*.4;else if(name==='side'&&t.impacts===0)steer=-.65;else if((name==='rear'||name==='side')&&t.impacts>0&&s.elapsed>.8)steer+=((name==='rear'?-1.75:1.75)-s.lateral)*.3;g.controls({gas:true,brake:false,steer:Math.max(-1,Math.min(1,steer))});},16);},name);
  const rows=[];let shot=false;
  for(let i=0;i<(name==='clean'||name==='drift'?12:name==='dust'?16:24);i++){
   await page.waitForTimeout(100);const r=await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();return {time:s.elapsed,speed:s.speed,audio:s.audio,skid:s.audio.skidIntensity,tires:g.tireEffects(),surface:g.surfaceFeedback(),impact:g.trafficImpact(),impacts:g.traffic().impacts,ready:g.streaming().ready,perf:g.perf()};});rows.push(r);expect(r.ready).toBe(true);
   if(!shot&&(name==='side'||name==='rear')&&r.impact.sparks.flash){await page.evaluate(()=>(window as any).__drive.manual(true));await page.screenshot({path:`${root}/after/${name}.png`,scale:'css'});await page.evaluate(()=>(window as any).__drive.manual(false));shot=true;}
  }
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
  if(name==='clean'){expect(rows.every(r=>r.impacts===0&&r.impact.sparks.particles===0&&r.audio.gravelLevel===0&&r.audio.impactCount===0)).toBe(true);}
  if(name==='drift')expect(rows.some(r=>r.skid>.7&&r.tires.particles>0&&r.tires.segments>0)).toBe(true);
  if(name==='dust')expect(rows.some(r=>r.audio.gravelLevel>.1&&r.surface.dust.particles>0)).toBe(true);
  if(name==='side'||name==='rear'){expect(shot).toBe(true);expect(rows.at(-1)!.impacts).toBe(1);expect(rows.some(r=>r.audio.lastImpact==='vehicle')).toBe(true);expect(rows.at(-1)!.impact.sparks.particles).toBe(0);}
  expect(rows.slice(8).every(r=>r.perf.fps>=30)).toBe(true);results.push({name,rows:rows.map(r=>({time:r.time,fps:r.perf.fps,drawAudio:r.audio,particles:r.tires.particles,dust:r.surface.dust.particles,sparks:r.impact.sparks.particles,flash:r.impact.sparks.flash,impacts:r.impacts,ready:r.ready}))});
 }
 const bytes=await page.evaluate(async()=>{const w=window as any;await new Promise<void>(r=>{w.recorder.onstop=()=>r();w.recorder.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/drive.webm`,Buffer.from(bytes));
 await page.evaluate(()=>document.getElementById('sound')!.click());await page.waitForTimeout(300);expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.muted)).toBe(true);expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.rms)).toBeLessThan(.0001);await page.evaluate(()=>document.getElementById('sound')!.click());
 await page.evaluate(()=>(window as any).__drive.reset({distance:620,lateral:6.3,speed:75}));await stageReady(page);await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);for(let i=0;i<12;i++)g.advance(1/60,{gas:true,brake:false,steer:1});});expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.lastImpact)).toBe('guardrail');expect(await page.evaluate(()=>(window as any).__drive.surfaceFeedback().sparks.particles)).toBeGreaterThan(0);
 await page.locator('#pause').tap();expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.gravelLevel)).toBe(0);await page.locator('#l2-replay').tap();await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.trafficImpact().sparks.flash)).toBe(false);
 await page.evaluate(()=>(window as any).__drive.reset({distance:350,speed:0}));const shadowActor=await page.evaluate(()=>(window as any).__drive.traffic().actors.find((a:any)=>a.id===0));for(const gap of [200,100,50,25]){await page.evaluate(({d,gap})=>(window as any).__drive.reset({distance:d-gap,speed:0}),{d:shadowActor.distance,gap});await stageReady(page);const check=await page.evaluate(()=>{const g=(window as any).__drive;return {traffic:g.traffic(),perf:g.perf()};});expect(check.perf.shadows).toBe(false);expect(check.traffic.contactShadows).toBe(check.traffic.actors.filter((a:any)=>a.visible).length);expect(check.traffic.shadowCasting).toBe(false);}
 expect(errors).toEqual([]);writeFileSync(`${root}/recording.json`,JSON.stringify({environment:'Edge 915x412 touch DPR2, 4x CPU slowdown, desktop GPU; not Pixel 8',audioRecorded:true,results},null,2));await context.close();
});
