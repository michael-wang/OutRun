import {describe,it,expect} from 'vitest';
import {BRICK_START} from '../src/bricks';
import {generateTrip} from '../src/trip';
import {analyzeRoadFeatures,ROAD_FEATURE_LABELS,ROAD_FEATURE_KINDS,ROAD_FEATURE_RULES} from '../src/road-features';
import {selectRoadInterchange} from '../src/road-interchange';
import type {Placement,WorldName} from '../src/pilot-composer';

/** Synthetic exercises distinguish a true 180°+ turn from a mere C08 label.
 * A few authored bends also demonstrate simultaneous labels: same piece may
 * be a long curve and part of a three-turn S rhythm. */
const curve=(startS:number,endS:number,direction:1|-1,effort=.65,id:'C02'|'C08'='C02'):Placement=>({
 channel:'curvature',id,startS,endS,transition:'smooth',beat:'synthetic',
 parameters:{effort,direction,start:0,end:1,secondary:.7},
});

describe('Scenic Director R0 — route-planning road features',()=>{
 it('recognizes real U-turn angle, long straights, sweeping curves and L-R-L rhythms from signed road curvature',()=>{
  const base=generateTrip(1,6);
  const world:'city'|'coast'|'canyon'='city';
  const stage={...base,length:4000,world,worldPhases:[
   {startS:0,endS:1300,world:'city' as WorldName,beat:'City'},
   {startS:1300,endS:2550,world:'coast' as WorldName,beat:'Coast'},
   {startS:2550,endS:4000,world:'canyon' as WorldName,beat:'Canyon'},
  ],placements:[
   curve(300,1200,1,1.4,'C08'),
   curve(1540,1940,1),
   curve(1970,2370,-1),
   curve(2400,2800,1),
  ]};
  const original=JSON.stringify(stage.placements);
  const a=analyzeRoadFeatures(stage),b=analyzeRoadFeatures(stage);
  expect(a).toEqual(b);
  expect(Object.isFrozen(a)).toBe(true);
  expect(JSON.stringify(stage.placements)).toBe(original);
  const turns=a.filter(x=>x.kind==='u-turn');
  expect(turns).toHaveLength(1);
  expect(turns[0].turnDegrees).toBeGreaterThanOrEqual(ROAD_FEATURE_RULES.uTurnDegrees);
  expect(turns[0].direction).toBe('left');
  expect(turns[0].start).toBeGreaterThanOrEqual(BRICK_START+300);
  const rhythms=a.filter(x=>x.kind==='s-bends');
  expect(rhythms).toHaveLength(1);
  expect(rhythms[0].pattern).toBe('左→右→左');
  expect(rhythms[0].turns).toBe(3);
  expect(a.some(x=>x.kind==='long-curve')).toBe(true);
  expect(a.some(x=>x.kind==='long-straight'&&x.end-x.start>1000)).toBe(true);
  expect(a.every(x=>x.kind!=='merge'&&x.kind!=='exit')).toBe(true);
  expect(a.find(x=>x.kind==='long-straight'&&x.end>BRICK_START+2800)?.biome).toBe('canyon');
 });
 it('does not pretend a short steering challenge or an unconnected width taper is a U-turn or junction',()=>{
  const base=generateTrip(1,6);
  const stage={...base,length:3200,worldPhases:[{startS:0,endS:3200,world:'city' as const,beat:'City'}],
   placements:[curve(400,950,1,.4,'C08')]};
  const out=analyzeRoadFeatures(stage);
  expect(out.some(x=>x.kind==='u-turn')).toBe(false);
  expect(out.some(x=>x.kind==='merge'||x.kind==='exit')).toBe(false);
 });
 it('precomputes a complete, ordered, immutable list per seed without changing road fingerprints or historical revisions',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),copy=generateTrip(seed);
   const features=trip.roadFeatures!;
   expect(features).toBeDefined();
   expect(features).toEqual(copy.roadFeatures);
   expect(features).toEqual(analyzeRoadFeatures(trip));
   expect(Object.isFrozen(features)).toBe(true);
   expect(new Set(features.map(x=>x.id)).size).toBe(features.length);
   for(let i=0;i<features.length;i++){
    const f=features[i];
    expect(Object.isFrozen(f)).toBe(true);
    expect(f.start).toBeGreaterThanOrEqual(BRICK_START);
    expect(f.end).toBeLessThanOrEqual(BRICK_START+trip.length);
    expect(f.end).toBeGreaterThan(f.start);
    if(i)expect(f.start).toBeGreaterThanOrEqual(features[i-1].start);
    expect(ROAD_FEATURE_KINDS).toContain(f.kind);
    expect(ROAD_FEATURE_LABELS[f.kind].length).toBeGreaterThan(0);
   }
   expect(features.some(x=>x.kind==='long-curve')).toBe(true);
   expect(features.some(x=>x.kind==='long-straight')).toBe(true);
   const site=selectRoadInterchange(trip)!;
   const merges=features.filter(x=>x.kind==='merge'),exits=features.filter(x=>x.kind==='exit');
   expect(merges).toHaveLength(1);expect(exits).toHaveLength(1);
   expect([merges[0].start,merges[0].end,merges[0].lanesBefore,merges[0].lanesAfter])
    .toEqual([site.entry.start,site.entry.end,4,5]);
   expect([exits[0].start,exits[0].end,exits[0].lanesBefore,exits[0].lanesAfter])
    .toEqual([site.exit.start,site.exit.end,5,4]);
   // R0 metadata is extra plan information, not a route identity change.
   expect(trip.contentFingerprint).toBe(copy.contentFingerprint);
   const historical=generateTrip(seed,6);
   expect(historical.roadFeatures).toBeUndefined();
   expect(analyzeRoadFeatures(historical).every(f=>f.kind!=='merge'&&f.kind!=='exit')).toBe(true);
  }
 },30000);
});
