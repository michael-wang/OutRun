import {test,expect} from '@playwright/test';
test.use({viewport:{width:960,height:540},serviceWorkers:'block'});

test('F8 photo includes the real on-screen DOM HUD instead of a diagnostic stripe',async({page})=>{
 test.setTimeout(120000);
 await page.route('**/__outrun_capture',route=>route.fulfill({status:200,json:{path:'captures/composited.png'}}));
 await page.goto('/?trafficSeed=17');
 await page.locator('#start-race').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:90000});
 await expect(page.locator('#race-position')).toBeVisible();
 // A bright fixed overlay tests the same CSS layer as the real ranking, FPS and controls.
 await page.evaluate(()=>{
  const marker=document.createElement('div');marker.id='screenshot-color-marker';
  marker.textContent='UI MUST BE VISIBLE';
  marker.style.cssText='position:fixed;left:230px;top:130px;width:96px;height:46px;background:rgb(255,0,255);color:white;z-index:99999;pointer-events:none';
  document.body.append(marker);
 });
 const request=page.waitForRequest(r=>r.url().endsWith('/__outrun_capture')&&r.method()==='POST',{timeout:30000});
 await page.keyboard.press('F8');
 const png=(await request).postDataJSON().png as string;
 expect(png.startsWith('data:image/png;base64,')).toBe(true);
 const color=await page.evaluate(async(data:string)=>{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=reject;image.src=data;});
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  const x=Math.round(278*image.width/innerWidth),y=Math.round(153*image.height/innerHeight);
  return [...ctx.getImageData(x,y,1,1).data];
 },png);
 expect(color[0]).toBeGreaterThan(190);
 expect(color[1]).toBeLessThan(80);
 expect(color[2]).toBeGreaterThan(185);
});
