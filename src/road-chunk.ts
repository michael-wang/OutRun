import {rockyAt,rockNode,rockWall,type RockySection} from './rocky-shoulder';
import {CANYON_BEND,canyonBend,canyonBlend} from './canyon-identity';
import * as THREE from 'three';
import {ACTS} from './acts';
import {roadOffset,LANE_WIDTH} from './road-profile';
import type {createTrack} from './track';

type Sample=ReturnType<typeof createTrack>['sample'];
export interface RayRange {start:number;end:number;offset:number;count:number}
export interface RoadMeshData {normals?:Float32Array;rayRanges?:RayRange[];kind:'asphalt'|'sand'|'grass'|'line'|'rail'|'support'|'edge-white'|'edge-red'|'surf';positions:Float32Array;uvs:Float32Array;colors:Float32Array;indices:Uint32Array}
type Edge=number|((d:number)=>number);
/** Numeric road preparation. Every endpoint uses the original absolute sampler. */
export function prepareRoadChunk(sample:Sample,halfAt:(d:number)=>number,weightsAt:(d:number)=>number[],start:number,end:number,length:number,canyon=false,seamless=false,rocks:readonly RockySection[]=[]):RoadMeshData[]{
 const out:RoadMeshData[]=[];
 const append=(kind:RoadMeshData['kind'],a:Edge,b:Edge,ha:number,hb:number,from:number,to:number,step:number)=>{
  if(to<=from)return;const positions:number[]=[],uvs:number[]=[],colors:number[]=[],indices:number[]=[],normals:number[]=[],n=Math.ceil((to-from)/step);
  const point=(d:number,raw:Edge,h:number)=>{const p=sample(d),o=typeof raw==='number'?raw:raw(d),v=p.position.clone().addScaledVector(p.right,roadOffset(o,halfAt(d))),w=weightsAt(d);const coastal=h<-10?-4.88:-5.05;v.y=o<=-27?THREE.MathUtils.lerp(coastal,v.y-2-Math.abs(o)*.015,w[1]):v.y+h;if(canyon&&kind==='grass')v.y-=canyonBlend(d)*Math.max(0,(o-13)/147)*65;return v;};
  for(let i=0;i<=n;i++){const d=from+(to-from)*i/n,p=sample(d);for(const [raw,h] of [[a,ha],[b,hb]] as [Edge,number][]){
   const o=typeof raw==='number'?raw:raw(d),v=p.position.clone().addScaledVector(p.right,roadOffset(o,halfAt(d))),weights=weightsAt(d);
   const coastal=o<=-27?(h<-10?-4.88:-5.05):v.y+h,height=o<=-27?THREE.MathUtils.lerp(coastal,v.y-2-Math.abs(o)*.015,weights[1]):v.y+h;
   const terrainDrop=canyon&&kind==='grass'?canyonBlend(d)*Math.max(0,(o-13)/147)*65:0;positions.push(v.x,height-terrainDrop,v.z);uvs.push(o/4,d/4);
   if(seamless){const cross=point(d,b,hb).sub(point(d,a,ha)),along=point(Math.min(length,d+.5),raw,h).sub(point(Math.max(0,d-.5),raw,h)),normal=cross.cross(along).normalize();normals.push(normal.x,normal.y,normal.z);}
   if(kind==='sand'||kind==='grass'){const color=new THREE.Color(0,0,0);weights.forEach((w,j)=>color.add(new THREE.Color(kind==='sand'?ACTS[j].shoulder:ACTS[j].ground).multiplyScalar(w)));if(canyon&&kind==='grass')color.lerp(new THREE.Color('#987e68'),canyonBlend(d)*Math.max(0,Math.min(1,(o-13)/90)));const rocky=rockyAt(d,Math.sign(o),rocks);if(rocky&&Math.abs(o)>7)color.lerp(new THREE.Color('#927658'),rockNode(d,rocky).blend);colors.push(color.r,color.g,color.b);}
  }}
  for(let i=0;i<n;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  out.push({kind,...(seamless?{normals:new Float32Array(normals)}:{}),...((kind==='asphalt'||kind==='sand')?{rayRanges:[{start:from,end:to,offset:0,count:indices.length}]}:{}),positions:new Float32Array(positions),uvs:new Float32Array(uvs),colors:new Float32Array(colors),indices:new Uint32Array(indices)});
 };
 append('sand',-160,-27,-9,-9,start,end,10);append('sand',-27,-13,-9,-.1,start,end,10);if(seamless){for(const [a,b] of [[-13,-7],[-7,7],[7,13]])append('sand',a,b,-.1,-.1,start,end,2.5);}else append('sand',-13,13,-.1,-.1,start,end,2.5);
 append('grass',13,75,-.12,-3,start,end,10);append('grass',75,160,-3,-14,start,end,10);
 append('asphalt',-7,7,0,0,start,end,2.5);
 append('line',d=>-7+.35*7/halfAt(d),d=>-7+.51*7/halfAt(d),.025,.025,start,end,2.5);
 append('line',d=>7-.51*7/halfAt(d),d=>7-.35*7/halfAt(d),.025,.025,start,end,2.5);
 let railRanges=canyon?[[start,Math.min(end,CANYON_BEND.start)],[Math.max(start,CANYON_BEND.end),end]]:[[start,end]];
 for(const r of rocks.filter(r=>r.side<0))railRanges=railRanges.flatMap(([a,b])=>b<=r.start||a>=r.end?[[a,b]]:[[a,Math.min(b,r.start)],[Math.max(a,r.end),b]].filter(([x,y])=>y>x));
 for(const [a,b] of railRanges){append('rail',-12.5,-12.3,.65,.65,a,b,2.5);append('rail',-12.5,-12.3,1.12,1.12,a,b,2.5);}
 if(canyon){const a=Math.max(start,CANYON_BEND.start),b=Math.min(end,CANYON_BEND.end);append('rail',CANYON_BEND.railOffset,CANYON_BEND.railOffset,.6,1.05,a,b,2.5);append('rail',CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness,CANYON_BEND.railOffset+CANYON_BEND.railHalfThickness,1.05,1.05,a,b,2.5);}
 append('surf',-29,-27,-10.9,-10.9,start,end,10);
 // Dash and edge phases are absolute. Splitting a piece at a chunk seam does
 // not reset its phase or duplicate its area.
 for(let d=Math.floor(start/6)*6;d<end;d+=6)for(const lane of [-3,-2,-1,0,1,2,3].map(n=>n*LANE_WIDTH)){
  if(d<0||Math.abs(lane)+.5>=Math.min(halfAt(d),halfAt(Math.min(d+3,length))))continue;
  const at=(delta:number)=>(s:number)=>(lane+delta)*7/halfAt(s);append('line',at(-.14),at(.14),.03,.03,Math.max(start,d),Math.min(end,d+3,length),1.5);
 }
 for(let color=0;color<2;color++)for(let d=Math.floor((start-color*3)/6)*6+color*3;d<end;d+=6)for(const side of [-1,1]){
  if(d<0||(canyon&&canyonBend(d))||rockyAt(d,side,rocks))continue;const offsets=side<0?[-7.7,-7.02]:[7.02,7.7];append(color?'edge-red':'edge-white',offsets[0],offsets[1],-.065,-.065,Math.max(start,d),Math.min(end,d+3,length),1.5);
 }
 const positions:number[]=[],indices:number[]=[],n=Math.ceil((end-start)/2.5);
 for(let i=0;i<=n;i++){const d=start+(end-start)*i/n,p=sample(d);for(const side of [-1,1]){const v=p.position.clone().addScaledVector(p.right,roadOffset(side*13,halfAt(d)));positions.push(v.x,v.y-.1,v.z,v.x,Math.min(v.y-4,-5),v.z);}}
 for(let i=0;i<n;i++)for(let side=0;side<2;side++){const a=i*4+side*2,b=a+4;indices.push(a,a+1,b,a+1,b+1,b);}
 out.push({kind:'support',positions:new Float32Array(positions),uvs:new Float32Array(),colors:new Float32Array(),indices:new Uint32Array(indices)});
 for(const r of rocks){const wall=rockWall(sample,halfAt,r,start,end);if(wall)out.push(wall);}
 // Merge by material before upload; dashes are not individual draw calls.
 const merged:RoadMeshData[]=[];
 for(const kind of new Set(out.map(x=>x.kind))){
  const pieces=out.filter(x=>x.kind===kind),positions=new Float32Array(pieces.reduce((n,x)=>n+x.positions.length,0)),uvs=new Float32Array(pieces.reduce((n,x)=>n+x.uvs.length,0)),colors=new Float32Array(pieces.reduce((n,x)=>n+x.colors.length,0)),indices=new Uint32Array(pieces.reduce((n,x)=>n+x.indices.length,0));const normals=new Float32Array(pieces.reduce((n,x)=>n+(x.normals?.length??0),0));const rayRanges:RayRange[]=[];let normalOffset=0;let p=0,u=0,c=0,k=0;
  for(const x of pieces){if(x.normals){normals.set(x.normals,normalOffset);normalOffset+=x.normals.length;}for(const r of x.rayRanges??[])rayRanges.push({...r,offset:r.offset+k});positions.set(x.positions,p);uvs.set(x.uvs,u);colors.set(x.colors,c);for(let i=0;i<x.indices.length;i++)indices[k+i]=x.indices[i]+p/3;p+=x.positions.length;u+=x.uvs.length;c+=x.colors.length;k+=x.indices.length;}
  merged.push({kind,positions,uvs,colors,indices,...(normals.length?{normals}:{}),...(rayRanges.length?{rayRanges}:{})});
 }
 return merged;
}
