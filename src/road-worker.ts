import {buildCoastGroundShadows,type CoastShadowAnchor} from './coast-dusk-shadows';
import {loadCoastNature,addCoastNature,type NatureBatch} from './coast-nature';
import {addVergeGrass} from './coast-verge-grass';
import type {CoastShadowGroup} from './coast-shadow-layers';
import {farmPlotsInChunk} from './coast-farm-layout';
import {prepareFarmPlot,farmPrepTransferables} from './coast-farm-prep';
import {loadFarmGround} from './coast-farm-ground';
import {addCoastResort} from './coast-resort';
import {bridgeSpan,bridgeShoulders,onBridge,type BridgeSpan} from './bridge';
import {rockySections,rockyAt,type RockySection} from './rocky-shoulder';
import type {BankStrength} from './banking';
import {CANYON_BEND,canyonBend} from './canyon-identity';
import {canyonSceneEnvelope} from './grand-canyon-scene';
import type {PilotCandidate,createPilotTrack} from './pilot-composer';
import {coastWorkerRoad} from './content/coast-worker-road';
import type {ScenerySection} from './scenery-cross-section';
import type {JourneyLandmark} from './scenery';
import type {GrandCanyonScene} from './grand-canyon-scene';
import type {DesignerCut} from './designer-canyon';
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
type InitRequest={type:'init';generation:number;bank?:BankStrength;blenderArt?:boolean;bakedFarmGround?:boolean;mobileShadows?:boolean;faults?:Faults}
 & ({coastStage:'coast';stage?:never}|{stage:PilotCandidate;coastStage?:never});
type Request=InitRequest|{type:'faults';generation:number;faults:Faults}|{type:'prepare'|'scenery';generation:number;index:number;start:number;end:number};
let farmGround:Awaited<ReturnType<typeof loadFarmGround>>|undefined;
let blenderArt=false,mobileShadows=false;
let roadLockArt=false;
let rocks:RockySection[]=[];let bridge:BridgeSpan|undefined;let junction:RoadInterchange|undefined;
/** Worker renderer needs scene metadata, not the Trip/Pilot authoring shape. */
type WorkerSceneStage={
 id:string;seed:number;sceneryAct:number;generatorVersion:string;
 scenerySections?:readonly ScenerySection[];
 scenicLandmarks?:readonly JourneyLandmark[];
 canyonPrototype?:GrandCanyonScene;
 designerCut?:DesignerCut;
};
let generation=-1,stage:WorkerSceneStage|undefined,track:ReturnType<typeof createPilotTrack>|undefined;
let halfAt:(distance:number)=>number=()=>7;
let weightsAt:(distance:number)=>number[]=()=>[1,0,0];
let roadSamples:THREE.Vector3[]=[];let clearance:RoadClearance;
const worker=self as unknown as {onmessage:(event:MessageEvent<Request>)=>void;postMessage:(message:unknown,transfer?:Transferable[])=>void};
worker.onmessage=async(event:MessageEvent<Request>)=>{
 const request=event.data;
 try{
  if(request.type==='faults'){if(import.meta.env.DEV)faults=request.faults;return;}
  if(import.meta.env.DEV&&request.type==='init'&&request.faults)faults=request.faults;
  if(request.type==='init'){
   // A slow or offline fetch must never hold up the road or the first field.
   mobileShadows=!!request.mobileShadows;
   farmGround=undefined;
   if(request.bakedFarmGround)void loadFarmGround().then(rows=>{
    if(generation===request.generation)farmGround=rows;
   }).catch(()=>{/* The original terrain sampler remains available. */});
  }
  if(import.meta.env.DEV&&request.type!=='init'&&request.index>=faults.fromIndex){if(faults.delayMs)await new Promise(r=>setTimeout(r,faults.delayMs));if(faults.fail)throw new Error('Injected worker preparation failure');}

  if(request.type==='init'){const initStart=performance.now();generation=request.generation;
   let legacy:PilotCandidate|undefined;
   if(request.coastStage==='coast'){
    const coast=coastWorkerRoad(undefined,request.bank);
    stage=coast.stage;track=coast.track;
    halfAt=coast.halfAt;weightsAt=coast.weightsAt;
   }else{
    // Old Pilot code is loaded only if a non-coast stage requests it.
    legacy=request.stage;
    const pilot=await import('./pilot-composer');
    stage=legacy;track=pilot.createPilotTrack(legacy,request.bank);
    halfAt=d=>pilot.pilotSample(legacy!,d).halfWidth;
    weightsAt=d=>pilot.pilotWeights(legacy!,d);
   }
   if(!stage||!track)throw Error('Missing road stage in Worker init');
   const current=track;
   roadLockArt=!!request.blenderArt&&stage.generatorVersion==='canyon-roadlock-v1';
   blenderArt=!!request.blenderArt&&stage.generatorVersion==='designer-canyon-v1';
   rocks=stage.generatorVersion==='v0.9-r6'?rockySections(stage.seed,current.length,weightsAt):[];
   bridge=hasModernShoulders(stage.generatorVersion)&&!['designer-canyon-v1','canyon-roadlock-v1'].includes(stage.generatorVersion)
    ?bridgeSpan(current.sample,halfAt,weightsAt,current.length):undefined;
   junction=legacy?selectRoadInterchange(legacy,bridge):undefined;
   roadSamples=Array.from({length:Math.ceil(current.length/25)},(_,i)=>current.sample(i*25).position);
   clearance=new RoadClearance(roadSamples,halfAt,stage.id==='ROAD-TRIP-10M');
   worker.postMessage({type:'initialized',generation,cpuMs:performance.now()-initStart});return;
  }
  if(request.generation!==generation||!stage||!track)return;
  const t=performance.now(),candidate=stage,current=track,coastUltra=candidate.scenerySections?.some(s=>s.id==='coast-ultra-left-sea')??false,shoulders=hasModernShoulders(candidate.generatorVersion)?(d:number)=>bridgeShoulders(d,candidate.seed,bridge):undefined;
  if(request.type==='scenery'&&roadLockArt){worker.postMessage({type:'sceneryPrepared',generation,index:request.index,definitions:[],instances:[],scenery:{instances:0,draws:0},clearance:{queries:0,checks:0,rejected:0},cpuMs:performance.now()-t});return;}
  if(request.type==='scenery'){
   if(coastUltra)await loadCoastNature();
   if(request.generation!==generation)return;
   const essentialShadows:CoastShadowAnchor[]|undefined=coastUltra&&mobileShadows?[]:undefined;
   const before={...clearance.stats};const scene=new THREE.Scene();const scenery=addJourneyScenery(scene,current.sample,current.length,candidate.sceneryAct,candidate.seed,halfAt,weightsAt,{start:request.start,end:request.end,roadSamples,clearance,openRoad:candidate.id==='ROAD-TRIP-10M',rocky:candidate.generatorVersion==='v0.9-r5',rockSections:rocks,shoulders,bridge,junction,landmarkSites:candidate.scenicLandmarks,scenerySections:candidate.scenerySections,
    denseCity:candidate.generatorVersion==='v0.9-r10'||candidate.generatorVersion==='v0.9-r11'||candidate.generatorVersion==='v0.9-r12',
    canyonPrototype:candidate.canyonPrototype,designerCut:candidate.designerCut,coastUltra,essentialShadows});
   if(coastUltra){
    const end=Math.min(request.end,current.length),halfAt=(d:number)=>pilotSample(candidate,d).halfWidth;
    const batches=[addCoastNature(scene,current.sample,request.start,end),addCoastResort(scene,current.sample,halfAt,request.start,end),
     addVergeGrass(scene,current.sample,halfAt,shoulders,request.start,end)];
    for(const batch of batches){scenery.instances+=batch.instances;scenery.draws+=batch.draws;}
   }
   const templates=new Map<string,{position:Float32Array;normal:Float32Array;uv:Float32Array;color:Float32Array;index:Uint32Array}>(),instances:{lampGround?:boolean;waffleSign?:boolean;coastDrainWater?:boolean;noShadowGround?:boolean;nature?:NatureBatch;shadowGroup?:CoastShadowGroup;template:string;color:number;emissive?:number;emissiveIntensity?:number;vertexColors:boolean;matrices:Float32Array}[]=[],geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
   scene.traverse(object=>{if(!(object instanceof THREE.InstancedMesh))return;const g=object.geometry,m=object.material as THREE.MeshStandardMaterial;geometries.add(g);materials.add(m);
    if(!templates.has(g.uuid)){const attr=(name:string)=>new Float32Array(g.getAttribute(name)?.array??[]);templates.set(g.uuid,{position:attr('position'),normal:attr('normal'),uv:attr('uv'),color:attr('color'),index:new Uint32Array(g.index?.array??[])});}
    let matrices=new Float32Array(object.instanceMatrix.array);
    if(blenderArt){g.computeBoundingSphere();const kept:number[]=[];const pose=new THREE.Matrix4(),scale=new THREE.Vector3();for(let i=0;i<object.count;i++){object.getMatrixAt(i,pose);scale.setFromMatrixScale(pose);const radius=(g.boundingSphere?.radius??0)*Math.max(scale.x,scale.y,scale.z);if(!insideBlenderFootprint(pose.elements[12],pose.elements[14],radius))kept.push(...pose.elements);}matrices=new Float32Array(kept);}
    if(matrices.length)instances.push({...(!mobileShadows&&(g.name==='coast-taiwan-roadside-ditch'||object.userData.noShadowGround)?{lampGround:true}:{}),waffleSign:object.userData.waffleSign,coastDrainWater:!!object.userData.coastDrainWater,noShadowGround:!!object.userData.noShadowGround,nature:object.userData.nature,shadowGroup:object.userData.coastShadowGroup as CoastShadowGroup|undefined,template:g.uuid,color:m.color.getHex(),...(m.emissiveIntensity?{emissive:m.emissive.getHex(),emissiveIntensity:m.emissiveIntensity}:{}),vertexColors:m.vertexColors,matrices});
   });
   const definitions=[...templates].map(([id,data])=>({id,...data})),transfer:Transferable[]=[];for(const x of definitions)transfer.push(x.position.buffer,x.normal.buffer,x.uv.buffer,x.color.buffer,x.index.buffer);for(const x of instances)transfer.push(x.matrices.buffer);
   for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
   // Finite stage: all expensive, deterministic field samples and canopy vertices
   // are computed here, never synchronously during the driver's render frame.
   const farmPreparationStart=performance.now();
   const plots=coastUltra?farmPlotsInChunk(request.start,request.end):[];
   const farmPreps=plots.map(plot=>prepareFarmPlot(plot,current.sample,farmGround?.(plot)));
   const farmPrepCpuMs=performance.now()-farmPreparationStart;
   for(const prep of farmPreps)transfer.push(...farmPrepTransferables(prep));
   let essentialProjection;
   if(essentialShadows?.length){
    const {geometry}=buildCoastGroundShadows(current.sample,essentialShadows,current.length,halfAt);
    const positions=geometry.attributes.position.array as Float32Array,alpha=geometry.attributes.shadowAlpha.array as Float32Array;
    const index=geometry.index!.array as Uint16Array|Uint32Array;
    if(index.length){
     for(let i=0;i<alpha.length;i++)alpha[i]*=.52;
     essentialProjection={positions,alpha,index};
     transfer.push(positions.buffer,alpha.buffer,index.buffer);
    }
    geometry.dispose();
   }
   const visibleScenery=blenderArt?{...scenery,instances:instances.reduce((n,i)=>n+i.matrices.length/16,0),draws:instances.length}:scenery;
   worker.postMessage({type:'sceneryPrepared',generation,index:request.index,definitions,instances,farmPreps,farmPrepCpuMs,essentialProjection,scenery:visibleScenery,clearance:{queries:clearance.stats.queries-before.queries,checks:clearance.stats.checks-before.checks,rejected:clearance.stats.rejected-before.rejected},cpuMs:performance.now()-t},transfer);return;
  }
  const rawMeshes=prepareRoadChunk(current.sample,halfAt,weightsAt,request.start,request.end,current.length,candidate.id==='ROAD-TRIP-10M'&&candidate.seed===1,(candidate.generatorVersion==='v0.9-r4'||(candidate.generatorVersion==='v0.9-r5'||(candidate.generatorVersion==='v0.9-r6'||hasModernShoulders(candidate.generatorVersion)))) ,rocks,shoulders,bridge,true,junction,candidate.scenerySections,candidate.canyonPrototype,blenderArt,candidate.generatorVersion==='canyon-roadlock-v1');
  // Full-route static art replaces only visual terrain. Original sand remains a contact surface.
  const meshes=roadLockArt?rawMeshes.filter(m=>!['grass','water','surf','support'].includes(m.kind)).map(m=>m.kind==='sand'?{...m,artContactOnly:true}:m):blenderArt?blenderRoadVisuals(rawMeshes,request.start,request.end):rawMeshes;
  const matrices=[[],[],[],[]] as number[][],dummy=new THREE.Object3D();
  let markerBank=0,markerYaw=0;const record=(which:number,p:THREE.Vector3,yaw=markerYaw)=>{dummy.position.copy(p);dummy.rotation.set(0,yaw,markerBank,'YXZ');dummy.scale.set(1,1,1);dummy.updateMatrix();matrices[which].push(...dummy.matrix.elements);};
  for(let d=Math.ceil(request.start/12)*12;d<request.end;d+=12){const p=current.sample(d),width=pilotSample(candidate,d).halfWidth,yaw=Math.atan2(p.tangent.x,p.tangent.z);markerBank=shoulders?-Math.atan(p.right.y):0;markerYaw=shoulders?-p.roadHeading:0;if(onBridge(d,bridge)||candidate.generatorVersion==='canyon-roadlock-v1'||coastUltra)continue;
   // R2.1 removes city-style black/yellow posts from the authored canyon.
   // Sparse wooden markers live in the scenery batch instead; guardrails and
   // their existing collision boundaries remain in place.
   const canyonScene=candidate.canyonPrototype;
   if(canyonScene&&(canyonScene.authored||canyonScene.vista)&&canyonSceneEnvelope(canyonScene,d)>.35)continue;
   const shoulderWidth=shoulders?.(d);
   const markerOffset=(side:-1|1)=>shoulderWidth
     ?roadOffset(tripBarrierRawOffset(side,TRIP_MARKER_CENTER_M,shoulderWidth),width,shoulderWidth)
     :roadOffset(side*12.4,width);
   const cliffLeft=!!shoulderWidth&&coastalCliffDropAtLateral(
     p.position.y,p.right.y,markerOffset(-1),width,shoulderWidth,weightsAt(d)[1],
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
