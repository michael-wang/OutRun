import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c';
test('trusted thumb soft response, two-pixel jitter, quick release and shared PC stream',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({speed:230/3.6});});const touch=await touchDriver(page,context),rows=[];
 const advance=(t:number)=>page.evaluate(t=>(window as any).__drive.advance(t),t),snapshot=()=>page.evaluate(()=>(window as any).__drive.snapshot());
 await touch(.25,true,false);for(let i=0;i<12;i++){await advance(1/120);rows.push(await snapshot());}
 expect(rows[0].appliedSteer).toBeGreaterThan(0);expect(rows[0].appliedSteer).toBeLessThan(.02);expect(rows.at(-1).appliedSteer).toBeCloseTo(.25,8);
 const b=(await page.locator('#steering-strip').boundingBox())!,delta=4/b.width;
 for(let i=0;i<20;i++){await touch(.375+(i%2?delta:-delta),true,false);await advance(1/60);expect((await snapshot()).effectiveSteer).toBe(.25);}
 await touch(.99,true,false);for(let i=0;i<12;i++){await advance(1/120);rows.push(await snapshot());}expect((await snapshot()).appliedSteer).toBe(1);
 await touch(null,true,false);const x=(await snapshot()).lateral;await advance(.067);const release=await snapshot();expect(release.appliedSteer).toBe(0);expect(release.inputs.gas).toBe(true);expect(Math.abs(release.lateral-x)).toBeLessThan(.37);await advance(.3);expect((await snapshot()).lateral).toBe(release.lateral);
 await touch(null,false,false);await page.evaluate(()=>(window as any).__drive.reset({speed:55}));await page.keyboard.down('d');await advance(.05);const pc=await snapshot();expect(pc.effectiveSteer).toBe(.25);expect(pc.appliedSteer).toBeLessThan(pc.effectiveSteer);await page.keyboard.up('d');await advance(.3);expect((await snapshot()).appliedSteer).toBe(0);
 mkdirSync(root,{recursive:true});writeFileSync(`${root}/soft-touch.json`,JSON.stringify({rows,release,pc,jitterPixels:2},null,2));await context.close();
});
test('fixed-camera lookahead and expressive pose match actual curve demand',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/?challenge=low');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const course=await page.evaluate(()=>(window as any).__drive.challenges()),rows=[],touch=await touchDriver(page,context);
 for(const id of ['low','medium','high','extreme']){
  const c=course.find((c:any)=>c.id===id);await touch(null,false,false);await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:230/3.6}),c.start+c.transitionLength);await touch(Math.max(-1,Math.min(1,c.targetRequiredSteering)),true,false);await page.evaluate(()=>(window as any).__drive.advance(.3));await expect(page.locator('#challenge-readout')).toContainText(c.label);
  const look=await page.evaluate(()=>(window as any).__drive.lookahead(2));const yaw=Math.abs(look.renderedBodyYaw)*180/Math.PI;if(id==='low'){expect(yaw).toBeGreaterThan(3);expect(yaw).toBeLessThan(8)};if(id==='high'||id==='extreme')expect(yaw).toBeGreaterThan(25);
  await page.screenshot({path:`${root}/${id}-pose-lookahead.png`});rows.push({id,yaw,...look});
 }
 for(let i=1;i<rows.length;i++)expect(Math.abs(rows[i].rows.at(-1).headingChange)).toBeGreaterThan(Math.abs(rows[i-1].rows.at(-1).headingChange));
 writeFileSync(`${root}/projected-lookahead.json`,JSON.stringify(rows,null,2));await context.close();
});
