import {loadCoastNature,addCoastNature,type NatureBatch} from './coast-nature';
import type {CoastShadowGroup} from './coast-shadow-layers';
import {farmPlotsInChunk} from './coast-farm-layout';
import {prepareFarmPlot,farmPrepTransferables} from './coast-farm-prep';
import {addCoastResort} from './coast-resort';
import {bridgeSpan,bridgeShoulders,onBridge,type BridgeSpan} from './bridge';
import {rockySections,rockyAt,type RockySection} from './rocky-shoulder';
import type {BankStrength} from './banking';
import {CANYON_BEND,canyonBend} from './canyon-identity';
import {canyonSceneEnvelope} from './grand-canyon-scene';
import {createPilotTrack,pilotSample,pilotWeights,type PilotCandidate} from './pilot-composer';
import type {TripCandidate} from './trip';
import {prepareRoadChunk} from './road-chunk';
import {blenderRoadVisuals} from './blender-road-visuals';
import {insideBlenderFootprint} from './blender-art-coverage';
import {addJourneyScenery} from './scenery';
import * as THREE from 'three';
import {RoadClearance} from './road-clearance';
import {roadOffset,TRIP_MARKER_CENTER_M,tripBarrierRawOffset,coastalCliffDropAtLateral} from './road-profile';
import {selectRoadInterchange,interchangeSceneryClear,type RoadInterchange} from './road-interchange';

const hasModernShoulders=(v:string)=>v==='designer-canyon-v1'||v==='canyon-roadlock-v1'||v==='v0.9-r7'||v==='v0.9-r8'||v==='v0.9-r9'||v==='v0.9-r10'||v==='v0.9-r11'||v==='v0.9-r12';
type Faults={delayMs:number;fromIndex:number;fail:boolean};let faults:Faults={delayMs:0,fromIndex:0,fail:false};
type Request={type:'init';generation:number;stage:PilotCandidate;bank?:BankStrength;blenderArt?:boolean;faults?:Faults}|{type:'faults';generation:number;faults:Faults}|{type:'prepare'|'scenery';generation:number;index:number;start:number;end:number};
let blenderArt=false;
let roadLockArt=false;
let rocks:RockySection[]=[];let bridge:BridgeSpan|undefined;let junction:RoadInterchange|undefined;
let generation=-1,stage:PilotCandidate|undefined,track:ReturnType<typeof createPilotTrack>|undefined;
let roadSamples:THREE.Vector3[]=[];let clearance:RoadClearance;
const worker=self as unknown as {onmessage:(event:MessageEvent<Request>)=>void;postMessage:(message:unknown,transfer?:Transferable[])=>void};
worker.onmessage=async(event:MessageEvent<Request>)=>{
 const request=event.data;
 try{
  if(request.type==='faults'){if(import.meta.env.DEV)faults=request.faults;return;}
  if(import.meta.env.DEV&&request.type==='init'&&request.faults)faults=request.faults;
  if(import.meta.env.DEV&&request.type!=='init'&&request.index>=faults.fromIndex){if(faults.delayMs)await new Promise(r=>setTimeout(r,faults.delayMs));if(faults.fail)throw new Error('Injected worker preparation failure');}

  if(request.type==='init'){const initStart=performance.now();generation=request.generation;stage=request.stage;roadLockArt=!!request.blenderArt&&stage.generatorVersion==='canyon-roadlock-v1';blenderArt=!!request.blenderArt&&stage.generatorVersion==='designer-canyon-v1';track=createPilotTrack(stage,request.bank);rocks=stage.generatorVersion==='v0.9-r6'?rockySections(stage.seed,track.length,d=>pilotWeights(stage!,d)):[];bridge=hasModernShoulders(stage.generatorVersion)&&!['designer-canyon-v1','canyon-roadlock-v1'].includes(stage.generatorVersion)?bridgeSpan(track.sample,d=>pilotSample(stage!,d).halfWidth,d=>pilotWeights(stage!,d),track.length):undefined;junction=selectRoadInterchange(stage,bridge);roadSamples=Array.from({length:Math.ceil(track.length/25)},(_,i)=>track!.sample(i*25).position);clearance=new RoadClearance(roadSamples,d=>pilotSample(stage!,d).halfWidth,stage.id==='ROAD-TRIP-10M');worker.postMessage({type:'initialized',generation,cpuMs:performance.now()-initStart});return;}
  if(request.generation!==generation||!stage||!track)return;
  const t=performance.now(),candidate=stage,current=track,coastUltra=(candidate as TripCandidate).scenerySections?.some(s=>s.id==='coast-ultra-left-sea')??false,shoulders=hasModernShoulders(candidate.generatorVersion)?(d:number)=>bridgeShoulders(d,candidate.seed,bridge):undefined;
  if(request.type==='scenery'&&roadLockArt){worker.postMessage({type:'sceneryPrepared',generation,index:request.index,definitions:[],instances:[],scenery:{instances:0,draws:0},clearance:{queries:0,checks:0,rejected:0},cpuMs:performance.now()-t});return;}
  if(request.type==='scenery'){
   if(coastUltra)await loadCoastNature();
   const before={...clearance.stats};const scene=new THREE.Scene();const scenery=addJourneyScenery(scene,current.sample,current.length,candidate.sceneryAct,candidate.seed,d=>pilotSample(candidate,d).halfWidth,d=>pilotWeights(candidate,d),{start:request.start,end:request.end,roadSamples,clearance,openRoad:candidate.id==='ROAD-TRIP-10M',rocky:candidate.generatorVersion==='v0.9-r5',rockSections:rocks,shoulders,bridge,junction,landmarkSites:(candidate as TripCandidate).scenicLandmarks,scenerySections:(candidate as TripCandidate).scenerySections,
    denseCity:candidate.generatorVersion==='v0.9-r10'||candidate.generatorVersion==='v0.9-r11'||candidate.generatorVersion==='v0.9-r12',
    canyonPrototype:(candidate as TripCandidate).canyonPrototype,designerCut:(candidate as TripCandidate).designerCut,coastUltra});
   if(coastUltra){const nature=addCoastNature(scene,current.sample,request.start,Math.min(request.end,current.length)),resort=addCoastResort(scene,current.sample,d=>pilotSample(candidate,d).halfWidth,request.start,Math.min(request.end,current.length));scenery.instances+=nature.instances+resort.instances;scenery.draws+=nature.draws+resort.draws;}
   const templates=new Map<string,{position:Float32Array;normal:Float32Array;uv:Float32Array;color:Float32Array;index:Uint32Array}>(),instances:{waffleSign?:boolean;coastDrainWater?:boolean;noShadowGround?:boolean;nature?:NatureBatch;shadowGroup?:CoastShadowGroup;template:string;color:number;emissive?:number;emissiveIntensity?:number;vertexColors:boolean;matrices:Float32Array}[]=[],geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
   scene.traverse(object=>{if(!(object instanceof THREE.InstancedMesh))return;const g=object.geometry,m=object.material as THREE.MeshStandardMaterial;geometries.add(g);materials.add(m);
    if(!templates.has(g.uuid)){const attr=(name:string)=>new Float32Array(g.getAttribute(name)?.array??[]);templates.set(g.uuid,{position:attr('position'),normal:attr('normal'),uv:attr('uv'),color:attr('color'),index:new Uint32Array(g.index?.array??[])});}
    let matrices=new Float32Array(object.instanceMatrix.array);
    if(blenderArt){g.computeBoundingSphere();const kept:number[]=[];const pose=new THREE.Matrix4(),scale=new THREE.Vector3();for(let i=0;i<object.count;i++){object.getMatrixAt(i,pose);scale.setFromMatrixScale(pose);const radius=(g.boundingSphere?.radius??0)*Math.max(scale.x,scale.y,scale.z);if(!insideBlenderFootprint(pose.elements[12],pose.elements[14],radius))kept.push(...pose.elements);}matrices=new Float32Array(kept);}
    if(matrices.length)instances.push({waffleSign:object.userData.waffleSign,coastDrainWater:!!object.userData.coastDrainWater,noShadowGround:!!object.userData.noShadowGround,nature:object.userData.nature,shadowGroup:object.userData.coastShadowGroup as CoastShadowGroup|undefined,template:g.uuid,color:m.color.getHex(),...(m.emissiveIntensity?{emissive:m.emissive.getHex(),emissiveIntensity:m.emissiveIntensity}:{}),vertexColors:m.vertexColors,matrices});
   });
   const definitions=[...templates].map(([id,data])=>({id,...data})),transfer:Transferable[]=[];for(const x of definitions)transfer.push(x.position.buffer,x.normal.buffer,x.uv.buffer,x.color.buffer,x.index.buffer);for(const x of instances)transfer.push(x.matrices.buffer);
   for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
   // Finite stage: all expensive, deterministic field samples and canopy vertices
   // are computed here, never synchronously during the driver's render frame.
   const farmPreparationStart=performance.now();
   const farmPreps=coastUltra?farmPlotsInChunk(request.start,request.end).map(plot=>prepareFarmPlot(plot,current.sample)):[];
   const farmPrepCpuMs=performance.now()-farmPreparationStart;
   for(const prep of farmPreps)transfer.push(...farmPrepTransferables(prep));
   const visibleScenery=blenderArt?{...scenery,instances:instances.reduce((n,i)=>n+i.matrices.length/16,0),draws:instances.length}:scenery;
   worker.postMessage({type:'sceneryPrepared',generation,index:request.index,definitions,instances,farmPreps,farmPrepCpuMs,scenery:visibleScenery,clearance:{queries:clearance.stats.queries-before.queries,checks:clearance.stats.checks-before.checks,rejected:clearance.stats.rejected-before.rejected},cpuMs:performance.now()-t},transfer);return;
  }
  const rawMeshes=prepareRoadChunk(current.sample,d=>pilotSample(candidate,d).halfWidth,d=>pilotWeights(candidate,d),request.start,request.end,current.length,candidate.id==='ROAD-TRIP-10M'&&candidate.seed===1,(candidate.generatorVersion==='v0.9-r4'||(candidate.generatorVersion==='v0.9-r5'||(candidate.generatorVersion==='v0.9-r6'||hasModernShoulders(candidate.generatorVersion)))) ,rocks,shoulders,bridge,true,junction,(candidate as TripCandidate).scenerySections,(candidate as TripCandidate).canyonPrototype,blenderArt,candidate.generatorVersion==='canyon-roadlock-v1');
  // Full-route static art replaces only visual terrain. Original sand remains a contact surface.
  const meshes=roadLockArt?rawMeshes.filter(m=>!['grass','water','surf','support'].includes(m.kind)).map(m=>m.kind==='sand'?{...m,artContactOnly:true}:m):blenderArt?blenderRoadVisuals(rawMeshes,request.start,request.end):rawMeshes;
  const matrices=[[],[],[],[]] as number[][],dummy=new THREE.Object3D();
  let markerBank=0,markerYaw=0;const record=(which:number,p:THREE.Vector3,yaw=markerYaw)=>{dummy.position.copy(p);dummy.rotation.set(0,yaw,markerBank,'YXZ');dummy.scale.set(1,1,1);dummy.updateMatrix();matrices[which].push(...dummy.matrix.elements);};
  for(let d=Math.ceil(request.start/12)*12;d<request.end;d+=12){const p=current.sample(d),width=pilotSample(candidate,d).halfWidth,yaw=Math.atan2(p.tangent.x,p.tangent.z);markerBank=shoulders?-Math.atan(p.right.y):0;markerYaw=shoulders?-p.roadHeading:0;if(onBridge(d,bridge)||candidate.generatorVersion==='canyon-roadlock-v1'||coastUltra)continue;
   // R2.1 removes city-style black/yellow posts from the authored canyon.
   // Sparse wooden markers live in the scenery batch instead; guardrails and
   // their existing collision boundaries remain in place.
   const canyonScene=(candidate as TripCandidate).canyonPrototype;
   if(canyonScene&&(canyonScene.authored||canyonScene.vista)&&canyonSceneEnvelope(canyonScene,d)>.35)continue;
   const shoulderWidth=shoulders?.(d);
   const markerOffset=(side:-1|1)=>shoulderWidth
     ?roadOffset(tripBarrierRawOffset(side,TRIP_MARKER_CENTER_M,shoulderWidth),width,shoulderWidth)
     :roadOffset(side*12.4,width);
   const cliffLeft=!!shoulderWidth&&coastalCliffDropAtLateral(
     p.position.y,p.right.y,markerOffset(-1),width,shoulderWidth,pilotWeights(candidate,d)[1],
   )>3;
   if(candidate.id==='ROAD-TRIP-10M'&&candidate.seed===1&&canyonBend(d)){record(0,p.position.clone().addScaledVector(p.right,roadOffset(CANYON_BEND.railOffset,width)).add(new THREE.Vector3(0,.5,0)));continue;}
   if(!coastUltra&&!rockyAt(d,-1,rocks)&&!cliffLeft)record(0,p.position.clone().addScaledVector(p.right,markerOffset(-1)).add(new THREE.Vector3(0,.58,0)));
   for(const side of [-1,1] as const){if((coastUltra&&side===-1)||rockyAt(d,side,rocks)||(side===-1&&cliffLeft)||(junction&&interchangeSceneryClear(junction,d,side)))continue;const base=p.position.clone().addScaledVector(p.right,markerOffset(side));record(1,base.clone().add(new THREE.Vector3(0,.8,0)),yaw);record(2,base.clone().add(new THREE.Vector3(0,1.45,0)),yaw);record(3,base.clone().add(new THREE.Vector3(0,1.05,0)),yaw);}
  }
  const roadside=matrices.map(x=>new Float32Array(x));
  const prepared=meshes.map(m=>{if(m.normals)return {...m,normals:m.normals};const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));g.computeVertexNormals();const normals=new Float32Array(g.getAttribute('normal').array);g.dispose();return {...m,normals};});
  const transfer:Transferable[]=prepared.flatMap(m=>[m.positions.buffer,m.uvs.buffer,m.colors.buffer,m.indices.buffer,m.normals.buffer]);for(const a of roadside)transfer.push(a.buffer);
  worker.postMessage({type:'prepared',generation,index:request.index,meshes:prepared,roadside,cpuMs:performance.now()-t},transfer);
 }catch(error){worker.postMessage({type:'error',generation:request.generation,request:request.type,index:'index' in request?request.index:-1,message:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined});}
};
