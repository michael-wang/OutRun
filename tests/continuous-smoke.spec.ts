import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {stageReady} from './stage-ready';
test('continuous four-wheel drift plume',async({browser})=>{
 const root='docs/evidence/continuous-smoke';mkdirSync(root,{recursive:true});
 const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await stageReady(page);await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:4230,speed:65});});await stageReady(page);
 for(let i=0;i<36;i++)await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();g.advance(1/60,{gas:true,brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.08))});});
 expect(await page.evaluate(()=>(window as any).__drive.tireEffects().emittedByWheel.every((n:number)=>n>0))).toBe(true);
 await page.screenshot({path:`${root}/drift.png`});
 expect(errors).toEqual([]);await context.close();
});
