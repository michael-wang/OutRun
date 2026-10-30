import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const before=process.env.SURFACE_BEFORE==='1',root='docs/evidence/surface-contact';
test('asphalt shoulder and rail gameplay comparison',async({page})=>{
 const phase=before?'before':'after';mkdirSync(`${root}/${phase}`,{recursive:true});await page.setViewportSize({width:915,height:412});await page.goto('/');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));const results=[];
 for(const [name,distance,lateral,speed,steer] of [['asphalt',500,0,70,0],['dust',1000,8.5,65,0],['hard',620,6.3,75,1],['gentle',620,6.4,25,.25]] as const){
  await page.evaluate(v=>(window as any).__drive.reset(v),{distance,lateral,speed});await stageReady(page);const frames=[];let hitAt=-1;
  for(let i=0;i<24;i++){const r=await page.evaluate(({name,steer})=>{const g=(window as any).__drive,s=g.snapshot();g.advance(1/60,{gas:true,brake:false,steer:name==='dust'?s.requiredSteer:steer});return {state:g.snapshot(),surface:g.surfaceFeedback?.(),railClearance:g.railClearance?.(),wheels:g.wheelContacts(),stream:g.streaming().ready};},{name,steer});frames.push(r);if(!before&&name==='hard'&&r.surface?.guard.impacts>0&&hitAt<0)hitAt=i;if(!before&&name==='hard'&&i===hitAt+3&&hitAt>=0){await page.screenshot({path:`${root}/${phase}/impact.png`});}}
  await page.screenshot({path:`${root}/${phase}/${name}.png`});if(!before){for(const r of frames){expect(r.stream).toBe(true);if(name==='asphalt'){expect(r.surface.dust.particles).toBe(0);expect(r.surface.guard.impacts).toBe(0);}if(name==='hard'||name==='gentle'){expect(r.state.lateral).toBeLessThanOrEqual(r.surface.guard.limit+.001);expect(r.railClearance).toBeGreaterThan(0);}}if(name==='dust')expect(frames.some(r=>r.surface.dust.particles>0)).toBe(true);if(name==='hard'||name==='gentle')expect(frames.at(-1)!.surface.guard.impacts).toBe(1);if(name==='gentle')expect(frames.at(-1)!.surface.guard.strength).toBeLessThan(.3);if(name==='hard')expect(frames.at(-1)!.surface.guard.strength).toBeGreaterThan(.7);}results.push({name,frames});
 }
 writeFileSync(`${root}/${phase}/cases.json`,JSON.stringify(results,null,2));
});
test('record surface feedback with audio, recovery and mobile performance',async({browser})=>{
 test.skip(before);const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});const connect=AudioNode.prototype.connect;(AudioNode.prototype as any).connect=function(destination:any,...args:any[]){if(destination instanceof AudioDestinationNode){const sink=this.context.createMediaStreamDestination();(window as any).audioCapture=sink;connect.call(this,sink);}return (connect as any).call(this,destination,...args);};});
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>(window as any).__drive.manual(true));
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const w=window as any,canvas=document.querySelector('canvas')!,stream=new MediaStream([...canvas.captureStream(30).getVideoTracks(),...w.audioCapture.stream.getAudioTracks()]);w.chunks=[];w.recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'});w.recorder.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.recorder.start();});
 const rows=[];
 for(const [name,distance,lateral,speed] of [['asphalt',400,0,65],['dust',1000,8.5,65],['hard',620,6.3,75],['gentle',620,6.4,25]] as const){
  await page.evaluate(v=>(window as any).__drive.reset(v),{distance,lateral,speed});await stageReady(page);
  await page.evaluate(name=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:true,brake:false,steer:name==='hard'?(s.elapsed<1?1:-.5):name==='gentle'?.25:name==='dust'?s.requiredSteer:s.requiredSteer-s.lateral*.1});},16);},name);
  for(let i=0;i<8;i++){await page.waitForTimeout(250);const r=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),surface:g.surfaceFeedback(),clearance:g.railClearance(),perf:g.perf(),ready:g.streaming().ready};});expect(r.ready).toBe(true);if(name==='asphalt'){expect(r.surface.dust.particles).toBe(0);expect(r.surface.guard.impacts).toBe(0);}if(name==='hard'||name==='gentle'){expect(r.surface.guard.impacts).toBeLessThanOrEqual(1);expect(r.clearance).toBeGreaterThan(0);}rows.push({name,...r});}
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
 }
 const bytes=await page.evaluate(async()=>{const w=window as any;await new Promise<void>(r=>{w.recorder.onstop=()=>r();w.recorder.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/drive.webm`,Buffer.from(bytes));
 expect(rows.filter(r=>r.name==='hard').at(-1)!.state.lateral).toBeLessThan(5.5);expect(rows.slice(4).every(r=>r.perf.fps>=30)).toBe(true);
 await page.locator('#pause').tap();await page.locator('#l2-replay').tap();await stageReady(page);const reset=await page.evaluate(()=>(window as any).__drive.surfaceFeedback());expect(reset.guard.impacts).toBe(0);expect(reset.dust.particles).toBe(0);expect(reset.sparks.particles).toBe(0);
 writeFileSync(`${root}/recording.json`,JSON.stringify({environment:'Edge 915x412 touch DPR2, 4x CPU slowdown, desktop GPU; not Pixel 8',audioRecorded:true,rows},null,2));await context.close();
});
