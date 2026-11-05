import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_STATIC_SHADOW_LAYER,COAST_DYNAMIC_SHADOW_LAYER,markCoastShadowCaster} from '../src/coast-shadow-layers';
import {
 COAST_SHADOW_TECHNIQUES,coastShadowTechniqueEnabled,
 coastShadowTechniqueSnapshot,setCoastShadowTechniqueEnabled,
} from '../src/coast-shadow-techniques';
import {configureCoastShadowLights,CoastShadowCache} from '../src/coast-shadow-coverage';

const sample=(d:number)=>({position:new THREE.Vector3(0,4,d)});
const mesh=()=>new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());

it('classifies costs by five independent GPU techniques, not by object kind',()=>{
 const ids=COAST_SHADOW_TECHNIQUES.map(t=>t.id);
 expect(ids).toEqual(['dynamicMap','staticMap','boatDepth','rockShader','contactDecals']);
 expect(new Set(ids).size).toBe(ids.length);
 for(const t of COAST_SHADOW_TECHNIQUES){
  expect(t.label).not.toBe('');
  expect(t.cost.length).toBeGreaterThan(10);
  expect(t.expected).not.toBe('');
  expect(coastShadowTechniqueEnabled(t.id)).toBe(true);
 }
});

it('turning a technique off does not hide meshes or disable individual casters',()=>{
 const tree=markCoastShadowCaster(mesh(),'static','vegetation');
 const truck=markCoastShadowCaster(mesh(),'dynamic','traffic');
 const treeMaterial=tree.material;
 try{
  expect(tree.layers.isEnabled(COAST_STATIC_SHADOW_LAYER)).toBe(true);
  expect(truck.layers.isEnabled(COAST_DYNAMIC_SHADOW_LAYER)).toBe(true);
  expect(setCoastShadowTechniqueEnabled('staticMap',false)).toBe(true);
  expect(setCoastShadowTechniqueEnabled('staticMap',false)).toBe(false);
  expect(coastShadowTechniqueSnapshot().staticMap).toBe(false);
  // The renderer bypasses the light/depth pass; instances remain visible.
  expect(tree.visible).toBe(true);
  expect(tree.castShadow).toBe(true);
  expect(tree.material).toBe(treeMaterial);
  expect(truck.visible).toBe(true);
  expect(truck.castShadow).toBe(true);
  const lateTree=markCoastShadowCaster(mesh(),'static','vegetation');
  expect(lateTree.castShadow).toBe(true);
  lateTree.geometry.dispose();(lateTree.material as THREE.Material).dispose();
 }finally{
  setCoastShadowTechniqueEnabled('staticMap',true);
  tree.geometry.dispose();(tree.material as THREE.Material).dispose();
  truck.geometry.dispose();(truck.material as THREE.Material).dispose();
 }
});

it('a disabled live shadow map stops its depth pass without altering cached static shading',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight(),scene=new THREE.Scene();
 const cache=new CoastShadowCache(near,far,sample,10000);
 configureCoastShadowLights(near,far,true);
 try{
  expect(cache.near.castShadow).toBe(true);
  expect(cache.far.castShadow).toBe(true);
  expect(setCoastShadowTechniqueEnabled('dynamicMap',false)).toBe(true);
  cache.refreshLightCasting();
  expect(cache.near.castShadow).toBe(false);
  expect(cache.far.castShadow).toBe(true);
  expect(cache.update(sample(500).position,500,1)).toBe(true);
 }finally{
  setCoastShadowTechniqueEnabled('dynamicMap',true);
  cache.refreshLightCasting();
 }
 expect(cache.near.castShadow).toBe(true);
 expect(scene.children).toHaveLength(0);
});

it('static cache fully skips its camera/depth updates when off, and rebuilds on re-enable',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight(),cache=new CoastShadowCache(near,far,sample,10000);
 configureCoastShadowLights(near,far,true);
 expect(cache.update(sample(500).position,500,1)).toBe(true);
 const oldCount=cache.stats.staticRefreshRequests;
 try{
  expect(setCoastShadowTechniqueEnabled('staticMap',false)).toBe(true);
  cache.refreshLightCasting();
  expect(far.castShadow).toBe(false);
  expect(near.castShadow).toBe(true);
  expect(cache.update(sample(1500).position,1500,5)).toBe(false);
  expect(cache.stats.staticRefreshRequests).toBe(oldCount);
 }finally{
  setCoastShadowTechniqueEnabled('staticMap',true);
  cache.refreshLightCasting();
 }
 cache.invalidate();
 expect(cache.update(sample(500).position,500,1)).toBe(true);
 expect(far.castShadow).toBe(true);
 expect(far.shadow.needsUpdate).toBe(true);
 expect(cache.stats.staticRefreshRequests).toBe(oldCount+1);
});

it('water depth, analytic rock shader and 2D decals remain separate A/B hypotheses',()=>{
 const initial=coastShadowTechniqueSnapshot();
 try{
  for(const id of ['boatDepth','rockShader','contactDecals'] as const)expect(setCoastShadowTechniqueEnabled(id,false)).toBe(true);
  const after=coastShadowTechniqueSnapshot();
  expect(after.dynamicMap).toBe(true);
  expect(after.staticMap).toBe(true);
  expect(after.boatDepth).toBe(false);
  expect(after.rockShader).toBe(false);
  expect(after.contactDecals).toBe(false);
 }finally{
  for(const t of COAST_SHADOW_TECHNIQUES)setCoastShadowTechniqueEnabled(t.id,initial[t.id]);
 }
});

it('the pause UI and FPS log record technique IDs, not the retired object-kind checkboxes',async()=>{
 const {readFileSync}=await import('node:fs');
 const dock=readFileSync(new URL('../src/trip-pause-dock.ts',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 expect(dock).toContain('data-shadow-technique');
 expect(dock).not.toContain('data-shadow-group');
 expect(main).toContain('shadowTechniques:coastShadowTechniqueSnapshot()');
 expect(main).not.toContain('shadowGroups:coastShadowGroupSnapshot()');
});
