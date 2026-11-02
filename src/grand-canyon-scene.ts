import {BRICK_START} from './bricks';
import {pilotSample,pilotWeights,type PilotCandidate} from './pilot-composer';
import type {StageBeat} from './stage-one';

/** R2.0's single authored landscape template, chosen once per seed.
 * No landscape selection or earthwork is performed in the driving loop. */
export interface CanyonVista {
 readonly approachDistance:number;
 readonly revealDistance:number;
 readonly focusDistance:number;
 readonly riverInFrameSamples:number;
 readonly rimInFrameSamples:number;
 readonly riverScreenX:number;
 readonly riverScreenY:number;
 readonly rimScreenX:number;
 readonly rimScreenY:number;
 /** Frustum only; does not substitute for an occlusion or physical playtest. */
 readonly sightlineConfirmed:boolean;
}
export interface GrandCanyonScene {
 readonly id:'grand-canyon-river-bend';
 readonly title:'大峽谷河灣';
 readonly beat:string;
 /** Absolute track meters, as used by the road Worker and Scene Inspector. */
 readonly start:number;
 readonly end:number;
 readonly valleySide:-1;
 /** A fixed WORLD-Y datum: the river never climbs a hill with the road. */
 readonly riverY:number;
 readonly riverWidth:number;
 readonly seed:number;
 readonly vista?:CanyonVista;
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

/** Prefer a canyon sweeper away from transition boundaries, rather than
 * fabricating a bend or moving any accepted r10 road placement. */
export function planGrandCanyonScene(stage:PilotCandidate&{beats:readonly StageBeat[]}):GrandCanyonScene|undefined{
 const candidates=stage.beats.filter(b=>b.world==='canyon'&&b.endS-b.startS>=1450)
  .filter(b=>{
   const a=BRICK_START+b.startS+160,z=BRICK_START+b.endS-160;
   return [a,(a+z)/2,z].every(d=>pilotWeights(stage,d)[1]>.85);
  });
 const sorted=[...candidates].sort((a,b)=>{
  const score=(x:StageBeat)=>(x.role.includes('高速長彎')?0:x.role.includes('舒展')?1:2);
  return score(a)-score(b)||a.startS-b.startS;
 });
 const beat=sorted[0];
 if(!beat)return undefined;
 const span=Math.min(1480,beat.endS-beat.startS-200);
 const start=Math.round((BRICK_START+(beat.startS+beat.endS-span)/2)/20)*20;
 const end=start+span;
 let lowest=Infinity;
 for(let d=start;d<=end;d+=40)lowest=Math.min(lowest,pilotSample(stage,d).height);
 lowest=Math.min(lowest,pilotSample(stage,end).height);
 return Object.freeze({
  id:'grand-canyon-river-bend' as const,title:'大峽谷河灣' as const,
  beat:beat.id,start,end,valleySide:-1 as const,
  riverY:Math.round((lowest-50)*100)/100,riverWidth:20,seed:stage.seed,
 });
}
export function canyonSceneEnvelope(scene:GrandCanyonScene,d:number):number{
 if(d<=scene.start||d>=scene.end)return 0;
 return smooth(Math.min(1,(d-scene.start)/180))*smooth(Math.min(1,(scene.end-d)/180));
}
function altitude(knots:readonly (readonly [number,number])[],x:number){
 if(x<=knots[0][0])return knots[0][1];
 for(let j=1;j<knots.length;j++){
  if(x<=knots[j][0]){
   const [lo,a]=knots[j-1],[hi,b]=knots[j];
   return lerp(a,b,(x-lo)/(hi-lo));
  }
 }
 return knots.at(-1)![1];
}
/** One explicit, valley-wide world height datum shared by scenery anchors
 * and road terrain triangles. Only a 1.5km authored corridor is affected.
 * Both shores of the 20m river are below water, with sloping banks outside. */
export function canyonGroundY(scene:GrandCanyonScene,d:number,raw:number,
 roadY:number,ordinaryY:number):number{
 const blend=canyonSceneEnvelope(scene,d);
 if(blend===0||Math.abs(raw)<13)return ordinaryY;
 const x=Math.abs(raw),floor=scene.riverY;
 const valley=raw*scene.valleySide>0;
 const target=valley?altitude([
  [13,roadY-.1],[27,roadY-3],[45,roadY-12],
  [70,floor+22],[88,floor+7],[96,floor-2],
  [129,floor-2],[147,floor+6],[170,floor+13],
  [240,floor+45],[450,floor+76],
 ],x):altitude([
  [13,roadY-.1],[22,roadY+1],[38,roadY+14],[60,roadY+32],
  [90,roadY+43],[140,roadY+53],[240,roadY+69],[450,roadY+75],
 ],x);
 return lerp(ordinaryY,target,blend);
}
/** Gentle 6m meander: the river is anchored to its own elevation while the
 * centerline can follow the canyon's world-space horizontal path. */
export function canyonRiverRaw(scene:GrandCanyonScene,d:number){
 return scene.valleySide*(112+3*Math.sin((d-scene.start)/190+scene.seed*.47));
}
export const GRAND_CANYON_VALLEY_STRIPS=Object.freeze([
 -450,-330,-240,-170,-147,-129,-119,-109,-99,-88,-70,-55,-45,-27,
] as const);
export const GRAND_CANYON_RIDGE_STRIPS=Object.freeze([
 13,22,38,60,90,140,240,450,
] as const);
