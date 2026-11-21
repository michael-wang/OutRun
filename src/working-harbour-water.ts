import * as THREE from 'three';
import { WORKING_HARBOUR, WORKING_HARBOUR_ACTIVE } from './working-harbour-profile';
import { beach2 } from './beach2-profile';

type Sample = (station: number) => { position: THREE.Vector3; tangent: THREE.Vector3 };

export const HARBOUR_WET_START = 6600;
export const HARBOUR_WET_CORE_GAIN = .24;
const RISE = 330;
const FALL = 190;

/** The two end planes use the actual route's lateral frames, rather than a
 * camera-relative radius. Signed shore distance is supplied by the same baked
 * mask used to keep water off the rocks. No polygon texture or extra pass. */
export function harbourWaterUniforms(sample: Sample, enabled = WORKING_HARBOUR_ACTIVE && beach2()){
 const h=WORKING_HARBOUR;
 const wetStart=Math.min(HARBOUR_WET_START,h.rockStart);
 const frame=(station:number)=>{
  const p=sample(station),t=new THREE.Vector2(p.tangent.x,p.tangent.z).normalize();
  return new THREE.Vector4(p.position.x,p.position.z,t.x,t.y);
 };
 const outerArm=Math.max(...h.breakwater.map(([,out])=>out));
 return {
  uHarbourWetStart:{value:frame(wetStart)},
  uHarbourWetEnd:{value:frame(h.rockEnd+65)},
  uHarbourWetProfile:{value:new THREE.Vector4(enabled?1:0,outerArm+16,outerArm+114,HARBOUR_WET_CORE_GAIN)},
 };
}

const smooth=(a:number,b:number,x:number)=>{
 const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
 return t*t*(3-2*t);
};

// CPU equivalent for a geometric envelope check (never sampled per game frame).
export function harbourWaterGain(field:ReturnType<typeof harbourWaterUniforms>,x:number,z:number,offshore:number){
 const {uHarbourWetStart:{value:a},uHarbourWetEnd:{value:b},uHarbourWetProfile:{value:p}}=field;
 const into=(x-a.x)*a.z+(z-a.y)*a.w, before=(b.x-x)*b.z+(b.y-z)*b.w;
 const sheltered=p.x*smooth(0,RISE,into)*smooth(0,FALL,before)*(1-smooth(p.y,p.z,offshore));
 return 1+(p.w-1)*sheltered;
}

export const harbourWaterGLSL=/* glsl */`
uniform vec4 uHarbourWetStart;
uniform vec4 uHarbourWetEnd;
uniform vec4 uHarbourWetProfile; // enabled, deep basin edge, open sea edge, minimum gain
float harbourShelter(vec2 xz,float offshore){
 if(uHarbourWetProfile.x<.5)return 0.;
 float into=dot(xz-uHarbourWetStart.xy,uHarbourWetStart.zw);
 float before=dot(uHarbourWetEnd.xy-xz,uHarbourWetEnd.zw);
 return smoothstep(0.,${RISE.toFixed(1)},into)*smoothstep(0.,${FALL.toFixed(1)},before)
  *(1.-smoothstep(uHarbourWetProfile.y,uHarbourWetProfile.z,offshore));
}
float harbourSwell(float shelter){return mix(1.,uHarbourWetProfile.w,shelter);}
`;
