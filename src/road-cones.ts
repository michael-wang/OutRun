import {warningTriangleGeometry,type Breakdown} from './breakdowns';
import {breakdownLaneLateral,type TrafficRoadSweep} from './race-traffic-world';
import {coastCurveConeLayout} from './coast-curve-cones';
import {coastShadowLength,coastShadowOffset,COAST_SHADOW_YAW,makeCoastShadowMaterial} from './coast-sun-shadow';
import * as THREE from 'three';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {createTrack} from './track';
import {setThrownPose,settleSeconds,throwTravel,travelAge,type PropThrow} from './road-prop-motion';
import {trafficRandom} from './traffic-lanes';

type Sample=ReturnType<typeof createTrack>['sample'];
export interface ConeRecipe {lateral?:number;id:number;distance:number;side:number;inset:number}

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

/** One bounded draw pool. Each recipe can be struck once per race; its landing persists. */
export class RoadCones {
 readonly recipe:ConeRecipe[];
 private throws=new Map<number,PropThrow>();
 private settled=new Map<number,THREE.Matrix4>();
 private mesh:THREE.InstancedMesh;
 private sunsetCast?:THREE.InstancedMesh;private sunsetPose=new THREE.Object3D();
 private pose=new THREE.Object3D();
 private shown:number[]=[];
 private lastTime=0;
 private readonly restPitch:number;
 constructor(
  private sample:Sample,private halfAt:(d:number)=>number,scene:THREE.Scene,
  seed:number,private length:number,private ready:(d:number)=>boolean=()=>true,
  private triangles?:readonly Breakdown[],private sunsetShadows=false,private geometryShadows=false,private coastalBends=false,
 ){
  this.recipe=triangles
   ?triangles.flatMap(h=>{
      // A multiple-vehicle accident gets ONE warning approach, not nine
      // duplicate signs across the driver's curved overtaking corridor.
      if(h.incidentId==='A4'&&h.id!==910000)return [];
      return (h.incidentId==='A4'?[310,195,90]:[240,120,40])
       .map((lead,i)=>({id:h.id*3+i,distance:h.distance-lead,side:h.stopSide,
        inset:1.75,lateral:breakdownLaneLateral(h.stopLane,h.stopSide,this.halfAt(h.distance))}));
     })
   :[...coneLayout(seed,length),...(coastalBends?coastCurveConeLayout(sample,halfAt,length):[])];
  const g=triangles?warningTriangleGeometry():geometry();
  // A cone rests on its broad base edge and narrow tip; a flat XY reflector rests on its face.
  this.restPitch=triangles?Math.PI/2:Math.PI/2+Math.atan2(.475-.07,1.47);
  if(triangles)g.rotateY(Math.PI);
  this.mesh=new THREE.InstancedMesh(g,triangles
   ?new THREE.MeshBasicMaterial({color:'#ff321b',side:THREE.DoubleSide,toneMapped:false})
   :new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),48);
  this.mesh.name=triangles?'breakdown-warning-objects':'road-cones';
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.castShadow=this.geometryShadows;
  if(this.mesh.castShadow)markCoastShadowCaster(this.mesh,'dynamic','hazards');
  scene.add(this.mesh);
  if(this.sunsetShadows&&!this.geometryShadows){
   const plane=new THREE.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);
   this.sunsetCast=new THREE.InstancedMesh(plane,makeCoastShadowMaterial(.80),48);
   this.sunsetCast.name=triangles?'breakdown-warning-sunset-shadows':'road-cone-sunset-shadows';
   this.sunsetCast.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.sunsetCast.count=0;this.sunsetCast.frustumCulled=false;
   this.sunsetCast.renderOrder=2;scene.add(this.sunsetCast);
  }
 }
 /** One deterministic impulse shared by player, rival and civilian collisions. */
 private knock(c:ConeRecipe,time:number,speed:number){
  if(this.throws.has(c.id))return false;
  const rand=trafficRandom(c.id,1),sideRand=trafficRandom(c.id,2),spinRand=trafficRandom(c.id,3);
  this.throws.set(c.id,{
   time,forward:Math.max(12,Math.min(84,speed*(.67+.33*rand))),
   sideways:(sideRand<.5?-1:1)*(4+sideRand*10),
   up:6+rand*7,
   spin:(spinRand<.5?-1:1)*(9+spinRand*17),
   tilt:(spinRand<.5?-1:1)*(8+rand*13),
  });
  return true;
 }
 /** Resolve road-space sweeps even when outside the player's streamed view. */
 hitByVehicles(time:number,vehicles:readonly TrafficRoadSweep[]){
  if(!this.triangles)return 0;
  let hits=0;
  for(const c of this.recipe){
   if(this.throws.has(c.id))continue;
   const x=c.lateral??c.side*(this.halfAt(c.distance)-c.inset);
   for(const v of vehicles){
    const dz=v.distance-v.previousDistance;
    const t=Math.abs(dz)<1e-6?0:
     THREE.MathUtils.clamp((c.distance-v.previousDistance)/dz,0,1);
    const near=v.previousDistance+dz*t;
    const lateral=v.previousLateral+(v.lateral-v.previousLateral)*t;
    if(Math.abs(near-c.distance)>3.2||Math.abs(lateral-x)>v.halfWidth+1.15)continue;
    if(this.knock(c,time,v.speed))hits++;
    break;
   }
  }
  return hits;
 }
 update(time:number,player:number,lateral:number,speed:number,previous?:{distance:number;lateral:number},halfWidth=1.55){
  let hits=0,count=0;this.shown=[];
  for(const c of this.recipe){
   // Maximum forward displacement is 84 * .72 metres.
   if(c.distance<player-161||c.distance>player+650)continue;
   const x=c.lateral??c.side*(this.halfAt(c.distance)-c.inset);
   if(previous&&!this.throws.has(c.id)&&this.ready(c.distance)){
    const delta=player-previous.distance;
    const t=Math.max(0,Math.min(1,(c.distance-previous.distance)/(Math.abs(delta)<1e-6?1e-6:delta)));
    const near=previous.distance+delta*t,px=previous.lateral+(lateral-previous.lateral)*t;
    if(Math.abs(near-c.distance)<3.2&&Math.abs(px-x)<halfWidth+(this.triangles?1.15:.43)){
     if(this.knock(c,time,speed))hits++;
    }
   }
   const f=this.throws.get(c.id),age=f?travelAge(f,time):0;
   const d=Math.min(this.length-.001,c.distance+(f?throwTravel(f.forward,age,.72):0));
   if(d<player-100||!this.ready(d))continue;
   const p=this.sample(d);
   const lateralOffset=x+(f?throwTravel(f.sideways,age,.42):0);
   // Keep roadside throws inside the paved edge, including props authored on the shoulder.
   const edge=Math.max(Math.abs(x),this.halfAt(d)-1.2);
   const finalX=THREE.MathUtils.clamp(lateralOffset,-edge,edge);
   const resting=this.settled.get(c.id);
   if(f&&resting&&age>=f.up/8+settleSeconds)this.pose.matrix.copy(resting);
   else{
    if(f)setThrownPose(this.pose,p,finalX,this.mesh.geometry.getAttribute('position'),f,age,this.restPitch);
    else{
     this.pose.position.copy(p.position).addScaledVector(p.right,x);
     this.pose.position.y+=this.triangles?.06:.03;
     this.pose.rotation.set(this.triangles?0:-Math.atan(p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z)),
      -p.roadHeading,-Math.atan(p.right.y),'YXZ');
    }
    this.pose.updateMatrix();
    if(f&&age>=f.up/8+settleSeconds)this.settled.set(c.id,this.pose.matrix.clone());
   }
   if(count<48){
    this.mesh.setMatrixAt(count,this.pose.matrix);
    if(this.sunsetCast){
     const length=coastShadowLength(this.triangles?1.95:1.35);
     this.sunsetPose.position.copy(p.position).addScaledVector(p.right,finalX).add(coastShadowOffset(length));
     // The cast stays on the road while a struck cone tumbles through the air.
     this.sunsetPose.position.y=p.position.y+p.right.y*(finalX)+.055;
     this.sunsetPose.rotation.set(0,COAST_SHADOW_YAW,0);
     this.sunsetPose.scale.set(this.triangles?1.75:.86,1,length+1.2);
     this.sunsetPose.updateMatrix();this.sunsetCast.setMatrixAt(count,this.sunsetPose.matrix);
    }
    count++;this.shown.push(c.id);
   }
  }
  this.lastTime=time;this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;
  if(this.sunsetCast){this.sunsetCast.count=count;this.sunsetCast.instanceMatrix.needsUpdate=true;}
  return hits;
 }
 snapshot(){return {flying:[...this.throws].map(([id,flight])=>[id,{...flight}] as [number,PropThrow])};}
 restore(saved:ReturnType<RoadCones['snapshot']>){
  if(!Array.isArray(saved?.flying))throw Error('Invalid cone checkpoint');
  this.reset();
  for(const [id,flight] of saved.flying)this.throws.set(id,{...flight});
 }
 reset(){this.throws.clear();this.settled.clear();this.lastTime=0;this.mesh.count=0;if(this.sunsetCast)this.sunsetCast.count=0;this.shown=[];}
 inspect(){return {capacity:48,active:this.mesh.count,sunsetProjectedShadows:this.sunsetCast?.count??0,
  hit:[...this.throws.keys()],flying:[...this.throws].filter(([,f])=>this.lastTime-f.time<f.up/8).map(([id])=>id),
  trajectories:[...this.throws].map(([id,f])=>({id,...f})),shown:this.shown,recipe:this.recipe};}
 dispose(){
  if(this.sunsetCast){this.sunsetCast.removeFromParent();this.sunsetCast.geometry.dispose();
   const mat=this.sunsetCast.material as THREE.MeshBasicMaterial;mat.map?.dispose();mat.dispose();this.sunsetCast.dispose();}
  this.mesh.removeFromParent();this.mesh.geometry.dispose();(this.mesh.material as THREE.Material).dispose();this.mesh.dispose();this.reset();
 }
}
