import {describe,it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';
import {bridgeSpan} from '../src/bridge';
import {prepareRoadChunk} from '../src/road-chunk';
import {canyonSceneEnvelope,canyonGroundY,canyonRiverRaw,planGrandCanyonScene} from '../src/grand-canyon-scene';

describe('Scenery Foundation R2.0 — Grand Canyon River Bend',()=>{
 it('plans exactly one reproducible 1–1.5km canyon scene without changing r10 roads or historical scenes',()=>{
  for(const seed of [1,2,7]){
   const before=generateTrip(seed,10),now=generateTrip(seed,11),site=now.canyonPrototype;
   expect(before.canyonPrototype).toBeUndefined();
   expect(before.generatorVersion).toBe('v0.9-r10');
   expect(before.tripCode).toContain('-ALB10');
   expect(now.generatorVersion).toBe('v0.9-r11');
   expect(now.tripCode).toContain('-ALB11');
   expect(now.contentFingerprint).not.toEqual(before.contentFingerprint);
   expect(now.placements).toEqual(before.placements);
   expect(now.scenerySections).toEqual(before.scenerySections);
   expect(now.scenicLandmarks).toEqual(before.scenicLandmarks);
   expect(now.roadFeatures).toEqual(before.roadFeatures);
   expect(now.bankFeatures).toEqual(before.bankFeatures);
   expect(site,'seed '+seed+' must have one canyon prototype').toBeDefined();
   expect(Object.isFrozen(site)).toBe(true);
   expect(site!.end-site!.start).toBeGreaterThanOrEqual(1100);
   expect(site!.end-site!.start).toBeLessThanOrEqual(1500);
   const beat=now.beats.find(b=>b.id===site!.beat)!;
   expect(beat.world).toBe('canyon');
   expect(site!.start).toBeGreaterThanOrEqual(BRICK_START+beat.startS);
   expect(site!.end).toBeLessThanOrEqual(BRICK_START+beat.endS);
   expect(planGrandCanyonScene(now)).toEqual(site);
   expect(generateTrip(seed,11)).toEqual(now);
   expect(generateTrip(seed,10)).toEqual(before);
  }
 },30000);
 it('keeps a fixed world river datum below every meter of the canyon road',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed,11),site=trip.canyonPrototype!;
   for(let d=site.start;d<=site.end;d+=20){
    const q=pilotSample(trip,d);
    expect(q.height-site.riverY).toBeGreaterThanOrEqual(49.9);
    const middle=canyonRiverRaw(site,d);
    expect(middle).toBeLessThan(-100);
    expect(middle).toBeGreaterThan(-125);
   }
   expect(canyonSceneEnvelope(site,site.start)).toBe(0);
   expect(canyonSceneEnvelope(site,site.end)).toBe(0);
   expect(canyonSceneEnvelope(site,(site.start+site.end)/2)).toBeCloseTo(1);
  }
 },30000);
 it('builds a physically recessed river channel, high inner cliff and softly reverting earthwork',()=>{
  const site=generateTrip(1,11).canyonPrototype!,d=(site.start+site.end)/2,roadY=110;
  const ordinary=roadY-4;
  expect(canyonGroundY(site,d,-112,roadY,ordinary)).toBeLessThan(site.riverY);
  expect(canyonGroundY(site,d,-88,roadY,ordinary)).toBeGreaterThan(site.riverY+5);
  expect(canyonGroundY(site,d,38,roadY,ordinary)).toBeGreaterThan(roadY+13);
  expect(canyonGroundY(site,d,12,roadY,ordinary)).toBe(ordinary);
  expect(canyonGroundY(site,site.start,-112,roadY,ordinary)).toBe(ordinary);
  expect(canyonGroundY(site,site.end,-112,roadY,ordinary)).toBe(ordinary);
  for(const at of [site.start+20,site.start+80,site.end-80,site.end-20]){
   const a=canyonGroundY(site,at-.01,-112,roadY,ordinary);
   const b=canyonGroundY(site,at+.01,-112,roadY,ordinary);
   expect(Math.abs(a-b)).toBeLessThan(.15);
  }
 });
 it('streams a continuous WORLD-Y river across a 1km chunk seam without altering drivable asphalt',()=>{
  const trip=generateTrip(1,11),old=generateTrip(1,10),site=trip.canyonPrototype!;
  const track=createPilotTrack(trip),original=createPilotTrack(old);
  const boundary=Math.ceil((site.start+195)/1000)*1000;
  expect(boundary).toBeLessThan(site.end-195);
  const half=(d:number)=>pilotSample(trip,d).halfWidth,
   weights=(d:number)=>pilotWeights(trip,d);
  const bridge=bridgeSpan(track.sample,half,weights,track.length);
  expect(bridge===undefined||site.end<bridge.start||site.start>bridge.end).toBe(true);
  const build=(a:number,b:number,withCanyon:boolean)=>{
   return prepareRoadChunk(track.sample,half,weights,a,b,track.length,false,true,[],
    undefined,bridge,true,undefined,trip.scenerySections,withCanyon?site:undefined);
  };
  const a=build(boundary-1000,boundary,true),b=build(boundary,boundary+1000,true);
  const streamA=a.find(m=>m.kind==='water')!,streamB=b.find(m=>m.kind==='water')!;
  expect(streamA).toBeDefined();expect(streamB).toBeDefined();
  expect([...streamA.positions.slice(-6)]).toEqual([...streamB.positions.slice(0,6)]);
  for(const mesh of [streamA,streamB]){
   expect(mesh.positions.length).toBeGreaterThan(0);
   expect(Array.from(mesh.positions).every(Number.isFinite)).toBe(true);
   expect(Array.from(mesh.positions).filter((_,i)=>i%3===1).every(v=>Math.abs(v-site.riverY)<.001)).toBe(true);
  }
  const originalA=prepareRoadChunk(original.sample,half,weights,boundary-1000,boundary,
   original.length,false,true,[],undefined,bridge,true,undefined,old.scenerySections);
  expect(a.find(m=>m.kind==='asphalt')!.positions)
   .toEqual(originalA.find(m=>m.kind==='asphalt')!.positions);
  expect(a.find(m=>m.kind==='asphalt')!.indices)
   .toEqual(originalA.find(m=>m.kind==='asphalt')!.indices);
 },30000);
});
