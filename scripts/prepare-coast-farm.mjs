// Offline simplification only. Original CC0 GLBs remain beside the derived assets.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {mergeVertices,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result=`data:${blob.type};base64,${Buffer.from(x).toString('base64')}`;this.onloadend?.();});}};
const path='public/assets/coast-farm/',buffer=await readFile(path+'rice-original.glb');
const {scene}=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
scene.updateMatrixWorld(true);
const report=[];
// Discover disconnected source stalks/grains, then derive one closed envelope
// per ear. Global decimation destroys small disconnected grains completely.
function components(source){
 const g=new THREE.BufferGeometry(),a=source.attributes.position;
 g.setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:a.count},(_,i)=>[a.getX(i),a.getY(i),a.getZ(i)]).flat(),3));
 if(source.index)g.setIndex(source.index.clone());
 const w=mergeVertices(g),p=w.attributes.position,parent=Array.from({length:p.count},(_,i)=>i),root=i=>{while(parent[i]!==i)i=parent[i];return i;},ix=w.index.array;
 for(let i=0;i<ix.length;i+=3){parent[root(ix[i+1])]=root(ix[i]);parent[root(ix[i+2])]=root(ix[i]);}
 const groups=new Map();for(let i=0;i<p.count;i++){const id=root(i),points=groups.get(id)??[];points.push(new THREE.Vector3().fromBufferAttribute(p,i));groups.set(id,points);}g.dispose();w.dispose();
 return [...groups.values()].map(points=>({points,box:new THREE.Box3().setFromPoints(points)}));
}
for(const [name,headVertices,stemVertices,copies,spread] of [['rice-near',10,6,2,3.7],['rice-mid',8,4,1,8.5]]){
 const parts=[];
 scene.traverse(o=>{if(!o.isMesh)return;
  // Drop the supplied soil pedestal. Preserve the mature heads separately:
  // uniform decimation used to erase their volume before simplifying stems.
  if(o.material.name==='soil')return;
  const original=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();original.applyMatrix4(o.matrixWorld);
  const pieces=components(original),shapes=[];
  if(o.material.name==='gold'){
   const stalks=pieces.filter(p=>p.box.max.y-p.box.min.y>.3&&p.box.min.y<.1);
   const ears=stalks.map(p=>({center:p.box.getCenter(new THREE.Vector3()),points:[]}));
   for(const p of pieces){
    if(stalks.includes(p)){shapes.push({points:p.points,vertices:stemVertices});continue;}
    const center=p.box.getCenter(new THREE.Vector3());let best=ears[0],distance=Infinity;
    for(const ear of ears){const d=(center.x-ear.center.x)**2+(center.z-ear.center.z)**2;if(d<distance){distance=d;best=ear;}}
    if(best)best.points.push(...p.points);
   }
   for(const ear of ears)if(ear.points.length){
    if(name==='rice-near'){
     const box=new THREE.Box3().setFromPoints(ear.points),middle=(box.min.y+box.max.y)/2;
     // Two overlapping envelopes keep the source grains' rounded lobes, instead
     // of replacing the whole ear by one long flat wedge.
     shapes.push({points:ear.points.filter(p=>p.y<middle+.022),vertices:headVertices},{points:ear.points.filter(p=>p.y>middle-.022),vertices:headVertices});
    }else shapes.push({points:ear.points,vertices:headVertices});
   }
  }else for(const p of pieces)shapes.push({points:p.points,vertices:name==='rice-near'?6:4});
  for(const shape of shapes){
  let g=new ConvexGeometry(shape.points);g.deleteAttribute('normal');g=mergeVertices(g);
  g=new SimplifyModifier().modify(g,Math.max(0,g.attributes.position.count-shape.vertices));
  if(g.index)g=g.toNonIndexed();g.computeVertexNormals();
  const colors=[],uv=[],p=g.attributes.position,c=o.material.color;
  for(let i=0;i<p.count;i++){colors.push(c.r,c.g,c.b);uv.push(0,Math.max(0,Math.min(1,p.getY(i)/.819)));}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  // A few transformed copies of the downloaded plant become one broad clump,
  // not thousands of extra Meshes. Keep original grain/leaf geometry and colors.
  for(let i=0;i<copies;i++){
   const part=g.clone(),p=part.attributes.position,a=i*2.39996;
   for(let j=0;j<p.count;j++){
    const y=p.getY(j),tip=Math.max(0,(y-.58)/.24);
    p.setXYZ(j,(p.getX(j)-.012)*spread+tip*tip*.23,(y-.05)*1.85-tip*tip*.12,(p.getZ(j)-.024)*spread);
   }
   part.rotateY(a);part.translate(Math.cos(a)*.56,i*.035,Math.sin(a)*.56);part.computeVertexNormals();
   const color=part.attributes.color;for(let j=0;j<color.count;j++)color.setXYZ(j,color.getX(j)*(1-i*.045),color.getY(j)*(1-i*.035),color.getZ(j)*(1-i*.055));parts.push(part);
  }
  g.dispose();
  }original.dispose();
 });
 const geometry=mergeGeometries(parts),mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
 mesh.name=name;
 const glb=await new GLTFExporter().parseAsync(mesh,{binary:true});await writeFile(path+name+'.glb',Buffer.from(glb));
 geometry.computeBoundingBox();report.push({name,triangles:geometry.attributes.position.count/3,bytes:glb.byteLength,bounds:geometry.boundingBox,sourceCopies:copies});
}
await writeFile(path+'simplification.json',JSON.stringify(report,null,2)+'\n');console.log(report);
await writeFile(path+'hashes.json',JSON.stringify(await Promise.all(['rice-mid','rice-near','rice-original','scarecrow'].map(async name=>({file:name+'.glb',sha256:createHash('sha256').update(await readFile(path+name+'.glb')).digest('hex')}))),null,2)+'\n');
