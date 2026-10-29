import * as THREE from 'three';
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
