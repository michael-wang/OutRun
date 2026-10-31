import {describe,it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {rockySections} from '../src/rocky-shoulder';
import {bridgeSpan,bridgeShoulders} from '../src/bridge';
import {prepareRoadChunk} from '../src/road-chunk';

describe('S2B temporary exact-distance memoization',()=>{
 it('produces byte-identical road meshes and ray ranges to uncached S2A',()=>{
  // Cross ordinary road, complex scenery, late route and the Seed 1 32km bridge seam.
  const indices=[0,2,7,18,31,32,53,68];
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),track=createPilotTrack(trip);
   const half=(d:number)=>pilotSample(trip,d).halfWidth;
   const weights=(d:number)=>pilotWeights(trip,d);
   const rocks=rockySections(seed,track.length,weights);
   const bridge=bridgeSpan(track.sample,half,weights,track.length);
   const shoulders=(d:number)=>bridgeShoulders(d,seed,bridge);
   for(const index of indices){
    const start=index*1000,end=Math.min(track.length,(index+1)*1000);
    const build=(cache:boolean)=>prepareRoadChunk(
     track.sample,half,weights,start,end,track.length,seed===1,true,rocks,shoulders,bridge,cache,
    );
    const uncached=build(false),cached=build(true);
    expect(cached.length,`seed ${seed} chunk ${index} mesh count`).toBe(uncached.length);
    for(let i=0;i<cached.length;i++){
     const a=cached[i],b=uncached[i],label=`seed ${seed} chunk ${index} ${a.kind}`;
     expect(a.kind,label).toBe(b.kind);
     expect(a.rayRanges,label).toEqual(b.rayRanges);
     for(const key of ['positions','normals','uvs','colors','indices'] as const){
      const left=a[key],right=b[key];
      if(!left||!right){expect(left,label+' '+key).toBe(right);continue;}
      // Typed-array equality enforces bitwise-equivalent numeric geometry.
      expect(left,label+' '+key).toEqual(right);
     }
    }
   }
  }
 },60000);
});
