import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const before=process.env.OUTRUN_HUD_CAPTURE==='before',root=`${process.env.OUTRUN_HUD_DIR??'docs/evidence/v0.9-final-hud'}/${before?'before':'after'}`;
const overlap=(a:any,b:any)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

test('PC gamepad shows both pedals while driving and paused',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.addInitScript(()=>{
  const pad={id:'Test controller',mapping:'standard',connected:true,axes:[0,0],
   buttons:Array.from({length:18},()=>({pressed:false,value:0}))};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
 });
 const setButton=(index:number,down:boolean)=>page.evaluate(({index,down})=>{
  Object.assign(navigator.getGamepads()[0]!.buttons[index],{pressed:down,value:Number(down)});
 },{index,down});
 await page.goto('/');
 await page.bringToFront();
 await page.waitForFunction(()=>(window as any).__drive?.driveState().mode==='playing',null,{timeout:90000});
 await page.locator('#game-loading').waitFor({state:'hidden',timeout:90000});
 const gas=page.locator('[data-control=gas]'),brake=page.locator('[data-control=brake]');
 await setButton(7,true);
 await expect(page.locator('html')).toHaveAttribute('data-input-mode','gamepad');
 await expect(gas).toBeVisible();
 await expect(brake).toBeVisible();
 await expect(page.locator('#steering-strip')).toBeVisible();
 expect(await gas.evaluate(el=>getComputedStyle(el,'::after').content)).toContain('R2');
 expect(await brake.evaluate(el=>getComputedStyle(el,'::after').content)).toContain('L2');
 await expect(gas).toHaveClass(/pressed/);
 await page.screenshot({path:test.info().outputPath('pc-gamepad.png')});
 await setButton(7,false);
 await expect(gas).not.toHaveClass(/pressed/);
 await setButton(6,true);
 await expect(brake).toHaveClass(/pressed/);
 await setButton(9,true);
 await expect(page.locator('#tp-resume')).toBeVisible();
 await expect(page.locator('#touch')).toHaveJSProperty('inert',true);
 await expect(gas).toBeVisible();
 await expect(brake).toBeVisible();
 await expect(brake).not.toHaveClass(/pressed/);
});

for(const [width,height] of [[915,412],[844,390],[960,432],[1024,768],[1280,720],[667,375],[568,320]])for(const swapped of [false,true])test(`arcade dashboard ${width}x${height} swapped=${swapped}`,async({browser})=>{
 const mobile=width<1000,context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile}),page=await context.newPage();
 await page.addInitScript(swapped=>{localStorage.setItem('first-drive-controls-swapped',String(swapped));Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});},swapped);
 await page.goto('/?at=2750');
 await page.waitForFunction(()=>(window as any).__drive?.driveState().mode==='playing',null,{timeout:90000});
 await page.locator('#game-loading').waitFor({state:'hidden',timeout:90000});
 await page.evaluate(()=>(window as any).__drive.manual(true));
 const rows=[];mkdirSync(root,{recursive:true});
 for(const kmh of [0,83,100,266,320]){
  await page.evaluate(kmh=>(window as any).__drive.reset({distance:2750,speed:kmh/3.6}),kmh);
  await expect(page.locator('#speed strong')).toHaveText(String(kmh).padStart(3,'0'));
  const angle=Number((await page.locator('#speed-needle').getAttribute('transform'))!.match(/rotate\(([^ ]+)/)![1]);expect(angle).toBeCloseTo(before?-135+270*kmh/360:-146+216*kmh/360,8);
  await expect(page.locator('#gear')).toHaveText(`G${kmh===0?1:kmh===83?2:kmh===100?3:6}${before?'':'/6'}`);
  const gauge=(await page.locator('#speed').boundingBox())!;
  const reading=before?gauge:(await page.locator('.speed-reading').boundingBox())!,gear=(await page.locator('#gear').boundingBox())!;
  if(!before){
   await expect(page.locator('#speed small')).toHaveText('km/hr');
   await expect(page.locator('#speed #status')).toHaveCount(0);
   const digits=(await page.locator('#speed strong').boundingBox())!;
   expect(digits.x+digits.width).toBeGreaterThan(gauge.x+gauge.width);
   expect(reading.x+reading.width).toBeLessThanOrEqual(width);
   expect(gear.y).toBeGreaterThan(gauge.y+gauge.height);
   const labels=await page.locator('#speed svg text').evaluateAll(nodes=>nodes.map(node=>{
    const matrix=(node as SVGTextElement).getScreenCTM()!;
    return Math.atan2(matrix.b,matrix.a);
   }));
   expect(labels).toEqual(Array(7).fill(0));
   const rimLength=await page.locator('.dial-rim').evaluate(el=>(el as SVGGeometryElement).getTotalLength());
   expect(rimLength).toBeCloseTo(97*216*Math.PI/180,0);
  }
  const controls=['#steering-strip','#pause',...(mobile?['[data-control=gas]','[data-control=brake]']:[])];
  for(const selector of controls){const target=page.locator(selector),box=(await target.boundingBox())!;for(const part of [gauge,reading,gear])expect(overlap(part,box),selector).toBe(false);
   expect(await target.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),`${selector} hit target`).toBe(true);
  }
  expect(gauge.y).toBeGreaterThan(60);expect(gauge.x).toBeGreaterThanOrEqual(20);expect(gauge.y+gauge.height).toBeLessThan(height);
  expect(await page.locator('#speed').evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');
  if(!before&&width>=844&&mobile){expect(gauge.width).toBeGreaterThanOrEqual(104);expect(gauge.width).toBeLessThanOrEqual(124);const font=await page.locator('#speed strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));expect(font).toBeGreaterThan(50);}
  const frame=await page.evaluate(()=>(window as any).__drive.framing());if(width>=844){if(mobile&&swapped)expect(gauge.x).toBeGreaterThan(frame.right*width);else expect(gauge.x+gauge.width).toBeLessThan(frame.left*width);}else if(!before)expect(overlap(gauge,{x:frame.left*width,y:frame.top*height,width:frame.width*width,height:(frame.bottom-frame.top)*height}),'car clearance').toBe(false);
  if(!before){expect(overlap(reading,{x:frame.left*width,y:frame.top*height,width:frame.width*width,height:(frame.bottom-frame.top)*height}),'readout clears car').toBe(false);}
  if(!before&&mobile){const bar=(await page.locator('#steering-strip').boundingBox())!;expect(bar.y-gear.y-gear.height).toBeGreaterThan(0);expect(bar.height).toBe(48);expect(gauge.height).toBeLessThanOrEqual((frame.bottom-frame.top)*height);}
  rows.push({kmh,angle,gauge,frame});
  if(kmh===83||kmh===266||(width===844&&!swapped))await page.screenshot({path:`${root}/${width}-${swapped?'swapped':'normal'}-${kmh}.png`});
 }
 for(const [kmh,gear] of [[65,2],[155,4],[205,5]]){await page.evaluate(kmh=>(window as any).__drive.reset({distance:2750,speed:kmh/3.6}),kmh);await expect(page.locator('#gear')).toHaveText(`G${gear}${before?'':'/6'}`);}
 if(!before){
  await page.evaluate(()=>(window as any).__drive.reset({distance:2750,speed:83/3.6}));
  await page.locator('#pause').click();
  await expect(page.locator('#tp-resume')).toBeVisible();
  await expect(page.locator('#speed strong')).toHaveText('083');
  await expect(page.locator('#gear')).toHaveText('G2/6');
  for(const selector of ['#speed','#steering-strip','[data-control=gas]','[data-control=brake]']){
   await expect(page.locator(selector)).toBeVisible();
  }
  await expect(page.locator('#touch')).toHaveJSProperty('inert',true);
  const gas=(await page.locator('[data-control=gas]').boundingBox())!;
  await page.mouse.click(gas.x+gas.width/2,gas.y+gas.height/2);
  const paused=await page.evaluate(()=>{const game=(window as any).__drive;game.advance(.2);return game.snapshot();});
  expect(paused.mode).toBe('paused');
  expect(paused.distance).toBe(2750);
  expect(paused.inputs).toEqual({gas:false,brake:false,steer:0});
  if(!swapped&&[844,1280].includes(width))await page.screenshot({path:`${root}/${width}-paused.png`});
  await page.locator('#tp-resume').click();
  await expect(page.locator('#touch')).toHaveJSProperty('inert',false);
 }
 if(mobile){const touch=await touchDriver(page,context);await touch(.8,true,false);await page.evaluate(()=>(window as any).__drive.advance(.15));const inputs=await page.evaluate(()=>(window as any).__drive.snapshot().inputs);expect(inputs.gas).toBe(true);expect(inputs.steer).toBeGreaterThan(.5);await touch(null,false,false);}
 writeFileSync(`${root}/${width}-${swapped}.json`,JSON.stringify(rows,null,2));await context.close();
});
