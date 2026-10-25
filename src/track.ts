import * as THREE from 'three';
import {COURSE,REFERENCE_TRAVEL,TRACK_LENGTH,roadCurvature,challengeAt} from './challenges';
export {roadCurvature};
const heights=[[0,8],[.18,46],[1/3,26],[.49,110],[2/3,65],[.82,28],[1,8]];
export function elevation(distance:number){const f=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH/TRACK_LENGTH;let i=1;while(i<heights.length-1&&f>heights[i][0])i++;const [a,lo]=heights[i-1],[b,hi]=heights[i],t=(f-a)/(b-a);return {height:lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*t)),grade:(hi-lo)*Math.PI/2*Math.sin(Math.PI*t)/((b-a)*TRACK_LENGTH)};}
/** Precomputed midpoint quadrature of authored curvature. Neutral spans solve closure,
 * rather than pulling a sampled curve back into a loop or changing driver authority. */
export function createTrack(){
 const positions:THREE.Vector3[]=[new THREE.Vector3(0,8,0)],headings=[0],distances=[0];let x=0,z=0,heading=0;
 for(const c of COURSE){const count=Math.ceil(c.nominalDurationAtReferenceSpeed*100),ds=c.length/count;
  for(let i=0;i<count;i++){const d=c.start+i*ds,turn=roadCurvature(d+ds/2)*ds;x-=Math.sin(heading+turn/2)*ds;z+=Math.cos(heading+turn/2)*ds;heading+=turn;const end=c.start+(i+1)*ds;distances.push(end);headings.push(heading);positions.push(new THREE.Vector3(x,elevation(end).height,z));}
 }
 const closureError=Math.hypot(x,z),headingError=heading-2*Math.PI;
 // Only sub-millimetre quadrature residue; fail loudly rather than hide a bad route.
 if(closureError>.02||Math.abs(headingError)>.00001)throw new Error(`Route does not close: ${closureError}m / ${headingError}rad`);
 positions[positions.length-1].copy(positions[0]);headings[headings.length-1]=2*Math.PI;
 function sample(distance:number){const d=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH;let lo=0,hi=distances.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(distances[mid]<=d)lo=mid;else hi=mid;}const t=(d-distances[lo])/(distances[hi]-distances[lo]),position=positions[lo].clone().lerp(positions[hi],t),roadHeading=THREE.MathUtils.lerp(headings[lo],headings[hi],t),{height,grade}=elevation(d);position.y=height;const tangent=new THREE.Vector3(-Math.sin(roadHeading),grade,Math.cos(roadHeading)).normalize(),right=new THREE.Vector3(-Math.cos(roadHeading),0,-Math.sin(roadHeading));return {position,tangent,right,curvature:roadCurvature(d),roadHeading,challenge:challengeAt(d)};}
 return {sample,length:TRACK_LENGTH,closureError,headingError,referenceTravel:REFERENCE_TRAVEL};
}
