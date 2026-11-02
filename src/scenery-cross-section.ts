import {BRICK_START} from './bricks';
import type {StageBeat} from './stage-one';

export type ScenerySectionKind=
 'coastal-left'|'canyon'|'urban-both'|'urban-hillside'|'waterfront-left'|'waterfront-right';
export type ScenerySide='sea'|'city'|'hillside'|'canyon'|'coastal-land';
export interface ScenerySection {
 readonly id:string;
 readonly kind:ScenerySectionKind;
 readonly start:number;
 readonly end:number;
 readonly left:ScenerySide;
 readonly right:ScenerySide;
}
export interface SceneryGroundMix {readonly leftLand:number;readonly rightSea:number}
export const SECTION_LABELS:Readonly<Record<ScenerySectionKind,string>>={
 'coastal-left':'左海右岸','canyon':'雙側峽谷',
 'urban-both':'雙側城市街廓','urban-hillside':'山坡住宅街區',
 'waterfront-left':'左側海濱大道','waterfront-right':'右側海濱大道',
};
export const SIDE_LABELS:Readonly<Record<ScenerySide,string>>={
 sea:'海岸／海面',city:'城市街區',hillside:'山坡住宅',canyon:'山區地形','coastal-land':'沿岸陸地',
};
const cityKinds=['urban-both','urban-both','waterfront-left','urban-both',
 'urban-hillside','waterfront-right'] as const;
const sides:Record<ScenerySectionKind,readonly [ScenerySide,ScenerySide]>={
 'coastal-left':['sea','coastal-land'],
 'canyon':['canyon','canyon'],
 'urban-both':['city','city'],
 'urban-hillside':['hillside','city'],
 'waterfront-left':['sea','city'],
 'waterfront-right':['city','sea'],
};
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Keep outer terrain outside tight hairpins. A full 450m urban/canyon
 * shelf is suitable for straights, but would overlap nearby switchbacks. */
export function sceneryFarReach(curvature:number){
 const k=Math.abs(Number.isFinite(curvature)?curvature:.003);
 return 160+290*Math.max(0,Math.min(1,(.003-k)/.0018));
}
/** Beat-scoped environment roles. Nothing changes the driven geometry or
 * route/world boundaries. A fixed city sequence guarantees genuinely
 * enclosed stretches without removing scenic waterfront exceptions. */
export function planScenerySections(beats:readonly StageBeat[]):readonly ScenerySection[]{
 let cityIndex=0;
 return Object.freeze(beats.map(beat=>{
  const kind:ScenerySectionKind=beat.world==='city'?cityKinds[cityIndex++%cityKinds.length]:
   beat.world==='canyon'?'canyon':'coastal-left';
  const [left,right]=sides[kind];
  return Object.freeze({id:'section-'+beat.id,kind,start:BRICK_START+beat.startS,
   end:BRICK_START+beat.endS,left,right});
 }));
}
function indexAt(sections:readonly ScenerySection[],distance:number){
 let lo=0,hi=sections.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(sections[mid].start<=distance)lo=mid+1;else hi=mid;}
 return Math.max(0,lo-1);
}
/** QA label: a section name describes the dominant role, not blend details. */
export function scenerySectionAt(sections:readonly ScenerySection[],distance:number){
 return sections.length?sections[indexAt(sections,distance)]:undefined;
}
function vector(section:ScenerySection):SceneryGroundMix{
 return {leftLand:section.left==='city'||section.left==='hillside'?1:0,
  rightSea:section.right==='sea'?1:0};
}
/** Smooth absolute-distance transitions shared by meshes and prop anchors.
 * Uses only the two adjacent preplanned sections and no per-frame work. */
export function sceneryGroundMixAt(sections:readonly ScenerySection[],distance:number):SceneryGroundMix{
 if(!sections.length)return {leftLand:0,rightSea:0};
 const i=indexAt(sections,distance),current=vector(sections[i]),radius=180;
 const boundary=(a:SceneryGroundMix,b:SceneryGroundMix,start:number)=>{
  const blend=smooth((distance-(start-radius))/(radius*2));
  return {leftLand:lerp(a.leftLand,b.leftLand,blend),rightSea:lerp(a.rightSea,b.rightSea,blend)};
 };
 if(i>0&&distance<sections[i].start+radius)return boundary(vector(sections[i-1]),current,sections[i].start);
 if(i+1<sections.length&&distance>sections[i+1].start-radius)
  return boundary(current,vector(sections[i+1]),sections[i+1].start);
 return current;
}
/** One consistent terrain elevation for Worker meshes AND instanced buildings.
 * raw = legacy road-relative offset; physical converts it through the current
 * variable-width shoulders. The original coastal/canyon height is retained
 * when both mix values are zero. The inner road/shoulder remains untouched. */
export function sceneryGroundY(
 raw:number,roadY:number,rightY:number,physical:(offset:number)=>number,
 canyonWeight:number,mix:SceneryGroundMix,
):number{
 const projected=(offset:number)=>roadY+rightY*physical(offset);
 if(raw<=-27){
  const coastal=lerp(-5.05,projected(raw)-2-Math.abs(raw)*.015,canyonWeight);
  const urban=projected(raw)-2-Math.max(0,-raw-27)*.05;
  return lerp(coastal,urban,mix.leftLand);
 }
 if(raw< -13){
  const near=projected(-13)-.1;
  const far=sceneryGroundY(-27,roadY,rightY,physical,canyonWeight,mix);
  return lerp(near,far,(-raw-13)/14);
 }
 if(raw<=13)return projected(raw)-.1;
 const land=raw<=75?projected(raw)-(.12+(raw-13)*2.88/62):
  projected(raw)-3-(raw-75)*11/85;
 if(!mix.rightSea)return land;
 const seaside=raw<=75?lerp(projected(13)-.12,-5.05,(raw-13)/62):-5.05;
 return lerp(land,seaside,mix.rightSea);
}
