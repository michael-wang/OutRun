import * as THREE from 'three';

/** Capture before owners detach their meshes, then release after workers stop. */
export function sceneDisposal(scene:THREE.Scene){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const instances:THREE.InstancedMesh[]=[],shadows:THREE.LightShadow[]=[];
 const skeletons=new Set<THREE.Skeleton>();
 scene.traverse(o=>{
  if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.Line){
   geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  }
  if(o instanceof THREE.InstancedMesh)instances.push(o);
  if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton);
  if(o instanceof THREE.Light&&'shadow' in o)shadows.push((o as THREE.DirectionalLight).shadow);
 });
 for(const m of materials){
  for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);
  if(m instanceof THREE.ShaderMaterial)for(const u of Object.values(m.uniforms))if(u.value instanceof THREE.Texture)textures.add(u.value);
 }
 return ()=>{
  instances.forEach(o=>o.dispose());shadows.forEach(s=>s.dispose());
  skeletons.forEach(s=>s.dispose());
  materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());scene.clear();
 };
}
export function disposeScene(scene:THREE.Scene){sceneDisposal(scene)();}
