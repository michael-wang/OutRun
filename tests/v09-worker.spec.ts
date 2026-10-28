import {test,expect} from '@playwright/test';

test('trip worker reproduces near and far road and scenery in either order',async({page})=>{
 for(const seed of [1,2,3]){
  await page.goto(`/?trip=10m&seed=${seed}`);
  const result=await page.evaluate(async()=>{
   const stage=(window as any).__drive.brick(),worker=new Worker('/src/road-worker.ts',{type:'module'});
   const receive=()=>new Promise<any>((resolve,reject)=>{worker.onmessage=e=>e.data.type==='error'?reject(Error(e.data.message)):resolve(e.data);worker.onerror=e=>reject(Error(e.message));});
   const initialized=receive();worker.postMessage({type:'init',generation:7,stage});await initialized;
   const hashes:Record<string,number>={},costs:number[]=[];
   for(const index of [0,17,36,52,68,68,52,36,17,0]){
    const response=receive();worker.postMessage({type:'prepare',generation:7,index,start:index*1000,end:(index+1)*1000});const data=await response;costs.push(data.cpuMs);
    let hash=2166136261;for(const mesh of data.meshes)for(const array of [mesh.positions,mesh.uvs,mesh.colors,mesh.indices])for(const n of array){hash^=Math.round(n*1000);hash=Math.imul(hash,16777619);}
    const key=String(index);if(key in hashes&&hashes[key]!==hash){worker.terminate();return {ok:false,costs};}hashes[key]=hash;
   }
   const scenery:Record<string,string>={};
   for(const index of [0,17,36,52,68,68,52,36,17,0]){
    const response=receive();worker.postMessage({type:'scenery',generation:7,index,start:index*1000,end:(index+1)*1000});const data=await response;
    const templates=new Map<string,number>();for(const d of data.definitions){let h=2166136261;for(const a of [d.position,d.normal,d.uv,d.color,d.index])for(const n of a){h^=Math.round(n*1000);h=Math.imul(h,16777619);}templates.set(d.id,h);}
    const rows=data.instances.map((x:any)=>`${templates.get(x.template)}:${x.color}:${x.vertexColors}:${Array.from(x.matrices).join(',')}`).sort().join('|'),key=String(index);
    if(key in scenery&&scenery[key]!==rows){worker.terminate();return {ok:false,costs};}scenery[key]=rows;
   }
   worker.terminate();return {ok:true,costs};
  });
  expect(result.ok).toBe(true);expect(result.costs).toHaveLength(10);
 }
});
