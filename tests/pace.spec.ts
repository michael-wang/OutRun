import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {scriptedDriver} from './driver';
test('all pace selections keep framing and hands-off departure; default is 1.75',async({page})=>{
 mkdirSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2',{recursive:true});const results=[];
 await page.setViewportSize({width:960,height:432});
 for(const pace of [1,1.5,1.75,2]){
  await page.goto(`/?pace=${pace}`);await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));
  await page.evaluate(()=>(window as any).__drive.reset({distance:420,speed:65}));
  const data=await page.evaluate(()=>({s:(window as any).__drive.snapshot(),frame:(window as any).__drive.framing()}));
  expect(data.s.highSpeedPace).toBe(pace);expect(data.s.travelSpeed).toBe(65*pace);
  expect(data.frame.width).toBeGreaterThan(.20);expect(data.frame.width).toBeLessThan(.26);expect(data.s.camera.distance).toBe(8);expect(data.s.camera.fov).toBeCloseTo(38.741159);
  await page.screenshot({path:`docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/phone-${pace}.png`});results.push(data);
  for(const distance of [600,1300]){
   await page.evaluate(distance=>{const g=(window as any).__drive;g.reset({distance,speed:55});},distance);
   const before=await page.evaluate(()=>(window as any).__drive.snapshot());
   await page.evaluate(()=>(window as any).__drive.advance(5,{gas:true,brake:false,steer:0}));
   const after=await page.evaluate(()=>(window as any).__drive.snapshot());expect(after.offRoad).toBe(true);expect(Math.abs(after.lateral)).toBeGreaterThan(5);
  }
 }
 await page.goto('/?mode=free');await page.locator('#drive').click();expect(await page.evaluate(()=>(window as any).__drive.snapshot().highSpeedPace)).toBe(1.75);
 await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:420,speed:65});});await page.screenshot({path:'docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/desktop-default.png'});
 writeFileSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/framing.json',JSON.stringify(results,null,2));
});
for(const pace of [1.75,2])test(`pace ${pace} normal bend with real keyboard input remains controllable`,async({page})=>{
 await page.goto(`/?pace=${pace}`);await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.reset({distance:560,speed:65}));
 const driver=scriptedDriver(),trace:any[]=[];
 for(let i=0;i<90;i++){
  const s=await page.evaluate(()=>(window as any).__drive.snapshot()),k=await page.evaluate(d=>(window as any).__drive.sample(d).curvature,s.distance+s.travelSpeed*.25),input=driver(s,k);
  // Keys move the virtual wheel, rather than directly selecting vehicle yaw.
  input.steer=Math.abs(input.steer)<.015?0:Math.sign(input.steer-(await page.evaluate(()=>(window as any).__drive.steering().rawSteer)));
  for(const [key,active] of [['Space',input.gas],['Enter',input.brake],['a',input.steer<0],['d',input.steer>0]] as const){if(active)await page.keyboard.down(key);else await page.keyboard.up(key);}
  await page.waitForTimeout(50);trace.push(s);
 }
 await page.screenshot({path:`docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/keyboard-bend-${pace}.png`});writeFileSync(`docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/keyboard-bend-${pace}.json`,JSON.stringify(trace,null,2));
 expect(trace.every(s=>!s.offRoad)).toBe(true);expect(trace.at(-1).distance).toBeGreaterThan(1000);
});
test('2x real 30/60 render callback consistency and clean console',async({browser})=>{
 const runs=[];
 for(const half of [false,true]){
  const context=await browser.newContext({viewport:{width:960,height:432}}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(half)await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>raf(()=>raf(fn));});
  await page.goto('http://127.0.0.1:5173/?pace=2&velocity');await page.locator('[data-speed="65"]').click();await page.waitForTimeout(3300);
  const rows=await page.evaluate(()=>(window as any).__drive.audit());expect(errors).toEqual([]);
  const average=(key:string)=>rows.reduce((n:number,r:any)=>n+r[key],0)/rows.length;
  runs.push({half,fps:average('fps'),mps:average('worldMetersPerSecond'),rows,errors});await context.close();
 }
 expect(runs[1].fps/runs[0].fps).toBeCloseTo(.5,1);expect(runs[1].mps/runs[0].mps).toBeCloseTo(1,1);expect(runs[1].mps).toBeGreaterThan(125);
 writeFileSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.3.2/fps-audit.json',JSON.stringify(runs,null,2));
});
