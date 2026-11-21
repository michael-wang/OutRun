import * as THREE from 'three';
import type {createTrack} from './track';
import {BEACH2,beach2Shore} from './beach2-profile';
import {COAST_SHADOW_AWAY} from './coast-sun-direction';
import {coastBeachHeight} from './scenery-cross-section';

export const coral=0xd95138, cream=0xf6e3ac, teal=0x275855;

/** Contact shade and woven mats share a terrain-fitted decal pass. Sample the
 * road frame at each vertex so the offshore edge cannot float above the sand. */
export function parasolGround(sample:ReturnType<typeof createTrack>['sample'],sites:ReadonlyArray<{station:number;lateral:number;radius:number}>){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const shade=new THREE.Color(0x433838),mat=new THREE.Color(0xc79b70),edging=new THREE.Color(0xcb7855);
 function vertex(station:number,lateral:number,color:THREE.Color,alpha:number,lift:number){
  const p=sample(station),v=p.position.clone().addScaledVector(p.right,lateral);
  v.y=coastBeachHeight(lateral,p.position.y,p.right.y,station)+lift;
  positions.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b,alpha);
  return positions.length/3-1;
 }
 for(const {station,lateral,radius} of sites){
  const frame=sample(station),ds=COAST_SHADOW_AWAY.dot(frame.tangent),dx=COAST_SHADOW_AWAY.dot(frame.right);
  const at=station+ds*radius*.43,x=lateral+dx*radius*.43;
  const center=vertex(at,x,shade,.36,.042),sides=14;
  for(const [ring,scale] of [.68,1].entries()){
   const first=positions.length/3;
   for(let i=0;i<sides;i++){
    const a=2*Math.PI*i/sides,along=Math.cos(a)*radius*1.12*scale,across=Math.sin(a)*radius*.82*scale;
    vertex(at+ds*along-dx*across,x+dx*along+ds*across,shade,ring===0?.31:0,.042);
    const next=(i+1)%sides;
    if(ring===0)indices.push(center,first+i,first+next);
    else indices.push(first-sides+i,first+i,first+next,first-sides+i,first+next,first-sides+next);
   }
  }
  const first=positions.length/3;
  for(const offset of [-1.05,-.91,.91,1.05])for(const side of [-.70,.70]){
   vertex(station+.8+offset,lateral+1+side,Math.abs(offset)>1?edging:mat,1,.062);
  }
  for(let j=0;j<3;j++){const k=first+2*j;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));geometry.setIndex(indices);
 const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Grounded parasol shade and mats';return mesh;
}

/** Thin ground-following color patches share one mesh. Heights come from the same
 * cross-section as the beach, and shoreline fragments follow the water boundary. */
export function beachSurfacePaint(sample:ReturnType<typeof createTrack>['sample']){
 const pos:number[]=[],rgb:number[]=[],idx:number[]=[];
 function band(start:number,end:number,center:(s:number)=>number,width:number,color:number,steps:number,variation:number,water=false){
  const base=pos.length/3,tint=new THREE.Color(color);
  for(let j=0;j<=steps;j++){
   const t=j/steps,s=start+(end-start)*t,d=BEACH2.core+s,p=sample(d);
   const half=width*Math.pow(Math.max(.0001,Math.sin(Math.PI*t)),.54);
   for(const side of [-1,0,1]){
    const x=center(s)+side*half*(1+.12*Math.sin(s*.24+side));
    const v=p.position.clone().addScaledVector(p.right,x);
    v.y=water?-4.93:coastBeachHeight(x,p.position.y,p.right.y,d)+.08;
    pos.push(v.x,v.y,v.z);const shade=1+variation*Math.sin(.21*s+side);
    rgb.push(tint.r*shade,tint.g*shade,tint.b*shade);
   }
   if(j){const k=base+j*3;idx.push(k-3,k,k-2,k,k+1,k-2,k-2,k+1,k-1,k+1,k+2,k-1);}
  }
 }
 const shore=(s:number)=>beach2Shore(BEACH2.core+s);
 band(555,910,s=>shore(s)+3+.6*Math.sin(s*.11),3,0xaa8a71,155,.08);
 // Short broken crests in the existing shallows; open gaps preserve the sunset reflection.
 for(let i=0;i<23;i++){
  const s=602+i*10.3+3*Math.sin(i*1.7);
  band(s,s+5+i%4,u=>shore(u)-.9-.8*Math.sin(u*.12),.17,0xe5ceb1,6,.05,true);
  if(i%3===0)band(s-2,s+6,u=>shore(u)-3.2+.4*Math.sin(u*.14),.40,0x427f82,6,.07,true);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));g.setIndex(idx);g.computeVertexNormals();
 return new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.91}));
}
