import type { Page } from '@playwright/test';
/** Legacy directional scenarios now touch the ends of the single analog strip. */
export async function controlPoint(page:Page,control:string,id:number){
 const steering=control==='left'||control==='right';
 const b=(await page.locator(steering?'#steering-strip':`[data-control=${control}]`).boundingBox())!;
 return {x:steering?(control==='left'?b.x+1:b.x+b.width-1):b.x+b.width/2,y:b.y+b.height/2,id};
}
/** Exercise the actual compact menu navigation rather than bypassing hidden UI. */
export async function menuAction(page:Page,id:string) {
  const playing=await page.evaluate(()=>(window as any).__drive?.snapshot().mode==='playing');
  if(!await page.locator(`#${id}`).isVisible())await page.locator('#pause').click();
  await page.locator(`#${id}`).click();
  if(id==='sound'&&playing)await page.locator('#resume').click();
}
