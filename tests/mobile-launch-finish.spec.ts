import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const site=new URL(process.env.OUTRUN_SITE_BASE??'/','http://127.0.0.1:4173');
test.use({viewport:{width:412,height:915},isMobile:true,hasTouch:true,serviceWorkers:'block',
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});

test('touch selection, portrait guide, results, replay and repeated menu returns',async({page})=>{
  test.setTimeout(300000);
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('?at=10300&fpsdiag=1',site).href);
  const menu=page.locator('#racing-menu'),start=page.locator('#start-race');
  await expect(menu).toBeVisible();
  await page.screenshot({path:test.info().outputPath('menu-portrait.png')});
  await page.setViewportSize({width:915,height:412});
  await page.screenshot({path:test.info().outputPath('menu-pixel8-landscape.png')});
  await page.locator('[data-stage=city]').tap();
  await expect(start).toHaveText(/製作中/);
  await page.locator('[data-stage=coast]').tap();
  await page.setViewportSize({width:412,height:915});
  await start.tap();
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await expect(page.locator('#rotate-launch-status')).toContainText('請手動橫放手機');
  await page.setViewportSize({width:915,height:412});

  const results=page.getByRole('region',{name:'旅程結算'});
  async function finish(){
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:90000});
    await expect(page.locator('#game-loading')).toBeHidden();
    await expect(page.locator('#view canvas')).toHaveCount(1);
    await page.keyboard.down('Space');
    try{await expect(results).toBeVisible({timeout:60000});}
    finally{await page.keyboard.up('Space');}
  }
  await finish();
  await page.screenshot({path:test.info().outputPath('results.png')});
  const button=results.getByRole('button',{name:'匯出 FPS 診斷 JSON'});
  await expect(button).toBeInViewport({ratio:1});
  expect(await button.evaluate(el=>document.fullscreenElement?.contains(el))).toBe(true);
  const download=page.waitForEvent('download');
  await button.tap();
  const file=await download;
  const report=JSON.parse(await readFile((await file.path())!,'utf8'));
  expect(report.kind).toBe('outrun-drive-fps-diagnostic-v1');
  expect(report.seconds.length).toBeGreaterThan(0);

  await results.getByRole('button',{name:'再玩一次'}).tap();
  await finish();
  for(let cycle=0;cycle<2;cycle++){
    const oldDocument=await page.evaluateHandle(()=>document);
    await results.getByRole('button',{name:'回到主選單'}).tap();
    await expect(menu).toBeVisible();
    await expect(page.locator('#view canvas')).toHaveCount(0);
    await expect(page.locator('#gamepad-status')).toHaveCount(1);
    expect(page.workers()).toHaveLength(0);
    await expect(oldDocument.evaluate(el=>el.isConnected)).rejects.toThrow();
    if(cycle===0){await start.tap();await finish();}
  }
  expect(errors).toEqual([]);
});

for(const device of ['Android','iPhone']){
  test(device+' stays in portrait after selection until manual rotation',async({page})=>{
    await page.addInitScript(device=>{
      if(device==='iPhone')Object.defineProperty(navigator,'userAgent',{value:'iPhone Safari'});
      Element.prototype.requestFullscreen=async()=>{throw Error('Fullscreen denied');};
    },device);
    await page.goto(site.href);
    await page.locator('#start-race').tap();
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    await expect(page.locator('#rotate-launch-status')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','menu');
    await page.setViewportSize({width:915,height:412});
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
  });
}
