import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
test('extreme traffic is encountered and cleanly passed in gameplay',async({page})=>{
 await page.setViewportSize({width:960,height:432});await page.goto('/?seed=1&perf=1');await stageReady(page);await page.addStyleTag({content:'#perf,#immersive-note{display:none!important}'});await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 const target=await page.evaluate(()=>(window as any).__drive.trafficSchedule().find((a:any,_:number,list:any[])=>a.type===0&&a.speed*3.6>250&&!list.some(b=>b.type===0&&b.distance>a.distance&&b.distance<a.distance+550)));
 await page.evaluate(a=>(window as any).__drive.reset({distance:a.distance-180,speed:80,lateral:1.75}),target);await stageReady(page);
 await page.evaluate(()=>{const w=window as any,g=w.__drive;w.chunks=[];w.rec=new MediaRecorder(document.querySelector('canvas')!.captureStream(30),{mimeType:'video/webm;codecs=vp8'});w.rec.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.rec.start();g.manual(false);w.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:true,brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer+(1.75-s.lateral)*.2-s.lateralRate*.06))});},16);});
 const rows=[];let shot=false;for(let i=0;i<30;i++){await page.waitForTimeout(150);const r=await page.evaluate(id=>{const g=(window as any).__drive,t=g.traffic();return {state:g.snapshot(),actor:t.actors.find((a:any)=>a.id===id),impacts:t.impacts};},target.id);rows.push(r);if(!shot&&r.actor&&r.actor.distance-r.state.distance<60){await page.screenshot({path:'docs/evidence/living-traffic/fast.png',scale:'css'});shot=true;}}
 const bytes=await page.evaluate(async()=>{const w=window as any;clearInterval(w.driver);w.__drive.manual(true);await new Promise<void>(r=>{w.rec.onstop=r;w.rec.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync('docs/evidence/living-traffic/fast.webm',Buffer.from(bytes));writeFileSync('docs/evidence/living-traffic/fast.json',JSON.stringify(rows,null,2));
 expect(rows.filter(r=>r.actor&&r.actor.speed*3.6>250).length).toBeGreaterThan(12);expect(rows.some(r=>r.actor&&r.actor.distance<r.state.distance)).toBe(true);expect(rows.at(-1)!.impacts).toBe(0);
});
