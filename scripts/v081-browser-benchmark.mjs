import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.8.1';mkdirSync(root,{recursive:true});const label=process.argv[2]||'after',browser=await chromium.launch({channel:'msedge',headless:true}),runs=[];
for(const fps of [30,60]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?lab=l2&l2=L2-003');await page.locator('#l2-play').click();await page.evaluate(()=>{const g=window.__drive;g.manual(true);g.reset({distance:350,speed:0});});
 const rows=await page.evaluate(fps=>{const g=window.__drive,rows=[];for(let i=0;i<fps*35;i++){const s=g.snapshot();g.controls({gas:true,brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.1))});g.advance(1/fps);rows.push(g.snapshot());}g.controls();return rows;},fps);await page.screenshot({path:`${root}/powertrain-${label}-${fps}.png`});
 const shifts=[];for(let i=1;i<rows.length;i++)if(rows[i].gear>rows[i-1].gear)shifts.push({from:rows[i-1].gear,to:rows[i].gear,rows:rows.slice(Math.max(0,i-3),i+Math.ceil(fps*.5))});
 runs.push({fps,errors,shifts,rows:rows.map(s=>({t:s.elapsed,kmh:s.speed*3.6,gear:s.gear,rpm:s.rpm,gearRatio:s.gearRatio,engineTorque:s.engineTorque,traction:s.tractionFactor,drive:s.driveForce,drag:s.roadDrag,acceleration:s.netAcceleration,grade:s.grade,distance:s.distance,offRoad:s.offRoad}))});await page.close();
}writeFileSync(`${root}/browser-powertrain-${label}.json`,JSON.stringify(runs,null,2));await browser.close();
