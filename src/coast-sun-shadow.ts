import * as THREE from 'three';
import {COAST_SUN,COAST_SHADOW_STRETCH} from './coast-dusk';

// Shared low-sun geometry for beach props, player, traffic, and road cones.
const away=new THREE.Vector3(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
export const COAST_SHADOW_YAW=Math.atan2(away.x,away.z);
export function coastShadowLength(height:number){
 return Math.min(76,Math.max(0,height)*Math.hypot(COAST_SUN.x,COAST_SUN.z)/
  Math.max(.02,COAST_SUN.y)*COAST_SHADOW_STRETCH);
}
export function coastShadowOffset(length:number){
 return away.clone().multiplyScalar(Math.max(0,length)*.32);
}

/** Black-alpha only: tinted transparent decals can brighten dark asphalt.
 * These decals must only darken the existing road, never glow blue/white. */
export function makeCoastShadowTexture(size=48){
 const pixels=new Uint8Array(size*size*4),mid=(size-1)/2;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(x-mid)/mid,dy=(y-mid)/mid;
  const r=Math.pow(dx*dx*1.4+dy*dy*.95,.7);
  const alpha=Math.pow(Math.max(0,1-Math.min(1,r)),1.45);
  pixels[(y*size+x)*4+3]=Math.round(230*alpha);
 }
 const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.needsUpdate=true;
 return texture;
}
export function makeCoastShadowMaterial(opacity=.75){
 return new THREE.MeshBasicMaterial({
  color:0x000000,map:makeCoastShadowTexture(),transparent:true,opacity,
  depthWrite:false,depthTest:true,toneMapped:false,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
 });
}
