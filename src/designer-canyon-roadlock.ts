import {REFERENCE_TRAVEL} from './challenges';
import {LANE_WIDTH} from './road-profile';
import {BRICK_START} from './bricks';
import {DESIGNER_CANYON_STAGE,DESIGNER_CUT,type DesignedProp} from './designer-canyon';
import type {Placement} from './pilot-composer';
import type {BankFeature} from './banking';
import type {TripCandidate} from './trip';

/** Road Lock V1: the authored track is the goal, not the placeholder scenery.
 * Designer Canyon v1 and every random-trip revision remain unchanged. */
export const CANYON_ROADLOCK_VERSION='canyon-roadlock-v1';
export const CANYON_ROADLOCK_LENGTH=5650;
export interface RoadLockMoment {readonly id:string;readonly name:string;readonly startS:number;readonly endS:number;readonly role:'hero'|'connector'}
export const CANYON_ROADLOCK_MOMENTS:readonly RoadLockMoment[]=Object.freeze([
 {id:'L01',name:'岩壁進場',startS:0,endS:500,role:'connector'},
 {id:'H01',name:'Hero 1 · 左側大型髮夾彎',startS:500,endS:1220,role:'hero'},
 {id:'L02',name:'第一層折返山腰公路',startS:1220,endS:1970,role:'connector'},
 {id:'H02',name:'Hero 2 · 右側大型髮夾彎',startS:1970,endS:2710,role:'hero'},
 {id:'L03',name:'高處舒展路段',startS:2710,endS:3600,role:'connector'},
 {id:'L04',name:'岩壁夾道與轉場',startS:3600,endS:4250,role:'connector'},
 {id:'H03',name:'Hero 3 · 觀景長彎',startS:4250,endS:5000,role:'hero'},
 {id:'L05',name:'舒展出場',startS:5000,endS:CANYON_ROADLOCK_LENGTH,role:'connector'},
].map(moment=>Object.freeze({...moment,role:moment.role as RoadLockMoment['role']})));

const curve=(id:'C02'|'C08',a:number,b:number,effort:number,direction:1|-1,beat:string):Placement=>({
 channel:'curvature',id,startS:a,endS:b,
 parameters:{effort,direction,start:0,end:1,secondary:.7},transition:'smooth',beat,
});
const climb=(a:number,b:number,base:number,gain:number,beat:string):Placement=>({
 channel:'elevation',id:'E02',startS:a,endS:b,
 parameters:{base,amplitude:Math.abs(gain),direction:gain>=0?1:-1,shelfStart:.32,shelfEnd:.68},
 transition:'smooth',beat,
});
/** TWO opposite C08 176° hairpins, separated by a full mountain-shelf run.
 * Do not replace with a C06 short rhythm or reduce them to a gentle wiggle.
 * The later turns approach the third hero without crossing earlier roads. */
export const CANYON_ROADLOCK_CURVES:readonly Placement[]=[
 curve('C02',130,350,.20,1,'L01'),
 curve('C08',500,1220,1.18,1,'H01'),
 curve('C02',1440,1880,.20,-1,'L02'),
 curve('C08',1970,2710,1.15,-1,'H02'),
 curve('C02',2870,3590,.28,1,'L03'),
 curve('C02',3800,4260,.20,-1,'L04'),
 curve('C02',4310,5010,.35,-1,'H03'),
 curve('C02',5160,5440,.15,1,'L05'),
];
/** Strong authored grades, with zero-slope approach/exit to each E02.
 * The crest rises from 120m to 420m; then two long descents allow release. */
export const CANYON_ROADLOCK_ELEVATION:readonly Placement[]=[
 climb(450,1380,120,100,'H01'),
 climb(1530,2710,220,95,'H02'),
 climb(2880,3650,315,105,'L03'),
 climb(3750,4800,420,-95,'H03'),
 climb(5020,5500,325,-45,'L05'),
];
/** Sign follows road turn; positive is low-left/high-right for a left turn.
 * High banking is intentional ARCADE banking, not a real road safety claim. */
export const CANYON_ROADLOCK_BANK:readonly BankFeature[]=[
 {kind:'showcase',start:BRICK_START+500,end:BRICK_START+1220,ramp:155,degrees:26},
 {kind:'showcase',start:BRICK_START+1970,end:BRICK_START+2710,ramp:155,degrees:-26},
 {kind:'showcase',start:BRICK_START+2870,end:BRICK_START+3590,ramp:170,degrees:17},
 {kind:'showcase',start:BRICK_START+4310,end:BRICK_START+5010,ramp:160,degrees:-17},
];
/** Only very sparse fixed silhouettes and slope/rock placeholders.
 * These positions are from the road itself, not the old v1 GLB coordinates.
 * Larger terrain and river landscape come AFTER driving acceptance. */
const prop=(kind:DesignedProp['kind'],at:number,offset:number,width:number,height:number,depth:number):DesignedProp=>
 ({kind,at:BRICK_START+at,offset,width,height,depth});
export const CANYON_ROADLOCK_PLACEHOLDERS:readonly DesignedProp[]=Object.freeze([
 prop('cliff',190,-110,78,45,100),
 prop('cliff',370,-130,115,53,140),
 prop('rim',420,210,100,65,112),
 prop('talus',610,-175,24,5,25),
 prop('cliff',875,-195,110,68,145),
 prop('terrace',1120,250,130,54,140),
 prop('rim',1480,-175,100,73,125),
 prop('scrub',1800,190,4,2,5),
 prop('cliff',1950,-150,140,56,170),
 prop('talus',2180,-190,23,5,23),
 prop('terrace',2470,250,160,58,190),
 prop('cliff',2850,-155,100,65,135),
 prop('cliff',3200,-170,110,77,135),
 prop('rim',3750,200,125,70,150),
 prop('talus',4100,-155,25,5,23),
 prop('terrace',4540,270,145,78,195),
 prop('cliff',4850,-175,75,60,110),
 prop('rim',5350,120,80,43,120),
]);
const moments=CANYON_ROADLOCK_MOMENTS;
const duration=CANYON_ROADLOCK_LENGTH/REFERENCE_TRAVEL;
export const CANYON_ROADLOCK_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,
 revision:14,
 name:'Grand Canyon · One Minute Road Lock',
 intent:'Four-lane arcade mountain road: two opposing broad hairpins, 300m elevation range, and three vista beats.',
 emotionalRole:'roadlock-driving-validation',
 seed:714,world:'canyon',generatorVersion:CANYON_ROADLOCK_VERSION,
 contentFingerprint:'canyon-roadlock-v1-714-static',
 stageCode:'CUT-CANYON-ROADLOCK-01',tripCode:'CUT-CANYON-ROADLOCK-01',
 length:CANYON_ROADLOCK_LENGTH,baseHeight:120,baseLanes:4,
 roadWidth:4*LANE_WIDTH,
 beats:moments.map(m=>({id:m.id,startS:m.startS,endS:m.endS,world:'canyon' as const,
  verticality:m.role==='hero'?'rolling':'gentle',role:m.name})),
 buffers:[{startS:0,endS:250,role:'launch'},{startS:2710,endS:2850,role:'scenic'},{startS:5500,endS:CANYON_ROADLOCK_LENGTH,role:'finish'}],
 worldPhases:[{startS:0,endS:CANYON_ROADLOCK_LENGTH,world:'canyon',beat:'One-minute canyon switchbacks'}],
 placements:[...CANYON_ROADLOCK_CURVES,...CANYON_ROADLOCK_ELEVATION].sort((a,b)=>a.startS-b.startS),
 bankFeatures:[...CANYON_ROADLOCK_BANK],
 // No old canyon river/GLB or sky-filling foundation: those coordinates belong
 // to a different road. This keeps the driving lock test meaningful.
 canyonPrototype:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 designerCut:{...DESIGNER_CUT,visibleFrom:BRICK_START+500,
  riverLookAt:BRICK_START+2350,props:CANYON_ROADLOCK_PLACEHOLDERS},
 scenerySections:[{id:'roadlock-canyon',kind:'canyon',
  start:BRICK_START,end:BRICK_START+CANYON_ROADLOCK_LENGTH,left:'canyon',right:'canyon'}],
 nominalDuration:duration,entrySpeed:0,referenceSpeed:230,
 lanes:[[0,4],[duration,4]],elevation:[[0,120],[duration,280]],
 requiredSteerProfile:[[0,0]],
 entry:'Four lanes · canyon approach',exit:'High plateau release',
 warning:{leadMeters:300,text:'HAIRPIN · BRAKE TO 170'},
 tags:['designer-cut','grand-canyon','road-lock','four-lanes'],autoValidation:'PENDING',
};
