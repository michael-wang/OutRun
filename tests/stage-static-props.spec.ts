import {test,expect} from '@playwright/test';

test('R1 coast prefab loads from its stage/prefab JSON at the authored site',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/?at=850');
 await page.locator('#start-race').click();
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');
 const props=await page.evaluate(()=>(window as any).__drive.authoredProps());
 expect(props).toHaveLength(1);
 expect(props[0]).toMatchObject({
  id:'hamlet-farmhouse',prefab:'taiwan-farmhouse',
  model:'assets/coast-props/r1-farmhouse.glb',meshes:1,
 });
 expect(props[0].position).toHaveLength(3);
 const asset=await page.request.get('/assets/coast-props/r1-farmhouse.glb');
 expect(asset.ok()).toBe(true);
 await page.locator('#race-start').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 await page.screenshot({path:test.info().outputPath('r1-authored-farmhouse-850.png')});
});
