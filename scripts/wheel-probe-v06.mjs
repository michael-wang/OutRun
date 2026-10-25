import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.6/wheels';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const name of ['stopped','launch-brake','fast','right-drift','left-drift']){
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,recordVideo:{dir:root,size:{width:960,height:432}}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(name=>{const g=window.__drive,c=g.challenges().find(c=>c.id===(name==='left-drift'?'canyon-left':'extreme'));g.reset({distance:name.endsWith('drift')?c.start+c.transitionLength:100,speed:name==='fast'||name.endsWith('drift')?65:0});g.carView('side');g.manual(false);g.controls({gas:name!=='stopped',brake:false,steer:name==='right-drift'?1:name==='left-drift'?-1:0});},name);
 const rows=[],start=Date.now(),duration=name==='launch-brake'?9000:4000;
 while(Date.now()-start<duration){if(name==='launch-brake'&&Date.now()-start>4500)await page.evaluate(()=>window.__drive.controls({gas:false,brake:true,steer:0}));rows.push(await page.evaluate(()=>({state:window.__drive.snapshot(),wheels:window.__drive.wheels()})));await page.waitForTimeout(50);}
 await page.screenshot({path:`${root}/${name}.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${name}.webm`);unlinkSync(await video.path());writeFileSync(`${root}/${name}.json`,JSON.stringify({errors,rows},null,2));console.log(name,errors);
}
await browser.close();
