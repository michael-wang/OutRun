import {it,expect} from 'vitest';
import * as THREE from 'three';
import {FARM_PLOTS} from '../src/coast-farm-layout';
import {prepareFarmPlot,farmPrepTransferables} from '../src/coast-farm-prep';
import {createFarmPlot,type FarmAssets} from '../src/coast-farm';
import {Grass} from '../src/vendor/three-stylized/Grass';
import type {createTrack} from '../src/track';

const sample=((distance:number)=>({
 position:new THREE.Vector3(Math.sin(distance*.001)*4,3+Math.cos(distance*.002),distance),
 right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,0,1),
 roadHeading:0,halfWidth:7,
})) as unknown as ReturnType<typeof createTrack>['sample'];

function fakeAssets(){
 const geometries=[new THREE.BoxGeometry(.2,.9,.2),new THREE.BoxGeometry(.5,1.8,.3)];
 const mats=new Map<string,THREE.MeshStandardMaterial>();
 const material=(kind:string,color:string)=>{
  const key=kind+color;
  let m=mats.get(key);
  if(!m){m=new THREE.MeshStandardMaterial({color,vertexColors:kind==='canopy'});mats.set(key,m);}
  return m;
 };
 return {
  assets:{geometries,material,time:{value:0},dispose(){geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}} as unknown as FarmAssets,
  dispose(){geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());},
 };
}

it('worker-prepared rice canopy reproduces mesh layout and colours without main-thread generation',()=>{
 const plot=FARM_PLOTS.find(p=>p.kind==='rice'&&p.band===0)!;
 const prep=prepareFarmPlot(plot,sample);
 expect(prep.id).toBe(plot.id);
 expect(prep.canopy?.position.length).toBeGreaterThan(0);
 expect(prep.meadow).toBeUndefined();
 const fresh=fakeAssets();
 const a=createFarmPlot(plot,sample,fresh.assets);
 const b=createFarmPlot(plot,sample,fresh.assets,prep);
 try{
  const geometry=(p:typeof a)=>p.group.getObjectByName('rice-canopy') as THREE.Mesh;
  const ga=geometry(a).geometry,gb=geometry(b).geometry;
  for(const attr of ['position','uv','color','normal'] as const){
   const aa=ga.getAttribute(attr),bb=gb.getAttribute(attr);
   expect(bb.count).toBe(aa.count);
   for(let i=0;i<Math.min(aa.count,25);i++)
    for(let j=0;j<aa.itemSize;j++)
     expect(Math.abs(aa.getComponent(i,j)-bb.getComponent(i,j))).toBeLessThan(.005);
  }
  expect(Array.from(ga.getIndex()!.array)).toEqual(Array.from(gb.getIndex()!.array));
  expect(a.stats().crops).toEqual(b.stats().crops);
 }finally{a.dispose();b.dispose();fresh.dispose();}
});

it('worker-prepared flower and grass samples retain counts and placement',()=>{
 const plot=FARM_PLOTS.find(p=>p.kind==='flowers'&&p.band===0)!;
 const prep=prepareFarmPlot(plot,sample);
 expect(prep.meadow?.blades.length).toBeGreaterThan(0);
 expect(prep.meadow?.flowerInstances?.matrices.length).toBeGreaterThan(0);
 expect(prep.meadow?.flowerInstances?.coastalStyled).toBe(true);
 expect(prep.meadow?.flowers.length).toBe(0); // raw samples stay in the worker
 const fresh=fakeAssets();
 const a=createFarmPlot(plot,sample,fresh.assets);
 const b=createFarmPlot(plot,sample,fresh.assets,prep);
 try{
  expect(a.stats().blades).toBe(b.stats().blades);
  expect(a.stats().flowers).toBe(b.stats().flowers);
  const meadowA=a.group.children.find(o=>o instanceof Grass) as Grass;
  const meadowB=b.group.children.find(o=>o instanceof Grass) as Grass;
  expect(meadowA).toBeDefined();expect(meadowB).toBeDefined();
  for(const meshName of ['blades','flowers'] as const){
   const pick=(group:Grass)=>meshName==='blades'?group.blades.blades:group.wildflowers!.flowers;
   const aa=pick(meadowA).instanceMatrix.array,bb=pick(meadowB).instanceMatrix.array;
   expect(aa.length).toBe(bb.length);
   // Check across the whole field, including final flowers rather than only the first 6 matrices.
   for(const i of [0,1,16,65,100,Math.floor(aa.length/2),aa.length-17,aa.length-1])
    if(i>=0&&i<aa.length)expect(Math.abs(aa[i]-bb[i])).toBeLessThan(.005);
  }
  for(const attr of ['aVariant','aPetalColor','aFoliageColor','aCentreColor']){
   const aa=meadowA.wildflowers!.flowers.geometry.getAttribute(attr).array;
   const bb=meadowB.wildflowers!.flowers.geometry.getAttribute(attr).array;
   expect(aa.length).toBe(bb.length);
   for(const i of [0,1,12,36,Math.floor(aa.length/2),aa.length-3,aa.length-1])
    if(i>=0&&i<aa.length)expect(Math.abs(aa[i]-bb[i])).toBeLessThan(.005);
  }
 }finally{a.dispose();b.dispose();fresh.dispose();}
});

it('transfer lists contain each typed array once and do not include THREE objects',()=>{
 const plot=FARM_PLOTS.find(p=>p.kind==='rice')!;
 const prep=prepareFarmPlot(plot,sample);
 const transfers=farmPrepTransferables(prep);
 expect(transfers.length).toBe(6);
 expect(new Set(transfers).size).toBe(transfers.length);
 expect(transfers.every(buffer=>buffer instanceof ArrayBuffer)).toBe(true);
});
