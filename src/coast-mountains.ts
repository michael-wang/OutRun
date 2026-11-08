import * as THREE from 'three';
import {fbm2,ridged2,smoothstep} from './vendor/procedural-terrains/cpuNoise.js';
import {COAST_SUN} from './coast-dusk';
import {COAST_DISTRICTS} from './coast-layout';
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
 // Return the exaggerated distant wall to a plausible scenic silhouette.
 // Broad ridge rhythms dominate at long range; small spurs are subdued.
 const relief=.25+(rear?.60:.52)*broad+(rear?.15:.23)*irregular;
 const crest=(rear?410:145)+(rear?340:175)*relief-notch*(rear?76:52);
 const rib=ridged2(u*9.2+layer*4.5,d/(rear?365:310),3,.52,2,1.6,.28,.18);
 const crease=fbm2(u*11+layer*3.7,d/230+5.8,3,.5,2);
 const width=(rear?.275:.225)+.045*(broad-.5);
 const q=Math.abs((u-spine)/width);
 // Rear mountains remain taller, but without the old needle-like silhouettes.
 const main=Math.exp(-Math.pow(q,1.56));
 const spurL=Math.exp(-(((u-spine+.31)/.14)**2))*(.17+.13*rib);
 const spurR=Math.exp(-(((u-spine-.27)/.15)**2))*(.13+.12*(1-crease));
 const slopeDetail=(rib-.5)*(rear?48:46)+(crease-.5)*(rear?29:28);
 const shoulder=smoothstep(0,.14,u)*(1-smoothstep(.89,1,u));
 return -22+shoulder*Math.max(0,main*(crest+slopeDetail)+(spurL+spurR)*crest*.51);
}

/** Mountain backdrop: two meshes like before, same far-depth treatment.
 * Extra silhouette and color detail is baked; no additional material passes. */
export function addCoastMountains(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],length:number){
 const meadowTile=new THREE.Uniform<THREE.Texture|null>(null);
 const origin=sample(0).position.clone();
 const axis=sample(length).position.clone().sub(origin).setY(0).normalize();
 const right=new THREE.Vector3(axis.z,0,-axis.x);
 if(right.dot(sample(length*.5).right)<0)right.negate();
 const count=Math.ceil((length+7000)/COAST_MOUNTAIN_STEP_M);
 // The backdrop is in chord coordinates, while the towns use route metres.
 const townAxisAt=(d:number)=>sample(d).position.clone().sub(origin).dot(axis);
 const townStart=townAxisAt(COAST_DISTRICTS[0].start),townEnd=townAxisAt(COAST_DISTRICTS[COAST_DISTRICTS.length-1].end);
 // One coherent dusk palette, rather than two separately darkened green
 // silhouettes. The mid ridge stays warm olive; the more distant ridge loses
 // saturation, shifts slightly toward slate, and picks up subtle evening haze.
 // No extra meshes, shaders, or runtime fog passes are necessary.
 const midGreen=new THREE.Color('#56654e'),farGreen=new THREE.Color('#66736f');
 const midRock=new THREE.Color('#827c6d'),farRock=new THREE.Color('#7b7976');
 const midWarm=new THREE.Color('#a3917b'),farWarm=new THREE.Color('#968879');
 const midHaze=new THREE.Color('#7d827b'),farHaze=new THREE.Color('#847c80');
 const normal=new THREE.Vector3();
 for(let layer=0;layer<2;layer++){
  const rear=layer===1;
  const pos:number[]=[],colors:number[]=[],indices:number[]=[],ribValues:number[]=[],detailValues:number[]=[],heightValues:number[]=[],depthValues:number[]=[];
  const rows=COAST_MOUNTAIN_ROWS;
  for(let i=0;i<=count;i++){
   const d=-3500+i*COAST_MOUNTAIN_STEP_M;
   const townSetback=rear?0:260*smoothstep(townStart-560,townStart,d)*(1-smoothstep(townEnd,townEnd+560,d));
   for(let row=0;row<rows;row++){
    const u=row/(rows-1),x=(rear?1300:430)+u*(rear?2100:1700);
    const h=coastMountainHeight(layer as 0|1,d,u);
    const p=origin.clone().addScaledVector(axis,d).addScaledVector(right,x+townSetback);
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
  const base=rear?farGreen:midGreen,stone=rear?farRock:midRock,lit=rear?farWarm:midWarm,haze=rear?farHaze:midHaze;
  const color=new THREE.Color();
  for(let i=0;i<pos.length/3;i++){
   normal.fromBufferAttribute(geometry.attributes.normal,i);
   if(normal.y<0)normal.negate();
   const height=heightValues[i],slope=1-normal.y;
   const rocky=smoothstep(.15,.64,slope)*smoothstep(rear?120:75,rear?400:270,height);
   const sunlight=Math.max(0,normal.dot(COAST_SUN));
   const ribs=ribValues[i],fine=detailValues[i];
   color.copy(base).lerp(stone,rocky*(rear?.42:.55));
   // The warm, low sun still outlines middle hills; distant surfaces have
   // gentler relief lighting and fewer brightly colored rocky highlights.
   color.multiplyScalar((rear?.82:.77)+(rear?.11:.18)*sunlight+(rear?.08:.12)*normal.y);
   color.lerp(lit,sunlight*(rear?.12:.16));
   color.multiplyScalar(rear?.93+.09*ribs+.05*fine:.91+.11*ribs+.045*fine);
   // Bake atmospheric perspective from the very same dusk palette.
   // Lower distant slopes are hazier than exposed summits; unlike a flat
   // pastel overlay this retains landform volume and a readable horizon.
   const depth=depthValues[i];
   const airlight=rear
    ?.14+.18*(1-smoothstep(100,480,height))+.06*depth
    :.10+.06*depth;
   color.lerp(haze,airlight);
   colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  // Fixed neutral exposure keeps the baked linear vertex colors predictable
  // (the game's ACES pass would otherwise brighten them again). The distant
  // range is slightly *lighter* and grayer, rather than a black cutout.
  const dim=rear?.72:.70;
  const material=new THREE.MeshBasicMaterial({
   color:new THREE.Color().setRGB(dim,dim,dim),
   vertexColors:true,fog:false,toneMapped:false,side:THREE.DoubleSide,
  });
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(1.0-0.00008/(1.0+max(0.0,-mvPosition.z)/2000.0));');
   if(!rear){
    shader.uniforms.ridgeMeadow=meadowTile;
    shader.vertexShader='varying vec2 vRidgeGround;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vRidgeGround=position.xz+position.y*vec2(.58,-.29);`);
    shader.fragmentShader='varying vec2 vRidgeGround; uniform sampler2D ridgeMeadow;\n'+
     shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float fold=texture2D(ridgeMeadow,vRidgeGround/310.).r;
      vec2 grass=texture2D(ridgeMeadow,mat2(.84,.54,-.54,.84)*vRidgeGround/83.+fold*.31).rg;
      float cover=smoothstep(.25,.75,.6*fold+.4*grass.r);
      diffuseColor.rgb*=mix(vec3(.77,.82,.81),vec3(1.28,1.20,1.06),cover)*(.84+.35*grass.g);`);
   }
  };
  material.customProgramCacheKey=()=>rear?'coast-mountain-backdrop-v1':'coast-mid-ridge-grass';
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='coast-mountains-'+layer;mesh.frustumCulled=false;scene.add(mesh);
 }
 return meadowTile;
}
