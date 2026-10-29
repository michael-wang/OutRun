import {test,expect} from '@playwright/test';

test('travel animates all wheels and occupants; stopping and pause freeze their motion',async({page})=>{
 await page.goto('/?mode=free');await page.locator('#drive').click();
 const result=await page.evaluate(()=>{
  const g=(window as any).__drive;g.manual(true);g.reset({distance:100,speed:0});g.advance(.5,{gas:false,brake:true,steer:0});const stopped=g.wheels();
  const c=g.challenges().find((c:any)=>c.id==='high');
  g.reset({distance:c.start+c.transitionLength,speed:65});g.advance(1,{gas:true,brake:false,steer:.75});const fast={w:g.wheels(),p:g.occupants()};
  return {stopped,fast};
 });
 await page.locator('#pause').click();
 const paused=await page.evaluate(()=>{const g=(window as any).__drive;g.advance(1);return {w:g.wheels(),p:g.occupants()};});
 expect(result.stopped.every((w:any)=>w.angle===0)).toBe(true);
 expect(result.fast.w.every((w:any)=>w.angle>100)).toBe(true);
 expect(result.fast.w.filter((w:any)=>w.front).every((w:any)=>w.steer<-.2)).toBe(true);
 expect(result.fast.w.filter((w:any)=>!w.front).every((w:any)=>w.steer===0)).toBe(true);
 expect(result.fast.p.wind).toBeGreaterThan(.98);
 expect(paused.w.map((w:any)=>w.angle)).toEqual(result.fast.w.map((w:any)=>w.angle));
 expect(paused.p).toEqual(result.fast.p);
});

test('stage inspection starts are distance based and do not start autonomous controls',async({page})=>{
 for(const stage of ['coast','canyon','city']){
  await page.goto(`/?stage=${stage}`);await page.locator('#drive').click();
  const result=await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);return {s:g.snapshot(),acts:g.acts(),art:g.scenery()};});
  const act=result.acts.find((a:any)=>a.id===stage),index=result.acts.indexOf(act);
  expect(result.s.distance).toBeGreaterThan(act.start);expect(result.s.distance).toBeLessThan(act.end);
  expect(result.s.inputs.gas).toBe(false);expect(result.s.inputs.steer).toBe(0);expect(result.art.weights[index]).toBe(1);
 }
});
