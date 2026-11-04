import {waffleSignTexture} from './vehicle-model';
import type {NatureBatch} from './coast-nature';
import {natureVisible} from './coast-performance';
import * as THREE from 'three';
import type {BankStrength} from './banking';
import type {PilotCandidate} from './pilot-composer';
import type {RoadMeshData} from './road-chunk';
import {loadCoastFarm,createFarmPlot,warmFarmMeshes,type FarmAssets,type FarmPatch} from './coast-farm';
import {farmPlotsInChunk} from './coast-farm-layout';
import type {PreparedFarmPlot} from './coast-farm-prep';
import {SceneTaskProfiler,SCENE_TASK_SOFT_BUDGET_MS,type SceneTaskKind} from './scene-task-profiler';

type RoadData=RoadMeshData&{normals:Float32Array};
type Definition={id:string;position:Float32Array;normal:Float32Array;uv:Float32Array;color:Float32Array;index:Uint32Array};
type Instance={waffleSign?:boolean;nature?:NatureBatch;template:string;color:number;emissive?:number;emissiveIntensity?:number;vertexColors:boolean;matrices:Float32Array};
type Chunk={index:number;objects:THREE.Object3D[];groups:Partial<Record<string,THREE.Group>>;geometries:Set<THREE.BufferGeometry>;road:'missing'|'working'|'ready';scenery:'missing'|'working'|'ready'};
type Phase='road'|'scenery';
type Lifecycle={index:number;start:number;end:number;kind:Phase;generation:number;requestedAt:number;responseAt?:number;workerCpuMs?:number;responseMs?:number;commitStart?:number;commitEnd?:number;commitCpuMs:number;readyAt?:number;generatedInstances?:number;attachedInstances:number;discardedTasks:number;error?:string;retiredAt?:number};
type Work={index:number;priority:number;run:()=>void;record?:Lifecycle;kind?:SceneTaskKind;detail?:string;resourceId?:number};
/** Nearest-rank quantiles over the bounded retained sample set. */
export function latencyDistribution(values:number[]){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b),q=(p:number)=>sorted.length?sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]:null;return {count:sorted.length,p50:q(.5),p95:q(.95),p99:q(.99),worst:q(1)};}
export interface SceneAnnotation {distance:number;create:()=>THREE.Mesh[]}
/** Rolling, fixed-size scene allocation. The worker owns numeric preparation;
 * only short object-creation operations are performed on the render thread. */
export class StreamedScene {
 readonly chunkLength=1000;readonly ahead=5000;readonly behind=1000;
 readonly groups:Record<string,THREE.Group>={};
 readonly history:{kind:string;index:number;ms:number}[]=[];
 private worker!:Worker;private bank?:BankStrength;private pending?:{kind:string;index:number;since:number};private retries=0;private failures:{message:string;kind:string;index:number;at:number}[]=[];private testFaults={delayMs:0,fromIndex:0,fail:false};private chunks=new Map<number,Chunk>();private desired=new Set<number>();private work:Work[]=[];
 private retiring:Work[]=[];
 private readonly taskProfiler=typeof location!=='undefined'&&(()=>{
  const p=new URLSearchParams(location.search);return p.get('fpsdiag')==='1'||p.get('streamdiag')==='1';
 })()?new SceneTaskProfiler():undefined;
 private diagnostics=typeof location!=='undefined'&&(()=>{const p=new URLSearchParams(location.search);return p.get('streamdiag')==='1'||(p.get('streamhud')==='1'&&(import.meta.env.DEV||p.get('qa')==='1'));})();
 private lifecycle:Lifecycle[]=[];private activeRecord?:Lifecycle;private discardedResponses=0;private discardedTasks=0;
 // Scalar records only: never retain geometry or transferable buffers.
 private recordRequest(index:number,kind:Phase,since:number){if(!this.diagnostics)return;const r:Lifecycle={index,start:index*this.chunkLength,end:Math.min(this.length,(index+1)*this.chunkLength),kind,generation:this.generation,requestedAt:since,commitCpuMs:0,attachedInstances:0,discardedTasks:0};this.lifecycle.push(r);if(this.lifecycle.length>256)this.lifecycle.shift();this.activeRecord=r;}

 private waffleTexture?:THREE.Texture;
 private natureTextures=new Map<string,THREE.Texture>();
 private readonly mobile=typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches;
 private natureTextureLoads=0;
 private configureNatureMaterial(material:THREE.MeshStandardMaterial,nature:NatureBatch){
  material.side=THREE.DoubleSide;
  material.alphaTest=nature.alpha?.2:0;
  if(nature.alpha){material.emissive.set(0x40572c);material.emissiveIntensity=.28;}
  if(!nature.texture)return;
  let texture=this.natureTextures.get(nature.texture);
  if(!texture){
   this.natureTextureLoads++;
   texture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/coast-nature/${nature.texture}`,
    ()=>{this.natureTextureLoads--;},undefined,()=>{
     this.natureTextureLoads--;this.errorMessage=`Coastal foliage texture failed: ${nature.texture}`;
    });
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=1;
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
   this.natureTextures.set(nature.texture,texture);
  }
  material.map=texture;
 }
 private bounds='';
 private annotationMaterials=new Set<THREE.Material>();
 private clippingPlanes:THREE.Plane[]=[];
 private environmentOpacity=1;private clippedMaterials=new Set<THREE.Material>();
 setEnvironmentOpacity(value:number){this.environmentOpacity=value;for(const m of this.clippedMaterials)m.opacity=m.userData.journeyBaseOpacity*value;}
 setClippingPlanes(planes:THREE.Plane[]){this.clippingPlanes=planes;for(const group of Object.values(this.groups))group.traverse(o=>this.clipMaterial(o));}
 private clipMaterial(o:THREE.Object3D){if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.clippingPlanes!==this.clippingPlanes){m.clippingPlanes=this.clippingPlanes;m.clipShadows=true;m.userData.journeyBaseOpacity??=m.opacity;m.alphaHash=true;m.opacity=m.userData.journeyBaseOpacity*this.environmentOpacity;this.clippedMaterials.add(m);m.needsUpdate=true;}}

 private sceneryCounts=new Map<number,{instances:number;draws:number;clearance:unknown}>();
 private busy=false;private initialized=false;private position=0;private materials=new Map<string,THREE.MeshStandardMaterial>();
 private markerGeometries=[new THREE.BoxGeometry(.15,1.2,.15),new THREE.BoxGeometry(.38,1.6,.3),new THREE.BoxGeometry(.42,.3,.34),new THREE.BoxGeometry(.4,.35,.32)];
 private markerMaterials:THREE.Material[];
 private uploadOwners=new WeakMap<object,number>();
 private generation=1;private errorMessage='';
 private farmWorkerPrepared={chunks:0,plots:0,workerCpuMs:0,lastChunk:-1,lastMs:0,missingPlots:0};
 private farmAssets?:FarmAssets;private farms=new Map<number,FarmPatch[]>();private disposed=false;private farmGpuWarmed=false;private farmWarmTask?:Promise<void>;
 private farmWarmIds=new Set<number>();
 private farmWarmStartedAt=0;
 private farmWarmElapsedBeforeBatch=0;
 private startupFarmWarm={running:false,done:0,total:0,elapsedMs:0,compileWallMs:0,uploadSubmitMs:0,maxObjectSubmitMs:0,batches:0};
 warmFarm(renderer:THREE.WebGLRenderer,camera:THREE.Camera):Promise<void>|undefined{
  if(!this.farmSample||this.disposed||(!this.farmGpuWarmed&&![2,3,4].every(i=>this.chunks.get(i)?.scenery==='ready')))return;
  if(this.farmWarmTask)return this.farmWarmTask;
  const patches=[...this.farms.values()].flat().filter(p=>!this.farmWarmIds.has(p.plot.id));if(!patches.length)return;
  patches.forEach(p=>this.farmWarmIds.add(p.plot.id));
  const warmStart=performance.now(),info=this.startupFarmWarm,previous={...this.startupFarmWarm};
  this.farmWarmStartedAt=warmStart;this.farmWarmElapsedBeforeBatch=previous.elapsedMs;
  info.running=true;info.batches++;
  const instrument=typeof location!=='undefined'&&new URLSearchParams(location.search).get('startupdiag')==='1';
  return this.farmWarmTask=warmFarmMeshes(renderer,camera,this.scene,patches,()=>!this.disposed,instrument?p=>{
   info.done=previous.done+p.done;info.total=previous.total+p.total;info.elapsedMs=previous.elapsedMs+performance.now()-warmStart;
   info.compileWallMs=previous.compileWallMs+p.compileWallMs;info.uploadSubmitMs=previous.uploadSubmitMs+p.uploadSubmitMs;
   info.maxObjectSubmitMs=Math.max(previous.maxObjectSubmitMs,p.maxObjectSubmitMs);
  }:undefined).then(()=>{info.running=false;info.elapsedMs=previous.elapsedMs+performance.now()-warmStart;this.farmGpuWarmed=true;this.farmWarmTask=undefined;})
   .catch(e=>{info.running=false;info.elapsedMs=previous.elapsedMs+performance.now()-warmStart;this.errorMessage=`Farm warmup failed: ${String(e)}`;console.error(this.errorMessage);});
 }
 updateFarm(time:number){if(!this.farmAssets)return;this.farmAssets.time.value=time;for(const patches of this.farms.values())for(const p of patches)p.update(this.position,time);}
 get farmStats(){return [...this.farms.values()].flatMap(p=>p.map(f=>f.stats()));}
 /** Opt-in common streaming-task cost attribution (read-only). */
 get sceneTaskProfile(){return this.taskProfiler?.snapshot()??null;}
 get farmWorkerStats(){return {...this.farmWorkerPrepared,workerCpuMs:Math.round(this.farmWorkerPrepared.workerCpuMs),lastMs:Math.round(this.farmWorkerPrepared.lastMs)};}
 get sceneTaskSpikes(){return this.taskProfiler?.recentSlowTasks()??[];}
 constructor(private scene:THREE.Scene,private stage:PilotCandidate,private length:number,private roadMaterials:Record<RoadMeshData['kind'],THREE.Material>,private annotations:SceneAnnotation[]=[],bank?:BankStrength,private blenderArt=false,private farmSample?:Parameters<typeof createFarmPlot>[1]){
  this.markerMaterials=[roadMaterials.rail,roadMaterials.line,new THREE.MeshStandardMaterial({color:'#f5a53c',roughness:1}),new THREE.MeshStandardMaterial({color:'#263d43',roughness:1})];
  for(const name of ['driving-surface','shoulder','terrain','road-detail','road-support','lane-markings','scenery']){const group=new THREE.Group();group.name=name;this.groups[name]=group;scene.add(group);}
  this.bank=bank;
  if(this.farmSample)loadCoastFarm().then(assets=>{if(this.disposed){assets.dispose();return;}this.farmAssets=assets;this.launch();}).catch(e=>{this.errorMessage=`Farm assets failed: ${String(e)}`;console.error(this.errorMessage);});else this.launch();
  this.update(350);
 }
 private launch(){
  this.initialized=false;this.busy=true;this.pending={kind:'init',index:-1,since:performance.now()};
  try{
  this.worker=new Worker(new URL('./road-worker.ts',import.meta.url),{type:'module'});
  const generation=this.generation;this.worker.onmessage=event=>{if(generation!==this.generation)return;try{this.receive(event.data);}catch(error){this.fail('Worker result failed: '+String(error));}};
  this.worker.onerror=event=>{event.preventDefault();if(generation===this.generation)this.fail(event.message||'Worker runtime failure');};
  this.worker.onmessageerror=()=>{if(generation===this.generation)this.fail('Worker message could not be decoded');};
  this.worker.postMessage({type:'init',generation:this.generation,stage:this.stage,bank:this.bank,blenderArt:this.blenderArt,...(import.meta.env.DEV?{faults:this.testFaults}:{})});
  }catch(error){this.fail('Worker launch failed: '+String(error));}
 }
 private fail(message:string){
  if(this.errorMessage)return;if(this.activeRecord)this.activeRecord.error=message;this.activeRecord=undefined;const job=this.pending;this.failures.push({message,kind:job?.kind??'commit',index:job?.index??-1,at:performance.now()});if(this.failures.length>8)this.failures.shift();console.error('[road-stream]',this.failures.at(-1));
  this.worker?.terminate();this.busy=false;this.pending=undefined;this.initialized=false;
  if(job&&job.index>=0){const c=this.chunks.get(job.index);if(c)c[job.kind==='prepare'?'road':'scenery']='missing';}
  if(this.retries<2){this.retries++;this.generation++;this.launch();}else this.errorMessage=message;
 }
 /** DEV-only worker faults run inside the worker, not just on the main thread. */
 debugFaults(faults:{delayMs:number;fromIndex:number;fail:boolean}){if(import.meta.env.DEV){this.testFaults=faults;this.worker.postMessage({type:'faults',generation:this.generation,faults});}}
 /** Three seconds at actual travel speed, including camera/contact behind and next tick. */
 canDrive(distance:number,travelSpeed:number,dt=1/120){
  if(this.errorMessage||!this.initialized)return false;
  const from=Math.max(0,distance-80),to=Math.min(this.length-1e-6,distance+Math.max(350,Math.abs(travelSpeed)*3)+Math.abs(travelSpeed)*dt+10);
  for(let i=Math.floor(from/this.chunkLength);i<=Math.floor(to/this.chunkLength);i++)if(!this.roadReady(i*this.chunkLength))return false;
  return true;
 }
 private note(kind:string,index:number,ms:number){this.history.push({kind,index,ms});if(this.history.length>2000)this.history.shift();}
 private chunk(index:number){let chunk=this.chunks.get(index);if(!chunk){chunk={index,objects:[],groups:{},geometries:new Set(),road:'missing',scenery:'missing'};this.chunks.set(index,chunk);}return chunk;}
 private attach(c:Chunk,name:string,object:THREE.Object3D){if(this.clippingPlanes.length)this.clipMaterial(object);let group=c.groups[name];if(!group){group=new THREE.Group();group.name=`chunk-${c.index}-${name}`;group.userData.chunkIndex=c.index;c.groups[name]=group;this.groups[name].add(group);}group.add(object);c.objects.push(object);}
 update(distance:number){
  this.position=Math.max(0,Math.min(this.length,distance));const first=Math.floor(Math.max(0,this.position-this.behind)/this.chunkLength),last=Math.min(Math.ceil(this.length/this.chunkLength)-1,Math.floor((this.position+this.ahead)/this.chunkLength));
  for(const c of this.chunks.values())for(const o of c.objects){const n=o.userData.nature as NatureBatch|undefined;if(n)o.visible=natureVisible(n,this.position,this.mobile);}
  const bounds=`${first}:${last}`;if(bounds===this.bounds){this.dispatch();return;}this.bounds=bounds;
  this.desired=new Set(Array.from({length:last-first+1},(_,i)=>first+i));
  for(const [index,c] of this.chunks)if(!this.desired.has(index)){
   // Remove the small set of chunk roots immediately, so retired geometry can
   // no longer render or participate in tire raycasts. Dispose GPU buffers in
   // individual, budgeted steps on subsequent frames.
   for(const group of Object.values(c.groups))group?.removeFromParent();
   for(const farm of this.farms.get(index)??[])this.retiring.push({index,priority:1,kind:'retire-field',run:()=>{this.farmWarmIds.delete(farm.plot.id);farm.group.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.ShaderMaterial)this.clippedMaterials.delete(m);});farm.dispose();}});this.farms.delete(index);
   if(this.diagnostics)for(const r of this.lifecycle)if(r.index===index&&r.retiredAt===undefined)r.retiredAt=performance.now();
   for(const object of c.objects)if(object instanceof THREE.InstancedMesh)this.retiring.push({index,priority:1,kind:'retire-instances',run:()=>object.dispose()});
   for(const geometry of c.geometries)this.retiring.push({index,priority:1,kind:'retire-geometry',run:()=>geometry.dispose()});this.chunks.delete(index);this.sceneryCounts.delete(index);
  }
  this.work=this.work.filter(task=>{if(this.desired.has(task.index))return true;this.discardedTasks++;if(task.record)task.record.discardedTasks++;return false;});this.dispatch();
 }
 private dispatch(){
  if(this.errorMessage||!this.initialized||this.busy)return;const current=Math.floor(this.position/this.chunkLength);
  const indices=[...this.desired].sort((a,b)=>Math.abs(a-current)-Math.abs(b-current)||a-b);
  for(const kind of ['road','scenery'] as const)for(const index of indices){const c=this.chunk(index);if(c[kind]!=='missing')continue;c[kind]='working';this.busy=true;this.pending={kind:kind==='road'?'prepare':'scenery',index,since:performance.now()};this.recordRequest(index,kind,this.pending.since);try{this.worker.postMessage({type:kind==='road'?'prepare':'scenery',generation:this.generation,index,start:index*this.chunkLength,end:Math.min(this.length,(index+1)*this.chunkLength)});}catch(error){this.fail('Worker dispatch failed: '+String(error));}return;}
 }
 private receive(data:any){
  if(data.generation!==this.generation){this.discardedResponses++;return;}if(data.type==='initialized'){this.note('init-cpu',-1,data.cpuMs);this.initialized=true;this.busy=false;this.pending=undefined;this.dispatch();return;}if(data.type==='error'){this.fail(data.message);return;}
  const record=this.activeRecord;if(record){record.responseAt=performance.now();record.responseMs=record.responseAt-record.requestedAt;record.workerCpuMs=data.cpuMs;}
  if(this.pending)this.note('worker-wall',data.index,performance.now()-this.pending.since);const c=this.chunks.get(data.index);if(!c||!this.desired.has(data.index)){this.discardedResponses++;if(record)record.error='Response discarded outside desired window';this.activeRecord=undefined;this.busy=false;this.pending=undefined;this.dispatch();return;}
  if(data.type!=='prepared'&&data.type!=='sceneryPrepared')throw Error('Unexpected worker result '+data.type);
  // Retain pending until result validation succeeds, so recovery retries this chunk.
  if(data.type==='prepared'&&!data.meshes?.some((m:RoadData)=>m.kind==='asphalt'&&m.positions?.length&&m.indices?.length))throw Error('Worker returned no drivable road');
  const road=data.type==='prepared';
  if(!road){
   this.sceneryCounts.set(c.index,{...data.scenery,clearance:data.clearance});
   const farms=data.farmPreps as PreparedFarmPlot[]|undefined;
   if(farms?.length){
    this.farmWorkerPrepared.chunks++;
    this.farmWorkerPrepared.plots+=farms.length;
    this.farmWorkerPrepared.workerCpuMs+=data.farmPrepCpuMs??0;
    this.farmWorkerPrepared.lastChunk=c.index;
    this.farmWorkerPrepared.lastMs=data.farmPrepCpuMs??0;
   }
  }
  this.note(road?'road-cpu':'scenery-cpu',data.index,data.cpuMs);
  if(record&&!road)record.generatedInstances=data.instances.reduce((n:number,i:Instance)=>n+i.matrices.length/16,0);this.activeRecord=undefined;
  const tasks=road?this.roadWork(c,data.meshes,data.roadside):this.sceneryWork(c,data.definitions,data.instances,data.farmPreps);
  const taskPlots=this.taskProfiler&&!road&&this.farmSample&&this.farmAssets
   ?farmPlotsInChunk(c.index*this.chunkLength,(c.index+1)*this.chunkLength):[];
  for(const [taskIndex,task] of tasks.entries()){
   const kind:SceneTaskKind=road
    ?taskIndex<data.meshes.length?'road-geometry':taskIndex<data.meshes.length+data.roadside.length?'roadside-instances':'road-annotation'
    :taskIndex<data.definitions.length?'scenery-geometry':taskIndex<data.definitions.length+data.instances.length?'scenery-instances':'scenery-field';
   const plot=kind==='scenery-field'?taskPlots[taskIndex-data.definitions.length-data.instances.length]:undefined;
   this.work.push({index:c.index,priority:road?0:1,record,kind,run:task,
    ...(plot?{detail:plot.kind,resourceId:plot.id}:{})});
  }
  this.work.push({index:c.index,priority:road?0:1,record,kind:'ready-marker',run:()=>{c[road?'road':'scenery']='ready';if(record)record.readyAt=performance.now();}});this.busy=false;this.pending=undefined;this.dispatch();
 }
 private roadWork(c:Chunk,meshes:RoadData[],roadside:Float32Array[]){const tasks=meshes.map(m=>()=>{
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(m.normals,3));if(m.uvs.length)g.setAttribute('uv',new THREE.BufferAttribute(m.uvs,2));if(m.colors.length)g.setAttribute('color',new THREE.BufferAttribute(m.colors,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));
  this.registerGeometry(g,c.index);const mesh=new THREE.Mesh(g,this.roadMaterials[m.kind]);mesh.userData.chunkIndex=c.index;mesh.userData.roadKind=m.kind;mesh.userData.rayRanges=m.rayRanges;mesh.userData.artVisualOnly=m.artVisualOnly;mesh.visible=!m.artContactOnly;mesh.receiveShadow=true;const name=m.kind==='asphalt'?'driving-surface':m.kind==='sand'?'shoulder':m.kind==='grass'?'terrain':m.kind==='support'?'road-support':(m.kind==='line'||m.kind==='center-line')?'lane-markings':'road-detail';mesh.name=name;this.attach(c,name,mesh);c.geometries.add(g);
 });for(let i=0;i<roadside.length;i++)tasks.push(()=>{const matrices=roadside[i],mesh=new THREE.InstancedMesh(this.markerGeometries[i],this.markerMaterials[i],matrices.length/16);mesh.instanceMatrix.array.set(matrices);this.uploadOwners.set(mesh.instanceMatrix.array,c.index);mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;this.attach(c,'road-detail',mesh);});for(const annotation of this.annotations)if(Math.floor(annotation.distance/this.chunkLength)===c.index)tasks.push(()=>{for(const mesh of annotation.create()){for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])this.annotationMaterials.add(material);this.registerGeometry(mesh.geometry,c.index);this.attach(c,'road-detail',mesh);c.geometries.add(mesh.geometry);}});return tasks;}
 private sceneryWork(c:Chunk,definitions:Definition[],instances:Instance[],farmPreps?:PreparedFarmPlot[]){
  const prepared=new Map((farmPreps??[]).map(p=>[p.id,p]));
  const plots=this.farmSample&&this.farmAssets?farmPlotsInChunk(c.index*this.chunkLength,(c.index+1)*this.chunkLength):[];
  if(plots.length&&prepared.size!==plots.length)this.farmWorkerPrepared.missingPlots+=plots.filter(p=>!prepared.has(p.id)).length;
  // A real prepared payload is an entire chunk's farm batch; partial data is a
  // worker contract violation rather than a silent visual mismatch.
  if(farmPreps?.length&&this.farmSample&&farmPreps.length!==farmPlotsInChunk(c.index*this.chunkLength,(c.index+1)*this.chunkLength).length)
   throw new Error('Incomplete Worker farm preparation for chunk '+c.index);
  const templates=new Map<string,THREE.BufferGeometry>(),tasks:(()=>void)[]=[];
  for(const d of definitions)tasks.push(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(d.position,3));if(d.normal.length)g.setAttribute('normal',new THREE.BufferAttribute(d.normal,3));if(d.uv.length)g.setAttribute('uv',new THREE.BufferAttribute(d.uv,2));if(d.color.length)g.setAttribute('color',new THREE.BufferAttribute(d.color,3));if(d.index.length)g.setIndex(new THREE.BufferAttribute(d.index,1));this.registerGeometry(g,c.index);templates.set(d.id,g);c.geometries.add(g);});
  for(const data of instances)tasks.push(()=>{const geometry=templates.get(data.template);if(!geometry)throw Error('Missing scenery template');const key=`${data.color}:${data.vertexColors}:${data.emissive??0}:${data.emissiveIntensity??0}:${data.nature?.texture??""}:${!!data.nature?.alpha}:${!!data.nature}:${!!data.waffleSign}`;let material=this.materials.get(key);if(!material){material=new THREE.MeshStandardMaterial({color:data.color,roughness:.85,vertexColors:data.vertexColors,emissive:data.emissive??0,emissiveIntensity:data.emissiveIntensity??0});if(data.nature)this.configureNatureMaterial(material,data.nature);if(data.waffleSign){material.map=this.waffleTexture??=waffleSignTexture();material.emissive.set(0xffffff);material.emissiveMap=material.map;material.emissiveIntensity=.3;}this.materials.set(key,material);}const mesh=new THREE.InstancedMesh(geometry,material,data.matrices.length/16);mesh.instanceMatrix.array.set(data.matrices);this.uploadOwners.set(mesh.instanceMatrix.array,c.index);mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=!data.nature;if(data.nature){mesh.userData.nature=data.nature;mesh.name='coast-nature';mesh.visible=natureVisible(data.nature,this.position,this.mobile);}this.attach(c,'scenery',mesh);if(this.diagnostics){const r=[...this.lifecycle].reverse().find(r=>r.index===c.index&&r.kind==='scenery'&&r.retiredAt===undefined);if(r)r.attachedInstances+=mesh.count;mesh.onAfterRender=()=>{mesh.userData.lastRenderSubmission=performance.now();};}});
  if(this.farmSample&&this.farmAssets)for(const plot of farmPlotsInChunk(c.index*this.chunkLength,(c.index+1)*this.chunkLength))tasks.push(()=>{
   const farm=createFarmPlot(plot,this.farmSample!,this.farmAssets!,prepared.get(plot.id));let patches=this.farms.get(c.index);if(!patches){patches=[];this.farms.set(c.index,patches);}patches.push(farm);
   farm.update(this.position,this.farmAssets!.time.value);if(this.clippingPlanes.length)farm.group.traverse(o=>this.clipMaterial(o));this.attach(c,'scenery',farm.group);
  });
  return tasks;
 }
 pump(){
  if(this.pending&&performance.now()-this.pending.since>30000)this.fail('Worker response timed out after 30 seconds');
  const start=performance.now(),current=Math.floor(this.position/this.chunkLength);
  this.work.sort((a,b)=>a.priority-b.priority||Math.abs(a.index-current)-Math.abs(b.index-current));
  const sortedAt=performance.now(),profile=this.taskProfiler;
  profile?.record('queue-sort',current,sortedAt-start,this.position,this.work.length+this.retiring.length,sortedAt);
  let taskWallMs=0;
  // Soft 3ms frame budget; individual synchronous callbacks can still exceed it.
  // The task profiler reveals exactly which kind/chunk must later be split or moved to a Worker.
  while((this.work.length||this.retiring.length)&&performance.now()-start<SCENE_TASK_SOFT_BUDGET_MS){
   const disposing=!!this.retiring.length&&(!this.work.length||this.work[0].priority>0);
   const task=disposing?this.retiring.shift()!:this.work.shift()!;
   if(!disposing&&!this.desired.has(task.index))continue;
   const t=performance.now();
   if(task.record&&task.record.commitStart===undefined)task.record.commitStart=t;
   try{task.run();}
   catch(error){
    if(task.record)task.record.error=String(error);
    this.errorMessage=`Road commit failed at chunk ${task.index}: ${String(error)}`;
    console.error(this.errorMessage);this.worker.terminate();this.busy=false;this.pending=undefined;this.work=[];break;
   }
   const ended=performance.now(),duration=ended-t;taskWallMs+=duration;
   if(task.record){task.record.commitEnd=ended;task.record.commitCpuMs+=duration;}
   this.note(disposing?'dispose':'main-commit',task.index,duration);
   profile?.record(task.kind??'other',task.index,duration,this.position,this.work.length+this.retiring.length,ended,task.detail,task.resourceId);
  }
  this.dispatch();
  const finished=performance.now();
  profile?.record('pump-overhead',current,Math.max(0,finished-sortedAt-taskWallMs),this.position,this.work.length+this.retiring.length,finished);
 }
 /** Read-only first-load gate snapshot. Does not call the stateful ready getter. */
 startupDiagnosticState(){
  const near=this.nearby,farmChunks=[2,3,4];
  const nearbyCompleted=near.reduce((n,i)=>{const c=this.chunks.get(i);return n+Number(c?.road==='ready')+Number(c?.scenery==='ready');},0);
  const farmChunksReady=farmChunks.filter(i=>this.chunks.get(i)?.scenery==='ready').length;
  const blockers:string[]=[],backgroundTasks:string[]=[];
  if(!this.farmAssets&&this.farmSample)blockers.push('農田模型下載／解析');
  if(!this.initialized)blockers.push('Road Worker 初始化');
  if(farmChunksReady<farmChunks.length&&this.farmSample)backgroundTasks.push('遠方農田 Chunk');
  if(!this.farmGpuWarmed&&this.farmSample)backgroundTasks.push('農田 Shader／GPU 預熱');
  if(nearbyCompleted<near.length*2)blockers.push('附近道路／景物');
  if(this.natureTextureLoads)blockers.push('樹木貼圖下載');
  if(this.errorMessage)blockers.unshift('錯誤：'+this.errorMessage);
  return {
   workerInitialized:this.initialized,farmAssetsLoaded:!!this.farmAssets,
   farmChunksReady,farmChunksTotal:farmChunks.length,farmGpuWarmed:this.farmGpuWarmed,
   farmWarm:{...this.startupFarmWarm,elapsedMs:this.startupFarmWarm.running?this.farmWarmElapsedBeforeBatch+performance.now()-this.farmWarmStartedAt:this.startupFarmWarm.elapsedMs},
   nearbyCompleted,nearbyTotal:near.length*2,natureTexturesPending:this.natureTextureLoads,
   workerPending:this.pending?{kind:this.pending.kind,index:this.pending.index,ageMs:Math.round(performance.now()-this.pending.since)}:null,
   queuedMainTasks:this.work.length,blockers,backgroundTasks,fatal:this.errorMessage,
  };
 }
 // Complete the visible neighbourhood first; the full 5 km window continues in background.
 get nearby(){const first=Math.floor(Math.max(0,this.position-80)/this.chunkLength),last=Math.min(Math.ceil(this.length/this.chunkLength)-1,Math.floor((this.position+1200)/this.chunkLength));return Array.from({length:last-first+1},(_,i)=>first+i);}
 get ready(){
  // Driving starts when the nearby road and scenery are ready; distant farms stream in the background.
  return !this.errorMessage&&this.natureTextureLoads===0&&this.nearby.every(i=>{const c=this.chunks.get(i);return c?.road==='ready'&&c.scenery==='ready';});
 }
 get fullyReady(){return !this.errorMessage&&!this.retiring.length&&[...this.desired].every(i=>{const c=this.chunks.get(i);return c?.road==='ready'&&c.scenery==='ready';});}
 contactSurfaces(distance:number){const index=Math.floor(distance/this.chunkLength);return [index-1,index,index+1].flatMap(i=>{const c=this.chunks.get(i);return c?[c.groups['driving-surface'],c.groups.shoulder].filter((g):g is THREE.Group=>!!g):[];});}
 /** Intersect only the original triangles within 12 m of the car. Restore draw
  * ranges immediately; visual geometry and other inspection raycasts stay intact. */
 raycastContacts(ray:THREE.Raycaster,distance:number){
  const hits:THREE.Intersection[]=[];
  for(const group of this.contactSurfaces(distance))for(const object of group.children){
   if(object.userData.artVisualOnly)continue;
   const mesh=object as THREE.Mesh,geometry=mesh.geometry,ranges=mesh.userData.rayRanges as RoadMeshData['rayRanges'];
   if(!ranges){ray.intersectObject(mesh,false,hits);continue;}
   const saved={...geometry.drawRange};
   try{for(const r of ranges){if(distance+12<r.start||distance-12>r.end)continue;
    const rows=r.count/6,step=(r.end-r.start)/rows,first=Math.max(0,Math.floor((distance-12-r.start)/step)),last=Math.min(rows,Math.ceil((distance+12-r.start)/step));
    geometry.setDrawRange(r.offset+first*6,Math.max(0,last-first)*6);ray.intersectObject(mesh,false,hits);
   }}finally{geometry.setDrawRange(saved.start,saved.count);}
  }
  return hits.sort((a,b)=>a.distance-b.distance);
 }
 roadReady(distance:number){const c=this.chunks.get(Math.floor(Math.min(this.length-1e-6,Math.max(0,distance))/this.chunkLength)),g=c?.groups['driving-surface'];return c?.road==='ready'&&g?.parent===this.groups['driving-surface']&&g.children.some(o=>(o as THREE.Mesh).geometry?.getAttribute('position')?.count>0);}
 get error(){return this.errorMessage;}
 get sceneryStats(){let instances=0,draws=0;this.groups.scenery.traverse(o=>{if(o instanceof THREE.InstancedMesh){instances+=o.count;draws++;}});return {instances,draws};}
 private registerGeometry(g:THREE.BufferGeometry,index:number){for(const a of Object.values(g.attributes))this.uploadOwners.set(a.array,index);if(g.index)this.uploadOwners.set(g.index.array,index);}
 /** DEV profiling reports CPU submission time, not asynchronous GPU completion. */
 instrumentUploads(renderer:THREE.WebGLRenderer){const gl=renderer.getContext(),original=gl.bufferData.bind(gl),owner=this;gl.bufferData=((...args:unknown[])=>{const start=performance.now();try{return (original as (...args:unknown[])=>void)(...args);}finally{const data=args[1];if(data&&typeof data==='object'){const index=owner.uploadOwners.get(data);if(index!==undefined)owner.note('gpu-upload-submit',index,performance.now()-start);}}}) as typeof gl.bufferData;}
 /** CPU attachment and renderer submission do not establish GPU completion or visible pixels. */
 diagnosticsSnapshot(travelSpeed:number){
  const now=performance.now(),current=Math.floor(Math.min(this.length-1e-6,this.position)/this.chunkLength);let end=this.position;
  for(let i=current;i<Math.ceil(this.length/this.chunkLength)&&this.roadReady(i*this.chunkLength);i++)end=Math.min(this.length,(i+1)*this.chunkLength);
  const roadAhead=Math.max(0,end-this.position),records=this.lifecycle.map(r=>({...r,commitWallMs:r.commitStart!==undefined&&r.commitEnd!==undefined?r.commitEnd-r.commitStart:null,readyLatencyMs:r.readyAt===undefined?null:r.readyAt-r.requestedAt}));
  const distributions=Object.fromEntries((['road','scenery'] as const).map(kind=>{const rows=records.filter(r=>r.kind===kind);return [kind,Object.fromEntries(['workerCpuMs','responseMs','commitCpuMs','commitWallMs','readyLatencyMs'].map(key=>[key,latencyDistribution(rows.filter(r=>key!=='commitCpuMs'||r.readyAt!==undefined).map(r=>(r as any)[key]).filter((x:unknown)=>typeof x==='number'))]))];}));
  const chunks=[...this.chunks.values()].map(c=>{const group=c.groups.scenery,attached=group?.parent===this.groups.scenery;let instances=0,draws=0,recentSubmittedInstances=0;for(const o of group?.children??[])if(o instanceof THREE.InstancedMesh&&attached){instances+=o.count;draws++;if(now-(o.userData.lastRenderSubmission??-Infinity)<250)recentSubmittedInstances+=o.count;}return {index:c.index,start:c.index*this.chunkLength,end:Math.min(this.length,(c.index+1)*this.chunkLength),road:c.road,scenery:c.scenery,generatedInstances:this.sceneryCounts.get(c.index)?.instances??null,attachedInstances:instances,attachedDraws:draws,recentSubmittedInstances};});
  return {enabled:this.diagnostics,recordLimit:256,records,distributions,distributionScope:'retained requests; incomplete requests excluded from ready latency',roadAheadM:roadAhead,roadHeadroomSeconds:travelSpeed>0?roadAhead/travelSpeed:null,travelSpeedMps:travelSpeed,nearby:chunks.filter(c=>this.nearby.includes(c.index)),chunks,queues:{road:this.work.filter(w=>w.priority===0).length,scenery:this.work.filter(w=>w.priority===1).length,retirement:this.retiring.length,workerPending:this.pending?1:0,roadUnrequested:[...this.desired].filter(i=>!this.chunks.get(i)||this.chunks.get(i)?.road==='missing').length,sceneryUnrequested:[...this.desired].filter(i=>!this.chunks.get(i)||this.chunks.get(i)?.scenery==='missing').length},discardedResponses:this.discardedResponses,discardedTasks:this.discardedTasks,gpuCompletion:null,visiblePixelCount:null,submissionMeaning:'Instances in meshes submitted within 250ms; not GPU completion, per-instance visibility or occlusion'};
 }
 get stats(){return {retries:this.retries,errors:[...this.failures],fatal:this.errorMessage,pending:this.pending?{...this.pending,ageMs:performance.now()-this.pending.since}:null,currentRoad:this.roadReady(this.position),nextRoad:this.roadReady(this.position+this.chunkLength),nearby:this.nearby,fullyReady:this.fullyReady,sceneryCounts:[...this.sceneryCounts].map(([index,counts])=>({index,...counts})),desired:[...this.desired],chunks:[...this.chunks.values()].map(c=>({index:c.index,road:c.road,scenery:c.scenery})),queued:this.work.length,retiring:this.retiring.length,busy:this.busy,history:[...this.history]};}
 dispose(){this.waffleTexture?.dispose();this.disposed=true;for(const patches of this.farms.values())for(const p of patches)p.dispose();this.farms.clear();this.farmAssets?.dispose();for(const material of new Set([...Object.values(this.roadMaterials),...this.annotationMaterials])){for(const value of Object.values(material))if(value instanceof THREE.Texture)value.dispose();material.dispose();}this.annotationMaterials.clear();this.generation++;this.worker?.terminate();for(const task of this.retiring)task.run();this.retiring=[];for(const c of this.chunks.values()){for(const group of Object.values(c.groups))group?.removeFromParent();for(const o of c.objects)if(o instanceof THREE.InstancedMesh)o.dispose();for(const g of c.geometries)g.dispose();}for(const t of this.natureTextures.values())t.dispose();this.natureTextures.clear();for(const m of this.materials.values())m.dispose();for(const g of this.markerGeometries)g.dispose();this.markerMaterials[2].dispose();this.markerMaterials[3].dispose();this.chunks.clear();this.work=[];}
}
