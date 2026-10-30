import {generatedBank} from './banking';
import * as THREE from 'three';
import {COURSE,REFERENCE_TRAVEL,TRACK_LENGTH,roadCurvature,curvatureForDemand} from './challenges';
export {roadCurvature};
const heights=[[0,8],[.18,46],[1/3,26],[.49,110],[2/3,65],[.82,28],[1,8]];
export function elevation(distance:number){const f=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH/TRACK_LENGTH;let i=1;while(i<heights.length-1&&f>heights[i][0])i++;const [a,lo]=heights[i-1],[b,hi]=heights[i],t=(f-a)/(b-a);return {height:lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*t)),grade:(hi-lo)*Math.PI/2*Math.sin(Math.PI*t)/((b-a)*TRACK_LENGTH)};}
/** Precomputed midpoint quadrature of authored curvature. Neutral spans solve closure,
 * rather than pulling a sampled curve back into a loop or changing driver authority. */
export function createTrack({course=COURSE,heightAt=elevation,demandAt,loop=true,banking=true,bankWeights,bankAt}:{course?:typeof COURSE;heightAt?:(d:number)=>{height:number;grade:number};demandAt?:(d:number)=>number;loop?:boolean;banking?:boolean;bankWeights?:(d:number)=>number[];bankAt?:(d:number,k:number)=>number}={}){
 const length=course.at(-1)!.end,normalize=(d:number)=>loop?((d%length)+length)%length:Math.max(0,Math.min(length,d));
 const challenge=(distance:number)=>{const d=normalize(distance),c=course.find(c=>d<c.end)??course.at(-1)!;return {...c,...(demandAt?{targetRequiredSteering:demandAt(d)}:{}),offset:d-c.start};};
 const curvature=(d:number)=>{if(demandAt)return curvatureForDemand(demandAt(normalize(d)));const c=challenge(d),r=c.transitionLength,u=r?Math.min(1,c.offset/r,(c.length-c.offset)/r):1;return curvatureForDemand(c.targetRequiredSteering*(.5-.5*Math.cos(Math.PI*Math.max(0,u))));};
 const positions:THREE.Vector3[]=[new THREE.Vector3(0,heightAt(0).height,0)],headings=[0],distances=[0];let x=0,z=0,heading=0;
 for(const c of course){const count=Math.ceil(c.nominalDurationAtReferenceSpeed*100),ds=c.length/count;
  for(let i=0;i<count;i++){const d=c.start+i*ds,turn=curvature(d+ds/2)*ds;x-=Math.sin(heading+turn/2)*ds;z+=Math.cos(heading+turn/2)*ds;heading+=turn;const end=c.start+(i+1)*ds;distances.push(end);headings.push(heading);positions.push(new THREE.Vector3(x,heightAt(end).height,z));}
 }
 const closureError=Math.hypot(x,z),headingError=heading-2*Math.PI;
 // Only sub-millimetre quadrature residue; fail loudly rather than hide a bad route.
 if(loop){if(closureError>.02||Math.abs(headingError)>.00001)throw new Error(`Route does not close: ${closureError}m / ${headingError}rad`);positions[positions.length-1].copy(positions[0]);headings[headings.length-1]=2*Math.PI;}
 const banks=banking?distances.map(d=>bankAt?bankAt(d,curvature(d)):generatedBank(curvature(d),bankWeights?bankWeights(d):[0,1,2].map(i=>i===challenge(d).act?1:0))):undefined;
 function sample(distance:number){const d=normalize(distance);let lo=0,hi=distances.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(distances[mid]<=d)lo=mid;else hi=mid;}const t=(d-distances[lo])/(distances[hi]-distances[lo]),position=positions[lo].clone().lerp(positions[hi],t),roadHeading=THREE.MathUtils.lerp(headings[lo],headings[hi],t),{height,grade}=heightAt(d);position.y=height;const tangent=new THREE.Vector3(-Math.sin(roadHeading),grade,Math.cos(roadHeading)).normalize(),right=new THREE.Vector3(-Math.cos(roadHeading),banks?-Math.tan(THREE.MathUtils.lerp(banks[lo],banks[hi],t)):0,-Math.sin(roadHeading));return {position,tangent,right,curvature:curvature(d),roadHeading,challenge:challenge(d)};}
 return {sample,length,closureError,headingError,referenceTravel:REFERENCE_TRAVEL};
}
