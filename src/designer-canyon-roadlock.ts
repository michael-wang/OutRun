import road from './terrain-first-road.json';

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
