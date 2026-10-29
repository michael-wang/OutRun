import {test,expect} from '@playwright/test';import {stageReady} from './stage-ready';
test('feedback in a connector is not mislabelled as a challenge core',async({page})=>{
 await page.goto('/?trip=10m&seed=1');await stageReady(page);await page.keyboard.press('KeyP');
 await page.evaluate(()=>{const g=(window as any).__drive,p=g.brick(),buffer=p.buffers.find((x:any)=>x.role==='scenic');g.manual(true);g.reset({distance:350+(buffer.startS+buffer.endS)/2,speed:0});g.advance(.2,{gas:false,brake:false,steer:0});});
 await page.keyboard.press('KeyI');await page.locator('#l2-event-note').fill('connector');await page.locator('#l2-save-issue').click();
 const store=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-trip-v09')!)),event:any=(Object.values(store)[0] as any).events[0];expect(event.eventAt.l2InstanceId).toBeUndefined();expect(event.eventAt.bufferRole).toBe('scenic');
});
