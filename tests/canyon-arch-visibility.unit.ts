import {expect,it} from 'vitest';
import * as THREE from 'three';
import {addJourneyScenery,CANYON_ARCH,canyonArchProfile,planJourneyLandmarks} from '../src/scenery';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotWeights} from '../src/pilot-composer';
import {chaseComposition,chaseTargets} from '../src/chase';

const sight=(sample:(d:number)=>{position:THREE.Vector3;right:THREE.Vector3;roadHeading:number;tangent:THREE.Vector3},site:number)=>{
 const stop=site-210,pose=sample(stop),arch=sample(site);
 const aspect=1705/863,camera=new THREE.PerspectiveCamera(chaseComposition(aspect).fov,aspect,1,2200);
 const grade=pose.tangent.y/Math.hypot(pose.tangent.x,pose.tangent.z);
 const targets=chaseTargets(pose.position,pose.roadHeading,aspect,grade);
 camera.position.copy(targets.eye);camera.lookAt(targets.look);camera.updateMatrixWorld(true);
 const target=arch.position.clone().addScaledVector(arch.right,CANYON_ARCH.offset);
 target.y=arch.position.y+CANYON_ARCH.springHeight+CANYON_ARCH.rise*.5;
 return target.project(camera);
};

it('large canyon arch is on tall grounded feet with an identifiable open crown',()=>{
 expect(CANYON_ARCH.offset).toBeLessThan(58);
 expect(CANYON_ARCH.offset-CANYON_ARCH.span/2-11).toBeGreaterThan(14);
 for(const roadHeight of [45,110,180]){
  const profile=canyonArchProfile(roadHeight);
  expect(profile.foot).toBeLessThan(roadHeight-10);
  expect(profile.spring).toBeGreaterThan(roadHeight+25);
  expect(profile.crown).toBeGreaterThan(roadHeight+50);
 }
 const length=69000,weights=()=>[0,1,0],site=planJourneyLandmarks(length,weights).find(s=>s.kind==='canyon-arch')!;
 const start=Math.floor(site.distance/1000)*1000,roadHeight=120,scene=new THREE.Scene();
 const sample=(d:number)=>({position:new THREE.Vector3(0,roadHeight,d),right:new THREE.Vector3(1,0,0),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0});
 addJourneyScenery(scene,sample as any,length,1,1,()=>7,weights,{start,end:start+1000,openRoad:true});
 const meshes:THREE.InstancedMesh[]=[];
 scene.traverse(o=>{if(o instanceof THREE.InstancedMesh)meshes.push(o);});
 const byColor=(hex:string)=>meshes.filter(m=>(m.material as THREE.MeshStandardMaterial).color.getHexString()===hex.slice(1));
 const crowns=byColor(CANYON_ARCH.crown),feet=byColor(CANYON_ARCH.stone);
 expect(crowns.reduce((sum,m)=>sum+m.count,0)).toBe(1);
 expect(feet.reduce((sum,m)=>sum+m.count,0)).toBe(2);
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 crowns[0].getMatrixAt(0,matrix);matrix.decompose(p,q,scale);
 expect(p.x).toBeCloseTo(CANYON_ARCH.offset);
 expect(p.y).toBeCloseTo(roadHeight+CANYON_ARCH.springHeight);
 expect(scale.y).toBe(CANYON_ARCH.rise);
 expect(crowns[0].geometry.type).toBe('TorusGeometry');
 for(let i=0;i<feet[0].count;i++){
  feet[0].getMatrixAt(i,matrix);matrix.decompose(p,q,scale);
  expect(p.y-scale.y*.5).toBeCloseTo(roadHeight-CANYON_ARCH.footingDepth);
  expect(p.y+scale.y*.5).toBeCloseTo(roadHeight+CANYON_ARCH.springHeight);
 }
},25000);

it('actual mountain landmarks are projected ahead, not off-screen at the QA stop',()=>{
 for(const seed of [1,2,7]){
  const trip=generateTrip(seed),track=createPilotTrack(trip);
  const sites=planJourneyLandmarks(track.length,d=>pilotWeights(trip,d)).filter(s=>s.kind==='canyon-arch');
  expect(sites.length).toBeGreaterThanOrEqual(2);
  for(const site of sites){
   const projected=sight(track.sample,site.distance);
   expect(projected.z).toBeLessThan(1);
   expect(projected.x, `seed ${seed} arch ${site.distance}m x=${projected.x.toFixed(2)}`).toBeGreaterThan(-.95);
   expect(projected.x, `seed ${seed} arch ${site.distance}m x=${projected.x.toFixed(2)}`).toBeLessThan(.95);
   expect(projected.y, `seed ${seed} arch ${site.distance}m y=${projected.y.toFixed(2)}`).toBeGreaterThan(-.95);
   expect(projected.y, `seed ${seed} arch ${site.distance}m y=${projected.y.toFixed(2)}`).toBeLessThan(.95);
  }
 }
},30000);
