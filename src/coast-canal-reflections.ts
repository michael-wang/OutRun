import * as THREE from 'three';
import {COAST_UTILITY_POLES,COAST_DRAIN_BRIDGES,coastDrainAt} from './coast-roadside-layout';

/** Shared coarse scene-reflection atlas for the narrow coast drain.
 * The ocean already supplies the expensive FFT normal/reflected sky.
 * One 16 KB RGBA lookup stores subdued silhouettes of the ACTUALLY
 * AUTHORED poles and concrete driveway bridges along the route. We sample
 * this only in water pixels and bend the lookup with ocean FFT slopes;
 * no reflection camera, depth target, geometric duplicates or extra draw.
 * This is a deliberate visual approximation, not screen-space SSR.
 */
export const COAST_CANAL_REFLECT_LENGTH=11200;
export const COAST_CANAL_REFLECT_TEXELS=4096;
export const COAST_POLE_LOOKUP_RADIUS=12;
export type CanalReflectionWeights={pole:number;bridge:number;poleOffset:number};

export function coastCanalReflectionsAt(d:number):CanalReflectionWeights{
 const site=coastDrainAt(d);
 if(!site||site.kind==='covered')return {pole:0,bridge:0,poleOffset:0};
 let poleOffset=COAST_POLE_LOOKUP_RADIUS,bridge=0;
 const texelMetres=COAST_CANAL_REFLECT_LENGTH/COAST_CANAL_REFLECT_TEXELS;
 // Store the fixture footprint. The shader projects a reflected ray to
 // the far bank; baking the stretch here would project the pole twice.
 for(const p of COAST_UTILITY_POLES){
  if(Math.abs(d-p.d)<Math.abs(poleOffset))poleOffset=d-p.d;
 }
 // The visible water pixel can lie outside a bridge while its reflected
 // ray hits the crossing. Store the slab footprint at the bank.
 for(const span of COAST_DRAIN_BRIDGES){
  const separation=Math.abs(d-span.d)-span.width*.5;
  bridge=Math.max(bridge,1-THREE.MathUtils.smoothstep(separation,-texelMetres*.5,texelMetres*.5));
 }
 return {pole:1-Math.abs(poleOffset)/COAST_POLE_LOOKUP_RADIUS,bridge,poleOffset};
}
export function buildCoastCanalReflectionTexture(){
 const data=new Uint8Array(COAST_CANAL_REFLECT_TEXELS*4);
 for(let i=0;i<COAST_CANAL_REFLECT_TEXELS;i++){
  const d=(i+.5)*COAST_CANAL_REFLECT_LENGTH/COAST_CANAL_REFLECT_TEXELS;
  const {pole,bridge,poleOffset}=coastCanalReflectionsAt(d);
  data[i*4]=Math.round(pole*255);
  data[i*4+1]=Math.round(bridge*255);
  // Linear filtering reconstructs the pole centre even between two texels.
  data[i*4+2]=Math.round((.5+.5*poleOffset/COAST_POLE_LOOKUP_RADIUS)*255);
  data[i*4+3]=255;
 }
 const texture=new THREE.DataTexture(data,COAST_CANAL_REFLECT_TEXELS,1,THREE.RGBAFormat);
 texture.name='coast-canal-authored-reflections';
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.generateMipmaps=false;
 texture.needsUpdate=true;
 return texture;
}
