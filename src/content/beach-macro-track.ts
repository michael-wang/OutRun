import * as THREE from 'three';
import {beachMacro,beachVista,beachFlow,macroRoadRise,macroBeachBow} from '../beach-macro';
import type {createTrack} from '../track';
/** Compactly supported alignment study: exact original sample outside the site.
 * Route stations remain the authored coordinate; local world arc length differs.
 */
export function beachMacroTrack(base:ReturnType<typeof createTrack>){
 if(beachMacro()==='none')return base;
 const start=4350,end=8450;
 const position=singleRightPositions(base);
 const heading=(d:number)=>{const v=position(d+.5,false).sub(position(d-.5,false));return Math.atan2(-v.x,v.z);};
 return {...base,sample:(d:number)=>{
  const s=base.sample(d);if(d<=start||d>=end)return s;
  const tangent=position(d+.5).sub(position(d-.5));
  const h=Math.atan2(-tangent.x,tangent.z);tangent.normalize();
  const turn=heading(d+1)-heading(d-1);
  const delta=Math.atan2(Math.sin(turn),Math.cos(turn));
  const curvature=delta/position(d+1).distanceTo(position(d-1));
  return {...s,position:position(d,true,s.position.y),tangent,right:new THREE.Vector3(-Math.cos(h),s.right.y,-Math.sin(h)),roadHeading:h,curvature};
 }};
}

/** One positive-curvature braking turn, then 1.7km straight/gentle right.
 * A smooth exit connector AFTER the beach returns to the untouched route.
 * No offset lobes and no compensating left bend on the approach. */
function singleRightPositions(base:ReturnType<typeof createTrack>){
 const vista=beachVista(),flow=beachFlow();
 const start=4350,exit=6550,end=8450,h0=base.sample(start).roadHeading;
 const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(10+t*(-15+6*t));};
 const angle=(d:number)=>h0+.20*ease((d-4570)/280)+(vista?.61:.70)*ease((d-4635)/150)+.02*ease((d-4850)/(exit-4850));
 const table=[base.sample(start).position.clone()];
 for(let d=start;d<exit;d++){
  const h=angle(d+.5);table.push(table.at(-1)!.clone().add(new THREE.Vector3(-Math.sin(h),0,Math.cos(h))));
 }
 const a=table.at(-1)!,b=base.sample(end),span=end-exit;
 const v0=new THREE.Vector3(-Math.sin(angle(exit)),0,Math.cos(angle(exit))).multiplyScalar(span);
 const v1=new THREE.Vector3(b.tangent.x,0,b.tangent.z).normalize().multiplyScalar(span);
 const a1=new THREE.Vector3(-Math.cos(b.roadHeading),0,-Math.sin(b.roadHeading)).multiplyScalar(b.curvature*span*span);
 const delta=b.position.clone().sub(a).setY(0),c3=delta.clone().multiplyScalar(10).addScaledVector(v0,-6).addScaledVector(v1,-4).addScaledVector(a1,.5);
 const c4=delta.clone().multiplyScalar(-15).addScaledVector(v0,8).addScaledVector(v1,7).addScaledVector(a1,-1);
 const c5=delta.clone().multiplyScalar(6).addScaledVector(v0,-3).addScaledVector(v1,-3).addScaledVector(a1,.5);
 return (d:number,includeHeight=true,knownHeight?:number)=>{
  if(d<=start||d>=end)return base.sample(d).position;
  let p:THREE.Vector3;
  if(d<exit){const i=Math.floor(d-start);p=table[i].clone().lerp(table[i+1],d-start-i);}
  else {const t=(d-exit)/span;p=a.clone().addScaledVector(v0,t).addScaledVector(c3,t**3).addScaledVector(c4,t**4).addScaledVector(c5,t**5);}
  const bow=macroBeachBow(d,flow),h=angle(Math.min(d,exit));
  p.add(new THREE.Vector3(-Math.cos(h),0,-Math.sin(h)).multiplyScalar(bow));
  // Heading uses only X/Z. Avoid sampling the entire base track for an unused height.
  return includeHeight?p.setY((knownHeight??base.sample(d).position.y)+macroRoadRise(d,flow)):p;
 };
}
