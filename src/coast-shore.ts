import {coastBeachX} from './coast-layout';
import * as THREE from 'three';
import {coastBeachHeight,COAST_SHORE_OFFSET} from './scenery-cross-section';

type ShoreSample={position:THREE.Vector3;right:THREE.Vector3};
/** A one-time, world-space coastal mask from the existing road, not a terrain
 * generator. Channels: signed distance offshore, sand height, outward X/Z.
 * Both the FFT surface and its fragment clipping read the same static map. */
function* coastShoreRows(sample:(d:number)=>ShoreSample,length:number){
 const points:ShoreSample[]=[];
 for(let d=0;d<length;d+=20)points.push(sample(d));
 points.push(sample(length));
 const minX=Math.min(...points.map(p=>p.position.x))-180,minZ=Math.min(...points.map(p=>p.position.z))-180;
 const sx=Math.max(...points.map(p=>p.position.x))+180-minX,sz=Math.max(...points.map(p=>p.position.z))+180-minZ;
 // Preserve metre-scale shore clipping when the authored route grows.
 const resolution=Math.max(1024,Math.min(4096,Math.ceil(Math.max(sx,sz)/3)));
 const width=Math.max(128,Math.ceil(resolution*sx/Math.max(sx,sz))),height=Math.max(128,Math.ceil(resolution*sz/Math.max(sx,sz)));
 const segments=points.slice(1).map((b,i)=>{
  const a=points[i],dx=b.position.x-a.position.x,dz=b.position.z-a.position.z;
  const lo=i===0?-200:0,hi=i===points.length-2?200:1;
  return {a,b,d:Math.min(i*20,length),end:Math.min((i+1)*20,length),dx,dz,inv:1/(dx*dx+dz*dz),lo,hi,
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
  data[k+2]=THREE.DataUtils.toHalfFloat(-rx/n);data[k+3]=THREE.DataUtils.toHalfFloat(-rz/n);
  }
  yield (j+1)/height;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return {texture,bounds:new THREE.Vector4(minX,minZ,sx,sz)};
}

/** Synchronous entry retained for offline checks. */
export function bakeCoastShore(sample:(d:number)=>ShoreSample,length:number){
 const rows=coastShoreRows(sample,length);let next=rows.next();
 while(!next.done)next=rows.next();
 return next.value;
}
/** Yield between short row batches so mobile loading UI keeps painting. */
export async function bakeCoastShoreAsync(sample:(d:number)=>ShoreSample,length:number,onProgress:(p:number)=>void=()=>{}){
 const rows=coastShoreRows(sample,length);let next=rows.next(),since=performance.now();
 while(!next.done){
  if(performance.now()-since>=8){
   onProgress(next.value);
   await new Promise<void>(resolve=>setTimeout(resolve,0));
   since=performance.now();
  }
  next=rows.next();
 }
 onProgress(1);return next.value;
}
