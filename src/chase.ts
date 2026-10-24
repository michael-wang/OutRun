import * as THREE from 'three';
export const CHASE = Object.freeze({fov:54, distance:10, height:4.3, lookAhead:28,lookHeight:-.5});
/** Camera follows the car's travel direction; speed is deliberately not an argument. */
export function chaseTargets(position:THREE.Vector3, travelHeading:number) {
  const forward=new THREE.Vector3(-Math.sin(travelHeading),0,Math.cos(travelHeading));
  return {
    eye:position.clone().addScaledVector(forward,-CHASE.distance).add(new THREE.Vector3(0,CHASE.height,0)),
    look:position.clone().addScaledVector(forward,CHASE.lookAhead).add(new THREE.Vector3(0,CHASE.lookHeight,0)),
  };
}
