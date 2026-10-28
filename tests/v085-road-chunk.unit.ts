import {it,expect} from 'vitest';
import {generateStage} from '../src/stage-one';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';

it('prepares deterministic road endpoints regardless of chunk order',()=>{
 for(const seed of [1,2,3]){const stage=generateStage(seed),track=createPilotTrack(stage),half=(d:number)=>pilotSample(stage,d).halfWidth,weights=(d:number)=>pilotWeights(stage,d);
  const build=(i:number)=>prepareRoadChunk(track.sample,half,weights,i*1000,(i+1)*1000,track.length);
  const first=build(2),next=build(3),again=build(2);
  expect(first).toEqual(again);
  for(const kind of ['asphalt','sand','grass','support'] as const){const a=first.find(x=>x.kind===kind)!,b=next.find(x=>x.kind===kind)!;
   // The first ribbon of each material has matching two edge vertices.
   const stride=kind==='support'?12:6,points=kind==='support'?401*12:kind==='asphalt'?401*6:101*6;
   expect(Array.from(a.positions.slice(points-stride,points))).toEqual(Array.from(b.positions.slice(0,stride)));
  }
 }
});
