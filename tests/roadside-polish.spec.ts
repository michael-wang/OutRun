import {test,expect} from '@playwright/test';
import {stageReady} from './stage-ready';

test('r7 omits all experimental near-road stone obstacles while preserving a drivable route',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:960,height:432});
 await page.goto('/?qa=1&seed=1');
 await stageReady(page);await page.locator('#l2-play').click();
 const result=await page.evaluate(()=>{
  const g=(window as any).__drive;
  g.manual(true);
  g.reset({distance:1850,lateral:0,speed:65});
  return {rocks:g.rocks(),cones:g.cones(),ready:g.streaming().ready};
 });
 expect(result.rocks.sections).toHaveLength(0);
 expect(result.rocks.contact.impacts).toBe(0);
 expect(result.cones.recipe.some((c:any)=>c.rockWarning)).toBe(false);
 await stageReady(page);
 const driving=await page.evaluate(()=>{
  const g=(window as any).__drive;
  g.advance(.2,{gas:true,brake:false,steer:0});
  return {distance:g.snapshot().distance,stalls:g.streamSafety().stalls};
 });
 expect(driving.distance).toBeGreaterThan(1850);
 expect(driving.stalls).toBe(0);
});

test('broken-down non-car traffic emits pooled smoke and remains stationary',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:960,height:432});
 await page.goto('/?qa=1&seed=1');
 await stageReady(page);await page.locator('#l2-play').click();
 const stops=await page.evaluate(()=>(window as any).__drive.breakdowns() as {type:number;distance:number;id:number}[]);
 expect(stops.some(h=>h.type!==0)).toBe(true);
 const stop=stops.find(h=>h.type!==0)!;
 await page.evaluate(({distance})=>{
  const g=(window as any).__drive;
  g.manual(true);g.reset({distance:distance-240,speed:0});
 },stop);
 await stageReady(page);
 const first=await page.evaluate(()=>({traffic:(window as any).__drive.traffic(),stream:(window as any).__drive.streamSafety()}));
 const actor=first.traffic.actors.find((a:any)=>a.id===stop.id);
 expect(actor?.type).toBe(stop.type);
 expect(actor?.speed).toBe(0);
 expect(first.traffic.breakdownSmoke).toBeGreaterThanOrEqual(4);
 expect(first.traffic.breakdownSmoke).toBeLessThanOrEqual(first.traffic.smokeCapacity);
 expect(first.stream.stalls).toBe(0);
 await page.evaluate(()=>{const g=(window as any).__drive;g.advance(.3,{gas:false,brake:false,steer:0});});
 const after=await page.evaluate(()=>(window as any).__drive.traffic());
 expect(after.actors.find((a:any)=>a.id===stop.id)?.distance).toBeCloseTo(actor.distance,3);
 expect(after.breakdownSmoke).toBeGreaterThan(0);
});
