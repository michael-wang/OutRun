import {expect,it} from 'vitest';
import {COAST_STAGE,validateCoastStage,type CoastStageContent} from '../src/content/coast-stage';
import {COAST_ULTRA_LENGTH,COAST_ULTRA_STAGE,toLegacyCoastStage} from '../src/coast-ultra-stage';
import {createAuthoredCoastTrack,authoredRoadCourse} from '../src/content/authored-track';
import {createPilotTrack,pilotCourse} from '../src/pilot-composer';

it('R2d: authored manifest, road and scene are one finite coastal stage',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(COAST_STAGE.manifest.id).toBe('coast');
 expect(COAST_STAGE.scene.staticProps.find(p=>p.id==='hamlet-farmhouse')?.roadDistance).toBe(1085);
 expect(COAST_STAGE.road.turns).toHaveLength(9);
 expect(COAST_STAGE.scenicActs.at(-1)?.end).toBe(COAST_STAGE.road.length);
 expect(COAST_ULTRA_LENGTH).toBe(COAST_STAGE.road.length);
});

it('R2d: compatibility bridge preserves the approved coast runtime metadata',()=>{
 const s=COAST_ULTRA_STAGE,m=COAST_STAGE.manifest,r=COAST_STAGE.road;
 expect(s.id).toBe('ROAD-TRIP-10M');
 expect(s.revision).toBe(28);
 expect(s.generatorVersion).toBe('v0.9-r10');
 expect(s.contentFingerprint).toBe('coast-farewell-headlands-r2-804');
 expect(s.stageCode).toBe('COAST-RESORT-R8');
 expect(s.tripCode).toBe('COAST-RESORT-R8');
 expect(s.world).toBe('coast');
 expect(s.seed).toBe(804);
 expect(s.name).toBe(m.name);
 expect(s.intent).toBe(m.intent);
 expect(s.entrySpeed).toBe(140);
 expect(s.baseLanes).toBe(5);
 expect(s.baseHeight).toBe(-1.8);
 expect(s.authoredRoad).toBe(r);
 expect(s.placements).toHaveLength(r.turns.length+r.elevations.length);
 expect(s.scenerySections).toEqual([{id:'coast-ultra-left-sea',kind:'coastal-left',
  start:350,end:10350,left:'sea',right:'coastal-land'}]);
 expect(s.beats.map(b=>[b.startS,b.endS,b.role])).toEqual(
  COAST_STAGE.scenicActs.map(a=>[a.start,a.end,a.label]));
 expect(s.buffers).toEqual([{startS:0,endS:100,role:'launch'},
  {startS:9920,endS:10000,role:'finish'}]);
 expect(s.worldPhases).toEqual([{startS:0,endS:10000,world:'coast',beat:'Sunset coast journey'}]);
 expect(s.scenicLandmarks).toEqual([]);
 expect(s.entry).toBe('Quiet dusk shoreline');
 expect(s.exit).toBe('Golden-water farewell');
 expect(s.warning).toEqual({leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'});
});

it('R2d: stage authoring changes flow through bridge without hand-editing Trip',()=>{
 const edited:CoastStageContent={...COAST_STAGE,manifest:{...COAST_STAGE.manifest,
  name:'Another coast',seed:912,entrySpeed:160}};
 const converted=toLegacyCoastStage(edited);
 expect(converted.name).toBe('Another coast');
 expect(converted.seed).toBe(912);
 expect(converted.entrySpeed).toBe(160);
 expect(converted.length).toBe(COAST_ULTRA_STAGE.length);
});

it('R2d: road and track remain identical through the compatibility boundary',()=>{
 const road=COAST_STAGE.road,legacy=COAST_ULTRA_STAGE;
 expect(pilotCourse(legacy)).toEqual(authoredRoadCourse(road,legacy));
 const actual=createPilotTrack(legacy),expected=createAuthoredCoastTrack(road,legacy);
 expect(actual.length).toBe(expected.length);
 for(let d=0;d<=actual.length;d+=149){
  const a=actual.sample(d),b=expected.sample(d);
  expect(a.position.distanceTo(b.position),`position at ${d}`).toBeLessThan(1e-8);
  expect(a.roadHeading,`heading at ${d}`).toBe(b.roadHeading);
  expect(a.right.y,`bank at ${d}`).toBe(b.right.y);
 }
});

it('R2d: rejects out-of-sync stage IDs and broken scenic act coverage',()=>{
 const make=(change:(content:CoastStageContent)=>void)=>{
  const copy={...COAST_STAGE,manifest:{...COAST_STAGE.manifest},
   road:{...COAST_STAGE.road},scene:{...COAST_STAGE.scene},scenicActs:[...COAST_STAGE.scenicActs]};
  change(copy);
  expect(()=>validateCoastStage(copy)).toThrow();
 };
 make(c=>{c.scene.id='different';});
 make(c=>{c.manifest.schemaVersion=9 as 1;});
 make(c=>{c.scenicActs=[...c.scenicActs.slice(0,-1)];});
 make(c=>{c.manifest.seed=-1;});
});
