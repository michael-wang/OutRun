import {it,expect} from 'vitest';
import * as THREE from 'three';
import {
 COAST_SHADOW_GROUPS,COAST_STATIC_SHADOW_LAYER,COAST_DYNAMIC_SHADOW_LAYER,
 markCoastShadowCaster,setCoastShadowGroupEnabled,coastShadowGroupEnabled,
 coastShadowGroupSnapshot,coastShadowLightEnabled,
} from '../src/coast-shadow-layers';
import {configureCoastShadowLights,CoastShadowCache} from '../src/coast-shadow-coverage';
import {COAST_SUN} from '../src/coast-dusk';

const sample=(distance:number)=>({position:new THREE.Vector3(0,4,distance)});
const mesh=()=>new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());

it('all shadow categories start ON, including the independent water boat category',()=>{
 const snapshot=coastShadowGroupSnapshot();
 expect(COAST_SHADOW_GROUPS).toHaveLength(11);
 for(const group of COAST_SHADOW_GROUPS)expect(snapshot[group.id]).toBe(true);
 expect(coastShadowLightEnabled('dynamic')).toBe(true);
 expect(coastShadowLightEnabled('static')).toBe(true);
});

it('changes only the selected caster shadows, never the original visible mesh',()=>{
 const scene=new THREE.Scene();
 const house=markCoastShadowCaster(mesh(),'static','buildings');
 const tree=markCoastShadowCaster(mesh(),'static','vegetation');
 const truck=markCoastShadowCaster(mesh(),'dynamic','traffic');
 scene.add(house,tree,truck);
 const material=tree.material;
 try{
  expect(house.layers.isEnabled(COAST_STATIC_SHADOW_LAYER)).toBe(true);
  expect(truck.layers.isEnabled(COAST_DYNAMIC_SHADOW_LAYER)).toBe(true);
  expect(setCoastShadowGroupEnabled(scene,'vegetation',false)).toBe(true);
  expect(coastShadowGroupSnapshot().vegetation).toBe(false);
  expect(house.castShadow).toBe(true);
  expect(tree.castShadow).toBe(false);
  expect(truck.castShadow).toBe(true);
  expect(tree.visible).toBe(true);
  expect(tree.material).toBe(material);
  expect(tree.receiveShadow).toBe(false);
  // A new streamed chunk loaded while OFF must obey the same user choice.
  const newTree=markCoastShadowCaster(mesh(),'static','vegetation');
  scene.add(newTree);
  expect(newTree.castShadow).toBe(false);
  expect(newTree.visible).toBe(true);
  expect(setCoastShadowGroupEnabled(scene,'vegetation',false)).toBe(false);
  expect(setCoastShadowGroupEnabled(scene,'vegetation',true)).toBe(true);
  expect(tree.castShadow).toBe(true);
  expect(newTree.castShadow).toBe(true);
  newTree.geometry.dispose();(newTree.material as THREE.Material).dispose();
 }finally{
  setCoastShadowGroupEnabled(scene,'vegetation',true);
  for(const m of [house,tree,truck]){m.geometry.dispose();(m.material as THREE.Material).dispose();}
 }
});

it('disabling all dynamic groups removes the live shadow-map pass without disabling static trees',()=>{
 const scene=new THREE.Scene();
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(near,far,true);
 const changed:typeof COAST_SHADOW_GROUPS[number]['id'][]=[];
 try{
  for(const group of COAST_SHADOW_GROUPS.filter(g=>g.kind==='dynamic')){
   setCoastShadowGroupEnabled(scene,group.id,false);changed.push(group.id);
  }
  const cache=new CoastShadowCache(near,far,sample,10000);
  cache.refreshLightCasting();
  expect(cache.near.castShadow).toBe(false);
  expect(cache.far.castShadow).toBe(true);
  cache.update(sample(500).position,500,1);
  far.shadow.needsUpdate=false;
  expect(cache.update(sample(500).position,500,1)).toBe(false);
  cache.invalidate();
  expect(cache.update(sample(500).position,500,1)).toBe(true);
  expect(far.shadow.needsUpdate).toBe(true);
  expect(cache.far.position.clone().sub(cache.far.target.position).normalize().dot(COAST_SUN)).toBeCloseTo(1,5);
 }finally{for(const group of changed)setCoastShadowGroupEnabled(scene,group,true);}
 expect(coastShadowLightEnabled('dynamic')).toBe(true);
});

it('the water shadow checkbox is independent of geometry caster settings',()=>{
 const scene=new THREE.Scene();
 const before=coastShadowGroupSnapshot();
 try{
  expect(setCoastShadowGroupEnabled(scene,'boats',false)).toBe(true);
  expect(coastShadowGroupEnabled('boats')).toBe(false);
  expect(coastShadowLightEnabled('static')).toBe(true);
  expect(coastShadowLightEnabled('dynamic')).toBe(true);
 }finally{setCoastShadowGroupEnabled(scene,'boats',before.boats);}
});
