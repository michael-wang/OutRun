import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {fixedRoadPose} from './fixed-road';
import {applyScenicCamera,chaseTargets,scenicDriftTarget,blendScenicDrift} from './chase';
import road from './terrain-first-road.json';

describe('fixed-road joins and scenic camera isolation',()=>{
 it('does not step pitch or curvature across an authored sample join',()=>{
  const f=[[0,0,0,0,0,0],[2.5,0,.1,2.5,.01,.01],[5,-.1,.5,5,.04,.03],[7.5,-.2,.6,7.5,.05,.02]];
  for(const d of [2.5,5]){const a=fixedRoadPose(f,d-1e-6),b=fixedRoadPose(f,d+1e-6);expect(Math.abs(a.grade-b.grade)).toBeLessThan(1e-5);expect(Math.abs(a.curvature-b.curvature)).toBeLessThan(1e-5);}
 });
 it('leaves the normal camera unchanged outside scenic zones',()=>{
  const t=chaseTargets(new THREE.Vector3(10,20,30),.7),eye=t.eye.clone(),look=t.look.clone();
  expect(applyScenicCamera(t,new THREE.Vector3(-1,0,0),100,[{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:1.5}],1)).toBe(0);
  expect(t.eye.equals(eye)&&t.look.equals(look)).toBe(true);
 });
 it('separates road-local left translation from rightward gaze',()=>{
  const right=new THREE.Vector3(1,0,0),t=chaseTargets(new THREE.Vector3(),Math.PI),original=t.look.clone().sub(t.eye).normalize(),eye=t.eye.clone();
  applyScenicCamera(t,right,500,[{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:0}],1);
  expect(t.eye.clone().sub(eye).dot(right)).toBeCloseTo(-2.5);
  expect(t.look.clone().sub(t.eye).normalize().dot(right)).toBeGreaterThan(original.dot(right)+.09);
 });
 it('keeps a banked scenic bend on the normal camera until the car drifts',()=>{
  const t=chaseTargets(new THREE.Vector3(),Math.PI),eye=t.eye.clone(),look=t.look.clone();
  expect(applyScenicCamera(t,new THREE.Vector3(1,-.14,0),500,[{start:200,end:800,ramp:140,leftMeters:1.8,yawDegrees:7,downDegrees:1}],0)).toBe(0);
  expect(t.eye.equals(eye)&&t.look.equals(look)).toBe(true);
  const motion={drifting:true,slip:.8,slipAngle:.6,speed:60,curvature:.006,offRoad:false};
  expect(scenicDriftTarget(motion)).toBe(1);
  expect(scenicDriftTarget({...motion,drifting:false})).toBe(0);
  expect(scenicDriftTarget({...motion,curvature:0})).toBe(0);
  expect(scenicDriftTarget({...motion,slipAngle:-.6,curvature:-.006})).toBe(0);
  expect(scenicDriftTarget({...motion,offRoad:true})).toBe(0);
 });
 it('fades only the scenic effect, consistently across frame rates',()=>{
  const run=(hz:number)=>{let w=0;for(let i=0;i<hz;i++)w=blendScenicDrift(w,1,1/hz);return w;};
  expect(run(30)).toBeCloseTo(run(120),8);
  expect(blendScenicDrift(0,1,1/60)).toBeLessThan(.06);
  expect(blendScenicDrift(1,0,1/60)).toBeGreaterThan(.96);
 });
 it('keeps the authored road free of short crest/dip pitch reversals',()=>{
  for(let d=350;d<=350+road.routeLength-25;d+=2.5){
   const a=fixedRoadPose(road.frames,d),b=fixedRoadPose(road.frames,d+25);
   expect(Math.abs(a.grade)).toBeLessThan(.055);
   expect(Math.abs(Math.atan(a.grade)-Math.atan(b.grade))*180/Math.PI).toBeLessThan(1);
  }
 });
});
