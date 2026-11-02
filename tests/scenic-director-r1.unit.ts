import {describe,it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {BRICK_START} from '../src/bricks';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {bridgeSpan} from '../src/bridge';
import {ROAD_FEATURE_REFERENCE} from '../src/road-features';
import {SCENIC_R1_SEQUENCE} from '../src/scenic-director';

describe('Scenic Director R1 — curated tension without runtime choreography',()=>{
 it('keeps previously approved r7 placements replayable, changing ONLY new r8 curvature',()=>{
  for(const seed of [1,2,7]){
   const old=generateTrip(seed,7),now=generateTrip(seed);
   expect(old.generatorVersion).toBe('v0.9-r7');
   expect(old.tripCode).toContain('-ALB7');
   expect(old.scenicCues).toBeUndefined();
   expect(now.generatorVersion).toBe('v0.9-r8');
   expect(now.tripCode).toContain('-ALB8');
   expect(now.contentFingerprint).not.toBe(old.contentFingerprint);
   expect(now.length).toBe(old.length);
   expect(now.worldPhases).toEqual(old.worldPhases);
   expect(now.scenicLandmarks).toBeDefined();
   expect(Object.isFrozen(now.scenicLandmarks)).toBe(true);
   expect(now.buffers).toEqual(old.buffers);
   expect(now.placements.filter(p=>p.channel!=='curvature'))
    .toEqual(old.placements.filter(p=>p.channel!=='curvature'));
   expect(now.placements.filter(p=>p.channel==='curvature'))
    .not.toEqual(old.placements.filter(p=>p.channel==='curvature'));
   expect(generateTrip(seed,7)).toEqual(old);
   expect(generateTrip(seed)).toEqual(now);
  }
 },30000);
 it('writes 32 immutable measured cues with a rhythmic bend -> long sweep -> scenic release arc',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),cues=trip.scenicCues!;
   expect(cues).toHaveLength(32);
   expect(Object.isFrozen(cues)).toBe(true);
   for(const cue of cues){
    expect(Object.isFrozen(cue)).toBe(true);
    expect(cue.start).toBeGreaterThanOrEqual(BRICK_START);
    expect(cue.end).toBeLessThanOrEqual(BRICK_START+trip.length);
    expect(cue.intensity).toBeGreaterThanOrEqual(1);
    expect(cue.intensity).toBeLessThanOrEqual(10);
    expect(cue.effectiveTurnSeconds).toBeLessThanOrEqual((cue.end-cue.start)/ROAD_FEATURE_REFERENCE.metersPerSecond+.02);
   }
   expect(SCENIC_R1_SEQUENCE.slice(1,4)).toEqual(['rhythm','sweep','reveal']);
   for(let i=1;i<32;i+=8){
    const rhythm=cues[i],sweep=cues[i+1],reveal=cues[i+2];
    expect([rhythm.role,sweep.role,reveal.role]).toEqual(['rhythm','sweep','reveal']);
    expect(rhythm.intensity).toBeGreaterThan(reveal.intensity);
    expect(sweep.intensity).toBeGreaterThan(reveal.intensity);
    expect(reveal.effectiveTurnSeconds).toBe(0);
   }
   const technical=cues.filter(c=>c.role==='technical');
   expect(technical).toHaveLength(1);
   expect(technical[0].biome).toBe('canyon');
   expect(technical[0].intensity).toBeGreaterThan(6);
  }
 },30000);
 it('actually generates five-second sustained curves, hard countersteering and real hairpins',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),features=trip.roadFeatures!;
   const long=features.filter(f=>f.kind==='long-curve');
   const rhythm=features.filter(f=>f.kind==='s-bends');
   const turns=features.filter(f=>f.kind==='u-turn');
   const straights=features.filter(f=>f.kind==='long-straight'&&f.end-f.start>=900);
   expect(long.length,'seed '+seed+' five-second sweeps').toBeGreaterThanOrEqual(4);
   expect(long.every(f=>f.analysis.activeTurnSeconds>=5)).toBe(true);
   expect(rhythm.length,'seed '+seed+' strong reversals').toBeGreaterThanOrEqual(2);
   expect(turns.length,'seed '+seed+' true hairpins').toBeGreaterThanOrEqual(2);
   expect(straights.length,'seed '+seed+' scenic releases').toBeGreaterThanOrEqual(3);
   const high=trip.scenicCues!.filter(c=>c.role==='rhythm').map(c=>c.intensity);
   const low=trip.scenicCues!.filter(c=>c.role==='reveal').map(c=>c.intensity);
   expect(Math.min(...high)).toBeGreaterThan(Math.max(...low));
  }
 },30000);
 it('keeps a physically eligible bridge in each sampled new route',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),track=createPilotTrack(trip);
   const bridge=bridgeSpan(track.sample,d=>pilotSample(trip,d).halfWidth,
    d=>pilotWeights(trip,d),track.length);
   expect(bridge,'seed '+seed+' bridge').toBeDefined();
   expect(bridge!.end-bridge!.start).toBe(900);
  }
 },30000);
});
