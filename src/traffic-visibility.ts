import * as THREE from 'three';
import {roadHidesVehicle} from './traffic-outline';

/** A car must enter the bounded pool *before* the world camera can see it.
 * Coast fog ends at ~1450m while the mobile chase camera clips at 1400m;
 * the former 850m pool horizon was inside both. No extra draw families.
 */
export const TRAFFIC_REVEAL_BUFFER=240;
export function trafficPopulationAhead(camera?:THREE.PerspectiveCamera,fog?:THREE.Fog|THREE.FogExp2|null){
 if(!camera)return 850; // headless tests and legacy camera-free callers
 const fogFar=fog instanceof THREE.Fog?fog.far:camera.far;
 return Math.min(2700,Math.max(850,Math.min(camera.far,fogFar)+TRAFFIC_REVEAL_BUFFER));
}

type RoadSample=(distance:number)=>{position:THREE.Vector3;right:THREE.Vector3};

/** Only called when an actor would first appear; it must already be offscreen,
 * fully inside the distance fog, or completely behind a road crest.
 * Buildings are *not* assumed opaque: without a depth query, rejecting an
 * entrant seen in the viewport is safer than guessing its occlusion.
 * Already-visible actors do not use this test, preserving continuity.
 */
export function trafficRevealIsHidden(
 camera:THREE.PerspectiveCamera,
 sample:RoadSample,
 halfAt:(distance:number)=>number,
 player:number,
 distance:number,lateral:number,
 width:number,length:number,height:number,
 fog?:THREE.Fog|THREE.FogExp2|null,
){
 camera.updateMatrixWorld();
 const road=sample(distance);
 const foot=road.position.clone().addScaledVector(road.right,lateral);
 const center=foot.clone().add(new THREE.Vector3(0,height*.5,0));
 const distanceFromEye=center.distanceTo(camera.position);
 const local=camera.worldToLocal(center);
 const depth=-local.z;
 const radius=Math.hypot(width,height,length)*.5+.5;
 if(depth+radius<camera.near||depth-radius>camera.far)return true;
 // StandardMaterial models and *also* their highlight rims now use scene fog.
 // An actor beyond full linear haze is imperceptible before entering the shot.
 if(fog instanceof THREE.Fog&&distanceFromEye>fog.far+radius)return true;
 const vert=Math.max(.01,depth)*Math.tan(THREE.MathUtils.degToRad(camera.fov)*.5);
 const horiz=vert*camera.aspect;
 // Slightly overscan the viewport: a bus corner crossing the edge of the
 // display is still visible, even if its center is outside the screen.
 if(Math.abs(local.x)>horiz+radius||Math.abs(local.y)>vert+radius)return true;
 if(distance<=player+20)return false; // camera is looking directly at the car
 const roof=foot.clone().add(new THREE.Vector3(0,height+.35,0));
 // Test the *roof*, not just the wheels: allow spawn only when the entire
 // silhouette is hidden by the road crest. A low-body test could pop roofs.
 return roadHidesVehicle(sample,halfAt,player,distance,camera.position,roof,28,Math.min(1800,camera.far));
}
