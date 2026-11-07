import * as THREE from 'three';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {farmClearing} from './coast-farm-layout';
import {coastWildness,COAST_HILL_STRIPS} from './coast-terrain';
import {coastVegetationDensity} from './coast-journey-layout';
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
export const COAST_TREE_MODEL='CommonTree_3';
/** No distant flat/billboard replacement for the approved broadleaf tree. */
export const COAST_TREE_DRAW_DISTANCE=1450;
export const COAST_HERO_TREE_SITES=[
 {d:1008,x:76,h:8.6},{d:1020,x:152,h:10.4},
 {d:1065,x:104,h:12.0},{d:1092,x:86,h:8.5},
 {d:1075,x:160,h:9.5},
] as const;
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
 function plant(name:string,d:number,x:number,height:number,key:number,far:number,authored=false){
  if(!authored&&farmClearing(d,x))return;
  const p=sample(d),model=assets![name];
  dummy.position.copy(p.position).addScaledVector(p.right,x);
  dummy.position.y=coastNatureGround(sample,d,x,start,end)-.06;
  dummy.rotation.set(0,random(key+32)*Math.PI*2,0);dummy.scale.set(height*(.82+random(key+7)*.3),height,height*(.82+random(key+7)*.3));dummy.updateMatrix();
  const center=Math.floor(d/200)*200+100;
  const parts=name===COAST_TREE_MODEL?model.parts:[...model.parts,...(model.far?[model.far]:[])];
  for(const [i,data] of parts.entries()){
   const isFar=i===model.parts.length,part=data as Model['parts'][number],id=name+':'+i;
   let g=geometries.get(id);if(!g){g=geometry(data);geometries.set(id,g);}
   const matKey=isFar?'far':part.texture??'plain';let m=materials.get(matKey);
   if(!m){m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:!!data.color?.length});materials.set(matKey,m);}
   const bucketKey=id+':'+center;
   let bucket=buckets.get(bucketKey);
   if(!bucket){bucket={g,m,matrices:[],nature:{texture:part.texture,alpha:part.alpha,center,near:isFar?600:0,
     far:name===COAST_TREE_MODEL?COAST_TREE_DRAW_DISTANCE:isFar?1800:far},
    shadowGroup:name.startsWith('Rock_')?'rocks':'vegetation'};buckets.set(bucketKey,bucket);}
   bucket.matrices.push(dummy.matrix.clone());
  }
 }
 // Farmhouse grove uses exactly the same 3D broadleaf as the distant hillside.
 for(const [i,tree] of COAST_HERO_TREE_SITES.entries())
  if(tree.d>=start&&tree.d<end)
   plant(COAST_TREE_MODEL,tree.d,tree.x,tree.h,90000+i*97,600,true);
 // Trees/shrubs remain; individual grassy tufts are unapproved and removed.
 for(let i=Math.ceil(start/22);i*22<end;i++){
  const d=i*22;
  // Chapter II is an intentionally sparse headland behind the tourist
  // beach. Keep authored trees at the farm/courtyard and late fishing coast.
  if(coastWildness(d)<.3||random(i*67+231)>coastVegetationDensity(d))continue;
  const treeAnchors:({at:number;x:number}|undefined)[]=[];
  for(let j=0;j<3;j++){
   const key=i*37+j*131,at=d+random(key)*18;
   if(at>=end||coastWildness(at)<.3)continue;
   const x=j<2?28+random(key+9)*47:150+random(key+9)*155;
   // Share the full, layered broadleaf canopy used in the admired
    // countryside scene. Keep the needle-like pines only on remote hills.
    if(random(key+18)>.18){
     plant(COAST_TREE_MODEL,at,x,(j<2?5:7)+random(key+2)*6,key,600);
     if(j<2)treeAnchors[j]={at,x};
    }
  }
  // Reuse the EXISTING bush/grass instance count, just cluster them around
  // the broadleaf trees rather than isolating thin trees on bare ground.
  for(let j=0;j<3;j++){
   const key=i*43+j*193,tree=treeAnchors[j];
   const at=tree?Math.max(start,Math.min(end-.01,tree.at+(random(key+6)-.5)*7)):d+random(key+6)*18;
   if(at>=end||coastWildness(at)<.3)continue;
   const x=tree?tree.x+(random(key+11)-.5)*8
    :j<2?20+random(key+11)*45:125+random(key+11)*100;
   plant('Bush_Common',at,x,1.5+random(key+3)*2.5,key,420);
  }
  if(i%3===0)plant('Rock_Medium_2',d,23+random(i+19)*53,1+random(i+24)*2.2,i,650);
 }
 for(const b of buckets.values()){
  const mesh=new THREE.InstancedMesh(b.g,b.m,b.matrices.length);
  b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.userData.nature=b.nature;
  mesh.name='coast-nature';mesh.userData.coastShadowGroup=b.shadowGroup;
  markCoastShadowCaster(mesh,'static',b.shadowGroup);
  mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);
 }
 return {instances:[...buckets.values()].reduce((n,b)=>n+b.matrices.length,0),draws:buckets.size};
}
