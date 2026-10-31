import * as THREE from 'three';
import type {DrivingState} from './handling';
import type {createTrack} from './track';
import {trafficRandom} from './traffic-lanes';
import type {RockySection} from './rocky-shoulder';

type Sample=ReturnType<typeof createTrack>['sample'];

/** Individual, irregular stone obstacles. Geometry and collision use this one recipe. */
export interface RockBoulder {
 id:number;
 distance:number;
 lateral:number;
 side:-1|1;
 radiusX:number;
 radiusD:number;
 height:number;
 seed:number;
}

export function boulderLayout(sections:readonly RockySection[],halfAt:(d:number)=>number):RockBoulder[]{
 const result:RockBoulder[]=[];
 for(const [sectionIndex,s] of sections.entries()){
  if(!s.r7)continue;
  const count=3+Math.floor(trafficRandom(s.seed,31)*3);
  const step=(s.end-s.start)/count;
  for(let i=0;i<count;i++){
   const drift=(trafficRandom(s.seed,100+i)-.5)*.55;
   const distance=s.start+step*(i+.5+drift);
   const radiusX=2.8+trafficRandom(s.seed,200+i)*2.4;
   const radiusD=9+trafficRandom(s.seed,300+i)*13;
   const nearEdge=.15+trafficRandom(s.seed,400+i)*2.1;
   const height=10+trafficRandom(s.seed,500+i)*18;
   const side=s.side<0?-1:1;
   result.push({
    id:sectionIndex*16+i,
    distance,side,
    lateral:side*(halfAt(distance)+nearEdge+radiusX),
    radiusX,radiusD,height,seed:s.seed*47+i*997,
   });
  }
 }
 return result;
}

/** Optional expanded navigable corridor only within an outcrop site.
 * The ordinary asphalt width and off-road penalties stay unchanged.
 * It eases in/out to avoid a sudden invisible snap at section boundaries. */
export function boulderCorridorExtra(distance:number,sections:readonly RockySection[]):number{
 let maximum=0;
 for(const s of sections){
  if(!s.r7||distance<s.start-90||distance>s.end+90)continue;
  const t=Math.min(1,(distance-(s.start-90))/90,((s.end+90)-distance)/90);
  const eased=Math.max(0,t)*(2-Math.max(0,t));
  maximum=Math.max(maximum,10.5*eased);
 }
 return maximum;
}

/** Single merged numeric road mesh per chunk; each boulder is separate in space.
 * Meshes deliberately overlap the shoulder unevenly without changing asphalt. */
export function boulderMesh(sample:Sample,boulders:readonly RockBoulder[],start:number,end:number){
 const active=boulders.filter(b=>b.distance>=start&&b.distance<end);
 if(!active.length)return;
 const unit=new THREE.IcosahedronGeometry(1,1);
 const attr=unit.getAttribute('position');
 const positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[];
 const palette=['#9d7857','#b7956b','#d0ae7e','#876447','#ad8b64','#c5a47a'];
 const tint=new THREE.Color();
 for(const b of active){
  const p=sample(b.distance),origin=p.position.clone().addScaledVector(p.right,b.lateral);
  // A little burying makes each rock look embedded in the terrain.
  origin.y+=b.height*.48-.6;
  const angle=trafficRandom(b.seed,7)*Math.PI*2;
  const c=Math.cos(angle),sn=Math.sin(angle);
  const startVertex=positions.length/3;
  for(let i=0;i<attr.count;i++){
   const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
   const localX=x*c-z*sn,localZ=x*sn+z*c;
   const irregular=1+.10*Math.sin(x*8+b.seed*.03+y*7)+.09*Math.cos(z*11-b.seed*.02);
   const dx=localX*b.radiusX*irregular,dz=localZ*b.radiusD*irregular;
   const point=origin.clone().addScaledVector(p.right,dx).addScaledVector(p.tangent,dz);
   point.y+=y*b.height*.52*irregular;
   positions.push(point.x,point.y,point.z);
   uvs.push(i%3===0?0:i%3===1?1:.5,y*.5+.5);
   const face=Math.floor(i/3);
   tint.set(palette[Math.floor(trafficRandom(b.seed,face*13)%1*palette.length)]);
   if(y<-.3)tint.lerp(new THREE.Color('#647451'),.22);
   colors.push(tint.r,tint.g,tint.b);
   indices.push(startVertex+i);
  }
 }
 unit.dispose();
 return {kind:'grass' as const,positions:new Float32Array(positions),uvs:new Float32Array(uvs),colors:new Float32Array(colors),indices:new Uint32Array(indices)};
}

interface Contact {
 boulder:RockBoulder;
 entry:number;
 nx:number;
 nz:number;
}

/** Swept ellipse in road-space (lateral, distance): catches high-speed impacts
 * without triangle-mesh physics. Distinct rock IDs have distinct normals. */
export class BoulderContact {
 impacts=0;yaw=0;roll=0;
 private push=0;
 private touchingId:number|undefined;
 constructor(private boulders:readonly RockBoulder[],private halfWidth:number,private halfLength:number,private ready:(d:number)=>boolean=()=>true){}
 reset(){this.impacts=this.yaw=this.roll=this.push=0;this.touchingId=undefined;}

 update(s:DrivingState,previous:{distance:number;lateral:number},dt:number){
  const decay=Math.exp(-dt/.20);
  this.yaw*=decay;this.roll*=decay;
  s.lateral+=this.push*dt;this.push*=decay;
  let nearest:Contact|undefined;
  for(const b of this.boulders){
   const rx=b.radiusX*.96+this.halfWidth,rz=b.radiusD*.94+this.halfLength;
   if(Math.max(previous.distance,s.distance)<b.distance-rz-1||Math.min(previous.distance,s.distance)>b.distance+rz+1)continue;
   if(!this.ready(b.distance))continue;
   const x0=(previous.lateral-b.lateral)/rx,z0=(previous.distance-b.distance)/rz;
   const x1=(s.lateral-b.lateral)/rx,z1=(s.distance-b.distance)/rz;
   const dx=x1-x0,dz=z1-z0;
   const a=dx*dx+dz*dz,c=x0*x0+z0*z0-1;
   let entry=-1;
   if(c<=0)entry=0;
   else if(a>1e-9){
    const beta=2*(x0*dx+z0*dz),disc=beta*beta-4*a*c;
    if(disc>=0){const t=(-beta-Math.sqrt(disc))/(2*a);if(t>=0&&t<=1)entry=t;}
   }
   if(entry<0)continue;
   const lx=x0+dx*entry,lz=z0+dz*entry;
   let nx=lx/rx,nz=lz/rz;
   const mag=Math.hypot(nx,nz);
   if(mag<1e-9){nx=-b.side;nz=0;}else {nx/=mag;nz/=mag;}
   if(!nearest||entry<nearest.entry)nearest={boulder:b,entry,nx,nz};
  }
  if(!nearest){this.touchingId=undefined;return;}
  const {boulder:b,nx,nz,entry}=nearest;
  if(this.touchingId===b.id)return;
  this.touchingId=b.id;this.impacts++;
  const outward=Math.max(0,(s.lateral-previous.lateral)*b.side/Math.max(dt,.001));
  const frontal=Math.max(0,-nz),severity=Math.max(.22,Math.min(1,.22+s.speed/190+outward/12+frontal*.18));
  // Avoid drilling straight through the boulder. The impulse encourages an
  // arcade-style inward escape, never an outward spin into the void.
  s.distance=previous.distance+(s.distance-previous.distance)*Math.max(0,entry-.02);
  const inward=-b.side;
  s.lateral+=Math.max(-1.1,Math.min(1.1,nx*.6+inward*.38));
  s.lateralRate=inward*(1.3+3.1*severity)*(1+.25*Math.abs(nz));
  this.push=inward*(3+8*severity)*(1+.2*Math.abs(nz));
  s.speed*=1-(.10+.34*severity)*(1+.13*frontal);
  this.yaw=Math.max(-.33,Math.min(.33,(nx*.22+nz*.14)*severity));
  this.roll=inward*(.07+.10*Math.abs(nx))*severity;
  s.corridorSide=0;
  return {boulderId:b.id,distance:b.distance,lateral:b.lateral,side:b.side,severity,normal:[nx,nz] as [number,number]};
 }
 inspect(){return {impacts:this.impacts,yaw:this.yaw,roll:this.roll,touchingId:this.touchingId,boulders:this.boulders.length};}
}
