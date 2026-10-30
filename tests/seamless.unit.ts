import {it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
it('r4 has matched chunk normals, no sand crossing asphalt, and smooth full-route banking',()=>{
 for(const seed of [1,2,7]){
  const b=generateTrip(seed),track=createPilotTrack(b),old=createPilotTrack(generateTrip(seed,3)),angle=(d:number)=>-Math.atan(track.sample(d).right.y)*180/Math.PI;
  expect(b.tripCode).toContain('r4-');let maxRate=0,maxAcceleration=0;
  for(let d=10;d<b.length;d+=10){expect(track.sample(d).position).toEqual(old.sample(d).position);maxRate=Math.max(maxRate,Math.abs(angle(d+.5)-angle(d-.5)));maxAcceleration=Math.max(maxAcceleration,Math.abs(angle(d+1)-2*angle(d)+angle(d-1)));}
  console.log({seed,maxDegreesPerMetre:maxRate,maxRateAt300Kmh:maxRate*300/3.6,maxAcceleration});expect(maxRate).toBeLessThan(.2);expect(maxAcceleration).toBeLessThan(.01);
  for(const f of b.bankFeatures!.filter(f=>f.kind==='showcase'))expect(Math.abs(angle((f.start+f.end)/2))).toBeGreaterThan(19);
  const half=(d:number)=>pilotSample(b,d).halfWidth,weights=(d:number)=>pilotWeights(b,d);
  for(const edge of [1000,2000,3000]){
   const a=prepareRoadChunk(track.sample,half,weights,edge-1000,edge,track.length,seed===1,true),z=prepareRoadChunk(track.sample,half,weights,edge,edge+1000,track.length,seed===1,true);
   for(const kind of ['asphalt','line','sand','grass'] as const){const left=a.find(m=>m.kind===kind)!,right=z.find(m=>m.kind===kind)!;const stride=kind==='sand'||kind==='grass'?101:401;expect(Array.from(left.positions.slice((stride-1)*6,stride*6))).toEqual(Array.from(right.positions.slice(0,6)));expect(Array.from(left.normals!.slice((stride-1)*6,stride*6))).toEqual(Array.from(right.normals!.slice(0,6)));}
   const road=a.find(m=>m.kind==='asphalt')!,sand=a.find(m=>m.kind==='sand')!;
   // The central sand strip uses identical asphalt triangles, consistently 0.1m below.
   const offset=(101*2+401)*6;for(let i=0;i<road.positions.length;i+=3){expect(sand.positions[offset+i]).toBe(road.positions[i]);expect(sand.positions[offset+i+2]).toBe(road.positions[i+2]);expect(road.positions[i+1]-sand.positions[offset+i+1]).toBeCloseTo(.1,3);}
  }
 }
},20000);
