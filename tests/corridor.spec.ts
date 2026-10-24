import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CORRIDOR_LIMIT } from '../src/handling';

for (const [side,distance,width,height] of [[-1,740,1280,720],[1,240,960,432]]) {
  test(`rendered boundary ${side}: 15s outward hold, neutral contact and inward recovery`, async ({page}) => {
    await page.setViewportSize({width,height});
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');await page.locator('#drive').click();
    const snapshot=()=>page.evaluate(()=>(window as any).__drive.snapshot());
    await page.evaluate(distance=>(window as any).__drive.reset({distance,speed:55}),distance);
    const outward=side<0?'a':'d',inward=side<0?'d':'a';
    await page.keyboard.down('w');await page.keyboard.down(outward);
    await expect.poll(async()=>(await snapshot()).corridorSide,{timeout:8000}).toBe(side);
    mkdirSync('docs/evidence/v0.2.1',{recursive:true});
    const trace:any[]=[];const start=await snapshot(),wallStart=Date.now();
    await page.screenshot({path:`docs/evidence/v0.2.1/boundary-${side}-entry.png`});
    // Real wall-clock gameplay, not a simulated-time-only acceptance test.
    for(let i=0;i<15;i++) {
      await page.waitForTimeout(1000);const s=await snapshot();trace.push(s);
      expect(s.lateral).toBe(side*CORRIDOR_LIMIT);expect(s.offRoad).toBe(true);
      expect(s.worldHeading).toBe(start.worldHeading);expect(s.distance).toBeGreaterThan(i?trace[i-1].distance:start.distance);
      expect(s.inputs).toEqual({gas:true,brake:false,steer:side});
      if(i===7||i===14)await page.screenshot({path:`docs/evidence/v0.2.1/boundary-${side}-${i+1}s.png`});
    }
    const wallHoldMs=Date.now()-wallStart;
    expect(wallHoldMs).toBeGreaterThanOrEqual(15000);
    expect(trace.at(-1).speed).toBeLessThan(start.speed);
    expect(trace.at(-1).distance-start.distance).toBeGreaterThan(100);
    await page.keyboard.up(outward);await page.waitForTimeout(1500);
    const neutral=await snapshot();expect(neutral.lateral).toBe(side*CORRIDOR_LIMIT);expect(neutral.worldHeading).toBe(start.worldHeading);
    const recoveryStart=Date.now();await page.keyboard.down(inward);
    await expect.poll(async()=>(await snapshot()).offRoad,{timeout:6000,intervals:[50]}).toBe(false);
    await page.keyboard.up(inward);await page.keyboard.up('w');
    const recovered=await snapshot(),recoveryMs=Date.now()-recoveryStart;expect(recovered.corridorSide).toBe(0);
    await page.screenshot({path:`docs/evidence/v0.2.1/boundary-${side}-recovered.png`});
    expect(errors).toEqual([]);
    writeFileSync(`docs/evidence/v0.2.1/boundary-${side}.json`,JSON.stringify({start,trace,neutral,recovered,recoveryMs,wallHoldMs,errors},null,2));
  });
}
