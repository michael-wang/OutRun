import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c';
test('180s at 30/60Hz crosses full track and loop seams with visible unobstructed asphalt',async({page})=>{
 test.setTimeout(180000);mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:960,height:432});await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const runs=[];
 for(const hz of [30,60]){
  await page.evaluate(()=>(window as any).__drive.reset({distance:5600,speed:65}));const rows=[];
  for(let seconds=0;seconds<180;seconds++){
   const row=await page.evaluate(async hz=>{const path='/tests/driver.ts';const {scriptedDriver,plannedSpeed}=await import(path);const g=(window as any).__drive,driver=scriptedDriver();for(let i=0;i<10;i++){const s=g.snapshot(),input=driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample,1.75));for(let frame=0;frame<hz/10;frame++)g.advance(1/hz,input);}const s=g.snapshot();return {state:s,probes:[0,20,60].map(a=>g.surfaceProbe(s.distance+a))};},hz);
   rows.push(row);expect(row.state.offRoad).toBe(false);expect(Math.abs(row.state.surfaceError)).toBeLessThan(.1);
   for(const probe of row.probes){expect(probe.hits[0]?.name).toBe('driving-surface');expect(Math.abs(probe.hits[0].error)).toBeLessThan(.1);}
   if(seconds%15===0||Math.floor((rows.at(-2)?.state.distance??5600)/row.state.trackLength)!==Math.floor(row.state.distance/row.state.trackLength))await page.screenshot({path:`${root}/road-${hz}hz-${seconds+1}s.png`});
  }
  expect(rows.at(-1)!.state.elapsed).toBeGreaterThanOrEqual(179.99);expect(rows.at(-1)!.state.distance).toBeGreaterThan(rows.at(-1)!.state.trackLength+5600);runs.push({hz,rows});
 }
 expect(Math.abs(runs[0].rows.at(-1)!.state.distance-runs[1].rows.at(-1)!.state.distance)).toBeLessThan(1);expect(errors).toEqual([]);
 const scan=await page.evaluate(()=>{const g=(window as any).__drive,rows=[];for(let d=0;d<g.snapshot().trackLength;d+=5)for(const lateral of [-5,0,5])rows.push(g.surfaceProbe(d,lateral));return rows;});
 expect(scan.every(p=>p.hits[0]?.name==='driving-surface'&&Math.abs(p.hits[0].error)<.1)).toBe(true);
 const edges=await page.evaluate(()=>{const g=(window as any).__drive,rows=[];for(let d=0;d<g.snapshot().trackLength;d+=100)for(const x of [-7.1,-6.9,6.9,7.1])rows.push(g.surfaceProbe(d,x));return rows;});
 for(const p of edges)expect(p.hits[0]?.name).toBe(Math.abs(p.lateral)<7?'driving-surface':'shoulder');
 writeFileSync(`${root}/road-180s.json`,JSON.stringify({errors,runs,scan,edges},null,2));
});
