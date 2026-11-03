import type {RoadMeshData} from './road-chunk';
import {insideBlenderFootprint,insideBlenderHero} from './blender-art-coverage';

/** Keep original sand/contact meshes intact, and trim a separate visual copy.
 * The asphalt and rails are returned untouched, including their ray ranges. */
export function blenderRoadVisuals(meshes:RoadMeshData[],start:number,end:number):RoadMeshData[]{
 return meshes.flatMap(mesh=>{
  if(!['sand','grass','water','surf','support'].includes(mesh.kind))return [mesh];
  const kept:number[]=[];
  for(let i=0;i<mesh.indices.length;i+=3){
   const ids=Array.from(mesh.indices.subarray(i,i+3));
   const average=(values:Float32Array,stride:number,component:number)=>ids.reduce((sum,id)=>sum+values[id*stride+component],0)/3;
   const x=average(mesh.positions,3,0),z=average(mesh.positions,3,2);
   const distance=mesh.kind==='support'
    ?start+(end-start)*ids.reduce((sum,id)=>sum+Math.floor(id/4),0)/3/(mesh.positions.length/12-1)
    :average(mesh.uvs,2,1)*(mesh.kind==='water'?12:4);
   const nearRoad=mesh.kind==='sand'&&ids.every(id=>Math.abs(mesh.uvs[id*2]*4)<=13.001);
   const hidden=mesh.kind==='support'||nearRoad?insideBlenderHero(distance):insideBlenderFootprint(x,z);
   if(!hidden)kept.push(...ids);
  }
  const visual:RoadMeshData={...mesh,positions:mesh.positions.slice(),normals:mesh.normals?.slice(),uvs:mesh.uvs.slice(),colors:mesh.colors.slice(),indices:new Uint32Array(kept),rayRanges:undefined,artVisualOnly:true};
  return mesh.kind==='sand'?[{...mesh,artContactOnly:true},...(kept.length?[visual]:[])]:kept.length?[visual]:[];
 });
}
