import { menuAction } from './ui';
import { test,expect,Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { scriptedDriver } from './driver';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__drive.snapshot());
const reset=(page:Page,state:object)=>page.evaluate(state=>(window as any).__drive.reset(state),state);
async function tick(page:Page,input:object,dt=.1){await page.evaluate(({input,dt})=>(window as any).__drive.advance(dt,input),{input,dt});}
async function boot(page:Page){await page.goto('/');await page.waitForFunction(()=>!!(window as any).__drive);await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));}
for(const [direction,distance] of [['right',240],['left',740]] as const){
 test(`paired ${direction} bend: no steering departs, digital steering stays, recovery`,async({page})=>{
  await page.setViewportSize({width:1280,height:720});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
  const traces:Record<string,any[]>={};
  for(const kind of ['neutral','steered','recovery']){
    await reset(page,{distance,speed:45,lateral:kind==='recovery'?8:0});const initial=await snapshot(page);const driver=scriptedDriver();const trace:any[]=[];let captured=false;
    for(let i=0;i<60;i++){
      const s=await snapshot(page),k=await page.evaluate(d=>(window as any).__drive.sample(d).curvature,s.distance);
      const input=kind==='neutral'?{gas:true,brake:false,steer:0}:driver(s,k);
      if(kind==='recovery'){input.gas=s.speed<36;input.brake=s.speed>40;}await tick(page,input);const current=await snapshot(page);trace.push({...current,input});
      if(!captured&&((kind==='neutral'&&current.offRoad)||(kind!=='neutral'&&i===35))){await page.screenshot({path:`docs/evidence/v0.2/${direction}-${kind}.png`});captured=true;}
    }
    if(kind==='neutral'){expect(trace.some(s=>s.offRoad)).toBe(true);expect(trace.at(-1).offRoad).toBe(true);expect(trace.at(-1).worldHeading).toBe(initial.worldHeading);}
    if(kind==='steered'){expect(trace.every(s=>!s.offRoad)).toBe(true);expect(trace.at(-1).distance).toBeGreaterThan(distance+200);}
    if(kind==='recovery'){expect(initial.offRoad).toBe(true);expect(trace.slice(-10).every(s=>!s.offRoad)).toBe(true);for(let i=1;i<trace.length;i++)expect(Math.abs(trace[i].lateral-trace[i-1].lateral)).toBeLessThan(3);}
    traces[kind]=trace;
  }
  expect(errors).toEqual([]);writeFileSync(`docs/evidence/v0.2/paired-${direction}.json`,JSON.stringify({distance,errors,traces},null,2));
 });
}
test('matched shoulder penalty and fixed camera at idle cruise and fast',async({page})=>{
 await boot(page);const results:any[]=[];
 for(const lateral of [0,8]){
  await reset(page,{distance:400,speed:55,lateral});const driver=scriptedDriver();
  for(let i=0;i<30;i++){const s=await snapshot(page),k=await page.evaluate(d=>(window as any).__drive.sample(d).curvature,s.distance);await tick(page,driver({...s,lateral:s.lateral-lateral},k));}
  results.push(await snapshot(page));
 }
 expect(results[0].offRoad).toBe(false);expect(results[1].offRoad).toBe(true);const ratio=results[1].speed/results[0].speed;expect(ratio).toBeGreaterThan(.6);expect(ratio).toBeLessThan(.75);
 const cameras=[],movingOffsets=[];for(const speed of [0,30,65]){
  await reset(page,{distance:420,speed});cameras.push((await snapshot(page)).camera);
  await tick(page,{gas:speed>0,brake:false,steer:0},.5);const s=await snapshot(page);
  const delta=s.camera.position.map((v:number,i:number)=>v-s.position[i]);movingOffsets.push(delta);
  expect(Math.hypot(...delta)).toBeCloseTo(Math.hypot(8,2.6),8);expect(s.camera.distance).toBe(8);expect(s.camera.height).toBe(2.6);
 }
 expect(cameras[0]).toEqual(cameras[1]);expect(cameras[1]).toEqual(cameras[2]);
 writeFileSync('docs/evidence/v0.2/penalty-camera.json',JSON.stringify({results,ratio,cameras,movingOffsets},null,2));
});
async function stubImmersion(page:Page,mode:'success'|'reject'|'lock-reject'|'unsupported'|'installed'){
 await page.addInitScript(mode=>{
  let fullscreen:Element|null=null; (window as any).immersionCalls=[];
  Object.defineProperty(document,'fullscreenElement',{get:()=>fullscreen,configurable:true});
  Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{configurable:true,value:mode==='unsupported'?undefined:async function(){(window as any).immersionCalls.push('fullscreen');if(mode==='reject')throw new Error('denied');fullscreen=this;document.dispatchEvent(new Event('fullscreenchange'));}});
  Object.defineProperty(document,'exitFullscreen',{value:async()=>{fullscreen=null;document.dispatchEvent(new Event('fullscreenchange'));}});
  Object.defineProperty(screen.orientation,'lock',{configurable:true,value:async(value:string)=>{(window as any).immersionCalls.push(value);if(mode==='lock-reject')throw new Error('denied');}});
  if(mode==='installed'){const original=window.matchMedia.bind(window);window.matchMedia=(query:string)=>query==='(display-mode: fullscreen)'?Object.defineProperty(original(query),'matches',{value:true}):original(query);}
 },mode);
}
for(const mode of ['success','reject','lock-reject','unsupported','installed'] as const){
 test(`mobile immersive ${mode} handles fullscreen and orientation without trapping play`,async({browser})=>{
  const context=await browser.newContext({viewport:{width:960,height:432},isMobile:true,hasTouch:true});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await stubImmersion(page,mode);await boot(page);
  const state=await snapshot(page),calls=await page.evaluate(()=>(window as any).immersionCalls);
  expect(state.mode).toBe('playing');
  if(mode==='success'){expect(state.immersive.active).toBe(true);expect(calls).toEqual(['fullscreen','landscape']);await menuAction(page,'fullscreen');expect((await snapshot(page)).immersive.active).toBe(false);expect((await snapshot(page)).mode).toBe('paused');await menuAction(page,'fullscreen');expect((await snapshot(page)).immersive.active).toBe(true);}
  if(mode==='installed'){expect(state.immersive.installed).toBe(true);expect(state.immersive.active).toBe(false);expect(calls).toEqual(['landscape']);}
  if(mode==='reject'||mode==='unsupported'){expect(state.immersive.active).toBe(false);await expect(page.locator('#immersive-note')).toContainText('Fullscreen unavailable');}
  if(mode==='lock-reject'){expect(state.immersive.active).toBe(true);await expect(page.locator('#immersive-note')).toContainText('Rotate');}
  await page.setViewportSize({width:432,height:960});await expect(page.locator('#rotate')).toBeVisible();await expect(page.locator('#rotate-fullscreen')).toBeVisible();await page.setViewportSize({width:960,height:432});
  expect((await snapshot(page)).inputs).toEqual({gas:false,brake:false,steer:0});expect(errors).toEqual([]);await context.close();
 });
}
test('Pixel-like landscape touch, safe bounds, brake+steer, both layouts',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();await stubImmersion(page,'success');await boot(page);const client=await context.newCDPSession(page);
 const point=async(control:string,id:number)=>{const b=(await page.locator(`[data-control=${control}]`).boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(56);expect(b.height).toBeGreaterThanOrEqual(56);expect(b.x).toBeGreaterThanOrEqual(20);expect(b.y+b.height).toBeLessThanOrEqual(432-20);return {x:b.x+b.width/2,y:b.y+b.height/2,id};};
 for(const swapped of [false,true]){
  if(swapped){await menuAction(page,'settings');await page.locator('#swap').check();await page.locator('#close-settings').click();await page.locator('#resume').click();}
  await reset(page,{distance:420,speed:45});const gas=await point('gas',1),brake=await point('brake',1),right=await point('right',2);expect(gas.y).toBeLessThan(brake.y);expect(swapped?gas.x<right.x:gas.x>right.x).toBe(true);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[brake,right]});expect((await snapshot(page)).inputs).toEqual({gas:false,brake:true,steer:1});await page.evaluate(()=>(window as any).__drive.advance(.4));expect((await snapshot(page)).speed).toBeLessThan(35);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));expect((await snapshot(page)).inputs).toEqual({gas:false,brake:false,steer:0});await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await reset(page,{distance:420,speed:45});await page.screenshot({path:`docs/evidence/v0.2/pixel-${swapped?'swapped':'default'}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight)).toBe(true);
 }
 await context.close();
});
test('climb crest descent camera views',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await boot(page);
 const profile=[];for(const [label,distance] of [['climb',735],['crest',930],['descent',1020]] as const){await reset(page,{distance,speed:40});await page.screenshot({path:`docs/evidence/v0.2/hill-${label}.png`});profile.push({label,...await snapshot(page)});}
 await page.setViewportSize({width:960,height:432});await reset(page,{distance:735,speed:40});await page.screenshot({path:'docs/evidence/v0.2/hill-mobile.png'});
 writeFileSync('docs/evidence/v0.2/hill.json',JSON.stringify(profile,null,2));
});
