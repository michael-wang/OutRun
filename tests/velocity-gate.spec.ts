import { test,expect } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
test('Velocity Gate measures wall-clock world travel and calibration is explicitly opt-in',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:960,height:432});await page.goto('/?velocity&pace=1');
 await expect(page.locator('#velocity-calibration')).toBeVisible();
 const measurements:any[]=[];
 for(const target of [22.22,65]){
  await page.locator(`[data-speed="${target}"]`).click();
  await page.waitForTimeout(4200);
  const data=await page.evaluate(()=>({rows:(window as any).__drive.audit(),state:(window as any).__drive.snapshot(),frame:(window as any).__drive.framing()}));
  expect(data.rows.length).toBeGreaterThanOrEqual(3);
  for(const row of data.rows){
   expect(row.worldMetersPerSecond).toBeGreaterThan(target*.95);
   expect(row.worldMetersPerSecond).toBeLessThan(target*1.06);
   expect(row.roadWidthsPerSecond).toBeCloseTo(row.worldMetersPerSecond/14,5);
   expect(row.simulationSeconds/row.wallSeconds).toBeCloseTo(1,1);
   expect(row.cameraMetersPerSecond).toBeGreaterThan(target*.85);
  }
  expect(data.frame.left).toBeGreaterThan(0);expect(data.frame.right).toBeLessThan(1);
  measurements.push(data);
 }
 const average=(rows:any[],field:string)=>rows.reduce((sum,row)=>sum+row[field],0)/rows.length;
 expect(average(measurements[1].rows,'worldMetersPerSecond')/average(measurements[0].rows,'worldMetersPerSecond')).toBeGreaterThan(2.7);
 expect(average(measurements[1].rows,'markerPassesPerSecond')/average(measurements[0].rows,'markerPassesPerSecond')).toBeGreaterThan(2.3);
 expect(measurements[0].state.camera.fov).toBe(measurements[1].state.camera.fov);
 await page.locator('#velocity-exit').click();await expect(page.locator('#velocity-calibration')).toHaveCount(0);
 await expect(page.locator('#speed')).toBeVisible();
 await page.goto('http://127.0.0.1:4173/?velocity');await expect(page.locator('#velocity-calibration')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).__drive)).toBeUndefined();
 expect(errors).toEqual([]);mkdirSync('docs/evidence/v0.5/regressions/v0.3.1',{recursive:true});writeFileSync('docs/evidence/v0.5/regressions/v0.3.1/browser-audit.json',JSON.stringify({errors,measurements},null,2));
});
test('real rendering at 30 versus 60 callbacks per second preserves world speed',async({browser})=>{
 const runs:any[]=[];
 for(const halveFrames of [false,true]){
  const context=await browser.newContext({viewport:{width:960,height:432}}),page=await context.newPage();
  if(halveFrames)await page.addInitScript(()=>{const native=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>native(()=>native(callback));});
  await page.goto('http://127.0.0.1:5173/?velocity&pace=1');await page.locator('[data-speed="65"]').click();await page.waitForTimeout(3400);
  const rows=await page.evaluate(()=>(window as any).__drive.audit());expect(rows.length).toBeGreaterThanOrEqual(3);
  const average=(key:string)=>rows.reduce((sum:number,row:any)=>sum+row[key],0)/rows.length;
  runs.push({halveFrames,worldMetersPerSecond:average('worldMetersPerSecond'),fps:average('fps'),rows});
  await context.close();
 }
 expect(runs[1].fps/runs[0].fps).toBeGreaterThan(.4);expect(runs[1].fps/runs[0].fps).toBeLessThan(.6);
 expect(runs[1].worldMetersPerSecond/runs[0].worldMetersPerSecond).toBeCloseTo(1,1);
 writeFileSync('docs/evidence/v0.5/regressions/v0.3.1/frame-rate-audit.json',JSON.stringify(runs,null,2));
});
