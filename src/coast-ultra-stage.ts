import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {LANE_WIDTH} from './road-profile';
import {COAST_SCENIC_ACTS} from './coast-journey-layout';
import {coastAuthoredRoad,authoredRoadPlacements} from './content/authored-road';
import type {TripCandidate} from './trip';

/** Finite coast stage; the road is authored in content/stages/coast/road.json.
 * Retain legacy stage/geometry IDs until the Worker and surface contracts are
 * migrated, so the accepted road, traffic and Ultra Water remain unchanged. */
export const COAST_ULTRA_LENGTH=coastAuthoredRoad.length;
const duration=COAST_ULTRA_LENGTH/REFERENCE_TRAVEL;
export const COAST_ULTRA_STAGE:TripCandidate={
 // Temporary runtime-compatibility ID; this is no longer a trip generator.
 id:'ROAD-TRIP-10M',
 revision:28,sceneryAct:0,seed:804,world:'coast',generatorVersion:'v0.9-r10',
 name:'Azure Coast · Scenic Journey',
 intent:'Coastal journey from rice fields and a courtyard through beach, lively market town and fishing farmland.',
 emotionalRole:'coastal-water-playtest',contentFingerprint:'coast-farewell-headlands-r2-804',
 stageCode:'COAST-RESORT-R8',tripCode:'COAST-RESORT-R8',
 length:COAST_ULTRA_LENGTH,
 baseHeight:coastAuthoredRoad.baseHeight,
 baseLanes:coastAuthoredRoad.lanes,
 roadWidth:coastAuthoredRoad.lanes*LANE_WIDTH,
 placements:authoredRoadPlacements(coastAuthoredRoad),
 bankFeatures:[],
 fixedRoad:undefined,
 worldPhases:[{startS:0,endS:COAST_ULTRA_LENGTH,world:'coast',beat:'Sunset coast journey'}],
 beats:COAST_SCENIC_ACTS.map((act,i)=>({
  id:`COAST-SCENIC-${i+1}`,startS:act.start,endS:act.end,
  world:'coast' as const,verticality:'gentle' as const,role:act.label,
 })),
 buffers:[{startS:0,endS:100,role:'launch'},{startS:COAST_ULTRA_LENGTH-80,endS:COAST_ULTRA_LENGTH,role:'finish'}],
 scenerySections:[{id:'coast-ultra-left-sea',kind:'coastal-left',start:BRICK_START,end:BRICK_START+COAST_ULTRA_LENGTH,left:'sea',right:'coastal-land'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 nominalDuration:duration,entrySpeed:140,referenceSpeed:230,
 lanes:[[0,coastAuthoredRoad.lanes],[duration,coastAuthoredRoad.lanes]],
 elevation:[[0,coastAuthoredRoad.baseHeight],[duration,coastAuthoredRoad.baseHeight+coastAuthoredRoad.elevations.reduce((s,p)=>s+p.rise,0)]],
 requiredSteerProfile:[[0,0]],
 entry:'Quiet dusk shoreline',exit:'Golden-water farewell',
 warning:{leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'},
 tags:['coast','ultra-water','prototype'],
 antiAdjacency:[],autoValidation:'PENDING',
};
