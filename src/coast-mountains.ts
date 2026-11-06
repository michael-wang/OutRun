import * as THREE from 'three';
import {fbm2,ridged2,smoothstep} from './vendor/procedural-terrains/cpuNoise.js';
import {COAST_SUN} from './coast-dusk';
import type {createTrack} from './track';

/** Fixed, tiny mesh budget: two terrain sheets, with light and haze baked once.
 * They live past the camera's normal far plane, behind the playable landscape.
 * The coastal road, water, and shadow passes do not depend on these mountains.
 */
export const COAST_MOUNTAIN_STEP_M=90;
export const COAST_MOUNTAIN_ROWS=17;

/** Height field for the inland ridge. No extra runtime sampling or shaders.
 * Both ranges share broad summit and valley rhythms, while keeping locally
 * different spurs. This joins the green foothills to the distant skyline. */
export function coastMountainHeight(layer:0|1,d:number,u:number){
 const rear=layer===1;
 // Both ranges share the same large-scale watershed and valley positions.
 const sharedSpine=fbm2(d/1050,3.7,3,.48,2);
 const branchBend=fbm2(d/760+layer*2.9,layer*2.4+1.9,3,.5,2);
 const spine=.43+.13*(sharedSpine-.5)+.04*(branchBend-.5)+.025*Math.sin(d/660+layer*.6);
 const broad=ridged2(4.2,d/510,4,.51,2,1.9,.32,.22);
 const valley=fbm2(1.7,d/420+7.8,3,.50,2);
 const notch=smoothstep(.62,.80,valley);
 // Independent small-scale spurs keep the layers from looking duplicated.
 const irregular=ridged2(layer*6.2+2.1,d/(rear?365:315)+4.4,3,.49,2,1.75,.25,.2);
 const crest=(rear?285:170)+(rear?270:215)*(.25+.52*broad+.23*irregular)-notch*(rear?92:65);
 const rib=ridged2(u*9.2+layer*4.5,d/(rear?365:310),3,.52,2,1.6,.28,.18);
 const crease=fbm2(u*11+layer*3.7,d/230+5.8,3,.5,2);
 const width=(rear?.275:.225)+.045*(broad-.5);
 const q=Math.abs((u-spine)/width);
 // Rear mountains remain taller, but without the old needle-like silhouettes.
 const main=Math.exp(-Math.pow(q,1.56));
 const spurL=Math.exp(-(((u-spine+.31)/.14)**2))*(.17+.13*rib);
 const spurR=Math.exp(-(((u-spine-.27)/.15)**2))*(.13+.12*(1-crease));
 const slopeDetail=(rib-.5)*(rear?48:60)+(crease-.5)*(rear?29:36);
 const shoulder=smoothstep(0,.14,u)*(1-smoothstep(.89,1,u));
 return -22+shoulder*Math.max(0,main*(crest+slopeDetail)+(spurL+spurR)*crest*.51);
}

/** Mountain backdrop: two meshes like before, same far-depth treatment.
 * Extra silhouette and color detail is baked; no additional material passes. */
export function addCoastMountains(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],length:number){
 const origin=sample(0).position.clone();
 const axis=sample(length).position.clone().sub(origin).setY(0).normalize();
 const right=new THREE.Vector3(axis.z,0,-axis.x);
 if(right.dot(sample(length*.5).right)<0)right.negate();
 const count=Math.ceil((length+7000)/COAST_MOUNTAIN_STEP_M);
 // Sunset art direction: foreground hills carry the warmth; distant ranges
 // stay in shadow as supporting dark forest-green silhouettes. Do not wash
 // their greens out with pale rock highlights or bright atmospheric haze.
 const nearGreen=new THREE.Color('#55684d'),farGreen=new THREE.Color('#2d4938');
 const nearRock=new THREE.Color('#867e6a'),farRock=new THREE.Color('#43564a');
 const nearWarm=new THREE.Color('#b5a080'),farWarm=new THREE.Color('#617359');
 const nearHaze=new THREE.Color('#899487'),farHaze=new THREE.Color('#43584a');
 const normal=new THREE.Vector3();
 for(let layer=0;layer<2;layer++){
  const rear=layer===1;
  const pos:number[]=[],colors:number[]=[],indices:number[]=[],ribValues:number[]=[],detailValues:number[]=[],heightValues:number[]=[],depthValues:number[]=[];
  const rows=COAST_MOUNTAIN_ROWS;
  for(let i=0;i<=count;i++){
   const d=-3500+i*COAST_MOUNTAIN_STEP_M;
   for(let row=0;row<rows;row++){
    const u=row/(rows-1),x=(rear?1300:430)+u*(rear?2100:1700);
    const h=coastMountainHeight(layer as 0|1,d,u);
    const p=origin.clone().addScaledVector(axis,d).addScaledVector(right,x);
    pos.push(p.x,h,p.z);heightValues.push(h);depthValues.push(u);
    ribValues.push(ridged2(x/260+layer*4,d/405,3,.5,2,1.7,.30,.20));
    detailValues.push(fbm2(x/190+4,d/250,3,.5,2));
   }
   if(i<count)for(let row=0;row<rows-1;row++){
    const a=i*rows+row;indices.push(a,a+1,a+rows,a+1,a+rows+1,a+rows);
   }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const base=rear?farGreen:nearGreen,stone=rear?farRock:nearRock,lit=rear?farWarm:nearWarm,haze=rear?farHaze:nearHaze;
  const color=new THREE.Color();
  for(let i=0;i<pos.length/3;i++){
   normal.fromBufferAttribute(geometry.attributes.normal,i);
   if(normal.y<0)normal.negate();
   const height=heightValues[i],slope=1-normal.y;
   const rocky=smoothstep(.15,.64,slope)*smoothstep(rear?120:75,rear?400:270,height);
   const sunlight=Math.max(0,normal.dot(COAST_SUN));
   const ribs=ribValues[i],fine=detailValues[i];
   color.copy(base).lerp(stone,rocky*(rear?.48:.59));
   // Distant peaks face away from the low sun: reduce their baked fill and
   // warm highlights rather than allowing the green backdrop to glow.
   color.multiplyScalar((rear?.65:.69)+(rear?.10:.22)*sunlight+(rear?.10:.14)*normal.y);
   color.lerp(lit,sunlight*(rear?.06:.21));
   // Keep subtle relief, but do not give the remote range bright mottling.
   color.multiplyScalar(rear?.95+.06*ribs+.045*fine:.91+.12*ribs+.095*fine);
   // Atmospheric recession softens contrast without adding pale-green fog.
   // Foreground hill colors and haze are deliberately unchanged.
   const depth=depthValues[i];
   color.lerp(haze,rear?.12+.06*depth:.10+.15*depth);
   colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  // TEMPORARY BLACK-MOUNTAIN DIAGNOSTIC (2026-11-06).
  // Force BOTH coast mountain sheets to pure black at the material stage.
  // MeshBasicMaterial multiplies its material color by baked vertex colors,
  // so no sunset, vertex hue or haze can turn them green in this experiment.
  // Remove this override after the actual rendering source is confirmed.
  const material=new THREE.MeshBasicMaterial({color:0x000000,vertexColors:true,fog:false,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(1.0-0.00008/(1.0+max(0.0,-mvPosition.z)/2000.0));');
  };
  material.customProgramCacheKey=()=> 'coast-mountain-backdrop-v1';
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='coast-mountains-'+layer;mesh.frustumCulled=false;scene.add(mesh);
 }
}
