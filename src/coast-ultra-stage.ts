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
const s=(a:number,b:number,effort:number,direction:1|-1,beat:string):Placement=>({
 channel:'curvature',id:'C06',startS:a,endS:b,
 parameters:{effort,direction,start:0,end:1,secondary:.7},transition:'smooth',beat,
});
const gentleRise:Placement={
 channel:'elevation',id:'E02',startS:0,endS:COAST_ULTRA_LENGTH,
 parameters:{base:-1.8,amplitude:1.0,direction:1,shelfStart:.32,shelfEnd:.68},
 transition:'smooth',beat:'Coastal climb',
};

export const COAST_ULTRA_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,
 revision:23,sceneryAct:0,seed:804,world:'coast',generatorVersion:'v0.9-r10',
 name:'Azure Coast · Sunset Postcard',
 intent:'A paced sunset journey: alternating beaches, lit neighbourhoods and markets, with a sunset bay finale.',
 emotionalRole:'coastal-water-playtest',contentFingerprint:'coast-sunset-lively-r6-804',
 stageCode:'COAST-SUNSET-R6',tripCode:'COAST-SUNSET-R6',
 length:COAST_ULTRA_LENGTH,baseHeight:-1.8,baseLanes:4,roadWidth:4*LANE_WIDTH,
 placements:[
  gentleRise,
  c(160,780,.56,-1,'Beach approach'),
  c(1000,1720,.48,1,'Family beach'),
  c(2200,2820,.4,1,'Neighbourhood arrival'),
  c(3180,3800,.4,-1,'Leave the village'),
  s(4200,5400,.3,1,'Quiet coast S'),
  c(6000,6600,.42,1,'Headland approach'),
  // End heading ~-0.47 rad places the fixed COAST_SUN left of the chase view.
  // The beach/market open after this turn; the camera and sun never pivot for it.
  c(6800,7750,.44,-1,'Sunset reveal'),
  c(8500,9200,.28,1,'Golden-water farewell'),
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
 lanes:[[0,4],[duration,4]],elevation:[[0,-1.8],[duration,-.8]],requiredSteerProfile:[[0,0]],
 entry:'Quiet dusk shoreline',exit:'Golden-water farewell',warning:{leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'},
 tags:['coast','ultra-water','prototype'],autoValidation:'PENDING',
};
