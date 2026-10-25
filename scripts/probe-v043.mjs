import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.4.3';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true});
await page.goto('http://127.0.0.1:5173/?challenge=low');await page.locator('#drive').click();await page.evaluate(()=>window.__drive.manual(true));
const course=await page.evaluate(()=>window.__drive.challenges());
for(const id of ['low','medium','high','extreme','s-left','s-right']){
 const c=course.find(c=>c.id===id);await page.evaluate(d=>window.__drive.reset({distance:d,speed:230/3.6}),c.start+c.transitionLength+30);await page.screenshot({path:`${root}/${id}-scene.png`});
}
const data=await page.evaluate(()=>{const g=window.__drive,scan=[],path=[];for(let d=0;d<g.snapshot().trackLength;d+=5){path.push(g.sample(d));for(const x of [-5,0,5])scan.push(g.surfaceProbe(d,x));}return {path,scan,bad:scan.filter(p=>p.hits[0]?.name!=='driving-surface'||Math.abs(p.hits[0].error)>.1)};});
writeFileSync(`${root}/surface-probe.json`,JSON.stringify(data,null,2));console.log(JSON.stringify({bad:data.bad.length,examples:data.bad.slice(0,3),length:await page.evaluate(()=>window.__drive.snapshot().trackLength)}));
await browser.close();
