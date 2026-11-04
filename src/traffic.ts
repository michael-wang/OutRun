import {TrafficLights} from './traffic-lights';
import {TrafficLanes} from './traffic-lanes';
import {TRAFFIC_OUTLINE,TRAFFIC_OUTLINE_COLOR,TRAFFIC_CREST_RISK_COLOR,roadHidesVehicle,trafficOutlineGeometry,trafficOutlineHeight,trafficOutlineRadius,trafficOutlineStrength} from './traffic-outline';
import {CANYON_BEND} from './canyon-identity';
import {INTERCHANGE_DEMO_CAR_ID,interchangeCenterOffset,interchangeTrafficShift,interchangeDemoCarLateral,interchangeRampElevation,type RoadInterchange} from './road-interchange';
import * as THREE from 'three';
import {TRAFFIC_TYPES,vehicleGeometry,waffleSignGeometry,waffleSignTexture} from './vehicle-model';
import {TireEffects,type TireContact} from './tire-effects';
import {SkidFeedback} from './skid-feedback';
import {sweptContact,type TrafficCollision} from './traffic-impact';
import type {DrivingState} from './handling';
import type {createTrack} from './track';

export const TRAFFIC_LIMIT=12;
export {TRAFFIC_TYPES} from './vehicle-model';
const random=(seed:number,id:number)=>{let x=(seed^Math.imul(id+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return ((x^(x>>>16))>>>0)/4294967296;};
export interface TrafficActor {stationary?:boolean;stopSide?:number;id:number;type:number;distance:number;speed:number;lane:number;lateral:number;visible:boolean;y:number;grade:number;previousDistance?:number;previousLateral?:number;previousVisible?:boolean;nominalDistance?:number;cruiseSpeed?:number;group?:number;signal?:number;changing?:boolean;unsignaled?:boolean}
/** One immutable recipe per seed/route; only the existing bounded window becomes meshes. */
interface TrafficRecipe {stationary?:boolean;stopSide?:number;id:number;type:number;distance:number;speed:number;group:number}
const recipes=new Map<string,TrafficRecipe[]>();
export function trafficCruise(seed:number,id:number,type:number){
 const r=random(seed^0x719a,id),rare=random(seed^0x4ba2,id);
 if((type===0&&rare<.09)||(type===2&&rare<.045))return (260+30*r)/3.6;
 if(rare<.30)return (50+30*r)/3.6;
 if(type===0)return (rare>.80?180+60*r:95+65*r)/3.6;
 if(type===2)return (rare>.91?180+55*r:85+60*r)/3.6;
 return (type===1?75+45*r:65+40*r)/3.6;
}
export function trafficRecipe(seed:number,length:number):readonly TrafficRecipe[]{
 const key=seed+':'+length,cached=recipes.get(key);if(cached)return cached;
 const out:TrafficRecipe[]=[];let distance=650+random(seed,0)*70,id=0;
 for(let group=0;distance<length-100;group++){
  const count=group===0?3:random(seed^0x971,group)<.2?1:2+Math.floor(random(seed^0x91f,group)*3);
  for(let member=0;member<count;member++){
   const pick=random(seed^0x392,id),type=group===0?member:pick<.55?0:pick<.72?1:pick<.96?2:3;
   out.push({id,type,distance:distance+member*(32+random(seed^0xa5,group)*24),speed:trafficCruise(seed,id,type),group});id++;
  }
  distance+=500+random(seed^0x4c2,group)*400+(random(seed^0x52a,group)<.16?700:0);
 }
 if(recipes.size>=4)recipes.delete(recipes.keys().next().value!);recipes.set(key,out);return out;
}
export function trafficLayout(seed:number,time:number,player:number,length:number):TrafficActor[]{
 const out:TrafficActor[]=[];for(const recipe of trafficRecipe(seed,length)){const distance=recipe.distance+recipe.speed*time;if(distance<player-65||distance>player+850||distance>length-20)continue;out.push({...recipe,distance,cruiseSpeed:recipe.speed,lane:0,lateral:0,visible:false,y:0,grade:0});}
 return out.sort((a,b)=>b.distance-a.distance).slice(0,TRAFFIC_LIMIT);
}


interface Reaction {offset:number;velocity:number;boost:number;yaw:number;roll:number;skid:SkidFeedback;effects:TireEffects;touching:boolean;lastHit:number;slide:number}
export class Traffic {
 private runningLights?:TrafficLights;
 private schedule:readonly TrafficRecipe[];
 private highwayStart?:number;private highwaySlot=0;private highwayRecipes:TrafficRecipe[]=[];
 enableHighway(start:number){this.highwayStart=start;}
 private history=new Map<number,{distance:number;speed:number;time:number}>();
 private lanes:TrafficLanes;private indicators:THREE.InstancedMesh;private lampPose=new THREE.Object3D();
 private shadows:THREE.InstancedMesh;private shadowPose=new THREE.Object3D();private meshes:THREE.InstancedMesh[];private material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});private dummy=new THREE.Object3D();
 private outlineMeshes:THREE.InstancedMesh[];private crestRims:THREE.InstancedMesh[];private outlineEdges:THREE.EdgesGeometry[];private crestHints:THREE.LineSegments[];
 private outlineMaterial=new THREE.MeshBasicMaterial({color:TRAFFIC_OUTLINE_COLOR,side:THREE.BackSide,transparent:true,opacity:.95,depthTest:true,depthWrite:false,fog:false,toneMapped:false});
 private crestMaterial=new THREE.LineBasicMaterial({color:TRAFFIC_CREST_RISK_COLOR,transparent:true,opacity:.6,depthTest:true,depthWrite:false,depthFunc:THREE.GreaterDepth,fog:false,toneMapped:false});
 private crestRimMaterial=new THREE.MeshBasicMaterial({color:TRAFFIC_CREST_RISK_COLOR,side:THREE.BackSide,transparent:true,opacity:.95,depthTest:true,depthWrite:false,fog:false,toneMapped:false});
 private outlinePose=new THREE.Object3D();private outlineShift=new THREE.Vector3();private visionAim=new THREE.Vector3();
 private hintCache=new Map<number,boolean>();private nextHintCheck=0;
 private breakdownSmoke:THREE.InstancedMesh;private smokePose=new THREE.Object3D();private smokePoint=new THREE.Vector3();
 private sign?:THREE.InstancedMesh;private actors:TrafficActor[]=[];private time=0;private reactions=new Map<number,Reaction>();private lastEvent?:TrafficCollision;private impacts=0;
 private rampDemoStartedAt?:number;private rampDemoFinished=false;
 constructor(private scene:THREE.Scene,private sample:ReturnType<typeof createTrack>['sample'],private halfAt:(d:number)=>number,private length:number,private seed:number,private roadReady:(d:number)=>boolean=()=>true,stopped:readonly TrafficRecipe[]=[],private junction?:RoadInterchange,dusk=false){
  if(dusk)this.runningLights=new TrafficLights(scene,TRAFFIC_LIMIT);
  this.schedule=[...trafficRecipe(seed,length),...stopped];
  this.lanes=new TrafficLanes(seed);this.indicators=new THREE.InstancedMesh(new THREE.BoxGeometry(.46,.25,.08),new THREE.MeshBasicMaterial({color:'#ffb000',toneMapped:false}),TRAFFIC_LIMIT*4);this.indicators.name='traffic-turn-signals';this.indicators.count=0;this.indicators.frustumCulled=false;scene.add(this.indicators);
  // One soft contact-shadow draw for the whole traffic pool; no player-relative shadow-map cutoff.
  const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*32+x)*4;pixels[i]=18;pixels[i+1]=26;pixels[i+2]=24;pixels[i+3]=Math.round(150*Math.max(0,1-r*r)**2);}
  const texture=new THREE.DataTexture(pixels,32,32);texture.needsUpdate=true;texture.magFilter=texture.minFilter=THREE.LinearFilter;
  const plane=new THREE.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);
  this.shadows=new THREE.InstancedMesh(plane,new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),TRAFFIC_LIMIT);this.shadows.name='traffic-contact-shadows';this.shadows.count=0;this.shadows.frustumCulled=false;scene.add(this.shadows);
  if(typeof document!=='undefined'){
   this.sign=new THREE.InstancedMesh(waffleSignGeometry(),new THREE.MeshBasicMaterial({map:waffleSignTexture()}),TRAFFIC_LIMIT);this.sign.count=0;this.sign.frustumCulled=false;scene.add(this.sign);
  }
  this.meshes=TRAFFIC_TYPES.map((t,i)=>{const mesh=new THREE.InstancedMesh(vehicleGeometry(i),this.material,TRAFFIC_LIMIT);mesh.name=`traffic-${t.name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);return mesh;});
  // Four pooled back-face hull draws; the depth buffer hides the interior, leaving a thin silhouette.
  const hulls=TRAFFIC_TYPES.map((_t,i)=>trafficOutlineGeometry(i));
  this.outlineEdges=hulls.map(h=>new THREE.EdgesGeometry(h,28));
  this.outlineMeshes=hulls.map((h,i)=>{
   const mesh=new THREE.InstancedMesh(h,this.outlineMaterial,TRAFFIC_LIMIT);
   mesh.name=`vehicle-outline-${TRAFFIC_TYPES[i].name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   mesh.count=0;mesh.renderOrder=3;mesh.frustumCulled=false;scene.add(mesh);return mesh;
  });
  // A second instanced hull draws only the visible RED contour of crest-risk cars.
  // Reuse the same four geometries as the green traffic outline; no per-car meshes.
  this.crestRims=hulls.map((h,i)=>{
   const mesh=new THREE.InstancedMesh(h,this.crestRimMaterial,TRAFFIC_LIMIT);
   mesh.name=`vehicle-crest-rim-${TRAFFIC_TYPES[i].name}`;mesh.count=0;
   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.renderOrder=3;
   scene.add(mesh);return mesh;
  });
  // Hidden red fragments alone may show through the road; visible parts get the red rim above.
  this.crestHints=Array.from({length:TRAFFIC_LIMIT},(_,i)=>{
   const line=new THREE.LineSegments(this.outlineEdges[0],this.crestMaterial);
   line.name=`vehicle-crest-hint-${i}`;line.visible=false;line.frustumCulled=false;
   line.matrixAutoUpdate=false;line.renderOrder=4;scene.add(line);return line;
  });
  // One pooled draw of camera-facing, soft-edged charcoal plumes for stalled vehicles.
  // A small generated texture avoids hard-edged polygon "rocks" and external assets.
  const smokePixels=new Uint8Array(48*48*4);
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){
   const radius=Math.hypot((x-23.5)/23.5,(y-23.5)/23.5),fade=Math.max(0,1-radius),index=(y*48+x)*4;
   smokePixels[index]=smokePixels[index+1]=smokePixels[index+2]=255;
   smokePixels[index+3]=Math.round(228*Math.pow(fade,1.65));
  }
  const smokeTexture=new THREE.DataTexture(smokePixels,48,48,THREE.RGBAFormat);
  smokeTexture.needsUpdate=true;smokeTexture.magFilter=smokeTexture.minFilter=THREE.LinearFilter;
  this.breakdownSmoke=new THREE.InstancedMesh(
   new THREE.PlaneGeometry(1,1),
   new THREE.MeshBasicMaterial({color:'#747c7a',map:smokeTexture,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),
   TRAFFIC_LIMIT*7,
  );
  this.breakdownSmoke.name='breakdown-engine-smoke';this.breakdownSmoke.count=0;
  this.breakdownSmoke.frustumCulled=false;this.breakdownSmoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(this.breakdownSmoke);
 }
 reset(){this.highwaySlot=0;this.highwayRecipes=[];this.runningLights?.reset();this.rampDemoStartedAt=undefined;this.rampDemoFinished=false;this.history.clear();this.lanes.reset();this.indicators.count=0;this.shadows.count=0;this.breakdownSmoke.count=0;this.actors=[];this.time=this.impacts=0;for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();this.lastEvent=undefined;this.meshes.forEach(m=>m.count=0);this.outlineMeshes.forEach(m=>m.count=0);this.crestRims.forEach(m=>m.count=0);this.crestHints.forEach(h=>h.visible=false);this.hintCache.clear();this.nextHintCheck=0;if(this.sign)this.sign.count=0;}
 update(time:number,player:number,playerLateral=Infinity,playerSpeed=0,camera?:THREE.PerspectiveCamera,viewportHeight=412){
  this.runningLights?.begin();
  if(time<this.time)this.reset();const dt=time-this.time,previous=this.actors;this.time=time;
  // Actual motion is authoritative once observed. Retain only lightweight history
  // for the finite route recipe; meshes/reactions still use the 12-actor pool.
  if(this.highwayStart!==undefined&&player>=this.highwayStart){
   // Spawn beyond the fog; bound both recipes and AI history during arbitrary waits.
   this.highwaySlot=Math.max(this.highwaySlot,Math.floor((player-this.highwayStart)/400));
   while(this.highwayStart+this.highwaySlot*400<player+1200){
    const slot=this.highwaySlot++,id=1000000+slot,type=slot%3,speed=trafficCruise(this.seed,id,type);
    const distance=this.highwayStart+slot*400;
    if(distance>player+390)this.highwayRecipes.push({id,type,speed,distance:distance-speed*time,group:id});
   }
   this.highwayRecipes=this.highwayRecipes.filter(r=>{
    const saved=this.history.get(r.id),d=saved?saved.distance+saved.speed*(time-saved.time):r.distance+r.speed*time;
    if(d>=player-240&&d<=player+1600)return true;
    this.history.delete(r.id);this.lanes.forget(r.id);return false;
   });
  }
  const candidates:TrafficActor[]=[...this.schedule,...this.highwayRecipes].map(recipe=>{
   const old=previous.find(a=>a.id===recipe.id),saved=this.history.get(recipe.id),nominalDistance=recipe.distance+recipe.speed*time;
   if(old)return {...old,nominalDistance,distance:old.distance+old.speed*dt,speed:old.speed+(recipe.speed-old.speed)*(1-Math.exp(-dt*1.8)),...(dt>0?{previousDistance:old.distance,previousLateral:old.lateral,previousVisible:old.visible}:{})};
   const distance=saved?saved.distance+saved.speed*(time-saved.time):nominalDistance;
   return {...recipe,nominalDistance,distance,speed:saved?.speed??recipe.speed,cruiseSpeed:recipe.speed,lane:0,lateral:0,visible:false,y:0,grade:0,previousDistance:distance,previousLateral:0,previousVisible:false};
  });
  // One staged feeder car appears only as the player approaches THIS merge.
  // Its clock starts on arrival so QA jumps and normal ten-minute journeys
  // both show the same safe "coming up from the side road" moment.
  if(this.junction&&!this.rampDemoFinished){
   const entry=this.junction.entry;
   if(this.rampDemoStartedAt===undefined&&player>=entry.start-520&&player<=entry.start+40)this.rampDemoStartedAt=time;
   if(this.rampDemoStartedAt!==undefined){
    const distance=entry.start-170+27*Math.max(0,time-this.rampDemoStartedAt);
    if(distance<=entry.end+340){
     const old=previous.find(a=>a.id===INTERCHANGE_DEMO_CAR_ID);
     candidates.push({
      id:INTERCHANGE_DEMO_CAR_ID,type:0,group:-1,distance,speed:27,cruiseSpeed:27,
      lane:0,lateral:0,visible:old?.visible??false,y:0,grade:0,nominalDistance:distance,
      previousDistance:old?.distance??distance,previousLateral:old?.lateral??0,
      previousVisible:old?.visible??false,
     });
    }else this.rampDemoFinished=true;
   }
  }
  for(const a of candidates)if(previous.some(old=>old.id===a.id))this.history.set(a.id,{distance:a.distance,speed:a.speed,time});
  const inside=candidates.filter(a=>a.distance>=player-180&&a.distance<=player+850&&(a.distance<this.length-20||this.highwayStart!==undefined&&a.distance>=this.highwayStart));
  this.actors=inside.filter(a=>previous.some(old=>old.id===a.id));
  const entering=inside.filter(a=>!previous.some(old=>old.id===a.id)&&(time===0||a.id===INTERCHANGE_DEMO_CAR_ID||Math.abs(a.distance-player)>120)).sort((a,b)=>Math.abs(a.distance-player)-Math.abs(b.distance-player));
  for(const a of entering){if(this.actors.length>=TRAFFIC_LIMIT)break;this.actors.push(a);}

  for(const a of this.actors){const r=this.reactions.get(a.id);if(r){a.distance+=r.boost*.85*(1-Math.exp(-dt/.85));r.boost*=Math.exp(-dt/.85);r.offset+=r.velocity*.55*(1-Math.exp(-dt/.55));r.velocity*=Math.exp(-dt/.55);r.offset*=Math.exp(-dt*.55);const follow=1-Math.exp(-dt/.07);r.yaw+=(THREE.MathUtils.clamp(r.velocity*.075,-.38,.38)-r.yaw)*follow;r.roll+=(THREE.MathUtils.clamp(r.velocity*.03,-.17,.17)-r.roll)*follow;}}
  this.actors=this.actors.filter(a=>a.distance>=player-180&&a.distance<=player+850).sort((a,b)=>b.distance-a.distance).slice(0,TRAFFIC_LIMIT);for(const [id,r] of this.reactions)if(!this.actors.some(a=>a.id===id)){r.effects.dispose();this.reactions.delete(id);}const counts=[0,0,0,0],outlineCounts=[0,0,0,0],crestRimCounts=[0,0,0,0];let shadowCount=0,lampCount=0,smokeCount=0;
  if(camera&&(time===0||time>=this.nextHintCheck)){this.hintCache.clear();this.nextHintCheck=time+TRAFFIC_OUTLINE.crestRefreshSeconds;}
  this.crestHints.forEach(h=>h.visible=false);let crestCount=0;
  for(const a of this.actors){
   const outer=Math.min(5.25,Math.max(1.75,this.halfAt(a.distance)-1.75));
   a.lateral=a.id===INTERCHANGE_DEMO_CAR_ID&&this.junction?
    interchangeDemoCarLateral(this.junction,a.distance,this.halfAt(a.distance)):
    a.stationary?(a.stopSide??1)*(this.halfAt(a.distance)-1.75):a.type===0?-1.75:a.type===1?outer:-outer;
  }
  this.lanes.update(time,this.actors,this.halfAt,{distance:player,lateral:playerLateral,speed:playerSpeed},id=>{const r=this.reactions.get(id);return !!r&&(r.touching||Math.abs(r.velocity)>.5||Math.abs(r.offset)>.4);});
  for(let i=0;i<this.actors.length;i++){
   const a=this.actors[i],spec=TRAFFIC_TYPES[a.type];const half=this.halfAt(a.distance),lanes=Math.max(2,Math.round(half*2/3.5));
   const enteringFromRamp=a.id===INTERCHANGE_DEMO_CAR_ID&&!!this.junction;
   if(enteringFromRamp&&this.junction){
    a.lateral=interchangeDemoCarLateral(this.junction,a.distance,half);
    a.changing=a.distance<this.junction.entry.end;
    a.signal=a.changing&&Math.floor(time/.34)%2===0?-1:0;
   }
   // Only at the one authored interchange, right-lane buses use the newly
   // available outside lane. The shift eases in AFTER the width is open and
   // eases out BEFORE the exit taper; the baseline maneuver AI stays intact.
   if(this.junction&&!a.stationary&&!enteringFromRamp){
    // Preserve the original four physical lanes while the authoritative road
    // frame shifts 1.75m to the right for the joining fifth lane.
    a.lateral-=interchangeCenterOffset(this.junction,a.distance);
   }
   if(this.junction&&!a.stationary&&a.type===1){
    const shift=interchangeTrafficShift(this.junction,a.distance);
    if(shift>0){
     const next=interchangeTrafficShift(this.junction,a.distance+5);
     a.lateral=Math.min(this.halfAt(a.distance)-1.75,a.lateral+shift);
     if(Math.abs(next-shift)>.006){
      a.changing=true;a.unsignaled=false;
      a.signal=Math.floor(time/.34)%2===0?Math.sign(next-shift):0;
     }
    }
   }
   // Follow a narrowing lane taper continuously rather than jumping when the lane count changes.
   const reaction=this.reactions.get(a.id);if(reaction)a.lateral+=reaction.offset;
   a.lane=Math.max(0,Math.min(lanes-1,Math.round(a.lateral/3.5+(lanes-1)/2)));
   // Simple headway remains active during maneuvers and impact recovery.
   for(let j=0;!a.stationary&&j<i;j++){const leader=this.actors[j];const gap=Math.max(16,(spec.length+TRAFFIC_TYPES[leader.type].length)/2+6);if(Math.abs(a.lateral-leader.lateral)<2.7&&leader.distance-a.distance<gap){a.distance=leader.distance-gap;a.speed=Math.min(a.speed,leader.speed);if(reaction)reaction.boost=Math.min(0,reaction.boost);}}
   const safeEdge=this.halfAt(a.distance)-Math.max(1.75,spec.width/2+Math.abs(reaction?.yaw??0)*spec.length/2+.12);const unclamped=a.lateral;
   if(!enteringFromRamp||!this.junction||a.distance>=this.junction.entry.end)
    a.lateral=THREE.MathUtils.clamp(a.lateral,-safeEdge,safeEdge);if(reaction){reaction.offset+=a.lateral-unclamped;if(dt>0){const old=previous.find(p=>p.id===a.id);reaction.slide=old?Math.abs(a.lateral-old.lateral)/dt:0;}}
   this.history.set(a.id,{distance:a.distance,speed:a.speed,time});a.visible=this.roadReady(a.distance-spec.length/2)&&this.roadReady(a.distance+spec.length/2)&&(time===0||!!previous.find(old=>old.id===a.id)?.visible||Math.abs(a.distance-player)>80);if(!a.visible)continue;
   const p=this.sample(a.distance),front=this.sample(this.highwayStart===undefined?Math.min(this.length,a.distance+spec.axle):a.distance+spec.axle),rear=this.sample(Math.max(0,a.distance-spec.axle));
   const frontDrop=enteringFromRamp&&this.junction?interchangeRampElevation(this.junction,'entry',a.distance+spec.axle):0;
   const rearDrop=enteringFromRamp&&this.junction?interchangeRampElevation(this.junction,'entry',a.distance-spec.axle):0;
   const frontY=front.position.y+front.right.y*a.lateral+frontDrop,rearY=rear.position.y+rear.right.y*a.lateral+rearDrop,bank=-Math.atan(p.right.y);a.grade=(frontY-rearY)/Math.hypot(front.position.x-rear.position.x,front.position.z-rear.position.z);a.y=(frontY+rearY)/2+.02;
   this.dummy.position.copy(p.position).addScaledVector(p.right,a.lateral);this.dummy.position.y=a.y;this.dummy.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank+(reaction?.roll??0),'YXZ');this.dummy.updateMatrix();this.shadowPose.position.copy(this.dummy.position);this.shadowPose.position.y=p.position.y+p.right.y*a.lateral+.035+(frontDrop+rearDrop)/2;this.shadowPose.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank,'YXZ');this.shadowPose.scale.set(spec.width*1.45,1,spec.length*1.15);this.shadowPose.updateMatrix();this.shadows.setMatrixAt(shadowCount++,this.shadowPose.matrix);if(a.type===3)this.sign?.setMatrixAt(counts[3],this.dummy.matrix);this.meshes[a.type].setMatrixAt(counts[a.type]++,this.dummy.matrix);
   this.runningLights?.add(this.dummy.matrix,spec.width,spec.length);
   const height=trafficOutlineHeight(a.type),ahead=a.distance-player;
   let crestRisk=false;
   if(camera&&!enteringFromRamp&&ahead>TRAFFIC_OUTLINE.crestNear&&ahead<=TRAFFIC_OUTLINE.crestFar){
    if(!this.hintCache.has(a.id)){
     // Test sight to the LOWER body: the roof can already be visible on the crest
     // while the rear bumper and wheels are still hidden by the near road surface.
     this.visionAim.copy(this.dummy.position);this.visionAim.y+=Math.min(.6,height*.22);
     this.hintCache.set(a.id,roadHidesVehicle(this.sample,this.halfAt,player,a.distance,camera.position,this.visionAim));
    }
    crestRisk=!!this.hintCache.get(a.id);
    if(crestRisk){
     const hint=this.crestHints[crestCount++];hint.geometry=this.outlineEdges[a.type];
     hint.matrix.copy(this.dummy.matrix);hint.visible=true;
    }
   }
   const outlineStrength=crestRisk?1:trafficOutlineStrength(ahead);
   if(outlineStrength>0){
    const viewDistance=camera?camera.position.distanceTo(this.dummy.position):Math.max(1,ahead);
    const rim=trafficOutlineRadius(viewDistance,camera?.fov??47,viewportHeight)*outlineStrength*(crestRisk?TRAFFIC_OUTLINE.crestRimScale:1);
    const sx=1+rim/(spec.width*.5),sy=1+rim/(height*.5),sz=1+rim/(spec.length*.5);
    // Red replaces green on a crest hazard, even inside the 90m normal-rim cutoff.
    this.outlineShift.set(0,height*.5*(1-sy),0).applyQuaternion(this.dummy.quaternion);
    this.outlinePose.position.copy(this.dummy.position).add(this.outlineShift);
    this.outlinePose.quaternion.copy(this.dummy.quaternion);this.outlinePose.scale.set(sx,sy,sz);this.outlinePose.updateMatrix();
    if(crestRisk)this.crestRims[a.type].setMatrixAt(crestRimCounts[a.type]++,this.outlinePose.matrix);
    else this.outlineMeshes[a.type].setMatrixAt(outlineCounts[a.type]++,this.outlinePose.matrix);
   }
   if(a.stationary){
    const z=a.type===1?-spec.length*.38:spec.length*.32;
    const engineY=a.type===1?2.2:a.type===2?2.5:a.type===3?2.2:1.45;
    for(let i=0;i<7;i++){
     const phase=(time*.62+i/7+(a.id%11)*.11)%1;
     this.smokePoint.set(Math.sin(time*1.5+i*2.4+a.id)*(.28+phase*.8),engineY+.2+phase*3.9,z-.15-phase*.6);
     this.smokePose.position.copy(this.smokePoint.applyMatrix4(this.dummy.matrix));
     if(camera)this.smokePose.quaternion.copy(camera.quaternion);else this.smokePose.quaternion.identity();
     const size=.65+phase*1.85;this.smokePose.scale.set(size*1.15,size*1.55,1);
     this.smokePose.updateMatrix();
     this.breakdownSmoke.setMatrixAt(smokeCount++,this.smokePose.matrix);
    }
   }
   if(a.signal||(a.stationary&&Math.floor(time/.35)%2===0)){for(const signal of a.stationary?[-1,1]:[a.signal!])for(const end of [-1,1]){this.lampPose.position.set(-signal*(spec.width/2-.25),.75,end*(spec.length/2+.09)).applyMatrix4(this.dummy.matrix);this.lampPose.quaternion.copy(this.dummy.quaternion);this.lampPose.updateMatrix();this.indicators.setMatrixAt(lampCount++,this.lampPose.matrix);}}
   if(reaction){
    if(dt>0)reaction.skid.update(a.speed,0,dt,0,0,reaction.slide);
    const contacts:TireContact[]=[];
    for(const end of [-1,1])for(const side of [-1,1]){const point=new THREE.Vector3(side*(spec.width/2-.04),0,end*spec.axle).applyMatrix4(this.dummy.matrix),d=a.distance+((point.x-p.position.x)*p.tangent.x+(point.z-p.position.z)*p.tangent.z)/Math.hypot(p.tangent.x,p.tangent.z),road=this.sample(d);const lateral=(point.x-road.position.x)*road.right.x+(point.z-road.position.z)*road.right.z;point.y=road.position.y+road.right.y*lateral+.02;const normal=new THREE.Vector3().crossVectors(road.right,road.tangent).normalize();contacts.push({name:(end<0?'rear':'front')+'-wheel-'+side,surface:point.toArray(),normal:normal.toArray(),gap:0,onRoad:Math.abs(a.lateral)+spec.width/2<this.halfAt(d)});}
    reaction.effects.update(time,a.speed,reaction.skid.intensity,contacts,1);
   }
  }
  this.runningLights?.finish();
  this.indicators.count=lampCount;this.indicators.instanceMatrix.needsUpdate=true;
  this.shadows.count=shadowCount;this.shadows.instanceMatrix.needsUpdate=true;this.breakdownSmoke.count=smokeCount;this.breakdownSmoke.instanceMatrix.needsUpdate=true;
  if(this.sign){this.sign.count=counts[3];this.sign.instanceMatrix.needsUpdate=true;}this.meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true;});this.outlineMeshes.forEach((m,i)=>{m.count=outlineCounts[i];m.instanceMatrix.needsUpdate=true;});this.crestRims.forEach((m,i)=>{m.count=crestRimCounts[i];m.instanceMatrix.needsUpdate=true;});
 }
 /** Swept overlap plus persistent separation. Returns a new event only on contact entry. */
 hit(time:number,s:DrivingState,previous:{distance:number;lateral:number},dt:number,halfWidth=1.55,halfLength=2.8,heading=0):TrafficCollision|undefined {
  let event:TrafficCollision|undefined;
  for(const a of this.actors){
   if(!a.visible||!a.previousVisible||(this.junction&&a.id===INTERCHANGE_DEMO_CAR_ID&&a.distance<this.junction.entry.end))continue;
   const spec=TRAFFIC_TYPES[a.type],r=this.reactions.get(a.id);
   // Conservative yaw envelopes keep the visible bodies apart throughout the response.
   const width=halfWidth*Math.abs(Math.cos(heading))+halfLength*Math.abs(Math.sin(heading))+spec.width/2*Math.abs(Math.cos(r?.yaw??0))+spec.length/2*Math.abs(Math.sin(r?.yaw??0))+.12,length=halfLength*Math.abs(Math.cos(heading))+halfWidth*Math.abs(Math.sin(heading))+spec.length/2*Math.abs(Math.cos(r?.yaw??0))+spec.width/2*Math.abs(Math.sin(r?.yaw??0))+.12;
   const closing=(s.distance-previous.distance-(a.distance-(a.previousDistance??a.distance)))/Math.max(dt,.001);const x=s.lateral-a.lateral,z=s.distance-a.distance;
   if(r&&(Math.abs(x)>width+.7||Math.abs(z)>length+2))r.touching=false;
   const contact=sweptContact(previous.lateral-(a.previousLateral??a.lateral),previous.distance-(a.previousDistance??a.distance),x,z,width,length);
   if(!contact)continue;
   const side=Math.abs(x)>.2?Math.sign(x):(a.lateral>0?-1:1),kind=contact.kind;
   if(kind==='side')s.lateral=a.lateral+side*width;
   else s.distance=a.distance+(previous.distance-(a.previousDistance??a.distance)>0?1:-1)*length;
   const edge=this.halfAt(s.distance)+1.1,rail=this.seed===1&&s.distance+halfLength>=CANYON_BEND.start&&s.distance-halfLength<CANYON_BEND.end;
   const rightEdge=rail?Math.min(edge,CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-halfWidth*Math.abs(Math.cos(heading))-halfLength*Math.abs(Math.sin(heading))-.1):edge;
   s.lateral=THREE.MathUtils.clamp(s.lateral,-edge,rightEdge);
   // If the shoulder/rail leaves no side clearance, stay behind the actor instead.
   if(kind==='side'&&Math.abs(s.lateral-a.lateral)<width-.001)s.distance=a.distance+(previous.distance<a.distance?-1:1)*length;
   if(r?.touching||r&&time-r.lastHit<1.25)continue;
   const relative=Math.abs(closing),outward=Math.abs(s.lateral-previous.lateral)/Math.max(dt,.001);
   const severity=THREE.MathUtils.clamp(kind==='rear'?relative/40:.15+outward/14,.12,1);
   const reaction=r??{offset:0,velocity:0,boost:0,yaw:0,roll:0,skid:new SkidFeedback(),effects:new TireEffects(this.scene),touching:false,lastHit:0,slide:0};
   const mass=a.type===0?1:a.type===1?3.2:a.type===2?2.3:1.6;
   const trafficSide=Math.abs(a.lateral)>this.halfAt(a.distance)-spec.width/2-1?-Math.sign(a.lateral):-side;reaction.velocity=trafficSide*(kind==='rear'?4+9*severity:2.5+4*severity)/Math.sqrt(mass);
   const leader=this.actors.filter(b=>b.id!==a.id&&b.distance>a.distance&&Math.abs(b.lateral-a.lateral)<2.7).sort((a,b)=>a.distance-b.distance)[0];
   const room=leader?Math.max(0,leader.distance-a.distance-18):120;
   reaction.boost=kind==='rear'?Math.sign(closing)*Math.min(110,(12+relative*1.15)/mass,room/.85):0;reaction.touching=true;reaction.lastHit=time;this.reactions.set(a.id,reaction);
   event={actorId:a.id,type:a.type,kind,side,distance:kind==='rear'?a.distance-spec.length/2:(a.distance+s.distance)/2,lateral:kind==='side'?a.lateral+side*spec.width/2:(a.lateral+s.lateral)/2,severity,relativeSpeed:relative};this.lastEvent=event;this.impacts++;
   break;
  }
  return event;
 }
 clearance(distance:number,lateral:number,halfWidth:number,halfLength:number,heading:number){return this.actors.filter(a=>a.visible).map(a=>{const spec=TRAFFIC_TYPES[a.type],yaw=this.reactions.get(a.id)?.yaw??0;return {id:a.id,gap:Math.max(Math.abs(distance-a.distance)-halfLength*Math.abs(Math.cos(heading))-halfWidth*Math.abs(Math.sin(heading))-spec.length/2*Math.abs(Math.cos(yaw))-spec.width/2*Math.abs(Math.sin(yaw)),Math.abs(lateral-a.lateral)-halfWidth*Math.abs(Math.cos(heading))-halfLength*Math.abs(Math.sin(heading))-spec.width/2*Math.abs(Math.cos(yaw))-spec.length/2*Math.abs(Math.sin(yaw)))};});}
 get skidIntensity(){let intensity=0;for(const r of this.reactions.values())intensity=Math.max(intensity,r.skid.intensity);return intensity;}
 contactPoints(){const matrix=new THREE.Matrix4(),counts=[0,0,0,0],out:{id:number;distance:number;point:number[]}[]=[];for(const a of this.actors){if(!a.visible)continue;this.meshes[a.type].getMatrixAt(counts[a.type]++,matrix);const spec=TRAFFIC_TYPES[a.type];for(const side of [-1,1])for(const end of [-1,1])out.push({id:a.id,distance:a.distance+end*spec.axle,point:new THREE.Vector3(side*(spec.width/2-.04),0,end*spec.axle).applyMatrix4(matrix).toArray()});}return out;}
 audioActors():readonly TrafficActor[]{return this.actors;}
 inspect(){return {historySize:this.history.size,historyLimit:this.schedule.length+this.highwayRecipes.length,highwayRecipes:this.highwayRecipes.length,laneChanges:this.lanes.inspect(),indicators:this.indicators.count,capacity:TRAFFIC_LIMIT,impacts:this.impacts,actors:this.actors.map(a=>({...a,typeName:TRAFFIC_TYPES[a.type].name})),geometries:this.meshes.length+3+(this.sign?1:0),outlineColor:TRAFFIC_OUTLINE_COLOR,outlineInstances:this.outlineMeshes.map(m=>m.count),crestRimInstances:this.crestRims.map(m=>m.count),crestHints:this.crestHints.filter(h=>h.visible).length,breakdownSmoke:this.breakdownSmoke.count,smokeCapacity:TRAFFIC_LIMIT*7,contactShadows:this.shadows.count,shadowCasting:this.meshes.some(m=>m.castShadow),reactions:[...this.reactions].map(([id,r])=>({id,offset:r.offset,boost:r.boost,slide:r.slide,yaw:r.yaw,roll:r.roll,touching:r.touching,skidIntensity:r.skid.intensity,effects:r.effects.inspect()})),lastEvent:this.lastEvent};}
 dispose(){this.runningLights?.dispose();this.history.clear();this.lanes.reset();this.indicators.removeFromParent();this.indicators.geometry.dispose();(this.indicators.material as THREE.Material).dispose();this.shadows.removeFromParent();this.shadows.geometry.dispose();const shadowMaterial=this.shadows.material as THREE.MeshBasicMaterial;shadowMaterial.map?.dispose();shadowMaterial.dispose();for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();if(this.sign){this.sign.removeFromParent();this.sign.geometry.dispose();const m=this.sign.material as THREE.MeshBasicMaterial;m.map?.dispose();m.dispose();}this.meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});
  this.crestHints.forEach(h=>h.removeFromParent());this.outlineEdges.forEach(g=>g.dispose());
  this.crestRims.forEach(m=>{m.removeFromParent();m.dispose();});this.outlineMeshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();m.dispose();});
  this.outlineMaterial.dispose();this.crestRimMaterial.dispose();this.crestMaterial.dispose();this.hintCache.clear();
  this.breakdownSmoke.removeFromParent();this.breakdownSmoke.geometry.dispose();const smokeMaterial=this.breakdownSmoke.material as THREE.MeshBasicMaterial;smokeMaterial.map?.dispose();smokeMaterial.dispose();this.breakdownSmoke.dispose();this.material.dispose();}
}
