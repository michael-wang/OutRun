import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {LANE_WIDTH} from './road-profile';
import {DESIGNER_CANYON_STAGE} from './designer-canyon';
import type {Placement} from './pilot-composer';
import type {TripCandidate} from './trip';

/** Isolated procedural coastal driving test — no edits to the canyon/city modes.
 * Initial direction follows the existing coastal-left road/terrain system. */
export const COAST_ULTRA_LENGTH=3350;
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
 revision:18,sceneryAct:0,seed:804,world:'coast',generatorVersion:'v0.9-r10',
 name:'Azure Coast · Ultra-Water Experiment',
 intent:'Dry oceanfront road beside a sandy beach, wet shoreline and breaking waves.',
 emotionalRole:'coastal-water-playtest',contentFingerprint:'coast-ultra-beach-r1-804',
 stageCode:'COAST-ULTRA-R1',tripCode:'COAST-ULTRA-R1',
 length:COAST_ULTRA_LENGTH,baseHeight:-1.8,baseLanes:4,roadWidth:4*LANE_WIDTH,
 placements:[
  gentleRise,
  c(160,780,.56,-1,'Ocean reveal'),
  c(880,1550,.63,1,'Cliffside sweeper'),
  s(1610,2280,.54,-1,'Sea-breeze S'),
  c(2370,3140,.67,-1,'Lighthouse bend'),
 ].sort((a,b)=>a.startS-b.startS),
 bankFeatures:[],fixedRoad:undefined,
 worldPhases:[{startS:0,endS:COAST_ULTRA_LENGTH,world:'coast',beat:'Sunlit ocean road'}],
 beats:[
  {id:'COAST-ENTRY',startS:0,endS:700,world:'coast',verticality:'gentle',role:'Sea reveal'},
  {id:'COAST-SWEEP',startS:700,endS:1590,world:'coast',verticality:'rolling',role:'Long seaside sweeps'},
  {id:'COAST-S',startS:1590,endS:2350,world:'coast',verticality:'rolling',role:'Sea-breeze S'},
  {id:'COAST-FINALE',startS:2350,endS:COAST_ULTRA_LENGTH,world:'coast',verticality:'gentle',role:'Ocean lookout'},
 ],
 buffers:[{startS:0,endS:100,role:'launch'},{startS:COAST_ULTRA_LENGTH-80,endS:COAST_ULTRA_LENGTH,role:'finish'}],
 scenerySections:[{id:'coast-ultra-left-sea',kind:'coastal-left',start:BRICK_START,end:BRICK_START+COAST_ULTRA_LENGTH,left:'sea',right:'coastal-land'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 nominalDuration:duration,entrySpeed:140,referenceSpeed:230,
 lanes:[[0,4],[duration,4]],elevation:[[0,-1.8],[duration,-.8]],requiredSteerProfile:[[0,0]],
 entry:'Sunlit Pacific cliff road',exit:'Blue horizon',warning:{leadMeters:250,text:'COASTAL SWEEPER · HOLD YOUR LINE'},
 tags:['coast','ultra-water','prototype'],autoValidation:'PENDING',
};
