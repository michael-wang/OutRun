import type {Page} from '@playwright/test';

/** Wait for the current streamed window; these tests explicitly move their
 * inspection camera, unlike ordinary real-time driving. */
export async function stageReady(page:Page){await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:30000,polling:100});}
export async function inspectAt(page:Page,distance:number){await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:60});},distance);await stageReady(page);}
