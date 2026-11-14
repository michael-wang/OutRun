import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {WindGroom} from './hero-groom';
import {clone as cloneSkin} from 'three/addons/utils/SkeletonUtils.js';
import {springBlonde} from './blonde-spring';

const channels=['wind','sway','tipSway','flutterCos','flutterSin'] as const;
let template:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>|undefined;
let pending:Promise<boolean>|undefined;
let springTemplate:THREE.Group|undefined,springPending:Promise<boolean>|undefined;

/** Preload inside the existing coast loading screen. The CPU template is never
 * attached/rendered; each race owns its GPU resources through disposeScene. */
export function preloadBlondeGroom(spring=true):Promise<boolean>{
 if(spring){
  if(springTemplate)return Promise.resolve(true);
  if(springPending)return springPending;
  springPending=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
   try{
    // One loader; preserved R6/R6b/R6c assets remain dev-only art comparisons.
    const oldMiddle=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('hairMid')==='old';
    const oldUpper=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('hairUpper')==='old';
    const r6c=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('hairStyle')==='r6c';
    const r6d=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('hairStyle')==='r6d';
    const r6f=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('hairStyle')==='r6f';
    const r6g=import.meta.env.DEV&&!oldMiddle&&!oldUpper&&!r6c&&!r6d&&!r6f;
    const filename=oldMiddle?'coast-blonde-r6.glb':oldUpper?'coast-blonde-r6b.glb':r6c?'coast-blonde-r6b-upper.glb':r6d?'coast-blonde-r6d.glb':r6f?'coast-blonde-r6f.glb':r6g?'coast-blonde-r6g.glb':'coast-blonde-r6d.glb';
    const triangleBudget=oldMiddle||oldUpper?2500:r6c?7500:r6f||r6g?20000:5000;
    const response=await fetch(`${import.meta.env.BASE_URL}assets/characters/${filename}`,{signal:controller.signal});
    if(!response.ok)throw new Error(`Spring hair HTTP ${response.status}`);
    const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
    const meshes:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
    const mesh=meshes[0];
    const expanded=gltf.scene.getObjectByName('R6f_blonde_rig');
    const layered=gltf.scene.getObjectByName('R6g_blonde_rig'),rig=layered??expanded;
    if(rig&&(!Array.isArray(rig.userData.windSlots)||rig.userData.windSlots.length!==(layered?18:16)||!rig.userData.windSlots.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=6)))throw new Error('Invalid spring hair wind slots');
    if(meshes.length!==1||!(mesh instanceof THREE.SkinnedMesh)||mesh.skeleton.bones.length!==(layered?73:expanded?81:25)||
       !(mesh.material instanceof THREE.MeshStandardMaterial)||mesh.material.transparent||
       (mesh.geometry.index?.count??mesh.geometry.attributes.position.count)>triangleBudget*3)
     throw new Error('Invalid R6 hair asset');
    for(let c=0;c<(layered?18:expanded?16:6);c++)for(let d=0;d<(expanded?5:4);d++)if(!gltf.scene.getObjectByName(`lock-${c}-${d}`))throw new Error('Missing hair bone');
    springTemplate=gltf.scene;return true;
   }catch(error){console.warn('R6 hair unavailable; falling back to previous blonde groom.',error);}
   finally{clearTimeout(timer);}
   return preloadBlondeGroom(false);
  })().finally(()=>{springPending=undefined;});
  return springPending;
 }
 if(template)return Promise.resolve(true);
 if(pending)return pending;
 pending=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{
   const response=await fetch(`${import.meta.env.BASE_URL}assets/characters/coast-blonde-bob.glb`,{signal:controller.signal});
   if(!response.ok)throw new Error(`Hair asset HTTP ${response.status}`);
   const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
   const meshes:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
   const mesh=meshes[0];
   if(meshes.length!==1||!(mesh.material instanceof THREE.MeshStandardMaterial)||
      mesh.material.transparent||channels.some(c=>mesh.morphTargetDictionary?.[c]===undefined)||
      (mesh.geometry.index?.count??mesh.geometry.attributes.position.count)>3000)
    throw new Error('Invalid driving hair asset');
   template=mesh as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;
   return true;
  }catch(error){
   console.warn('Blender hair unavailable; using the existing blonde groom.',error);
   return false;
  }finally{clearTimeout(timer);}
 })().finally(()=>{pending=undefined;});
 return pending;
}

/** Synchronous factory, same anchor and occupant inputs as the procedural groom.
 * The five authored fields already contain six differently phased lock masks. */
export function createBlenderBlondeGroom(spring=true):WindGroom|undefined{
 if(spring&&springTemplate){
  const root=cloneSkin(springTemplate) as THREE.Group;root.name='blender-blonde-groom';
  root.traverse(o=>{if(o instanceof THREE.Mesh){
   o.geometry=o.geometry.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();
   o.castShadow=true;o.receiveShadow=false;
   // Skin bounds can move beyond bind-pose bounds; one tiny hero mesh is cheap.
   o.frustumCulled=false;
  }});
  return springBlonde(root);
 }
 if(!template)return;
 const root=new THREE.Group();root.name='blender-blonde-groom';
 const mesh=new THREE.Mesh(template.geometry.clone(),template.material.clone());
 mesh.name='blender-blonde-bob';mesh.morphTargetDictionary={...template.morphTargetDictionary};
 mesh.castShadow=true;mesh.receiveShadow=false;root.add(mesh);
 const slots=channels.map(c=>mesh.morphTargetDictionary![c]);
 return {root,sync(wind,sway,tipSway,phase){
  // Ease the existing speed signal into visible motion at 120 km/h. This is
  // amplitude only: damping, phase, turn inertia and settling stay in occupants.
  const w=Math.sqrt(THREE.MathUtils.clamp(wind,0,1));
  const weights=[w*(.93+.07*Math.sin(phase*.71)),sway,tipSway,w*Math.sin(phase),w*Math.cos(phase)];
  slots.forEach((slot,i)=>{mesh.morphTargetInfluences![slot]=weights[i];});
 }};
}
