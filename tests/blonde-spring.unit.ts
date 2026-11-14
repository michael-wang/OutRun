import {afterEach,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {disposeScene} from '../src/dispose-scene';
afterEach(()=>vi.unstubAllGlobals());
it('loads bounded R6 skin, preserves rigid crown, settles and disposes independently',async()=>{
 vi.resetModules();const bytes=readFileSync(new URL('../public/assets/characters/coast-blonde-r6.glb',import.meta.url));
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(bytes)));
 const asset=await import('../src/blonde-groom-asset');await asset.preloadBlondeGroom();
 const {createCar}=await import('../src/car');const car=createCar(),other=createCar();
 const mesh=car.getObjectByName('blender-blonde-spring') as THREE.SkinnedMesh;
 const second=other.getObjectByName(mesh.name) as THREE.SkinnedMesh;
 expect(mesh.skeleton.bones).toHaveLength(25);expect(mesh.geometry.index!.count/3).toBeLessThanOrEqual(2500);
 expect(mesh.skeleton).not.toBe(second.skeleton);expect(mesh.geometry).not.toBe(second.geometry);
 expect((mesh.material as THREE.Material).transparent).toBe(false);expect(bytes.length).toBeLessThan(125000);
 let total=0;car.traverse(o=>{if(o instanceof THREE.Mesh)total+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof THREE.InstancedMesh?o.count:1);});
 // Authorized +1300 triangles for flexible midsections; old Morph A keeps its 14k gate.
 expect(total).toBeLessThan(15500);
 const crown=car.getObjectByName('fixed-crown')!,rest=crown.quaternion.clone();
 const tips=Array.from({length:6},(_,i)=>car.getObjectByName(`lock-${i}-2`)!);
 const rests=tips.map(b=>b.quaternion.clone()),motion=car.userData.motion;
 for(let i=0;i<240;i++)motion.advance(50/60,.2,1/60,4,0,0,{airX:2.6,airZ:0,velocityX:0,velocityZ:50,yaw:0,time:i/60});
 expect(crown.quaternion.angleTo(rest)).toBe(0);
 expect(Math.max(...tips.map((b,i)=>b.quaternion.angleTo(rests[i])))).toBeGreaterThan(.02);
 const frozen=tips.map(b=>b.quaternion.clone());
 motion.advance(0,0,0);tips.forEach((b,i)=>expect(b.quaternion.angleTo(frozen[i])).toBeLessThan(1e-6));
 mesh.skeleton.bones.forEach(b=>expect(b.matrixWorld.elements.every(Number.isFinite)).toBe(true));
 for(let i=0;i<480;i++)motion.advance(0,0,1/60,0,0,0,{airX:0,airZ:0,velocityX:0,velocityZ:0,yaw:0,time:4+i/60});
 expect(Math.max(...tips.map((b,i)=>b.quaternion.angleTo(rests[i])))).toBeLessThan(.02);
 motion.reset();tips.forEach((b,i)=>expect(b.quaternion.angleTo(rests[i])).toBeLessThan(1e-6));
 const gpuDispose=vi.spyOn(mesh.skeleton,'dispose'),scene=new THREE.Scene();scene.add(car);disposeScene(scene);
 expect(gpuDispose).toHaveBeenCalledOnce();expect(await asset.preloadBlondeGroom()).toBe(true);expect(fetch).toHaveBeenCalledTimes(1);
});
it('falls back to Morph A if the spring asset cannot load',async()=>{
 vi.resetModules();const old=readFileSync(new URL('../public/assets/characters/coast-blonde-bob.glb',import.meta.url));
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.includes('-r6')?new Response('',{status:404}):new Response(old)));
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
 try{const asset=await import('../src/blonde-groom-asset');expect(await asset.preloadBlondeGroom()).toBe(true);
 expect(asset.createBlenderBlondeGroom()!.root.getObjectByName('blender-blonde-bob')).toBeTruthy();}finally{warn.mockRestore();}
});
