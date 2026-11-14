import * as THREE from 'three';
import {expect,it} from 'vitest';
import {WheelContactPatch} from '../src/wheel-contact-patch';
import {prepareRoadChunk,type RoadMeshData} from '../src/road-chunk';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {bridgeShoulders} from '../src/bridge';

function surfaces(data:RoadMeshData[]){
 const group=new THREE.Group();
 for(const part of data.filter(m=>m.kind==='asphalt'||m.kind==='sand')){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(part.positions,3));
  geometry.setIndex(new THREE.BufferAttribute(part.indices,1));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.name=part.kind==='asphalt'?'driving-surface':'shoulder';
  mesh.userData.rayRanges=part.rayRanges;
  group.add(mesh);
 }
 return group;
}

function checkSection(group:THREE.Group,distance:number,track:ReturnType<typeof coastWorkerRoad>['track']){
 const patch=new WheelContactPatch();
 expect(patch.prepare([group],distance)).toBe(true);
 let hits=0;
 for(const dz of [-1.45,0,1.38]){
  const p=track.sample(distance+dz);
  for(let offset=-18;offset<=22;offset+=.5){
   const origin=p.position.clone().addScaledVector(p.right,offset);
   origin.y+=4;
   const ray=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0),0,12);
   const expected=ray.intersectObjects(group.children,false)[0];
   expect(patch.intersect(ray)).toBe(!!expected);
   if(!expected)continue;
   hits++;
   expect(patch.point.distanceTo(expected.point)).toBeLessThan(1e-9);
   expect(patch.normal.distanceTo(expected.face!.normal)).toBeLessThan(1e-9);
   expect(patch.onRoad).toBe(expected.object.name==='driving-surface');
  }
 }
 expect(hits).toBeGreaterThan(0);
}

it('matches exact road/shoulder rays across two adjacent authored coast chunks',()=>{
 const runtime=coastWorkerRoad(),track=runtime.track;
 const section=(a:number,b:number)=>prepareRoadChunk(track.sample,
  runtime.halfAt,runtime.weightsAt,a,b,track.length,
  false,true,[],d=>bridgeShoulders(d,runtime.stage.seed),undefined,true,
  undefined,runtime.stage.scenerySections);
 const group=surfaces([...section(980,1000),...section(1000,1020)]);
 for(const d of [999,1000,1001])checkSection(group,d,track);
});

it('retains wheel contact accuracy at real coast terrain/roadside stations',()=>{
 const runtime=coastWorkerRoad(),track=runtime.track;
 for(const d of [850,3150]){
  const data=prepareRoadChunk(track.sample,runtime.halfAt,runtime.weightsAt,
   d-20,d+20,track.length,false,true,[],
   v=>bridgeShoulders(v,runtime.stage.seed),undefined,true,
   undefined,runtime.stage.scenerySections);
  checkSection(surfaces(data),d,track);
 }
});

it('retains nearest-hit and tie order, ignores retired surfaces, and declines unfamiliar geometry',()=>{
 const geometry=new THREE.PlaneGeometry(4,4).rotateX(-Math.PI/2);
 const road=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()),shoulder=road.clone();
 road.name='driving-surface';shoulder.name='shoulder';
 for(const mesh of [road,shoulder])mesh.userData.rayRanges=[{start:0,end:4,offset:0,count:6}];
 const group=new THREE.Group();group.add(road,shoulder);
 const patch=new WheelContactPatch(),ray=new THREE.Raycaster(new THREE.Vector3(.2,4,.2),new THREE.Vector3(0,-1,0),0,12);
 expect(patch.prepare([group],2)&&patch.intersect(ray)&&patch.onRoad).toBe(true);
 shoulder.geometry=geometry.clone().translate(0,.3,0);
 expect(patch.prepare([group],2)&&patch.intersect(ray)).toBe(true);
 expect(patch.onRoad).toBe(false);expect(patch.point.y).toBeCloseTo(.3,6);
 group.clear();expect(patch.prepare([group],2)).toBe(true);expect(patch.intersect(ray)).toBe(false);
 group.add(road);road.position.y=1;road.updateMatrixWorld();expect(patch.prepare([group],2)).toBe(false);
});
