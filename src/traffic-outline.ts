import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A roughly one-pixel silhouette at Pixel 8 rendering resolution. No post-processing pass.
export const TRAFFIC_OUTLINE = Object.freeze({
 pixels:1.25,
 // Gameplay distance along the road: near traffic should keep its natural silhouette.
 nearCutoffMeters:90,
 fullStrengthMeters:160,
 minimumMeters:.035,
 maximumMeters:.65,
 crestNear:20,
 crestFar:300,
 crestStep:18,
 crestRefreshSeconds:.12,
});
const HEIGHTS=[1.65,2.95,2.9,3.1] as const;
export function trafficOutlineHeight(type:number){return HEIGHTS[type]??HEIGHTS[0];}

/** A small *solid silhouette*, not the windows, wheels or lamps of the detailed vehicle. */
export function trafficOutlineGeometry(type:number):THREE.BufferGeometry{
 const boxes:THREE.BoxGeometry[]=[];
 const add=(w:number,h:number,l:number,x:number,y:number,z:number)=>{
  const geometry=new THREE.BoxGeometry(w,h,l);geometry.translate(x,y,z);boxes.push(geometry);
 };
 if(type===0){add(1.8,.65,4.4,0,.73,0);add(1.55,.65,2.25,0,1.32,-.2);}
 else if(type===1)add(2.35,2.5,8.6,0,1.65,0);
 else if(type===2){add(2.3,2.35,4.8,0,1.72,-1.25);add(2.25,1.9,2.5,0,1.48,2.4);}
 else {add(2.1,.8,5.2,0,.85,0);add(1.95,1.45,1.7,0,1.6,1.65);add(2.3,.22,3.35,0,2.95,-.9);}
 const merged=mergeGeometries(boxes);boxes.forEach(b=>b.dispose());
 if(!merged)throw new Error('Traffic outline hull could not be merged');
 return merged;
}

/** Expanding a back-face-only hull in world units gives an approximately fixed screen-pixel rim. */
/** Only far-ahead traffic is highlighted; the rim gently shrinks away on approach. */
export function trafficOutlineStrength(distanceAhead:number){
 const span=TRAFFIC_OUTLINE.fullStrengthMeters-TRAFFIC_OUTLINE.nearCutoffMeters;
 const t=THREE.MathUtils.clamp((distanceAhead-TRAFFIC_OUTLINE.nearCutoffMeters)/span,0,1);
 return t*t*(3-2*t);
}

export function trafficOutlineRadius(distance:number,fovDegrees:number,viewportHeight:number){
 const unitsPerPixel=2*Math.tan(fovDegrees*Math.PI/360)*Math.max(1,distance)/Math.max(1,viewportHeight);
 return THREE.MathUtils.clamp(unitsPerPixel*TRAFFIC_OUTLINE.pixels,TRAFFIC_OUTLINE.minimumMeters,TRAFFIC_OUTLINE.maximumMeters);
}

type RoadSlice={position:THREE.Vector3;right:THREE.Vector3};
/** Cheap terrain-only crest check. The depth buffer decides which hint segments are *actually* hidden. */
export function roadHidesVehicle(
 sample:(distance:number)=>RoadSlice,halfAt:(distance:number)=>number,player:number,vehicle:number,
 eye:THREE.Vector3,aim:THREE.Vector3,
):boolean{
 const ahead=vehicle-player;
 if(ahead<TRAFFIC_OUTLINE.crestNear||ahead>TRAFFIC_OUTLINE.crestFar)return false;
 const dx=aim.x-eye.x,dz=aim.z-eye.z,segmentSquared=dx*dx+dz*dz;
 if(segmentSquared<9)return false;
 for(let d=player+TRAFFIC_OUTLINE.crestStep;d<vehicle-9;d+=TRAFFIC_OUTLINE.crestStep){
  const road=sample(d),rx=road.position.x-eye.x,rz=road.position.z-eye.z;
  const t=(rx*dx+rz*dz)/segmentSquared;
  if(t<=.04||t>=.98)continue;
  const lineX=eye.x+dx*t,lineZ=eye.z+dz*t;
  const horizontalRight=road.right.x*road.right.x+road.right.z*road.right.z;
  if(horizontalRight<.5)continue;
  const lateral=((lineX-road.position.x)*road.right.x+(lineZ-road.position.z)*road.right.z)/horizontalRight;
  if(Math.abs(lateral)>halfAt(d)+.75)continue;
  // Ignore a road centerline that happens to be near the ray's projection but not beneath it.
  if(Math.hypot(road.position.x+road.right.x*lateral-lineX,road.position.z+road.right.z*lateral-lineZ)>15)continue;
  const roadHeight=road.position.y+road.right.y*lateral;
  if(roadHeight>eye.y+(aim.y-eye.y)*t+.25)return true;
 }
 return false;
}
