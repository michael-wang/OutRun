import * as THREE from 'three';
import type {FarmPlot} from './coast-farm-layout';

/** Persistent, opaque crop-top LOD. The existing terrain sampler supplies every
 * position; only the crop height is added. No terrain or streaming replacement. */
export function riceCanopyGeometry(plot:FarmPlot,position:(d:number,x:number,lift:number)=>THREE.Vector3,clearPath:(d:number,x:number)=>boolean){
 const nx=Math.ceil((plot.right-plot.left)/2),nz=Math.ceil((plot.end-plot.start)/2);
 const vertices:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++){
  const d=plot.start+(plot.end-plot.start)*z/nz,lateral=plot.left+(plot.right-plot.left)*x/nx;
  const grain=Math.sin(d*1.73+lateral*2.31)*Math.sin(d*.71-lateral*1.43);
  // Thin out toward the bund so the driver can see between the first stalks.
  const margin=x===0||x===nx||z===0||z===nz;
  const cover=margin?.12+.09*grain:1;
  const p=position(d,lateral,.14+.69*cover+grain*.075);vertices.push(p.x,p.y,p.z);uv.push(lateral/4,d/4);
  const c=new THREE.Color('#dfbb55').lerp(new THREE.Color('#b9ad4d'),.12+.08*Math.sin(d*.043+lateral*.08));
  c.multiplyScalar(.98+grain*.035);colors.push(c.r,c.g,c.b,cover);
 }
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){
  const d=plot.start+(plot.end-plot.start)*(z+.5)/nz,lateral=plot.left+(plot.right-plot.left)*(x+.5)/nx;
  if(clearPath(d,lateral))continue;
  const a=z*(nx+1)+x,b=a+1,c=a+nx+1;indices.push(a,b,c,b,c+1,c);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.setIndex(indices);g.computeVertexNormals();return g;
}
