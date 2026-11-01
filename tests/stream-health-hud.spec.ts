import {test,expect} from '@playwright/test';

test('QA mode displays compact 1Hz streaming health and supports JSON export',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.goto('/?qa=1&streamhud=1');
  const hud=page.locator('#stream-health-hud');
  await expect(hud).toBeVisible();
  await expect(page.locator('#stream-diagnostics')).toHaveCount(0);
  for(const channel of ['road','scenery','memory'])await expect(hud.locator(`[data-channel="${channel}"]`)).toBeVisible();
  await expect(hud.locator('.sh-details')).toContainText('Road ahead',{timeout:15000});
  await expect(hud.locator('.sh-details')).toContainText('Worker P95');
  const data=await page.evaluate(()=>(window as any).__streamDiagnostics.snapshot());
  expect(data.lifecycle.enabled).toBe(true);
  expect(data.lifecycle.queues).toBeDefined();
  const download=page.waitForEvent('download');
  await hud.locator('.sh-export').click();
  expect((await download).suggestedFilename()).toBe('outrun-stream-diagnostics.json');
 }finally{await context.close();}
});

test('no debug R/S/M telemetry in public player mode even with streamhud query',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?streamhud=1&seed=1');
 await expect(page.locator('#player-start')).toBeVisible();
 await expect(page.locator('#stream-health-hud')).toHaveCount(0);
 await expect(page.locator('#stream-diagnostics')).toHaveCount(0);
});

test('legacy streamdiag panel continues to work without new compact HUD',async({page})=>{
 await page.goto('/?qa=1&streamdiag=1');
 await expect(page.locator('#stream-diagnostics')).toBeVisible();
 await expect(page.locator('#stream-health-hud')).toHaveCount(0);
 await expect(page.locator('#stream-diagnostic-text')).toContainText('Road',{timeout:15000});
});
