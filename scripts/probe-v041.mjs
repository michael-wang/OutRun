import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const label=process.argv[2]||'after';const root='docs/evidence/v0.4.1';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge'}),page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true});
await page.goto('http://127.0.0.1:5173');await page.locator('#drive').click();await page.evaluate(()=>window.__drive.manual(true));
const points=[];const cdp=await page.context().newCDPSession(page),b=await page.locator('#steering-strip').boundingBox();
for(const x of [.1,.25,.5,.75,.9]){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*x,y:b.y+b.height/2,id:2}]});points.push({x,s:await page.evaluate(()=>window.__drive.snapshot())});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
const scan=await page.evaluate(()=>{const g=window.__drive,rows=[];for(let d=0;d<g.snapshot().trackLength;d+=5)for(const lateral of [-5,0,5])rows.push(g.surfaceProbe(d,lateral));return rows;});
const bad=scan.filter(r=>!r.hits.some(h=>h.name==='driving-surface')||r.hits[0].error>.1);
writeFileSync(`${root}/${label}-probe.json`,JSON.stringify({points,bad,scan},null,2));console.log(JSON.stringify({points:points.map(p=>({x:p.x,steer:p.s.inputs.steer})),bad:bad.length,examples:bad.slice(0,8)}));
for(const distance of [0,1935,2390,3085,3130,3195,4250,4350,6000,6250,6260,6280]){await page.evaluate(distance=>window.__drive.reset({distance,speed:65}),distance);await page.screenshot({path:`${root}/road-${label}-${distance}.png`});}
await browser.close();

