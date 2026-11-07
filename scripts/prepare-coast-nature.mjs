import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Download the author's free Standard archive, extract it, then pass its root.
// No runtime OBJ parser, normal maps, per-tree materials or shadow maps.
const source=resolve(process.argv[2]||'art-prototype/output/coast-nature/standard');
const destination=resolve('public/assets/coast-nature');await mkdir(destination,{recursive:true});
const names=['CommonTree_3','Rock_Medium_2'];
const textures=new Set(),models={},provenance=[];
const serialize=g=>({position:Array.from(g.attributes.position.array,v=>+v.toFixed(4)),normal:Array.from(g.attributes.normal.array,v=>+v.toFixed(4)),uv:g.attributes.uv?Array.from(g.attributes.uv.array,v=>+v.toFixed(5)):[],color:g.attributes.color?Array.from(g.attributes.color.array,v=>+v.toFixed(4)):[]});
for(const name of names){
 const obj=await readFile(resolve(source,'OBJ',name+'.obj'),'utf8'),mtl=await readFile(resolve(source,'OBJ',name+'.mtl'),'utf8');
 provenance.push({name,sha256:createHash('sha256').update(obj).digest('hex')});
 const mappings={};let material;
 for(const line of mtl.split(/\r?\n/)){if(line.startsWith('newmtl ')){material=line.slice(7);mappings[material]={};}if(line.startsWith('map_Kd '))mappings[material].texture=line.split(/[\\/]/).at(-1);if(line.startsWith('map_d '))mappings[material].alpha=true;}
 const root=new OBJLoader().parse(obj),box=new THREE.Box3().setFromObject(root),height=box.max.y-box.min.y,center=box.getCenter(new THREE.Vector3()),parts=[];
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material],g=mesh.geometry;
  const groups=g.groups.length?g.groups:[{start:0,count:g.attributes.position.count,materialIndex:0}];
  for(const group of groups){
   const m=mappings[materials[group.materialIndex].name]||{};
   // Keep the original tree's normalization for the shared 3D crown.
   // Only the trunk is imported; leaf cards never enter the output.
   if(m.alpha)continue;
   let geo=new THREE.BufferGeometry();
   for(const key of ['position','normal','uv']){const a=g.attributes[key];if(a)geo.setAttribute(key,new THREE.Float32BufferAttribute(a.array.slice(group.start*a.itemSize,(group.start+group.count)*a.itemSize),a.itemSize));}
   geo.translate(-center.x,-box.min.y,-center.z);geo.scale(1/height,1/height,1/height);
   if(m.texture==='Bark_NormalTree.png'){
    const welded=mergeVertices(geo);const simplified=new SimplifyModifier().modify(welded,Math.floor(welded.attributes.position.count*.65));
    geo=simplified.index?simplified.toNonIndexed():simplified;
   }
   if(m.texture)textures.add(m.texture);
   parts.push({...m,...serialize(geo)});
  }
 });
 models[name]={parts,sourceHeight:height};
 console.log(name,parts.reduce((n,p)=>n+p.position.length/9,0),'triangles');
}
for(const file of textures){
 execFileSync('magick',[resolve(source,'Textures',file),'-resize','512x512',resolve(destination,file)]);
}
await copyFile(resolve(source,'License_Standard.txt'),resolve(destination,'LICENSE.txt'));
await writeFile(resolve(destination,'models.json'),JSON.stringify(models));
await writeFile(resolve(destination,'provenance.json'),JSON.stringify({source:'https://quaternius.com/packs/stylizednaturemegakit.html',edition:'Free Standard',models:provenance},null,2)+'\n');
