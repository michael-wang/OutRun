import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export type TerrainDemoPatch={mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;
 triangles:number;bytes:number;loadMs:number;seamVertices:THREE.Vector3[]};
const MAX_BYTES=2*1024*1024;
const MAX_TRIANGLES=25000;

export async function loadTerrainDemoPatch():Promise<TerrainDemoPatch>{
 const start=performance.now();
 if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('loopback preview only');
 const response=await fetch('/.local/kenting-erosion.glb',{cache:'no-store',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('local GLB unavailable ('+response.status+')');
 const data=await response.arrayBuffer(),header=new DataView(data);
 if(data.byteLength<20||data.byteLength>MAX_BYTES||header.getUint32(0,true)!==0x46546c67||
 header.getUint32(4,true)!==2||header.getUint32(8,true)!==data.byteLength||header.getUint32(16,true)!==0x4e4f534a||
 header.getUint32(12,true)>data.byteLength-20)throw Error('invalid local GLB');
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,header.getUint32(12,true))));
 if(json.images?.length||json.textures?.length||json.buffers?.some((b:{uri?:string})=>b.uri)||
 json.meshes?.length!==1||json.meshes[0].primitives?.length!==1||
 json.extensionsUsed?.some((name:string)=>name!=='KHR_materials_specular')||json.extensionsRequired?.length)throw Error('expected one untextured original surface');
 const gltf=await new GLTFLoader().parseAsync(data,'');
 const meshes:THREE.Mesh[]=[];
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
 const source=meshes[0],geo=source?.geometry,index=geo?.index;
 if(meshes.length!==1||!index||!geo.getAttribute('normal')||![3,4].includes(geo.getAttribute('color')?.itemSize)||
 index.count%3!==0||index.count/3>MAX_TRIANGLES||index.count<3){
  for(const m of meshes){m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}
  throw Error('GLB requires one indexed opaque surface, normals, and RGB');
 }
 // Flatten exporter transform (Blender Z-up -> authored Three world XYZ), never place by eye.
 geo.applyMatrix4(source.matrixWorld);
 if(!Object.values(geo.attributes).every(a=>a.array.every(Number.isFinite))){
  geo.dispose();for(const m of Array.isArray(source.material)?source.material:[source.material])m.dispose();throw Error('nonfinite GLB geometry');
 }
 const colors=geo.getAttribute('color');
 if(colors.itemSize===4){
  const rgb=new Float32Array(colors.count*3);
  for(let i=0;i<colors.count;i++){
   rgb[i*3]=colors.getX(i);rgb[i*3+1]=colors.getY(i);rgb[i*3+2]=colors.getZ(i);
  }
  geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));
 }
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
 for(const m of Array.isArray(source.material)?source.material:[source.material])m.dispose();
 const mesh=new THREE.Mesh(geo,material);mesh.name='kenting-terrain-demo';mesh.receiveShadow=true;
 mesh.userData.artVisualOnly=true;
 const position=geo.getAttribute('position');
 const seamVertices=Array.from({length:position.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(position,i));
 return {mesh,seamVertices,triangles:index.count/3,bytes:data.byteLength,loadMs:performance.now()-start};
}

/** Stock boundary vertices must each intersect the explicitly preserved export perimeter. */
export function terrainDemoSeamGap(seam:Float32Array,vertices:readonly THREE.Vector3[]){
 let max=0;
 for(let i=0;i<seam.length;i+=3){
  let best=Infinity;
  for(const p of vertices){
   const dx=p.x-seam[i],dy=p.y-seam[i+1],dz=p.z-seam[i+2],d=dx*dx+dy*dy+dz*dz;
   best=Math.min(best,d);
   if(best<.000001)break;
  }
  max=Math.max(max,Math.sqrt(best));
 }
 return max;
}
