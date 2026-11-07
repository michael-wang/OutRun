import * as THREE from 'three';
import {meadowCover} from './coast-meadow-layout';
import {COAST_HILL_STRIPS} from './coast-terrain';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,type Shoulders} from './road-profile';
import {vnoise2} from './vendor/procedural-terrains/cpuNoise.js';
import {seededRandom} from './vendor/three-stylized/utils';
import type {createTrack} from './track';

/** A patch of rooted fans. Each ribbon tapers and bends away from its crown. */
type GrassLayer='cover'|'detail';
function grassPatch(layer:GrassLayer){
 const rand=seededRandom(64403),pos:number[]=[],offsets:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 const green=new THREE.Color('#576e40'),straw=new THREE.Color('#aba366');
 // A full patch has 168 blades. Most have a single tapered triangle;
 // a few longer arching leaves break up the nearby silhouette.
 for(let fan=0;fan<28;fan++){
  const cx=(rand()-.5)*5.6,cz=(rand()-.5)*5.6,stature=.48+rand()*.51;
  const tint=rand(),baseAngle=rand()*2*Math.PI;
  for(let blade=0;blade<6;blade++){
   const yaw=baseAngle+blade*2.4+rand()*.65,dx=Math.cos(yaw),dz=Math.sin(yaw);
   const h=stature*(.64+rand()*.57),reach=h*(.30+rand()*.54);
   const width=.029+rand()*.035,x=cx+(rand()-.5)*.15,z=cz+(rand()-.5)*.15;
   const color=green.clone().lerp(straw,.64*tint+.20*rand());
   const permanent=fan%3!==1&&blade===0;
   if(permanent!==(layer==='cover'))continue;
   const first=pos.length/3;
   const curved=blade===2&&fan%4===0;
   const ribbon=curved?[[0,-1],[0,1],[.57,-.67],[.57,.67],[1,0]]:[[0,-1],[0,1],[1,0]];
   for(const [t,side] of ribbon){
    const w=side*width*(permanent?2.4:1.24);
    pos.push(x+dx*reach*t*t-dz*w,h*t,z+dz*reach*t*t+dx*w);
    // Signed ribbon half-width in the template frame, carried by the normal
    // channel of the Worker mesh format. This unlit material does no lighting.
    offsets.push(-dz*w,0,dx*w);
    uv.push(side,t);const shade=.32+.68*t;
    colors.push(color.r*shade,color.g*shade,color.b*shade);
   }
   indices.push(first,first+1,first+2);
   if(curved)indices.push(first+1,first+3,first+2,first+2,first+3,first+4);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(offsets,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);return g;
}

/** Worker-side scatter on the same triangles and stations as the coast ground.
 * Sloped instances follow their supporting triangle, even around banked curves. */
export function addCoastMeadow(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],halfAt:(d:number)=>number,
 shoulders:((d:number)=>Shoulders)|undefined,start:number,end:number){
 if(end<=start)return {instances:0,draws:0};
 const station=(d:number,strips:readonly number[])=>{
  const p=sample(d),half=halfAt(d),widths=shoulders?.(d);
  return strips.map(raw=>{
   const x=roadOffset(raw,half,widths),v=p.position.clone().addScaledVector(p.right,x);
   v.y=coastBeachHeight(x,p.position.y,p.right.y,d);
   return {x,v};
  });
 };
 const layers={cover:new Map<number,THREE.Matrix4[]>(),detail:new Map<number,THREE.Matrix4[]>()};
 const up=new THREE.Vector3(0,1,0);
 const dummy=new THREE.Object3D(),spin=new THREE.Quaternion(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),normal=new THREE.Vector3();
 function plant(layer:GrassLayer,at:number){
  const size=layer==='cover'?200:100,center=(Math.floor(at/size)+.5)*size;
  let batch=layers[layer].get(center);
  if(!batch){batch=[];layers[layer].set(center,batch);}
  batch.push(dummy.matrix.clone());
 }
 function scatter(strips:readonly number[],rowStep:number){
  const rows=Math.ceil((end-start)/rowStep),step=(end-start)/rows;
  let prev=station(start,strips);
  for(let row=0;row<rows;row++){
   const d=start+row*step,next=station(d+step,strips);
   for(let col=0;col+1<strips.length;col++){
    const a=prev[col],b=prev[col+1],c=next[col],e=next[col+1];
    const rand=seededRandom(Math.floor(d*11)*113+col*307);
    const area=(b.x-a.x)*step,spacing=a.x<60?14:a.x<104?23:70+.35*(a.x-104);
    const count=Math.floor(area/spacing+rand());
    for(let i=0;i<count;i++){
     const u=rand(),t=rand(),at=d+t*step,x=a.x+(b.x-a.x)*u+(c.x-a.x)*t;
     const cover=meadowCover(x,at);
     if(!cover||x<18.6)continue;
     const stand=vnoise2(x/11,at/18),salt=rand();
     if(salt>cover*(.44+.55*stand))continue;
     const second=u+t>1,origin=second?e.v:a.v;
     ab.subVectors(b.v,origin);ac.subVectors(c.v,origin);
     dummy.position.copy(origin).addScaledVector(ab,second?1-t:u).addScaledVector(ac,second?1-u:t);
     normal.crossVectors(ab,ac).normalize();
     if(normal.y<0)normal.negate();
     dummy.position.y-=.045;
     dummy.quaternion.setFromUnitVectors(up,normal).multiply(spin.setFromAxisAngle(up,rand()*Math.PI*2));
     const spread=(.88+rand()*.30)*(a.x>=104?2.1:1);
     dummy.scale.set(spread,(.36+stand*.94+rand()*.32)*Math.min(1,(x-15)/9),spread);
     dummy.updateMatrix();
     plant('cover',at);
     if(x<88)plant('detail',at);
    }
   }
   prev=next;
  }
 }
 // Follow the exact road terrain tessellation on either side of the 125 m strip.
 scatter(COAST_HILL_STRIPS.filter(x=>x>=18&&x<=125),5);
 scatter(COAST_HILL_STRIPS.filter(x=>x>=125),20);
 let instances=0,draws=0;
 for(const layer of ['cover','detail'] as const){
  if(!layers[layer].size)continue;
  const g=grassPatch(layer),m=new THREE.MeshStandardMaterial({vertexColors:true});
  for(const [center,matrices] of layers[layer]){
   const mesh=new THREE.InstancedMesh(g,m,matrices.length);
   matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
   mesh.userData.nature={meadow:layer,center,near:0,far:layer==='cover'?1200:225};
   scene.add(mesh);instances+=matrices.length;draws++;
  }
 }
 return {instances,draws};
}
