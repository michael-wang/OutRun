import {ROAD_START as BRICK_START} from './road-profile';
import type {GrandCanyonScene} from './grand-canyon-scene';

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
]);

export const DESIGNER_CUT:DesignerCut=Object.freeze({
 id:'canyon-designer-cut-01',name:'Grand Canyon · Designer’s Cut',
 visibleFrom:BRICK_START+680,riverLookAt:BRICK_START+1390,
 props:DESIGNER_CANYON_PROPS,
});

/** Fixed valley, fixed river elevation above the old global ocean.
 * The river and rock layers belong to this one authored composition. */
export const DESIGNER_CANYON_LANDSCAPE:GrandCanyonScene=Object.freeze({
 id:'grand-canyon-river-bend',title:'大峽谷 · 手工導演版',
 beat:'CUT-02',start:BRICK_START+250,end:BRICK_START+2960,
 valleySide:-1,riverY:56,riverWidth:24,seed:714,
 authored:true,
});
