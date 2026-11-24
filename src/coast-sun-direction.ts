import * as THREE from 'three';
import {COAST_EFFECTS} from './content/coast-effects';

const acceptedSun=new THREE.Vector3(...COAST_EFFECTS.lighting.sunDirection).normalize();
/** One world-space sun per loaded layout, shared by sky, water and lighting.
 * Configure before scene/Worker geometry is built; never track the camera or car. */
export const COAST_SUN=acceptedSun.clone();
export const COAST_SHADOW_AWAY=new THREE.Vector3(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
export const COAST_SHADOW_ACROSS=new THREE.Vector3(-COAST_SHADOW_AWAY.z,0,COAST_SHADOW_AWAY.x);
export let COAST_SHADOW_YAW=Math.atan2(COAST_SHADOW_AWAY.x,COAST_SHADOW_AWAY.z);
export function configureCoastSun(variant:unknown,side:unknown=null){
 COAST_SUN.copy(acceptedSun);
 if(variant==='right'){
  // Keep the accepted elevation/radiance. Baseline favors chase framing;
  // the sideward comparisons can move the disc outside chase FOV.
  const azimuth=(side==='left'?-10:side==='wide'?0:-30)*Math.PI/180,horizontal=Math.hypot(COAST_SUN.x,COAST_SUN.z);
  COAST_SUN.set(Math.sin(azimuth)*horizontal,COAST_SUN.y,Math.cos(azimuth)*horizontal);
 }
 COAST_SHADOW_AWAY.set(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
 COAST_SHADOW_ACROSS.set(-COAST_SHADOW_AWAY.z,0,COAST_SHADOW_AWAY.x);
 COAST_SHADOW_YAW=Math.atan2(COAST_SHADOW_AWAY.x,COAST_SHADOW_AWAY.z);
}
export const coastShadowYaw=()=>Math.atan2(COAST_SHADOW_AWAY.x,COAST_SHADOW_AWAY.z);
