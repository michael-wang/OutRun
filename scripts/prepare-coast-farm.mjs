// Offline simplification only. Original CC0 GLBs remain beside the derived assets.
import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {mergeVertices,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result=`data:${blob.type};base64,${Buffer.from(x).toString('base64')}`;this.onloadend?.();});}};
const path='public/assets/coast-farm/',buffer=await readFile(path+'rice-original.glb');
const {scene}=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
scene.updateMatrixWorld(true);
const report=[];
for(const [name,ratio] of [['rice-near',.10],['rice-mid',.025]]){
 const parts=[];
 scene.traverse(o=>{if(!o.isMesh)return;
  let g=new THREE.BufferGeometry(),positions=[],source=o.geometry.attributes.position;
  for(let i=0;i<source.count;i++)positions.push(source.getX(i),source.getY(i),source.getZ(i));
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  if(o.geometry.index)g.setIndex(o.geometry.index.clone());g.applyMatrix4(o.matrixWorld);
  g=mergeVertices(g);
  g=new SimplifyModifier().modify(g,Math.floor(g.attributes.position.count*(1-ratio)));
  if(g.index)g=g.toNonIndexed();g.computeVertexNormals();
  const colors=[],uv=[],p=g.attributes.position,c=o.material.color;
  for(let i=0;i<p.count;i++){colors.push(c.r,c.g,c.b);uv.push(0,Math.max(0,Math.min(1,p.getY(i)/.819)));}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));parts.push(g);
 });
 const geometry=mergeGeometries(parts),mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
 mesh.name=name;
 const glb=await new GLTFExporter().parseAsync(mesh,{binary:true});await writeFile(path+name+'.glb',Buffer.from(glb));
 report.push({name,triangles:geometry.attributes.position.count/3,bytes:glb.byteLength});
}
await writeFile(path+'simplification.json',JSON.stringify(report,null,2)+'\n');console.log(report);
