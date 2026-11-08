import {describe,it,expect,vi,afterAll} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from 'three';
import {coastHillHeight,coastWildness} from '../src/coast-terrain';
import {meadowCover} from '../src/coast-meadow-layout';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {farmPlainMask} from '../src/coast-farm-layout';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {addCoastNature,loadCoastNature,COAST_HERO_TREE_SITES} from '../src/coast-nature';
import {roadsideTrees,TREE_DRAW_DISTANCE} from '../src/tree-models';
import {addJourneyScenery} from '../src/scenery';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';

const track=createPilotTrack(stage),assets=JSON.parse(readFileSync('public/assets/coast-nature/models.json','utf8'));
const woods=JSON.parse(readFileSync('public/assets/coast-nature/headland-grove.json','utf8'));
afterAll(()=>vi.unstubAllGlobals());
describe('sunset coast nature',()=>{
 it('returns the fixed sun to four forward-left bays with safe shallow bends',()=>{
  for(const [a,b] of [[1100,1950],[3900,4800],[6550,7250],[10175,10350]])for(let d=a;d<b;d+=25){
   const p=track.sample(d),angle=p.roadHeading+Math.atan2(.66,.75);
   expect(angle).toBeGreaterThan(.3);expect(angle).toBeLessThan(.45);
  }
  // The fishing point brings the sunset toward the windscreen centre,
  // then opens the old forward-left vista again on the finish approach.
  for(let d=8950;d<=10350;d+=20){
   const angle=track.sample(d).roadHeading+Math.atan2(.66,.75);
   expect(angle).toBeGreaterThan(0);expect(angle).toBeLessThan(.45);
  }
  for(let d=350;d<10350;d+=5)expect(Math.abs(track.sample(d).curvature)).toBeLessThan(.0016);
 });
 it('leaves a broad flat coastal plain and district forecourts, with hills in the middle distance',()=>{
  for(let d=350;d<10350;d+=25)for(const x of [-60,-13,0,13,18,45,70,88])if(x<=18||(!farmPlainMask(x,d)&&!meadowCover(x,d)))expect(coastHillHeight(x,d)).toBe(0);
  for(const zone of COAST_DISTRICTS)for(let d=zone.start;d<zone.end;d+=25){expect(coastWildness(d)).toBe(0);for(const x of [24,40,65])expect(coastHillHeight(x,d)).toBe(0);}
  for(const d of [1250,1750,4650,6150,7600]){
   const heights=Array.from({length:32},(_,i)=>coastHillHeight(140+i*10,d));
   expect(Math.max(...heights)).toBeGreaterThan(14);
   expect(heights.some((h,i)=>i>0&&h<heights[i-1]-.1)).toBe(true);
  }
  for(const zone of COAST_DISTRICTS)for(const d of [zone.start,zone.end])expect(Math.abs(coastHillHeight(155,d-.001)-coastHillHeight(155,d+.001))).toBeLessThan(.001);
 });
 it('carries the turf mask across chunk seams and over the last hill strip',()=>{
  const boundary=2000,seen:number[][]=[];
  for(const [start,end] of [[1000,boundary],[boundary,3000]]){
   const terrain=prepareRoadChunk(track.sample,()=>7,()=>[1,0,0],start,end,track.length,false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections).find(m=>m.kind==='grass')!;
   const edge=[];
   for(let i=0;i<terrain.uvs.length;i+=2)if(terrain.uvs[i+1]===boundary/4)edge.push(terrain.uvs[i]);
   expect(edge.length).toBeGreaterThan(0);expect(edge.at(-1)).toBe(1);seen.push(edge);
  }
  expect(seen[0]).toEqual(seen[1]);
  expect(meadowCover(450,2530)).toBe(1);
  const heights=Array.from({length:25},(_,i)=>coastHillHeight(48,1774+i*8));
  expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(.7);
  for(const d of [537,1270,3700,9350])expect(meadowCover(45,d)).toBe(0);
  for(const d of [537,1270,1774,3700,9350])expect(meadowCover(365,d)).toBe(1);
  expect(meadowCover(14.75,1774)).toBe(0);
 });
 it('roots batched source models on the rendered hill mesh, with bounded far geometry',async()=>{
  const fetchModels=vi.fn(async(url:string)=>({ok:true,json:async()=>url.endsWith('headland-grove.json')?woods:assets}));
  vi.stubGlobal('fetch',fetchModels);
  await Promise.all([loadCoastNature(),loadCoastNature()]);
  expect(fetchModels).toHaveBeenCalledTimes(2);
  // Chapter II intentionally has scattered scrub, unlike the former densely
  // wooded 1–2km stretch; use the new quiet-beach chapter for this ground check.
  const start=2000,end=3000,scene=new THREE.Scene();
  addCoastNature(scene,track.sample,start,end);
  const crowns=scene.children.filter(o=>o.userData.nature?.leafCutout&&o.userData.nature.center===2900) as THREE.InstancedMesh[];
  expect(crowns).toHaveLength(2);
  const size=new THREE.Vector3(),transform=new THREE.Matrix4();
  let mature=0;
  for(const mesh of crowns)for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,transform);
   if(size.setFromMatrixScale(transform).y>=7)mature++;
  }
  expect(mature).toBe(44);
  expect(crowns.every(mesh=>mesh.userData.nature.center===2900&&mesh.geometry.index)).toBe(true);
  const terrain=prepareRoadChunk(track.sample,()=>7,()=>[1,0,0],start,end,track.length,false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections).find(m=>m.kind==='grass')!;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(terrain.positions,3));geometry.setIndex(new THREE.BufferAttribute(terrain.indices,1));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld(true);
  const matrix=new THREE.Matrix4(),base=new THREE.Vector3();let checked=0;
  for(const child of scene.children){const o=child as THREE.InstancedMesh,n=o.userData.nature;
   if(n.near)expect(o.geometry.attributes.position.count/3).toBeLessThan(200);
   if(n.texture)expect(existsSync('public/assets/coast-nature/'+n.texture)).toBe(true);
   for(let i=0;i<o.count;i++){
    o.getMatrixAt(i,matrix);base.setFromMatrixPosition(matrix);
    const hits=new THREE.Raycaster(base.clone().add(new THREE.Vector3(0,100,0)),new THREE.Vector3(0,-1,0)).intersectObject(mesh);
    expect(hits.length).toBeGreaterThan(0);
    expect(Math.abs(hits[0].point.y-base.y)).toBeLessThan(.08);checked++;
   }
  }
  expect(checked).toBeGreaterThan(15);
  // Trees and rocks remain in bounded 200 m instance batches.
  expect(checked).toBeLessThan(450);expect(scene.children.length).toBeLessThan(90);
  expect(scene.children.some(o=>o.name==='coast-instanced-grass')).toBe(false);
  expect(TREE_DRAW_DISTANCE).toBeGreaterThan(1200);
  const again=new THREE.Scene();addCoastNature(again,track.sample,start,end);
  expect(again.children.map(o=>Array.from((o as THREE.InstancedMesh).instanceMatrix.array))).toEqual(scene.children.map(o=>Array.from((o as THREE.InstancedMesh).instanceMatrix.array)));
  geometry.dispose();(mesh.material as THREE.Material).dispose();
 });
});

describe('baked trees throughout the game',()=>{
 it('keeps distinct 3D branches and cutout leaves in both detail budgets',()=>{
  expect(Object.keys(assets)).toEqual(['Rock_Medium_2']);
  for(const species of ['Oak','Pine'] as const){
   const compact=roadsideTrees[('Road'+species) as keyof typeof roadsideTrees],full=woods['Grove'+species];
   expect(compact.parts).toHaveLength(2);
   expect(compact.parts.map(p=>p.texture)).toEqual(['Bark_NormalTree.png',species.toLowerCase()+'_color.png']);
   expect(compact.parts[1].leafCutout).toBe(true);
   for(const part of compact.parts){
    expect(part.normal.length).toBe(part.position.length);
    expect(part.uv.length*3).toBe(part.position.length*2);
    for(const axis of [0,1,2]){
     const values=part.position.filter((_,i)=>i%3===axis);
     expect(Math.max(...values)-Math.min(...values)).toBeGreaterThan(.12);
    }
   }
   const tris=(m:typeof compact)=>m.parts.reduce((n,p)=>n+p.index.length/3,0);
   expect(tris(compact)).toBeLessThan(1000);
   expect(tris(compact)).toBeLessThan(tris(full));
  }
 });
 it.each([[1,0,0,'pine_color.png'],[0,1,0,'oak_color.png'],[0,0,1,'oak_color.png']] as const)(
  'pairs bark and foliage at matching roadside positions for biome %i/%i/%i',(coast,canyon,city,leaf)=>{
   const scene=new THREE.Scene();
   addJourneyScenery(scene,track.sample,track.length,0,1,()=>7,()=>[coast,canyon,city],{start:0,end:1000,openRoad:true});
   const trees:THREE.InstancedMesh[]=[];
   scene.traverse(o=>{if(o instanceof THREE.InstancedMesh&&o.userData.nature)trees.push(o);});
   const foliage=trees.filter(o=>o.userData.nature.texture===leaf&&o.userData.nature.leafCutout);
   expect(foliage.length).toBeGreaterThan(0);
   for(const crown of foliage){
    const trunk=trees.find(o=>o.userData.nature.texture==='Bark_NormalTree.png'&&o.userData.nature.center===crown.userData.nature.center);
    expect(trunk?.instanceMatrix.array).toEqual(crown.instanceMatrix.array);
   }
  });
 it('keeps a bark trunk and textured branching canopy at each authored field-edge site',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,json:async()=>url.endsWith('headland-grove.json')?woods:assets})));
  await loadCoastNature();
  const scene=new THREE.Scene();
  for(const start of [0,1000])addCoastNature(scene,track.sample,start,start+1000);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(const [d,x] of [...COAST_HERO_TREE_SITES.map(t=>[t.d,t.x]),[148,72],[460,267],[760,266],[1310,265],[1660,268]]){
   const frame=track.sample(d),site=frame.position.clone().addScaledVector(frame.right,x);
   const parts:THREE.InstancedMesh[]=[];
   for(const obj of scene.children as THREE.InstancedMesh[])for(let i=0;i<obj.count;i++){
    obj.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
    if(Math.hypot(position.x-site.x,position.z-site.z)<.01)parts.push(obj);
   }
   expect(parts).toHaveLength(2);
   expect(parts.some(m=>m.userData.nature.texture==='Bark_NormalTree.png')).toBe(true);
   expect(parts.some(m=>m.userData.nature.leafCutout&&m.geometry.hasAttribute('uv'))).toBe(true);
  }
 });
});
