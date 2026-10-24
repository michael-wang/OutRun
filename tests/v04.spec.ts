import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.4';
const snapshot=(page:any)=>page.evaluate(()=>(window as any).__drive.snapshot());
test('v0.4 primary keys, concurrency, focus safety, menu accessibility and text entry',async({page})=>{
 await page.goto('/');await page.locator('#drive').focus();await page.keyboard.press('Enter');
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({speed:65});});
 await page.locator('#pause').focus();await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.down('a');
 expect((await snapshot(page)).inputs).toEqual({gas:true,brake:false,steer:-1});
 await page.keyboard.down('d');expect((await snapshot(page)).inputs.steer).toBe(0);await page.keyboard.up('a');expect((await snapshot(page)).inputs.steer).toBe(1);
 await page.keyboard.down('Enter');expect((await snapshot(page)).mode).toBe('playing');expect((await snapshot(page)).inputs.brake).toBe(true);
 await page.keyboard.up('d');await page.keyboard.down('a');expect((await snapshot(page)).inputs).toEqual({gas:true,brake:true,steer:-1});await page.keyboard.up('a');await page.keyboard.down('d');
 await page.evaluate(()=>(window as any).__drive.advance(.5));expect((await snapshot(page)).speed).toBeLessThan(50);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await page.keyboard.up('d');expect((await snapshot(page)).inputs.gas).toBe(true);await page.keyboard.up('Space');await page.keyboard.up('Enter');
 await page.locator('#pause').click();await page.locator('#settings').focus();await page.keyboard.press('Enter');await expect(page.locator('#preferences')).toBeVisible();
 await page.locator('#swap').focus();await page.keyboard.press('Space');await expect(page.locator('#swap')).toBeChecked();
 await page.evaluate(()=>{const field=document.createElement('input');field.id='text-probe';document.querySelector('#preferences')!.append(field);});
 await page.locator('#text-probe').focus();await page.keyboard.type('a d space');expect(await page.locator('#text-probe').inputValue()).toBe('a d space');expect((await snapshot(page)).inputs).toEqual({gas:false,brake:false,steer:0});
 await page.locator('#close-settings').focus();await page.keyboard.press('Enter');await page.locator('#resume').focus();await page.keyboard.press('Enter');expect((await snapshot(page)).mode).toBe('playing');
 await page.keyboard.down('Space');await page.keyboard.down('a');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));expect((await snapshot(page)).inputs).toEqual({gas:false,brake:false,steer:0});
});
for(const [width,height] of [[1280,720],[960,432],[844,390]])test(`v0.4 speed HUD ${width}x${height}, both hand layouts and settings`,async({browser})=>{
 mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 const rows=[];
 for(const swapped of [false,true]){
  if(swapped){await page.locator('#pause').click();await page.locator('#settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();await page.locator('#resume').click();}
  for(const speed of [0,65]){
   await page.evaluate(speed=>(window as any).__drive.reset({distance:850,speed}),speed);await expect(page.locator('#speed strong')).toHaveText(speed?'234':'000');
   const hud=(await page.locator('#speed').boundingBox())!,menu=(await page.locator('#pause').boundingBox())!;
   expect(hud.x).toBeGreaterThan(width*.7);expect(hud.y+hud.height).toBeLessThan(height*.35);expect(hud.x+hud.width).toBeLessThanOrEqual(width-20);expect(menu.x+menu.width).toBeLessThan(hud.x);
   const font=await page.locator('#speed strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));expect(font).toBeGreaterThanOrEqual(40);expect(font).toBeLessThanOrEqual(60);
   if(width<1000){for(const c of ['gas','brake','left','right']){const b=(await page.locator(`[data-control=${c}]`).boundingBox())!;expect(b.y).toBeGreaterThan(hud.y+hud.height);}}
   const s=await snapshot(page);expect(s.highSpeedPace).toBe(1.75);expect(s.travelSpeed).toBe(speed*1.75);rows.push({swapped,speed,hud,font,state:s});
   await page.screenshot({path:`${root}/hud-${width}-${swapped?'swapped':'default'}-${speed}.png`});
  }
 }
 await page.locator('#pause').click();await page.locator('#settings').click();await page.screenshot({path:`${root}/settings-${width}.png`});expect(errors).toEqual([]);writeFileSync(`${root}/hud-${width}.json`,JSON.stringify({rows,errors},null,2));await context.close();
});

test('v0.4 deliberate drift has real slip and persistent squeal, countersteering recovers',async({page})=>{
 await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({speed:65});});
 await page.keyboard.down('Space');await page.keyboard.down('d');await page.evaluate(()=>(window as any).__drive.advance(.18));
 const tap=await snapshot(page);expect(tap.lateral).toBeLessThan(.15);expect(tap.heading).toBeLessThan(.04);expect(tap.audio.skidLevel).toBe(0);await page.keyboard.up('d');
 await page.evaluate(()=>(window as any).__drive.reset({distance:850,speed:55}));await page.keyboard.down('Space');await page.keyboard.down('d');await page.evaluate(()=>(window as any).__drive.advance(1.8));
 const drift=await snapshot(page);expect(drift.slipAngle*180/Math.PI).toBeGreaterThan(20);expect(drift.slipAngle*180/Math.PI).toBeLessThan(40);expect(drift.audio.skidLevel).toBeGreaterThan(.1);
 await page.keyboard.up('d');await page.keyboard.up('Space');
 const recovery=await page.evaluate(async()=>{const source='/tests/driver.ts';const {scriptedDriver,plannedSpeed}=await import(source);const g=(window as any).__drive,driver=scriptedDriver(),trace=[];for(let i=0;i<65;i++){const s=g.snapshot(),input=driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample,1.75));g.advance(.1,input);trace.push({...g.snapshot(),input});}return trace;});
 expect(recovery.some((s:any)=>s.input.steer<0)).toBe(true);expect(recovery.at(-1).offRoad).toBe(false);expect(Math.abs(recovery.at(-1).slipAngle)).toBeLessThan(.03);expect(recovery.at(-1).audio.skidLevel).toBe(0);
 mkdirSync(root,{recursive:true});writeFileSync(`${root}/drift-regression.json`,JSON.stringify({tap,drift,recovery},null,2));
});

test('v0.4 trusted two-thumb short taps stay precise in both hand layouts',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/');await page.locator('#drive').click();
 const cdp=await context.newCDPSession(page),rows=[];
 for(const swapped of [false,true]){
  if(swapped){await page.locator('#pause').click();await page.locator('#settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();await page.locator('#resume').click();}
  await page.evaluate(()=>(window as any).__drive.reset({speed:65}));
  const point=async(control:string,id:number)=>{const b=(await page.locator(`[data-control=${control}]`).boundingBox())!;return {x:b.x+b.width/2,y:b.y+b.height/2,id};};
  const gas=await point('gas',1),right=await point('right',2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,right]});await page.waitForTimeout(180);
  const tap=await snapshot(page);expect(tap.inputs).toEqual({gas:true,brake:false,steer:1});expect(tap.lateral).toBeLessThan(.5);expect(tap.heading).toBeLessThan(.06);expect(tap.audio.skidLevel).toBe(0);
  // CDP touchEnd lists the contacts being released, unlike DOM TouchEvent.touches.
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});expect((await snapshot(page)).inputs).toEqual({gas:true,brake:false,steer:0});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect((await snapshot(page)).inputs).toEqual({gas:false,brake:false,steer:0});rows.push({swapped,tap});
 }
 writeFileSync(`${root}/touch-taps.json`,JSON.stringify(rows,null,2));await context.close();
});
