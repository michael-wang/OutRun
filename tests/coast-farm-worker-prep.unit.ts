import {it,expect} from 'vitest';
import * as THREE from 'three';
import {FARM_PLOTS,FARM_FLOWER_DETAIL} from '../src/coast-farm-layout';
import {prepareFarmPlot,farmPrepTransferables} from '../src/coast-farm-prep';
import {createFarmPlot,type FarmAssets} from '../src/coast-farm';
import {RICE_ROW_PITCH,RICE_FIRST_HILL,RICE_HILL_PITCH} from '../src/coast-rice-layout';
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

it('aligns roadside rice blocks to planted rows and restricts water to the bed',()=>{
 const plot=FARM_PLOTS.find(p=>p.kind==='rice'&&p.band===0)!;
 const right=new THREE.Vector3(.8,0,-.6),forward=new THREE.Vector3(.6,0,.8);
 const angled=((d:number)=>({...sample(d),position:forward.clone().multiplyScalar(d),right,tangent:forward})) as typeof sample;
 const assets=fakeAssets(),patch=createFarmPlot(plot,angled,assets.assets,prepareFarmPlot(plot,angled));
 try{
  const crop=patch.group.children.find(o=>o.userData.farmLod===0) as THREE.InstancedMesh;
  const m=new THREE.Matrix4(),v=new THREE.Vector3();
  for(let i=0;i<crop.count;i++){
   crop.getMatrixAt(i,m);
   expect(v.setFromMatrixColumn(m,0).distanceTo(right)).toBeLessThan(.00001);
   v.setFromMatrixPosition(m);
   const col=(v.dot(right)-plot.left-RICE_FIRST_HILL-RICE_ROW_PITCH*.5)/(2*RICE_ROW_PITCH);
   const row=(v.dot(forward)-plot.start-RICE_FIRST_HILL-RICE_HILL_PITCH)/(3*RICE_HILL_PITCH);
   expect(col).toBeCloseTo(Math.round(col),4);expect(row).toBeCloseTo(Math.round(row),4);
  }
  const bed=patch.group.children.find(o=>o instanceof THREE.Mesh&&o.geometry.hasAttribute('paddyAcross')) as THREE.Mesh;
  const axes=bed.geometry.getAttribute('paddyAcross'),ix=bed.geometry.index!;
  let wet=0,dry=0;
  for(let i=0;i<ix.count;i+=3){
   const first=ix.getX(i),x=axes.getX(first),z=axes.getY(first);
   for(let j=1;j<=2;j++){expect(axes.getX(ix.getX(i+j))).toBeCloseTo(x,4);expect(axes.getY(ix.getX(i+j))).toBeCloseTo(z,4);}
   if(x===0&&z===0)dry++;else{expect(x).toBeCloseTo(right.x);expect(z).toBeCloseTo(right.z);wet++;}
  }
  expect(wet).toBe(Math.ceil((plot.end-plot.start)/4)*2);expect(dry).toBeGreaterThan(0);
 }finally{patch.dispose();assets.dispose();}
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
  const bed=b.group.children.find(o=>o instanceof THREE.Mesh&&o.geometry.hasAttribute('flowerLayer')) as THREE.Mesh;
  expect(bed.geometry.hasAttribute('paddyAcross')).toBe(false);
  expect(new Set(bed.geometry.getAttribute('flowerLayer').array)).toEqual(new Set([0,1]));
  expect(a.stats().blades).toBe(b.stats().blades);
  expect(a.stats().flowers).toBe(b.stats().flowers);
  const meadowA=a.group.children.find(o=>o instanceof Grass) as Grass;
  const meadowB=b.group.children.find(o=>o instanceof Grass) as Grass;
  expect(meadowA).toBeDefined();expect(meadowB).toBeDefined();
  const blossom=meadowB.wildflowers!.flowers.geometry;
  expect(blossom.boundingBox!.max.z-blossom.boundingBox!.min.z).toBeGreaterThan(.5);
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

it('keeps accepted golden rice and cuts distant flower blade/mesh costs',()=>{
 const rice=FARM_PLOTS.find(p=>p.kind==='rice'&&p.band===0)!;
 const far=FARM_PLOTS.find(p=>p.kind==='flowers'&&p.band===2)!;
 const near=FARM_PLOTS.find(p=>p.kind==='flowers'&&p.band===0)!;
 expect(prepareFarmPlot(rice,sample).canopy).toBeDefined();
 expect(prepareFarmPlot(far,sample).meadow).toBeUndefined();
 const nearPrep=prepareFarmPlot(near,sample);
 expect(nearPrep.meadow?.flowerInstances).toBeDefined();
 const blooms=nearPrep.meadow!.flowerInstances!.matrices.length/16;
 expect(blooms).toBeGreaterThan(1400);
 expect(blooms).toBeLessThanOrEqual(FARM_FLOWER_DETAIL[0].maxFlowers);
 const assets=fakeAssets();
 const patch=createFarmPlot(far,sample,assets.assets,prepareFarmPlot(far,sample));
 try{
  expect(patch.group.children.some(c=>c instanceof Grass)).toBe(false);
  expect(patch.stats().flowers).toBe(0);
  expect(patch.stats().blades).toBe(0);
  const bed=patch.group.children.find(o=>o instanceof THREE.Mesh&&o.geometry.hasAttribute('flowerLayer')) as THREE.Mesh;
  expect(new Set(bed.geometry.getAttribute('flowerLayer').array)).toEqual(new Set([0,2]));
 }finally{patch.dispose();assets.dispose();}
});
