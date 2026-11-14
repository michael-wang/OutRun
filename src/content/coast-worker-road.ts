import {COAST_STAGE,COAST_RUNTIME_IDENTITY,type CoastStageContent} from './coast-stage';
import {sampleAuthoredRoad} from './authored-road';
import {createAuthoredCoastTrack,authoredRoadCourse} from './authored-track';
import type {ScenerySection} from '../scenery-cross-section';
import type {JourneyLandmark} from '../scenery';
import type {BankStrength} from '../banking';

/** Shared main-thread / Worker runtime, derived from authored coast content.
 * No Pilot, Brick or Trip inheritance or duplicate road source. */
export function coastWorkerRoad(content:CoastStageContent=COAST_STAGE,bank?:BankStrength){
 const {road,manifest}=content;
 const stage={
  kind:'authored-coast' as const,
  id:COAST_RUNTIME_IDENTITY.id,
  seed:manifest.seed,
  sceneryAct:0,
  generatorVersion:COAST_RUNTIME_IDENTITY.generatorVersion as string,
  scenerySections:[{
   id:'coast-ultra-left-sea',kind:'coastal-left',
   start:road.startDistance,end:road.startDistance+road.length,
   left:'sea',right:'coastal-land',
  }] satisfies ScenerySection[],
  scenicLandmarks:[] as JourneyLandmark[],
 };
 const identity={id:stage.id,name:manifest.name,sceneryAct:stage.sceneryAct};
 const track=createAuthoredCoastTrack(road,identity,bank);
 const course=authoredRoadCourse(road,identity);
 return {
  stage,track,course,
  halfAt:(distance:number)=>sampleAuthoredRoad(road,distance).halfWidth,
  weightsAt:(_distance:number)=>[1,0,0],
 };
}

/** The narrow authored coast descriptor used by World and StreamedScene. */
export type CoastRuntimeStage=ReturnType<typeof coastWorkerRoad>['stage'];
