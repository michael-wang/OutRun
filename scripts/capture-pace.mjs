import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.3.2';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const selected=process.argv[2]? [Number(process.argv[2])]:[1,1.5,1.75,2];
for(const pace of selected)for(const [label,speed,seconds] of [['low',80/3.6,4.5],['mid',150/3.6,4.5],['high',65,4.5],['launch',0,24]]){
 const dir=`${root}/pace-${pace}`;mkdirSync(dir,{recursive:true});
 const context=await browser.newContext({viewport:{width:960,height:432},recordVideo:{dir,size:{width:960,height:432}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://localhost:5173/?pace=${pace}`);await page.locator('#drive').click();
 await page.evaluate(async({speed,label,pace})=>{
  const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),driver=scriptedDriver(),g=window.__drive;
  g.reset({distance:label==='launch'?0:400,speed});window.paceTrace=[];
  const clock=document.createElement('div');clock.style.cssText='position:fixed;left:40%;top:36px;background:#123e;color:white;padding:4px;font:12px monospace';document.body.append(clock);
  window.paceTimer=setInterval(()=>{
   const s=g.snapshot(),target=label==='launch'?plannedSpeed(s.distance,g.sample,pace):speed;
   const input=driver(s,g.sample(s.distance).curvature,target);input.gas=s.speed<target;input.brake=s.speed>target+2;
   if(label==='launch'&&s.elapsed>17&&s.elapsed<18){input.gas=false;input.brake=true;}
   g.controls(input);clock.textContent=`${pace}× ${label} ${s.elapsed.toFixed(1)}s`;
   window.paceTrace.push({...s,controls:input,frame:g.framing(),wall:performance.now()});
  },50);
 },{speed,label,pace});
 await page.waitForTimeout(seconds*1000);
 const data=await page.evaluate(()=>{clearInterval(window.paceTimer);const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {audit:window.__drive.audit(),trace:window.paceTrace,renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'};});
 await page.screenshot({path:`${dir}/${label}.png`});const video=page.video();await context.close();await video.saveAs(`${dir}/${label}.webm`);unlinkSync(await video.path());
 writeFileSync(`${dir}/${label}.json`,JSON.stringify({pace,label,errors,...data},null,2));
 const avg=key=>data.audit.reduce((sum,r)=>sum+r[key],0)/data.audit.length;
 console.log(JSON.stringify({pace,label,mps:avg('worldMetersPerSecond'),fps:avg('fps'),offroad:data.trace.filter(s=>s.offRoad).length,errors}));
}
await browser.close();
