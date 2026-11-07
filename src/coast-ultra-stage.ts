import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {LANE_WIDTH} from './road-profile';
import {COAST_SCENIC_ACTS} from './coast-journey-layout';
import {DESIGNER_CANYON_STAGE} from './designer-canyon';
import type {Placement} from './pilot-composer';
import type {TripCandidate} from './trip';

/** Isolated procedural coastal driving test — no edits to the canyon/city modes.
 * Initial direction follows the existing coastal-left road/terrain system. */
export const COAST_ULTRA_LENGTH=10000;
const duration=COAST_ULTRA_LENGTH/REFERENCE_TRAVEL;
const c=(a:number,b:number,effort:number,direction:1|-1,beat:string):Placement=>({
 channel:'curvature',id:'C02',startS:a,endS:b,
 parameters:{effort,direction,start:0,end:1,secondary:.7},transition:'smooth',beat,
});
const gentleRise:Placement={
 channel:'elevation',id:'E02',startS:0,endS:COAST_ULTRA_LENGTH,
 parameters:{base:-1.8,amplitude:1.0,direction:1,shelfStart:.32,shelfEnd:.68},
 transition:'smooth',beat:'Coastal climb',
};

export const COAST_ULTRA_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,
 revision:28,sceneryAct:0,seed:804,world:'coast',generatorVersion:'v0.9-r10',
 name:'Azure Coast · Scenic Journey',
 intent:'Coastal journey from rice fields and a courtyard through beach, lively market town and fishing farmland.',
 emotionalRole:'coastal-water-playtest',contentFingerprint:'coast-farewell-headlands-r2-804',
 stageCode:'COAST-RESORT-R8',tripCode:'COAST-RESORT-R8',
 length:COAST_ULTRA_LENGTH,baseHeight:-1.8,baseLanes:5,roadWidth:5*LANE_WIDTH,
 placements:[
  gentleRise,
  // Shallow headlands keep the fixed sun offshore and in the forward-left view.
  // Each return opens another long bay, without rotating the sky or the camera.
  c(0,650,.14,-1,'First sunset bay'),
  c(1750,2400,.18,1,'Village headland'),
  c(2800,3450,.18,-1,'Second sunset bay'),
  c(4550,5200,.18,1,'Wooded headland'),
  c(5500,6150,.18,-1,'Third sunset bay'),
  c(7000,7650,.18,1,'Market headland'),
  c(7950,8600,.18,-1,'Golden-water farewell'),
  // HUD 8.98–10.23 km: round the fishing point, then unwind towards
  // the sunset. Leave 120 m to settle before the finish at 10.35 km.
  c(8630,9230,.14,-1,'Fishing point'),
  c(9300,9880,.145,1,'Return along the last cove'),
 ].sort((a,b)=>a.startS-b.startS),
 bankFeatures:[],fixedRoad:undefined,
 worldPhases:[{startS:0,endS:COAST_ULTRA_LENGTH,world:'coast',beat:'Sunset coast journey'}],
 // Beat metadata follows the same authored act boundaries used by boats,
 // crops, housing, tourism and vegetation. Road curvature stays untouched.
 beats:COAST_SCENIC_ACTS.map((act,i)=>({
  id:`COAST-SCENIC-${i+1}`,startS:act.start,endS:act.end,
  world:'coast' as const,verticality:'gentle' as const,role:act.label,
 })),
 buffers:[{startS:0,endS:100,role:'launch'},{startS:COAST_ULTRA_LENGTH-80,endS:COAST_ULTRA_LENGTH,role:'finish'}],
 scenerySections:[{id:'coast-ultra-left-sea',kind:'coastal-left',start:BRICK_START,end:BRICK_START+COAST_ULTRA_LENGTH,left:'sea',right:'coastal-land'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 nominalDuration:duration,entrySpeed:140,referenceSpeed:230,
 lanes:[[0,5],[duration,5]],elevation:[[0,-1.8],[duration,-.8]],requiredSteerProfile:[[0,0]],
 entry:'Quiet dusk shoreline',exit:'Golden-water farewell',warning:{leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'},
 tags:['coast','ultra-water','prototype'],autoValidation:'PENDING',
};
