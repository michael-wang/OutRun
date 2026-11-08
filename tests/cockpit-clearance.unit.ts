import {expect,it} from 'vitest';
import * as THREE from 'three';
import {createCar} from '../src/car';
import {CHEER_END} from '../src/passenger-cheer';

it('leaves a clear cockpit around the passenger arms while supporting the driver at the sill',()=>{
 const car=createCar(),motion=car.userData.motion;
 const shell=car.getObjectByName('hero-classic-body-shell') as THREE.Mesh;
 const trim=car.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&
  (o.material as THREE.MeshStandardMaterial).color.getHexString()==='29323a');
 expect(trim.length).toBeGreaterThan(0);
 car.updateMatrixWorld(true);
 const down=new THREE.Vector3(0,-1,0);
 const ray=new THREE.Raycaster();
 function topAt(x:number,z:number){
  ray.set(new THREE.Vector3(x,1.5,z),down);
  const hit=ray.intersectObjects([shell,...trim],false)[0];
  return hit?.point.y??0;
 }
 // Sample both apertures, including the area occupied by an elbow on the lap.
 for(const side of [-1,1])for(const z of [-.76,-.48,-.18,.15]){
  for(const x of [.60,.72,.84])expect(topAt(side*x,z)).toBeLessThan(.60);
  expect(topAt(side*.955,z)).toBeGreaterThan(.93);
 }
 // Opaque end walls seal the floor to the dashboard and rear deck.
 for(const sign of [-1,1])for(const x of [-.74,.74]){
  ray.set(new THREE.Vector3(x,.63,-.2),new THREE.Vector3(0,0,sign));
  expect(ray.intersectObjects(trim,false)[0]?.distance).toBeLessThan(1);
 }
 const arms=[-1,1].map(side=>car.getObjectByName('passenger-arm-'+side)!.children[0] as THREE.SkinnedMesh);
 const v=new THREE.Vector3();
 let farthest=0;
 for(const steer of [0,-1,1]){
  for(let n=0;n<120;n++)motion.advance(1,steer,1/60,steer*12);
  for(const gesture of ['applause','wave'] as const)for(let i=0;i<=48;i++){
   motion.posePassenger(i/48*CHEER_END,gesture);car.updateMatrixWorld(true);
   for(const arm of arms)for(let j=0;j<arm.geometry.attributes.position.count;j++){
    arm.getVertexPosition(j,v).applyMatrix4(arm.matrixWorld);
    if(v.y<=1.005)farthest=Math.max(farthest,Math.abs(v.x));
   }
  }
 }
 // Measure the actual liner rather than assuming its design width.
 const towardDoor=new THREE.Vector3(-1,0,0);
 let narrowest=Infinity;
 for(const z of [-.80,-.60,-.40,-.20,0,.20]){
  ray.set(new THREE.Vector3(0,.75,z),towardDoor);
  const wall=ray.intersectObjects(trim,false)[0];
  expect(wall).toBeDefined();narrowest=Math.min(narrowest,Math.abs(wall.point.x));
 }
 expect(narrowest-farthest).toBeGreaterThan(.025);
 const rest=car.getObjectByName('driver-left-arm-resting-on-door') as THREE.Mesh;
 const pos=rest.geometry.attributes.position;
 let smallestGap=Infinity,depth=Infinity;
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);
  if(v.x>.90)depth=Math.min(depth,v.y-topAt(v.x,v.z));
  if(v.x>.915&&v.x<.965)smallestGap=Math.min(smallestGap,v.y-topAt(v.x,v.z));
 }
 expect(depth).toBeGreaterThan(-.006);
 expect(smallestGap).toBeGreaterThan(-.012);
 expect(smallestGap).toBeLessThan(.010);
});
