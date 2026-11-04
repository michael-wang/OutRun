import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {LANE_WIDTH} from './road-profile';
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
 revision:26,sceneryAct:0,seed:804,world:'coast',generatorVersion:'v0.9-r10',
 name:'Azure Coast · Resort Plain',
 intent:'Sunset bays beside a resort road, with a wooded plain, inland foothills and layered high mountains.',
 emotionalRole:'coastal-water-playtest',contentFingerprint:'coast-five-lanes-r87-804',
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
 ].sort((a,b)=>a.startS-b.startS),
 bankFeatures:[],fixedRoad:undefined,
 worldPhases:[{startS:0,endS:COAST_ULTRA_LENGTH,world:'coast',beat:'Sunset coast journey'}],
 beats:[
  {id:'COAST-ENTRY',startS:0,endS:900,world:'coast',verticality:'gentle',role:'Settle into the coast'},
  {id:'COAST-BEACH',startS:900,endS:2100,world:'coast',verticality:'gentle',role:'Left beach and visitors; quiet inland'},
  {id:'COAST-HOMES',startS:2100,endS:3800,world:'coast',verticality:'gentle',role:'Right neighbourhood; calm water'},
  {id:'COAST-QUIET',startS:3800,endS:6000,world:'coast',verticality:'gentle',role:'Market into beach, then lit neighbourhood'},
  {id:'COAST-TURN',startS:6000,endS:7450,world:'coast',verticality:'gentle',role:'Beach and market before a short sunset approach'},
  {id:'COAST-POSTCARD',startS:7450,endS:8750,world:'coast',verticality:'gentle',role:'Sun path, wide beach and night market'},
  {id:'COAST-EXIT',startS:8750,endS:10000,world:'coast',verticality:'gentle',role:'Beach and lit homes farewell'},
 ],
 buffers:[{startS:0,endS:100,role:'launch'},{startS:COAST_ULTRA_LENGTH-80,endS:COAST_ULTRA_LENGTH,role:'finish'}],
 scenerySections:[{id:'coast-ultra-left-sea',kind:'coastal-left',start:BRICK_START,end:BRICK_START+COAST_ULTRA_LENGTH,left:'sea',right:'coastal-land'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 nominalDuration:duration,entrySpeed:140,referenceSpeed:230,
 lanes:[[0,5],[duration,5]],elevation:[[0,-1.8],[duration,-.8]],requiredSteerProfile:[[0,0]],
 entry:'Quiet dusk shoreline',exit:'Golden-water farewell',warning:{leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'},
 tags:['coast','ultra-water','prototype'],autoValidation:'PENDING',
};
