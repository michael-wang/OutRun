import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pilotSample,PILOTS,type PilotCandidate} from '../src/pilot-composer';
import {pilotSample as originalSample} from './fixtures/s2a/pilot-composer-original';
import {generateTrip} from '../src/trip';
import {generateTrip as originalTrip} from './fixtures/s2a/trip-original';
import {generateStage} from '../src/stage-one';
import {generateStage as originalStage} from './fixtures/s2a/stage-one-original';
import {curvatureKnots,elevationKnots,widthKnots} from '../src/l1-profiles';
import {BRICK_START} from '../src/bricks';
const root='docs/evidence/streaming-s2a';
function adjacent(x:number,delta:bigint){const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);v.setBigUint64(0,v.getBigUint64(0)+delta);return v.getFloat64(0);}
function same(b:PilotCandidate,d:number){const a=pilotSample(b,d),z=originalSample(b,d);for(const key of ['demand','height','grade','lanes','halfWidth'] as const)if(!Object.is(a[key],z[key]))throw Error(`${b.seed}/${b.generatorVersion} at ${d}: ${key}: ${a[key]} != ${z[key]}`);if(a.active.length!==z.active.length||a.active.some((p,i)=>p!==z.active[i]))throw Error(`Active placement identity/order mismatch at ${d}`);}
it('exactly matches S1 across complete routes, revisions, knots and adjacent boundary floats',()=>{
 const cases:PilotCandidate[]=[...PILOTS],rows=[];
 for(const seed of [1,2,7]){
  for(const revision of [1,2,3,4,5,6,7] as const){const b=generateTrip(seed,revision);expect(b).toEqual(originalTrip(seed,revision));cases.push(b);}
  for(const revision of [1,2] as const){const b=generateStage(seed,revision);expect(b).toEqual(originalStage(seed,revision));cases.push(b);}
 }
 for(const b of cases){const points=new Set<number>([-Infinity,-1,0,BRICK_START,BRICK_START+b.length,BRICK_START+b.length+600,Infinity]);
  for(let d=0;d<=b.length+BRICK_START+600;d+=2.5)points.add(d);
  for(const p of b.placements){const knots=p.channel==='curvature'?curvatureKnots(p.id,p.parameters):p.channel==='elevation'?elevationKnots(p.id,p.parameters):widthKnots(p.id,p.parameters);
   for(const t of [0,1,...knots.map(k=>k[0])]){const d=BRICK_START+p.startS+(p.endS-p.startS)*t;points.add(d);points.add(adjacent(d,-1n));points.add(adjacent(d,1n));points.add(d-1e-7);points.add(d+1e-7);}
  }
  const distances=[...points];for(const d of distances)same(b,d);for(const d of distances.reverse())same(b,d);
  rows.push({id:b.id,seed:b.seed,revision:b.generatorVersion,fingerprint:b.contentFingerprint,samples:distances.length*2});
 }
 mkdirSync(root,{recursive:true});writeFileSync(root+'/profile-equivalence.json',JSON.stringify({comparison:'Object.is for all numeric fields; exact placement identity/order; forward and reverse queries; route recipes deep-equal',rows,totalSamples:rows.reduce((n,r)=>n+r.samples,0)},null,2));
},120000);
it('preserves inclusive shared endpoints, overlapping/input-order precedence, held values and fresh active arrays',()=>{
 const b=structuredClone(PILOTS[0]);b.placements=[
  {channel:'width',id:'W02',startS:10,endS:20,parameters:{from:4,to:6,start:0,end:1},transition:'smooth',beat:'first'},
  {channel:'width',id:'W03',startS:20,endS:30,parameters:{from:6,to:4,start:0,end:1},transition:'smooth',beat:'second'},
  {...PILOTS[0].placements.find(p=>p.channel==='elevation')!,startS:5,endS:30},
 ];
 for(const placements of [b.placements,[...b.placements].reverse(),[...b.placements,{...b.placements[0],startS:15,endS:25}]]){b.placements=placements;for(let d=0;d<=40;d+=.25)same(b,BRICK_START+d);}
 const a=pilotSample(b,BRICK_START+20),z=pilotSample(b,BRICK_START+20);expect(a.active).not.toBe(z.active);a.active.length=0;same(b,BRICK_START+20);
 b.placements=[...b.placements.slice(1)];same(b,BRICK_START+20);b.placements.push({...b.placements[0],startS:0,endS:40});same(b,BRICK_START+20);b.placements.pop();same(b,BRICK_START+20);
});
