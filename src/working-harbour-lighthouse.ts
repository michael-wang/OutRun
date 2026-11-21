import * as THREE from 'three';
import {kentingHero} from './assets/kenting-hero-kit';
import {coastBeachHeight} from './scenery-cross-section';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};

const oxideRoof=new THREE.Color(0xb64b36);
const footingMaterial=new THREE.MeshStandardMaterial({color:0x81766a,roughness:.91});

/** An instance of Kenting's exact gallery mesh. Only its material is varied,
 * which keeps the cached Kenting mesh/material and approved beach tower intact. */
export function addWorkingHarbourLighthouse(root:THREE.Group,sample:Sample,station:number,lateral:number){
 const road=sample(station);
 const ground=(d:number,x:number)=>{
  const r=sample(d);
  return coastBeachHeight(x,r.position.y,r.right.y,d);
 };
 const baseY=ground(station,lateral);
 const base=road.position.clone().addScaledVector(road.right,lateral).setY(baseY);
 const model=kentingHero('gallery-lighthouse');
 const material=(model.material as THREE.MeshStandardMaterial).clone();
 material.name='Harbour gallery lighthouse with oxide-red roof';
 material.onBeforeCompile=shader=>{
  shader.uniforms.harbourRoofColour={value:oxideRoof};
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>','#include <common>\nuniform vec3 harbourRoofColour;')
   .replace('#include <color_vertex>',`#include <color_vertex>
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
 if(position.y>29.89) vColor.rgb=harbourRoofColour;
#endif`);
 };
 material.customProgramCacheKey=()=> 'harbour-gallery-oxide-roof-v1';
 model.material=material;
 model.name='working-harbour-gallery-lighthouse';
 model.position.copy(base);
 model.rotation.y=-Math.atan2(-road.right.z,-road.right.x);
 root.add(model);

 // A small stone foundation joins the reused mesh to its rocky shoulder.
 // Sample the full footprint after the same terrain shaping used by the road.
 const radius=3.12;
 let lowest=baseY;
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12;
  lowest=Math.min(lowest,ground(station+radius*Math.cos(a),lateral+radius*Math.sin(a)));
 }
 const footingTop=baseY+.12,footingBottom=lowest-.55;
 const footing=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius+.14,footingTop-footingBottom,16),footingMaterial);
 footing.name='working-harbour-lighthouse-footing';
 footing.position.copy(base).setY((footingTop+footingBottom)/2);
 root.add(footing);

 return {station,lateral,base:base.toArray(),top:baseY+model.geometry.boundingBox!.max.y,
  footingTop,footingBottom,footprintGroundMin:lowest};
}
