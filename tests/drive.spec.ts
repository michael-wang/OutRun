import { menuAction } from './ui';
import { scriptedDriver } from './driver';
import { test, expect, Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const snap=(page:Page)=>page.evaluate(()=> (window as any).__drive.snapshot());
const advance=(page:Page,n:number)=>page.evaluate(n=>(window as any).__drive.advance(n),n);
async function boot(page:Page){await page.goto('/?pace=1');await page.waitForFunction(()=>!!(window as any).__drive);await page.locator('#drive').click();}
test('desktop real-time driving, lifecycle, drift audio and continuous full route',async({page})=>{
  await page.setViewportSize({width:1280,height:720});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await boot(page);await page.waitForTimeout(600);expect((await snap(page)).speed).toBe(0);
  await page.keyboard.down('w');await page.waitForTimeout(2500);expect((await snap(page)).speed).toBeGreaterThan(10);
  await page.evaluate(()=>(window as any).__drive.manual(true));await page.evaluate(()=>(window as any).__drive.reset({distance:240,speed:55}));await page.keyboard.down('w');const before=await snap(page);
  await page.keyboard.down('d');await advance(page,.65);const right=await snap(page);expect(right.lateral).toBeGreaterThan(before.lateral);expect(right.heading).toBeGreaterThan(0);expect(right.rightScreenDelta).toBeGreaterThan(0);expect(right.slip).toBeGreaterThan(.2);
  await page.waitForTimeout(200);const audio=await snap(page);expect(audio.audio.contextState).toBe('running');expect(audio.audio.skidLevel).toBeGreaterThan(0);expect(audio.audio.rms).toBeGreaterThan(.001);
  await page.keyboard.up('d');await page.evaluate(()=>(window as any).__drive.reset({distance:240,speed:55}));await page.keyboard.down('w');await page.keyboard.down('a');await advance(page,.8);expect((await snap(page)).lateral).toBeLessThan(right.lateral);await page.keyboard.up('a');
  await page.keyboard.down('s');await advance(page,1);expect((await snap(page)).speed).toBeLessThan(right.speed);await page.keyboard.up('s');await page.keyboard.up('w');
  await menuAction(page,'sound');await page.waitForTimeout(400);expect((await snap(page)).audio.rms).toBeLessThan(.0001);await menuAction(page,'sound');
  await page.keyboard.press('p');const paused=await snap(page);await advance(page,2);expect((await snap(page)).distance).toBe(paused.distance);await page.keyboard.press('Escape');
  await page.keyboard.press('r');expect((await snap(page)).distance).toBe(0);await page.keyboard.down('w');
  const route:any[]=[];
  for(const [seconds,label] of [[13,'12'],[24,'36'],[24,'60'],[29,'finish']] as const){
    route.push(...await page.evaluate(async seconds=>{
      const source='/tests/driver.ts';const {scriptedDriver,plannedSpeed}=await import(source);const driver=scriptedDriver(),g=(window as any).__drive,trace=[];
      for(let i=0;i<seconds*10;i++){const s=g.snapshot(),controls=driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample));controls.gas=controls.gas&&s.speed<52;g.advance(.1,controls);if(i%10===9)trace.push(g.snapshot());}return trace;
    },seconds));
    await page.screenshot({path:`docs/evidence/v0.2/desktop-${label}.png`});
  }
  for(const s of route){expect(Number.isFinite(s.distance)).toBe(true);expect(s.offRoad).toBe(false);expect(s.surfaceError).not.toBeNull();expect(Math.abs(s.surfaceError)).toBeLessThan(.15);}  const geometry=await page.evaluate(()=>{const g=(window as any).__drive;const n=300;return Array.from({length:n+1},(_,i)=>g.sample(g.snapshot().trackLength*i/n));});
  expect(Math.min(...geometry.map(p=>p.curvature))).toBeLessThan(-.001);expect(Math.max(...geometry.map(p=>p.curvature))).toBeGreaterThan(.001);expect(Math.max(...geometry.map(p=>p.position[1]))-Math.min(...geometry.map(p=>p.position[1]))).toBeGreaterThan(15);
  expect(route.at(-1).distance).toBeGreaterThan(route.at(-1).trackLength);for(let k=0;k<3;k++)expect(geometry[0].position[k]).toBeCloseTo(geometry.at(-1).position[k],8);
  await page.keyboard.up('w');await page.keyboard.down('a');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:0});expect((await snap(page)).mode).toBe('paused');await page.keyboard.up('a');
  expect(errors).toEqual([]);writeFileSync('docs/evidence/v0.2/desktop-state.json',JSON.stringify({errors,audio,route,geometry},null,2));
});
test('trusted mobile multi-touch default and swapped, persistence, cancel and portrait',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await boot(page);
 const client=await context.newCDPSession(page);const point=async(control:string,id:number)=>{const b=await page.locator(`[data-control=${control}]`).boundingBox();return {x:b!.x+b!.width/2,y:b!.y+b!.height/2,id};};
 const evidence:any[]=[];
 for(const swapped of [false,true]){
  if(swapped){await menuAction(page,'settings');await page.locator('#swap').check();await page.locator('#close-settings').click();await page.reload();await page.waitForFunction(()=>!!(window as any).__drive);expect(await page.locator('#swap').isChecked()).toBe(true);await page.locator('#drive').click();}
  const gas=await point('gas',1),left=await point('left',2),brake=await point('brake',3);expect(gas.y).toBeLessThan(brake.y);expect(swapped?gas.x<left.x:gas.x>left.x).toBe(true);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas]});await page.waitForTimeout(600);
  const beforeSteer=await snap(page);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,left]});await page.waitForTimeout(600);await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...gas,x:gas.x-8},{...left,y:left.y-8}]});const both=await snap(page);expect(both.inputs.gas).toBe(true);expect(both.inputs.steer).toBe(-1);expect(both.worldHeading).toBeLessThan(beforeSteer.worldHeading);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[left]});expect((await snap(page)).inputs).toEqual({gas:true,brake:false,steer:0});
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,left]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[gas]});expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:-1});
  await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:0});
  await page.evaluate(()=>(window as any).__drive.manual(true));await page.keyboard.down('w');await page.evaluate(()=>(window as any).__drive.reset({distance:420,speed:40}));await page.keyboard.up('w');await page.waitForTimeout(600);await page.screenshot({path:`docs/evidence/v0.2/mobile-${swapped?'swapped':'default'}.png`});
  evidence.push({swapped,gas,left,brake,both});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await expect(page.locator('#rotate')).toBeVisible();await page.screenshot({path:'docs/evidence/v0.2/mobile-portrait.png'});expect(errors).toEqual([]);writeFileSync('docs/evidence/v0.2/mobile-state.json',JSON.stringify({errors,evidence},null,2));await context.close();
});
