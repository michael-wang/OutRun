import * as THREE from 'three';
import type {createTrack} from './track';import type {RoadMeshData} from './road-chunk';import {shoulderProfile,type Shoulders} from './road-profile';
type Sample=ReturnType<typeof createTrack>['sample'];
export const BRIDGE_SHOULDER=2.2;
export const bridgeRailEdge=(half:number)=>half+BRIDGE_SHOULDER-.26-.125;
export interface BridgeSpan {start:number;end:number;water:number}
/** First long coastal run with modest grade/bank and unchanged four-lane width. */
export function bridgeSpan(sample:Sample,half:(d:number)=>number,weights:(d:number)=>number[],length:number):BridgeSpan|undefined {
 for(const relaxed of [false,true])for(let start=3000;start<length-1800;start+=100){let safe=true;for(let d=start-100;d<=start+1000;d+=50){const p=sample(d);if(weights(d)[0]<.8||half(d)!==7||p.position.y<30||Math.abs(p.tangent.y)>(relaxed?.18:.09)||Math.abs(p.curvature)>(relaxed?.0025:.002)||Math.abs(Math.atan(p.right.y))>(relaxed?.25:.15)){safe=false;break;}}if(safe)return {start,end:start+900,water:-10};}
}
export const onBridge=(d:number,b?:BridgeSpan)=>!!b&&d>=b.start&&d<=b.end;
const ease=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10);};
export function bridgeShoulders(d:number,seed:number,b?:BridgeSpan):Shoulders {const p=shoulderProfile(d,seed),blend=b?ease(Math.min(d-b.start+220,b.end+220-d)/220):0;return {left:p.left+(BRIDGE_SHOULDER-p.left)*blend,right:p.right+(BRIDGE_SHOULDER-p.right)*blend};}
/** Worker-built beams: a few merged material buffers, no scene objects per beam. */
export function bridgeMeshes(sample:Sample,half:(d:number)=>number,b:BridgeSpan,start:number,end:number):RoadMeshData[]{
 const out:RoadMeshData[]=[],positions:number[]=[],indices:number[]=[],box=new THREE.BoxGeometry(1,1,1),attr=box.getAttribute('position'),idx=box.index!,matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 const point=(d:number,x:number,y:number)=>{const p=sample(d);return p.position.clone().addScaledVector(p.right,x).add(new THREE.Vector3(0,y,0));};
 const beam=(a:THREE.Vector3,c:THREE.Vector3,width:number,depth=width)=>{const delta=c.clone().sub(a),len=delta.length();q.setFromUnitVectors(up,delta.normalize());matrix.compose(a.clone().add(c).multiplyScalar(.5),q,new THREE.Vector3(width,len,depth));const base=positions.length/3;for(let i=0;i<attr.count;i++){const v=new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);}for(let i=0;i<idx.count;i++)indices.push(base+idx.getX(i));};
 const a=Math.max(start,b.start),z=Math.min(end,b.end);
 if(z>a){
  // Continuous edge girders and under-deck cross-bracing follow the actual bank.
  for(let d=a;d<z;d+=10){const e=Math.min(z,d+10);for(const side of [-1,1]){beam(point(d,side*(half(d)+BRIDGE_SHOULDER),-.65),point(e,side*(half(e)+BRIDGE_SHOULDER),-.65),.55,1.25);beam(point(d,side*(bridgeRailEdge(half(d))+.125),1.05),point(e,side*(bridgeRailEdge(half(e))+.125),1.05),.25,.25);}}
  for(let d=Math.ceil(a/20)*20;d<z;d+=20){beam(point(d,-9.2,-1),point(d,9.2,-1),.65);for(const side of [-1,1])beam(point(d,side*8.94,-.1),point(d,side*8.94,1.15),.18);}
  const towers=[b.start+140,b.end-140],height=(d:number)=>{if(d<towers[0])return 4+31*(d-b.start)/140;if(d>towers[1])return 4+31*(b.end-d)/140;const t=(d-towers[0])/(towers[1]-towers[0]);return 9+26*(2*t-1)**2;};
  for(let d=a;d<z;d+=8){const e=Math.min(z,d+8);for(const side of [-1,1])beam(point(d,side*10,height(d)),point(e,side*10,height(e)),.42);}
  for(let d=b.start+Math.ceil((a-b.start)/24)*24;d<z;d+=24)for(const side of [-1,1])beam(point(d,side*10,-.65),point(d,side*10,height(d)),.15);
  for(const d of towers)if(d>=start&&d<end){for(const side of [-1,1]){const top=point(d,side*10,38),foot=top.clone();foot.y=b.water-4;beam(foot,top,1.8,2.8);}for(const h of [28,36])beam(point(d,-10,h),point(d,10,h),1.6);beam(point(d,-10,28),point(d,10,36),.6);beam(point(d,10,28),point(d,-10,36),.6);}
  out.push({kind:'steel',positions:new Float32Array(positions),indices:new Uint32Array(indices),uvs:new Float32Array(),colors:new Float32Array()});
  // An actual deck underside, not terrain extruded down to sea level.
  const deck:number[]=[],di:number[]=[];for(let d=a;d<=z;d=Math.min(z,d+2.5)){const base=deck.length/3;for(const side of [-1,1]){const v=point(d,side*(half(d)+BRIDGE_SHOULDER),-1.2);deck.push(v.x,v.y,v.z);}if(base)di.push(base-2,base,base-1,base-1,base,base+1);if(d===z)break;}
  out.push({kind:'deck',positions:new Float32Array(deck),indices:new Uint32Array(di),uvs:new Float32Array(),colors:new Float32Array()});
 }
 // Water remains well below the deck and joins the cut-out coast approaches.
 const wa=Math.max(start,b.start-200),wz=Math.min(end,b.end+200);if(wz>wa){const p:number[]=[],ix:number[]=[];for(let d=wa;d<=wz;d=Math.min(wz,d+20)){const base=p.length/3;for(const side of [-1,1]){const v=point(d,side*550,0);p.push(v.x,b.water,v.z);}if(base)ix.push(base-2,base-1,base,base-1,base+1,base);if(d===wz)break;}out.push({kind:'water',positions:new Float32Array(p),indices:new Uint32Array(ix),uvs:new Float32Array(),colors:new Float32Array()});}
 box.dispose();return out;
}
