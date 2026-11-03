import road from './terrain-first-road.json';
import {REFERENCE_TRAVEL} from './challenges';
import {BRICK_START} from './bricks';
import {DESIGNER_CANYON_STAGE} from './designer-canyon';
import type {TripCandidate} from './trip';

// Replaces the old Road Lock experiment. Geometry was fitted to the already
// authored Blender canyon; the original 5.65 km path is not used.
export const CANYON_ROADLOCK_VERSION='canyon-roadlock-v1';
export const CANYON_ROADLOCK_LENGTH=road.routeLength;
export interface RoadLockMoment {readonly id:string;readonly name:string;readonly startS:number;readonly endS:number;readonly role:'hero'|'challenge'}
export const CANYON_ROADLOCK_MOMENTS:readonly RoadLockMoment[]=[
 {id:'ENTRY',name:'Cut-rock entrance',startS:0,endS:500,role:'challenge'},
 {id:'H1',name:'Canyon Rim Reveal',startS:500,endS:1000,role:'hero'},
 {id:'BRIDGE',name:'Natural narrows crossing',startS:1000,endS:1600,role:'challenge'},
 {id:'H2',name:'Opposite Rim',startS:1600,endS:2450,role:'hero'},
 {id:'EXIT',name:'Downstream farewell',startS:2450,endS:road.routeLength,role:'challenge'},
];
const duration=road.routeLength/REFERENCE_TRAVEL;
export const CANYON_ROADLOCK_STAGE:TripCandidate={
 ...DESIGNER_CANYON_STAGE,revision:15,name:'Grand Canyon · Terrain First',
 intent:'An eroded river canyon first; a fixed four-lane road follows its ledges and natural narrows.',
 emotionalRole:'terrain-first-prototype',generatorVersion:CANYON_ROADLOCK_VERSION,
 contentFingerprint:'terrain-first-02',stageCode:'CANYON-TERRAIN-FIRST-01',tripCode:'CANYON-TERRAIN-FIRST-01',
 length:road.routeLength,baseHeight:road.frames[0][2],baseLanes:4,roadWidth:14,
 fixedRoad:road.frames,placements:[],bankFeatures:[],
 beats:CANYON_ROADLOCK_MOMENTS.map(p=>({id:p.id,startS:p.startS,endS:p.endS,world:'canyon',verticality:'rolling',role:p.name})),
 buffers:[{startS:0,endS:100,role:'launch'},{startS:road.routeLength-100,endS:road.routeLength,role:'finish'}],
 worldPhases:[{startS:0,endS:road.routeLength,world:'canyon',beat:'Confinement, rim, narrows bridge, opposite rim, open exit'}],
 canyonPrototype:undefined,designerCut:undefined,scenicCues:undefined,roadFeatures:undefined,scenicLandmarks:[],
 scenerySections:[{id:'terrain-first',kind:'canyon',start:BRICK_START,end:BRICK_START+road.routeLength,left:'canyon',right:'canyon'}],
 nominalDuration:duration,entrySpeed:180,referenceSpeed:230,lanes:[[0,4],[duration,4]],
 elevation:[[0,road.frames[0][2]],[duration,road.frames.at(-1)![2]]],requiredSteerProfile:[[0,0]],
 entry:'Rolling entry · natural canyon ledge',exit:'Downstream vista',
 warning:{leadMeters:200,text:'CANYON RIM · BRAKE FOR BENDS'},tags:['terrain-first','grand-canyon'],
};
