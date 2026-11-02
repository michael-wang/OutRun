import {describe,it,expect} from 'vitest';
import {BRICK_START} from '../src/bricks';
import {generateTrip} from '../src/trip';
import {analyzeRoadFeatures,drivingIntensity,ROAD_FEATURE_LABELS,ROAD_FEATURE_KINDS,ROAD_FEATURE_RULES,ROAD_FEATURE_REFERENCE} from '../src/road-features';
import {selectRoadInterchange} from '../src/road-interchange';
import type {Placement,WorldName} from '../src/pilot-composer';

const curve=(startS:number,endS:number,direction:1|-1,effort=.65,id:'C02'|'C08'='C02'):Placement=>({
 channel:'curvature',id,startS,endS,transition:'smooth',beat:'synthetic',
 parameters:{effort,direction,start:0,end:1,secondary:.7},
});
const synthetic=(placements:Placement[],length=4000)=>{
 const base=generateTrip(1,6);
 return {...base,length,world:'city' as const,worldPhases:[
  {startS:0,endS:1300,world:'city' as WorldName,beat:'City'},
  {startS:1300,endS:2550,world:'coast' as WorldName,beat:'Coast'},
  {startS:2550,endS:length,world:'canyon' as WorldName,beat:'Canyon'},
 ],placements};
};

describe('Scenic Director R0.1 — measured driving intensity',()=>{
 it('uses real steering and angle for hairpins, 5s curves and a strong L-R-L rhythm',()=>{
  const stage=synthetic([
   curve(300,1200,1,1.4,'C08'),
   curve(1540,1940,1,1.1),
   curve(1970,2370,-1,1.1),
   curve(2400,2800,1,1.1),
  ]);
  const original=JSON.stringify(stage.placements);
  const a=analyzeRoadFeatures(stage),b=analyzeRoadFeatures(stage);
  expect(a).toEqual(b);
  expect(Object.isFrozen(a)).toBe(true);
  expect(JSON.stringify(stage.placements)).toBe(original);
  const hairpins=a.filter(f=>f.kind==='u-turn');
  expect(hairpins).toHaveLength(1);
  expect(hairpins[0].turnDegrees).toBeGreaterThanOrEqual(ROAD_FEATURE_RULES.uTurnDegrees);
  expect(hairpins[0].analysis.peakSteer).toBeGreaterThanOrEqual(ROAD_FEATURE_RULES.minUTurnPeakSteer);
  expect(hairpins[0].direction).toBe('left');
  const rhythms=a.filter(f=>f.kind==='s-bends');
  expect(rhythms).toHaveLength(1);
  expect(rhythms[0].pattern).toBe('左→右→左');
  expect(rhythms[0].analysis.reversals).toBe(2);
  expect(rhythms[0].intensity).toBeGreaterThan(5);
  const sweeping=a.filter(f=>f.kind==='long-curve');
  expect(sweeping.length).toBeGreaterThan(0);
  expect(sweeping.every(f=>f.analysis.activeTurnSeconds>=5)).toBe(true);
  expect(a.some(f=>f.kind==='long-straight'&&f.end-f.start>1000)).toBe(true);
  expect(a.some(f=>f.kind==='merge'||f.kind==='exit')).toBe(false);
  expect(a.find(f=>f.kind==='long-straight'&&f.end>BRICK_START+2800)?.biome).toBe('canyon');
 });
 it('refuses a 2–4 second bend and mild alternating sweep, even when bricks say C08 or S',()=>{
  const stage=synthetic([
   curve(120,650,1,.8,'C08'), // Below 5 physical seconds.
   curve(950,1370,1,.42),
   curve(1400,1820,-1,.42),
   curve(1850,2270,1,.42),
  ],3200);
  const out=analyzeRoadFeatures(stage);
  expect(out.some(f=>f.kind==='long-curve')).toBe(false);
  expect(out.some(f=>f.kind==='s-bends')).toBe(false);
  expect(out.some(f=>f.kind==='u-turn')).toBe(false);
 });
 it('recognizes two genuinely sharp opposite turns; a wide 180°-plus arc is not an intense U-turn',()=>{
  const sharp=analyzeRoadFeatures(synthetic([
   curve(300,650,1,1.25,'C08'),curve(685,1035,-1,1.25,'C08'),
  ],2200)).filter(f=>f.kind==='s-bends');
  expect(sharp).toHaveLength(1);
  expect(sharp[0].turns).toBe(2);
  expect(sharp[0].analysis.reversals).toBe(1);
  const wide=analyzeRoadFeatures(synthetic([curve(300,2600,1,.5,'C08')],3200));
  expect(wide.some(f=>f.kind==='u-turn')).toBe(false);
  expect(wide.some(f=>f.kind==='long-curve')).toBe(true);
 });
 it('keeps equal near-threshold left/right hairpins symmetric across 20m sample offsets',()=>{
  const out=analyzeRoadFeatures(synthetic([
   curve(313,953,1,1.12,'C08'),curve(1024,1664,-1,1.12,'C08'),
  ],2700));
  const turns=out.filter(f=>f.kind==='u-turn');
  expect(turns).toHaveLength(2);
  expect(turns[0].turnDegrees).toBeGreaterThanOrEqual(ROAD_FEATURE_RULES.uTurnDegrees);
  expect(Math.abs(turns[0].turnDegrees!-turns[1].turnDegrees!)).toBeLessThanOrEqual(1);
 });
 it('does not stitch separate short curves into a false sustained five-second curve',()=>{
  const out=analyzeRoadFeatures(synthetic([
   curve(300,780,1,.65),curve(940,1420,1,.65),
  ],2100));
  expect(out.some(f=>f.kind==='long-curve')).toBe(false);
 });
 it('scores physical work, not names: straight < curve < reversals < tight hairpin',()=>{
  const result=analyzeRoadFeatures(synthetic([
   curve(300,1200,1,1.4,'C08'),
   curve(1540,1940,1,1.1),curve(1970,2370,-1,1.1),
  ]));
  const straight=result.find(f=>f.kind==='long-straight')!;
  const longCurve=result.find(f=>f.kind==='long-curve')!;
  const rhythm=result.find(f=>f.kind==='s-bends')!;
  const hairpin=result.find(f=>f.kind==='u-turn')!;
  expect(straight.intensity).toBeLessThan(longCurve.intensity);
  expect(rhythm.intensity).toBeGreaterThan(straight.intensity);
  expect(hairpin.intensity).toBeGreaterThan(straight.intensity);
  expect([straight,longCurve,rhythm,hairpin].every(f=>f.intensity===drivingIntensity(f.analysis))).toBe(true);
  expect(ROAD_FEATURE_REFERENCE.speedKmh).toBe(230);
  expect(ROAD_FEATURE_RULES.minCurveMeters).toBeCloseTo(5*ROAD_FEATURE_REFERENCE.metersPerSecond);
 });
 it('keeps sorted immutable features for seeds 1/2/7, with no route or historical recipe changes',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed),copy=generateTrip(seed);
   const features=trip.roadFeatures!;
   expect(features).toEqual(copy.roadFeatures);
   expect(features).toEqual(analyzeRoadFeatures(trip));
   expect(Object.isFrozen(features)).toBe(true);
   expect(new Set(features.map(f=>f.id)).size).toBe(features.length);
   for(let i=0;i<features.length;i++){
    const f=features[i];
    expect(Object.isFrozen(f)).toBe(true);
    expect(Object.isFrozen(f.analysis)).toBe(true);
    expect(f.start).toBeGreaterThanOrEqual(BRICK_START);
    expect(f.end).toBeLessThanOrEqual(BRICK_START+trip.length);
    expect(f.end).toBeGreaterThan(f.start);
    if(i)expect(f.start).toBeGreaterThanOrEqual(features[i-1].start);
    expect(ROAD_FEATURE_KINDS).toContain(f.kind);
    expect(ROAD_FEATURE_LABELS[f.kind].length).toBeGreaterThan(0);
    expect(f.intensity).toBeGreaterThanOrEqual(1);
    expect(f.intensity).toBeLessThanOrEqual(10);
    expect(f.intensity).toBe(drivingIntensity(f.analysis));
    expect(f.analysis.durationSeconds).toBeCloseTo((f.end-f.start)/ROAD_FEATURE_REFERENCE.metersPerSecond,1);
    expect(f.analysis.activeTurnSeconds).toBeLessThanOrEqual(f.analysis.durationSeconds);
    expect(Number.isFinite(f.analysis.peakSteer)).toBe(true);
   }
   // Lack of any high-intensity features is honest data, not a regression.
   expect(features.some(f=>f.kind==='long-straight')).toBe(true);
   const site=selectRoadInterchange(trip)!;
   const merges=features.filter(f=>f.kind==='merge'),exits=features.filter(f=>f.kind==='exit');
   expect(merges).toHaveLength(1);expect(exits).toHaveLength(1);
   expect([merges[0].start,merges[0].end,merges[0].lanesBefore,merges[0].lanesAfter])
    .toEqual([site.entry.start,site.entry.end,4,5]);
   expect([exits[0].start,exits[0].end,exits[0].lanesBefore,exits[0].lanesAfter])
    .toEqual([site.exit.start,site.exit.end,5,4]);
   expect(trip.contentFingerprint).toBe(copy.contentFingerprint);
   const historical=generateTrip(seed,6);
   expect(historical.roadFeatures).toBeUndefined();
   expect(analyzeRoadFeatures(historical).every(f=>f.kind!=='merge'&&f.kind!=='exit')).toBe(true);
  }
 },30000);
});
