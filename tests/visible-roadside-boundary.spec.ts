import {test,expect} from '@playwright/test';
import {stageReady} from './stage-ready';

test('r7 normal roadside: both directions visibly contact rails before hidden corridor limit',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:960,height:432});
 await page.goto('/?seed=1&qa=1');
 await stageReady(page);
 await page.locator('#l2-play').click();
 const rows=[];
 for(const distance of [350,3100,4500]){
  for(const side of [-1,1]){
   await page.evaluate(({distance,side})=>{
    const g=(window as any).__drive,half=g.sample(distance).halfWidth;
    g.manual(true);
    g.reset({distance,speed:60,lateral:side*(half+2.4)});
   },{distance,side});
   await stageReady(page);
   const row=await page.evaluate(()=>{
    const g=(window as any).__drive,s=g.snapshot(),before=g.surfaceFeedback().guard.impacts;
    g.advance(1/120,{gas:false,brake:false,steer:0});
    const after=g.snapshot(),guard=g.surfaceFeedback().guard,clearance=g.boundaryClearance();
    return {before,after:guard.impacts,distance:s.distance,side:Math.sign(s.lateral),speedBefore:s.speed,speedAfter:after.speed,
      halfWidth:s.roadHalfWidth,lateral:after.lateral,clearance,stalls:g.streamSafety().stalls};
   });
   expect(row.after,JSON.stringify(row)).toBe(1);
   expect(Math.abs(row.lateral)).toBeLessThan(row.halfWidth+2.6);
   expect(row.speedAfter).toBeLessThan(row.speedBefore);
   expect(row.clearance[row.side===-1?'left':'right']).toBeGreaterThanOrEqual(-.05);
   expect(row.stalls).toBe(0);
   rows.push(row);
  }
 }
 expect(rows).toHaveLength(6);
 await page.screenshot({path:'test-results/goal1-visible-roadside.png',scale:'css'});
});

test('special canyon rail and bridge still use their authored boundaries',async({page})=>{
 await page.goto('/?seed=1&qa=1');
 await stageReady(page);await page.locator('#l2-play').click();
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:750,speed:35,lateral:0});});
 const initial=await page.evaluate(()=>({clearance:(window as any).__drive.boundaryClearance(),safe:(window as any).__drive.streamSafety().safe}));
 expect(initial.clearance.right).not.toBeNull();
 expect(initial.clearance.left).toBeNull(); // no extra r7 rail in authored 600-900m canyon
 expect(initial.safe).toBe(true);
});
