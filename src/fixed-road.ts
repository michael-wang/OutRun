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
 // A segment's constant grade used to jump at every 2.5m frame, feeding
 // discontinuous pitch to both car and chase camera despite steady FPS.
 // Shared knot derivatives keep this fixed road C1 without temporal smoothing.
 const mix=(i:number)=>{
  const left=frames[Math.max(0,lo-1)],right=frames[Math.min(frames.length-1,hi+1)];
  const m0=(b[i]-left[i])/(b[0]-left[0])*span,m1=(right[i]-a[i])/(right[0]-a[0])*span;
  return {value:(2*t*t*t-3*t*t+1)*a[i]+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b[i]+(t*t*t-t*t)*m1,
   derivative:((6*t*t-6*t)*a[i]+(3*t*t-4*t+1)*m0+(-6*t*t+6*t)*b[i]+(3*t*t-2*t)*m1)/span};
 };
 const x=mix(1),height=mix(2),z=mix(3),heading=mix(4),bank=mix(5);
 return {x:x.value,height:height.value,z:z.value,heading:heading.value,bank:bank.value,
  grade:height.derivative/Math.hypot(x.derivative,z.derivative),curvature:heading.derivative};
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
