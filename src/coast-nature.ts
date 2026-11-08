import * as THREE from 'three';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {natureGeometry,roadsideTrees,TREE_DRAW_DISTANCE,type NaturePart} from './tree-models';
import {farmClearing,FARM_YARDS} from './coast-farm-layout';
import {coastWildness,COAST_HILL_STRIPS} from './coast-terrain';
import {coastVegetationDensity} from './coast-journey-layout';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,shoulderProfile} from './road-profile';
import type {createTrack} from './track';

export interface NatureBatch {texture?:string;leafCutout?:boolean;meadow?:'cover'|'detail';center:number;near:number;far:number}
type Model={parts:NaturePart[]};
let assets:Record<string,Model>|undefined,loading:Promise<void>|undefined;
export function loadCoastNature(){
 return loading??=Promise.all(['models.json','headland-grove.json'].map(async file=>{
  const response=await fetch(`${import.meta.env.BASE_URL}assets/coast-nature/${file}`);
  if(!response.ok)throw Error(`Coast nature download failed: ${file} (${response.status})`);
  return await response.json() as Record<string,Model>;
 })).then(([rocks,trees])=>{assets={...rocks,...trees,...roadsideTrees};})
 .catch(e=>{loading=undefined;throw e;});
}
const random=(n:number)=>{const x=Math.sin(n*127.1+804)*43758.5453;return x-Math.floor(x);};
const GROVE_START=2800,GROVE_END=3000;
const inGrove=(d:number)=>d>=GROVE_START&&d<GROVE_END;
export const COAST_HERO_TREE_SITES=[
 {d:1008,x:76,h:8.6},{d:1020,x:152,h:10.4},
 {d:1065,x:104,h:12.0},{d:1092,x:86,h:8.5},
 {d:1075,x:160,h:9.5},
] as const;
const authoredTrees=[
 ...COAST_HERO_TREE_SITES,
 {d:148,x:72,h:8.5},{d:460,x:267,h:11},{d:760,x:266,h:9.5},
 {d:1310,x:265,h:10.5},{d:1660,x:268,h:9},
 ...FARM_YARDS.map((site,i)=>({d:site.d+5,x:site.x+4.7,h:5.9+(i%3)*.85})),
 {d:391,x:53,h:6.8},{d:687,x:99,h:8.1},{d:4522,x:100,h:6.5},
 {d:7535,x:53,h:7.4},{d:8781,x:99,h:7.3},{d:9036,x:53,h:6.2},
];
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
/** Fixed 200m batches with shared source meshes/materials. Placement and LOD
 * never depend on worker request order. The streamer culls whole batches. */
export function addCoastNature(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],start:number,end:number){
 if(!assets)throw Error('Coast nature must load before scenery preparation');
 const buckets=new Map<string,{g:THREE.BufferGeometry;m:THREE.MeshStandardMaterial;matrices:THREE.Matrix4[];nature:NatureBatch;shadowGroup:'rocks'|'vegetation'}>();
 const geometries=new Map<string,THREE.BufferGeometry>(),materials=new Map<string,THREE.MeshStandardMaterial>(),dummy=new THREE.Object3D();
 function plant(name:string,d:number,x:number,height:number,key:number,far:number,authored=false){
  if(!authored&&farmClearing(d,x))return;
  const p=sample(d),model=assets![name];
  if(!model)throw Error('Missing coast nature model '+name);
  dummy.position.copy(p.position).addScaledVector(p.right,x);
  dummy.position.y=coastNatureGround(sample,d,x,start,end)-.06;
  dummy.rotation.set(0,random(key+32)*Math.PI*2,0);dummy.scale.set(height*(.82+random(key+7)*.3),height,height*(.82+random(key+7)*.3));dummy.updateMatrix();
  const center=Math.floor(d/200)*200+100;
  for(const [i,part] of model.parts.entries()){
   const id=name+':'+i;
   let g=geometries.get(id);if(!g){g=natureGeometry(part);geometries.set(id,g);}
   const matKey=part.texture??'plain';let m=materials.get(matKey);
   if(!m){m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:!!part.color?.length});materials.set(matKey,m);}
   const bucketKey=id+':'+center+':'+far;
   let bucket=buckets.get(bucketKey);
   if(!bucket){bucket={g,m,matrices:[],nature:{texture:part.texture,leafCutout:part.leafCutout,center,near:0,
     far},
    shadowGroup:name.startsWith('Rock_')?'rocks':'vegetation'};buckets.set(bucketKey,bucket);}
   bucket.matrices.push(dummy.matrix.clone());
  }
 }
 // Retain the detailed oak at authored foreground sites and a compact pine on distant slopes.
 for(const [i,tree] of authoredTrees.entries())
  if(tree.d>=start&&tree.d<end)
   plant(tree.x>200?'RoadPine':'GroveOak',tree.d,tree.x,tree.h,90000+i*97,TREE_DRAW_DISTANCE,true);
 // Five stands at unequal depths: open grass windows between the oak edge
 // and the taller pines tucked up against the hill. All fit one 200 m batch.
 if(start<GROVE_END&&end>GROVE_START){
  const stands=[[2828,48,9],[2860,94,8],[2908,41,10],[2940,127,8],[2973,61,9]];
  for(const [stand,[along,inland,count]] of stands.entries()){
   for(let j=0;j<count;j++){
    const key=8729+97*stand+13*j;
    const angle=j*2.4+random(key)*.55,radius=Math.sqrt((j+.4)/count);
    const d=along+radius*22*Math.cos(angle),x=inland+radius*23*Math.sin(angle);
    if(d<start||d>=end)continue;
    const pine=random(key+4)<(inland>75?.80:.32);
    plant(pine?'GrovePine':'GroveOak',d,x,(pine?11:7)+random(key+8)*6,key,TREE_DRAW_DISTANCE);
   }
  }
 }
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
    if(random(key+18)>.18&&!inGrove(at)){
     plant(j===2||random(key+61)<.22?'RoadPine':'RoadOak',at,x,(j<2?5:7)+random(key+2)*6,key,TREE_DRAW_DISTANCE);
     if(j<2)treeAnchors[j]={at,x};
    }
  }
  // Cluster younger trees around mature specimens.
  for(let j=0;j<3;j++){
   const key=i*43+j*193,tree=treeAnchors[j];
   const at=tree?Math.max(start,Math.min(end-.01,tree.at+(random(key+6)-.5)*7)):d+random(key+6)*18;
   if(at>=end||coastWildness(at)<.3)continue;
   const x=tree?tree.x+(random(key+11)-.5)*8
    :j<2?20+random(key+11)*45:125+random(key+11)*100;
   if(inGrove(at))plant('GroveOak',at,x,2.2+random(key+3)*2.1,key,TREE_DRAW_DISTANCE);
   else plant('RoadOak',at,x,1.5+random(key+3)*2.5,key,420);
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
