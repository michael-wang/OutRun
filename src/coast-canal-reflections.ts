import * as THREE from 'three';
import {COAST_UTILITY_POLES,COAST_DRAIN_BRIDGES,coastDrainAt,coastDrainCovered} from './coast-roadside-layout';

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
export type CanalReflectionWeights={pole:number;bridge:number};

export function coastCanalReflectionsAt(d:number):CanalReflectionWeights{
 const site=coastDrainAt(d);
 if(!site||site.kind==='covered'||coastDrainCovered(d))return {pole:0,bridge:0};
 let pole=0,bridge=0;
 // A height-weighted, slightly swept vertical reflection, blurred by
 // irregular FFT ripple normals in the fragment shader.
 for(const p of COAST_UTILITY_POLES){
  const distance=Math.abs(d-(p.d-3.0));
  if(distance<19){
   const envelope=Math.max(0,1-distance/(p.height*1.55));
   pole=Math.max(pole,envelope*envelope);
  }
 }
 // The water is physically hidden under a crossing. Draw only the soft
 // shadow/reflection in adjacent OPEN segments, not a square under the lid.
 for(const span of COAST_DRAIN_BRIDGES){
  const separation=Math.abs(d-span.d)-span.width*.5;
  if(separation>=0&&separation<8.5){
   const envelope=Math.max(0,1-separation/8.5);
   bridge=Math.max(bridge,envelope*envelope);
  }
 }
 return {pole,bridge};
}
export function buildCoastCanalReflectionTexture(){
 const data=new Uint8Array(COAST_CANAL_REFLECT_TEXELS*4);
 for(let i=0;i<COAST_CANAL_REFLECT_TEXELS;i++){
  const d=(i+.5)*COAST_CANAL_REFLECT_LENGTH/COAST_CANAL_REFLECT_TEXELS;
  const {pole,bridge}=coastCanalReflectionsAt(d);
  data[i*4]=Math.round(pole*255);
  data[i*4+1]=Math.round(bridge*255);
  data[i*4+2]=0;data[i*4+3]=255;
 }
 const texture=new THREE.DataTexture(data,COAST_CANAL_REFLECT_TEXELS,1,THREE.RGBAFormat);
 texture.name='coast-canal-authored-reflections';
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.generateMipmaps=false;
 texture.needsUpdate=true;
 return texture;
}
