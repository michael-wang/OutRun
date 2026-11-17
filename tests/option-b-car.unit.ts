import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {createCar} from '../src/car';
import {attachOptionB,loadOptionB} from '../src/option-b-car';
import {canonicalGameQuery} from '../src/runtime-query';
import {gtWheelVisuals,optionBLighting} from '../src/option-b-details';

function asset(){
 const root=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.2,4.9),new THREE.MeshStandardMaterial());
 body.name='option-b-body';root.add(body);return root;
}
it('keeps default path opt-in and rejects unknown flag values',()=>{
 expect(canonicalGameQuery(new URLSearchParams('hero3d=1')).has('hero3d')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hero3d=other')).has('hero3d')).toBe(false);
 expect(createCar().getObjectByName('hero-classic-body-shell')!.visible).toBe(true);
});
it('swaps only body after validation and preserves controls, grip, wheel pivots and paint',()=>{
 const car=createCar(true),motion=car.userData.motion,pivots=car.userData.wheelPivots;
 const shell=car.getObjectByName('hero-classic-body-shell') as THREE.Mesh;
 const driver=car.getObjectByName('driver'),passenger=car.getObjectByName('passenger');
 const grip=car.getObjectByName('driver-right-hand-steering')!;
 const rest=car.getObjectByName('driver-left-arm-resting-on-door')!;
 const fixed=rest.getWorldPosition(new THREE.Vector3());
 const replacement=asset();attachOptionB(car,replacement);
 expect(shell.visible).toBe(false);
 expect(car.userData.motion).toBe(motion);expect(car.userData.wheelPivots).toBe(pivots);
 expect(car.getObjectByName('original-windshield')!.visible).toBe(false);
 expect(car.getObjectByName('option-b-wheel-arches')).toBeUndefined();
 expect(car.getObjectByName('option-b-glass')).toBeDefined();
 expect(pivots).toHaveLength(4);
 expect(pivots.every((p:THREE.Group)=>!!p.getObjectByName('option-b-brake-disc'))).toBe(true);
 expect(car.getObjectByName('driver')).toBe(driver);expect(car.getObjectByName('passenger')).toBe(passenger);
 expect((replacement.children[0] as THREE.Mesh).material).toBe(shell.material);
 car.userData.paintController.set('pure-white');
 expect(car.userData.paintController.inspect().color).toBe('pure-white');
 for(const steer of [-1,1]){
  for(let i=0;i<60;i++)motion.advance(.5,steer,1/60);
  car.updateMatrixWorld(true);
  expect(grip.parent!.rotation.z).toBeCloseTo(steer*.98);
  expect(rest.getWorldPosition(new THREE.Vector3()).distanceTo(fixed)).toBeLessThan(.0001);
 }
 const lamps=car.userData.brakeLights,idle=lamps.inspect().emissiveIntensity;
 lamps.set(true);expect(lamps.inspect().emissiveIntensity).toBeGreaterThan(idle);
 lamps.reset();expect(lamps.inspect().emissiveIntensity).toBe(idle);
});
it('keeps the GT contact envelope and separates headlight, running and brake states',()=>{
 for(const side of [-1,1]){
  const v=gtWheelVisuals(side);v.tire.computeBoundingBox();const box=v.tire.boundingBox!;
  expect(box.max.y).toBeCloseTo(.46);expect(box.min.y).toBeCloseTo(-.46);
  expect(box.max.z).toBeCloseTo(.46);expect(box.min.z).toBeCloseTo(-.46);
  expect(box.max.x-box.min.x).toBeCloseTo(.29);
 }
 const front=new THREE.MeshStandardMaterial(),rear=new THREE.MeshStandardMaterial();
 for(const dusk of [false,true]){
  const lights=optionBLighting(front,rear,dusk);expect(lights.inspect().headlightsEnabled).toBe(dusk);
  for(const enabled of [false,true])for(const braking of [false,true]){
   lights.setHeadlights(enabled);lights.set(braking);const s=lights.inspect();
   expect(s.tailRunningEnabled).toBe(enabled);expect(s.braking).toBe(braking);
   expect(s.frontEmissiveIntensity).toBe(enabled?2.4:0);expect(s.emissiveIntensity).toBe(braking?1.7:enabled?.55:0);
  }
  lights.reset();expect(lights.inspect().braking).toBe(false);expect(lights.inspect().tailRunningEnabled).toBe(true);
 }
});
it('leaves original fully visible for invalid geometry and missing local asset',async()=>{
 const car=createCar();const shell=car.getObjectByName('hero-classic-body-shell')!;
 const invalid=asset();invalid.scale.setScalar(100);
 expect(()=>attachOptionB(car,invalid)).toThrow();expect(shell.visible).toBe(true);
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));
 try{expect((await loadOptionB(car,new AbortController().signal)).state).toBe('fallback');expect(shell.visible).toBe(true);}
 finally{vi.unstubAllGlobals();}
});
