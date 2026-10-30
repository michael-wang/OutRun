import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {stageReady} from './stage-ready';

test('trip has independent code, replay, review and retrospective position',async({page})=>{
 await page.goto('/?trip=10m&seed=42');await stageReady(page);
 await expect(page.locator('#l2-lab')).toContainText('10-Minute Road Trip');
 await expect(page.locator('#stage-seed')).toHaveValue('TRIP-v0.9-r3-16-ALB3');
 await expect(page.locator('#l2-progress')).toContainText('UNREVIEWED');
 await page.keyboard.press('KeyP');await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:60350,speed:60});g.advance(8,{gas:true,brake:false,steer:0});});
 await page.keyboard.press('KeyG');await page.keyboard.press('Digit2');await page.keyboard.press('Enter');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-trip-v09')!));const event:any=(Object.values(data)[0] as any).events[0];
 expect(event.eventAt.tripCode).toBe('TRIP-v0.9-r3-16-ALB3');expect(event.eventAt.s).toBeGreaterThan(60000);expect(event.eventAt.s).toBeLessThan(event.reactionAt.s);expect(event.eventAt.l2InstanceId).toBeTruthy();
 await expect(page.locator('#ready-countdown')).toBeHidden({timeout:2000});await page.keyboard.press('KeyP');
 const download=page.waitForEvent('download');await page.locator('#l2-export').click();const report=JSON.parse(readFileSync((await (await download).path())!,'utf8'));expect(report.records[0].tripCode).toBe('TRIP-v0.9-r3-16-ALB3');expect(report.records[0].humanVote).toBe('UNREVIEWED');
 await Promise.all([page.waitForURL(/trip=10m&seed=42/),page.locator('#stage-load').click()]);await stageReady(page);await expect(page.locator('#l2-events')).toContainText('1 praise');
});

test('trip on a phone-like screen keeps gas and steering independent',async({browser})=>{
 const {touchDriver}=await import('./touch-driver');const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();
 await page.goto('/?trip=10m&seed=2');await stageReady(page);await page.locator('#l2-play').tap();const touch=await touchDriver(page,context);await touch(.6,true,false);await page.waitForTimeout(250);
 const state=await page.evaluate(()=>(window as any).__drive.snapshot());expect(state.inputs.gas).toBe(true);expect(state.inputs.steer).toBeGreaterThan(.25);await touch(null,false,false);await context.close();
});

test('trip review and telemetry do not overwrite historical Stage data',async({page})=>{
 await page.goto('/?trip=10m&seed=3');await stageReady(page);const oldReview='{"historic":"unchanged"}',oldReport='[{"runId":"historic"}]';
 await page.evaluate(({oldReview,oldReport})=>{localStorage.setItem('outrun-stage-v083',oldReview);localStorage.setItem('outrun-drive-reports-v082',oldReport);},{oldReview,oldReport});
 await page.locator('#l2-play').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:69345,speed:60});g.advance(.5,{gas:true,brake:false,steer:0},false);});
 await expect(page.locator('#l2-result')).toContainText('Finish');await page.locator('[data-l2-vote=KEEP]').click();
 expect(await page.evaluate(()=>localStorage.getItem('outrun-stage-v083'))).toBe(oldReview);expect(await page.evaluate(()=>localStorage.getItem('outrun-drive-reports-v082'))).toBe(oldReport);
 expect(await page.evaluate(()=>localStorage.getItem('outrun-trip-drive-reports-v09'))).toContain('TRIP-v0.9-r3-3-ALB3');
 await page.reload();await stageReady(page);await expect(page.locator('[data-l2-vote=KEEP]')).toHaveAttribute('aria-pressed','true');
});

test('trip cannot disable streaming and replay or a new seed replaces the old window',async({page})=>{
 await page.goto('/?trip=10m&seed=1&stream=0');await stageReady(page);const first=await page.evaluate(()=>(window as any).__drive.sceneFingerprint());
 expect((await page.evaluate(()=>(window as any).__drive.streaming())).chunks.length).toBeLessThanOrEqual(7);
 await page.reload();await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.sceneFingerprint())).toEqual(first);
 await Promise.all([page.waitForURL(/trip=10m&seed=/),page.locator('#l2-next').click()]);await stageReady(page);expect(new URL(page.url()).searchParams.get('seed')).not.toBe('1');expect(await page.evaluate(()=>(window as any).__drive.sceneFingerprint())).not.toEqual(first);
});
