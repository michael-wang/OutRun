import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const root='docs/evidence/streaming-s1';
test('delayed preparation distinguishes absent scenery from attached road',async({browser})=>{
 test.setTimeout(120000);mkdirSync(root,{recursive:true});
 const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();
 await p.goto('/?seed=7&streamdiag=1');await stageReady(p);await p.locator('#l2-play').tap();
 await p.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.streamFaults({delayMs:2000,fromIndex:6,fail:false});g.reset({distance:6350,speed:60,lateral:0});});
 await p.waitForFunction(()=>{const d=(window as any).__streamDiagnostics.snapshot();return d.stream.currentRoad&&d.stream.pending?.kind==='prepare'&&d.lifecycle.nearby.some((x:any)=>x.index===6&&x.attachedInstances===0);});
 const read=()=>p.evaluate(()=>(window as any).__streamDiagnostics.snapshot());
 const scheduling=await read();await p.screenshot({path:root+'/delayed-scenery-scheduling.png'});
 await p.waitForFunction(()=>{const d=(window as any).__streamDiagnostics.snapshot();return d.stream.pending?.kind==='scenery'&&d.stream.pending.index===6;},null,{timeout:40000});
 const generation=await read();await p.screenshot({path:root+'/delayed-scenery-worker.png'});
 await p.evaluate(()=>{const g=(window as any).__drive;g.streamFaults({delayMs:0,fromIndex:0,fail:false});g.controls({gas:false,brake:false,steer:0});g.manual(false);});
 await p.waitForTimeout(500);const driving=await read();expect(driving.distance).toBeGreaterThan(generation.distance);expect(driving.held).toBe(false);
 await p.waitForFunction(()=>{const d=(window as any).__streamDiagnostics.snapshot();return d.lifecycle.chunks.find((c:any)=>c.index===6)?.scenery==='ready';},null,{timeout:15000});
 const recovered=await read(),chunk=recovered.lifecycle.chunks.find((c:any)=>c.index===6);
 expect(chunk.generatedInstances).toBeGreaterThan(0);expect(chunk.attachedInstances).toBe(chunk.generatedInstances);expect(recovered.stream.fatal).toBe('');
 await p.screenshot({path:root+'/delayed-scenery-recovered.png'});
 writeFileSync(root+'/delayed-scenery.json',JSON.stringify({conditions:'Targeted DEV reset to 6350m; 2s Worker delay per request >= chunk 6; not continuous journey',scheduling,generation,driving,recovered},null,2));await c.close();
});

test('diagnostic overhead at a fixed streamed view, alternating off/on',async({browser})=>{
 test.setTimeout(180000);mkdirSync(root,{recursive:true});const runs=[];
 for(const enabled of [false,true,true,false]){
  const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();
  await p.goto('/?seed=2&perf=1&streamdiag='+(enabled?'1':'0'));await stageReady(p);
  await p.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:14000,speed:60,lateral:0});});await stageReady(p);await p.waitForTimeout(2000);
  const rows=[];for(let i=0;i<20;i++){await p.waitForTimeout(1000);rows.push(await p.evaluate(()=>{const w=window as any;return {perf:w.__drive.perf(),memory:w.__drive.scenery().memory,draws:w.__drive.scenery().render.calls};}));}
  const snapshotCosts=enabled?await p.evaluate(()=>{const a=[];for(let i=0;i<100;i++){const t=performance.now();(window as any).__streamDiagnostics.snapshot();a.push(performance.now()-t);}return a;}):[];
  runs.push({enabled,rows,snapshotCosts});await c.close();
 }
 writeFileSync(root+'/overhead.json',JSON.stringify({conditions:'Edge, 960x432 DPR2 touch, fixed Seed 2 14000m, 20s per run after ready and 2s warmup; off/on/on/off; perf=1 both; no gameplay or Worker load during measured view',runs},null,2));
 const avg=(enabled:boolean)=>{const a=runs.filter(r=>r.enabled===enabled).flatMap(r=>r.rows.map(r=>r.perf.fps));return a.reduce((a,b)=>a+b,0)/a.length;};expect(avg(true)).toBeGreaterThan(avg(false)*.95);
});

test('capture standard V8 Worker CPU profile for late-route preparation',async({browser})=>{
 test.setTimeout(90000);mkdirSync(root,{recursive:true});const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto('/?seed=1&streamdiag=1');await stageReady(p);
 const cdp=await browser.newBrowserCDPSession(),targets=await cdp.send('Target.getTargets'),target=targets.targetInfos.find(t=>t.type==='worker'&&t.url.includes('road-worker'))!;expect(target).toBeTruthy();
 const {sessionId}=await cdp.send('Target.attachToTarget',{targetId:target.targetId,flatten:false});let id=0;const pending=new Map<number,{resolve:(x:any)=>void;reject:(x:any)=>void}>();
 cdp.on('Target.receivedMessageFromTarget',event=>{if(event.sessionId!==sessionId)return;const message=JSON.parse(event.message),p=pending.get(message.id);if(p){pending.delete(message.id);if(message.error)p.reject(message.error);else p.resolve(message.result);}});
 const send=(method:string,params={})=>new Promise<any>((resolve,reject)=>{const request=++id;pending.set(request,{resolve,reject});cdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id:request,method,params})}).catch(reject);});
 await send('Profiler.enable');await send('Profiler.start');await p.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:55350,speed:60,lateral:0});});await stageReady(p);
 const {profile}=await send('Profiler.stop');writeFileSync(root+'/worker-late-route.cpuprofile',JSON.stringify(profile));
 const functions=profile.nodes.map((n:any)=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,selfSamples:n.hitCount??0})).filter((n:any)=>n.selfSamples>0).sort((a:any,b:any)=>b.selfSamples-a.selfSamples);
 writeFileSync(root+'/worker-profile-summary.json',JSON.stringify({conditions:'Standard V8 sampling profiler; Seed 1 reset to 55350m, six newly desired chunks, no injected delay; diagnostic overhead of sampling applies',durationMs:(profile.endTime-profile.startTime)/1000,functions,snapshot:await p.evaluate(()=>(window as any).__streamDiagnostics.snapshot())},null,2));
 await cdp.detach();await c.close();
});


test('production export preserves bounded lifecycle evidence without debug controls',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?seed=1&streamdiag=1');await page.waitForFunction(()=>(window as any).__streamDiagnostics?.snapshot().stream.fullyReady,null,{timeout:60000});
 expect(await page.evaluate(()=>typeof (window as any).__drive)).toBe('undefined');
 const dl=page.waitForEvent('download');await page.getByText('Export stream log',{exact:true}).click();await (await dl).saveAs(root+'/production-export.json');
 const data=JSON.parse(readFileSync(root+'/production-export.json','utf8'));expect(data.latest.lifecycle.records.length).toBeGreaterThan(0);expect(data.latest.lifecycle.records.length).toBeLessThanOrEqual(256);expect(data.samples.length).toBeLessThanOrEqual(900);expect(data.latest.lifecycle.gpuCompletion).toBeNull();expect(data.latest.lifecycle.nearby.every((c:any)=>c.generatedInstances===c.attachedInstances)).toBe(true);
});
