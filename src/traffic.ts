import {lightCoastMaterial} from './coast-lamp-lighting';
import {TrafficLights} from './traffic-lights';
import {coastShadowLength,coastShadowOffset,COAST_SHADOW_YAW,makeCoastShadowMaterial} from './coast-sun-shadow';
import {TrafficLanes} from './traffic-lanes';
import {trafficPopulationAhead,trafficRevealIsHidden} from './traffic-visibility';
import {type TrafficSlot,plannedTrafficLateral,trafficCanEnter,trafficFollowingTarget,approachTrafficSpeed,trafficStopBeforeLeader,trafficHasBeenPassed} from './traffic-flow';
import {TRAFFIC_OUTLINE,TRAFFIC_OUTLINE_COLOR,TRAFFIC_CREST_RISK_COLOR,roadHidesVehicle,trafficOutlineGeometry,trafficOutlineHeight,trafficOutlineRadius,trafficOutlineStrength} from './traffic-outline';
import {CANYON_BEND} from './canyon-identity';
import {INTERCHANGE_DEMO_CAR_ID,interchangeCenterOffset,interchangeTrafficShift,interchangeDemoCarLateral,interchangeRampElevation,type RoadInterchange} from './road-interchange';
import * as THREE from 'three';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {TRAFFIC_TYPES,vehicleGeometry,waffleSignGeometry,waffleSignTexture} from './vehicle-model';
import {TireEffects,type TireContact} from './tire-effects';
import {SkidFeedback} from './skid-feedback';
import {sweptContact,type TrafficCollision} from './traffic-impact';
import {worldSpeed,type Obstacle,type RivalState} from './rival-race';
import {RaceTrafficWorld,breakdownLaneLateral,coastRaceCruise,type RaceRoadUser} from './race-traffic-world';
import {rearImpactResponse} from './arcade-contact';
import type {DrivingState} from './handling';
import type {createTrack} from './track';

export const TRAFFIC_LIMIT=12;
export {TRAFFIC_TYPES} from './vehicle-model';
const random=(seed:number,id:number)=>{let x=(seed^Math.imul(id+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return ((x^(x>>>16))>>>0)/4294967296;};
export interface TrafficActor {stationary?:boolean;stopSide?:number;stopLane?:number;id:number;type:number;distance:number;speed:number;lane:number;lateral:number;visible:boolean;y:number;grade:number;previousDistance?:number;previousLateral?:number;previousVisible?:boolean;nominalDistance?:number;cruiseSpeed?:number;group?:number;member?:number;signal?:number;changing?:boolean;unsignaled?:boolean}
/** One immutable recipe per seed/route; only the existing bounded window becomes meshes. */
interface TrafficRecipe {stationary?:boolean;stopSide?:number;stopLane?:number;id:number;type:number;distance:number;speed:number;group:number;member?:number}
const recipes=new Map<string,TrafficRecipe[]>();
export function trafficCruise(seed:number,id:number,type:number){
 const r=random(seed^0x719a,id),rare=random(seed^0x4ba2,id);
 if((type===0&&rare<.09)||(type===2&&rare<.045))return (260+30*r)/3.6;
 // A minority of deliberately slow vehicles create an overtaking challenge;
 // the old 30% share produced too many rolling traffic jams.
 if(rare<.13)return (55+32*r)/3.6;
 if(type===0)return (rare>.80?180+60*r:95+65*r)/3.6;
 if(type===2)return (rare>.91?180+55*r:85+60*r)/3.6;
 return (type===1?75+45*r:65+40*r)/3.6;
}
export function trafficRecipe(seed:number,length:number):readonly TrafficRecipe[]{
 const key=seed+':'+length,cached=recipes.get(key);if(cached)return cached;
 const out:TrafficRecipe[]=[];let distance=650+random(seed,0)*70,id=0;
 for(let group=0;distance<length-100;group++){
  // Keep the first launch sector clear; thereafter present denser, seeded road traffic.
  // Groups never occupy every lane and the existing 12-car render pool stays bounded.
  const count=group===0?3:random(seed^0x971,group)<.14?1:2+Math.floor(random(seed^0x91f,group)*3);
  for(let member=0;member<count;member++){
   const pick=random(seed^0x392,id),type=group===0?member:pick<.55?0:pick<.72?1:pick<.96?2:3;
   out.push({id,type,distance:distance+member*(32+random(seed^0xa5,group)*24),speed:trafficCruise(seed,id,type),group,member});id++;
  }
  distance+=275+random(seed^0x4c2,group)*285+(random(seed^0x52a,group)<.09?450:0);
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
 private raceWorld:RaceTrafficWorld;
 private racing=false;
 private playerSnapshot?:RaceRoadUser;
 private trafficSeed:number;
 // Legacy display-retirement bookkeeping only. In a race, RaceTrafficWorld
 // continues simulating these cars regardless of player/camera position.
 private retiredMotion=new Map<number,{distance:number;speed:number;lateral:number;time:number}>();
 private observerMeshes?:THREE.InstancedMesh[];
 private observerDrawn?:Set<number>;
 rivalLeaders?:()=>readonly RivalState[];
 private observerRows:Obstacle[]=[];
 private observedAt=-1;
 private observedCenter=-Infinity;
 private passedIds=new Set<number>();
 private previousPlayer?:number;
 private highwayStart?:number;private highwaySlot=0;private highwayRecipes:TrafficRecipe[]=[];
 enableHighway(start:number){this.highwayStart=start;}
 private history=new Map<number,{distance:number;speed:number;time:number}>();
 private lanes:TrafficLanes;private indicators:THREE.InstancedMesh;private lampPose=new THREE.Object3D();
 private shadows:THREE.InstancedMesh;private shadowPose=new THREE.Object3D();
 private sunsetCast?:THREE.InstancedMesh;private sunsetPose=new THREE.Object3D();private meshes:THREE.InstancedMesh[];private material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});private dummy=new THREE.Object3D();
 private outlineMeshes:THREE.InstancedMesh[];private crestRims:THREE.InstancedMesh[];private outlineEdges:THREE.EdgesGeometry[];private crestHints:THREE.LineSegments[];
 private outlineMaterial=new THREE.MeshBasicMaterial({color:TRAFFIC_OUTLINE_COLOR,side:THREE.BackSide,transparent:true,opacity:.95,depthTest:true,depthWrite:false,fog:true,toneMapped:false});
 private crestMaterial=new THREE.LineBasicMaterial({color:TRAFFIC_CREST_RISK_COLOR,transparent:true,opacity:.6,depthTest:true,depthWrite:false,depthFunc:THREE.GreaterDepth,fog:true,toneMapped:false});
 private crestRimMaterial=new THREE.MeshBasicMaterial({color:TRAFFIC_CREST_RISK_COLOR,side:THREE.BackSide,transparent:true,opacity:.95,depthTest:true,depthWrite:false,fog:true,toneMapped:false});
 private outlinePose=new THREE.Object3D();private outlineShift=new THREE.Vector3();private visionAim=new THREE.Vector3();
 private hintCache=new Map<number,boolean>();private nextHintCheck=0;
 private breakdownSmoke:THREE.InstancedMesh;private smokePose=new THREE.Object3D();private smokePoint=new THREE.Vector3();
 private sign?:THREE.InstancedMesh;private actors:TrafficActor[]=[];private time=0;private reactions=new Map<number,Reaction>();private lastEvent?:TrafficCollision;private impacts=0;
 /** Last sixteen candidate overlaps are for local Codex/QA reproduction only. */
 private readonly contactDebug:Array<{time:number;id:number;kind:string;playerFrom:[number,number];
  playerTo:[number,number];trafficFrom:[number,number];trafficTo:[number,number];
  envelope:[number,number];playerHeading:number;trafficYaw:number;}>=[];
 private rampDemoStartedAt?:number;private rampDemoFinished=false;
 private smokeWorldWeights:readonly number[]=[1,0,0];
 constructor(private scene:THREE.Scene,private sample:ReturnType<typeof createTrack>['sample'],private halfAt:(d:number)=>number,private length:number,private seed:number,private roadReady:(d:number)=>boolean=()=>true,private stopped:readonly TrafficRecipe[]=[],private junction?:RoadInterchange,private dusk=false,private sunsetShadows=false,private geometryShadows=false,sessionVariation=0){
  if(dusk)lightCoastMaterial(scene,this.material);
  if(dusk)this.runningLights=new TrafficLights(scene,TRAFFIC_LIMIT);
  this.trafficSeed=(seed^sessionVariation)>>>0;
  this.schedule=[...trafficRecipe(this.trafficSeed,length),...stopped];
  this.raceWorld=this.makeRaceWorld();
  this.lanes=new TrafficLanes(this.trafficSeed,dusk);this.indicators=new THREE.InstancedMesh(new THREE.BoxGeometry(.46,.25,.08),new THREE.MeshBasicMaterial({color:'#ffb000',toneMapped:false}),TRAFFIC_LIMIT*4);this.indicators.name='traffic-turn-signals';this.indicators.count=0;this.indicators.frustumCulled=false;scene.add(this.indicators);
  // One soft contact-shadow draw for the whole traffic pool; no player-relative shadow-map cutoff.
  const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*32+x)*4;pixels[i]=this.dusk?0:18;pixels[i+1]=this.dusk?0:26;pixels[i+2]=this.dusk?0:24;pixels[i+3]=Math.round(150*Math.max(0,1-r*r)**2);}
  const texture=new THREE.DataTexture(pixels,32,32);texture.needsUpdate=true;texture.magFilter=texture.minFilter=THREE.LinearFilter;
  const plane=new THREE.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);
  this.shadows=new THREE.InstancedMesh(plane,new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),TRAFFIC_LIMIT);this.shadows.name='traffic-contact-shadows';this.shadows.count=0;this.shadows.frustumCulled=false;scene.add(this.shadows);
  if(this.dusk&&this.sunsetShadows&&!this.geometryShadows){
   // One pooled draw for <=12 actors; no mobile shadow map, no per-car meshes.
   const shape=new THREE.PlaneGeometry(1,1);shape.rotateX(-Math.PI/2);
   this.sunsetCast=new THREE.InstancedMesh(shape,makeCoastShadowMaterial(.72),TRAFFIC_LIMIT);
   this.sunsetCast.name='traffic-sunset-shadows';
   this.sunsetCast.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.sunsetCast.count=0;this.sunsetCast.frustumCulled=false;
   this.sunsetCast.renderOrder=2;scene.add(this.sunsetCast);
  }
  if(typeof document!=='undefined'){
   this.sign=new THREE.InstancedMesh(waffleSignGeometry(),new THREE.MeshBasicMaterial({map:waffleSignTexture()}),TRAFFIC_LIMIT);this.sign.count=0;this.sign.frustumCulled=false;this.sign.castShadow=this.dusk&&this.geometryShadows;
   if(this.sign.castShadow)markCoastShadowCaster(this.sign,'dynamic','traffic');
   scene.add(this.sign);
  }
  this.meshes=TRAFFIC_TYPES.map((t,i)=>{const mesh=new THREE.InstancedMesh(vehicleGeometry(i),this.material,TRAFFIC_LIMIT);mesh.name=`traffic-${t.name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=this.dusk&&this.geometryShadows;mesh.receiveShadow=true;
   if(mesh.castShadow)markCoastShadowCaster(mesh,'dynamic','traffic');
   scene.add(mesh);return mesh;});
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
 /** Share the player's biome-dependent palette with traffic collision smoke. */
 setSmokeScene(weights:readonly number[]){
  this.smokeWorldWeights=weights;
  for(const reaction of this.reactions.values())reaction.effects.setSceneSmoke(weights,this.dusk);
 }
 /** 2D contact-shadow A/B: disable decal draws and CPU pose updates only. */
 setContactShadowsEnabled(enabled:boolean){this.shadows.visible=enabled;}
 /** A normal restart can re-roll moving traffic while keeping terrain and
  * world-owned stopped cars/triangle annotations in sync. Omit variation for
  * deterministic QA/reset tests; ?trafficSeed also locks replay results. */
 private makeRaceWorld(){
  const coast=this.racing&&this.dusk;
  const source=coast?this.schedule.map(row=>({...row,speed:row.stationary?0:coastRaceCruise(this.trafficSeed,row.id,row.type)})):this.schedule;
  return new RaceTrafficWorld(source,this.trafficSeed,this.length,this.halfAt,
    type=>({width:TRAFFIC_TYPES[type].width,length:TRAFFIC_TYPES[type].length}),coast);
 }
 /** Non-racing contexts keep the existing local traffic behavior. */
 enableRaceMode(){if(this.racing)return;this.racing=true;this.raceWorld=this.makeRaceWorld();}
 private rivalBodies():RaceRoadUser[]{return (this.rivalLeaders?.()??[]).filter(r=>r.finishTime===null)
  .map((r,i)=>({id:-1000-i,distance:r.distance,lateral:r.lateral,
   speed:worldSpeed(r.speed),width:r.entry.car.width,length:r.entry.car.length}));}
 reset(variation?:number){this.previousPlayer=undefined;this.passedIds.clear();this.retiredMotion.clear();if(variation!==undefined){this.trafficSeed=(this.seed^variation)>>>0;this.schedule=[...trafficRecipe(this.trafficSeed,this.length),...this.stopped];this.lanes=new TrafficLanes(this.trafficSeed,this.dusk);}this.raceWorld=this.makeRaceWorld();this.playerSnapshot=undefined;
  this.highwaySlot=0;this.highwayRecipes=[];this.runningLights?.reset();this.rampDemoStartedAt=undefined;this.rampDemoFinished=false;this.history.clear();this.contactDebug.length=0;this.lanes.reset();this.indicators.count=0;this.shadows.count=0;if(this.sunsetCast)this.sunsetCast.count=0;this.breakdownSmoke.count=0;this.actors=[];this.time=this.impacts=0;for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();this.lastEvent=undefined;this.meshes.forEach(m=>m.count=0);this.outlineMeshes.forEach(m=>m.count=0);this.crestRims.forEach(m=>m.count=0);this.crestHints.forEach(h=>h.visible=false);this.hintCache.clear();this.nextHintCheck=0;if(this.sign)this.sign.count=0;}
 update(time:number,player:number,playerLateral=Infinity,playerSpeed=0,camera?:THREE.PerspectiveCamera,viewportHeight=412){
  this.runningLights?.begin();
  if(time<this.time)this.reset();const dt=time-this.time,previous=this.actors;this.time=time;
  this.playerSnapshot={id:-9999,distance:player,lateral:playerLateral,speed:playerSpeed,width:2.28,length:4.9};
  this.raceWorld.advance(time,this.rivalBodies(),Number.isFinite(playerLateral)?this.playerSnapshot:undefined);
  this.observerDrawn?.clear();
  const before=this.previousPlayer;this.previousPlayer=player;
  let cleanPass=false;
  // Camera-visible traffic must exist before it enters the image. The old
  // fixed 850m pool boundary was well inside the 1400m mobile chase view.
  const populationAhead=trafficPopulationAhead(camera,this.scene.fog);
  // Actual motion is authoritative once observed. Retain only lightweight history
  // for the finite route recipe; meshes/reactions still use the 12-actor pool.
  if(this.highwayStart!==undefined&&player>=this.highwayStart){
   // Spawn beyond the fog; bound both recipes and AI history during arbitrary waits.
   this.highwaySlot=Math.max(this.highwaySlot,Math.floor((player-this.highwayStart)/400));
   while(this.highwayStart+this.highwaySlot*400<player+1200){
    const slot=this.highwaySlot++,id=1000000+slot,type=slot%3,speed=trafficCruise(this.trafficSeed,id,type);
    const distance=this.highwayStart+slot*400;
    if(distance>player+390)this.highwayRecipes.push({id,type,speed,distance:distance-speed*time,group:id,member:0});
   }
   this.highwayRecipes=this.highwayRecipes.filter(r=>{
    const saved=this.history.get(r.id),d=saved?saved.distance+saved.speed*(time-saved.time):r.distance+r.speed*time;
    if(d>=player-240&&d<=player+1600)return true;
    this.history.delete(r.id);this.lanes.forget(r.id);return false;
   });
  }
  const source:readonly TrafficRecipe[]=this.racing
   ?[...this.raceWorld.cars.filter(c=>!c.finished),...this.highwayRecipes]
   :[...this.schedule,...this.highwayRecipes];
  const candidates:TrafficActor[]=source.map(recipe=>{
   const old=previous.find(a=>a.id===recipe.id),saved=this.history.get(recipe.id),global=this.raceWorld.get(recipe.id),
    nominalDistance=global?.distance??recipe.distance+recipe.speed*time;
   if(old)return {...old,nominalDistance,
    distance:this.racing&&global?global.distance:old.distance+old.speed*dt,
    speed:this.racing&&global?global.speed:old.speed+(recipe.speed-old.speed)*(1-Math.exp(-dt*1.8)),
    lateral:this.racing&&global?global.lateral:old.lateral,
    ...(dt>0?{previousDistance:old.distance,previousLateral:old.lateral,previousVisible:old.visible}:{})};
   const distance=global?.distance??(saved?saved.distance+saved.speed*(time-saved.time):nominalDistance);
   return {...recipe,nominalDistance,distance,speed:global?.speed??saved?.speed??recipe.speed,cruiseSpeed:recipe.speed,
    lane:0,lateral:global?.lateral??0,visible:false,y:0,grade:0,previousDistance:distance,
    previousLateral:global?.lateral??0,previousVisible:false};
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
  // Track visual overtakes and clean-pass scoring without retiring physical
  // cars. The global world continues behind the camera for trailing racers.
  for(const a of candidates){
   if(!trafficHasBeenPassed(a.distance,TRAFFIC_TYPES[a.type].length,player))continue;
   // Retiring unseen recipes behind a start position is bookkeeping.
   // Celebrate only a moving car whose rear-clearance threshold we crossed
   // during continuous travel and which we passed without touching.
   if(dt>0&&before!==undefined&&player>before&&player-before<=playerSpeed*dt+1&&
    a.visible&&!a.stationary&&!this.reactions.has(a.id)&&
    !trafficHasBeenPassed(a.previousDistance??a.distance,TRAFFIC_TYPES[a.type].length,before)&&
    Math.abs(a.lateral-playerLateral)>TRAFFIC_TYPES[a.type].width/2+1.15)cleanPass=true;
   if(!this.passedIds.has(a.id)&&previous.some(old=>old.id===a.id))
    this.retiredMotion.set(a.id,{distance:a.distance,speed:a.speed,lateral:a.lateral,time});
   this.passedIds.add(a.id);
   this.history.delete(a.id);this.lanes.forget(a.id);
  }
  // Highway feeder ids only increase. Once a car is passed, remove its
  // active recipe and forget the id to keep infinite-road memory bounded.
  if(this.highwayRecipes.length){
   this.highwayRecipes=this.highwayRecipes.filter(r=>!this.passedIds.has(r.id));
  }
  for(const a of candidates)if(!this.passedIds.has(a.id)&&previous.some(old=>old.id===a.id))
   this.history.set(a.id,{distance:a.distance,speed:a.speed,time});
  const inside=candidates.filter(a=>(!!this.rivalLeaders||!this.passedIds.has(a.id))
   &&a.distance>=player-180&&a.distance<=player+populationAhead
   &&(a.distance<this.length-20||this.highwayStart!==undefined&&a.distance>=this.highwayStart));
  // No feeder recipe can generate the same id again; release highway ids
  // only AFTER filtering this frame's candidates so they cannot re-enter.
  for(const id of this.passedIds)if(id>=1000000)this.passedIds.delete(id);
  this.actors=inside.filter(a=>previous.some(old=>old.id===a.id));
  // Known stalled hazards are admitted first. Moving cars must plan around
  // them; never silently omit an already-authored breakdown to make room.
  const entering=inside.filter(a=>(this.rivalLeaders?a.distance>=player-180:a.distance>=player)
   &&!previous.some(old=>old.id===a.id)
   &&(time===0||a.id===INTERCHANGE_DEMO_CAR_ID||Math.abs(a.distance-player)>120||(this.racing&&a.distance<player-24)))
   .sort((a,b)=>Number(!!b.stationary)-Number(!!a.stationary)
    ||Math.abs(a.distance-player)-Math.abs(b.distance-player));
  // Admit only candidates that fit an existing moving/stopped lane picture.
  // An invisible entrant cannot suddenly fill the last usable passing lane
  // or intersect a vehicle already occupying its spawn envelope.
  for(const a of entering){
   if(this.actors.length>=TRAFFIC_LIMIT)break;
   a.lateral=a.stationary?breakdownLaneLateral(a.stopLane,a.stopSide,this.halfAt(a.distance)):
     this.raceWorld.get(a.id)?.lateral??plannedTrafficLateral(this.trafficSeed,a.group??0,a.member??0,this.halfAt(a.distance));
   // Never materialize an actor inside the player's current view. Accept it
   // far beyond the fog/camera horizon, behind the player, or completely
   // hidden by a crest. Once accepted it can naturally drive into view.
   if(camera&&time>0&&a.distance>=player&&
    !trafficRevealIsHidden(camera,this.sample,this.halfAt,player,a.distance,
     a.lateral,TRAFFIC_TYPES[a.type].width,TRAFFIC_TYPES[a.type].length,
     trafficOutlineHeight(a.type),this.scene.fog))continue;
   if(!this.rivalLeaders&&a.id!==INTERCHANGE_DEMO_CAR_ID&&!trafficCanEnter(
    {id:a.id,distance:a.distance,lateral:a.lateral,speed:a.speed,length:TRAFFIC_TYPES[a.type].length,stationary:a.stationary},
    this.actors.map(b=>({id:b.id,distance:b.distance,lateral:b.lateral,speed:b.speed,length:TRAFFIC_TYPES[b.type].length,stationary:b.stationary})),
    this.halfAt(a.distance)))continue;
   this.actors.push(a);
  }

  for(const a of this.actors){const r=this.reactions.get(a.id);if(r){a.distance+=r.boost*.85*(1-Math.exp(-dt/.85));r.boost*=Math.exp(-dt/.85);r.offset+=r.velocity*.55*(1-Math.exp(-dt/.55));r.velocity*=Math.exp(-dt/.55);r.offset*=Math.exp(-dt*.55);const follow=1-Math.exp(-dt/.07);r.yaw+=(THREE.MathUtils.clamp(r.velocity*.075,-.38,.38)-r.yaw)*follow;r.roll+=(THREE.MathUtils.clamp(r.velocity*.03,-.17,.17)-r.roll)*follow;}}
  this.actors=this.actors.filter(a=>a.distance>=player-180&&a.distance<=player+populationAhead).sort((a,b)=>b.distance-a.distance).slice(0,TRAFFIC_LIMIT);for(const [id,r] of this.reactions)if(!this.actors.some(a=>a.id===id)){r.effects.dispose();this.reactions.delete(id);}const counts=[0,0,0,0],outlineCounts=[0,0,0,0],crestRimCounts=[0,0,0,0];let shadowCount=0,sunsetCount=0,lampCount=0,smokeCount=0;
  if(camera&&(time===0||time>=this.nextHintCheck)){this.hintCache.clear();this.nextHintCheck=time+TRAFFIC_OUTLINE.crestRefreshSeconds;}
  this.crestHints.forEach(h=>h.visible=false);let crestCount=0;
  if(this.racing){
   // The full-course simulation is authoritative for both collision and display.
   for(const a of this.actors){
    const body=this.raceWorld.get(a.id);
    if(!body)continue;
    a.distance=body.distance;a.speed=body.speed;a.lateral=body.lateral;
    a.changing=Math.abs(body.targetLateral-body.lateral)>.2;
    a.signal=a.changing&&Math.floor(time/.30)%2===0
      ?Math.sign(body.targetLateral-body.lateral):0;
    a.unsignaled=false;
   }
  }else{
  for(const a of this.actors){
   const five=this.dusk?Math.max(0,Math.min(1,(this.halfAt(a.distance)-7)/1.75)):0;
   const outer=Math.min(5.25+five*1.75,Math.max(1.75,this.halfAt(a.distance)-1.75));
   a.lateral=a.id===INTERCHANGE_DEMO_CAR_ID&&this.junction?
    interchangeDemoCarLateral(this.junction,a.distance,this.halfAt(a.distance)):
    a.stationary?breakdownLaneLateral(a.stopLane,a.stopSide,this.halfAt(a.distance)):
    this.junction&&a.type===1?outer:
    plannedTrafficLateral(this.trafficSeed,a.group??0,a.member??0,this.halfAt(a.distance));
  }
  this.lanes.update(time,this.actors,this.halfAt,{distance:player,lateral:playerLateral,speed:playerSpeed},id=>{const r=this.reactions.get(id);return !!r&&(r.touching||Math.abs(r.velocity)>.5||Math.abs(r.offset)>.4);});
  }
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
   // Being behind the player's camera never changes a vehicle's engine physics.
   a.lane=Math.max(0,Math.min(lanes-1,Math.round(a.lateral/3.5+(lanes-1)/2)));
   // Look ahead up to 300m and *brake before reaching* slower traffic,
   // including breakdowns. No fixed 16m snap-back following rule: distance
   // and speed evolve continuously, while a final small overlap guard stops
   // an AI car ever passing through a stopped vehicle on a huge time step.
   if(!a.stationary&&!this.racing){
    let leader:TrafficActor|undefined;
    for(let j=0;j<i;j++){
     const candidate=this.actors[j];
     if(candidate.distance<=a.distance||candidate.distance-a.distance>300)continue;
     if(Math.abs(a.lateral-candidate.lateral)>2.85)continue;
     if(!leader||candidate.distance<leader.distance)leader=candidate;
    }
    const oldSpeed=a.speed;
    const shape={id:a.id,distance:a.distance,lateral:a.lateral,speed:a.speed,length:spec.length};
    let ahead:TrafficSlot|null=leader?{id:leader.id,distance:leader.distance,lateral:leader.lateral,speed:leader.speed,length:TRAFFIC_TYPES[leader.type].length,stationary:leader.stationary}:null;
    if(this.rivalLeaders)for(const r of this.rivalLeaders()){
     if(r.finishTime!==null||r.distance<=a.distance||r.distance-a.distance>300||Math.abs(r.lateral-a.lateral)>(r.entry.car.width+spec.width)*.5+.25)continue;
     if(!ahead||r.distance<ahead.distance)ahead={id:-1,distance:r.distance,lateral:r.lateral,speed:worldSpeed(r.speed),length:r.entry.car.length,stationary:false};
    }
    const target=trafficFollowingTarget(shape,ahead,a.cruiseSpeed??oldSpeed);
    a.speed=approachTrafficSpeed(a.speed,target,dt);
    // The original integration already moved by oldSpeed*dt. Only the small
    // trapezoidal speed correction belongs here; preserve impact impulses.
    a.distance+=(a.speed-oldSpeed)*dt*.5;
    a.distance=trafficStopBeforeLeader({...shape,distance:a.distance},ahead);
    if(reaction&&a.speed<oldSpeed)reaction.boost=Math.min(reaction.boost,0);
   }
   const safeEdge=this.halfAt(a.distance)-Math.max(1.75,spec.width/2+Math.abs(reaction?.yaw??0)*spec.length/2+.12);const unclamped=a.lateral;
   if(!enteringFromRamp||!this.junction||a.distance>=this.junction.entry.end)
    a.lateral=THREE.MathUtils.clamp(a.lateral,-safeEdge,safeEdge);if(reaction){reaction.offset+=a.lateral-unclamped;if(dt>0){const old=previous.find(p=>p.id===a.id);reaction.slide=old?Math.abs(a.lateral-old.lateral)/dt:0;}}
   // A road chunk completing while a car sits inside the visible image is
   // another pop-in source. Hold its first appearance until out of view,
   // rather than suddenly enabling its instanced model/outline/headlights.
   const wasVisible=!!previous.find(old=>old.id===a.id)?.visible;
   const safeToReveal=!camera||time===0||wasVisible||
    trafficRevealIsHidden(camera,this.sample,this.halfAt,player,a.distance,a.lateral,
     spec.width,spec.length,trafficOutlineHeight(a.type),this.scene.fog);
   this.history.set(a.id,{distance:a.distance,speed:a.speed,time});
   if(!this.racing)this.raceWorld.adopt(a.id,a.distance,a.speed,a.lateral);
    a.visible=this.roadReady(a.distance-spec.length/2)&&this.roadReady(a.distance+spec.length/2)
    &&(time===0||wasVisible||Math.abs(a.distance-player)>80||(this.racing&&a.distance<player-24))&&safeToReveal;
   if(!a.visible)continue;
   const p=this.sample(a.distance);
   // Keep far actors in the continuity/headway pool, but do not submit their
   // car body, lights, smoke or shadows while completely behind distance fog.
   // Only the 12 visible instances reach the GPU; all route states still advance.
   if(camera&&this.scene.fog instanceof THREE.Fog&&
    p.position.distanceTo(camera.position)>this.scene.fog.far+spec.length)continue;
   const front=this.sample(this.highwayStart===undefined?Math.min(this.length,a.distance+spec.axle):a.distance+spec.axle),rear=this.sample(Math.max(0,a.distance-spec.axle));
   const frontDrop=enteringFromRamp&&this.junction?interchangeRampElevation(this.junction,'entry',a.distance+spec.axle):0;
   const rearDrop=enteringFromRamp&&this.junction?interchangeRampElevation(this.junction,'entry',a.distance-spec.axle):0;
   const frontY=front.position.y+front.right.y*a.lateral+frontDrop,rearY=rear.position.y+rear.right.y*a.lateral+rearDrop,bank=-Math.atan(p.right.y);a.grade=(frontY-rearY)/Math.hypot(front.position.x-rear.position.x,front.position.z-rear.position.z);a.y=(frontY+rearY)/2+.02;
   this.dummy.position.copy(p.position).addScaledVector(p.right,a.lateral);this.dummy.position.y=a.y;this.dummy.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank+(reaction?.roll??0),'YXZ');this.dummy.updateMatrix();if(this.shadows.visible){this.shadowPose.position.copy(this.dummy.position);this.shadowPose.position.y=p.position.y+p.right.y*a.lateral+.035+(frontDrop+rearDrop)/2;this.shadowPose.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank,'YXZ');this.shadowPose.scale.set(spec.width*1.45,1,spec.length*1.15);this.shadowPose.updateMatrix();this.shadows.setMatrixAt(shadowCount++,this.shadowPose.matrix);}
   if(this.sunsetCast){
    const length=coastShadowLength(trafficOutlineHeight(a.type));
    this.sunsetPose.position.copy(p.position).addScaledVector(p.right,a.lateral).add(coastShadowOffset(length));
    this.sunsetPose.position.y=p.position.y+p.right.y*a.lateral+.055+(frontDrop+rearDrop)/2;
    this.sunsetPose.rotation.set(0,COAST_SHADOW_YAW,0);
    this.sunsetPose.scale.set(spec.width*1.22,1,length+spec.length*.45);
    this.sunsetPose.updateMatrix();this.sunsetCast.setMatrixAt(sunsetCount++,this.sunsetPose.matrix);
   }
   this.observerDrawn?.add(a.id);
   if(a.type===3)this.sign?.setMatrixAt(counts[3],this.dummy.matrix);this.meshes[a.type].setMatrixAt(counts[a.type]++,this.dummy.matrix);
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
  // The original endless-road feeder retires its recipe once passed.
  // Remove any last-frame history entry for that retired id as well, or
  // the finite history can outgrow its advertised recipe capacity by one.
  for(const id of this.history.keys())if(id>=1000000&&!this.highwayRecipes.some(r=>r.id===id))
   this.history.delete(id);
  this.runningLights?.finish();
  this.indicators.count=lampCount;this.indicators.instanceMatrix.needsUpdate=true;
  this.shadows.count=this.shadows.visible?shadowCount:0;this.shadows.instanceMatrix.needsUpdate=this.shadows.visible;
  if(this.sunsetCast){this.sunsetCast.count=sunsetCount;this.sunsetCast.instanceMatrix.needsUpdate=true;}
  this.breakdownSmoke.count=smokeCount;this.breakdownSmoke.instanceMatrix.needsUpdate=true;
  if(this.sign){this.sign.count=counts[3];this.sign.instanceMatrix.needsUpdate=true;}this.meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true;});this.outlineMeshes.forEach((m,i)=>{m.count=outlineCounts[i];m.instanceMatrix.needsUpdate=true;});this.crestRims.forEach((m,i)=>{m.count=crestRimCounts[i];m.instanceMatrix.needsUpdate=true;});
  return cleanPass;
 }
 /** Render instances are disposable; this is the authoritative whole-race state. */
 snapshot(){return {time:this.time,trafficSeed:this.trafficSeed,world:this.raceWorld.snapshot()};}
 restore(saved:ReturnType<Traffic['snapshot']>){
  if(!saved||saved.trafficSeed!==this.trafficSeed||!Number.isFinite(saved.time)
    ||Math.abs(saved.time-saved.world.time)>.001)throw Error('Traffic checkpoint mismatch');
  this.reset();
  this.raceWorld.restore(saved.world);
  this.time=saved.time;
  this.previousPlayer=undefined;this.playerSnapshot=undefined;
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
   if(import.meta.env.DEV){
    this.contactDebug.push({time,id:a.id,kind:contact.kind,
     playerFrom:[previous.distance,previous.lateral],playerTo:[s.distance,s.lateral],
     trafficFrom:[a.previousDistance??a.distance,a.previousLateral??a.lateral],
     trafficTo:[a.distance,a.lateral],envelope:[width,length],
     playerHeading:heading,trafficYaw:r?.yaw??0});
    if(this.contactDebug.length>16)this.contactDebug.shift();
   }
   const side=Math.abs(x)>.2?Math.sign(x):(a.lateral>0?-1:1),kind=contact.kind;
   if(kind==='side')s.lateral=a.lateral+side*width;
   else s.distance=a.distance+(previous.distance-(a.previousDistance??a.distance)>0?1:-1)*length;
   const edge=this.halfAt(s.distance)+1.1,rail=this.seed===1&&s.distance+halfLength>=CANYON_BEND.start&&s.distance-halfLength<CANYON_BEND.end;
   const rightEdge=rail?Math.min(edge,CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-halfWidth*Math.abs(Math.cos(heading))-halfLength*Math.abs(Math.sin(heading))-.1):edge;
   s.lateral=THREE.MathUtils.clamp(s.lateral,-edge,rightEdge);
   // If the shoulder/rail leaves no side clearance, stay behind the actor instead.
   if(kind==='side'&&Math.abs(s.lateral-a.lateral)<width-.001)s.distance=a.distance+(previous.distance<a.distance?-1:1)*length;
   if(r?.touching||r&&time-r.lastHit<2.6)continue; // avoid rapid repeat impact from the same AI car while both recover
   const relative=Math.abs(closing),outward=Math.abs(s.lateral-previous.lateral)/Math.max(dt,.001);
   const severity=THREE.MathUtils.clamp(kind==='rear'?relative/40:.15+outward/14,.12,1);
   const effects=r?.effects??new TireEffects(this.scene);
   if(!r)effects.setSceneSmoke(this.smokeWorldWeights,this.dusk);
   const reaction=r??{offset:0,velocity:0,boost:0,yaw:0,roll:0,skid:new SkidFeedback(),effects,touching:false,lastHit:0,slide:0};
   const mass=a.type===0?1:a.type===1?3.2:a.type===2?2.3:1.6;
   const playerBehind=previous.distance<(a.previousDistance??a.distance);
   const response=rearImpactResponse(severity);
   const trafficSide=Math.abs(a.lateral)>this.halfAt(a.distance)-spec.width/2-1?-Math.sign(a.lateral):-side;
   reaction.velocity=a.stationary?0:trafficSide*(kind==='rear'?(playerBehind?response.leadingSideSpeed:response.trailingSideSpeed):2.5+4*severity)/Math.sqrt(mass);
   if(kind==='rear')a.speed*=playerBehind
    ?Math.max(.62,response.leadingSpeedMultiplier-(mass<1.5?.02:0))
    :response.trailingSpeedMultiplier;
   this.raceWorld.impact(a.id,a.speed,a.lateral);
   const leader=this.actors.filter(b=>b.id!==a.id&&b.distance>a.distance&&Math.abs(b.lateral-a.lateral)<2.7).sort((a,b)=>a.distance-b.distance)[0];
   const room=leader?Math.max(0,leader.distance-a.distance-18):120;
   reaction.boost=kind==='rear'&&playerBehind&&!a.stationary?Math.min(3,relative*.12,room/.85):0;reaction.touching=true;reaction.lastHit=time;this.reactions.set(a.id,reaction);
   event={actorId:a.id,type:a.type,kind,side,distance:kind==='rear'?a.distance-spec.length/2:(a.distance+s.distance)/2,lateral:kind==='side'?a.lateral+side*spec.width/2:(a.lateral+s.lateral)/2,severity,relativeSpeed:relative,playerIsTrailing:kind==='rear'?playerBehind:undefined};this.lastEvent=event;this.impacts++;
   break;
  }
  return event;
 }
 clearance(distance:number,lateral:number,halfWidth:number,halfLength:number,heading:number){return this.actors.filter(a=>a.visible).map(a=>{const spec=TRAFFIC_TYPES[a.type],yaw=this.reactions.get(a.id)?.yaw??0;return {id:a.id,gap:Math.max(Math.abs(distance-a.distance)-halfLength*Math.abs(Math.cos(heading))-halfWidth*Math.abs(Math.sin(heading))-spec.length/2*Math.abs(Math.cos(yaw))-spec.width/2*Math.abs(Math.sin(yaw)),Math.abs(lateral-a.lateral)-halfWidth*Math.abs(Math.cos(heading))-halfLength*Math.abs(Math.sin(heading))-spec.width/2*Math.abs(Math.cos(yaw))-spec.length/2*Math.abs(Math.sin(yaw)))};});}
 get skidIntensity(){let intensity=0;for(const r of this.reactions.values())intensity=Math.max(intensity,r.skid.intensity);return intensity;}
 contactPoints(){const matrix=new THREE.Matrix4(),counts=[0,0,0,0],out:{id:number;distance:number;point:number[]}[]=[];for(const a of this.actors){if(!a.visible)continue;this.meshes[a.type].getMatrixAt(counts[a.type]++,matrix);const spec=TRAFFIC_TYPES[a.type];for(const side of [-1,1])for(const end of [-1,1])out.push({id:a.id,distance:a.distance+end*spec.axle,point:new THREE.Vector3(side*(spec.width/2-.04),0,end*spec.axle).applyMatrix4(matrix).toArray()});}return out;}
 /** Render only the otherwise unrepresented traffic around a remote chase camera. */
 drawForObserver(center:number|null,time:number){
  if(center===null){
   this.observerMeshes?.forEach(m=>{m.visible=false;});this.observedAt=-1;this.observerDrawn=undefined;return;
  }
  this.observerDrawn??=new Set(this.actors.filter(a=>a.visible).map(a=>a.id));
  if(!this.observerMeshes)this.observerMeshes=this.meshes.map(source=>{
   const mesh=new THREE.InstancedMesh(source.geometry,source.material,TRAFFIC_LIMIT);
   mesh.frustumCulled=false;mesh.name='observer-'+source.name;this.scene.add(mesh);return mesh;
  });
  if(this.observedAt<0||time<this.observedAt||time-this.observedAt>.15||Math.abs(center-this.observedCenter)>80){
   this.observerRows=this.raceObstacles(center,time,850).sort((a,b)=>Math.abs(a.distance-center)-Math.abs(b.distance-center));
   this.observedAt=time;this.observedCenter=center;
  }
  this.observerMeshes.forEach(m=>{m.count=0;m.visible=true;});
  for(const row of this.observerRows){
   if(row.type===undefined||this.observerDrawn.has(Number(row.id.slice(1))))continue;
   const mesh=this.observerMeshes[row.type],d=row.distance+(time-this.observedAt)*row.speed;
   if(mesh.count>=TRAFFIC_LIMIT||!this.roadReady(d))continue;
   const p=this.sample(d);this.dummy.position.copy(p.position).addScaledVector(p.right,row.lateral);
   this.dummy.rotation.set(-Math.asin(p.tangent.y),-p.roadHeading,-Math.atan(p.right.y),'YXZ');
   this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();mesh.setMatrixAt(mesh.count++,this.dummy.matrix);
  }
  this.observerMeshes.forEach(m=>{m.instanceMatrix.needsUpdate=true;});
 }
 /** A Rival that rear-ends moving road traffic displaces the SAME
  * vehicle in global simulation, whether visible here or kilometers ahead. */
 impactByRival(row:Obstacle,severity:number,side:number){
  if(row.type===undefined)return;
  const id=Number(row.id.slice(1)),body=this.raceWorld.get(id);
  if(!body||body.stationary||body.finished)return;
  const kick=rearImpactResponse(severity);
  const actor=this.actors.find(a=>a.id===id);
  if(actor){
   actor.speed*=kick.leadingSpeedMultiplier;
   let reaction=this.reactions.get(id);
   if(!reaction){
    const effects=new TireEffects(this.scene);
    effects.setSceneSmoke(this.smokeWorldWeights,this.dusk);
    reaction={offset:0,velocity:0,boost:0,yaw:0,roll:0,skid:new SkidFeedback(),
     effects,touching:false,lastHit:this.time,slide:0};
    this.reactions.set(id,reaction);
   }
   reaction.velocity+=side*kick.leadingSideSpeed;
   reaction.lastHit=this.time;
   this.raceWorld.impact(id,actor.speed,actor.lateral);
  }else this.raceWorld.forceContact(id,kick.leadingSpeedMultiplier,side*kick.leadingSideSpeed);
 }
 yieldBehindRival(row:Obstacle,distance:number,speed:number,time:number){
  if(row.type===undefined)return;
  const id=Number(row.id.slice(1));
  this.raceWorld.adopt(id,distance,speed,row.lateral);
  const actor=this.actors.find(a=>a.id===id);
  if(actor){actor.distance=Math.min(actor.distance,distance);actor.speed=Math.min(actor.speed,speed);}
  if(this.passedIds.has(id))this.retiredMotion.set(id,{distance,lateral:row.lateral,speed,time});
  else this.history.set(id,{distance,speed,time});
 }
 /** Course-wide traffic interactions persist regardless of observer distance.
  * Read-only query: update() is the sole owner of simulation clock advancement.
  * RivalRace decides using the BEGINNING of a physics tick, after Traffic.update
  * has already advanced to the END of that tick. Advancing again here would
  * rewind the clock and throw on the very first GO! frame. */
 raceObstacles(center:number,time:number,radius:number):Obstacle[]{
  const rows:Obstacle[]=this.raceWorld.obstacles(center,radius).map(a=>({
   id:'T'+a.id,type:a.type,distance:a.distance,lateral:a.lateral,speed:a.speed,
   width:a.width,length:a.length,
  }));
  for(const recipe of this.highwayRecipes){
   const recent=this.history.get(recipe.id);
   const d=recent?recent.distance+recent.speed*(time-recent.time):recipe.distance+recipe.speed*time;
   if(Math.abs(d-center)>radius)continue;
   const half=this.halfAt(d),lateral=plannedTrafficLateral(this.trafficSeed,recipe.group,recipe.member??0,half);
   const spec=TRAFFIC_TYPES[recipe.type];
   rows.push({id:'T'+recipe.id,type:recipe.type,distance:d,lateral,speed:recent?.speed??recipe.speed,width:spec.width,length:spec.length});
  }
  return rows;
 }
 inspectWorld(){return this.raceWorld.inspect();}
 audioActors():readonly TrafficActor[]{return this.actors;}
 inspect(){return {trafficSeed:this.trafficSeed,globalActive:this.raceWorld.cars.filter(c=>!c.finished).length,
  globalTotal:this.raceWorld.cars.length,passedCount:this.passedIds.size,historySize:this.history.size,historyLimit:this.schedule.length+this.highwayRecipes.length,highwayRecipes:this.highwayRecipes.length,laneChanges:this.lanes.inspect(),indicators:this.indicators.count,capacity:TRAFFIC_LIMIT,impacts:this.impacts,actors:this.actors.map(a=>({...a,typeName:TRAFFIC_TYPES[a.type].name})),geometries:this.meshes.length+3+(this.sign?1:0),outlineColor:TRAFFIC_OUTLINE_COLOR,outlineInstances:this.outlineMeshes.map(m=>m.count),crestRimInstances:this.crestRims.map(m=>m.count),crestHints:this.crestHints.filter(h=>h.visible).length,breakdownSmoke:this.breakdownSmoke.count,smokeCapacity:TRAFFIC_LIMIT*7,contactShadows:this.shadows.count,sunsetProjectedShadows:this.sunsetCast?.count??0,shadowCasting:this.meshes.some(m=>m.castShadow),reactions:[...this.reactions].map(([id,r])=>({id,offset:r.offset,velocity:r.velocity,boost:r.boost,slide:r.slide,yaw:r.yaw,roll:r.roll,touching:r.touching,skidIntensity:r.skid.intensity,effects:r.effects.inspect()})),lastEvent:this.lastEvent,contactDebug:this.contactDebug.slice()};}
 dispose(){this.observerMeshes?.forEach(m=>{m.removeFromParent();m.dispose();});this.runningLights?.dispose();this.history.clear();this.passedIds.clear();this.lanes.reset();this.indicators.removeFromParent();this.indicators.geometry.dispose();(this.indicators.material as THREE.Material).dispose();this.shadows.removeFromParent();this.shadows.geometry.dispose();const shadowMaterial=this.shadows.material as THREE.MeshBasicMaterial;shadowMaterial.map?.dispose();shadowMaterial.dispose();
  if(this.sunsetCast){this.sunsetCast.removeFromParent();this.sunsetCast.geometry.dispose();
   const castMaterial=this.sunsetCast.material as THREE.MeshBasicMaterial;
   castMaterial.map?.dispose();castMaterial.dispose();this.sunsetCast.dispose();}
  for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();if(this.sign){this.sign.removeFromParent();this.sign.geometry.dispose();const m=this.sign.material as THREE.MeshBasicMaterial;m.map?.dispose();m.dispose();}this.meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});
  this.crestHints.forEach(h=>h.removeFromParent());this.outlineEdges.forEach(g=>g.dispose());
  this.crestRims.forEach(m=>{m.removeFromParent();m.dispose();});this.outlineMeshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();m.dispose();});
  this.outlineMaterial.dispose();this.crestRimMaterial.dispose();this.crestMaterial.dispose();this.hintCache.clear();
  this.breakdownSmoke.removeFromParent();this.breakdownSmoke.geometry.dispose();const smokeMaterial=this.breakdownSmoke.material as THREE.MeshBasicMaterial;smokeMaterial.map?.dispose();smokeMaterial.dispose();this.breakdownSmoke.dispose();this.material.dispose();}
}
