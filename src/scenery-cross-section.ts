import {coastProfileX} from './coast-layout';
import {coastHillHeight} from './coast-terrain';
import {coastRuralCreekCut} from './coast-rural-layout';
import {coastDrainDepth} from './coast-roadside-layout';
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
 /** R1.1 urban plateau and street-wall policy; absent in archived r9. */
 readonly urbanCore?:boolean;
}
export interface SceneryGroundMix {readonly leftLand:number;readonly rightSea:number;readonly urban?:number}
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
/** R1.1: coast is still the place to see the sea. City beats, including
 * city/sea transitions, are enclosed on BOTH sides. A rare hillside section
 * changes the architecture, not the existence of the opposite street wall.
 * r9 planScenerySections() intentionally stays unchanged for exact replay. */
export function planUrbanEnclosureSections(beats:readonly StageBeat[]):readonly ScenerySection[]{
 let cityIndex=0;
 return Object.freeze(planScenerySections(beats).map(section=>{
  if(section.kind==='coastal-left'||section.kind==='canyon')return section;
  const kind:ScenerySectionKind=cityIndex++%6===3?'urban-hillside':'urban-both';
  const [left,right]=sides[kind];
  return Object.freeze({...section,kind,left,right,urbanCore:true});
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
  rightSea:section.right==='sea'?1:0,urban:section.urbanCore?1:0};
}
/** Smooth absolute-distance transitions shared by meshes and prop anchors.
 * Uses only the two adjacent preplanned sections and no per-frame work. */
export function sceneryGroundMixAt(sections:readonly ScenerySection[],distance:number):SceneryGroundMix{
 if(!sections.length)return {leftLand:0,rightSea:0};
 const i=indexAt(sections,distance),current=vector(sections[i]),radius=180;
 const boundary=(a:SceneryGroundMix,b:SceneryGroundMix,start:number)=>{
  const blend=smooth((distance-(start-radius))/(radius*2));
  return {leftLand:lerp(a.leftLand,b.leftLand,blend),rightSea:lerp(a.rightSea,b.rightSea,blend),urban:lerp(a.urban??0,b.urban??0,blend)};
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
export const COAST_SEA_LEVEL=-5;
export const COAST_SHORE_OFFSET=-26;
/** Physical metres, shared by the beach mesh and the ocean's shore mask.
 * Keep a dry shoulder, a sloping wet-sand band and a submerged sand bottom.
 * Do not extend road banking indefinitely across inland terrain. */
export function coastBeachHeight(x:number,roadY:number,rightY:number,distance?:number):number{
 if(distance!==undefined)x=coastProfileX(x,distance);
 const dry=roadY+rightY*-11-.2;
 if(x<=-100)return COAST_SEA_LEVEL-15;
 if(x<-46)return lerp(COAST_SEA_LEVEL-15,COAST_SEA_LEVEL-3,(x+100)/54);
 if(x<COAST_SHORE_OFFSET)return lerp(COAST_SEA_LEVEL-3,COAST_SEA_LEVEL,(x+46)/20);
 if(x<-18)return lerp(COAST_SEA_LEVEL,COAST_SEA_LEVEL+.8,(x+26)/8);
 if(x<-11)return lerp(COAST_SEA_LEVEL+.8,dry,(x+18)/7);
 if(x<-7)return lerp(dry,roadY+rightY*-7-.1,(x+11)/4);
 if(x<=13)return roadY+rightY*x-.1;
 return roadY+rightY*13-.1+(x-13)*.008+(distance===undefined?0:coastHillHeight(x,distance)-coastRuralCreekCut(x,distance)-coastDrainDepth(x,distance));
}
/** Shared by the coastal trial's Worker meshes and prop anchors only. */
export function coastUltraGroundY(
 raw:number,roadY:number,rightY:number,physical:(offset:number)=>number,distance?:number,
):number{
 return coastBeachHeight(physical(raw),roadY,rightY,distance);
}

export function sceneryGroundY(
 raw:number,roadY:number,rightY:number,physical:(offset:number)=>number,
 canyonWeight:number,mix:SceneryGroundMix,
):number{
 const projected=(offset:number)=>roadY+rightY*physical(offset);
 if(raw<=-27){
  const coastal=lerp(-5.05,projected(raw)-2-Math.abs(raw)*.015,canyonWeight);
  const urban=projected(raw)-2-Math.max(0,-raw-27)*.05;
  const historic=lerp(coastal,urban,mix.leftLand);
  // Wide city hills made distant blocks appear like detached islands.
  // R1.1 keeps urban land near the actual low-grade city road frame.
  const cityShelf=projected(raw)-1.5-Math.max(0,-raw-27)*.012;
  return lerp(historic,cityShelf,mix.urban??0);
 }
 if(raw< -13){
  const near=projected(-13)-.1;
  const far=sceneryGroundY(-27,roadY,rightY,physical,canyonWeight,mix);
  return lerp(near,far,(-raw-13)/14);
 }
 if(raw<=13)return projected(raw)-.1;
 const land=raw<=75?projected(raw)-(.12+(raw-13)*2.88/62):
  projected(raw)-3-(raw-75)*11/85;
 if(!mix.rightSea&&!(mix.urban??0))return land;
 const seaside=raw<=75?lerp(projected(13)-.12,-5.05,(raw-13)/62):-5.05;
 const historic=lerp(land,seaside,mix.rightSea);
 const cityShelf=projected(raw)-.12-Math.max(0,raw-13)*.012;
 return lerp(historic,cityShelf,mix.urban??0);
}
