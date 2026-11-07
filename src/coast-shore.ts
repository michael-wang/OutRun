import {coastBeachX} from './coast-layout';
import * as THREE from 'three';
import {coastBeachHeight,COAST_SHORE_OFFSET} from './scenery-cross-section';

type ShoreSample={position:THREE.Vector3;right:THREE.Vector3};
/** A one-time, world-space coastal mask from the existing road, not a terrain
 * generator. Channels: signed distance offshore, sand height, outward X/Z.
 * Both the FFT surface and its fragment clipping read the same static map. */
export function bakeCoastShore(sample:(d:number)=>ShoreSample,length:number){
 const points:ShoreSample[]=[];
 for(let d=0;d<length;d+=20)points.push(sample(d));
 points.push(sample(length));
 // The wash follows the waterline around a sand point, even on a straight
 // road. Bake its horizontal normal from neighbouring waterline stations.
 const edge=points.map((p,i)=>{
  const x=coastBeachX(COAST_SHORE_OFFSET,Math.min(i*20,length));
  return new THREE.Vector2(p.position.x+x*p.right.x,p.position.z+x*p.right.z);
 });
 const outward=edge.map((_,i)=>{
  const tangent=edge[Math.min(i+1,edge.length-1)].clone().sub(edge[Math.max(0,i-1)]);
  const normal=new THREE.Vector2(tangent.y,-tangent.x).normalize(),r=points[i].right;
  return normal.x*r.x+normal.y*r.z>0?normal.negate():normal;
 });
 const minX=Math.min(...points.map(p=>p.position.x))-180,minZ=Math.min(...points.map(p=>p.position.z))-180;
 const sx=Math.max(...points.map(p=>p.position.x))+180-minX,sz=Math.max(...points.map(p=>p.position.z))+180-minZ;
 // Preserve metre-scale shore clipping when the authored route grows.
 const resolution=Math.max(1024,Math.min(4096,Math.ceil(Math.max(sx,sz)/3)));
 const width=Math.max(128,Math.ceil(resolution*sx/Math.max(sx,sz))),height=Math.max(128,Math.ceil(resolution*sz/Math.max(sx,sz)));
 const segments=points.slice(1).map((b,i)=>{
  const a=points[i],dx=b.position.x-a.position.x,dz=b.position.z-a.position.z;
  const lo=i===0?-200:0,hi=i===points.length-2?200:1;
  return {a,b,outA:outward[i],outB:outward[i+1],d:Math.min(i*20,length),end:Math.min((i+1)*20,length),dx,dz,inv:1/(dx*dx+dz*dz),lo,hi,
   minZ:Math.min(a.position.z+dz*lo,a.position.z+dz*hi),maxZ:Math.max(a.position.z+dz*lo,a.position.z+dz*hi)};
 });
 const data=new Uint16Array(width*height*4);
 for(let j=0;j<height;j++){
  const z=minZ+(j+.5)*sz/height;
  // Exact nearest-segment search: a row's Z separation is a lower bound on
  // world distance. Stop once no remaining segment can improve the result.
  const row=segments.map(seg=>({seg,bound:Math.max(seg.minZ-z,0,z-seg.maxZ)**2})).sort((a,b)=>a.bound-b.bound);
  for(let i=0;i<width;i++){
  const x=minX+(i+.5)*sx/width;
  let best=Infinity,chosen=segments[0],fraction=0;
  for(const {seg,bound} of row){
   if(bound>best)break;
   const t=Math.max(seg.lo,Math.min(seg.hi,((x-seg.a.position.x)*seg.dx+(z-seg.a.position.z)*seg.dz)*seg.inv));
   const dx=x-seg.a.position.x-seg.dx*t,dz=z-seg.a.position.z-seg.dz*t,dist=dx*dx+dz*dz;
   if(dist<best){best=dist;chosen=seg;fraction=t;}
  }
  const {a,b,dx,dz}=chosen,t=Math.max(0,Math.min(1,fraction));
  const rx=a.right.x+(b.right.x-a.right.x)*t,rz=a.right.z+(b.right.z-a.right.z)*t,n=Math.hypot(rx,rz);
  const lateral=((x-a.position.x-dx*fraction)*rx+(z-a.position.z-dz*fraction)*rz)/n;
  const distance=chosen.d+(chosen.end-chosen.d)*t;
  const y=coastBeachHeight(lateral,a.position.y+(b.position.y-a.position.y)*t,a.right.y+(b.right.y-a.right.y)*t,distance);
  const k=(j*width+i)*4;
  data[k]=THREE.DataUtils.toHalfFloat(-lateral+coastBeachX(COAST_SHORE_OFFSET,distance));
  data[k+1]=THREE.DataUtils.toHalfFloat(y);
  const nx=THREE.MathUtils.lerp(chosen.outA.x,chosen.outB.x,t),nz=THREE.MathUtils.lerp(chosen.outA.y,chosen.outB.y,t);
  const magnitude=Math.hypot(nx,nz);
  data[k+2]=THREE.DataUtils.toHalfFloat(nx/magnitude);data[k+3]=THREE.DataUtils.toHalfFloat(nz/magnitude);
  }
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return {texture,bounds:new THREE.Vector4(minX,minZ,sx,sz)};
}
