import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=JSON.parse(fs.readFileSync('stage-a-preservation/manifest.json','utf8').replace(/^\uFEFF/,''));
const retention=manifest.map(r=>({relative:r.relative,bytes:r.bytes,sha256:r.sha256.toLowerCase(),
 originalUnchanged:hash(r.original)===r.sha256.toLowerCase(),snapshotUnchanged:hash(r.snapshot)===r.sha256.toLowerCase()}));
const exports=[];
for(const rev of ['06','07']){
 const base=`stage-a-preservation/art/p1-2/revision-${rev}/native-edit-${rev}`;
 const prior=JSON.parse(fs.readFileSync(base+'.audit.json','utf8'));
 const glb=fs.readFileSync(base+'.glb');
 if(glb.toString('ascii',0,4)!=='glTF'||glb.readUInt32LE(8)!==glb.length)throw Error('Invalid GLB header');
 const doc=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)).trim());
 exports.push({revision:rev,sourceMatch:hash(base+'.blend')===prior.source_sha256,
 exportMatch:hash(base+'.glb')===prior.export_sha256,recordedBytes:prior.bytes,actualBytes:glb.length,
 generator:doc.asset.generator,meshes:doc.meshes.map(x=>x.name),materials:doc.materials.map(x=>x.name),
 nodes:doc.nodes.map(x=>({name:x.name,children:x.children,translation:x.translation})),
 recordedObjects:prior.objects.map(x=>({name:x.name,geometry_sha256:x.geometry_sha256,bounds:x.bounds}))});
}
const result={retention,exports,limitations:'GLB header/JSON inventory only; not Three.js parsing, browser or visual PASS'};
fs.writeFileSync('stage-a-verification.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({files:retention.length,allOriginalUnchanged:retention.every(x=>x.originalUnchanged),allSnapshotUnchanged:retention.every(x=>x.snapshotUnchanged),exports},null,2));
