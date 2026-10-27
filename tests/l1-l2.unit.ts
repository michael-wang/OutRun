import {it,expect} from 'vitest';
import {curvatureKnots,elevationKnots,widthKnots,profile,type CurvatureId,type ElevationId,type WidthId} from '../src/l1-profiles';
import {L2_CANDIDATES,createL2Track,l2Sample} from '../src/l2-catalog';
import {PRAISE,readFeedback,exportFeedback,emptyReview,l2ReviewKey} from '../src/l2-feedback';
import {mkdirSync,writeFileSync} from 'node:fs';
it('all 18 profile families have deterministic finite values and continuous derivatives at their joins',()=>{
 const rows=[];
 for(const effort of [.25,1.35])for(const direction of [-1,1] as const){
  for(let i=1;i<=8;i++){const id=`C0${i}` as CurvatureId,parameters={effort,direction,start:.1,end:.9,secondary:.6},knots=curvatureKnots(id,parameters);expect(curvatureKnots(id,parameters)).toEqual(knots);rows.push({id,knots});}
  for(let i=1;i<=6;i++){const id=`E0${i}` as ElevationId,parameters={base:220,amplitude:effort*150,direction,shelfStart:.3,shelfEnd:.7};rows.push({id,knots:elevationKnots(id,parameters)});}
 }
 for(const [from,to] of [[2,4],[4,2],[6,8],[8,6]] as const)for(let i=1;i<=4;i++)rows.push({id:`W0${i}`,knots:widthKnots(`W0${i}` as WidthId,{from,to,start:.15,end:.85})});
 for(const r of rows){for(let t=0;t<=1;t+=.002){const a=profile(r.knots,t),b=profile(r.knots,t+.00001);expect(Number.isFinite(a.value)&&Number.isFinite(a.derivative)).toBe(true);expect(Math.abs(a.value-b.value)).toBeLessThan(.04);}
  for(const [t] of r.knots){expect(profile(r.knots,t).derivative).toBeCloseTo(0,7);expect(profile(r.knots,t-1e-8).value).toBeCloseTo(profile(r.knots,t+1e-8).value,5);}
 }
});
it('families have their intended signs, extrema, plateau and reversals',()=>{
 const p={effort:1,direction:1 as const,start:.1,end:.9,secondary:.7};
 const k=(id:CurvatureId,t:number)=>profile(curvatureKnots(id,p),.1+.8*t).value;
 expect(k('C01',.5)).toBe(0);expect(k('C02',.4)).toBe(1);expect(k('C03',.2)).toBeLessThan(k('C03',.7));expect(k('C04',.2)).toBeGreaterThan(k('C04',.7));expect(k('C05',.45)).toBeLessThan(k('C05',.2));expect(k('C06',.3)*k('C06',.7)).toBeLessThan(0);
 expect([.12,.36,.6,.84].map(t=>Math.sign(k('C07',t)))).toEqual([1,-1,1,-1]);expect(k('C08',.5)).toBe(1);
});
it('sixteen exact matrix compositions preserve coverage and produce distinct continuous real tracks',()=>{
 expect(L2_CANDIDATES.map(b=>[b.profiles.curvature.id,b.profiles.elevation.id,b.profiles.width.id,b.world].join('/'))).toEqual([
  'C01/E02/W03/canyon','C01/E05/W02/city','C02/E01/W01/coast','C02/E02/W02/city',
  'C03/E03/W03/canyon','C03/E04/W04/coast','C04/E01/W04/city','C04/E06/W01/coast',
  'C05/E03/W02/canyon','C05/E05/W03/canyon','C06/E04/W01/canyon','C06/E06/W04/coast',
  'C07/E03/W02/city','C07/E02/W04/city','C08/E05/W01/canyon','C08/E06/W03/coast']);
 expect(L2_CANDIDATES).toHaveLength(16);for(let i=1;i<=8;i++)expect(L2_CANDIDATES.filter(b=>b.profiles.curvature.id===`C0${i}`)).toHaveLength(2);
 for(const [key,prefix,count] of [['elevation','E',6],['width','W',4]] as const)for(let i=1;i<=count;i++)expect(L2_CANDIDATES.filter(b=>b.profiles[key].id===`${prefix}0${i}`).length).toBeGreaterThan(1);
 expect(new Set(L2_CANDIDATES.map(b=>b.contentFingerprint)).size).toBe(16);
 const intersections=[],rows=[];
 for(const b of L2_CANDIDATES){const track=createL2Track(b),samples=[];for(let d=350;d<=350+b.length;d+=15){const p=track.sample(d),r=l2Sample(b,d);expect(p.position.y).toBe(r.height);expect(r.halfWidth).toBe(r.lanes*3.5/2);expect(p.position.toArray().every(Number.isFinite)).toBe(true);samples.push({d,p,r});}
  for(let i=0;i<samples.length;i++)for(let j=i+8;j<samples.length;j++){const a=samples[i],z=samples[j],gap=Math.hypot(a.p.position.x-z.p.position.x,a.p.position.z-z.p.position.z);if(gap<a.r.halfWidth+z.r.halfWidth&&Math.abs(a.r.height-z.r.height)<5)intersections.push({id:b.id,a:a.d,b:z.d,gap});}
  rows.push({id:b.id,seed:b.seed,profiles:b.profiles,world:b.world,headingChange:track.sample(350+b.length).roadHeading-track.sample(350).roadHeading});
 }
 mkdirSync('docs/evidence/v0.7c1/regressions/v0.7c',{recursive:true});writeFileSync('docs/evidence/v0.7c1/regressions/v0.7c/geometry.json',JSON.stringify({rows,intersections},null,2));expect(intersections).toEqual([]);
 for(const row of rows.slice(14))expect(Math.abs(row.headingChange)).toBeCloseTo(Math.PI,3);
});
it('new feedback is independent from historical brick votes and keeps exact praise labels',()=>{
 expect(Object.values(PRAISE)).toEqual(['超好玩!','超刺激!','超難! 但是過了超爽!','風景優美']);const store=readFeedback(null),b=L2_CANDIDATES[0];store[l2ReviewKey(b)]={...emptyReview(),overallNote:'測試：不會自動變成 KEEP'};
 const data=exportFeedback(readFeedback(JSON.stringify(store)));expect(data.records.every(r=>r.humanVote==='UNREVIEWED'&&r.difficulty===null&&r.events.length===0)).toBe(true);expect(data.records[0].overallNote).toContain('測試');
});

it('elevation and width families retain their semantic extrema and sustained sections',()=>{
 const e={base:16,amplitude:160,direction:1 as const,shelfStart:.32,shelfEnd:.68};
 const h=(id:ElevationId,t:number)=>profile(elevationKnots(id,e),t).value;
 expect(h('E01',.5)).toBe(16);expect(h('E02',.9)-h('E02',0)).toBe(160);
 expect(h('E03',.48)).toBeGreaterThan(h('E03',.1)+150);expect(h('E03',.9)).toBe(16);
 expect(h('E04',.5)).toBeLessThan(h('E04',0)-150);expect(h('E04',1)).toBe(h('E04',0));
 expect(h('E05',.4)).toBe(176);expect(h('E05',.6)).toBe(176);expect(h('E05',1)).toBe(16);
 expect(h('E06',.27)).toBeGreaterThan(h('E06',.44)+140);expect(h('E06',.62)).toBeGreaterThan(h('E06',.8)+130);
 const w=(id:WidthId,from:2|4|6|8,to:2|4|6|8,t:number)=>profile(widthKnots(id,{from,to,start:.2,end:.8}),t).value;
 for(const n of [2,4,6,8] as const)expect(w('W01',n,n,.6)).toBe(n);
 expect(w('W02',6,8,1)).toBe(8);expect(w('W03',4,2,1)).toBe(2);expect(w('W04',4,2,.5)).toBe(2);expect(w('W04',4,2,1)).toBe(4);
});

it('full-length curve and width windows remain finite at endpoints and clamped outside the road',()=>{
 for(let i=1;i<=8;i++){const knots=curvatureKnots(`C0${i}` as CurvatureId,{effort:1.25,direction:-1,start:0,end:1,secondary:.6});for(const t of [-.1,0,.5,1,1.1]){const p=profile(knots,t);expect(Number.isFinite(p.value)&&Number.isFinite(p.derivative)).toBe(true);}expect(profile(knots,-.1).value).toBeCloseTo(0,10);expect(profile(knots,1.1).value).toBeCloseTo(0,10);}
 for(let i=1;i<=4;i++){const knots=widthKnots(`W0${i}` as WidthId,{from:4,to:2,start:0,end:1});for(const t of [-.1,0,.5,1,1.1]){const p=profile(knots,t);expect(Number.isFinite(p.value)&&Number.isFinite(p.derivative)).toBe(true);}}
});
