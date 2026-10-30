import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {stageReady} from './stage-ready';
const root='docs/evidence/stereo-pass-by';
test('actual stereo passes, exclusions, mute, pause, replay and new route',async({browser})=>{
 mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});const connect=AudioNode.prototype.connect;
  (AudioNode.prototype as any).connect=function(destination:any,...args:any[]){
   if(destination instanceof AudioDestinationNode&&!(window as any).audioCapture){
    const context=this.context,sink=context.createMediaStreamDestination();sink.channelCount=2;sink.channelCountMode='explicit';(window as any).audioCapture=sink;connect.call(this,sink);
    const split=context.createChannelSplitter(2),left=context.createAnalyser(),right=context.createAnalyser();left.fftSize=right.fftSize=2048;connect.call(this,split);split.connect(left,0);split.connect(right,1);const scratch=new Float32Array(2048);
    (window as any).stereo=()=>{const rms=(a:AnalyserNode)=>{a.getFloatTimeDomainData(scratch);return Math.sqrt(scratch.reduce((n,x)=>n+x*x,0)/scratch.length);};return {left:rms(left),right:rms(right)};};
   }
   return (connect as any).call(this,destination,...args);
  };
 });
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:350,speed:0});});await stageReady(page);
 const actors=await page.evaluate(()=>(window as any).__drive.traffic().actors),car=actors.find((a:any)=>a.id===0),bus=actors.find((a:any)=>a.type===1);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const results=[];
 for(const name of ['left','right','distant','following','collision']){
  const target=name==='right'?bus:car,lateral=name==='right'?.5:name==='collision'?target.lateral:3.8,gap=name==='distant'?240:name==='following'?14:45,speed=name==='following'?30:70;
  await page.evaluate(v=>(window as any).__drive.reset(v),{distance:target.distance-gap,lateral,speed});await stageReady(page);
  if(name==='left'||name==='right')await page.evaluate(()=>{const w=window as any,canvas=document.querySelector('canvas')!,stream=new MediaStream([...canvas.captureStream(30).getVideoTracks(),...w.audioCapture.stream.getAudioTracks()]);w.chunks=[];w.recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'});w.recorder.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.recorder.start();});
  await page.evaluate(({lateral,name})=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:name!=='following',brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer+(lateral-s.lateral)*.4))});},16);},{lateral,name});
  const rows=[];let shot=false;
  for(let i=0;i<55;i++){await page.waitForTimeout(25);const r=await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();return {time:s.elapsed,distance:s.distance,lateral:s.lateral,audio:s.audio,stereo:(window as any).stereo(),impacts:g.traffic().impacts,ready:g.streaming().ready,perf:g.perf()};});rows.push(r);expect(r.ready).toBe(true);if(!shot&&(name==='left'||name==='right')&&r.audio.passBy.active.some((v:any)=>v.gain>.8)){await page.screenshot({path:`${root}/${name}.png`,scale:'css'});shot=true;}}
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
  if(name==='left'||name==='right'){
   const bytes=await page.evaluate(async()=>{const w=window as any;await new Promise<void>(r=>{w.recorder.onstop=()=>r();w.recorder.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/${name}.webm`,Buffer.from(bytes));
   expect(rows.at(-1)!.audio.passBy.starts).toBe(1);expect(rows.at(-1)!.audio.passBy.crossings).toBe(1);expect(rows.at(-1)!.impacts).toBe(0);
   // Decode the recorded two-channel signal, including engine and all other game audio.
   const pcm=execFileSync('ffmpeg',['-v','error','-i',`${root}/${name}.webm`,'-vn','-f','f32le','-ac','2','-ar','48000','pipe:1'],{maxBuffer:8*1024*1024});let maxBias=0;
   for(let offset=0;offset+4800*8<=pcm.length;offset+=1200*8){let l=0,r=0;for(let j=offset;j<offset+4800*8;j+=8){l+=pcm.readFloatLE(j)**2;r+=pcm.readFloatLE(j+4)**2;}const db=10*Math.log10((l+1e-12)/(r+1e-12));maxBias=Math.max(maxBias,name==='left'?db:-db);}
   expect(maxBias).toBeGreaterThan(5);expect(rows.slice(30).every(r=>r.perf.fps>=30)).toBe(true);results.push({name,recordedDominantChannelDb:maxBias,rows});
  }else {expect(rows.every(r=>r.audio.passBy.starts===0)).toBe(true);if(name==='collision')expect(rows.some(r=>r.audio.lastImpact==='vehicle'&&r.impacts>0)).toBe(true);results.push({name,rows});}
 }
 // Pause and mute a real, active pass, not merely an idle audio context.
 for(const action of ['mute','pause']){
  await page.evaluate(v=>(window as any).__drive.reset(v),{distance:bus.distance-50,lateral:.5,speed:65});await stageReady(page);
  await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:true,brake:false,steer:s.requiredSteer+(.5-s.lateral)*.4});},16);});
  await page.waitForFunction(()=>(window as any).__drive.snapshot().audio.passBy.active.some((v:any)=>v.gain>.1));
  if(action==='mute')await page.evaluate(()=>document.getElementById('sound')!.click());else await page.locator('#pause').tap();
  await page.waitForTimeout(350);const silent=await page.evaluate(()=>(window as any).stereo());expect(Math.max(silent.left,silent.right)).toBeLessThan(.0001);
  if(action==='mute')await page.evaluate(()=>document.getElementById('sound')!.click());else {await page.locator('#l2-play').tap();await page.waitForTimeout(1300);expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');}
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.passBy.starts)).toBe(1);
 }
 await page.locator('#pause').tap();await page.locator('#l2-replay').tap();await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.passBy.starts)).toBe(0);
 await page.locator('#pause').tap();await Promise.all([page.waitForURL(url=>url.searchParams.has('seed')),page.locator('#l2-next').tap()]);await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.snapshot().audio.passBy.starts)).toBe(0);expect(errors).toEqual([]);
 writeFileSync(`${root}/verification.json`,JSON.stringify({reference:'Channel-energy analysis only; not listened to. No samples copied.',environment:'Edge 915x412 touch DPR2, 4x CPU slowdown, desktop GPU; not physical Pixel 8',results},null,2));await context.close();
});
