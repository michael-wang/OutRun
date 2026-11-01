import {warningTriangleGeometry,type Breakdown} from './breakdowns';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {createTrack} from './track';
import {trafficRandom} from './traffic-lanes';

type Sample=ReturnType<typeof createTrack>['sample'];
export interface ConeRecipe {lateral?:number;id:number;distance:number;side:number;inset:number}
type Flight={time:number;forward:number;sideways:number;up:number;spin:number;tilt:number};

export function coneLayout(seed:number,length:number):ConeRecipe[]{
 const out:ConeRecipe[]=[];
 for(let group=0,start=1450+trafficRandom(seed,300)*150;start<length-700;group++,start+=1900+trafficRandom(seed,group+400)*950){
  const side=trafficRandom(seed,group+500)<.5?-1:1;
  for(let i=0;i<7;i++)out.push({id:group*7+i,distance:start+i*(11+trafficRandom(seed,group+600)*4),side,inset:.15+Math.sin(i/6*Math.PI)*.55});
 }
 return out;
}

function geometry(){
 const parts:THREE.BufferGeometry[]=[];
 const part=(g:THREE.BufferGeometry,color:string,y:number)=>{
  g.translate(0,y,0);const c=new THREE.Color(color);
  g.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:g.getAttribute('position').count},()=>[c.r,c.g,c.b]).flat(),3));
  parts.push(g);
 };
 part(new THREE.BoxGeometry(.95,.12,.95),'#282b30',.06);
 part(new THREE.CylinderGeometry(.07,.4,1.35,8),'#ff6518',.795);
 part(new THREE.CylinderGeometry(.19,.26,.29,8),'#fff7df',.88);
 const result=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());return result;
}

/** Reuse one InstancedMesh. Once struck, an object has a deterministic forward,
 * sideways and vertical impulse, tumbles, then disappears; no respawns until reset. */
export class RoadCones {
 readonly recipe:ConeRecipe[];
 private hit=new Set<number>();
 private flying=new Map<number,Flight>();
 private mesh:THREE.InstancedMesh;
 private pose=new THREE.Object3D();
 private shown:number[]=[];
 constructor(
  private sample:Sample,private halfAt:(d:number)=>number,scene:THREE.Scene,
  seed:number,private length:number,private ready:(d:number)=>boolean=()=>true,
  private triangles?:readonly Breakdown[],
 ){
  this.recipe=triangles
   ?triangles.flatMap(h=>[240,120,40].map((lead,i)=>({id:h.id*3+i,distance:h.distance-lead,side:h.stopSide,inset:1.75,lateral:h.stopSide*(this.halfAt(h.distance)-1.75)})))
   :coneLayout(seed,length);
  const g=triangles?warningTriangleGeometry():geometry();
  if(triangles)g.rotateY(Math.PI);
  this.mesh=new THREE.InstancedMesh(g,triangles
   ?new THREE.MeshBasicMaterial({color:'#ff321b',side:THREE.DoubleSide,toneMapped:false})
   :new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),48);
  this.mesh.name=triangles?'breakdown-warning-objects':'road-cones';
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.mesh.count=0;this.mesh.frustumCulled=false;scene.add(this.mesh);
 }
 update(time:number,player:number,lateral:number,speed:number,previous?:{distance:number;lateral:number},halfWidth=1.55){
  let hits=0,count=0;this.shown=[];
  for(const c of this.recipe){
   const flying=this.flying.get(c.id);
   if(flying&&time-flying.time>2.8){this.flying.delete(c.id);continue;}
   if(this.hit.has(c.id)&&!flying)continue;
   if(c.distance<player-100||c.distance>player+650)continue;
   if(!this.ready(c.distance))continue;
   const x=c.lateral??c.side*(this.halfAt(c.distance)-c.inset);
   if(previous&&!this.hit.has(c.id)){
    const delta=player-previous.distance;
    const t=Math.max(0,Math.min(1,(c.distance-previous.distance)/(Math.abs(delta)<1e-6?1e-6:delta)));
    const near=previous.distance+delta*t,px=previous.lateral+(lateral-previous.lateral)*t;
    if(Math.abs(near-c.distance)<3.2&&Math.abs(px-x)<halfWidth+(this.triangles?1.15:.43)){
     this.hit.add(c.id);
     const rand=trafficRandom(c.id,1),sideRand=trafficRandom(c.id,2),spinRand=trafficRandom(c.id,3);
     this.flying.set(c.id,{
      time,forward:Math.max(12,Math.min(84,speed*(.67+.33*rand))),
      sideways:(sideRand<.5?-1:1)*(4+sideRand*10),
      up:6+rand*7,
      spin:(spinRand<.5?-1:1)*(9+spinRand*17),
      tilt:(spinRand<.5?-1:1)*(8+rand*13),
     });
     hits++;
    }
   }
   const f=this.flying.get(c.id),age=f?Math.max(0,time-f.time):0;
   // The old animation drifted sideways and up but barely moved down the road.
   // These small props should really spray FORWARD on impact, then tumble away.
   const forward=f?f.forward*.72*(1-Math.exp(-age/.72)):0;
   const sideways=f?f.sideways*.42*(1-Math.exp(-age/.42)):0;
   const d=Math.min(this.length-.001,c.distance+forward),p=this.sample(d);
   this.pose.position.copy(p.position).addScaledVector(p.right,x+sideways);
   this.pose.position.y+=f?Math.max(0,f.up*age-8*age*age):this.triangles?.06:.03;
   this.pose.rotation.set(
    f?age*f.tilt:this.triangles?0:-Math.atan(p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z)),
    -p.roadHeading+(f?age*f.spin*.28:0),
    -Math.atan(p.right.y)+(f?age*f.spin:0),'YXZ',
   );
   this.pose.updateMatrix();
   if(count<48){this.mesh.setMatrixAt(count++,this.pose.matrix);this.shown.push(c.id);}
  }
  this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;
  return hits;
 }
 reset(){this.hit.clear();this.flying.clear();this.mesh.count=0;this.shown=[];}
 inspect(){return {capacity:48,active:this.mesh.count,hit:[...this.hit],flying:[...this.flying.keys()],trajectories:[...this.flying].map(([id,f])=>({id,forward:f.forward,sideways:f.sideways,up:f.up,spin:f.spin})),shown:this.shown,recipe:this.recipe};}
 dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();(this.mesh.material as THREE.Material).dispose();this.mesh.dispose();this.reset();}
}
