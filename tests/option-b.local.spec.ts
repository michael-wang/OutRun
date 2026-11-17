import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const evidence=process.env.OUTRUN_OPTION_B_EVIDENCE;
test.skip(!evidence,'Explicit local-only evidence directory required; private art is not in Git.');
for(const mode of ['default','option-b','fallback','malformed'])test(`${mode}: actual coast start, driving and restart`,async({page})=>{
 mkdirSync(evidence!,{recursive:true});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 if(mode==='fallback')await page.route('**/__local/option-b.glb',r=>r.fulfill({status:404,body:'missing'}));
 if(mode==='malformed')await page.route('**/__local/option-b.glb',r=>r.fulfill({status:200,body:'invalid GLB'}));
 await page.goto('/?at=850&trafficSeed=1234'+(mode==='default'?'':'&hero3d=1'));
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();
 await page.locator('#start-race').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:120000});
 const status=await page.evaluate(()=>(window as any).__drive.optionB());
 expect(status.state).toBe(mode==='default'?'default':mode==='option-b'?'ready':'fallback');
 await page.screenshot({path:join(evidence!,`${mode}-ready.png`)});
 await page.locator('#race-start').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.evaluate(()=>{const d=(window as any).__drive;d.manual(true);d.reset({distance:850,speed:0});});
 const before=await page.evaluate(()=>(window as any).__drive.snapshot());
 await page.evaluate(()=>(window as any).__drive.advance(2,{gas:true,brake:false,steer:0}));
 const after=await page.evaluate(()=>(window as any).__drive.snapshot());
 expect(after.distance).toBeGreaterThan(before.distance);expect(after.speed).toBeGreaterThan(0);
 await page.screenshot({path:join(evidence!,`${mode}-chase.png`)});
 const diagnostics:any={status,before,after,errors};
 if(mode==='option-b'){
  for(const [name,steer] of [['left',-1],['right',1]] as const){
   await page.evaluate(s=>{const d=(window as any).__drive;d.reset({distance:850,speed:12});d.advance(.35,{gas:true,brake:false,steer:s});d.carView('cockpit');},steer);
   diagnostics[name]=await page.evaluate(()=>{const d=(window as any).__drive;return {wheels:d.wheels(),occupants:d.occupants(),state:d.snapshot()};});
   expect(diagnostics[name].wheels).toHaveLength(4);
   expect(diagnostics[name].wheels.every((w:any)=>w.radius===.46&&Math.abs(w.angle)>0)).toBe(true);
   expect(diagnostics[name].wheels.filter((w:any)=>w.front).every((w:any)=>Math.sign(w.steer)===-steer)).toBe(true);
   await page.screenshot({path:join(evidence!,`option-b-steer-${name}.png`)});
  }
  await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:0});d.carView('front');});
  await page.screenshot({path:join(evidence!,'option-b-front3q.png')});
  await page.evaluate(()=>(window as any).__drive.carView('rear3q'));
  diagnostics.running=await page.evaluate(()=>(window as any).__drive.brakeLights());
  await page.screenshot({path:join(evidence!,'option-b-rear3q-running.png')});
  await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:12});d.advance(.15,{gas:false,brake:true,steer:0});d.carView('rear3q');});
  diagnostics.braking=await page.evaluate(()=>(window as any).__drive.brakeLights());
  expect(diagnostics.braking.emissiveIntensity).toBeGreaterThan(diagnostics.running.emissiveIntensity);
  await page.screenshot({path:join(evidence!,'option-b-rear3q-braking.png')});
  await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:1360,speed:55});d.advance(.7,{gas:true,brake:true,steer:.8});});
  diagnostics.drift=await page.evaluate(()=>(window as any).__drive.snapshot());
  await page.screenshot({path:join(evidence!,'option-b-speed-steer.png')});
  await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:0});d.carView('side');});
  await page.screenshot({path:join(evidence!,'option-b-side.png')});
  diagnostics.lightStates=[];
  for(const day of [false,true])for(const on of [false,true])for(const brake of [false,true]){
   await page.evaluate(({day,on,brake})=>{const d=(window as any).__drive;d.reset({distance:850,speed:0});d.optionBReviewDaylight(day);d.optionBHeadlights(on);d.advance(.05,{gas:false,brake,steer:0});}, {day,on,brake});
   const state=await page.evaluate(()=>(window as any).__drive.brakeLights());
   expect(state.headlightsEnabled).toBe(on);expect(state.tailRunningEnabled).toBe(on);expect(state.braking).toBe(brake);
   expect(state.emissiveIntensity).toBe(brake?1.7:on?.55:0);
   diagnostics.lightStates.push({day,on,brake,state});
   for(const view of ['front','rear3q']){
    await page.evaluate(v=>(window as any).__drive.carView(v),view);
    await page.screenshot({path:join(evidence!,`g2-${day?'daylight-qa':'dusk'}-lights-${on?'on':'off'}-brake-${brake?'on':'off'}-${view}.png`)});
   }
  }
  await page.evaluate(()=>{const d=(window as any).__drive;d.optionBReviewDaylight(false);d.optionBHeadlights(true);});
 }
 await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:25});d.manual(false);});
 const sampleStart=await page.evaluate(()=>({now:performance.now(),frames:(window as any).__drive.snapshot().frames}));
 await page.waitForTimeout(3000);
 diagnostics.pcSample=await page.evaluate(start=>({milliseconds:performance.now()-start.now,frames:(window as any).__drive.snapshot().frames-start.frames,perf:(window as any).__drive.perf(),render:(window as any).__drive.scenery().render}),sampleStart);
 await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:0});d.manual(false);});
 if(mode==='option-b'){
  await page.keyboard.press('p');
  await expect(page.locator('html')).toHaveAttribute('data-drive-mode','paused');
  await page.screenshot({path:join(evidence!,'option-b-paused.png')});
 }
 await page.keyboard.press('r');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode',mode==='option-b'?'countdown':'ready',{timeout:20000});
 diagnostics.restart=await page.evaluate(()=>(window as any).__drive.snapshot());
 expect(diagnostics.restart.speed).toBe(0);
 await page.screenshot({path:join(evidence!,`${mode}-restart.png`)});
 diagnostics.render=await page.evaluate(()=>(window as any).__drive.scenery().render);
 writeFileSync(join(evidence!,`${mode}-diagnostics.json`),JSON.stringify(diagnostics,null,2));
 expect(errors).toEqual([]);
});
