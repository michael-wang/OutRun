// Same frozen driving camera/waves, only the boat sun-shadow receiver toggled.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='docs/evidence/coast-r84/shadow-ab';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 await page.evaluate(()=>{window.__drive.manual(true);window.__drive.reset({distance:1650,speed:65});});await page.waitForTimeout(1500);
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(100);
 await page.evaluate(()=>window.__drive.coastBoatShadow(false));const off=await page.screenshot({path:`${root}/shadow-off.png`});
 const stats=await page.evaluate(()=>window.__drive.coastBoatShadow(true));const on=await page.screenshot({path:`${root}/shadow-on.png`});
 const difference=await page.evaluate(async ({off,on})=>{
  const a=new Image(),b=new Image();a.src=off;b.src=on;await Promise.all([a.decode(),b.decode()]);
  const c=document.createElement('canvas');c.width=a.width;c.height=a.height;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);const before=ctx.getImageData(0,0,c.width,c.height).data;
  ctx.drawImage(b,0,0);const after=ctx.getImageData(0,0,c.width,c.height).data;let changed=0,darkened=0,maxDrop=0;
  for(let i=0;i<before.length;i+=4){const drop=(before[i]+before[i+1]+before[i+2]-after[i]-after[i+1]-after[i+2])/3;if(Math.abs(drop)>3)changed++;if(drop>3)darkened++;maxDrop=Math.max(maxDrop,drop);}
  return {width:c.width,height:c.height,changed,darkened,maxDrop};
 },{off:'data:image/png;base64,'+off.toString('base64'),on:'data:image/png;base64,'+on.toString('base64')});
 await writeFile(`${root}/comparison.json`,JSON.stringify({errors,stats,difference},null,2));console.log(JSON.stringify({errors,stats,difference}));
 assert.deepEqual(errors,[]);assert.equal(stats.size,512);assert.ok(stats.casters>0&&stats.casters<=3);assert.ok(difference.darkened>20);
}finally{await browser.close();}
