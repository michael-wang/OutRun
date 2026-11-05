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
 * Wide peaks are interrupted by narrow valley cuts and off-center spurs;
 * the two layers have different wavelengths so they no longer look copied. */
export function coastMountainHeight(layer:0|1,d:number,u:number){
 const rear=layer===1;
 const spineNoise=fbm2(d/1050+layer*7.4,layer*3.7,3,.48,2);
 const spine=.43+.13*(spineNoise-.5)+.05*Math.sin(d/(rear?525:640)+layer*2.1);
 const rib=ridged2(u*9.2+layer*4.5,d/(rear?360:300),3,.52,2,1.6,.28,.18);
 const crease=fbm2(u*11+layer*3.7,d/215+5.8,3,.5,2);
 const broad=ridged2(layer*8+4.2,d/(rear?490:380),4,.51,2,1.9,.32,.22);
 const irregular=ridged2(layer*6.2+2.1,d/260+4.4,3,.49,2,1.75,.25,.2);
 const valley=fbm2(layer*9+1.7,d/270+7.8,3,.50,2);
 const notch=smoothstep(.60,.79,valley);
 const crest=(rear?310:160)+(rear?320:210)*(.23+.48*broad+.32*irregular)-notch*(rear?145:94);
 const width=(rear?.26:.235)+.055*(broad-.5);
 const q=Math.abs((u-spine)/width);
 // A steeper-than-Gaussian ridge makes distinct summits, not rounded domes.
 const main=Math.exp(-Math.pow(q,1.53));
 const spurL=Math.exp(-(((u-spine+.31)/.14)**2))*(.17+.13*rib);
 const spurR=Math.exp(-(((u-spine-.27)/.15)**2))*(.13+.12*(1-crease));
 const slopeDetail=(rib-.5)*72+(crease-.5)*43;
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
 const nearGreen=new THREE.Color('#52674d'),farGreen=new THREE.Color('#777f7b');
 const nearRock=new THREE.Color('#92836b'),farRock=new THREE.Color('#9b9390');
 const nearWarm=new THREE.Color('#c0a078'),farWarm=new THREE.Color('#c6afa5');
 const nearHaze=new THREE.Color('#8b918e'),farHaze=new THREE.Color('#b2a6a4');
 const normal=new THREE.Vector3();
 for(let layer=0;layer<2;layer++){
  const rear=layer===1;
  const pos:number[]=[],colors:number[]=[],indices:number[]=[],ribValues:number[]=[],detailValues:number[]=[],heightValues:number[]=[];
  const rows=COAST_MOUNTAIN_ROWS;
  for(let i=0;i<=count;i++){
   const d=-3500+i*COAST_MOUNTAIN_STEP_M;
   for(let row=0;row<rows;row++){
    const u=row/(rows-1),x=(rear?1300:430)+u*(rear?2100:1700);
    const h=coastMountainHeight(layer as 0|1,d,u);
    const p=origin.clone().addScaledVector(axis,d).addScaledVector(right,x);
    pos.push(p.x,h,p.z);heightValues.push(h);
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
   color.copy(base).lerp(stone,rocky*(rear?.52:.63));
   color.multiplyScalar((rear?.76:.67)+.22*sunlight+.14*normal.y);
   color.lerp(lit,sunlight*(rear?.20:.24));
   // Mild erosion/vegetation colour follows relief without painted stripes.
   color.multiplyScalar(.91+.12*ribs+.095*fine);
   // The farther range loses saturation and contrast into the dusk atmosphere.
   color.lerp(haze,rear?.53:.17);
   colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const material=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(1.0-0.00008/(1.0+max(0.0,-mvPosition.z)/2000.0));');
  };
  material.customProgramCacheKey=()=> 'coast-mountain-backdrop-v1';
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='coast-mountains-'+layer;mesh.frustumCulled=false;scene.add(mesh);
 }
}
