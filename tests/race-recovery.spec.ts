import {test,expect,type Page} from '@playwright/test';
import {RACE_CHECKPOINT_KEY} from '../src/race-recovery';

test.use({viewport:{width:915,height:412},isMobile:true,hasTouch:true,serviceWorkers:'block'});
async function raceMenu(page:Page){
 await page.goto('/?trafficSeed=17');
 await page.locator('#boot-enter').tap();
 await page.locator('#start-race').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:120000});
}
test('phone-call style reload restores race, traffic and time as a paused game',async({page})=>{
 test.setTimeout(240000);
 await raceMenu(page);
 await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.race().time),{timeout:15000}).toBeGreaterThan(1.5);
 await page.keyboard.up('Space');
 await page.locator('#pause').tap();
 await expect(page.locator('#trip-pause-dock')).toBeVisible();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'null'),RACE_CHECKPOINT_KEY);
 expect(saved).not.toBeNull();
 expect(saved.race.rivals).toHaveLength(7);
 expect(saved.traffic.world.cars.length).toBeGreaterThan(0);
 await page.reload();
 await expect(page.locator('#trip-pause-dock')).toBeVisible({timeout:120000});
 const recovered=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {race:g.race(),state:g.driveState(),traffic:g.trafficWorld()};
 });
 expect(recovered.state.mode).toBe('paused');
 expect(recovered.state.distance).toBeCloseTo(saved.player.distance,3);
 expect(recovered.race.time).toBeCloseTo(saved.race.time,3);
 expect(recovered.race.rivals.map((r:any)=>r.distance)).toEqual(saved.race.rivals.map((r:any)=>r.distance));
 expect(recovered.traffic.total).toBe(saved.traffic.world.cars.length);
 await page.locator('#tp-resume').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.race().time)).toBeGreaterThan(saved.race.time+.2);
});
test('a deliberate return to stage select clears the checkpoint',async({page})=>{
 test.setTimeout(180000);
 await raceMenu(page);
 await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.race().time),{timeout:15000}).toBeGreaterThan(.5);
 await page.keyboard.up('Space');
 await page.locator('#pause').tap();
 await page.locator('#tp-exit').tap();
 await expect(page.locator('#racing-menu')).toBeVisible();
 expect(await page.evaluate(key=>localStorage.getItem(key),RACE_CHECKPOINT_KEY)).toBeNull();
});
