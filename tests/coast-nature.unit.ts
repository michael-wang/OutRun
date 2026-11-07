import {describe,it,expect,vi,afterAll} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from 'three';
import {coastHillHeight,coastWildness} from '../src/coast-terrain';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {farmPlainMask} from '../src/coast-farm-layout';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {addCoastNature,loadCoastNature,COAST_HERO_TREE_SITES,COAST_TREE_MODEL,COAST_TREE_DRAW_DISTANCE} from '../src/coast-nature';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';

const track=createPilotTrack(stage),assets=JSON.parse(readFileSync('public/assets/coast-nature/models.json','utf8'));
afterAll(()=>vi.unstubAllGlobals());
describe('sunset coast nature',()=>{
 it('returns the fixed sun to four forward-left bays with safe shallow bends',()=>{
  for(const [a,b] of [[1100,1950],[3900,4800],[6550,7250],[9050,10100]])for(let d=a;d<b;d+=25){
   const p=track.sample(d),angle=p.roadHeading+Math.atan2(.66,.75);
   expect(angle).toBeGreaterThan(.3);expect(angle).toBeLessThan(.45);
  }
  for(let d=350;d<10350;d+=5)expect(Math.abs(track.sample(d).curvature)).toBeLessThan(.0016);
 });
 it('leaves a broad flat coastal plain and district forecourts, with hills in the middle distance',()=>{
  for(let d=350;d<10350;d+=25)for(const x of [-60,-13,0,13,18,45,70,88])if(x<=18||!farmPlainMask(x,d))expect(coastHillHeight(x,d)).toBe(0);
  for(const zone of COAST_DISTRICTS)for(let d=zone.start;d<zone.end;d+=25){expect(coastWildness(d)).toBe(0);for(const x of [24,40,65])expect(coastHillHeight(x,d)).toBe(0);}
  for(const d of [1250,1750,4650,6150,7600]){
   const heights=Array.from({length:32},(_,i)=>coastHillHeight(140+i*10,d));
   expect(Math.max(...heights)).toBeGreaterThan(14);
   expect(heights.some((h,i)=>i>0&&h<heights[i-1]-.1)).toBe(true);
  }
  for(const zone of COAST_DISTRICTS)for(const d of [zone.start,zone.end])expect(Math.abs(coastHillHeight(155,d-.001)-coastHillHeight(155,d+.001))).toBeLessThan(.001);
 });
 it('roots batched source models on the rendered hill mesh, with bounded far geometry',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>assets})));
  await loadCoastNature();
  // Chapter II intentionally has scattered scrub, unlike the former densely
  // wooded 1–2km stretch; use the new quiet-beach chapter for this ground check.
  const start=2000,end=3000,scene=new THREE.Scene();
  addCoastNature(scene,track.sample,start,end);
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
  // New grass reuses the same cached InstancedMesh model in 200m buckets.
  expect(checked).toBeLessThan(450);expect(scene.children.length).toBeLessThan(90);
  expect(scene.children.some(o=>o.name==='coast-instanced-grass')).toBe(false);
  expect(COAST_TREE_MODEL).toBe('CommonTree_3');
  expect(COAST_TREE_DRAW_DISTANCE).toBeGreaterThan(1200);
  const again=new THREE.Scene();addCoastNature(again,track.sample,start,end);
  expect(again.children.map(o=>Array.from((o as THREE.InstancedMesh).instanceMatrix.array))).toEqual(scene.children.map(o=>Array.from((o as THREE.InstancedMesh).instanceMatrix.array)));
  geometry.dispose();(mesh.material as THREE.Material).dispose();
 });
});

describe('single full 3D tree model and no added grass',()=>{
 it('has no grass placements or flat tree swap',()=>{
  const src=readFileSync('src/coast-nature.ts','utf8');
  expect(src).not.toContain("plant('Grass_Common_Short'");
  expect(src).not.toContain("name==='Grass_Common_Short'");
  expect(src).toContain("name===COAST_TREE_MODEL?[...model.parts,coastTreeVolume()]");
  expect(src).toContain('coastBushVolume()');
  expect(src).not.toContain('model.far');
  expect(Object.keys(assets).sort()).toEqual(['CommonTree_3','Rock_Medium_2'].sort());
  expect(assets.Bush_Common).toBeUndefined();
  for(const name of ['CommonTree_1','Pine_5','Grass_Common_Short'])
   expect(assets[name]).toBeUndefined();
  expect(assets[COAST_TREE_MODEL].far).toBeUndefined();
  for(const part of assets[COAST_TREE_MODEL].parts){
   const positions=part.position as number[];
   const xs=positions.filter((_:number,i:number)=>i%3===0);
   const zs=positions.filter((_:number,i:number)=>i%3===2);
   expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(.15);
   expect(Math.max(...zs)-Math.min(...zs)).toBeGreaterThan(.15);
  }
  expect(COAST_HERO_TREE_SITES).toHaveLength(5);
  expect(readFileSync('src/scenery.ts','utf8')).not.toContain("part(round,'#496c45'");
 });
 it('uses the same 3D crown near farmhouses',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>assets})));
  await loadCoastNature();
  const scene=new THREE.Scene();
  addCoastNature(scene,track.sample,1000,1150);
  const trees=scene.children.filter(o=>o.name==='coast-nature'&&o.userData.nature?.far===COAST_TREE_DRAW_DISTANCE);
  expect(trees.length).toBeGreaterThanOrEqual(assets[COAST_TREE_MODEL].parts.length);
  expect(trees.some(o=>(o as THREE.InstancedMesh).count>=5)).toBe(true);
 });
 it('keeps a bark trunk and opaque volumetric crown at each authored field-edge site',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>assets})));
  await loadCoastNature();
  const scene=new THREE.Scene();
  for(const start of [0,1000])addCoastNature(scene,track.sample,start,start+1000);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(const [d,x] of [[148,72],[460,267],[760,266],[1310,265],[1660,268]]){
   const frame=track.sample(d),site=frame.position.clone().addScaledVector(frame.right,x);
   const parts:THREE.InstancedMesh[]=[];
   for(const obj of scene.children as THREE.InstancedMesh[])for(let i=0;i<obj.count;i++){
    obj.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
    if(Math.hypot(position.x-site.x,position.z-site.z)<.01)parts.push(obj);
   }
   expect(parts).toHaveLength(2);
   expect(parts.some(m=>m.userData.nature.texture==='Bark_NormalTree.png')).toBe(true);
   expect(parts.some(m=>m.geometry.hasAttribute('color')&&!m.geometry.hasAttribute('uv'))).toBe(true);
  }
 });
});

it('uses actual shaded convex foliage instead of billboards at home and on hills',async()=>{
 const {coastTreeVolume,coastBushVolume}=await import('../src/coast-volume-foliage');
 for(const geometry of [coastTreeVolume(),coastBushVolume()]){
  expect(geometry.position.length/3).toBeGreaterThan(400);
  expect(geometry.normal).toHaveLength(geometry.position.length);
  expect(geometry.color).toHaveLength(geometry.position.length);
  const xs=geometry.position.filter((_:number,i:number)=>i%3===0);
  const ys=geometry.position.filter((_:number,i:number)=>i%3===1);
  const zs=geometry.position.filter((_:number,i:number)=>i%3===2);
  expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(.39);
  expect(Math.max(...ys)-Math.min(...ys)).toBeGreaterThan(.35);
  expect(Math.max(...zs)-Math.min(...zs)).toBeGreaterThan(.40);
 }
 const asset=JSON.parse(readFileSync('public/assets/coast-nature/models.json','utf8'));
 expect(asset.CommonTree_3.parts).toHaveLength(1);
 expect(asset.CommonTree_3.parts[0].texture).toBe('Bark_NormalTree.png');
 expect(asset.Bush_Common).toBeUndefined();
});
