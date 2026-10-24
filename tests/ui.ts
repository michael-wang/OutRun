import type { Page } from '@playwright/test';
/** Exercise the actual compact menu navigation rather than bypassing hidden UI. */
export async function menuAction(page:Page,id:string) {
  const playing=await page.evaluate(()=>(window as any).__drive?.snapshot().mode==='playing');
  if(!await page.locator(`#${id}`).isVisible())await page.locator('#pause').click();
  await page.locator(`#${id}`).click();
  if(id==='sound'&&playing)await page.locator('#resume').click();
}
