import * as THREE from 'three';
import type {createTrack} from '../track';

/** Rigid scene orientations, joined only across transition windows.
 * Angles are world X/Z heading offsets, not a moving sun or camera effect. */
export const SUNSET_CONNECTORS=[
 [1370,1570,-40,-35],[2195,2395,-35,-25],[3800,4000,-25,0],
 [8450,8750,0,-30],[10200,10500,-30,-75],
 [11200,11520,-75,-50],[12420,12720,-50,-35],[13400,13720,-35,-40],
] as const;
export function sunsetHeadingOffset(d:number){
 let degrees=-40;
 for(const [a,b,from,to] of SUNSET_CONNECTORS){
  if(d<a)break;
  if(d>=b){degrees=to;continue;}
  const t=(d-a)/(b-a),ease=t*t*t*(10+t*(-15+6*t));
  degrees=from+(to-from)*ease;break;
 }
 return degrees*Math.PI/180;
}

export function coastSunsetTrack(base:ReturnType<typeof createTrack>){
 const end=Math.ceil(base.length+600),anchor=4000,positions:THREE.Vector3[]=[];
 positions[anchor]=base.sample(anchor).position.clone();
 const step=(d:number)=>{
  const delta=base.sample(d+1).position.clone().sub(base.sample(d).position);
  const angle=sunsetHeadingOffset(d+.5),c=Math.cos(angle),s=Math.sin(angle);
  return new THREE.Vector3(delta.x*c+delta.z*s,delta.y,-delta.x*s+delta.z*c);
 };
 for(let d=anchor;d<end;d++)positions[d+1]=positions[d].clone().add(step(d));
 for(let d=anchor-1;d>=0;d--)positions[d]=positions[d+1].clone().sub(step(d));
 const position=(d:number)=>{
  const i=Math.max(0,Math.min(end-1,Math.floor(d)));
  return positions[i].clone().lerp(positions[i+1],d-i);
 };
 const tangent=(d:number)=>position(d+.5).sub(position(d-.5)).normalize();
 const heading=(d:number)=>{const t=tangent(d);return Math.atan2(-t.x,t.z);};
 return {...base,sample:(d:number)=>{
  const p=base.sample(d);
  // Exact retained braking turn, beach, cape and original exit connector.
  if(d>=4000&&d<=8450)return p;
  if(!SUNSET_CONNECTORS.some(([a,b])=>d>a&&d<b)){
   const angle=sunsetHeadingOffset(d),c=Math.cos(angle),s=Math.sin(angle);
   const rotate=(v:THREE.Vector3)=>new THREE.Vector3(v.x*c+v.z*s,v.y,-v.x*s+v.z*c);
   return {...p,position:position(d),tangent:rotate(p.tangent),right:rotate(p.right),roadHeading:p.roadHeading-angle};
  }
  const h=heading(d),delta=heading(d+1)-heading(d-1);
  return {...p,position:position(d),tangent:tangent(d),
   right:new THREE.Vector3(-Math.cos(h),p.right.y,-Math.sin(h)),roadHeading:h,
   curvature:Math.atan2(Math.sin(delta),Math.cos(delta))/position(d+1).distanceTo(position(d-1))};
 }};
}
