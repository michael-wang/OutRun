import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/player-splash';
test.beforeAll(()=>mkdirSync(root,{recursive:true}));
for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]] as const){
 test(`${name}: approved image, minimal public UI and natural rotation`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height},isMobile:name!=='desktop',hasTouch:name!=='desktop',serviceWorkers:'block'});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/');
  const art=page.locator('#startup-art');await expect(art).toBeVisible();
  await expect.poll(()=>page.locator('#startup-art img').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await page.locator('#startup-art img').evaluate((el:HTMLImageElement)=>el.currentSrc)).toContain(name==='portrait'?'start-portrait.png':'start-landscape.png');
  const images=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/start-(portrait|landscape)\.png/.test(e.name)).map(e=>e.name));expect(images).toHaveLength(1);
  await expect(page.locator('#stage-seed')).toBeHidden();await expect(page.locator('#l2-export')).toBeHidden();
  if(name==='portrait'){
   await expect(page.locator('#rotate')).toBeVisible();await expect(page.locator('#rotate-fullscreen')).toBeHidden();
   await expect(page.locator('#player-start')).toBeHidden();
  }else await expect(page.locator('#player-title')).toHaveText('極速漫遊');
  await page.screenshot({path:`${root}/${name}.png`});
  if(name==='portrait'){await page.setViewportSize({width:844,height:390});await expect(page.locator('#rotate')).toBeHidden();}
  await expect(page.locator('#player-play')).toBeEnabled({timeout:45000});
  const readyMs=await page.evaluate(()=>performance.now());
  await page.locator('#player-options').click();await expect(page.locator('#preferences')).toBeVisible();await page.locator('#swap').check();await page.locator('#close-settings').click();
  await page.locator('#player-sound').click();await expect(page.locator('#player-sound')).toHaveText('音效關');await page.locator('#player-sound').click();await expect(page.locator('#player-sound')).toHaveText('音效開');
  await page.locator('#player-play').click();await expect(art).toBeHidden();await expect(page.locator('#speed')).toBeVisible();if(name==='desktop')await page.screenshot({path:`${root}/gameplay.png`});
  await page.locator('#pause').click();await expect(page.locator('#player-play')).toHaveText('繼續駕駛');await expect(art).toBeHidden();
  await page.locator('#player-play').click();await expect(art).toBeHidden();await expect(page.locator('#ready-countdown')).toBeHidden({timeout:5000});
  await page.locator('#pause').click();await page.locator('#player-restart').click();await expect(art).toBeHidden({timeout:45000});
  expect(errors).toEqual([]);writeFileSync(`${root}/${name}.json`,JSON.stringify({viewport:{width,height},browser:browser.version(),readyMs,images,errors,physicalDevice:false},null,2));await context.close();
 });
}
test('artwork appears before the game module loads',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/src/main.ts',async route=>{await gate;await route.continue();});
 await page.goto('/?playerui=1',{waitUntil:'commit'});await expect(page.locator('#startup-art')).toBeVisible();
 await expect.poll(()=>page.locator('#startup-art img').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
 expect(await page.locator('#view canvas').count()).toBe(0);release();await expect(page.locator('#player-title')).toBeVisible();
});
test('failed Worker preparation provides retry and never starts on absent road',async({page})=>{
 await page.addInitScript(()=>{window.Worker=class {constructor(){throw new Error('Injected worker launch failure');}} as any;});
 await page.goto('/?playerui=1');await expect(page.locator('#player-loading')).toHaveText('道路載入失敗，請重試。');await expect(page.locator('#player-play')).toBeDisabled();await expect(page.locator('#player-retry')).toBeVisible();
 const state=await page.evaluate(()=>(window as any).__drive.streaming());expect(state.retries).toBe(2);expect(state.currentRoad).toBe(false);writeFileSync(`${root}/failed-worker.json`,JSON.stringify(state,null,2));
 await page.screenshot({path:`${root}/failed-worker.png`});await Promise.all([page.waitForNavigation(),page.locator('#player-retry').click()]);await expect(page.locator('#player-retry')).toBeVisible();
});
test('delayed Worker stays on splash then permits a safe start',async({page})=>{
 await page.addInitScript(()=>{const NativeWorker=window.Worker;window.Worker=class extends NativeWorker {postMessage(message:any,transfer:Transferable[]=[]){if(message.type==='init')(window as any).__releaseWorker=()=>super.postMessage(message,transfer);else super.postMessage(message,transfer);}};});
 await page.goto('/?playerui=1');await expect(page.locator('#player-play')).toBeDisabled();await expect(page.locator('#player-loading')).toHaveText('道路準備中…');await expect(page.locator('#startup-art')).toBeVisible();await page.evaluate(()=>(window as any).__releaseWorker());
 await expect(page.locator('#player-play')).toBeEnabled({timeout:45000});expect(await page.evaluate(()=>(window as any).__drive.streaming().currentRoad)).toBe(true);await page.locator('#player-play').click();await expect(page.locator('#startup-art')).toBeHidden();
});
test('missing title ID reproduces the pre-fix startup exception',async({page})=>{
 const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/src/main.ts',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('id="player-title" class="player-title"','class="player-title"')});});
 await page.goto('/?playerui=1');await expect(page.locator('#startup-fallback')).toBeVisible();
 expect(errors.some(e=>e.includes('textContent'))).toBe(true);
 const message=await page.locator('#startup-fallback').innerText();writeFileSync(`${root}/startup-regression.json`,JSON.stringify({mutation:'Restore missing player-title ID from 83eaa8f',message,errors},null,2));
});
test('production QA retains tools and excludes splash',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?streamdiag=1');await expect(page.locator('#player-title')).toBeVisible();await expect(page.locator('#stream-diagnostics')).toHaveCount(0);
 await page.goto('http://127.0.0.1:4173/?qa=1');await expect(page.locator('#stage-seed')).toBeVisible();await expect(page.locator('#l2-export')).toBeVisible();await expect(page.locator('#startup-art')).toBeHidden();await expect(page.locator('#player-start')).toBeHidden();
});

test('silent Worker exposes slow-loading retry instead of waiting indefinitely',async({page})=>{
 await page.addInitScript(()=>{window.Worker=class {postMessage(){} terminate(){}} as any;});
 await page.goto('/?playerui=1');await expect(page.locator('#player-play')).toBeDisabled();
 await page.evaluate(()=>{const now=performance.now.bind(performance);performance.now=()=>now()+46000;});
 await expect(page.locator('#player-loading')).toContainText('道路準備時間較長');await expect(page.locator('#player-retry')).toBeVisible();await expect(page.locator('#startup-art')).toBeVisible();
 writeFileSync(`${root}/silent-worker.json`,JSON.stringify(await page.evaluate(()=>(window as any).__drive.streaming()),null,2));
});
