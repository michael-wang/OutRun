import {test,expect,type Page} from '@playwright/test';

const site=new URL(process.env.OUTRUN_SITE_BASE??'/','http://127.0.0.1:4173');
const startDistance=3438;
const playUrl=new URL(`?at=${startDistance}&fpsdiag=1&startupdiag=1`,site).href;

async function waitForCoast(page:Page){
 await page.waitForFunction(()=>document.querySelector<HTMLElement>('#game-loading')?.hidden&&
   (window as any).__startupDiagnostics?.report().completed,null,{timeout:90000});
 const report=await page.evaluate(()=>(window as any).__startupDiagnostics.report());
 for(const name of ['coast-ocean-ready','coast-boats-ready'])
  expect(report.events.find((e:{name:string})=>e.name===name)?.data.active).toBe(true);
 expect(report.finalReadiness.workerInitialized).toBe(true);
 expect(await page.evaluate(()=>!!(window as any).__driveFpsDiagnostics)).toBe(true);
}

test.afterEach(async({context},info)=>{
 if(info.status===info.expectedStatus)return;
 for(const p of context.pages())console.error('PWA page state',p.url(),await p.evaluate(()=>({
  loading:document.querySelector('#game-loading')?.getAttribute('data-phase'),
  distance:document.querySelector('#drive-distance')?.textContent,
  detail:document.querySelector('#loading-detail')?.textContent
 })));
});

test('installed coast launches online and offline within its publishing scope',async({page,context,request})=>{
 test.setTimeout(300000);
 const viewport={width:480,height:270};
 await page.setViewportSize(viewport);
 const errors:string[]=[];
 context.on('response',r=>{
  const url=new URL(r.url());
  if(url.origin===site.origin&&(r.status()>=400||!url.pathname.startsWith(site.pathname)))
   errors.push(r.status()+' '+url.pathname);
 });
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 page.on('pageerror',e=>errors.push(e.message));
 const manifestUrl=new URL('manifest.webmanifest',site);
 const manifest=await (await request.get(manifestUrl.href)).json();
 const start=new URL(manifest.start_url,manifestUrl);
 expect(start.href).toBe(site.href);
 expect(new URL(manifest.scope,manifestUrl).href).toBe(site.href);
 expect(manifest.id?new URL(manifest.id,start.origin).href:start.href).toBe(site.href);
 for(const icon of manifest.icons){
  const response=await request.get(new URL(icon.src,manifestUrl).href);
  expect(response.ok()).toBe(true);
  expect((await response.body()).readUInt32BE(16)).toBe(Number(icon.sizes.split('x')[0]));
 }
 await page.goto(playUrl);
 await waitForCoast(page);
 expect(await page.locator('link[rel=manifest]').evaluate((el:HTMLLinkElement)=>el.href)).toBe(manifestUrl.href);
 const distance=async()=>parseInt((await page.locator('#drive-distance').textContent())!.replaceAll(',',''),10);
 await expect.poll(distance,{timeout:30000}).toBe(startDistance);
 await page.keyboard.down('Space');
 try{await expect.poll(distance,{timeout:60000}).toBeGreaterThan(startDistance);}
 finally{await page.keyboard.up('Space');}
 await page.locator('#pause').click();
 await page.locator('#tp-more').click();
 await page.locator('#tp-replay').click();
 await waitForCoast(page);
 await expect.poll(distance,{timeout:30000}).toBe(startDistance);
 const registration=await page.evaluate(async()=>(await navigator.serviceWorker.ready).scope);
 expect(registration).toBe(site.href);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const cacheUrls=await page.evaluate(async scope=>{
  const name=(await caches.keys()).find(n=>n.startsWith('outrun:'+scope+':'))!;
  return (await (await caches.open(name)).keys()).map(req=>req.url);
 },site.href);
 expect(cacheUrls.every(url=>url.startsWith(site.href))).toBe(true);
 expect(cacheUrls.some(url=>url.includes('road-worker-'))).toBe(true);
 const audioUrl=cacheUrls.find(url=>url.endsWith('.mp3'))!;
 expect(await page.evaluate(async url=>{
  const buffer=await (await fetch(url)).arrayBuffer();
  return (await new OfflineAudioContext(1,1,44100).decodeAudioData(buffer)).duration;
 },audioUrl)).toBeGreaterThan(0);
 await page.close();
 await context.setOffline(true);
 const reopened=await context.newPage();
 await reopened.setViewportSize(viewport);
 await reopened.goto(playUrl);
 await waitForCoast(reopened);
 expect(errors).toEqual([]);
});
