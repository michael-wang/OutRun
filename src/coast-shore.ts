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
 const minX=Math.min(...points.map(p=>p.position.x))-180,minZ=Math.min(...points.map(p=>p.position.z))-180;
 const sx=Math.max(...points.map(p=>p.position.x))+180-minX,sz=Math.max(...points.map(p=>p.position.z))+180-minZ;
 const width=Math.max(128,Math.ceil(1024*sx/Math.max(sx,sz))),height=Math.max(128,Math.ceil(1024*sz/Math.max(sx,sz)));
 const segments=points.slice(1).map((b,i)=>{
  const a=points[i],dx=b.position.x-a.position.x,dz=b.position.z-a.position.z;
  return {a,b,d:Math.min(i*20,length),end:Math.min((i+1)*20,length),dx,dz,inv:1/(dx*dx+dz*dz),lo:i===0?-200:0,hi:i===points.length-2?200:1};
 });
 const data=new Uint16Array(width*height*4);
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const x=minX+(i+.5)*sx/width,z=minZ+(j+.5)*sz/height;
  let best=Infinity,chosen=segments[0],fraction=0;
  for(const seg of segments){
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
  data[k+2]=THREE.DataUtils.toHalfFloat(-rx/n);data[k+3]=THREE.DataUtils.toHalfFloat(-rz/n);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return {texture,bounds:new THREE.Vector4(minX,minZ,sx,sz)};
}
