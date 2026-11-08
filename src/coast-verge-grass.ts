import * as THREE from 'three';
import {seededRandom} from './vendor/three-stylized/utils';
import {lawnWeight,meadowCover} from './coast-meadow-layout';
import {COAST_HILL_STRIPS} from './coast-terrain';
import {COAST_DRAIN_BRIDGES,COAST_DRAIN_X,coastDrainAt} from './coast-roadside-layout';
import {COAST_VILLAGE_SITES} from './coast-village-layout';
import {FARM_HOMES} from './coast-farm-layout';
import {COAST_RURAL_HOUSES} from './coast-rural-layout';
import {townStreetAt,TOWN_BACK_LANE} from './coast-town-access';
import {COAST_DISTRICTS,coastDistrictAt} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,type Shoulders} from './road-profile';
import type {createTrack} from './track';

// A single opaque blade template per scenery chunk. Light tips above dark
// roots keep the grass readable against the meadow at chase-camera height.
function bladePatch(){
 const random=seededRandom(4521),positions:number[]=[],offsets:number[]=[],colors:number[]=[];
 const dark=new THREE.Color('#474e30'),green=new THREE.Color('#79834f'),gold=new THREE.Color('#acaa71');
 for(let fan=0;fan<22;fan++){
  const x=(random()-.5)*3.4,z=(random()-.5)*3.4,h=.30+random()*.39;
  const tip=green.clone().lerp(gold,random()*.74);
  for(let blade=0;blade<5;blade++){
   const angle=blade*2.4+random(),dx=Math.cos(angle),dz=Math.sin(angle);
   const reach=h*(.34+.53*random()),w=.035+.028*random();
   const height=h*(.73+.43*random());
   positions.push(x-dz*w,0,z+dx*w,x+dz*w,0,z-dx*w,x+dx*reach,height,z+dz*reach);
   // Unlit template: the normal channel carries displacement from each blade root.
   offsets.push(-dz*w,0,dx*w,dz*w,0,-dx*w,dx*reach,height,dz*reach);
   colors.push(dark.r,dark.g,dark.b,dark.r,dark.g,dark.b,tip.r,tip.g,tip.b);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(offsets,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 return g;
}

const lots=[
 ...COAST_VILLAGE_SITES.map(s=>({...s,radius:s.kind==='home'?9:s.kind==='waffle'?6:4.8})),
 ...COAST_VILLAGE_SITES.flatMap((s,i)=>s.kind!=='home'&&i%4===0?[{d:s.d+3,x:57,radius:13}]:[]),
 ...FARM_HOMES.map(s=>({...s,radius:14})),
 ...COAST_RURAL_HOUSES.map(s=>({...s,radius:s.kind==='courtyard'?20:12})),
];
const vergeStrips=COAST_HILL_STRIPS.filter(x=>x<=48);
const districtStrips=COAST_HILL_STRIPS.filter(x=>x<=180);

export function addVergeGrass(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],
 halfAt:(d:number)=>number,shoulders:((d:number)=>Shoulders)|undefined,start:number,end:number){
 const batches=new Map<number,THREE.Matrix4[]>(),dummy=new THREE.Object3D();
 const nearbyLots=lots.filter(s=>s.d>start-s.radius&&s.d<end+s.radius);
 const rows=Math.ceil((end-start)/5),step=(end-start)/rows;
 function station(d:number){
  const p=sample(d),half=halfAt(d),widths=shoulders?.(d);
  const inTown=COAST_DISTRICTS.some(s=>d>=s.start-55&&d<=s.end+55);
  const strips=inTown?districtStrips:vergeStrips;
  return strips.map(raw=>{
   const x=raw===13&&coastDrainAt(d)?COAST_DRAIN_X.outerLand:roadOffset(raw,half,widths);
   const v=p.position.clone().addScaledVector(p.right,x);
   v.y=coastBeachHeight(x,p.position.y,p.right.y,d);
   return {x,v};
  });
 }
 let prev=station(start);
 for(let row=0;row<rows;row++){
  const d=start+row*step,next=station(d+step);
  for(let col=1;col<Math.min(prev.length,next.length);col++){
   const a=prev[col-1],b=prev[col],c=next[col-1],e=next[col];
   const rand=seededRandom(Math.floor(d*17)*431+col);
   const spacing=a.x<32?8:a.x<75?16:36;
   const count=Math.floor((b.x-a.x)*step/spacing+rand());
   for(let i=0;i<count;i++){
    const t=rand(),u=rand(),at=d+t*step,second=t+u>1;
    const origin=second?e:a,wb=second?1-t:u,wc=second?1-u:t,wo=1-wb-wc;
    const x=wo*origin.x+wb*b.x+wc*c.x;
    const district=coastDistrictAt(at);
    if(x<16.2||meadowCover(x,at)<.75)continue;
    if(!district&&x>30+rand()*12){
     const gap=COAST_DISTRICTS.reduce((n,s)=>Math.min(n,Math.max(s.start-at,at-s.end)),Infinity);
     if(rand()<THREE.MathUtils.smoothstep(gap,0,48))continue;
    }
    const street=townStreetAt(at,2.8);
    if(street&&x<street.length+3)continue;
    if(district?.kind==='homes'&&Math.abs(x-TOWN_BACK_LANE.x)<TOWN_BACK_LANE.width*.5+3)continue;
    if(x<37&&COAST_DRAIN_BRIDGES.some(s=>Math.abs(at-s.d)<s.width*.5+2.5))continue;
    if(nearbyLots.some(s=>Math.abs(s.d-at)<s.radius&&Math.abs(s.x-x)<s.radius))continue;
    const lawn=lawnWeight(x,at),wild=1-lawn;
    dummy.position.copy(origin.v).multiplyScalar(wo).addScaledVector(b.v,wb).addScaledVector(c.v,wc);
    dummy.position.y-=.035;
    dummy.rotation.y=rand()*Math.PI*2;
    const spread=x>32?1.35:Math.min(1,(x-COAST_DRAIN_X.outerLand)/3);
    dummy.scale.set(spread,.47+wild*(.30+rand()*.58),spread);
    dummy.updateMatrix();
    const center=(Math.floor(at/80)+.5)*80;
    if(!batches.has(center))batches.set(center,[]);
    batches.get(center)!.push(dummy.matrix.clone());
   }
  }
  prev=next;
 }
 let instances=0;
 if(batches.size){
  const geometry=bladePatch(),material=new THREE.MeshStandardMaterial({vertexColors:true});
  for(const [center,matrices] of batches){
   const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
   matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
   mesh.userData.nature={verge:true,center,near:0,far:540};
   mesh.userData.noShadowGround=true;
   scene.add(mesh);instances+=matrices.length;
  }
 }
 return {instances,draws:batches.size};
}
