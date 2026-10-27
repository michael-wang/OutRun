import {test,expect,chromium} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c';mkdirSync(root,{recursive:true});
test('production lab plays and reviews without a development driver',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?lab=bricks&brick=BRK-03');
 await expect(page.locator('#brick-progress')).toContainText('8 unreviewed');
 expect(await page.evaluate(()=>'__drive' in window)).toBe(false);
 await page.locator('#brick-play').click();await page.keyboard.down('Space');
 await expect(page.locator('#brick-lab')).toBeHidden();
 await page.waitForTimeout(500);await page.keyboard.up('Space');await page.locator('#pause').click();
 await expect(page.locator('#brick-lab')).toBeVisible();await expect(page.locator('#brick-select')).toHaveValue('BRK-03');
});
test('lab defaults, human review isolation, capped notes and portable export survive a browser restart',async()=>{
 const profile=resolve('test-results/brick-review-profile');
 let context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,acceptDownloads:true}),page=await context.newPage();
 await page.goto('http://127.0.0.1:5173/?lab=bricks');await expect(page.locator('#brick-progress')).toContainText('8 unreviewed');
 await page.locator('[data-vote=REWORK]').click();await page.locator('#brick-note').fill('Test context only — needs a clearer warning.');await context.close();
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,acceptDownloads:true});page=await context.newPage();await page.goto('http://127.0.0.1:5173/?lab=bricks');
 await expect(page.locator('[data-vote=REWORK]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#brick-note')).toHaveValue('Test context only — needs a clearer warning.');
 const downloadPromise=page.waitForEvent('download');await page.locator('#brick-export').click();const data=JSON.parse(readFileSync((await (await downloadPromise).path())!,'utf8'));
 expect(data.records).toHaveLength(8);expect(data.records[0]).toMatchObject({id:'BRK-01',revision:2,humanVote:'REWORK'});expect(data.records.slice(1).every((r:any)=>r.humanVote==='UNREVIEWED')).toBe(true);expect(data.engineVersion).toBeTruthy();expect(data.records.every((r:any)=>Number.isInteger(r.seed))).toBe(true);
 await page.locator('#brick-next').click();await expect(page.locator('#brick-select')).toHaveValue('BRK-02');await expect(page.locator('#brick-note')).toHaveValue('');
 await page.locator('[data-vote=KEEP]').click();await expect(page.locator('[data-vote=KEEP]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-vote=REJECT]').click();await expect(page.locator('[data-vote=REJECT]')).toHaveAttribute('aria-pressed','true');
 await context.close(); // Dedicated test profile only; never the owner's browser.
});
test('all eight render continuous road, deterministic replay and unchanged human defaults',async({page})=>{
 for(let i=1;i<=8;i++){
  await page.goto(`/?lab=bricks&brick=BRK-0${i}`);await expect(page.locator('#brick-progress')).toContainText('8 unreviewed');
  const before=await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick();return {fingerprint:g.sceneFingerprint(),samples:Array.from({length:20},(_,i)=>g.sample(350+b.length*i/20)),state:g.snapshot(),memory:g.scenery().memory};});
  await page.locator('#brick-play').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.advance(.4,{gas:true,brake:false,steer:.5});});await page.locator('#pause').click();await page.locator('#brick-replay').click();
  const replay=await page.evaluate(()=>{const g=(window as any).__drive;return {fingerprint:g.sceneFingerprint(),s:g.snapshot(),memory:g.scenery().memory};});expect(replay.memory).toEqual(before.memory);expect(replay.fingerprint).toEqual(before.fingerprint);expect(replay.s.distance).toBe(350);expect(replay.s.lateral).toBe(0);expect(replay.s.appliedSteer).toBe(0);
  const hits=await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick();return Array.from({length:Math.ceil(b.length/15)},(_,i)=>g.surfaceProbe(350+i*15));});
  const obstacles=await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick(),hits=[];for(let d=350;d<350+b.length;d+=20)for(const x of [-g.sample(d).halfWidth+1,0,g.sample(d).halfWidth-1]){const h=g.sceneryProbe(d,x);if(h.length)hits.push({d,x,h});}return hits;});expect(obstacles).toEqual([]);
  for(const p of hits){expect(p.hits.length).toBeGreaterThan(0);expect(p.hits[0].name).toBe('driving-surface');expect(Math.abs(p.hits[0].error)).toBeLessThan(.06);}
  await page.reload();expect(await page.evaluate(()=>(window as any).__drive.sceneFingerprint())).toEqual(before.fingerprint);
 }
});
test('lab mobile controls, hand swap, review pause and compact layouts',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/?lab=bricks');await page.screenshot({path:`${root}/lab-960.png`});
 for(const swapped of [false,true]){
  if(swapped){await page.locator('#brick-settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();}
  await page.locator('#brick-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));const touch=await touchDriver(page,context);await touch(.5,true,false);await page.evaluate(()=>(window as any).__drive.advance(.1));
  const s=await page.evaluate(()=>(window as any).__drive.snapshot());expect(s.inputs.gas).toBe(true);expect(s.inputs.steer).toBeGreaterThan(0);await expect(page.locator('#brick-lab')).toBeHidden();
  await touch(null,true,false);expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs.gas)).toBe(true);await touch(null,false,false);await page.locator('#pause').click();await expect(page.locator('#brick-lab')).toBeVisible();
 }
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:`${root}/lab-844.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:1280,height:720});await page.screenshot({path:`${root}/lab-1280.png`});await page.getByRole('link',{name:'Free drive'}).click();await expect(page.locator('#drive')).toBeVisible();await expect(page.locator('#brick-lab')).toHaveCount(0);await context.close();
});
