import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const result={};
for(const name of ['r7a','r7h-full','r7h-race']){
 const b=await readFile(`public/assets/characters/coast-heroine-${name}.glb`),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 const primitives=g.meshes.flatMap(m=>m.primitives);
 result[name]={bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),triangles:primitives.reduce((n,p)=>n+g.accessors[p.indices].count/3,0),primitives:primitives.length,skinBones:g.skins.map(s=>s.joints.length),clips:(g.animations??[]).map(a=>a.name)};
}
for(const v of ['before','after']){
 const s=JSON.parse(await readFile(`test-results/r7h/${v}/static.json`));result[v]={...s, costs:s.costs.filter(c=>['front','chase','rear45'].includes(c.view))};
}
await writeFile('docs/art-review/r7h/metrics.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
