import * as THREE from 'three';

/** A safe, minimal shader/geometry variant preflight.
 * Same material + same mesh instancing mode need one representative draw.
 * Geometry buffers for other distant objects are allowed to stream later.
 * Legacy mode returns every object, preserving the old startup behavior.
 */
export function farmWarmupRepresentatives(objects:THREE.Mesh[],hybrid:boolean):THREE.Mesh[]{
 if(!hybrid)return objects;
 const seen=new Map<THREE.Material,Set<string>>();
 return objects.filter(object=>{
  const kind=object instanceof THREE.InstancedMesh?'instanced':'mesh';
  const materials=Array.isArray(object.material)?object.material:[object.material];
  const needsWarmup=materials.some(material=>!seen.get(material)?.has(kind));
  for(const material of materials){
   let variants=seen.get(material);
   if(!variants){variants=new Set();seen.set(material,variants);}
   variants.add(kind);
  }
  return needsWarmup;
 });
}
