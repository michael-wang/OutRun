import {REFERENCE_TRAVEL} from './challenges';
import {LANE_WIDTH} from './road-profile';
import {BRICK_START} from './bricks';
import {DESIGNER_CANYON_STAGE,DESIGNER_CUT,type DesignedProp} from './designer-canyon';
import type {Placement} from './pilot-composer';
import type {BankFeature} from './banking';
import type {TripCandidate} from './trip';

/** One mutable fixed course, tuned by driving reports — not a generated tour. */
export const CANYON_ROADLOCK_VERSION='canyon-roadlock-v1';
export const CANYON_ROADLOCK_LENGTH=5650;
export interface RoadLockMoment {readonly id:string;readonly name:string;readonly startS:number;readonly endS:number;readonly role:'hero'|'challenge'}
export const CANYON_ROADLOCK_MOMENTS:readonly RoadLockMoment[]=Object.freeze([
 {id:'H00',name:'岩壁入口 · 大左彎',startS:0,endS:320,role:'challenge'},
 {id:'H01',name:'Hero 1 · 深谷左髮夾',startS:320,endS:900,role:'hero'},
 {id:'H02',name:'崖邊長右彎 · 谷口逐步展開',startS:900,endS:1410,role:'challenge'},
 {id:'H03',name:'Hero 2 · 巨岩右髮夾',startS:1410,endS:2010,role:'hero'},
 {id:'H04',name:'山腰大 S · 一次完整反向',startS:2010,endS:2650,role:'challenge'},
 {id:'H05',name:'Hero 3 · 高台左髮夾',startS:2650,endS:3300,role:'hero'},
 {id:'H06',name:'高原長右彎 · 遠景開闊',startS:3300,endS:3950,role:'challenge'},
 {id:'H07',name:'峭壁長 S · 下坡急煞',startS:3950,endS:4650,role:'challenge'},
 {id:'H08',name:'山脊長右彎 · 近景收束',startS:4650,endS:5120,role:'challenge'},
 {id:'H09',name:'最後長左彎 · 峽谷出口',startS:5120,endS:CANYON_ROADLOCK_LENGTH,role:'challenge'},
].map(p=>Object.freeze({...p,role:p.role as RoadLockMoment['role']})));
const curve=(id:'C02'|'C06'|'C08',a:number,b:number,effort:number,direction:1|-1,beat:string):Placement=>({
 channel:'curvature',id,startS:a,endS:b,
 parameters:{effort,direction,start:0,end:1,secondary:.7},transition:'smooth',beat,
});
const elevation=(a:number,b:number,base:number,delta:number,beat:string):Placement=>({
 channel:'elevation',id:'E02',startS:a,endS:b,
 parameters:{base,amplitude:Math.abs(delta),direction:delta>=0?1:-1,shelfStart:.32,shelfEnd:.68},
 transition:'smooth',beat,
});
/** Road-first canyon choreography. Preserve all three steeply banked C08
 * hairpins; replace the C07 four-times zigzags with sustained C02 turns
 * and only TWO deliberate, spacious C06 S-reversals. This makes each
 * mountain spur or cliff wrap a single readable driving challenge. */
export const CANYON_ROADLOCK_CURVES:readonly Placement[]=[
 curve('C02',35,295,.74,1,'H00'),
 curve('C08',340,870,1.60,1,'H01'),
 curve('C02',930,1370,1.05,-1,'H02'),
 curve('C08',1430,1970,1.57,-1,'H03'),
 curve('C06',2050,2590,1.18,1,'H04'),
 curve('C08',2670,3230,1.52,1,'H05'),
 curve('C02',3340,3900,1.20,-1,'H06'),
 curve('C06',4010,4560,1.28,1,'H07'),
 curve('C02',4670,5085,1.22,-1,'H08'),
 curve('C02',5160,5590,1.16,1,'H09'),
];
/** Six mountain ascents/descents: approx 310m total relief, severe grades. */
export const CANYON_ROADLOCK_ELEVATION:readonly Placement[]=[
 elevation(0,1100,120,140,'H01'),
 elevation(1180,2020,260,150,'H03'),
 elevation(2110,2950,410,-130,'H04'),
 elevation(3030,3850,280,150,'H06'),
 elevation(3920,4720,430,-160,'H07'),
 elevation(4800,5500,270,-130,'H09'),
];
/** Big turns deserve big banking; a wide scenic turn can still stay
 * engaging without the tiny left/right fluctuations of C07. */
export const CANYON_ROADLOCK_BANK:readonly BankFeature[]=[
 {kind:'showcase',start:BRICK_START+340,end:BRICK_START+870,ramp:105,degrees:34},
 {kind:'showcase',start:BRICK_START+1430,end:BRICK_START+1970,ramp:110,degrees:-34},
 {kind:'showcase',start:BRICK_START+2670,end:BRICK_START+3230,ramp:110,degrees:36},
 {kind:'showcase',start:BRICK_START+3340,end:BRICK_START+3900,ramp:135,degrees:-22},
 {kind:'showcase',start:BRICK_START+4010,end:BRICK_START+4280,ramp:80,degrees:24},
 {kind:'showcase',start:BRICK_START+4280,end:BRICK_START+4560,ramp:80,degrees:-24},
 {kind:'showcase',start:BRICK_START+4670,end:BRICK_START+5085,ramp:115,degrees:-25},
 {kind:'showcase',start:BRICK_START+5160,end:BRICK_START+5590,ramp:120,degrees:25},
];
/** Distant placeholders only. We do NOT design Blender scenery before the
 * road passes human playtest. */
const prop=(kind:DesignedProp['kind'],at:number,offset:number,width:number,height:number,depth:number):DesignedProp=>
 ({kind,at:BRICK_START+at,offset,width,height,depth});
export const CANYON_ROADLOCK_PLACEHOLDERS:readonly DesignedProp[]=Object.freeze([
 prop('cliff',180,-380,120,60,180),
 prop('rim',1080,430,135,90,200),
 prop('cliff',1700,-450,160,80,220),
 prop('terrace',2470,450,170,100,230),
 prop('rim',3600,-420,155,100,200),
 prop('cliff',4310,410,170,105,235),
 prop('rim',5330,-400,120,75,170),
]);
const duration=CANYON_ROADLOCK_LENGTH/REFERENCE_TRAVEL;
export const CANYON_ROADLOCK_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,
 revision:14,
 name:'Grand Canyon · Grand Curves',
 intent:'One-way four-lane extreme canyon: three banked hairpins and large terrain-led sweeps, with two major S-reversals.',
 emotionalRole:'roadlock-driving-validation',
 seed:714,world:'canyon',generatorVersion:CANYON_ROADLOCK_VERSION,
 contentFingerprint:'canyon-roadlock-grand-curves-v3-714',
 stageCode:'CUT-CANYON-EXTREME-02',tripCode:'CUT-CANYON-EXTREME-02',
 length:CANYON_ROADLOCK_LENGTH,baseHeight:120,baseLanes:4,
 roadWidth:4*LANE_WIDTH,
 beats:CANYON_ROADLOCK_MOMENTS.map(p=>({id:p.id,startS:p.startS,endS:p.endS,world:'canyon' as const,
  verticality:'rolling' as const,role:p.name})),
 buffers:[{startS:0,endS:30,role:'launch'},{startS:5590,endS:CANYON_ROADLOCK_LENGTH,role:'finish'}],
 worldPhases:[{startS:0,endS:CANYON_ROADLOCK_LENGTH,world:'canyon',beat:'Three heroic hairpins, broad canyon sweeps and two major S-turns'}],
 placements:[...CANYON_ROADLOCK_CURVES,...CANYON_ROADLOCK_ELEVATION].sort((a,b)=>a.startS-b.startS),
 bankFeatures:[...CANYON_ROADLOCK_BANK],
 canyonPrototype:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 designerCut:{...DESIGNER_CUT,visibleFrom:BRICK_START+320,
  riverLookAt:BRICK_START+2720,props:CANYON_ROADLOCK_PLACEHOLDERS},
 scenerySections:[{id:'roadlock-canyon',kind:'canyon',start:BRICK_START,
  end:BRICK_START+CANYON_ROADLOCK_LENGTH,left:'canyon',right:'canyon'}],
 nominalDuration:duration,entrySpeed:0,referenceSpeed:230,
 lanes:[[0,4],[duration,4]],elevation:[[0,120],[duration,140]],
 requiredSteerProfile:[[0,0]],
 entry:'One-way four lanes · carved cliff approach',exit:'One bold final canyon arc',
 warning:{leadMeters:300,text:'EXTREME CANYON · BRAKE FOR HAIRPINS'},
 tags:['designer-cut','grand-canyon','road-lock','four-lanes'],autoValidation:'PENDING',
};
