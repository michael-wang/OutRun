import {describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {createCar,type CarPaintController} from '../src/car';
import {CAR_COLORS,CAR_PAINT_PRESETS} from '../src/car-appearance';
import {createGTWingMirrorHousing,createRearTonneau} from '../src/hero-body';

describe('hero spider focal-point art',()=>{
 it('has real left-hand drive, a relaxed door-resting arm, blonde bob, and readable plate decal',()=>{
  const car=createCar(true);car.updateMatrixWorld(true);
  const steering=car.getObjectByName('left-hand-drive-steering-wheel');
  const arm=car.getObjectByName('driver-left-arm-resting-on-door');
  const hand=car.getObjectByName('driver-right-hand-steering');
  const hair=car.getObjectByName('blonde-hair-lock-1');
  const plate=car.getObjectByName('rear-license-FZR-123');
  expect(steering).toBeDefined();expect(steering!.position.x).toBeGreaterThan(0);
  expect(car.getObjectByName('driver')!.position.x).toBeGreaterThan(0);
  expect(car.getObjectByName('passenger')!.position.x).toBeLessThan(0);
  for(const name of ['driver','passenger']){
   const person=car.getObjectByName(name)!;
   expect(person.scale.x).toBeCloseTo(.84);
   expect(person.scale.y).toBeCloseTo(.84);
  }
  expect(arm).toBeDefined();expect(hand).toBeDefined();expect(hair).toBeDefined();
  const armBox=new THREE.Box3().setFromObject(arm!);
  expect(armBox.max.x).toBeGreaterThan(.99);
  expect(armBox.max.y).toBeLessThan(1.25);
  expect(car.userData.licensePlate).toBe('FZR-123');
  expect(plate).toBeInstanceOf(THREE.Mesh);
  expect((plate as THREE.Mesh).geometry.getAttribute('uv')).toBeDefined();
  expect(plate!.position.z).toBeLessThan(-2.40);
  expect(car.getObjectByName('sculpted-gt-spider-shell')).toBeUndefined(); // merged into the paint batch
 });
 it('changes only paint uniforms; model silhouette and geometry stay identical',()=>{
  const car=createCar(),paint=car.userData.paintController as CarPaintController;
  const beforeGeometry:string[]=[];
  car.traverse(o=>{if(o instanceof THREE.Mesh)beforeGeometry.push(o.geometry.uuid);});
  const beforeBox=new THREE.Box3().setFromObject(car);
  for(const color of CAR_COLORS){
   paint.set(color);
   expect(paint.inspect()).toEqual({color,hex:CAR_PAINT_PRESETS[color].hex});
   expect(new THREE.Box3().setFromObject(car).equals(beforeBox)).toBe(true);
   const currentGeometry:string[]=[];
   car.traverse(o=>{if(o instanceof THREE.Mesh)currentGeometry.push(o.geometry.uuid);});
   expect(currentGeometry).toEqual(beforeGeometry);
  }
 });
 it('keeps the driver hand resting while the passenger bob responds to a gust',()=>{
  const car=createCar(),m=car.userData.motion;
  m.reset();
  for(let i=0;i<100;i++)m.advance(113.75/60,.9,1/60);
  const left=car.getObjectByName('driver-left-arm-resting-on-door')!;
  const right=car.getObjectByName('driver-right-hand-steering')!;
  expect(Math.abs(left.rotation.z)).toBeLessThan(.01);
  expect(right.parent?.name).toBe('left-hand-drive-steering-wheel');
  const h=m.occupants().people[1].hair;
  expect(h).toHaveLength(5);
  expect(h.every((lock:{back:number})=>lock.back>.55&&lock.back<1.05)).toBe(true);
  expect(car.getObjectByName('driver-silk-scarf')).toBeUndefined();
  expect(m.occupants().people[0].scarf).toBeUndefined();
 });
});

it('keeps the wrist on the rotating rim and the other hand planted through opposite steering locks',()=>{
 const car=createCar(),motion=car.userData.motion;
 const wheel=car.getObjectByName('left-hand-drive-steering-wheel')!;
 const grip=car.getObjectByName('driver-right-hand-steering')!,fore=car.getObjectByName('driver-right-forearm')!;
 const door=car.getObjectByName('driver-left-arm-resting-on-door')!;
 const at=(o:THREE.Object3D)=>o.getWorldPosition(new THREE.Vector3());
 const rest=at(grip),fixed=at(door);
 for(const input of [1,-1,0]){
  for(let i=0;i<140;i++)motion.advance(65/60,input,1/60,input*12);
  car.updateMatrixWorld(true);
  expect(wheel.rotation.z).toBeCloseTo(input*.98,4);
  expect(fore.localToWorld(new THREE.Vector3(0,1,0)).distanceTo(at(grip))).toBeLessThan(.0001);
  expect(at(door).distanceTo(fixed)).toBeLessThan(.0001);
  if(input>0)expect(at(grip).y).toBeLessThan(rest.y-.1);
  if(input<0)expect(at(grip).y).toBeGreaterThan(rest.y+.05);
 }
 motion.reset();expect(at(grip).distanceTo(rest)).toBeLessThan(.0001);
});

it('occasionally raises both passenger palms, claps twice and returns them to her lap',()=>{
 const motionCar=createCar(),m=motionCar.userData.motion;
 const palms=[-1,1].map(side=>motionCar.getObjectByName('passenger-palm-'+side)!);
 const at=()=>palms.map(p=>p.getWorldPosition(new THREE.Vector3()));
 const rest=at(),roll=vi.spyOn(Math,'random').mockReturnValue(.9);
 const hairTop=new THREE.Box3().setFromObject(motionCar.getObjectByName('layered-blonde-bob')!).max.y;
 try{
  expect(m.onCleanPass()).toBeUndefined();roll.mockReturnValue(.1);
  expect(m.onCleanPass()).toBe('applause');expect(m.onCleanPass()).toBeUndefined();
  let beats=0;
  for(let i=0;i<210;i++)if(m.advance(.5,0,1/120)){
   const [a,b]=at();expect(a.distanceTo(b)).toBeLessThan(.042);
   expect(Math.min(a.y,b.y)-hairTop).toBeGreaterThan(.075);beats++;
  }
  expect(beats).toBe(2);expect(at()[0].distanceTo(rest[0])).toBeLessThan(.0001);
  expect(m.onCleanPass()).toBeUndefined();
  m.reset();expect(m.occupants().cheerTime).toBe(-1);
 }finally{roll.mockRestore();}
});

it('waves the outboard hand twice, keeps the other in her lap and saves clap sounds for applause',()=>{
 const car=createCar(),motion=car.userData.motion;
 const outer=car.getObjectByName('passenger-palm--1')!,inner=car.getObjectByName('passenger-palm-1')!;
 const rest=outer.position.clone(),lap=inner.position.clone(),sweeps:number[]=[];
 const roll=vi.spyOn(Math,'random').mockReturnValue(.2);
 try{
  expect(motion.onCleanPass()).toBe('wave');
  for(let i=0;i<200;i++){
   expect(motion.advance(0,0,.01)).toBe(false);
   expect(inner.position.distanceTo(lap)).toBeLessThan(.0001);
   if(i>=48&&i<110)sweeps.push(outer.position.x);
  }
  expect(Math.max(...sweeps)-Math.min(...sweeps)).toBeGreaterThan(.17);
  expect(outer.position.distanceTo(rest)).toBeLessThan(.0001);
  for(let i=0;i<13*60;i++)motion.advance(0,0,1/60);
  expect(motion.onCleanPass()).toBe('applause');
  motion.reset();expect(motion.occupants().cheerTime).toBe(-1);
 }finally{roll.mockRestore();}
});

 it('batches five two-joint blonde locks into two instanced draw submissions',()=>{
  const car=createCar(),primary=car.getObjectByName('blonde-wind-locks-batched');
  const tips=car.getObjectByName('blonde-wind-tips-batched');
  expect(primary).toBeInstanceOf(THREE.InstancedMesh);
  expect(tips).toBeInstanceOf(THREE.InstancedMesh);
  expect((primary as THREE.InstancedMesh).count).toBe(5);
  expect((tips as THREE.InstancedMesh).count).toBe(5);
  const first=new THREE.Matrix4(),after=new THREE.Matrix4();
  (primary as THREE.InstancedMesh).getMatrixAt(2,first);
  for(let i=0;i<120;i++)car.userData.motion.advance(110/60,.9,1/60);
  (primary as THREE.InstancedMesh).getMatrixAt(2,after);
  expect(after.equals(first)).toBe(false);
 });

it('covers the passenger scalp from the chase camera and above while leaving the face open',()=>{
 const car=createCar(),bob=car.getObjectByName('layered-blonde-bob')!;
 const head=car.getObjectByName('passenger-head')!,crown=car.getObjectByName('blonde-layered-crown')!;
 const firstHit=(from:THREE.Vector3,to:THREE.Vector3)=>{
  const origin=bob.localToWorld(from),direction=bob.localToWorld(to).sub(origin).normalize();
  return new THREE.Raycaster(origin,direction).intersectObject(head,true)[0]?.object;
 };
 for(const [speed,load] of [[0,0],[68,12],[68,-12]]){
  for(let i=0;i<60;i++)car.userData.motion.advance(speed/60,.4,1/60,load);
  car.updateMatrixWorld(true);
  for(const x of [-.09,0,.09])for(const z of [-.06,0,.06]){
   expect(firstHit(new THREE.Vector3(x,.5,z),new THREE.Vector3(x,0,z))).toBe(crown);
   expect(firstHit(new THREE.Vector3(x,.26,z-.48),new THREE.Vector3(x,.08,z))).toBe(crown);
  }
  const face=firstHit(new THREE.Vector3(0,.01,.5),new THREE.Vector3(0,.01,0));
  expect(face).toBeDefined();expect(face?.parent).toBe(head);
 }
});

it('keeps the cropped side part over the scalp with a clean nape and an open face',()=>{
 const car=createCar(),head=car.getObjectByName('driver-head')!;
 const hair=car.getObjectByName('driver-layered-short-hair')!;
 const crop=hair.getObjectByName('driver-side-part-crop')!;
 const firstHit=(from:THREE.Vector3,to:THREE.Vector3)=>{
  const origin=hair.localToWorld(from),direction=hair.localToWorld(to).sub(origin).normalize();
  return new THREE.Raycaster(origin,direction).intersectObject(head,true)[0]?.object;
 };
 for(const load of [0,12,-12]){
  for(let i=0;i<90;i++)car.userData.motion.advance(load?1.4:0,.2,1/60,load);
  car.updateMatrixWorld(true);
  for(const x of [-.07,0,.07])for(const z of [-.055,0,.055])
   expect(firstHit(new THREE.Vector3(x,.5,z),new THREE.Vector3(x,0,z))?.name,`scalp x=${x}, z=${z}, load=${load}`).toBe(crop.name);
  expect(firstHit(new THREE.Vector3(0,0,-.4),new THREE.Vector3())).toBe(crop);
  expect(firstHit(new THREE.Vector3(0,-.07,.4),new THREE.Vector3(0,-.07,0))?.parent).toBe(head);
 }
 expect(car.getObjectByName('driver-silk-scarf')).toBeUndefined();
});
it('recesses dark seatbacks behind a painted rear cowl without closing the cockpit',()=>{
 const car=createCar(),g=createRearTonneau();
 try{
  expect(g.index!.count).toBeGreaterThan(40);
  const p=g.getAttribute('position');
  const ys=Array.from({length:p.count},(_,i)=>p.getY(i));
  expect(Math.min(...ys)).toBeGreaterThan(.9);
  expect(Math.max(...ys)).toBeLessThan(1.18);
  const deck=new THREE.Mesh(g);
  const at=(x:number,z:number)=>new THREE.Raycaster(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0)).intersectObject(deck)[0].point.y;
  for(const x of [-.41,.41]){
   expect(at(x,-1.13)-at(0,-1.13)).toBeGreaterThan(.15);
   expect(at(x,-1.13)-at(x,-1.70)).toBeGreaterThan(.10);
  }
  const materials=new Set<string>();
  car.traverse(o=>{
   if(o instanceof THREE.Mesh){
    const list=Array.isArray(o.material)?o.material:[o.material];
    for(const m of list)if(m instanceof THREE.MeshStandardMaterial)materials.add(m.color.getHexString());
   }
  });
  expect(materials.has('29323a')).toBe(true); // graphite upholstery
  expect(materials.has('a87c60')).toBe(false); // no brown toy-chair slabs
  const viewport=new THREE.Raycaster(new THREE.Vector3(0,3,-.2),new THREE.Vector3(0,-1,0));
  expect(viewport.intersectObject(car,true)[0].point.y).toBeLessThan(.9);
 }finally{g.dispose();}
});
it('makes wing mirrors thin and brake lights physically and visually modest',()=>{
 const g=createGTWingMirrorHousing();
 const size=g.boundingBox!.getSize(new THREE.Vector3());
 expect(size.x).toBeGreaterThan(.23);
 expect(size.x).toBeLessThan(.26);
 expect(size.y).toBeLessThan(.105);
 expect(size.z).toBeLessThan(.18);
 g.dispose();
 const car=createCar(true);
 const lights=car.userData.brakeLights;
 expect(lights.inspect().emissiveIntensity).toBeLessThan(.20);
 lights.set(true);
 expect(lights.inspect().emissiveIntensity).toBeGreaterThan(.8);
 expect(lights.inspect().emissiveIntensity).toBeLessThan(1.2);
 lights.reset();
 expect(lights.inspect().emissiveIntensity).toBeLessThan(.20);
});
