import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.env.COAST_EVIDENCE_DIR??'docs/evidence/coast-r7',mobile=process.argv.includes('--mobile'),label=mobile?'mobile':'desktop';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:mobile?{width:960,height:432}:{width:1280,height:720},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5180/?showcase=coast');
 await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 const views=[];
 for(const d of process.env.COAST_VIEW_DISTANCES?.split(',').map(Number)??[1250,1850,4450,6100,6500,7600,8750,9200]){
  await page.evaluate(d=>{const g=window.__drive;g.manual(true);g.reset({distance:d,speed:65});},d);
  await page.waitForFunction(()=>window.__drive.streaming().ready,null,{timeout:60000});
  await page.waitForTimeout(1500);
  await page.evaluate(()=>window.__drive.advance(0));
  await page.screenshot({path:`${root}/${label}-${d}.png`});
  views.push(await page.evaluate(()=>({state:window.__drive.snapshot(),scene:window.__drive.scenery(),nature:window.__drive.coastNature(),water:window.__drive.coastWater(),stream:window.__drive.streaming()})));
 }
 await writeFile(`${root}/${label}-views.json`,JSON.stringify({browser:'Headless Edge on desktop hardware; mobile is viewport/touch emulation',errors,views},null,2));
 console.log(JSON.stringify({errors,views:views.map(v=>({d:v.state.distance,render:v.scene.render,memory:v.scene.memory}))}));
}finally{await browser.close();}
