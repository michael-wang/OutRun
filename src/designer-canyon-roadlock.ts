import road from './terrain-first-road.json';
import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {DESIGNER_CANYON_STAGE} from './designer-canyon';
import type {TripCandidate} from './trip';

// Replaces the old Road Lock experiment. Geometry was fitted to the already
// authored Blender canyon; the original 5.65 km path is not used.
export const CANYON_ROADLOCK_VERSION='canyon-roadlock-v1';
export const CANYON_ROADLOCK_LENGTH=road.routeLength;
export const CANYON_SCENIC_ZONES=road.scenicZones;
export interface RoadLockMoment {readonly id:string;readonly name:string;readonly startS:number;readonly endS:number;readonly role:'hero'|'challenge'}
export const CANYON_ROADLOCK_MOMENTS:readonly RoadLockMoment[]=[
 {id:'ENTRY',name:'Long-grade rim approach',startS:0,endS:1460,role:'challenge'},
 {id:'H1',name:'Basin drift reveal',startS:1460,endS:1740,role:'hero'},
 {id:'NARROWS',name:'Same-bank narrows sweep',startS:1740,endS:2080,role:'challenge'},
 {id:'H2',name:'Downstream drift reveal',startS:2080,endS:2380,role:'hero'},
 {id:'EXIT',name:'Rim farewell',startS:2380,endS:road.routeLength,role:'challenge'},
];
const duration=road.routeLength/REFERENCE_TRAVEL;
export const CANYON_ROADLOCK_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,revision:18,name:'Grand Canyon · River Reveal R3',
 intent:'Long gentle grades and two right-side reveals triggered by actual drifting in the authored bends.',
 emotionalRole:'rim-pass-prototype',generatorVersion:CANYON_ROADLOCK_VERSION,
 contentFingerprint:'canyon-river-reveal-r3-01',stageCode:'CANYON-RIVER-REVEAL-R3',tripCode:'CANYON-RIVER-REVEAL-R3',
 length:road.routeLength,baseHeight:road.frames[0][2],baseLanes:4,roadWidth:14,
 fixedRoad:road.frames,placements:[],bankFeatures:[],
 beats:CANYON_ROADLOCK_MOMENTS.map(p=>({id:p.id,startS:p.startS,endS:p.endS,world:'canyon',verticality:'rolling',role:p.name})),
 buffers:[{startS:0,endS:100,role:'launch'},{startS:road.routeLength-100,endS:road.routeLength,role:'finish'}],
 worldPhases:[{startS:0,endS:road.routeLength,world:'canyon',beat:'Upper rim, basin overlook, same-bank narrows, downstream cliff cut'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 scenerySections:[{id:'terrain-first',kind:'canyon',start:BRICK_START,end:BRICK_START+road.routeLength,left:'canyon',right:'canyon'}],
 nominalDuration:duration,entrySpeed:180,referenceSpeed:230,lanes:[[0,4],[duration,4]],
 elevation:[[0,road.frames[0][2]],[duration,road.frames.at(-1)![2]]],requiredSteerProfile:[[0,0]],
 entry:'Rolling entry · natural canyon ledge',exit:'Downstream vista',
 warning:{leadMeters:200,text:'CANYON RIM · BRAKE FOR BENDS'},tags:['terrain-first','grand-canyon'],
};
