import {test,expect} from '@playwright/test';
import {stageReady} from './stage-ready';

test('r7 outer-bend boulders look large and produce geometry-driven crash reactions',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:960,height:432});
 await page.goto('/?qa=1&seed=1');
 await stageReady(page);await page.locator('#l2-play').click();
 const rock=await page.evaluate(()=>((window as any).__drive.rocks().boulders as any[])[0]);
 expect(rock).toBeDefined();
 await page.evaluate(r=>{
  const g=(window as any).__drive,d=r.distance-90;
  g.manual(true);g.reset({distance:d,lateral:0,speed:40});
 },rock);
 await stageReady(page);
 await page.screenshot({path:'test-results/rock-outcrop-approach.png',scale:'css'});
 const impact=await page.evaluate(r=>{
  const g=(window as any).__drive,d=r.distance-r.radiusD-5;
  g.reset({distance:d,speed:70,lateral:r.lateral});
  const before=g.snapshot().speed;
  g.advance(.20,{gas:true,brake:false,steer:0});
  return {before,after:g.snapshot().speed,contact:g.rocks().contact,stream:g.streamSafety()};
 },rock);
 expect(impact.contact.impacts).toBeGreaterThan(0);
 expect(impact.after).toBeLessThan(impact.before);
 expect(impact.stream.stalls).toBe(0);
});

test('warned cone flies forward and makes a plastic impact sound, not an invisible slowdown',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:960,height:432});
 await page.goto('/?qa=1&seed=1');
 await stageReady(page);await page.locator('#l2-play').click();
 const warning=await page.evaluate(()=>((window as any).__drive.cones().recipe as any[]).find(c=>c.rockWarning));
 expect(warning).toBeDefined();
 await page.evaluate(c=>{
  const g=(window as any).__drive;
  g.manual(true);g.reset({distance:c.distance-10,lateral:c.lateral,speed:65});
 },warning);
 await stageReady(page);
 const result=await page.evaluate(c=>{
  const g=(window as any).__drive;
  g.advance(.18,{gas:true,brake:false,steer:0});
  return {hit:g.cones().hit,flight:g.cones().trajectories,audio:g.snapshot().audio,stream:g.streamSafety()};
 },warning);
 expect(result.hit).toContain(warning.id);
 expect(result.flight.find((f:any)=>f.id===warning.id)?.forward).toBeGreaterThan(40);
 expect(result.audio.coneHitCount).toBeGreaterThan(0);
 expect(result.stream.stalls).toBe(0);
 await page.screenshot({path:'test-results/rock-warning-cone-flight.png',scale:'css'});
});
