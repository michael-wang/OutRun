import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {fixedRoadPose} from './fixed-road';
import {applyScenicCamera,chaseTargets} from './chase';

describe('fixed-road joins and scenic camera isolation',()=>{
 it('does not step pitch or curvature across an authored sample join',()=>{
  const f=[[0,0,0,0,0,0],[2.5,0,.1,2.5,.01,.01],[5,-.1,.5,5,.04,.03],[7.5,-.2,.6,7.5,.05,.02]];
  for(const d of [2.5,5]){const a=fixedRoadPose(f,d-1e-6),b=fixedRoadPose(f,d+1e-6);expect(Math.abs(a.grade-b.grade)).toBeLessThan(1e-5);expect(Math.abs(a.curvature-b.curvature)).toBeLessThan(1e-5);}
 });
 it('leaves the normal camera unchanged outside scenic zones',()=>{
  const t=chaseTargets(new THREE.Vector3(10,20,30),.7),eye=t.eye.clone(),look=t.look.clone();
  expect(applyScenicCamera(t,new THREE.Vector3(-1,0,0),100,[{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:1.5}])).toBe(0);
  expect(t.eye.equals(eye)&&t.look.equals(look)).toBe(true);
 });
 it('separates road-local left translation from rightward gaze',()=>{
  const right=new THREE.Vector3(1,0,0),t=chaseTargets(new THREE.Vector3(),Math.PI),original=t.look.clone().sub(t.eye).normalize(),eye=t.eye.clone();
  applyScenicCamera(t,right,500,[{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:0}]);
  expect(t.eye.clone().sub(eye).dot(right)).toBeCloseTo(-2.5);
  expect(t.look.clone().sub(t.eye).normalize().dot(right)).toBeGreaterThan(original.dot(right)+.09);
 });
});
