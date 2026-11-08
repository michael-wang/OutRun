import * as THREE from 'three';
import {seededRandom} from './vendor/three-stylized/utils';
import {lawnWeight,meadowCover} from './coast-meadow-layout';
import {COAST_HILL_STRIPS} from './coast-terrain';
import {COAST_DRAIN_BRIDGES,COAST_DRAIN_X,coastDrainAt} from './coast-roadside-layout';
import {COAST_VILLAGE_SITES} from './coast-village-layout';
import {FARM_HOMES} from './coast-farm-layout';
import {COAST_RURAL_HOUSES} from './coast-rural-layout';
import {townStreetAt} from './coast-town-access';
import {coastBeachHeight} from './scenery-cross-section';
import {roadOffset,type Shoulders} from './road-profile';
import type {createTrack} from './track';

// A single opaque blade template per scenery chunk. Light tips above dark
// roots keep the grass readable against the meadow at chase-camera height.
function bladePatch(){
 const random=seededRandom(4521),positions:number[]=[],colors:number[]=[];
 const dark=new THREE.Color('#474e30'),green=new THREE.Color('#79834f'),gold=new THREE.Color('#acaa71');
 for(let fan=0;fan<22;fan++){
  const x=(random()-.5)*3.4,z=(random()-.5)*3.4,h=.30+random()*.39;
  const tip=green.clone().lerp(gold,random()*.74);
  for(let blade=0;blade<5;blade++){
   const angle=blade*2.4+random(),dx=Math.cos(angle),dz=Math.sin(angle);
   const reach=h*(.34+.53*random()),w=.035+.028*random();
   positions.push(x-dz*w,0,z+dx*w,x+dz*w,0,z-dx*w,x+dx*reach,h*(.73+.43*random()),z+dz*reach);
   colors.push(dark.r,dark.g,dark.b,dark.r,dark.g,dark.b,tip.r,tip.g,tip.b);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 return g;
}

const lots=[...COAST_VILLAGE_SITES,...FARM_HOMES,...COAST_RURAL_HOUSES].filter(s=>s.x<48);
const strips=COAST_HILL_STRIPS.filter(x=>x<=36);

export function addVergeGrass(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],
 halfAt:(d:number)=>number,shoulders:((d:number)=>Shoulders)|undefined,start:number,end:number){
 const batches=new Map<number,THREE.Matrix4[]>(),dummy=new THREE.Object3D();
 const nearbyLots=lots.filter(s=>s.d>start-16&&s.d<end+16);
 const rows=Math.ceil((end-start)/5),step=(end-start)/rows;
 function station(d:number){
  const p=sample(d),half=halfAt(d),widths=shoulders?.(d);
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
  for(let col=1;col<strips.length;col++){
   const a=prev[col-1],b=prev[col],c=next[col-1],e=next[col];
   const rand=seededRandom(Math.floor(d*17)*431+col);
   const count=Math.floor((b.x-a.x)*step/8+rand());
   for(let i=0;i<count;i++){
    const t=rand(),u=rand(),at=d+t*step,second=t+u>1;
    const origin=second?e:a,wb=second?1-t:u,wc=second?1-u:t,wo=1-wb-wc;
    const x=wo*origin.x+wb*b.x+wc*c.x;
    if(x<16.2||x>32||meadowCover(x,at)<.75)continue;
    if(townStreetAt(at,2.5)||COAST_DRAIN_BRIDGES.some(s=>Math.abs(at-s.d)<s.width*.5+2.5))continue;
    if(nearbyLots.some(s=>Math.abs(s.d-at)<13&&Math.abs(s.x-x)<12))continue;
    const lawn=lawnWeight(x,at),wild=1-lawn;
    dummy.position.copy(origin.v).multiplyScalar(wo).addScaledVector(b.v,wb).addScaledVector(c.v,wc);
    dummy.position.y-=.035;
    dummy.rotation.y=rand()*Math.PI*2;
    const spread=Math.min(1,(x-COAST_DRAIN_X.outerLand)/3);
    dummy.scale.set(spread,.35+wild*(.42+rand()*.58),spread);
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
   mesh.userData.nature={verge:true,center,near:0,far:245};
   mesh.userData.noShadowGround=true;
   scene.add(mesh);instances+=matrices.length;
  }
 }
 return {instances,draws:batches.size};
}
