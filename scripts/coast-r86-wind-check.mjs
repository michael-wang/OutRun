// Hold the existing chase camera still to distinguish wind from vehicle motion.
// A short recording demonstrates the time-varying shader, not phone performance.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='docs/evidence/coast-r86/wind';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 // Test-page-only collision isolation: passing traffic can otherwise bump the
 // parked car and contaminate the wind pixel comparison. Production is untouched.
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/traffic.ts')?.name;if(!url)throw Error('Traffic module not observed');const {Traffic}=await import(url);window.windIgnoredContacts=0;Traffic.prototype.hit=()=>{window.windIgnoredContacts++;return undefined;};});
 await page.evaluate(()=>{const g=window.__drive;g.reset({distance:2425,speed:0});g.controls({gas:false,brake:true,steer:0});g.manual(false);});await page.waitForTimeout(2500);
 const before=await page.evaluate(()=>window.__drive.snapshot());await page.screenshot({path:`${root}/before.png`});
 const result=await page.evaluate(async()=>{
  const canvas=[...document.querySelectorAll('canvas')].find(c=>c.width>400&&c.height>200),stream=canvas.captureStream(30),chunks=[];
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4000000});
  const read=async()=>{await new Promise(r=>requestAnimationFrame(r));const c=document.createElement('canvas');c.width=1280;c.height=576;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,1280,576);return ctx.getImageData(920,215,340,40).data;};
  const start=await read();recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(r=>recorder.onstop=r);recorder.start();
  await new Promise(r=>setTimeout(r,8000));const end=await read();recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
  let difference=0,changed=0;for(let i=0;i<start.length;i+=4){const delta=(Math.abs(start[i]-end[i])+Math.abs(start[i+1]-end[i+1])+Math.abs(start[i+2]-end[i+2]))/3;difference+=delta;if(delta>3)changed++;}
  return {bytes:Array.from(new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())),meanRGBDifference:difference/(start.length/4),changedFraction:changed/(start.length/4),roi:{x:920,y:215,width:340,height:40}};
 });
 await page.screenshot({path:`${root}/after.png`});const after=await page.evaluate(()=>window.__drive.snapshot()),isolatedSteps=await page.evaluate(()=>window.windIgnoredContacts);
 await writeFile(`${root}/rice-waves.webm`,Buffer.from(result.bytes));delete result.bytes;
 const report={browser:'Desktop Edge; stationary normal chase camera, traffic collision isolated in this test page only; not Pixel 8',errors,isolatedSteps,before,after,...result};await writeFile(`${root}/wind.json`,JSON.stringify(report,null,2));
 assert.deepEqual(errors,[]);assert.ok(isolatedSteps>100);assert.ok(Math.abs(before.distance-after.distance)<.01);assert.deepEqual(before.camera.position,after.camera.position);assert.ok(result.meanRGBDifference>1);assert.ok(result.changedFraction>.10);console.log(JSON.stringify(result));
}finally{await browser.close();}
