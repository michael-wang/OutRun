import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {disposeScene} from '../src/dispose-scene';
afterEach(()=>vi.unstubAllGlobals());
it('loads a bounded approved-sculpt bust, keeps independent expressions and synchronizes the existing head/gesture pivots',async()=>{
 vi.resetModules();
 const bust=readFileSync(new URL('../public/assets/characters/coast-heroine-r7a.glb',import.meta.url));
 const hair=readFileSync(new URL('../public/assets/characters/coast-blonde-r6d.glb',import.meta.url));
 expect(createHash('sha256').update(hair).digest('hex')).toBe('8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519');
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(url.includes('heroine')?bust:hair)));
 const asset=await import('../src/heroine-bust-asset');expect(await asset.preloadHeroineBust()).toBe(true);
 const hairAsset=await import('../src/blonde-groom-asset');expect(await hairAsset.preloadBlondeGroom()).toBe(true);
 const {createCar}=await import('../src/car');const car=createCar(),other=createCar();
 const root=car.getObjectByName('heroine-upper-body')!,head=car.getObjectByName('heroine-head')!,pivot=car.getObjectByName('passenger-head')!;
 const meshes:THREE.SkinnedMesh[]=[];root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)meshes.push(o);});
 expect(meshes).toHaveLength(4);expect(meshes.reduce((n,m)=>n+m.geometry.index!.count/3,0)).toBeLessThan(40000);
 expect(bust.length).toBeLessThan(2500000);expect(car.getObjectByName('passenger')!.scale.toArray()).toEqual([1,1,1]);
 for(const mesh of meshes){
  expect(mesh.skeleton.bones).toHaveLength(2);expect((mesh.material as THREE.Material).transparent).toBe(false);
  expect(mesh.morphTargetDictionary).toHaveProperty('mouthOpen');
  const g=mesh.geometry;for(let i=0;i<g.attributes.position.count;i++){
   let sum=0;for(let k=0;k<4;k++)sum+=g.attributes.skinWeight.getComponent(i,k);
   expect(sum).toBeCloseTo(1,5);for(let k=0;k<3;k++)expect(Number.isFinite(g.attributes.position.getComponent(i,k))).toBe(true);
  }
 }
 const motion=car.userData.motion;motion.setPassengerLook(.5);expect(pivot.rotation.y).toBeCloseTo(.5);expect(head.rotation.y).toBeCloseTo(.5);
 motion.posePassenger(.6,'wave');expect(head.rotation.y).toBeCloseTo(pivot.rotation.y);
 expect(meshes[0].morphTargetInfluences![0]).toBeGreaterThan(.58);
 expect(other.getObjectByName('heroine-head')!.rotation.y).toBe(0);
 motion.reset();expect(pivot.rotation.y).toBe(0);expect(head.rotation.y).toBe(0);
 for(let i=0;i<120;i++)motion.advance(80/60,.4,1/60,6,0,0,{airX:2.6,airZ:0,velocityX:0,velocityZ:80,yaw:0,time:i/60,preset:'wild'});
 car.updateMatrixWorld(true);meshes.forEach(m=>expect(m.matrixWorld.elements.every(Number.isFinite)).toBe(true));
 expect(motion.occupants().people[1].spring.joints).toBe(18);
 const gpu=vi.spyOn(meshes[0].skeleton,'dispose'),scene=new THREE.Scene();scene.add(car);disposeScene(scene);expect(gpu).toHaveBeenCalled();
});
it('keeps the previous playable passenger if the new asset fails',async()=>{
 vi.resetModules();vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:404})));
 const asset=await import('../src/heroine-bust-asset');expect(await asset.preloadHeroineBust()).toBe(false);expect(asset.createHeroineBust()).toBeUndefined();
});
