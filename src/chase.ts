import * as THREE from 'three';
// Keep a near plane large enough to separate asphalt from its 10cm-deep sand bed at the far crest.
export const CHASE_NEAR=1;
export const CHASE = Object.freeze({horizontalFov:76, fov:47.44840036542012, distance:8, height:2.6, lookAhead:39.168,lookHeight:0});
/** Aspect alone selects the composition. No speed-dependent camera parameters. */
export function chaseComposition(aspect:number) {
  const fov=2*Math.atan(Math.tan(CHASE.horizontalFov*Math.PI/360)/aspect)*180/Math.PI;
  const pitch=THREE.MathUtils.clamp(.055066+(aspect-16/9)*.14959,.035,.2);
  return {...CHASE,fov,lookAhead:CHASE.height/Math.tan(pitch)-CHASE.distance};
}
/** Camera follows the car's travel direction; speed is deliberately not an argument. */
export function chaseTargets(position:THREE.Vector3, travelHeading:number, aspect=16/9, grade=0) {
  const composition=chaseComposition(aspect);
  const forward=new THREE.Vector3(-Math.sin(travelHeading),grade,Math.cos(travelHeading)).normalize();
  const up=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(Math.cos(travelHeading),0,Math.sin(travelHeading))).normalize();
  return {
    eye:position.clone().addScaledVector(forward,-CHASE.distance).addScaledVector(up,CHASE.height),
    // A small uphill-only framing bias lets the rising road read as a climb. Eye/distance stay unchanged.
    look:position.clone().addScaledVector(forward,composition.lookAhead).add(new THREE.Vector3(0,-Math.min(1.4,Math.max(0,grade)*composition.lookAhead*.1),0)),
  };
}

export interface ScenicCameraZone {start:number;end:number;ramp:number;leftMeters:number;yawDegrees:number;downDegrees:number}
/** Existing handling state is the trigger; banking alone is deliberately absent.
 * Only a sustained rightward drift in a real right bend can reveal the right canyon.
 */
export function scenicDriftTarget(motion:{drifting:boolean;slip:number;slipAngle:number;speed:number;curvature:number;offRoad:boolean}){
 if(!motion.drifting||motion.offRoad)return 0;
 const smooth=(x:number,a:number,b:number)=>THREE.MathUtils.smoothstep(x,a,b);
 return smooth(motion.slip,.2,.65)*smooth(motion.slipAngle,.12,.45)*smooth(motion.speed,20,40)*smooth(motion.curvature,.001,.003);
}
/** Only the optional scenic offset has a short fade, not the normal chase rig. */
export function blendScenicDrift(current:number,target:number,dt:number){
 return current+(target-current)*(1-Math.exp(-Math.max(0,dt)/(target>current?.3:.5)));
}
/** Drift-triggered scenic offsets, limited to explicit road-local zones.
 * Translation and gaze are independent; car banking never rolls the camera.
 */
export function applyScenicCamera(targets:{eye:THREE.Vector3;look:THREE.Vector3},roadRight:THREE.Vector3,distance:number,zones:readonly ScenicCameraZone[],driftBlend=0){
 const smooth=(v:number)=>{const t=THREE.MathUtils.clamp(v,0,1);return t*t*t*(t*(t*6-15)+10);};
 const zone=zones.find(z=>distance>z.start&&distance<z.end);if(!zone)return 0;
 const weight=smooth((distance-zone.start)/zone.ramp)*smooth((zone.end-distance)/zone.ramp)*THREE.MathUtils.clamp(driftBlend,0,1);
 const right=new THREE.Vector3(roadRight.x,0,roadRight.z).normalize();
 // Translate BOTH points first: the left shift does not implicitly aim right.
 const shift=right.multiplyScalar(-zone.leftMeters*weight);targets.eye.add(shift);targets.look.add(shift);
 const gaze=targets.look.clone().sub(targets.eye);
 gaze.applyAxisAngle(new THREE.Vector3(0,1,0),-THREE.MathUtils.degToRad(zone.yawDegrees)*weight);
 gaze.y-=Math.hypot(gaze.x,gaze.z)*Math.tan(THREE.MathUtils.degToRad(zone.downDegrees)*weight);
 targets.look.copy(targets.eye).add(gaze);return weight;
}
