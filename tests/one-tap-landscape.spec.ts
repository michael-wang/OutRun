import {test,expect,type Browser} from '@playwright/test';

const androidUA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const iphoneUA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

async function mobile(browser:Browser,ua=androidUA,holdRoad=false){
  const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua,serviceWorkers:'block',
  });
  await context.addInitScript(({holdRoad})=>{
    let actualFullscreen:Element|null=null;
    (window as any).__fullscreenRequests=0;
    (window as any).__orientationRequests=[];
    Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});
    Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>actualFullscreen});
    Object.defineProperty(Element.prototype,'requestFullscreen',{
      configurable:true,value:async function(this:Element){
        (window as any).__fullscreenRequests++;
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
  },{holdRoad});
  const page=await context.newPage();
  await page.goto('/');
  return {page,context};
}

test('one confirm requests landscape, then waits for Worker readiness',async({browser})=>{
  const {page,context}=await mobile(browser,androidUA,true);
  try{
    await page.locator('#start-race').tap();
    await expect(page.locator('#game-loading')).toBeVisible();
    const requests=await page.evaluate(()=>({
      fullscreen:(window as any).__fullscreenRequests,
      orientation:(window as any).__orientationRequests,
    }));
    expect(requests).toEqual({fullscreen:1,orientation:['landscape']});
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>Boolean((window as any).__releaseRoad && (window as any).__drive),null,{timeout:60000});
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).not.toBe('playing');
    await expect(page.locator('#game-loading')).toBeVisible();
    await page.evaluate(()=>(window as any).__releaseRoad());
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
  }finally{await context.close();}
});

test('iPhone selection waits for manual rotation without requesting fullscreen',async({browser})=>{
  const {page,context}=await mobile(browser,iphoneUA);
  try{
    await page.locator('#start-race').tap();
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    await expect(page.locator('#rotate-launch-status')).toContainText('橫放手機');
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
    expect(await page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(0);
  }finally{await context.close();}
});
