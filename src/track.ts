import * as THREE from 'three';
import {HALF_LENGTH,TRACK_LENGTH,roadCurvature,challengeAt} from './challenges';
export {roadCurvature};
/** Integrate authored curvature. Opposed identical halves close without a
 * residual-position correction that would silently change calibration. */
export function createTrack(){
 const halfCount=Math.ceil(HALF_LENGTH/1.5),spacing=HALF_LENGTH/halfCount;
 const positions:THREE.Vector3[]=[],headings:number[]=[];
 let x=0,z=0,heading=0;
 for(let i=0;i<=halfCount;i++){
  positions.push(new THREE.Vector3(x,0,z));headings.push(heading);
  const d=i*spacing,turn=roadCurvature(d+spacing/2)*spacing;
  x-=Math.sin(heading+turn/2)*spacing;z+=Math.cos(heading+turn/2)*spacing;heading+=turn;
 }
 const end=positions[halfCount].clone();
 for(let i=1;i<=halfCount;i++){positions.push(end.clone().sub(positions[i]));headings.push(headings[i]+Math.PI);}
 const count=halfCount*2;
 for(let i=0;i<=count;i++)positions[i].y=32-24*Math.cos(2*Math.PI*i/count);
 function sample(distance:number){
  const d=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH,index=d/spacing,i=Math.floor(index),t=index-i;
  const position=positions[i].clone().lerp(positions[i+1],t),roadHeading=THREE.MathUtils.lerp(headings[i],headings[i+1],t);
  const grade=24*2*Math.PI/TRACK_LENGTH*Math.sin(2*Math.PI*d/TRACK_LENGTH);
  const tangent=new THREE.Vector3(-Math.sin(roadHeading),grade,Math.cos(roadHeading)).normalize();
  const right=new THREE.Vector3(-Math.cos(roadHeading),0,-Math.sin(roadHeading));
  return {position,tangent,right,curvature:roadCurvature(d),roadHeading,challenge:challengeAt(d)};
 }
 return {sample,length:TRACK_LENGTH};
}
