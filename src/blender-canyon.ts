import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// The v2 .blend's existing sRGB palette. Its linked weathering nodes exported
// without baseColorFactor; restore only those colors, not geometry or shaders.
const palette:Record<string,string>={
 'V2 | dusty gravel shoulder':'#AB8C67','V2 | deep rust bedding':'#89452F',
 'V2 | pale limestone ledge':'#D9A370','V2 | terracotta wall':'#B96543',
 'V2 | broken sandstone talus':'#A96B46','V2 | warm mesa cap':'#D4A174',
 'V2 | sunlit ochre sandstone':'#BB7449','V2 | distant mauve sandstone':'#9C7978',
};

export async function loadBlenderCanyon(roadLock=false){
 const started=performance.now();
 const gltf=await new GLTFLoader().loadAsync('/__local_art/'+(roadLock?'canyon_roadlock_art.glb':'canyon_art_only.glb'));
 const root=gltf.scene;root.name=roadLock?'blender-canyon-full-route':'blender-canyon-v2';
 // glTF is already meters/Y-up in the production track's world coordinates.
 // Do not recenter, rotate or normalize the model.
 root.updateMatrixWorld(true);
 let meshes=0,triangles=0;
 root.traverse(object=>{if(object instanceof THREE.Mesh){
  if(/REFERENCE/i.test(object.name))throw Error('GLB contains reference road geometry');
  meshes++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(material instanceof THREE.MeshStandardMaterial&&palette[material.name])material.color.set(palette[material.name]);
  }
  object.receiveShadow=true;object.castShadow=false;
 }});
 if(!meshes)throw Error('GLB contains no artwork');
 const box=new THREE.Box3().setFromObject(root);
 if(!roadLock&&(box.min.y>57||box.max.y<300))throw Error('Unexpected canyon world bounds; check the GLB coordinate export');
 return {root,stats:{status:'ready',loadMs:performance.now()-started,meshes,triangles,
  position:root.position.toArray(),scale:root.scale.toArray(),quaternion:root.quaternion.toArray(),
  bounds:{min:box.min.toArray(),max:box.max.toArray()}}};
}
