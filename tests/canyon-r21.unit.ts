import {describe,it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {canyonSceneEnvelope} from '../src/grand-canyon-scene';
import {canyonVistaProjection,canyonVistaClearance} from '../src/canyon-vista';
import {canyonPropSlots,canyonStratumColor} from '../src/canyon-language';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {bridgeSpan} from '../src/bridge';

describe('R2.1: canyon-specific scenery and natural chase-camera reveal',()=>{
 it('preserves every driven r11 road and historically replayable scene',()=>{
  for(const seed of [1,2,7]){
   const before=generateTrip(seed,11),after=generateTrip(seed,12);
   expect(before.canyonPrototype?.vista).toBeUndefined();
   expect(after.generatorVersion).toBe('v0.9-r12');
   expect(after.tripCode).toContain('-ALB12');
   expect(before.generatorVersion).toBe('v0.9-r11');
   expect(after.contentFingerprint).not.toBe(before.contentFingerprint);
   expect(after.placements).toEqual(before.placements);
   expect(after.beats).toEqual(before.beats);
   expect(after.bankFeatures).toEqual(before.bankFeatures);
   expect(after.scenicCues).toEqual(before.scenicCues);
   expect(after.scenerySections).toEqual(before.scenerySections);
   expect(after.scenicLandmarks).toEqual(before.scenicLandmarks);
   expect(after.canyonPrototype?.start).toBe(before.canyonPrototype?.start);
   expect(after.canyonPrototype?.riverY).toBe(before.canyonPrototype?.riverY);
   expect(generateTrip(seed,11)).toEqual(before);
   expect(generateTrip(seed,12)).toEqual(after);
  }
 },30000);
 it('chooses a reproducible camera-viewcone sightline, not a free-look camera',()=>{
  for(const seed of [1,2,7]){
   const stage=generateTrip(seed,12),scene=stage.canyonPrototype!,v=scene.vista!;
   expect(Object.isFrozen(scene)).toBe(true);
   expect(Object.isFrozen(v)).toBe(true);
   expect(v.approachDistance).toBeGreaterThan(scene.start);
   expect(v.revealDistance).toBeGreaterThan(v.approachDistance);
   expect(v.revealDistance).toBeLessThan(v.focusDistance);
   expect(v.focusDistance).toBeLessThan(scene.end);
   const track=createPilotTrack(stage),sample=track.sample;
   let river=0,rim=0;
   for(const delta of [-80,0,80]){
    const projection=canyonVistaProjection(stage,scene,
     v.revealDistance+delta,v.focusDistance,1705/863,sample);
    river+=Number(projection.riverVisible);rim+=Number(projection.rimVisible);
   }
   expect(v.riverInFrameSamples).toBe(river);
   expect(v.rimInFrameSamples).toBe(rim);
   expect(v.sightlineConfirmed).toBe(river>=2&&rim>=2);
   // Real viewing data, never a category-driven fabricated visible flag.
   expect(river,'seed '+seed+' river').toBeGreaterThanOrEqual(2);
   expect(rim,'seed '+seed+' rim').toBeGreaterThanOrEqual(2);
  }
 },30000);
 it('clusters sparse canyon rocks and scrub without mirrored street rows or focal occlusion',()=>{
  for(const seed of [1,2,7]){
   const scene=generateTrip(seed,12).canyonPrototype!;
   const slots=[];
   for(let d=16+Math.ceil((scene.start-16)/30)*30;d<scene.end;d+=30)
    slots.push(...canyonPropSlots(scene,d));
   expect(slots.length).toBeGreaterThan(3);
   expect(slots.length).toBeLessThan(80);
   expect(slots.every(p=>!canyonVistaClearance(scene,p.distance,p.offset))).toBe(true);
   expect(new Set(slots.map(p=>p.kind)).size).toBeGreaterThanOrEqual(2);
   expect(slots.filter(p=>p.offset>0).length).toBeGreaterThan(0);
   expect(slots.filter(p=>p.offset<0).length).toBeGreaterThan(0);
   const gaps=slots.filter(p=>p.kind==='talus').map(p=>p.distance).sort((a,b)=>a-b)
    .slice(1).map((d,i,a)=>d-a[i-1]);
   // The sampler must not produce a regularly mirrored 30m avenue.
   expect(slots.length).toBeLessThan((scene.end-scene.start)/15);
   const y=100,d=(scene.start+scene.end)/2;
   expect(canyonStratumColor(scene,d,21,y)).not.toBe(canyonStratumColor(scene,d,-205,y));
   expect(canyonSceneEnvelope(scene,scene.start)).toBe(0);
  }
 },30000);
 it('changes only canyon road-edge presentation, never asphalt vertex data',()=>{
  const old=generateTrip(1,11),stage=generateTrip(1,12),scene=stage.canyonPrototype!;
  const track=createPilotTrack(stage),oldTrack=createPilotTrack(old);
  const half=(d:number)=>pilotSample(stage,d).halfWidth;
  const weights=(d:number)=>pilotWeights(stage,d);
  const bridge=bridgeSpan(track.sample,half,weights,track.length);
  const d=scene.vista!.revealDistance;
  const from=d-40,to=d+40;
  const make=(current:typeof track,withScene:boolean)=>prepareRoadChunk(
   current.sample,half,weights,from,to,current.length,false,true,[],
   undefined,bridge,true,undefined,stage.scenerySections,
   withScene?scene:old.canyonPrototype);
  const a=make(track,true),b=make(oldTrack,false);
  expect(a.find(x=>x.kind==='asphalt')?.positions).toEqual(b.find(x=>x.kind==='asphalt')?.positions);
  expect(a.find(x=>x.kind==='asphalt')?.indices).toEqual(b.find(x=>x.kind==='asphalt')?.indices);
  const oldRed=b.find(x=>x.kind==='edge-red');
  const newRed=a.find(x=>x.kind==='edge-red');
  expect(oldRed).toBeDefined();
  expect(newRed?.positions.length??0).toBeLessThan(oldRed!.positions.length);
  expect(a.some(x=>x.kind==='water')).toBe(true);
 },30000);
});
