import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
test('living traffic lane changes in actual gameplay',async({browser})=>{
 test.setTimeout(240000);const root='docs/evidence/living-traffic';mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});const connect=AudioNode.prototype.connect;(AudioNode.prototype as any).connect=function(destination:any,...args:any[]){if(destination instanceof AudioDestinationNode&&!(window as any).audioCapture){const sink=this.context.createMediaStreamDestination();sink.channelCount=2;(window as any).audioCapture=sink;connect.call(this,sink);}return (connect as any).call(this,destination,...args);};});
 await page.goto('/?seed=1&perf=1');await stageReady(page);await page.addStyleTag({content:'#perf,#immersive-note{display:none!important}'});await page.locator('#l2-play').tap();await page.evaluate(()=>(window as any).__drive.manual(true));const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const cases=[];
 for(const id of [0,2,22]){
  const actor=await page.evaluate(id=>(window as any).__drive.trafficSchedule().find((a:any)=>a.id===id),id);
  await page.evaluate(a=>(window as any).__drive.reset({distance:a.distance-48,speed:a.speed/1.4,lateral:1.75}),actor);await stageReady(page);
  await page.evaluate(id=>{const w=window as any,g=w.__drive;w.chunks=[];w.rec=new MediaRecorder(new MediaStream([...document.querySelector('canvas')!.captureStream(30).getVideoTracks(),...w.audioCapture.stream.getAudioTracks()]),{mimeType:'video/webm;codecs=vp8,opus'});w.rec.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.rec.start();g.manual(false);w.driver=setInterval(()=>{const s=g.snapshot(),a=g.traffic().actors.find((a:any)=>a.id===id);if(!a)return;const desired=a.speed+(a.distance-s.distance-48)*.6;g.controls({gas:s.travelSpeed<desired,brake:s.travelSpeed>desired+1,steer:Math.max(-1,Math.min(1,s.requiredSteer+(1.75-s.lateral)*.18-s.lateralRate*.06))});},16);},id);
  const rows=[];let started:number|undefined,shot=false;
  for(let i=0;i<160;i++){await page.waitForTimeout(200);const r=await page.evaluate(id=>{const g=(window as any).__drive,t=g.traffic();return {state:g.snapshot(),actor:t.actors.find((a:any)=>a.id===id),lane:t.laneChanges.find((a:any)=>a.id===id),impacts:t.impacts,ready:g.streaming().ready,perf:g.perf()};},id);rows.push(r);if(r.lane?.active&&started===undefined)started=r.state.elapsed;if(!shot&&r.actor?.signal){await page.screenshot({path:`${root}/signal-${id}.png`,scale:'css'});shot=true;}if(started!==undefined&&r.state.elapsed>started+5){await page.screenshot({path:`${root}/changed-${id}.png`,scale:'css'});break;}}
  const bytes=await page.evaluate(async()=>{const w=window as any;clearInterval(w.driver);w.__drive.manual(true);await new Promise<void>(r=>{w.rec.onstop=r;w.rec.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/lane-${id}.webm`,Buffer.from(bytes));cases.push({id,started,rows});writeFileSync(root+'/gameplay.json',JSON.stringify(cases,null,2));
  expect(started).toBeDefined();expect(rows.some(r=>r.actor?.changing)).toBe(true);expect(rows.every(r=>r.ready)).toBe(true);expect(rows.at(-1)!.impacts).toBe(0);
 }
 await context.close();
});
