import * as THREE from 'three';
import {ricePlotEdges,type FarmPlot} from './coast-farm-layout';

/** Persistent, opaque crop-top LOD. The existing terrain sampler supplies every
 * position; only the crop height is added. No terrain or streaming replacement. */
export function riceCanopyGeometry(plot:FarmPlot,position:(d:number,x:number,lift:number)=>THREE.Vector3,clearPath:(d:number,x:number)=>boolean){
 const nx=Math.ceil((plot.right-plot.left)/2),nz=Math.min(50,Math.ceil((plot.end-plot.start)/2));
 const vertices:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let z=0;z<=nz;z++){
  const d=plot.start+(plot.end-plot.start)*z/nz,{left,right}=ricePlotEdges(plot,d);
  for(let x=0;x<=nx;x++){
   const lateral=left+(right-left)*x/nx;
   const grain=Math.sin(d*1.73+lateral*2.31)*Math.sin(d*.71-lateral*1.43);
   // Thin out toward the bund so the driver can see between the first stalks.
   const margin=x===0||x===nx||z===0||z===nz;
   const cover=margin?.12+.09*grain:1;
   const p=position(d,lateral,.14+.69*cover+grain*.075);vertices.push(p.x,p.y,p.z);uv.push((lateral-plot.left)/4,(d-plot.start)/4);
   const c=new THREE.Color('#f6e8c8').lerp(new THREE.Color('#c1d4a7'),.30+.22*Math.sin(plot.id*1.7)+.075*Math.sin(d*.043+lateral*.08));
   c.multiplyScalar(.98+grain*.035);colors.push(c.r,c.g,c.b,cover);
  }
 }
 for(let z=0;z<nz;z++){
  const d=plot.start+(plot.end-plot.start)*(z+.5)/nz,{left,right}=ricePlotEdges(plot,d);
  for(let x=0;x<nx;x++){
   const lateral=left+(right-left)*(x+.5)/nx;
   if(clearPath(d,lateral))continue;
   const a=z*(nx+1)+x,b=a+1,c=a+nx+1;indices.push(a,b,c,b,c+1,c);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Closed earthen bund. Its inside toe follows the same stations as the water,
 * including the return around each tool yard. */
export function riceBundGeometry(plot:FarmPlot,position:(d:number,x:number,lift:number)=>THREE.Vector3){
 const rows=Math.ceil((plot.end-plot.start)/4),inner:THREE.Vector2[]=[],outer:THREE.Vector2[]=[];
 for(let i=0;i<=rows;i++){
  const d=plot.start+(plot.end-plot.start)*i/rows,{left,right}=ricePlotEdges(plot,d);
  inner.push(new THREE.Vector2(left,d));outer.push(new THREE.Vector2(right,d));
 }
 const ring=inner.concat(outer.reverse()),vertices:number[]=[],uv:number[]=[],ix:number[]=[];
 for(let i=0;i<ring.length;i++){
  const p=ring[i],before=ring[(i+ring.length-1)%ring.length],after=ring[(i+1)%ring.length];
  const incoming=p.clone().sub(before).normalize(),outgoing=after.clone().sub(p).normalize();
  const bisector=incoming.clone().add(outgoing).normalize();
  const normal=new THREE.Vector2(-bisector.y,bisector.x).divideScalar(bisector.dot(incoming));
  // Bury the outer toe into the coarser hillside, including sloping corners.
  for(const [offset,height] of [[0,.04],[.32,.31],[.86,.32],[1.5,-.72]]){
   const q=position(p.y+normal.y*offset,p.x+normal.x*offset,height);
   vertices.push(q.x,q.y,q.z);uv.push((p.x+normal.x*offset)/8,(p.y+normal.y*offset)/8);
  }
  const a=i*4,b=(i+1)%ring.length*4;
  for(let j=0;j<3;j++)ix.push(a+j,b+j,a+j+1,a+j+1,b+j,b+j+1);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
