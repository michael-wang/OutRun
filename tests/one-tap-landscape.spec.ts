import {test,expect,type Browser} from '@playwright/test';

const androidUA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const iphoneUA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

async function mobile(browser:Browser,ua=androidUA,holdRoad=false,denyFullscreen=false){
  const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua,serviceWorkers:'block',
  });
  await context.addInitScript(({holdRoad,denyFullscreen})=>{
    let actualFullscreen:Element|null=null;
    (window as any).__fullscreenRequests=0;
    (window as any).__orientationRequests=[];
    Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});
    Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>actualFullscreen});
    Object.defineProperty(Element.prototype,'requestFullscreen',{
      configurable:true,value:async function(this:Element){
        (window as any).__fullscreenRequests++;
        if(denyFullscreen)throw Error('Injected fullscreen rejection');
        actualFullscreen=this;
        document.dispatchEvent(new Event('fullscreenchange'));
      },
    });
    const orientation=screen.orientation;
    const lock=async(value:string)=>{(window as any).__orientationRequests.push(value);};
    if(orientation)Object.defineProperty(orientation,'lock',{configurable:true,value:lock});
    else Object.defineProperty(screen,'orientation',{configurable:true,value:{lock}});
    if(holdRoad){
      const NativeWorker=window.Worker;
      window.Worker=class extends NativeWorker{
        postMessage(message:any,transfer?:Transferable[]){
          if(message.type==='init') {
            (window as any).__releaseRoad=()=>super.postMessage(message,transfer);
            return;
          }
          super.postMessage(message,transfer);
        }
      } as typeof Worker;
    }
  },{holdRoad,denyFullscreen});
  const page=await context.newPage();
  await page.goto('/?seed=1&playerui=1');
  return {page,context};
}

test('Android portrait: one tap requests fullscreen and landscape before road is ready',async({browser})=>{
  const {page,context}=await mobile(browser,androidUA,true);
  try{
    await expect(page.locator('#rotate')).toBeVisible();
    await expect(page.locator('#rotate-launch')).toBeVisible();
    await expect(page.locator('#rotate-launch')).toHaveText('全螢幕出發！');
    await expect(page.locator('#player-start')).toBeHidden();
    await expect(page.locator('#startup-art')).toBeVisible();
    await page.locator('#rotate-launch').tap();
    await expect(page.locator('#rotate-launch-status')).toBeVisible();
    const requests=await page.evaluate(()=>({
      fullscreen:(window as any).__fullscreenRequests,
      orientation:(window as any).__orientationRequests,
    }));
    expect(requests.fullscreen).toBe(1);
    expect(requests.orientation).toEqual(['landscape']);
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#rotate')).toBeHidden();
    await expect(page.locator('#player-play')).toBeDisabled();
    await expect(page.locator('#startup-art')).toBeVisible();
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).not.toBe('playing');
    await page.evaluate(()=>(window as any).__releaseRoad());
    await expect(page.locator('#startup-art')).toBeHidden({timeout:45000});
    await expect(page.locator('#speed')).toBeVisible();
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
    expect(await page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(1);
  }finally{await context.close();}
});

test('Android fullscreen denial: stays safe in portrait then begins after manual landscape',async({browser})=>{
  const {page,context}=await mobile(browser,androidUA,false,true);
  try{
    await expect(page.locator('#rotate-launch')).toBeVisible();
    await page.locator('#rotate-launch').tap();
    await expect(page.locator('#rotate-launch-status')).toContainText('請手動橫放手機');
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).not.toBe('playing');
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#startup-art')).toBeHidden({timeout:45000});
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
  }finally{await context.close();}
});

test('iPhone Safari: no fake fullscreen button; manual landscape keeps normal Play',async({browser})=>{
  const {page,context}=await mobile(browser,iphoneUA);
  try{
    await expect(page.locator('#rotate')).toBeVisible();
    await expect(page.locator('#rotate-launch')).toBeHidden();
    await expect(page.locator('#rotate')).toContainText('橫放手機');
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#rotate')).toBeHidden();
    await expect(page.locator('#player-start')).toBeVisible();
    await expect(page.locator('#player-play')).toBeEnabled({timeout:45000});
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).not.toBe('playing');
    expect(await page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(0);
  }finally{await context.close();}
});

test('QA entry retains legacy controls rather than public one-tap startup',async({page})=>{
  await page.goto('/?qa=1');
  await expect(page.locator('#l2-lab')).toBeVisible();
  await expect(page.locator('#rotate-launch')).toBeHidden();
  await expect(page.locator('#player-start')).toBeHidden();
});
