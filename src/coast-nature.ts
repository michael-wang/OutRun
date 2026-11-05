import * as THREE from 'three';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {farmClearing} from './coast-farm-layout';
import {coastWildness,COAST_HILL_STRIPS} from './coast-terrain';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,shoulderProfile} from './road-profile';
import type {createTrack} from './track';

export interface NatureBatch {texture?:string;alpha?:boolean;center:number;near:number;far:number}
type GeometryData={position:number[];normal:number[];uv:number[];color?:number[]};
type Model={parts:(GeometryData&{texture?:string;alpha?:boolean})[];far?:GeometryData};
let assets:Record<string,Model>|undefined,loading:Promise<void>|undefined;
export function loadCoastNature(){
 return loading??=fetch(`${import.meta.env.BASE_URL}assets/coast-nature/models.json`).then(async r=>{
  if(!r.ok)throw Error(`Coast nature download failed: ${r.status}`);
  assets=await r.json();
 }).catch(e=>{loading=undefined;throw e;});
}
const random=(n:number)=>{const x=Math.sin(n*127.1+804)*43758.5453;return x-Math.floor(x);};
/** Intersect the same two triangles as the terrain ribbons. Analytic noise
 * alone can leave roots floating between coarse cross-slope stations. */
export function coastNatureGround(sample:ReturnType<typeof createTrack>['sample'],d:number,x:number,start:number,end:number){
 const p=sample(d),target=p.position.clone().addScaledVector(p.right,x);
 const physical=(raw:number,at:number)=>roadOffset(raw,7,shoulderProfile(at,804));
 const col=Math.max(1,COAST_HILL_STRIPS.findIndex(raw=>physical(raw,d)>=x));
 for(let i=Math.max(1,col-1);i<=Math.min(COAST_HILL_STRIPS.length-1,col+1);i++){
  const a=COAST_HILL_STRIPS[i-1],b=COAST_HILL_STRIPS[i],step=(end-start)/Math.ceil((end-start)/(b<140?5:20)),from=start+Math.floor((d-start)/step)*step;
  const vertex=(at:number,raw:number)=>{const q=sample(at),offset=physical(raw,at),v=q.position.clone().addScaledVector(q.right,offset);v.y=coastBeachHeight(offset,q.position.y,q.right.y,at);return v;};
  for(const row of [from,from-step,from+step]){
   const v=[vertex(row,a),vertex(row,b),vertex(row+step,a),vertex(row+step,b)];
   for(const [ia,ib,ic] of [[0,1,2],[1,3,2]]){
    const A=v[ia],B=v[ib],C=v[ic],den=(B.z-C.z)*(A.x-C.x)+(C.x-B.x)*(A.z-C.z);
    const u=((B.z-C.z)*(target.x-C.x)+(C.x-B.x)*(target.z-C.z))/den;
    const w=((C.z-A.z)*(target.x-C.x)+(A.x-C.x)*(target.z-C.z))/den,t=1-u-w;
    if(u>=-.0001&&w>=-.0001&&t>=-.0001)return u*A.y+w*B.y+t*C.y;
   }
  }
 }
 return coastBeachHeight(x,p.position.y,p.right.y,d);
}
const geometry=(data:GeometryData)=>{
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(data.position,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(data.normal,3));
 if(data.uv.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));
 if(data.color?.length)g.setAttribute('color',new THREE.Float32BufferAttribute(data.color,3));
 return g;
};
/** Fixed 200m batches with shared source meshes/materials. Placement and LOD
 * never depend on worker request order. The streamer culls whole batches. */
export function addCoastNature(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],start:number,end:number){
 if(!assets)throw Error('Coast nature must load before scenery preparation');
 const buckets=new Map<string,{g:THREE.BufferGeometry;m:THREE.MeshStandardMaterial;matrices:THREE.Matrix4[];nature:NatureBatch;shadowGroup:'rocks'|'vegetation'}>();
 const geometries=new Map<string,THREE.BufferGeometry>(),materials=new Map<string,THREE.MeshStandardMaterial>(),dummy=new THREE.Object3D();
 function plant(name:string,d:number,x:number,height:number,key:number,far:number){
  if(farmClearing(d,x))return;
  const p=sample(d),model=assets![name];
  dummy.position.copy(p.position).addScaledVector(p.right,x);
  dummy.position.y=coastNatureGround(sample,d,x,start,end)-.06;
  dummy.rotation.set(0,random(key+32)*Math.PI*2,0);dummy.scale.set(height*(.82+random(key+7)*.3),height,height*(.82+random(key+7)*.3));dummy.updateMatrix();
  const center=Math.floor(d/200)*200+100;
  for(const [i,data] of [...model.parts,...(model.far?[model.far]:[])].entries()){
   const isFar=i===model.parts.length,part=data as Model['parts'][number],id=name+':'+i;
   let g=geometries.get(id);if(!g){g=geometry(data);geometries.set(id,g);}
   const matKey=isFar?'far':part.texture??'plain';let m=materials.get(matKey);
   if(!m){m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:!!data.color?.length});materials.set(matKey,m);}
   const bucketKey=id+':'+center;
   let bucket=buckets.get(bucketKey);
   if(!bucket){bucket={g,m,matrices:[],nature:{texture:part.texture,alpha:part.alpha,center,near:isFar?600:0,far:isFar?1800:far},shadowGroup:name.startsWith('Rock_')?'rocks':'vegetation'};buckets.set(bucketKey,bucket);}
   bucket.matrices.push(dummy.matrix.clone());
  }
 }
 // Irregular multi-layer groves. Low grass at the verge, shrubs at the foot,
 // different-sized broadleaf and pine crowns on the rising slope behind them.
 for(let i=Math.ceil(start/22);i*22<end;i++){
  const d=i*22;if(coastWildness(d)<.3)continue;
  for(let j=0;j<3;j++){
   const key=i*37+j*131,at=d+random(key)*18;
   if(at>=end||coastWildness(at)<.3)continue;
   const x=j<2?28+random(key+9)*47:150+random(key+9)*155,choice=random(key+13);
   if(random(key+18)>.18)plant(choice<.12?'CommonTree_1':choice<.72?'CommonTree_3':'Pine_5',at,x,(j<2?5:7)+random(key+2)*6,key,600);
  }
  for(let j=0;j<3;j++){
   const key=i*43+j*193,at=d+random(key+6)*18;
   if(at>=end||coastWildness(at)<.3)continue;
   plant('Bush_Common',at,j<2?20+random(key+11)*45:125+random(key+11)*100,1.5+random(key+3)*2.5,key,420);
   plant('Grass_Common_Short',at,18+random(key+15)*20,.5+random(key+21)*.65,key+1,260);
  }
  if(i%3===0)plant('Rock_Medium_2',d,23+random(i+19)*53,1+random(i+24)*2.2,i,650);
 }
 for(const b of buckets.values()){
  const mesh=new THREE.InstancedMesh(b.g,b.m,b.matrices.length);
  b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.userData.nature=b.nature;
  mesh.name='coast-nature';mesh.userData.coastShadowGroup=b.shadowGroup;markCoastShadowCaster(mesh,'static',b.shadowGroup);mesh.receiveShadow=false;scene.add(mesh);
 }
 return {instances:[...buckets.values()].reduce((n,b)=>n+b.matrices.length,0),draws:buckets.size};
}
