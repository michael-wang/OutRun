import {it,expect} from 'vitest';
import * as THREE from 'three';
import {applyScenicCamera,chaseTargets,scenicDriftTarget,blendScenicDrift} from '../src/chase';

it('scenic camera remains unchanged outside the authored zone',()=>{
 const t=chaseTargets(new THREE.Vector3(10,20,30),.7),eye=t.eye.clone(),look=t.look.clone();
 expect(applyScenicCamera(t,new THREE.Vector3(-1,0,0),100,
  [{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:1}],1)).toBe(0);
 expect(t.eye.equals(eye)&&t.look.equals(look)).toBe(true);
});
it('scenic camera keeps road-left translation independent from gaze direction',()=>{
 const right=new THREE.Vector3(1,0,0),t=chaseTargets(new THREE.Vector3(),Math.PI);
 const original=t.look.clone().sub(t.eye).normalize(),eye=t.eye.clone();
 applyScenicCamera(t,right,500,
  [{start:200,end:800,ramp:140,leftMeters:2.5,yawDegrees:6,downDegrees:0}],1);
 expect(t.eye.clone().sub(eye).dot(right)).toBeCloseTo(-2.5);
 expect(t.look.clone().sub(t.eye).normalize().dot(right)).toBeGreaterThan(original.dot(right)+.09);
});
it('scenic camera does not move before a qualifying drift',()=>{
 const t=chaseTargets(new THREE.Vector3(),Math.PI),eye=t.eye.clone(),look=t.look.clone();
 expect(applyScenicCamera(t,new THREE.Vector3(1,-.14,0),500,
  [{start:200,end:800,ramp:140,leftMeters:1.8,yawDegrees:7,downDegrees:1}],0)).toBe(0);
 expect(t.eye.equals(eye)&&t.look.equals(look)).toBe(true);
 const motion={drifting:true,slip:.8,slipAngle:.6,speed:60,curvature:.006,offRoad:false};
 expect(scenicDriftTarget(motion)).toBe(1);
 expect(scenicDriftTarget({...motion,drifting:false})).toBe(0);
 expect(scenicDriftTarget({...motion,curvature:0})).toBe(0);
 expect(scenicDriftTarget({...motion,slipAngle:-.6,curvature:-.006})).toBe(0);
 expect(scenicDriftTarget({...motion,offRoad:true})).toBe(0);
});
it('scenic camera blend is frame-rate independent',()=>{
 const run=(hz:number)=>{let w=0;for(let i=0;i<hz;i++)w=blendScenicDrift(w,1,1/hz);return w;};
 expect(run(30)).toBeCloseTo(run(120),8);
 expect(blendScenicDrift(0,1,1/60)).toBeLessThan(.06);
 expect(blendScenicDrift(1,0,1/60)).toBeGreaterThan(.96);
});
