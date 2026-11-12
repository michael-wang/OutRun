import {expect,it} from 'vitest';
import {COAST_STAGE} from '../src/content/coast-stage';
import {coastGameplayAt,coastFeedbackPhases} from '../src/content/coast-gameplay-sample';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {pilotSample,pilotWeights} from '../src/pilot-composer';

it('R2i: gameplay/telemetry metadata agrees with legacy coast along the whole road',()=>{
 const legacy=COAST_ULTRA_STAGE,road=COAST_STAGE.road;
 const points=new Set<number>([0,349.99,350,1085,3150,6800,10350,10950]);
 for(let d=road.startDistance;d<=road.startDistance+road.length;d+=17)points.add(d);
 for(const segment of [...road.turns,...road.elevations])
  for(const edge of [segment.start,segment.end])
   for(const delta of [-.001,0,.001])points.add(edge+delta);
 for(const d of [...points].sort((a,b)=>a-b)){
  const s=d-road.startDistance,actual=coastGameplayAt(d);
  const old=pilotSample(legacy,d);
  const beat=legacy.beats.find(b=>s>=b.startS&&s<b.endS)?.id
   ??`L3-${legacy.buffers.find(b=>s>=b.startS&&s<b.endS)?.role??'finish'}`;
  expect(actual.world).toBe(legacy.world);
  expect(actual.beat,`beat at ${d}`).toBe(beat);
  expect(actual.lanes,`lanes at ${d}`).toBe(old.lanes);
  expect(actual.active,`active at ${d}`).toEqual(old.active.map(p=>p.id));
  expect(actual.activePlacements,`placement view at ${d}`).toEqual(old.active);
  expect(actual.bufferRole,`buffer role at ${d}`).toBe(legacy.buffers.find(b=>s>=b.startS&&s<b.endS)?.role);
  expect(actual.l2InstanceId,`beat id at ${d}`).toBe(legacy.beats.find(b=>s>=b.startS&&s<b.endS)?.id);
  expect(pilotWeights(legacy,d)).toEqual([1,0,0]);
 }
 expect(coastFeedbackPhases()).toEqual(legacy.worldPhases);
});

it('R2i: content-edited chapter boundary drives metadata without changing Pilot code',()=>{
 const edited={...COAST_STAGE,
  scenicActs:COAST_STAGE.scenicActs.map(a=>({...a}))};
 edited.scenicActs[0].end=1600;
 edited.scenicActs[1].start=1600;
 expect(coastGameplayAt(2050,edited).l2InstanceId).toBe('COAST-SCENIC-2');
 expect(coastGameplayAt(2050,COAST_STAGE).l2InstanceId).toBe('COAST-SCENIC-1');
});
