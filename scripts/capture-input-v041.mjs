import {chromium} from '@playwright/test';
import {writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.4.1',browser=await chromium.launch({channel:'msedge',headless:true});
for(const label of ['touch-correction','drift-release']){
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true,recordVideo:{dir:root,size:{width:960,height:432}}});const page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(label=>{window.__drive.reset({distance:label==='touch-correction'?0:850,speed:55});window.inputRows=[];window.inputTimer=setInterval(()=>window.inputRows.push(window.__drive.snapshot()),16);},label);
 if(label==='touch-correction'){
  const cdp=await context.newCDPSession(page),b=await page.locator('#steering-strip').boundingBox(),p=await page.locator('[data-control=gas]').boundingBox(),gas={x:p.x+p.width/2,y:p.y+p.height/2,id:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas]});
  for(const x of [.25,.75]){const f={x:b.x+b.width*x,y:b.y+b.height/2,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,f]});await page.waitForTimeout(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[f]});await page.waitForTimeout(500);}
  const f={x:b.x+b.width*.2,y:b.y+b.height/2,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,f]});
  for(const x of [.2,.5,.8]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[gas,{...f,x:b.x+b.width*x}]});await page.waitForTimeout(150);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(500);
 }else{await page.keyboard.down('Space');await page.keyboard.down('d');await page.waitForTimeout(1800);await page.keyboard.up('d');await page.waitForTimeout(500);await page.keyboard.down('a');await page.waitForTimeout(600);await page.keyboard.up('a');await page.waitForTimeout(500);await page.keyboard.up('Space');}
 const rows=await page.evaluate(()=>{clearInterval(window.inputTimer);return window.inputRows;});await page.screenshot({path:`${root}/${label}-end.png`});writeFileSync(`${root}/${label}.json`,JSON.stringify(rows,null,2));const video=page.video();await context.close();await video.saveAs(`${root}/${label}.webm`);unlinkSync(await video.path());console.log(label,rows.length,Math.max(...rows.map(s=>s.audio.skidLevel)));
}
await browser.close();
