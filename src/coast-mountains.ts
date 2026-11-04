import * as THREE from 'three';
import {fbm2,ridged2} from './vendor/procedural-terrains/cpuNoise.js';
import type {createTrack} from './track';

/** Fixed world-space mountain silhouettes behind the coastal plain. Two low-poly
 * meshes, baked once. Far depth is clamped like a backdrop so the mobile main
 * camera can retain its short far plane instead of drawing more foreground. */
export function addCoastMountains(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],length:number){
 const origin=sample(0).position.clone(),axis=sample(length).position.clone().sub(origin).setY(0).normalize(),right=new THREE.Vector3(axis.z,0,-axis.x);
 if(right.dot(sample(length*.5).right)<0)right.negate();
 for(let layer=0;layer<2;layer++){
  const position:number[]=[],colors:number[]=[],indices:number[]=[],step=100,count=Math.ceil((length+7000)/step);
  for(let i=0;i<=count;i++){
   const d=-3500+i*step,noise=fbm2(layer*8+4,d/1600,4,.5,2),ridge=ridged2(layer*4+9,d/1400,3,.5,2,1.6,.3,.2);
   const peak=(layer?420:175)+(layer?330:180)*ridge+noise*90;
   const offset=(layer?2300:1250)+Math.sin(d/880+layer)*170;
   for(let row=0;row<4;row++){
    const x=offset+[-650,-220,0,600][row],height=row===0?-35:row===1?peak*.40:row===2?peak:-25;
    const p=origin.clone().addScaledVector(axis,d).addScaledVector(right,x);position.push(p.x,height,p.z);
    const color=new THREE.Color(layer?'#756c80':'#506c61');
    color.lerp(new THREE.Color('#b39a91'),row===0?.5:row===2?.12:.24);
    color.multiplyScalar(.92+.12*noise+(row===1?.04:0));colors.push(color.r,color.g,color.b);
   }
   if(i<count)for(let row=0;row<3;row++){const a=i*4+row;indices.push(a,a+1,a+4,a+1,a+5,a+4);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);
  const m=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(1.0-0.00008/(1.0+max(0.0,-mvPosition.z)/2000.0));');};
  m.customProgramCacheKey=()=> 'coast-mountain-backdrop-v1';
  const mesh=new THREE.Mesh(g,m);mesh.name='coast-mountains-'+layer;mesh.frustumCulled=false;scene.add(mesh);
 }
}
