import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root=process.env.OUTRUN_EVIDENCE_ROOT??'docs/evidence/v0.6/driving';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const scenarios=[{id:'medium',kind:'full-gas-sweep'},{id:'high',kind:'full-gas-sweep'},{id:'extreme',kind:'fast'},{id:'extreme',kind:'braked'}];
for(const {id,kind} of scenarios){
 const label=`${id}-${kind}`,context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true,recordVideo:{dir:root,size:{width:960,height:432}}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 await page.goto(`http://127.0.0.1:5173/?challenge=${id}`);await page.locator('#drive').click();
 const course=await page.evaluate(()=>window.__drive.challenges()),c=course.find(c=>c.id===id);
 const start=kind==='road-loop'?0:kind==='none'||kind==='matching'?c.start+c.transitionLength:c.start-80;
 await page.evaluate(d=>window.__drive.reset({distance:d,speed:230/3.6}),start);
 const cdp=await context.newCDPSession(page),strip=await page.locator('#steering-strip').boundingBox(),gas=await page.locator('[data-control=gas]').boundingBox(),brake=await page.locator('[data-control=brake]').boundingBox();let active=[];
 const touch=async(raw,gasOn,brakeOn)=>{
  const next=[];if(gasOn)next.push({id:1,x:gas.x+gas.width/2,y:gas.y+gas.height/2});
  if(raw!==null)next.push({id:2,x:strip.x+strip.width*(Math.max(-.99,Math.min(.99,raw))+1)/2,y:strip.y+strip.height/2});
  if(brakeOn)next.push({id:3,x:brake.x+brake.width/2,y:brake.y+brake.height/2});
  const removed=active.filter(a=>!next.some(n=>n.id===a.id));if(removed.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:removed});
  if(next.some(n=>!active.some(a=>a.id===n.id)))await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:next});
  if(next.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:next});active=next;
 };
 const rows=[];
 if(kind==='road-loop'){
  await page.evaluate(async()=>{const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),g=window.__drive,driver=scriptedDriver();window.captureTimer=setInterval(()=>{const s=g.snapshot();g.controls(driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample)));},30);});
 }
 const end=kind==='full-gas-sweep'?c.end+40:kind==='s-curve'?course.find(c=>c.id==='s-right').end+70:c.end;
 while(true){
  const s=await page.evaluate(()=>window.__drive.snapshot()),need=await page.evaluate(()=>window.__drive.steering().requiredSteer);
  if(kind==='road-loop'?s.elapsed>=125:kind==='none'||kind==='matching'?s.elapsed>=3:s.distance>=end||s.elapsed>=35)break;
  if(kind!=='road-loop'){
   const core=s.distance>=c.start+c.transitionLength&&s.distance<c.end-c.transitionLength;
   const raw=kind==='none'?0:kind==='matching'?c.targetRequiredSteering:(kind==='s-curve'||kind==='full-gas-sweep')?Math.round(need*4)/4:core?1:Math.min(1,Math.max(0,Math.round(need*4)/4));
   await touch(raw,kind!=='braked'||s.speed<190/3.6,kind==='braked'&&s.speed>191/3.6);
  }
  if(kind==='road-loop')s.probes=await page.evaluate(()=>{const g=window.__drive,s=g.snapshot();return [0,20,60].map(a=>g.surfaceProbe(s.distance+a));});
  rows.push(s);await page.waitForTimeout(kind==='road-loop'?100:40);
 }
 await touch(null,false,false);if(kind==='road-loop')await page.evaluate(()=>clearInterval(window.captureTimer));
 await page.screenshot({path:`${root}/${label}-end.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${label}.webm`);unlinkSync(await video.path());
 const summary={id,kind,errors,elapsed:rows.at(-1).elapsed,distance:rows.at(-1).distance,offRoad:rows.filter(s=>s.offRoad).length,minX:Math.min(...rows.map(s=>s.lateral)),maxX:Math.max(...rows.map(s=>s.lateral)),minKmh:Math.min(...rows.map(s=>s.speed*3.6)),maxKmh:Math.max(...rows.map(s=>s.speed*3.6))};
 writeFileSync(`${root}/${label}.json`,JSON.stringify({...summary,rows},null,2));console.log(JSON.stringify(summary));
}
await browser.close();
writeFileSync(`${root}/review.html`,`<!doctype html><meta charset="utf-8"><title>Gameplay-first course evidence</title><style>body{font:16px system-ui;color:#fff4de;background:#12343b;margin:24px}video{display:block;width:min(960px,100%)}h2{margin-top:28px}</style><h1>v0.6 actual gameplay</h1><p>All challenge clips use trusted touch events, including actual throttle/brake contacts. Paired entries start at 230 indicated km/h. These four clips use actual touch input; normal play has no autopilot. Videos are silent. Human PC/Pixel playtesting decides feel.</p>${scenarios.map(({id,kind})=>`<h2>${id} · ${kind}</h2><video controls muted preload="metadata" src="${id}-${kind}.webm" poster="${id}-${kind}-end.png"></video>`).join('')}`);

