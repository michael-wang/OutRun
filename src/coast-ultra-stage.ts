import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {LANE_WIDTH} from './road-profile';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY,type CoastStageContent} from './content/coast-stage';
import {authoredRoadPlacements} from './content/authored-road';
import type {TripCandidate} from './trip';

/** Compatibility boundary only. The authored coast lives in:
 * content/stages/coast/{stage,road,scene}.json
 * Existing Worker / game diagnostics still consume the old Trip shape.
 * Remove this bridge when those consumers have migrated. */
export function toLegacyCoastStage(content:CoastStageContent):TripCandidate{
 const {manifest,road,scenicActs}=content;
 if(road.startDistance!==BRICK_START)throw Error('Coast launch must match existing game start distance');
 const duration=road.length/REFERENCE_TRAVEL;
 return {
  ...COAST_RUNTIME_IDENTITY,
  sceneryAct:0,seed:manifest.seed,world:'coast',
  name:manifest.name,intent:manifest.intent,
  emotionalRole:'coastal-water-playtest',
  length:road.length,
  baseHeight:road.baseHeight,
  baseLanes:road.lanes,
  roadWidth:road.lanes*LANE_WIDTH,
  authoredRoad:road,
  placements:authoredRoadPlacements(road),
  bankFeatures:[],
  fixedRoad:undefined,
  worldPhases:[{startS:0,endS:road.length,world:'coast',beat:'Sunset coast journey'}],
  beats:scenicActs.map((act,i)=>({
   id:`COAST-SCENIC-${i+1}`,startS:act.start,endS:act.end,
   world:'coast' as const,verticality:'gentle' as const,role:act.label,
  })),
  buffers:[{startS:0,endS:100,role:'launch'},{startS:road.length-80,endS:road.length,role:'finish'}],
  scenerySections:[{id:'coast-ultra-left-sea',kind:'coastal-left',
   start:road.startDistance,end:road.startDistance+road.length,left:'sea',right:'coastal-land'}],
  canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
  nominalDuration:duration,entrySpeed:manifest.entrySpeed,referenceSpeed:230,
  lanes:[[0,road.lanes],[duration,road.lanes]],
  elevation:[[0,road.baseHeight],[duration,road.baseHeight+road.elevations.reduce((sum,part)=>sum+part.rise,0)]],
  requiredSteerProfile:[[0,0]],
  entry:manifest.entry,exit:manifest.exit,
  warning:manifest.warning,
  tags:['coast','ultra-water','prototype'],
  antiAdjacency:[],autoValidation:'PENDING',
 };
}

export const COAST_ULTRA_LENGTH=COAST_STAGE.road.length;
export const COAST_ULTRA_STAGE=toLegacyCoastStage(COAST_STAGE);
