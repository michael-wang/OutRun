import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {beachSupport,beachPoses,supportProps} from '../src/assets/kenting-support.ts';

// Three's exporter uses the browser FileReader contract for binary buffers.
globalThis.FileReader=class {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(data=>{this.result=data;this.onloadend?.();});}
};
const output=process.argv[2]??'.local/kenting-support';
await fs.mkdir(output,{recursive:true});
const exporter=new GLTFExporter(),loader=new GLTFLoader(),rows=[];
const models=[...beachPoses.map((pose,i)=>beachSupport(pose,i%3)),...supportProps.map(id=>beachSupport(id))];
for(const mesh of models){
 const bytes=await exporter.parseAsync(mesh,{binary:true,onlyVisible:true});
 const result=await loader.parseAsync(bytes,'');
 const nodes=[];result.scene.traverse(o=>{if(o.isMesh)nodes.push(o);});
 if(nodes.length!==1||nodes[0].geometry.index.count!==mesh.geometry.index.count)throw Error(mesh.name);
 const name=mesh.name+'.glb';await fs.writeFile(path.join(output,name),Buffer.from(bytes));
 rows.push({name,bytes:bytes.byteLength,vertices:mesh.geometry.attributes.position.count,triangles:mesh.geometry.index.count/3,
  sha256:createHash('sha256').update(Buffer.from(bytes)).digest('hex')});
}
await fs.writeFile(path.join(output,'catalog.json'),JSON.stringify(rows,null,2));
console.log(JSON.stringify({models:rows.length,bytes:rows.reduce((n,m)=>n+m.bytes,0)}));
