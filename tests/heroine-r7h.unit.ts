import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {disposeScene} from '../src/dispose-scene';
afterEach(()=>vi.unstubAllGlobals());
it('keeps the frozen hair pivot aligned through all five clips, pauses, stalls and resets',async()=>{
 vi.resetModules();
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(readFileSync(new URL('../public/'+url,import.meta.url)))));
 const bust=await import('../src/heroine-bust-asset');expect(await bust.preloadHeroineBust('r7h')).toBe(true);
 const hair=await import('../src/blonde-groom-asset');expect(await hair.preloadBlondeGroom()).toBe(true);
 const {createCar}=await import('../src/car');const car=createCar(),motion=car.userData.motion;
 expect(motion.hasHeroine).toBe(true);motion.reset();
 const head=car.getObjectByName('passenger-head')!;
 const rest=head.position.clone(),body=car.getObjectByName('heroine-upper-body')!;
 const meshes:THREE.SkinnedMesh[]=[];body.traverse(o=>{if(o instanceof THREE.SkinnedMesh)meshes.push(o);});
 expect(meshes).toHaveLength(4);expect(meshes[0].skeleton.bones).toHaveLength(14);
 // The race derivative has no feet/legs, and an exposed skin upper back.
 for(const m of meshes){
  expect((m.material as THREE.Material).transparent).toBe(false);
  const p=m.geometry.attributes.position,w=m.geometry.attributes.skinWeight;
  for(let i=0;i<p.count;i++){
   expect(p.getY(i)).toBeGreaterThan(.39);
   let sum=0;for(let k=0;k<4;k++)sum+=w.getComponent(i,k);expect(sum).toBeCloseTo(1,5);
  }
 }
 body.updateMatrixWorld(true);
 // The updated half-back cut leaves the upper back open and covers lower back.
 for(const [height,material] of [[1.20,'R7H skin'],[1.04,'R7H skin'],[.97,'R7H ivory satin'],[.94,'R7H ivory satin']] as const){
  const back=body.localToWorld(new THREE.Vector3(0,height,-1));
  const hit=new THREE.Raycaster(back,new THREE.Vector3(0,0,1)).intersectObject(body,true)[0];
  expect(hit).toBeDefined();expect(((hit.object as THREE.Mesh).material as THREE.Material).name).toBe(material);
 }
 expect(Math.abs(head.rotation.x)).toBeLessThan(.001);
 for(const action of ['shoutRight','kissRight','shoutLeft','kissLeft','victory']){
  motion.previewHeroine(action,.8);car.updateMatrixWorld(true);
  expect(head.matrixWorld.elements.every(Number.isFinite)).toBe(true);
  if(action.endsWith('Right')){expect(head.rotation.y).toBeLessThan(-1);expect(head.position.y).toBeCloseTo(rest.y,3);}
  if(action.endsWith('Left')){expect(head.rotation.y).toBeGreaterThan(1);expect(head.position.y-rest.y).toBeGreaterThan(.30);}
  if(action==='victory')for(const name of ['hand1','hand-1']){
   const hand=body.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
   expect(hand.y-head.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(.35);
  }
  const q=head.quaternion.clone();for(let i=0;i<30;i++)motion.previewHeroine(action,.8);
  expect(head.quaternion.angleTo(q)).toBeLessThan(.00001);
 }
 motion.reset();expect(Math.abs(head.rotation.x)).toBeLessThan(.001);
 expect(head.position.distanceTo(rest)).toBeLessThan(.00001);
 expect(motion.heroineAction('shoutRight')).toBe(true);expect(motion.heroineAction('kissLeft')).toBe(false);
 motion.advance(0,0,.1);const before=head.quaternion.clone();motion.advance(0,0,0);
 expect(head.quaternion.angleTo(before)).toBeLessThan(.00001);
 expect(motion.heroineAction('victory')).toBe(true);
 for(let i=0;i<140;i++)motion.advance(0,0,1/60);
 expect(motion.occupants().heroineAction).toBeUndefined();expect(head.position.distanceTo(rest)).toBeLessThan(.00001);
 motion.heroineAction('kissRight');motion.advance(0,0,1);expect(motion.occupants().heroineAction).toBeUndefined();
 motion.heroineAction('kissRight');motion.cancelHeroine();expect(motion.occupants().heroineAction).toBeUndefined();
 const frozen=readFileSync(new URL('../public/assets/characters/coast-blonde-r6d.glb',import.meta.url));
 expect(createHash('sha256').update(frozen).digest('hex')).toBe('8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519');
 const dispose=vi.spyOn(meshes[0].skeleton,'dispose'),scene=new THREE.Scene();scene.add(car);
 motion.dispose();disposeScene(scene);expect(dispose).toHaveBeenCalled();
});
it('falls back to the preserved R7A asset when the R7H request fails',async()=>{
 vi.resetModules();
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.includes('r7h')?new Response('',{status:404}):new Response(readFileSync(new URL('../public/'+url,import.meta.url)))));
 const asset=await import('../src/heroine-bust-asset');
 expect(await asset.preloadHeroineBust('r7h')).toBe(false);
 expect(await asset.preloadHeroineBust('r7a')).toBe(true);
 const fallback=asset.createHeroineBust()!;expect(fallback.root.getObjectByName('heroine-head')).toBeDefined();
 expect(fallback.performance).toBeUndefined();
});
