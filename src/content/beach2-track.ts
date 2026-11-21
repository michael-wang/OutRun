import * as THREE from 'three';
import type {createTrack} from '../track';
import {beach2,beach2Heading,beach2RoadHeight} from '../beach2-profile';
import {KENTING_SEGMENT} from '../kenting-installation';
type Track=ReturnType<typeof createTrack>;
/** Quintic Hermite joins preserve position, first and second derivatives. */
export function roadJoin(base:(d:number)=>THREE.Vector3,core:(d:number)=>THREE.Vector3,a:number,b:number){
 const span=b-a,A=base(a),B=core(b),v0=base(a+.1).sub(base(a-.1)).multiplyScalar(span/.2),v1=core(b+.1).sub(core(b-.1)).multiplyScalar(span/.2);
 const q0=base(a+.1).add(base(a-.1)).addScaledVector(A,-2).multiplyScalar(span*span/.01);
 const q1=core(b+.1).add(core(b-.1)).addScaledVector(B,-2).multiplyScalar(span*span/.01);
 const delta=B.clone().sub(A),c2=q0.clone().multiplyScalar(.5);
 const c3=delta.clone().multiplyScalar(10).addScaledVector(v0,-6).addScaledVector(v1,-4).addScaledVector(q0,-1.5).addScaledVector(q1,.5);
 const c4=delta.clone().multiplyScalar(-15).addScaledVector(v0,8).addScaledVector(v1,7).addScaledVector(q0,1.5).addScaledVector(q1,-1);
 const c5=delta.clone().multiplyScalar(6).addScaledVector(v0,-3).addScaledVector(v1,-3).addScaledVector(q0,-.5).addScaledVector(q1,.5);
 return(d:number)=>{const t=(d-a)/span;return A.clone().addScaledVector(v0,t).addScaledVector(c2,t*t).addScaledVector(c3,t**3).addScaledVector(c4,t**4).addScaledVector(c5,t**5);};
}
export function beach2Track(base:Track):Track{
 if(!beach2())return base;
 const {referenceCore:core,coreLength:length}=KENTING_SEGMENT;
 const start=core-50,end=core+KENTING_SEGMENT.local.roadExit,axis=base.sample(core+650).roadHeading-.04;
 const table=[base.sample(core).position.clone().setY(beach2RoadHeight(0))];
 for(let s=0;s<length;s++){const h=axis+beach2Heading(s+.5);table.push(table.at(-1)!.clone().add(new THREE.Vector3(-Math.sin(h),0,Math.cos(h))).setY(beach2RoadHeight(s+1)));}
 const original=(d:number)=>base.sample(d).position;
 const inside=(d:number)=>{const s=d-core;if(s<=0||s>=length){const edge=s<=0?0:length,h=axis+beach2Heading(edge);return table[edge].clone().add(new THREE.Vector3(-Math.sin(h),0,Math.cos(h)).multiplyScalar(s-edge));}const i=Math.floor(s);return table[i].clone().lerp(table[i+1],s-i);};
 const pre=roadJoin(original,inside,start,core),post=roadJoin(inside,original,core+length,end);
 const position=(d:number)=>d<=start||d>=end?original(d):d<core?pre(d):d<=core+length?inside(d):post(d);
 const heading=(d:number)=>{const v=position(d+.25).sub(position(d-.25));return Math.atan2(-v.x,v.z);};
 return {...base,sample(d:number){const old=base.sample(d);if(d<=start||d>=end)return old;const h=heading(d),t=position(d+.25).sub(position(d-.25)).normalize();const dh=Math.atan2(Math.sin(heading(d+.5)-heading(d-.5)),Math.cos(heading(d+.5)-heading(d-.5)));return {...old,position:position(d),tangent:t,right:new THREE.Vector3(-Math.cos(h),old.right.y,-Math.sin(h)),roadHeading:h,curvature:dh/position(d+.5).distanceTo(position(d-.5))};}};
}
