import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkin} from 'three/addons/utils/SkeletonUtils.js';
import {createHeroinePerformance,HEROINE_ACTIONS} from './heroine-performance';

let template:THREE.Group|undefined,pending:Promise<boolean>|undefined;
let profile:'r7a'|'r7h'='r7a',animations:THREE.AnimationClip[]=[];
/** One approved-sculpt-derived bust, loaded alongside the existing hair. */
export function preloadHeroineBust(wanted:'r7a'|'r7h'='r7a'):Promise<boolean>{
 if(template&&profile===wanted)return Promise.resolve(true);
 if(pending)return pending;
 pending=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(`${import.meta.env.BASE_URL}assets/characters/coast-heroine-${wanted==='r7h'?'r7h-race':'r7a'}.glb`,{signal:controller.signal});
   if(!response.ok)throw new Error(`Heroine HTTP ${response.status}`);
   const bytes=await response.arrayBuffer();if(bytes.byteLength>2500000)throw new Error('Oversize heroine asset');
   const gltf=await new GLTFLoader().parseAsync(bytes,'');
   const meshes:THREE.SkinnedMesh[]=[];let triangles=0;
   gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){
    if(!(o instanceof THREE.SkinnedMesh)||Array.isArray(o.material)||!(o.material instanceof THREE.MeshStandardMaterial)||o.material.transparent)throw new Error('Invalid heroine mesh');
    if(!['smile','mouthOpen'].every(k=>o.morphTargetDictionary?.[k]!==undefined))throw new Error('Missing heroine expression');
    triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;meshes.push(o);
   }});
   if(meshes.length!==4||triangles>40000||!gltf.scene.getObjectByName(wanted==='r7h'?'head':'heroine-head')||meshes.some(m=>m.skeleton.bones.length!==(wanted==='r7h'?14:2)))throw new Error('Invalid heroine rig');
   if(wanted==='r7h'&&![...HEROINE_ACTIONS,'wave','applause'].every(n=>gltf.animations.some(c=>c.name===n)))throw new Error('Missing heroine clips');
   template=gltf.scene;profile=wanted;animations=gltf.animations;return true;
  }catch(error){console.warn('Heroine asset unavailable; keeping previous passenger.',error);return false;}
  finally{clearTimeout(timer);}
 })().finally(()=>{pending=undefined;});return pending;
}

export function createHeroineBust(){
 if(!template)return;
 const root=cloneSkin(template) as THREE.Group;root.name='heroine-upper-body';
 const parts:THREE.SkinnedMesh[]=[];
 root.traverse(o=>{if(o instanceof THREE.SkinnedMesh){
  o.geometry=o.geometry.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();
  o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;parts.push(o);
 }});
 const head=root.getObjectByName(profile==='r7h'?'head':'heroine-head')!;
 const performance=profile==='r7h'?createHeroinePerformance(root,animations,parts):undefined;
 return {root,performance,poseHead:(rotation:THREE.Euler)=>{if(!performance)head.rotation.copy(rotation);},
  expression(smile:number,mouthOpen=0){for(const mesh of parts){
   mesh.morphTargetInfluences![mesh.morphTargetDictionary!.smile]=THREE.MathUtils.clamp(smile,0,1);
   mesh.morphTargetInfluences![mesh.morphTargetDictionary!.mouthOpen]=THREE.MathUtils.clamp(mouthOpen,0,1);
  }},
 };
}
