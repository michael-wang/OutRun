import type {Page,BrowserContext} from '@playwright/test';
/** Trusted touch events for test-only driving; never bundled in normal gameplay. */
export async function touchDriver(page:Page,context:BrowserContext){
 const cdp=await context.newCDPSession(page),strip=(await page.locator('#steering-strip').boundingBox())!,gas=(await page.locator('[data-control=gas]').boundingBox())!,brake=(await page.locator('[data-control=brake]').boundingBox())!;
 let active:{id:number;x:number;y:number}[]=[];
 return async(raw:number|null,gasOn:boolean,brakeOn:boolean)=>{
  const next=[];
  if(gasOn)next.push({id:1,x:gas.x+gas.width/2,y:gas.y+gas.height/2});
  if(raw!==null)next.push({id:2,x:strip.x+strip.width*(Math.max(-.99,Math.min(.99,raw))+1)/2,y:strip.y+strip.height/2});
  if(brakeOn)next.push({id:3,x:brake.x+brake.width/2,y:brake.y+brake.height/2});
  const removed=active.filter(a=>!next.some(n=>n.id===a.id));
  if(removed.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:removed});
  if(next.some(n=>!active.some(a=>a.id===n.id)))await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:next});
  if(next.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:next});
  active=next;
 };
}
