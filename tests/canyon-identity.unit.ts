import {it,expect} from 'vitest';
import * as THREE from 'three';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {addJourneyScenery} from '../src/scenery';
it('leaves the four-lane driving/collision mesh and lane paint byte-identical',()=>{
 const trip=generateTrip(1),track=createPilotTrack(trip),half=(d:number)=>pilotSample(trip,d).halfWidth,weights=(d:number)=>pilotWeights(trip,d);
 const before=prepareRoadChunk(track.sample,half,weights,0,1000,track.length),after=prepareRoadChunk(track.sample,half,weights,0,1000,track.length,true);
 for(const kind of ['asphalt','line'] as const)expect(after.find(m=>m.kind===kind)).toEqual(before.find(m=>m.kind===kind));
 for(let d=600;d<900;d+=10)expect(half(d)).toBe(7);
 expect(prepareRoadChunk(track.sample,half,weights,1000,2000,track.length,true)).toEqual(prepareRoadChunk(track.sample,half,weights,1000,2000,track.length));
});
it('keeps the connected mountain clear of all nearby road surfaces',()=>{
 const trip=generateTrip(1),track=createPilotTrack(trip),scene=new THREE.Scene();addJourneyScenery(scene,track.sample,track.length,trip.sceneryAct,1,d=>pilotSample(trip,d).halfWidth,d=>pilotWeights(trip,d),{start:0,end:1000,openRoad:true});
 let checked=0;scene.traverse(o=>{if(!(o instanceof THREE.InstancedMesh)||o.geometry.name!=='canyon-cut-rock')return;const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){let nearest=Infinity;for(let d=350;d<1600;d+=5){const s=track.sample(d).position;nearest=Math.min(nearest,Math.hypot(p.getX(i)-s.x,p.getZ(i)-s.z));}expect(nearest).toBeGreaterThan(9);checked++;}});expect(checked).toBeGreaterThan(100);
});
