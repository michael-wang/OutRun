import * as THREE from 'three';
import {COAST_MEADOWS,meadowCover} from './coast-meadow-layout';
import {COAST_HILL_STRIPS} from './coast-terrain';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,type Shoulders} from './road-profile';
import {vnoise2} from './vendor/procedural-terrains/cpuNoise.js';
import {seededRandom} from './vendor/three-stylized/utils';
import type {createTrack} from './track';

/** A patch of rooted fans. Each ribbon tapers and bends away from its crown. */
function grassPatch(){
 const rand=seededRandom(64403),pos:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 const green=new THREE.Color('#576e40'),straw=new THREE.Color('#aba366');
 for(let fan=0;fan<21;fan++){
  const cx=(rand()-.5)*4.6,cz=(rand()-.5)*4.6,stature=.48+rand()*.51;
  const tint=rand(),baseAngle=rand()*2*Math.PI;
  for(let blade=0;blade<5;blade++){
   const yaw=baseAngle+blade*2.4+rand()*.65,dx=Math.cos(yaw),dz=Math.sin(yaw);
   const h=stature*(.64+rand()*.57),reach=h*(.30+rand()*.54);
   const width=.029+rand()*.035,x=cx+(rand()-.5)*.15,z=cz+(rand()-.5)*.15;
   const color=green.clone().lerp(straw,.64*tint+.20*rand());
   const first=pos.length/3;
   for(const [t,side] of [[0,-1],[0,1],[.57,-.67],[.57,.67],[1,0]]){
    pos.push(x+dx*reach*t*t-dz*side*width,h*t,z+dz*reach*t*t+dx*side*width);
    uv.push(side,t);const shade=.32+.68*t;
    colors.push(color.r*shade,color.g*shade,color.b*shade);
   }
   indices.push(first,first+1,first+2,first+1,first+3,first+2,first+2,first+3,first+4);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);return g;
}

/** Worker-side scatter on the same triangles and stations as the coast ground.
 * Sloped instances follow their supporting triangle, even around banked curves. */
export function addCoastMeadow(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],halfAt:(d:number)=>number,
 shoulders:((d:number)=>Shoulders)|undefined,start:number,end:number){
 if(!COAST_MEADOWS.some(([a,b])=>start<b&&end>a))return {instances:0,draws:0};
 const strips=COAST_HILL_STRIPS.filter(x=>x>=18&&x<=104);
 const station=(d:number)=>{
  const p=sample(d),half=halfAt(d),widths=shoulders?.(d);
  return strips.map(raw=>{
   const x=roadOffset(raw,half,widths),v=p.position.clone().addScaledVector(p.right,x);
   v.y=coastBeachHeight(x,p.position.y,p.right.y,d);
   return {x,v};
  });
 };
 const batches=new Map<number,THREE.Matrix4[]>(),up=new THREE.Vector3(0,1,0);
 const dummy=new THREE.Object3D(),spin=new THREE.Quaternion(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),normal=new THREE.Vector3();
 const rows=Math.ceil((end-start)/5),step=(end-start)/rows;
 let prev=station(start);
 for(let row=0;row<rows;row++){
  const d=start+row*step,next=station(d+step);
  for(let col=0;col+1<strips.length;col++){
   const a=prev[col],b=prev[col+1],c=next[col],e=next[col+1];
   const rand=seededRandom(Math.floor(d*11)*113+col*307);
   const area=(b.x-a.x)*step,spacing=a.x<60?14:23;
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
    const spread=.88+rand()*.30;
    dummy.scale.set(spread,(.36+stand*.94+rand()*.32)*Math.min(1,(x-15)/9),spread);
    dummy.updateMatrix();
    const center=Math.floor(at/100)*100+50;
    let batch=batches.get(center);if(!batch){batch=[];batches.set(center,batch);}
    batch.push(dummy.matrix.clone());
   }
  }
  prev=next;
 }
 if(!batches.size)return {instances:0,draws:0};
 const g=grassPatch(),m=new THREE.MeshStandardMaterial({vertexColors:true});
 let instances=0;
 for(const [center,matrices] of batches){
  const mesh=new THREE.InstancedMesh(g,m,matrices.length);
  matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
  mesh.userData.nature={meadow:true,center,near:0,far:245};
  scene.add(mesh);instances+=matrices.length;
 }
 return {instances,draws:batches.size};
}
