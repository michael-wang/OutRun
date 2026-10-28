import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root='docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c';mkdirSync(root,{recursive:true});
test('real 2/4/6/8 lane meshes, painted separators and width-aware offroad agree on both sides',async({page})=>{
 const results=[];
 for(const [id,t,lanes] of [['BRK-04',8,2],['BRK-02',8,4],['BRK-01',18,6],['BRK-07',12,8]] as const){
  await page.goto(`/?lab=bricks&brick=${id}`);
  const row=await page.evaluate(({t,lanes})=>{const g=(window as any).__drive,b=g.brick(),d=Math.floor((350+t*b.length/b.nominalDuration)/6)*6+1.5,p=g.sample(d);g.manual(true);
   const edges=[-1,1].map(side=>({inside:g.surfaceProbe(d,side*(p.halfWidth-.1)),outside:g.surfaceProbe(d,side*(p.halfWidth+.1))}));
   const paint=Array.from({length:lanes-1},(_,i)=>g.paintProbe(d,(i-lanes/2+1)*3.5));
   const offsets=[-1,1].map(side=>{g.reset({distance:d,lateral:side*5,speed:60});const before=g.snapshot();g.advance(.1,{gas:true,brake:false,steer:0});return {before,after:g.snapshot()};});
   return {d,p,edges,paint,offsets};},{t,lanes});
  expect(row.p.lanes).toBe(lanes);expect(row.p.halfWidth).toBe(lanes*3.5/2);
  for(const e of row.edges){expect(e.inside.hits[0].name).toBe('driving-surface');expect(e.outside.hits[0].name).toBe('shoulder');}
  for(const hits of row.paint){expect(hits.length).toBeGreaterThan(0);expect(hits[0]).toBeCloseTo(.03,1);}
  for(const o of row.offsets)expect(o.before.offRoad).toBe(lanes===2);
  results.push({id,lanes,...row});
 }
 expect(results[0].offsets[0].after.speed).toBeLessThan(results[3].offsets[0].after.speed);
 writeFileSync(`${root}/mesh-width-offroad.json`,JSON.stringify(results,null,2));
});
test('R1 history remains untouched when a revised brick gets a new human verdict',async({page})=>{
 const archive=JSON.parse(readFileSync('docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json','utf8'));
 const old=Object.fromEntries(archive.records.map((r:any)=>[`${r.id}:r1`,{humanVote:r.humanVote,note:r.note}]));
 await page.goto('/?lab=bricks');await page.evaluate(old=>localStorage.setItem('outrun-brick-reviews-v1',JSON.stringify(old)),old);await page.reload();
 await expect(page.locator('#brick-progress')).toContainText('8 unreviewed');await expect(page.locator('#brick-lab')).toContainText('Archived r1: KEEP');
 await page.locator('[data-vote=REWORK]').click();await page.locator('#brick-note').fill('Isolated R2 test');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-brick-reviews-v1')!));for(const [key,value] of Object.entries(old))expect(stored[key]).toEqual(value);
 expect(stored['BRK-01:r2']).toBeUndefined();const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-brick-reviews-v071d2')!));expect(current['BRK-01:r2']).toEqual({humanVote:'REWORK',note:'Isolated R2 test'});
});
test('steep and tapered sections are continuous and visible on PC and Pixel-like displays',async({page})=>{
 const rows=[];
 for(const [width,height] of [[1280,720],[960,432],[844,390]]){
  await page.setViewportSize({width,height});
  for(const [id,times] of [['BRK-03',[3,8,14]],['BRK-05',[5,10.56,16]],['BRK-06',[2,5,9,15]],['BRK-07',[3,6,12,21]]] as const){
   await page.goto(`/?lab=bricks&brick=${id}`);
   for(const t of times){const row=await page.evaluate(t=>{const g=(window as any).__drive,b=g.brick(),d=350+t*b.length/b.nominalDuration;g.manual(true);g.reset({distance:d,speed:230/3.6});return {p:g.sample(d),s:g.snapshot(),visibility:g.visibility(),ray:g.surfaceProbe(d)};},t);
    expect(Math.abs(row.s.surfaceError)).toBeLessThan(.06);expect(row.ray.hits[0].name).toBe('driving-surface');expect(row.visibility).toBeGreaterThanOrEqual(40);
    await page.screenshot({path:`${root}/${id}-${width}-${t}s.png`});rows.push({width,height,id,t,...row});
   }
  }
 }
 writeFileSync(`${root}/height-visibility.json`,JSON.stringify(rows,null,2));
});
