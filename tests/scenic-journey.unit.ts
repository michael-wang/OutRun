import {describe,it,expect} from 'vitest';
import {isScenicJourney,journeyChapters} from '../src/scenic-journey';
import {createPilotTrack,pilotWeights} from '../src/pilot-composer';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {CANYON_ROADLOCK_STAGE} from '../src/designer-canyon-roadlock';

describe('default three-scene journey',()=>{
 it('owns the bare URL and keeps explicit historic/diagnostic routes',()=>{
  expect(isScenicJourney(new URLSearchParams())).toBe(true);
  expect(isScenicJourney(new URLSearchParams('qa=1&perf=1'))).toBe(true);
  for(const q of ['showcase=coast','showcase=canyon&road=lock&art=blender','trip=10m','stage=1','mode=free','lab=pilots','pace=1'])expect(isScenicJourney(new URLSearchParams(q))).toBe(false);
 });
 it('uses existing roads in their original coordinates and drives only the city phase between coast and canyon',()=>{
  const chapters=journeyChapters();expect(chapters.map(c=>c.id)).toEqual(['coast','city','canyon']);
  expect(chapters[0].stage).toBe(COAST_ULTRA_STAGE);expect(chapters[2].stage).toBe(CANYON_ROADLOCK_STAGE);
  for(const c of chapters){
   const track=createPilotTrack(c.stage);expect(c.start).toBeGreaterThan(0);expect(c.end).toBeGreaterThan(c.start+1000);expect(c.end).toBeLessThanOrEqual(track.length);
   for(const d of [c.start,c.end])expect(track.sample(d).position.toArray().every(Number.isFinite)).toBe(true);
  }
  const city=chapters[1];for(let d=city.start;d<=city.end;d+=100)expect(pilotWeights(city.stage,d)[2]).toBe(1);
 });
});
