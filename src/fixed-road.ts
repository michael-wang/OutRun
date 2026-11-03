import * as THREE from 'three';
import {CHALLENGES,REFERENCE_TRAVEL} from './challenges';

/** Baked artist-authored road frames: distance, X, Y, Z, heading, bank radians.
 * Only interpolation happens at runtime. Terrain is a separate static GLB.
 */
export type FixedRoadFrame=readonly number[];
export function fixedRoadPose(frames:readonly FixedRoadFrame[],distance:number){
 const d=Math.max(frames[0][0],Math.min(frames.at(-1)![0],distance));
 let lo=0,hi=frames.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>>1;if(frames[mid][0]<=d)lo=mid;else hi=mid;}
 const a=frames[lo],b=frames[hi],span=b[0]-a[0],t=(d-a[0])/span;
 const mix=(i:number)=>a[i]+(b[i]-a[i])*t;
 return {x:mix(1),height:mix(2),z:mix(3),heading:mix(4),bank:mix(5),grade:(b[2]-a[2])/span,curvature:(b[4]-a[4])/span};
}
export function createFixedRoad(frames:readonly FixedRoadFrame[],name:string){
 const length=frames.at(-1)![0];
 return {length,closureError:0,headingError:0,referenceTravel:REFERENCE_TRAVEL,sample:(distance:number)=>{
  const p=fixedRoadPose(frames,distance),h=p.heading;
  return {position:new THREE.Vector3(p.x,p.height,p.z),tangent:new THREE.Vector3(-Math.sin(h),p.grade,Math.cos(h)).normalize(),
   right:new THREE.Vector3(-Math.cos(h),-Math.tan(p.bank),-Math.sin(h)),curvature:p.curvature,roadHeading:h,
   challenge:{...CHALLENGES[0],id:'terrain-first',label:name,start:0,end:length,length,offset:distance,nominalDurationAtReferenceSpeed:length/REFERENCE_TRAVEL,transitionLength:0}};
 }};
}
