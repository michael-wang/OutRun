import {Euler, Matrix4, Object3D, Quaternion, Vector3, type BufferAttribute, type InterleavedBufferAttribute} from 'three';

export interface PropThrow {time:number;forward:number;sideways:number;up:number;spin:number;tilt:number}
export const settleSeconds=.55;
const normal=new Vector3(), across=new Vector3(), forward=new Vector3(), vertex=new Vector3();
const basis=new Matrix4(), spin=new Quaternion(), rest=new Quaternion(), angles=new Euler();

// Finite sliding distance. Once settled, sampling any later time gives the same transform.
export function travelAge(f:PropThrow,time:number){
 return Math.min(Math.max(0,time-f.time),f.up/8+settleSeconds);
}
export function throwTravel(velocity:number,age:number,dragTime:number){
 return velocity*dragTime*(-Math.expm1(-age/dragTime));
}

/** Place local XY reflectors or base-down cones in the road's orthonormal frame.
 * The support vertex follows the arc, then stays in contact as the prop tips over. */
export function setThrownPose(pose:Object3D,road:{position:Vector3;right:Vector3;tangent:Vector3},
 lateral:number,vertices:BufferAttribute|InterleavedBufferAttribute,f:PropThrow,age:number,restPitch:number){
 normal.crossVectors(road.right,road.tangent).normalize();
 across.copy(road.right).normalize().negate();
 forward.crossVectors(across,normal);
 pose.quaternion.setFromRotationMatrix(basis.makeBasis(across,normal,forward));
 const touch=f.up/8;
 const t=Math.min(age,touch);
 // Air drag reduces angular speed as the prop approaches the ground.
 const turn=throwTravel(1,t,.65);
 spin.setFromEuler(angles.set(f.tilt*turn,f.spin*.28*turn,f.spin*turn,'YXZ'));
 if(age>touch){
  // Keep the direction of the lower edge and let the nearer face fall onto the road.
  vertex.set(1,0,0).applyQuaternion(spin);
  const yaw=Math.atan2(-vertex.z,vertex.x);
  vertex.set(0,1,0).applyQuaternion(spin);
  const side=vertex.z*Math.cos(yaw)+vertex.x*Math.sin(yaw)>=0?1:-1;
  rest.setFromEuler(angles.set(side*restPitch,yaw,0,'YXZ'));
  const u=Math.min(1,(age-touch)/settleSeconds);
  spin.slerp(rest,u*u*(3-2*u));
 }
 // Support in road-local Y is signed height along the bank/pitch normal.
 let low=Infinity;
 for(let i=0;i<vertices.count;i++){
  vertex.fromBufferAttribute(vertices,i).applyQuaternion(spin);
  low=Math.min(low,vertex.y);
 }
 pose.quaternion.multiply(spin);
 const height=Math.max(0,f.up*age-8*age*age);
 pose.position.copy(road.position).addScaledVector(road.right,lateral)
  .addScaledVector(normal,height+.045-low);
}
