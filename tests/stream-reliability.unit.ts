import {it,expect,vi,afterEach} from 'vitest';import * as THREE from 'three';import {StreamedScene} from '../src/streamed-scene';
class FakeWorker {static all:FakeWorker[]=[];onmessage:any;onerror:any;onmessageerror:any;requests:any[]=[];terminated=false;constructor(){FakeWorker.all.push(this);}postMessage(x:any){this.requests.push(x);}terminate(){this.terminated=true;}send(x:any){this.onmessage({data:{generation:this.requests[0].generation,...x}});}}
function setup(){FakeWorker.all=[];vi.stubGlobal('Worker',FakeWorker);const scene=new THREE.Scene(),m=new THREE.MeshBasicMaterial(),s=new StreamedScene(scene,{} as any,10000,new Proxy({},{get:()=>m}) as any);FakeWorker.all[0].send({type:'initialized',cpuMs:1});return s;}
function road(w:FakeWorker,index:number){w.send({type:'prepared',index,cpuMs:1,roadside:[new Float32Array(),new Float32Array(),new Float32Array(),new Float32Array()],meshes:[{kind:'asphalt',positions:new Float32Array([0,0,0,10,0,0,0,0,1000]),indices:new Uint32Array([0,1,2]),normals:new Float32Array([0,1,0,0,1,0,0,1,0]),uvs:new Float32Array(),colors:new Float32Array()}]});}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('dispatches upcoming roads before scenery and requires attached committed surfaces',()=>{const s=setup(),w=FakeWorker.all[0];expect(w.requests.at(-1).index).toBe(0);road(w,0);expect(s.roadReady(350)).toBe(false);for(let i=0;i<5;i++)s.pump();expect(s.roadReady(350)).toBe(true);expect(s.canDrive(850,180)).toBe(false);expect(w.requests.at(-1)).toMatchObject({type:'prepare',index:1});road(w,1);for(let i=0;i<5;i++)s.pump();expect(s.canDrive(850,180)).toBe(true);expect(w.requests.some(r=>r.type==='scenery')).toBe(false);s.dispose();});
it('transient worker restart retains existing road and retries missing work',()=>{const s=setup(),w=FakeWorker.all[0];road(w,0);for(let i=0;i<5;i++)s.pump();w.send({type:'error',message:'temporary worker failure'});expect(w.terminated).toBe(true);expect(s.roadReady(350)).toBe(true);expect(s.canDrive(350,10)).toBe(false);const replacement=FakeWorker.all[1];replacement.send({type:'initialized',cpuMs:1});expect(replacement.requests.at(-1)).toMatchObject({type:'prepare',index:1});road(replacement,1);for(let i=0;i<5;i++)s.pump();expect(s.canDrive(850,180)).toBe(true);expect(s.stats.retries).toBe(1);s.dispose();});
it('permanent exceptions have two retries and cannot allow driving',()=>{const s=setup();for(let i=0;i<3;i++)FakeWorker.all.at(-1)!.send({type:'error',message:'persistent failure'});expect(FakeWorker.all).toHaveLength(3);expect(s.stats.retries).toBe(2);expect(s.error).toBe('persistent failure');expect(s.canDrive(350,0)).toBe(false);expect(s.stats.errors).toHaveLength(3);s.dispose();});
it('hung worker watchdog starts bounded recovery',()=>{const s=setup(),since=s.stats.pending!.since;vi.spyOn(performance,'now').mockReturnValue(since+31000);s.pump();expect(s.stats.retries).toBe(1);expect(s.stats.errors[0].message).toContain('timed out');s.dispose();});
it('malformed worker results retry the affected chunk instead of leaving working forever',()=>{const s=setup(),w=FakeWorker.all[0];road(w,0);for(let i=0;i<5;i++)s.pump();w.send({type:'prepared',index:1,cpuMs:1,meshes:null,roadside:[]});const replacement=FakeWorker.all[1];expect(replacement).toBeDefined();replacement.send({type:'initialized',cpuMs:1});expect(replacement.requests.at(-1)).toMatchObject({type:'prepare',index:1});s.dispose();});
it('worker construction failures are bounded and leave a blocking error',()=>{vi.stubGlobal('Worker',class {constructor(){throw Error('worker unavailable');}});const s=new StreamedScene(new THREE.Scene(),{} as any,10000,{} as any);expect(s.stats.retries).toBe(2);expect(s.error).toContain('worker unavailable');expect(s.canDrive(350,100)).toBe(false);s.dispose();});
it('dispatch exceptions retry the same chunk',()=>{const s=setup(),w=FakeWorker.all[0];w.postMessage=()=>{throw Error('dispatch failed');};road(w,0);expect(s.stats.errors[0].index).toBe(1);const replacement=FakeWorker.all[1];replacement.send({type:'initialized',cpuMs:1});expect(replacement.requests.at(-1)).toMatchObject({type:'prepare',index:1});s.dispose();});

it('diagnostic quantiles report counts and empty measurements honestly',async()=>{
 const {latencyDistribution}=await import('../src/streamed-scene');
 expect(latencyDistribution([])).toEqual({count:0,p50:null,p95:null,p99:null,worst:null});
 expect(latencyDistribution([4,1,3,2])).toEqual({count:4,p50:2,p95:4,p99:4,worst:4});
});
it('records response versus CPU attachment and bounds retained requests',()=>{
 vi.stubGlobal('location',{search:'?streamdiag=1'});const s=setup(),w=FakeWorker.all[0];
 road(w,0);let d=s.diagnosticsSnapshot(100);expect(d.records[0].readyAt).toBeUndefined();expect(d.records[0].responseMs).toBeGreaterThanOrEqual(0);expect(d.roadAheadM).toBe(0);
 for(let i=0;i<5;i++)s.pump();d=s.diagnosticsSnapshot(100);expect(d.records[0].readyAt).toBeDefined();expect(d.roadAheadM).toBe(650);expect(d.roadHeadroomSeconds).toBe(6.5);expect(d.gpuCompletion).toBeNull();
 for(let index=1;index<6;index++){road(w,index);for(let i=0;i<5;i++)s.pump();}
 const request=w.requests.at(-1);expect(request.type).toBe('scenery');
 w.send({type:'sceneryPrepared',index:request.index,cpuMs:2,scenery:{instances:1,draws:1},definitions:[{id:'test',position:new Float32Array([0,0,0]),normal:new Float32Array(),uv:new Float32Array(),color:new Float32Array(),index:new Uint32Array()}],instances:[{template:'test',color:0xffffff,vertexColors:false,matrices:new Float32Array(new THREE.Matrix4().elements)}]});
 d=s.diagnosticsSnapshot(100);expect(d.chunks.find(c=>c.index===0)?.attachedInstances).toBe(0);
 for(let i=0;i<5;i++)s.pump();d=s.diagnosticsSnapshot(100);expect(d.chunks.find(c=>c.index===0)).toMatchObject({generatedInstances:1,attachedInstances:1,recentSubmittedInstances:0,scenery:'ready'});
 // Exercise the same request recorder without allocating hundreds of scene chunks.
 for(let i=0;i<300;i++)(s as any).recordRequest(i,'road',performance.now());expect(s.diagnosticsSnapshot(0).records).toHaveLength(256);expect(s.diagnosticsSnapshot(0).roadHeadroomSeconds).toBeNull();
 s.update(9000);expect(s.diagnosticsSnapshot(100).discardedTasks).toBeGreaterThanOrEqual(0);s.dispose();
});
it('discarded worker results are counted and never attached',()=>{
 vi.stubGlobal('location',{search:'?streamdiag=1'});const s=setup(),w=FakeWorker.all[0];s.update(9000);road(w,0);const d=s.diagnosticsSnapshot(100);expect(d.discardedResponses).toBe(1);expect(d.records[0].error).toContain('discarded');expect(d.chunks.some(c=>c.index===0)).toBe(false);s.dispose();
});
