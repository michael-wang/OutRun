import {REFERENCE_TRAVEL} from './challenges';
import {LANE_WIDTH} from './road-profile';
import type {Placement} from './pilot-composer';
import type {TripCandidate} from './trip';
import type {GrandCanyonScene} from './grand-canyon-scene';
import {BRICK_START} from './bricks';

/** Hand-authored design data, included in the Vite bundle at build time.
 * No seed, brick lottery, runtime composer or scenic-position search.
 * The existing Worker still triangulates this fixed specification. */
export const DESIGNER_CANYON_VERSION='designer-canyon-v1';
export const DESIGNER_CANYON_LENGTH=3200;
export type DesignedPropKind='terrace'|'cliff'|'rim'|'talus'|'scrub'|'rock-garden'|'lookout';
export interface DesignedProp {
 readonly kind:DesignedPropKind;
 /** Absolute meters, same coordinate system as a streaming road chunk. */
 readonly at:number;
 /** Signed road-lateral meters, outside the drivable strip. */
 readonly offset:number;
 readonly width:number;
 readonly height:number;
 readonly depth:number;
}
export interface DesignerCut {
 readonly id:'canyon-designer-cut-01';
 readonly name:'Grand Canyon · Designer’s Cut';
 readonly visibleFrom:number;
 readonly riverLookAt:number;
 readonly props:readonly DesignedProp[];
}
/** Explicit art direction: cliff walls are BANDS, not isolated rows of cones.
 * The first view is deliberately clean; monumental rocks frame the second. */
export const DESIGNER_CANYON_PROPS:readonly DesignedProp[]=Object.freeze([
 {kind:'talus',at:BRICK_START+270,offset:47,width:13,height:3,depth:11},
 {kind:'scrub',at:BRICK_START+390,offset:41,width:4,height:1.8,depth:4},
 {kind:'cliff',at:BRICK_START+440,offset:175,width:140,height:54,depth:175},
 {kind:'talus',at:BRICK_START+520,offset:46,width:19,height:4,depth:16},
 {kind:'cliff',at:BRICK_START+790,offset:146,width:165,height:64,depth:165},
 {kind:'rim',at:BRICK_START+860,offset:-265,width:155,height:38,depth:185},
 {kind:'scrub',at:BRICK_START+900,offset:50,width:3.5,height:1.5,depth:4},
 {kind:'terrace',at:BRICK_START+1110,offset:-300,width:210,height:33,depth:200},
 {kind:'talus',at:BRICK_START+1230,offset:43,width:17,height:3.7,depth:15},
 {kind:'lookout',at:BRICK_START+1370,offset:33,width:8,height:4,depth:10},
 {kind:'rim',at:BRICK_START+1480,offset:-250,width:205,height:47,depth:220},
 {kind:'cliff',at:BRICK_START+1600,offset:165,width:148,height:48,depth:175},
 {kind:'rock-garden',at:BRICK_START+1830,offset:66,width:26,height:5.5,depth:25},
 {kind:'rim',at:BRICK_START+1960,offset:-285,width:170,height:42,depth:205},
 {kind:'talus',at:BRICK_START+2160,offset:45,width:18,height:4.5,depth:16},
 {kind:'cliff',at:BRICK_START+2320,offset:170,width:175,height:55,depth:180},
 {kind:'scrub',at:BRICK_START+2470,offset:42,width:3.5,height:1.8,depth:4},
 {kind:'terrace',at:BRICK_START+2650,offset:-255,width:200,height:37,depth:185},
 {kind:'rock-garden',at:BRICK_START+2820,offset:70,width:23,height:5,depth:25},
].map(Object.freeze));

export const DESIGNER_CUT:DesignerCut=Object.freeze({
 id:'canyon-designer-cut-01',name:'Grand Canyon · Designer’s Cut',
 visibleFrom:BRICK_START+680,riverLookAt:BRICK_START+1390,
 props:DESIGNER_CANYON_PROPS,
});

const BEATS:TripCandidate['beats']=[
 {id:'CUT-01',startS:0,endS:560,world:'canyon',verticality:'gentle',role:'Intro · rock corridor'},
 {id:'CUT-02',startS:560,endS:1300,world:'canyon',verticality:'rolling',role:'Left arc · first canyon reveal'},
 {id:'CUT-03',startS:1300,endS:1910,world:'canyon',verticality:'rolling',role:'Canyon river overlook'},
 {id:'CUT-04',startS:1910,endS:2680,world:'canyon',verticality:'gentle',role:'Return to layered cliffs'},
 {id:'CUT-05',startS:2680,endS:3200,world:'canyon',verticality:'gentle',role:'Open-road farewell'},
];
const CURVES:Placement[]=[
 {channel:'curvature',id:'C02',startS:280,endS:900,parameters:{effort:.30,direction:1,start:0,end:1,secondary:.7},transition:'smooth',beat:'CUT-01'},
 {channel:'curvature',id:'C02',startS:1010,endS:1590,parameters:{effort:.39,direction:1,start:0,end:1,secondary:.7},transition:'smooth',beat:'CUT-02'},
 {channel:'curvature',id:'C02',startS:1720,endS:2290,parameters:{effort:.35,direction:-1,start:0,end:1,secondary:.7},transition:'smooth',beat:'CUT-03'},
 {channel:'curvature',id:'C02',startS:2400,endS:2870,parameters:{effort:.32,direction:-1,start:0,end:1,secondary:.7},transition:'smooth',beat:'CUT-04'},
];
const ELEVATION:Placement[]=[
 {channel:'elevation',id:'E05',startS:400,endS:1510,parameters:{base:120,amplitude:18,direction:1,shelfStart:.36,shelfEnd:.63},transition:'smooth',beat:'CUT-02'},
 {channel:'elevation',id:'E03',startS:1660,endS:2630,parameters:{base:120,amplitude:13,direction:1,shelfStart:.32,shelfEnd:.68},transition:'smooth',beat:'CUT-04'},
];
/** Fixed valley, fixed river elevation above the old global ocean.
 * The river and rock layers belong to this one authored composition. */
export const DESIGNER_CANYON_LANDSCAPE:GrandCanyonScene=Object.freeze({
 id:'grand-canyon-river-bend',title:'大峽谷 · 手工導演版',
 beat:'CUT-02',start:BRICK_START+250,end:BRICK_START+2960,
 valleySide:-1,riverY:56,riverWidth:24,seed:714,
 authored:true,
});
/** A static object, produced by source authoring and bundled with the game.
 * Unlike generateTrip(), opening this route never invokes a runtime composer. */
export const DESIGNER_CANYON_STAGE:TripCandidate={
 id:'ROAD-TRIP-10M',revision:13,
 name:'Grand Canyon · Designer’s Cut',
 intent:'A hand-composed left canyon reveal, river overlook and sandstone return.',
 emotionalRole:'hand-authored-showcase',sceneryAct:1,
 seed:714,world:'canyon',generatorVersion:DESIGNER_CANYON_VERSION,
 contentFingerprint:'designer-canyon-v1-714',
 stageCode:'CUT-CANYON-01',tripCode:'CUT-CANYON-01',
 beats:BEATS,buffers:[{startS:0,endS:250,role:'launch'},{startS:2960,endS:DESIGNER_CANYON_LENGTH,role:'finish'}],
 baseHeight:120,baseLanes:4,
 length:DESIGNER_CANYON_LENGTH,
 placements:[...CURVES,...ELEVATION].sort((a,b)=>a.startS-b.startS),
 worldPhases:[{startS:0,endS:DESIGNER_CANYON_LENGTH,world:'canyon',beat:'Designed canyon route'}],
 scenerySections:Object.freeze([{id:'CUT-CANYON-SECTION',kind:'canyon',start:BRICK_START,end:BRICK_START+DESIGNER_CANYON_LENGTH,left:'canyon',right:'canyon'}]),
 scenicLandmarks:[],canyonPrototype:DESIGNER_CANYON_LANDSCAPE,
 designerCut:DESIGNER_CUT,
 referenceSpeed:230,entrySpeed:0,nominalDuration:DESIGNER_CANYON_LENGTH/REFERENCE_TRAVEL,
 roadWidth:4*LANE_WIDTH,lanes:[[0,4],[DESIGNER_CANYON_LENGTH/REFERENCE_TRAVEL,4]],
 elevation:[[0,120],[DESIGNER_CANYON_LENGTH/REFERENCE_TRAVEL,120]],requiredSteerProfile:[[0,0]],
 entry:'Grand Canyon · starting overlook',exit:'Return to the open road',
 warning:{leadMeters:260,text:'LEFT CURVE · CANYON OVERLOOK'},tags:['designer-cut','grand-canyon'],
 antiAdjacency:[],autoValidation:'PENDING',
};
