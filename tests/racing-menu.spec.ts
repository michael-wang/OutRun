import {test,expect,type Page} from '@playwright/test';

const site=new URL(process.env.OUTRUN_SITE_BASE??'/','http://127.0.0.1:4173');
const shot=(page:Page,name:string)=>page.screenshot({path:test.info().outputPath(name+'.png')});
test.use({serviceWorkers:'block'});

test('boot, three previews and input ownership before the coast module',async({page})=>{
  await page.setViewportSize({width:1440,height:850});
  const requests:string[]=[];
  page.on('request',req=>requests.push(req.url()));
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const buttons=Array.from({length:18},()=>({pressed:false,value:0}));
    buttons[0].pressed=true; // Cross may still be held on return from Results.
    const pad={connected:true,mapping:'standard',buttons,axes:[0,0]};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
    (window as any).menuPad=pad;
  });
  let release!:()=>void;
  const hold=new Promise<void>(resolve=>release=resolve);
  await page.route('**/racing-menu-*.js',async route=>{await hold;await route.continue();});
  await page.goto(site.href,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#boot')).toBeVisible();
  await expect(page.locator('#runtime-readout')).toBeVisible();
  await expect(page.locator('#game-version')).toHaveText(/^v\d+\.\d+\.\d+(?:-dev\.\d+)?$/);
  await shot(page,'boot');
  release();
  const stage=(id:string)=>page.locator('[data-stage='+id+']');
  await expect(stage('coast')).toHaveAttribute('aria-pressed','true');
  await shot(page,'menu-coast');
  await page.evaluate(()=>{(window as any).menuPad.buttons[0].pressed=false;});
  await page.keyboard.press('ArrowRight');
  await expect(stage('city')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#start-race')).toHaveAttribute('aria-disabled','true');
  await expect(page.locator('.racing-sr')).toHaveText('城市製作中');
  await stage('canyon').click();
  await page.waitForTimeout(260); // Capture the settled colour and scale.
  await shot(page,'menu-canyon');
  async function pulse(index:number){
    await page.evaluate(async i=>{
      const button=(window as any).menuPad.buttons[i];
      button.pressed=true;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      button.pressed=false;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    },index);
  }
  await pulse(14);
  await expect(stage('city')).toHaveAttribute('aria-pressed','true');
  await pulse(0);
  await expect(page.locator('.racing-sr')).toHaveText('城市製作中');
  const axis=(x:number)=>page.evaluate(x=>{(window as any).menuPad.axes[0]=x;},x);
  await axis(.22);
  await page.waitForTimeout(80);
  await expect(stage('city')).toHaveAttribute('aria-pressed','true');
  await axis(.8);
  await page.waitForTimeout(400);
  await expect(stage('canyon')).toHaveAttribute('aria-pressed','true');
  await axis(0);
  await pulse(15);
  await expect(stage('coast')).toHaveAttribute('aria-pressed','true');
  expect(requests.some(url=>/main-.*\.js|road-worker|coast-shore|start-(portrait|landscape)\.png/.test(url))).toBe(false);
  // Hold the real stage download to inspect the loading artwork deterministically.
  let resume!:()=>void;
  const stageDownload=new Promise<void>(resolve=>resume=resolve);
  await page.route('**/main-*.js',async route=>{await stageDownload;await route.continue();});
  await pulse(0);
  await expect(page.locator('#racing-menu')).toHaveCount(0);
  await expect(page.locator('#game-loading')).toBeVisible();
  await expect(page.locator('#runtime-readout')).toBeVisible();
  await page.locator('#stage-art img').evaluate((img:HTMLImageElement)=>img.decode());
  await shot(page,'stage-loading');
  resume();
  expect(errors).toEqual([]);
});

test('a failed stage module can be retried with a clean stage document',async({page})=>{
  await page.setViewportSize({width:640,height:360});
  let fail=true;
  await page.route('**/main-*.js',route=>fail?route.abort():route.continue());
  await page.goto(site.href);
  await page.locator('#start-race').click();
  await expect(page.locator('#stage-retry')).toBeVisible();
  fail=false;
  await page.locator('#stage-retry').click();
  await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:90000});
  await expect(page.locator('#game-loading')).toBeHidden();
});

test('boot retry recovers when the entry script is unavailable',async({page})=>{
  await page.route('**/assets/index-*.js',route=>route.abort());
  await page.goto(site.href);
  await expect(page.locator('#boot-error')).toBeVisible();
  await page.unroute('**/assets/index-*.js');
  await page.locator('#boot-error button').click();
  await expect(page.locator('[data-stage=coast]')).toHaveAttribute('aria-pressed','true');
});
