import {expect,it} from 'vitest';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY,validateCoastStage,type CoastStageContent} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {ROAD_START} from '../src/road-profile';

it('P0: all authored coast manifest/road/scene/acts are valid',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(COAST_STAGE.manifest.id).toBe('coast');
 expect(COAST_STAGE.scene.staticProps.find(p=>p.id==='hamlet-farmhouse')?.roadDistance).toBe(1085);
 expect(COAST_STAGE.road.startDistance).toBe(ROAD_START);
 expect(COAST_STAGE.road.turns).toHaveLength(9);
 expect(COAST_STAGE.scenicActs.at(-1)?.end).toBe(COAST_STAGE.road.length);
});

it('P0: small runtime identity is stable without a generated TripCandidate',()=>{
 const runtime=coastWorkerRoad(),road=COAST_STAGE.road,identity=COAST_RUNTIME_IDENTITY;
 expect(runtime.stage.kind).toBe('authored-coast');
 expect(runtime.stage.id).toBe(identity.id);
 expect(runtime.stage.generatorVersion).toBe(identity.generatorVersion);
 expect(runtime.stage.seed).toBe(COAST_STAGE.manifest.seed);
 expect(runtime.track.length).toBe(road.startDistance+road.length+600);
 expect(runtime.stage.scenerySections).toEqual([{
  id:'coast-ultra-left-sea',kind:'coastal-left',
  start:ROAD_START,end:ROAD_START+road.length,left:'sea',right:'coastal-land',
 }]);
 for(const field of ['placements','worldPhases','beats','buffers','fixedRoad','authoredRoad'])
  expect(runtime.stage).not.toHaveProperty(field);
});

it('P0: changing manifest/act data needs no Trip bridge',()=>{
 const edited:CoastStageContent={...COAST_STAGE,
  manifest:{...COAST_STAGE.manifest,name:'Another coast',seed:912,entrySpeed:160}};
 expect(()=>validateCoastStage(edited)).not.toThrow();
 expect(coastWorkerRoad(edited).stage.seed).toBe(912);
});

it('P0: invalid stage IDs, seeds and scenic coverage fail at the content boundary',()=>{
 const invalid=(change:(c:CoastStageContent)=>void)=>{
  const c={...COAST_STAGE,manifest:{...COAST_STAGE.manifest},
   road:{...COAST_STAGE.road},scene:{...COAST_STAGE.scene},
   scenicActs:COAST_STAGE.scenicActs.map(s=>({...s}))};change(c);
  expect(()=>validateCoastStage(c)).toThrow();
 };
 invalid(c=>{c.scene.id='different';});
 invalid(c=>{c.manifest.schemaVersion=9 as 1;});
 invalid(c=>{c.scenicActs=c.scenicActs.slice(0,-1);});
 invalid(c=>{c.manifest.seed=-1;});
});
