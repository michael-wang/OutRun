import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
import {touchDriver} from './touch-driver';
const before=process.env.OUTRUN_HUD_CAPTURE==='before',root=`${process.env.OUTRUN_HUD_DIR??'docs/evidence/v0.9-public-polish'}/${before?'before':'after'}`;
const overlap=(a:any,b:any)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

for(const [width,height] of [[915,412],[844,390],[960,432],[1280,720],[667,375],[568,320]])for(const swapped of [false,true])test(`arcade dashboard ${width}x${height} swapped=${swapped}`,async({browser})=>{
 const mobile=width<1000,context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile}),page=await context.newPage();
 await page.addInitScript(swapped=>{localStorage.setItem('first-drive-controls-swapped',String(swapped));Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});},swapped);
 await page.goto('/?qa=1');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));
 const rows=[];mkdirSync(root,{recursive:true});
 for(const kmh of [0,100,266,320]){
  await page.evaluate(kmh=>(window as any).__drive.reset({distance:2750,speed:kmh/3.6}),kmh);
  await expect(page.locator('#speed strong')).toHaveText(String(kmh).padStart(3,'0'));
  const angle=Number((await page.locator('#speed-needle').getAttribute('transform'))!.match(/rotate\(([^ ]+)/)![1]);expect(angle).toBeCloseTo(-135+270*kmh/360,8);
  await expect(page.locator('#gear')).toHaveText(`G${kmh===0?1:kmh===100?3:6}`);
  const gauge=(await page.locator('#speed').boundingBox())!;
  const controls=['#steering-strip','#pause','#l2-praise','#l2-issue','#photo-button','#l2-hud',...(mobile?['[data-control=gas]','[data-control=brake]']:[])];
  for(const selector of controls){const target=page.locator(selector),box=(await target.boundingBox())!;expect(overlap(gauge,box),selector).toBe(false);
   if(selector!=='#l2-hud')expect(await target.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),`${selector} hit target`).toBe(true);
  }
  expect(gauge.y).toBeGreaterThan(60);expect(gauge.x).toBeGreaterThanOrEqual(20);expect(gauge.y+gauge.height).toBeLessThan(height);
  expect(await page.locator('#speed').evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');
  if(!before&&width>=844&&mobile){expect(gauge.width).toBeGreaterThanOrEqual(104);expect(gauge.width).toBeLessThanOrEqual(124);const font=await page.locator('#speed strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));expect(font).toBeGreaterThanOrEqual(38);expect(font).toBeLessThanOrEqual(44);}
  const frame=await page.evaluate(()=>(window as any).__drive.framing());if(width>=844){if(mobile&&swapped)expect(gauge.x).toBeGreaterThan(frame.right*width);else expect(gauge.x+gauge.width).toBeLessThan(frame.left*width);}else if(!before)expect(overlap(gauge,{x:frame.left*width,y:frame.top*height,width:frame.width*width,height:(frame.bottom-frame.top)*height}),'car clearance').toBe(false);
  if(!before&&mobile){const bar=(await page.locator('#steering-strip').boundingBox())!;expect(Math.abs(gauge.x+gauge.width/2-bar.x-bar.width/2)).toBeCloseTo(Math.min(56,Math.max(24,width*.06)),0);expect(bar.y-gauge.y-gauge.height).toBeCloseTo(2,0);expect(bar.height).toBe(48);expect(gauge.height).toBeLessThanOrEqual((frame.bottom-frame.top)*height);}
  rows.push({kmh,angle,gauge,frame});
  if(kmh===266||(width===844&&!swapped))await page.screenshot({path:`${root}/${width}-${swapped?'swapped':'normal'}-${kmh}.png`});
 }
 for(const [kmh,gear] of [[65,2],[155,4],[205,5]]){await page.evaluate(kmh=>(window as any).__drive.reset({distance:2750,speed:kmh/3.6}),kmh);await expect(page.locator('#gear')).toHaveText(`G${gear}`);}
 if(mobile){const touch=await touchDriver(page,context);await touch(.8,true,false);await page.evaluate(()=>(window as any).__drive.advance(.15));const inputs=await page.evaluate(()=>(window as any).__drive.snapshot().inputs);expect(inputs.gas).toBe(true);expect(inputs.steer).toBeGreaterThan(.5);await touch(null,false,false);}
 writeFileSync(`${root}/${width}-${swapped}.json`,JSON.stringify(rows,null,2));await context.close();
});
