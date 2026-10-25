import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.6/occupants';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const name of ['stopped-side','fast-side','fast-chase','left-chase','right-chase','left-cockpit','right-cockpit']){
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,recordVideo:{dir:root,size:{width:960,height:432}}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(name=>{const g=window.__drive,turn=name.startsWith('left')?-1:name.startsWith('right')?1:0,c=g.challenges().find(c=>c.id===(turn<0?'canyon-left':'extreme'));g.reset({distance:turn?c.start+c.transitionLength:100,speed:name.startsWith('stopped')?0:65});if(!name.endsWith('chase'))g.carView(name.endsWith('side')?'side':'cockpit');g.manual(false);g.controls({gas:!name.startsWith('stopped'),brake:false,steer:turn});},name);
 const rows=[],began=Date.now();while(Date.now()-began<5000){rows.push(await page.evaluate(()=>({state:window.__drive.snapshot(),occupants:window.__drive.occupants(),scene:window.__drive.scenery()})));await page.waitForTimeout(80);}
 await page.screenshot({path:`${root}/${name}.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${name}.webm`);unlinkSync(await video.path());writeFileSync(`${root}/${name}.json`,JSON.stringify({errors,rows},null,2));console.log(name,errors);
}await browser.close();
