import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/streaming-s2a';
// Isolated workers: no game renderer or fault injection, both versions use the
// same browser, Vite transform, route recipe and unchanged road-worker source.
async function runPair(page:any,seed:number,revision:number,benchmark:boolean,sceneryOnly=false){
 return page.evaluate(async({seed,revision,benchmark,sceneryOnly}:any)=>{
  const {generateTrip}=await import('/src/trip.ts');const stage=generateTrip(seed,revision);
  const workers=[new Worker('/tests/fixtures/s2a/road-worker-original.ts',{type:'module'}),new Worker('/src/road-worker.ts',{type:'module'})];
  const request=(worker:Worker,message:any)=>new Promise<any>((resolve,reject)=>{worker.onmessage=e=>e.data.type==='error'?reject(Error(e.data.message)):resolve(e.data);worker.onerror=e=>reject(Error(e.message));worker.postMessage({generation:1,...message});});
  const init=[];for(const worker of workers)init.push((await request(worker,{type:'init',stage})).cpuMs);
  const rows:any[]=[];let checkedBytes=0;
  const arrays=(d:any)=>d.meshes?d.meshes.flatMap((m:any)=>[m.positions,m.normals,m.uvs,m.colors,m.indices]).concat(d.roadside):d.definitions.flatMap((m:any)=>[m.position,m.normal,m.uv,m.color,m.index]).concat(d.instances.map((i:any)=>i.matrices));
  const meta=(d:any)=>JSON.stringify(d.meshes?d.meshes.map((m:any)=>({kind:m.kind,rayRanges:m.rayRanges??null})):d.instances.map((i:any)=>({template:d.definitions.findIndex((t:any)=>t.id===i.template),color:i.color,vertexColors:i.vertexColors})));
  async function compare(a:any,b:any){if(meta(a)!==meta(b))throw Error('Geometry metadata mismatch');const aa=arrays(a),bb=arrays(b);if(aa.length!==bb.length)throw Error('Array count mismatch');let bytes=0;const pieces=[new TextEncoder().encode(meta(a))];
   for(let i=0;i<aa.length;i++){const x=new Uint8Array(aa[i].buffer,aa[i].byteOffset,aa[i].byteLength),y=new Uint8Array(bb[i].buffer,bb[i].byteOffset,bb[i].byteLength);if(x.length!==y.length||x.some((v,j)=>v!==y[j]))throw Error('Exact geometry byte mismatch in array '+i);bytes+=x.length;pieces.push(x);}
   checkedBytes+=bytes;const all=new Uint8Array(pieces.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of pieces){all.set(p,offset);offset+=p.length;}return [...new Uint8Array(await crypto.subtle.digest('SHA-256',all))].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  try{
   if(benchmark)for(const worker of workers)await request(worker,{type:'prepare',index:0,start:0,end:1000});
   const last=benchmark?20:Math.ceil((stage.length+950)/1000)-1;
   for(let index=0;index<=last;index++){const data:any[]=[];const order=(index+seed)%2?[1,0]:[0,1];for(const which of order)data[which]=await request(workers[which],{type:sceneryOnly?'scenery':'prepare',index,start:index*1000,end:Math.min(stage.length+950,(index+1)*1000)});const hash=await compare(data[0],data[1]);rows.push({index,beforeMs:data[0].cpuMs,afterMs:data[1].cpuMs,sha256:hash});}
   return {seed,revision,initMs:{before:init[0],after:init[1]},checkedBytes,rows};
  }finally{workers.forEach(w=>w.terminate());}
 },{seed,revision,benchmark,sceneryOnly});
}
test('matched before and after road Worker benchmark by chunk index',async({browser})=>{
 test.setTimeout(600000);mkdirSync(root,{recursive:true});const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto('/tests/fixtures/s2a/blank.html');const runs=[];
 for(let repetition=0;repetition<3;repetition++)for(const seed of [1,2,7]){const r=await runPair(p,seed,7,true);runs.push({repetition,...r});writeFileSync(root+'/worker-benchmark.json',JSON.stringify({browser:browser.version(),conditions:'Headless Edge, one blank 960x432 DPR2 mobile/touch context; no renderer, throttle or faults. Paired original/current workers; alternating execution order per chunk. Fresh workers each run, one chunk-0 warmup, 3 repetitions per seed. cpuMs excludes messaging/hash comparison.',runs},null,2));console.log('benchmark',repetition,seed,r.rows.at(-1));}
 expect(runs).toHaveLength(9);await c.close();
});
test('all road geometry bytes match S1 on every chunk and historical trip revision',async({browser})=>{
 test.setTimeout(1800000);mkdirSync(root,{recursive:true});const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto('/tests/fixtures/s2a/blank.html');const runs=[];
 for(const revision of [1,2,3,4,5,6,7])for(const seed of [1,2,7]){const r=await runPair(p,seed,revision,false);runs.push(r);writeFileSync(root+'/geometry-equivalence.json',JSON.stringify({browser:browser.version(),comparison:'Exact byte comparison of every position, normal, uv, color, index and roadside instance matrix buffer, plus exact material-kind/raycast-range metadata; SHA-256 recorded after equality.',runs},null,2));console.log('geometry',revision,seed,r.rows.length,'chunks',r.checkedBytes,'bytes identical');}
 expect(runs).toHaveLength(21);await c.close();
});

test('scenery templates and instance matrices exactly match S1 across full r7 routes',async({browser})=>{
 test.setTimeout(180000);mkdirSync(root,{recursive:true});const c=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto('/tests/fixtures/s2a/blank.html');const runs=[];
 for(const seed of [1,2,7])runs.push(await runPair(p,seed,7,false,true));
 writeFileSync(root+'/scenery-equivalence.json',JSON.stringify({comparison:'Exact template geometry and instance-matrix bytes; UUIDs normalized to template index, material settings exact',runs},null,2));expect(runs).toHaveLength(3);await c.close();
});
