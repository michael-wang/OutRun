import {COAST_STAGE,type CoastStageContent} from './coast-stage';
import {sampleAuthoredRoad} from './authored-road';
import {createAuthoredCoastTrack} from './authored-track';
import type {ScenerySection} from '../scenery-cross-section';
import type {BankStrength} from '../banking';

/** Only the coast Worker's real inputs. No Pilot, Brick or Trip inheritance.
 * Legacy identity flags remain temporarily for existing scenery features. */
export function coastWorkerRoad(content:CoastStageContent=COAST_STAGE,bank?:BankStrength){
 const {road,manifest}=content;
 const stage={
  id:'ROAD-TRIP-10M',
  seed:manifest.seed,
  sceneryAct:0,
  generatorVersion:'v0.9-r10',
  scenerySections:[{
   id:'coast-ultra-left-sea',kind:'coastal-left',
   start:road.startDistance,end:road.startDistance+road.length,
   left:'sea',right:'coastal-land',
  }] satisfies ScenerySection[],
  scenicLandmarks:[],
 };
 const track=createAuthoredCoastTrack(road,{id:stage.id,name:manifest.name,
  sceneryAct:stage.sceneryAct},bank);
 return {
  stage,track,
  halfAt:(distance:number)=>sampleAuthoredRoad(road,distance).halfWidth,
  weightsAt:(_distance:number)=>[1,0,0],
 };
}
