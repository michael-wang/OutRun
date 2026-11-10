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
    (window as any).__systemExit=()=>{
      actualFullscreen=null;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
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
    await expect(page.locator('#racing-menu')).toHaveCount(0);
    await page.locator('#boot-enter').tap();
    await expect.poll(()=>page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(1);
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
    await page.locator('#boot-enter').tap();
    await page.locator('#start-race').tap();
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    await expect(page.locator('#rotate-launch-status')).toContainText('橫放手機');
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
    expect(await page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(0);
  }finally{await context.close();}
});

for(const pending of ['fullscreen','orientation'] as const){
  test('the first tap opens a usable menu while '+pending+' is pending',async({browser})=>{
    const {page,context}=await mobile(browser);
    try{
      await page.evaluate(pending=>{
        const target=pending==='orientation'?screen.orientation:document.documentElement;
        const method=pending==='orientation'?'lock':'requestFullscreen';
        Object.defineProperty(target,method,{configurable:true,value:()=>{
          document.documentElement.dataset.waitingFor=pending;
          return new Promise<void>((_,reject)=>{
            (window as any).__rejectRequest=()=>reject(new Error('Late browser response'));
          });
        }});
      },pending);
      await page.locator('#boot-enter').tap();
      await expect(page.locator('html')).toHaveAttribute('data-waiting-for',pending);
      await page.setViewportSize({width:915,height:412});
      await expect(page.locator('#boot')).toBeHidden();
      await expect(page.locator('#racing-menu canvas')).toHaveCount(3);
      await page.locator('[data-stage=city]').tap();
      await expect(page.locator('#start-race')).toHaveText(/製作中/);
      await page.locator('[data-stage=coast]').tap();
      if(pending==='orientation'){
        await page.screenshot({path:test.info().outputPath('landscape-first-tap.png')});
        await page.evaluate(()=>(window as any).__systemExit());
        await page.setViewportSize({width:412,height:915});
        await page.evaluate(()=>Object.defineProperty(screen.orientation,'lock',{value:async()=>{}}));
        await page.getByRole('button',{name:'切換橫向'}).tap();
        await expect.poll(()=>page.evaluate(()=>(window as any).__fullscreenRequests)).toBe(2);
        await page.evaluate(()=>(window as any).__rejectRequest());
        await expect(page.locator('.landscape-fallback')).toBeHidden();
        await page.setViewportSize({width:915,height:412});
      }
      await page.locator('#start-race').tap();
      await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:90000});
    }finally{await context.close();}
  });
}

test('system fullscreen exit can be recovered in the selector and a paused drive',async({browser})=>{
  const {page,context}=await mobile(browser);
  try{
    const calls=()=>page.evaluate(()=>(window as any).__fullscreenRequests);
    const portrait={width:412,height:915},landscape={width:915,height:412};
    await expect(page.locator('#boot-enter')).toBeVisible();
    const bootButton=await page.locator('#boot-enter').boundingBox();
    expect(bootButton!.y).toBeGreaterThan(page.viewportSize()!.height*.7);
    expect(bootButton!.x+bootButton!.width/2).toBeGreaterThan(page.viewportSize()!.width*.6);
    await page.screenshot({path:test.info().outputPath('mobile-ready.png')});
    // The entire ready screen accepts the gesture, including the logo.
    await page.touchscreen.tap(25,25);
    await expect(page.locator('#racing-menu')).toBeVisible();
    await expect.poll(calls).toBe(1);
    await page.setViewportSize(landscape);
    await page.evaluate(()=>(window as any).__systemExit());
    await page.setViewportSize(portrait);
    await page.locator('#racing-menu').getByRole('button',{name:'切換橫向'}).tap();
    await expect.poll(calls).toBe(2);
    await page.setViewportSize(landscape);
    await page.locator('#start-race').tap();
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
    await page.evaluate(()=>(window as any).__systemExit());
    await page.setViewportSize(portrait);
    const driveMode=page.locator('html');
    await expect(driveMode).toHaveAttribute('data-drive-mode','paused');
    const recover=await page.locator('#rotate button').boundingBox();
    expect(recover!.x).toBeGreaterThan(portrait.width/2);
    await page.screenshot({path:test.info().outputPath('recover-portrait.png')});
    await page.locator('#rotate').getByRole('button',{name:'切換橫向'}).tap();
    await expect.poll(calls).toBe(3);
    expect(await page.evaluate(()=>(window as any).__orientationRequests)).toEqual(Array(3).fill('landscape'));
    await page.setViewportSize(landscape);
    const dock=page.locator('#trip-pause-dock');
    await expect(dock.locator('button:visible')).toHaveText(['繼續','回到主選單','設定']);
    await page.screenshot({path:test.info().outputPath('pause-menu.png')});
    await dock.getByRole('button',{name:'設定',exact:true}).tap();
    await expect(dock.locator('button:visible')).toHaveText(['操作設定','音效　開','返回']);
    await dock.locator('#tp-sound').tap();
    await expect(dock.locator('#tp-sound')).toHaveAttribute('aria-pressed','false');
    await page.screenshot({path:test.info().outputPath('pause-settings.png')});
    await dock.locator('#tp-settings').tap();
    await expect(page.locator('#swap')).toBeVisible();
    await page.locator('#close-settings').tap();
    await expect(dock.locator('#tp-sound')).toBeVisible();
    await dock.locator('#tp-back').tap();
    await dock.locator('#tp-resume').tap();
    await expect(driveMode).toHaveAttribute('data-drive-mode','playing');
    await page.locator('#pause').tap();
    const lockedRoot=await page.evaluateHandle(()=>document.fullscreenElement);
    await dock.locator('#tp-exit').tap();
    await expect(page.locator('#racing-menu')).toBeVisible();
    await expect(page.locator('#view canvas')).toHaveCount(0);
    expect(page.workers()).toHaveLength(0);
    expect(await lockedRoot.evaluate(el=>el!==null && el===document.fullscreenElement)).toBe(true);
    expect(await calls()).toBe(3);
    await lockedRoot.dispose();
  }finally{await context.close();}
});
