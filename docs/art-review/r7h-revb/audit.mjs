// Compare exported data semantically, without depending on GLB buffer offsets.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function asset(path){
 const bytes=await readFile(path),len=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+len)),bin=bytes.subarray(28+len);
 const sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 const accessor=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],size=sizes[a.componentType]*widths[a.type],data=Buffer.alloc(a.count*size);
  if(v){const start=(v.byteOffset??0)+(a.byteOffset??0);for(let i=0;i<a.count;i++)bin.copy(data,i*size,start+i*(v.byteStride??size),start+i*(v.byteStride??size)+size);}
  if(a.sparse){const s=a.sparse,ind=g.bufferViews[s.indices.bufferView],val=g.bufferViews[s.values.bufferView],is=sizes[s.indices.componentType];
   for(let i=0;i<s.count;i++){const index=bin.readUIntLE((ind.byteOffset??0)+(s.indices.byteOffset??0)+i*is,is),start=(val.byteOffset??0)+(s.values.byteOffset??0)+i*size;bin.copy(data,index*size,start,start+size);}}
  return hash(data);};
 const meshes={};let triangles=0;
 for(const m of g.meshes)for(const p of m.primitives){
  const material=g.materials[p.material].name;triangles+=g.accessors[p.indices].count/3;
  meshes[material]={attributes:Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,accessor(v)])),indices:accessor(p.indices),morphs:(p.targets??[]).map(t=>Object.fromEntries(Object.entries(t).map(([k,v])=>[k,accessor(v)])))};
 }
 const animations=Object.fromEntries(g.animations.map(a=>[a.name,a.channels.map(c=>{
  const s=a.samplers[c.sampler];return {node:g.nodes[c.target.node].name,path:c.target.path,input:accessor(s.input),output:accessor(s.output)};
 }).sort((a,b)=>(a.node+a.path).localeCompare(b.node+b.path))]));
 return {bytes:bytes.length,sha256:hash(bytes),triangles,meshes,animations,skins:g.skins.map(s=>({bones:s.joints.map(i=>g.nodes[i].name),bind:accessor(s.inverseBindMatrices)}))};
}
const report={};
for(const profile of ['race','full']){
 const before=await asset(`test-results/r7h-revb/before-${profile}.glb`),after=await asset(`public/assets/characters/coast-heroine-r7h-${profile}.glb`);
 assert.deepEqual(after.animations,before.animations);assert.deepEqual(after.skins,before.skins);
 for(const name of Object.keys(before.meshes))if(name!=='R7H ivory satin')assert.deepEqual(after.meshes[name],before.meshes[name],name);
 report[profile]={before:{bytes:before.bytes,triangles:before.triangles,sha256:before.sha256},after:{bytes:after.bytes,triangles:after.triangles,sha256:after.sha256},nonClothMeshesIdentical:true,animationsIdentical:true,skinBindIdentical:true};
}
report.hairSha256=hash(await readFile('public/assets/characters/coast-blonde-r6d.glb'));
assert.equal(report.hairSha256,'8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519');
await writeFile('docs/art-review/r7h-revb/asset-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
