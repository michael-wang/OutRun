import {rockySections,rockyAt,type RockySection} from './rocky-shoulder';
import type {BankStrength} from './banking';
import {CANYON_BEND,canyonBend} from './canyon-identity';
import {createPilotTrack,pilotSample,pilotWeights,type PilotCandidate} from './pilot-composer';
import {prepareRoadChunk} from './road-chunk';
import {addJourneyScenery} from './scenery';
import * as THREE from 'three';
import {RoadClearance} from './road-clearance';
import {roadOffset} from './road-profile';

type Request={type:'init';generation:number;stage:PilotCandidate;bank?:BankStrength}|{type:'prepare'|'scenery';generation:number;index:number;start:number;end:number};
let rocks:RockySection[]=[];
let generation=-1,stage:PilotCandidate|undefined,track:ReturnType<typeof createPilotTrack>|undefined;
let roadSamples:THREE.Vector3[]=[];let clearance:RoadClearance;
const worker=self as unknown as {onmessage:(event:MessageEvent<Request>)=>void;postMessage:(message:unknown,transfer?:Transferable[])=>void};
worker.onmessage=(event:MessageEvent<Request>)=>{
 const request=event.data;
 try{
  if(request.type==='init'){const initStart=performance.now();generation=request.generation;stage=request.stage;track=createPilotTrack(stage,request.bank);rocks=stage.generatorVersion==='v0.9-r6'?rockySections(stage.seed,track.length,d=>pilotWeights(stage!,d)):[];roadSamples=Array.from({length:Math.ceil(track.length/25)},(_,i)=>track!.sample(i*25).position);clearance=new RoadClearance(roadSamples,d=>pilotSample(stage!,d).halfWidth,stage.id==='ROAD-TRIP-10M');worker.postMessage({type:'initialized',generation,cpuMs:performance.now()-initStart});return;}
  if(request.generation!==generation||!stage||!track)return;
  const t=performance.now(),candidate=stage,current=track;
  if(request.type==='scenery'){
   const before={...clearance.stats};const scene=new THREE.Scene();const scenery=addJourneyScenery(scene,current.sample,current.length,candidate.sceneryAct,candidate.seed,d=>pilotSample(candidate,d).halfWidth,d=>pilotWeights(candidate,d),{start:request.start,end:request.end,roadSamples,clearance,openRoad:candidate.id==='ROAD-TRIP-10M',rocky:candidate.generatorVersion==='v0.9-r5',rockSections:rocks});
   const templates=new Map<string,{position:Float32Array;normal:Float32Array;uv:Float32Array;color:Float32Array;index:Uint32Array}>(),instances:{template:string;color:number;vertexColors:boolean;matrices:Float32Array}[]=[],geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
   scene.traverse(object=>{if(!(object instanceof THREE.InstancedMesh))return;const g=object.geometry,m=object.material as THREE.MeshStandardMaterial;geometries.add(g);materials.add(m);
    if(!templates.has(g.uuid)){const attr=(name:string)=>new Float32Array(g.getAttribute(name)?.array??[]);templates.set(g.uuid,{position:attr('position'),normal:attr('normal'),uv:attr('uv'),color:attr('color'),index:new Uint32Array(g.index?.array??[])});}
    instances.push({template:g.uuid,color:m.color.getHex(),vertexColors:m.vertexColors,matrices:new Float32Array(object.instanceMatrix.array)});
   });
   const definitions=[...templates].map(([id,data])=>({id,...data})),transfer:Transferable[]=[];for(const x of definitions)transfer.push(x.position.buffer,x.normal.buffer,x.uv.buffer,x.color.buffer,x.index.buffer);for(const x of instances)transfer.push(x.matrices.buffer);
   for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
   worker.postMessage({type:'sceneryPrepared',generation,index:request.index,definitions,instances,scenery,clearance:{queries:clearance.stats.queries-before.queries,checks:clearance.stats.checks-before.checks,rejected:clearance.stats.rejected-before.rejected},cpuMs:performance.now()-t},transfer);return;
  }
  const meshes=prepareRoadChunk(current.sample,d=>pilotSample(candidate,d).halfWidth,d=>pilotWeights(candidate,d),request.start,request.end,current.length,candidate.id==='ROAD-TRIP-10M'&&candidate.seed===1,(candidate.generatorVersion==='v0.9-r4'||(candidate.generatorVersion==='v0.9-r5'||candidate.generatorVersion==='v0.9-r6')) ,rocks);
  const matrices=[[],[],[],[]] as number[][],dummy=new THREE.Object3D();
  const record=(which:number,p:THREE.Vector3,yaw=0)=>{dummy.position.copy(p);dummy.rotation.set(0,yaw,0);dummy.scale.set(1,1,1);dummy.updateMatrix();matrices[which].push(...dummy.matrix.elements);};
  for(let d=Math.ceil(request.start/12)*12;d<request.end;d+=12){const p=current.sample(d),width=pilotSample(candidate,d).halfWidth,yaw=Math.atan2(p.tangent.x,p.tangent.z);
   if(candidate.id==='ROAD-TRIP-10M'&&candidate.seed===1&&canyonBend(d)){record(0,p.position.clone().addScaledVector(p.right,roadOffset(CANYON_BEND.railOffset,width)).add(new THREE.Vector3(0,.5,0)));continue;}
   if(!rockyAt(d,-1,rocks))record(0,p.position.clone().addScaledVector(p.right,roadOffset(-12.4,width)).add(new THREE.Vector3(0,.58,0)));
   for(const side of [-1,1]){if(rockyAt(d,side,rocks))continue;const base=p.position.clone().addScaledVector(p.right,roadOffset(side*12.4,width));record(1,base.clone().add(new THREE.Vector3(0,.8,0)),yaw);record(2,base.clone().add(new THREE.Vector3(0,1.45,0)),yaw);record(3,base.clone().add(new THREE.Vector3(0,1.05,0)),yaw);}
  }
  const roadside=matrices.map(x=>new Float32Array(x));
  const prepared=meshes.map(m=>{if(m.normals)return {...m,normals:m.normals};const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));g.computeVertexNormals();const normals=new Float32Array(g.getAttribute('normal').array);g.dispose();return {...m,normals};});
  const transfer:Transferable[]=prepared.flatMap(m=>[m.positions.buffer,m.uvs.buffer,m.colors.buffer,m.indices.buffer,m.normals.buffer]);for(const a of roadside)transfer.push(a.buffer);
  worker.postMessage({type:'prepared',generation,index:request.index,meshes:prepared,roadside,cpuMs:performance.now()-t},transfer);
 }catch(error){worker.postMessage({type:'error',generation:request.generation,message:error instanceof Error?error.message:String(error)});}
};
