import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.4.1';
const snap=(page:any)=>page.evaluate(()=>(window as any).__drive.snapshot());
const advance=(page:any,seconds:number)=>page.evaluate((seconds:number)=>(window as any).__drive.advance(seconds),seconds);
test('analog keyboard holds, rapid neutral/reversal, brake priority and accessible menus',async({page})=>{
 await page.goto('/');await page.locator('#drive').focus();await page.keyboard.press('Enter');await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({speed:65});});
 await page.locator('#pause').focus();await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.down('a');await advance(page,.15);
 expect((await snap(page)).inputs.steer).toBeCloseTo(-.375);expect((await snap(page)).worldHeading).toBeLessThan(-.01);
 await page.keyboard.up('a');await advance(page,.15);const released=await snap(page);expect(released.inputs.steer).toBe(0);expect(released.yawRate).toBe(0);await advance(page,.5);expect((await snap(page)).worldHeading).toBe(released.worldHeading);
 await page.keyboard.down('a');await advance(page,.4);expect((await snap(page)).inputs.steer).toBe(-1);await page.keyboard.down('d');await advance(page,.15);expect((await snap(page)).inputs.steer).toBe(0);await page.keyboard.up('a');await advance(page,.4);expect((await snap(page)).inputs.steer).toBe(1);
 await page.keyboard.down('Enter');await advance(page,.5);expect((await snap(page)).mode).toBe('playing');expect((await snap(page)).speed).toBeLessThan(50);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await page.keyboard.up('d');await page.keyboard.down('a');await advance(page,.15);expect((await snap(page)).inputs.steer).toBeLessThan(0);expect((await snap(page)).inputs.brake).toBe(true);await page.keyboard.up('a');await page.keyboard.up('Enter');await page.keyboard.up('Space');
 await page.locator('#pause').click();await page.locator('#settings').focus();await page.keyboard.press('Enter');await expect(page.locator('#preferences')).toBeVisible();await page.locator('#swap').focus();await page.keyboard.press('Space');await expect(page.locator('#swap')).toBeChecked();
 await page.evaluate(()=>{const e=document.createElement('input');e.id='text-probe';document.querySelector('#preferences')!.append(e);});await page.locator('#text-probe').focus();await page.keyboard.type('a d space');expect(await page.locator('#text-probe').inputValue()).toBe('a d space');expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:0});
 await page.locator('#close-settings').focus();await page.keyboard.press('Enter');await page.locator('#resume').focus();await page.keyboard.press('Enter');await page.keyboard.down('d');await advance(page,.2);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));expect((await snap(page)).inputs.steer).toBe(0);
});
for(const [width,height] of [[1280,720],[960,432],[844,390]])test(`needle gauge left of car ${width}x${height}, both hands, zero/mid/high`,async({browser})=>{
 mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const rows=[];
 for(const swapped of [false,true]){
  if(swapped){await page.locator('#pause').click();await page.locator('#settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();await page.locator('#resume').click();}
  for(const kmh of [0,80,150,230]){
   await page.evaluate(kmh=>(window as any).__drive.reset({distance:850,speed:kmh/3.6}),kmh);await expect(page.locator('#speed strong')).toHaveText(String(kmh).padStart(3,'0'));const angle=-135+270*kmh/260;
   const transform=(await page.locator('#speed-needle').getAttribute('transform'))!;expect(Number(transform.match(/rotate\(([^ ]+)/)![1])).toBeCloseTo(angle,8);
   const gauge=(await page.locator('#speed').boundingBox())!,frame=await page.evaluate(()=>(window as any).__drive.framing());expect(gauge.x+gauge.width).toBeLessThan(frame.left*width);expect(gauge.x).toBeGreaterThanOrEqual(20);expect(gauge.y).toBeGreaterThan(60);
   for(const control of ['#steering-strip',...(width<1000?['[data-control=gas]','[data-control=brake]']:[])]){const b=(await page.locator(control).boundingBox())!;expect(gauge.y+gauge.height+10).toBeLessThan(b.y);}
   expect(await page.locator('#speed').evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');expect(await page.locator('#speed').evaluate(e=>{const b=e.getBoundingClientRect();return !e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})).toBe(true);
   const state=await snap(page);expect(state.highSpeedPace).toBe(1.75);rows.push({swapped,kmh,angle,gauge,frame,state});await page.screenshot({path:`${root}/gauge-${width}-${swapped?'swapped':'default'}-${kmh}.png`});
  }
 }
 expect(errors).toEqual([]);writeFileSync(`${root}/gauge-${width}.json`,JSON.stringify({rows,errors},null,2));await context.close();
});
test('absolute analog strip ownership, continuous crossing, outside clamp and independent pedals',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const cdp=await context.newCDPSession(page),rows=[];
 for(const swapped of [false,true]){
  if(swapped){await page.locator('#pause').click();await page.locator('#settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();await page.reload();await expect(page.locator('#swap')).toBeChecked();await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));}
  await page.evaluate(()=>(window as any).__drive.reset({speed:65}));const strip=(await page.locator('#steering-strip').boundingBox())!,pedal=(await page.locator('[data-control=gas]').boundingBox())!;expect(swapped?strip.x>pedal.x:strip.x<pedal.x).toBe(true);
  const gas={x:pedal.x+pedal.width/2,y:pedal.y+pedal.height/2,id:1};let finger={x:strip.x+strip.width*.5,y:strip.y+strip.height/2,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,finger]});
  for(const x of [.1,.25,.5,.75,.9,.2,.5,.8,1.1,-.1]){finger={...finger,x:strip.x+strip.width*x};await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[gas,finger]});const s=await snap(page);expect(s.inputs.steer).toBeCloseTo(Math.max(-1,Math.min(1,x*2-1)),1);expect(s.inputs.gas).toBe(true);await advance(page,.05);rows.push({swapped,x,...await snap(page)});}
  const owner=(await snap(page)).inputs.steer;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,finger,{x:strip.x+strip.width*.75,y:finger.y,id:3}]});expect((await snap(page)).inputs.steer).toBe(owner);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:strip.x+strip.width*.75,y:finger.y,id:3}]});expect((await snap(page)).inputs.steer).toBe(owner);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[finger]});expect((await snap(page)).inputs).toEqual({gas:true,brake:false,steer:0});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:0});
 }
 writeFileSync(`${root}/analog-touch.json`,JSON.stringify(rows,null,2));await context.close();
});

test('150ms analog corrections stop yaw on release and swapped sliding holds survive 15 seconds',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 const cdp=await context.newCDPSession(page),rows=[];
 for(const x of [.25,.75]){
  await page.evaluate(()=>(window as any).__drive.reset({speed:65}));const b=(await page.locator('#steering-strip').boundingBox())!,finger={x:b.x+b.width*x,y:b.y+b.height/2,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});await advance(page,.15);const peak=await snap(page);expect(peak.yawRate*(x<.5?-1:1)).toBeGreaterThan(.4);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[finger]});await advance(page,.5);const released=await snap(page);expect(released.yawRate).toBe(0);expect(released.worldHeading).toBeCloseTo(peak.worldHeading,8);rows.push({x,peak,released});
 }
 await page.locator('#pause').click();await page.locator('#settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();await page.reload();await expect(page.locator('#swap')).toBeChecked();await page.locator('#drive').click();
 const b=(await page.locator('#steering-strip').boundingBox())!,p=(await page.locator('[data-control=gas]').boundingBox())!,gas={x:p.x+p.width/2,y:p.y+p.height/2,id:1};let finger={x:b.x+b.width*.2,y:b.y+b.height/2,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,finger]});
 for(let i=0;i<15;i++){const x=[.2,.5,.8][i%3];finger={...finger,x:b.x+b.width*x};await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[gas,finger]});await page.waitForTimeout(1000);const s=await snap(page);expect(s.inputs.gas).toBe(true);expect(s.inputs.steer).toBeCloseTo(x*2-1,1);expect(s.mode).toBe('playing');rows.push({second:i+1,...s});}
 expect(await page.evaluate(()=>getSelection()?.toString())).toBe('');await page.screenshot({path:`${root}/swapped-sliding-hold.png`});
 await page.evaluate(()=>document.dispatchEvent(new Event('fullscreenchange')));expect((await snap(page)).inputs).toEqual({gas:false,brake:false,steer:0});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});writeFileSync(`${root}/touch-corrections-hold.json`,JSON.stringify(rows,null,2));await context.close();
});
