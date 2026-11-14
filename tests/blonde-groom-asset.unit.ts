import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {disposeScene} from '../src/dispose-scene';

const bytes=readFileSync(new URL('../public/assets/characters/coast-blonde-bob.glb',import.meta.url));
const fetchAsset=()=>vi.stubGlobal('fetch',vi.fn(async()=>new Response(bytes)));
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});

describe('accepted Blender blonde driving LOD',()=>{
 it('bounds a stalled download so the loading screen can continue with fallback',async()=>{
  vi.resetModules();vi.useFakeTimers();const asset=await import('../src/blonde-groom-asset');
  const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
  vi.stubGlobal('fetch',vi.fn((_url,{signal})=>new Promise((_resolve,reject)=>{
   signal.addEventListener('abort',()=>reject(new Error('aborted')));
  })));
  try{
   const loading=asset.preloadBlondeGroom();await vi.advanceTimersByTimeAsync(6000);
   expect(await loading).toBe(false);expect(asset.createBlenderBlondeGroom()).toBeUndefined();
  }finally{warning.mockRestore();}
 });
 it('fails safely, retries next entry, and shares one preload across callers',async()=>{
  vi.resetModules();const asset=await import('../src/blonde-groom-asset');
  const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
  try{
   expect(asset.createBlenderBlondeGroom()).toBeUndefined();
   vi.stubGlobal('fetch',vi.fn(async()=>new Response('missing',{status:404})));
   expect(await asset.preloadBlondeGroom()).toBe(false);
   expect(asset.createBlenderBlondeGroom()).toBeUndefined();
   fetchAsset();const first=asset.preloadBlondeGroom();
   expect(asset.preloadBlondeGroom()).toBe(first);expect(await first).toBe(true);
   expect(await asset.preloadBlondeGroom()).toBe(true);expect(fetch).toHaveBeenCalledTimes(1);
  }finally{warning.mockRestore();}
 });

 it('replaces the old hair within the unchanged 14k complete car budget, including instances',async()=>{
  vi.resetModules();fetchAsset();const asset=await import('../src/blonde-groom-asset');
  await asset.preloadBlondeGroom();const {createCar}=await import('../src/car');
  const car=createCar(),hair=car.getObjectByName('blender-blonde-bob') as THREE.Mesh;
  expect(hair).toBeInstanceOf(THREE.Mesh);
  expect(car.getObjectByName('layered-blonde-bob')).toBeUndefined();
  expect(car.getObjectByName('passenger')!.position.x).toBeLessThan(0);
  let triangles=0;car.traverse(o=>{if(o instanceof THREE.Mesh)
   triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof THREE.InstancedMesh?o.count:1);
  });
  expect(triangles).toBeLessThanOrEqual(14000);
  expect(hair.geometry.morphAttributes.position).toHaveLength(5);
  expect(hair.geometry.morphAttributes.normal).toHaveLength(5);
  const material=hair.material as THREE.MeshStandardMaterial;
  expect(material.transparent).toBe(false);expect(material.map).toBeNull();
  expect(bytes.length).toBeLessThan(100000);
  const motion=car.userData.motion;
  for(let i=0;i<90;i++)motion.advance(82/60,.8,1/60,10);
  expect(Math.max(...hair.morphTargetInfluences!)).toBeGreaterThan(.8);
  expect(car.getObjectByName('passenger-head')!.rotation.y).not.toBe(0);
  motion.posePassenger(.5,'wave');expect(car.getObjectByName('passenger-head')!.rotation.y).not.toBe(0);
  motion.reset();expect(hair.morphTargetInfluences!.every(v=>v===0)).toBe(true);
 });

 it('pins the crown, bends back with speed and gives tips signed lateral movement',async()=>{
  vi.resetModules();fetchAsset();const asset=await import('../src/blonde-groom-asset');
  await asset.preloadBlondeGroom();const groom=asset.createBlenderBlondeGroom()!;
  const mesh=groom.root.children[0] as THREE.Mesh;
  const sample=()=>Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>mesh.getVertexPosition(i,new THREE.Vector3()));
  const rest=sample();groom.sync(.347,0,0,1);const low=sample();
  groom.sync(1,0,0,1);const high=sample();
  let maxLow=0,maxHigh=0,pinned=0;
  rest.forEach((p,i)=>{
   maxLow=Math.max(maxLow,p.distanceTo(low[i]));maxHigh=Math.max(maxHigh,p.distanceTo(high[i]));
   if(p.y>.10){pinned++;expect(high[i].distanceTo(p)).toBeLessThan(1e-7);}
   expect(high[i].distanceTo(p)).toBeLessThan(.18);
  });
  expect(pinned).toBeGreaterThan(50);expect(maxLow).toBeGreaterThan(.015);expect(maxHigh).toBeGreaterThan(maxLow*1.5);
  const sumZ=(points:THREE.Vector3[])=>points.reduce((sum,p,i)=>sum+p.z-rest[i].z,0);
  expect(sumZ(high)).toBeLessThan(sumZ(low)); // +Z nose: wind flows aft
  groom.sync(1,1,1,0);const left=sample();groom.sync(1,-1,-1,0);const right=sample();
  expect(left.reduce((sum,p,i)=>sum+p.x-right[i].x,0)).toBeGreaterThan(.5);
  groom.sync(0,0,0,0);sample().forEach((p,i)=>expect(p.distanceTo(rest[i])).toBe(0));
 });

 it('owns independent GPU resources and survives disposal/re-entry without another fetch',async()=>{
  vi.resetModules();fetchAsset();const asset=await import('../src/blonde-groom-asset');
  await asset.preloadBlondeGroom();
  const a=asset.createBlenderBlondeGroom()!,b=asset.createBlenderBlondeGroom()!;
  const am=a.root.children[0] as THREE.Mesh,bm=b.root.children[0] as THREE.Mesh;
  expect(am.geometry).not.toBe(bm.geometry);expect(am.material).not.toBe(bm.material);
  a.sync(1,1,1,1);expect(bm.morphTargetInfluences!.every(v=>v===0)).toBe(true);
  const dispose=vi.spyOn(am.geometry,'dispose'),scene=new THREE.Scene();scene.add(a.root);
  disposeScene(scene);expect(dispose).toHaveBeenCalledOnce();
  expect(await asset.preloadBlondeGroom()).toBe(true);
  const c=asset.createBlenderBlondeGroom()!;expect(c.root.children).toHaveLength(1);
  expect(fetch).toHaveBeenCalledTimes(1);
 });
});
