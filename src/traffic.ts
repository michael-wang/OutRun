import {TrafficLanes} from './traffic-lanes';
import {CANYON_BEND} from './canyon-identity';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TireEffects,type TireContact} from './tire-effects';
import {SkidFeedback} from './skid-feedback';
import {sweptContact,type TrafficCollision} from './traffic-impact';
import type {DrivingState} from './handling';
import type {createTrack} from './track';

export const TRAFFIC_LIMIT=12;
export const TRAFFIC_TYPES=[{name:'car',speed:34,length:4.4,width:1.8,axle:1.4},{name:'bus',speed:22,length:8.6,width:2.35,axle:3.1},{name:'truck',speed:27,length:7.6,width:2.3,axle:2.7},{name:'waffle',speed:27,length:5.2,width:2.1,axle:1.7}] as const;
const random=(seed:number,id:number)=>{let x=(seed^Math.imul(id+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return ((x^(x>>>16))>>>0)/4294967296;};
export interface TrafficActor {id:number;type:number;distance:number;speed:number;lane:number;lateral:number;visible:boolean;y:number;grade:number;previousDistance?:number;previousLateral?:number;previousVisible?:boolean;nominalDistance?:number;cruiseSpeed?:number;group?:number;signal?:number;changing?:boolean;unsignaled?:boolean}
/** One immutable recipe per seed/route; only the existing bounded window becomes meshes. */
interface TrafficRecipe {id:number;type:number;distance:number;speed:number;group:number}
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

function vehicleGeometry(type:number){
 const parts:THREE.BufferGeometry[]=[],spec=TRAFFIC_TYPES[type],body=type===0?'#318ed4':type===1?'#f3b443':'#e8e4d8',glass='#244954',rubber='#182426';
 const add=(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number)=>{const raw=g.toNonIndexed();g.dispose();raw.deleteAttribute('uv');raw.translate(x,y,z);const c=new THREE.Color(color),colors=new Float32Array(raw.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}raw.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(raw);};
 const box=(w:number,h:number,l:number,color:string,x:number,y:number,z:number)=>add(new THREE.BoxGeometry(w,h,l),color,x,y,z);
 if(type===0){box(1.8,.65,4.4,body,0,.73,0);box(1.55,.65,2.25,body,0,1.32,-.2);box(1.4,.43,.03,glass,0,1.38,.94);box(1.4,.4,.03,glass,0,1.38,-1.34);for(const side of [-1,1]){box(.025,.42,1.88,glass,side*.785,1.38,-.2);box(.04,.48,.09,body,side*.8,1.38,-.2);}}
 else if(type===1){box(2.35,2.5,8.6,body,0,1.65,0);box(2.39,.32,8.58,'#d35b36',0,.82,0);box(2.12,.9,.03,glass,0,2.1,4.31);box(1.95,.7,.03,glass,0,2.1,-4.31);for(const side of [-1,1])for(let i=0;i<6;i++)box(.025,.85,1.02,glass,side*1.185,2.1,-3.3+i*1.3);box(2.1,.12,8.1,'#f6ead2',0,2.95,0);}
 else if(type===2){box(2.3,2.35,4.8,body,0,1.72,-1.25);box(2.25,1.9,2.5,'#3d8daa',0,1.48,2.4);box(2.04,.72,.03,glass,0,1.94,3.66);for(const side of [-1,1])box(.025,.72,1.55,glass,side*1.135,1.94,2.65);box(2.05,.3,.08,'#cbd5d0',0,.8,3.72);}
 else {
  box(2.1,.8,5.2,'#96c9ac',0,.85,0);box(1.95,1.45,1.7,'#fff0ca',0,1.6,1.65);box(1.72,.8,.03,glass,0,1.9,2.51);
  for(const side of [-1,1]){box(.03,.72,1.25,glass,side*.99,1.95,1.65);for(const z of [-2.35,.55])box(.13,1.8,.13,'#79ad92',side*.98,2,z);box(.16,.12,3,'#fff0ca',side*1.02,1.65,-.9);}
  box(2.3,.22,3.35,'#fff0ca',0,2.95,-.9);box(2.24,.28,.14,'#ffe3a2',0,2.76,-2.57);
  for(const side of [-1,1])for(let i=0;i<7;i++)box(.14,.25,.35,i%2?'#fff0ca':'#ffe3a2',side*1.1,2.76,-2.3+i*.46);
  box(1.85,.16,2.7,'#885b35',0,1.56,-.9);box(1.8,.72,.12,'#fff0ca',0,2.1,-2.48);
 }
 for(const side of [-1,1])for(const z of [-spec.axle,spec.axle]){const wheel=new THREE.CylinderGeometry(.4,.4,.24,10);wheel.rotateZ(Math.PI/2);add(wheel,rubber,side*(spec.width/2-.04),.4,z);const hub=new THREE.CylinderGeometry(.2,.2,.255,8);hub.rotateZ(Math.PI/2);add(hub,'#9aa8a6',side*(spec.width/2-.04),.4,z);}
 for(const side of [-1,1]){box(.4,.18,.04,'#fff2c0',side*(spec.width/2-.3),.75,spec.length/2+.03);box(.34,.17,.04,'#ca3434',side*(spec.width/2-.3),.7,-spec.length/2-.03);}
 const merged=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());return merged;
}
interface Reaction {offset:number;velocity:number;boost:number;yaw:number;roll:number;skid:SkidFeedback;effects:TireEffects;touching:boolean;lastHit:number;slide:number}
export class Traffic {
 private history=new Map<number,{distance:number;speed:number;time:number}>();
 private lanes:TrafficLanes;private indicators:THREE.InstancedMesh;private lampPose=new THREE.Object3D();
 private shadows:THREE.InstancedMesh;private shadowPose=new THREE.Object3D();private meshes:THREE.InstancedMesh[];private material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});private dummy=new THREE.Object3D();
 private sign?:THREE.InstancedMesh;private actors:TrafficActor[]=[];private time=0;private reactions=new Map<number,Reaction>();private lastEvent?:TrafficCollision;private impacts=0;
 constructor(private scene:THREE.Scene,private sample:ReturnType<typeof createTrack>['sample'],private halfAt:(d:number)=>number,private length:number,private seed:number,private roadReady:(d:number)=>boolean=()=>true){
  this.lanes=new TrafficLanes(seed);this.indicators=new THREE.InstancedMesh(new THREE.BoxGeometry(.46,.25,.08),new THREE.MeshBasicMaterial({color:'#ffb000',toneMapped:false}),TRAFFIC_LIMIT*2);this.indicators.name='traffic-turn-signals';this.indicators.count=0;this.indicators.frustumCulled=false;scene.add(this.indicators);
  // One soft contact-shadow draw for the whole traffic pool; no player-relative shadow-map cutoff.
  const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*32+x)*4;pixels[i]=18;pixels[i+1]=26;pixels[i+2]=24;pixels[i+3]=Math.round(150*Math.max(0,1-r*r)**2);}
  const texture=new THREE.DataTexture(pixels,32,32);texture.needsUpdate=true;texture.magFilter=texture.minFilter=THREE.LinearFilter;
  const plane=new THREE.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);
  this.shadows=new THREE.InstancedMesh(plane,new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),TRAFFIC_LIMIT);this.shadows.name='traffic-contact-shadows';this.shadows.count=0;this.shadows.frustumCulled=false;scene.add(this.shadows);
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff0ca';ctx.fillRect(0,0,512,160);ctx.fillStyle='#503019';ctx.textAlign='center';ctx.font='bold 84px "Microsoft JhengHei", sans-serif';ctx.fillText('\u6674\u5929\u9b06\u9905',256,98);ctx.font='bold 26px sans-serif';ctx.fillText('SUNSHINE WAFFLES',256,140);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const rear=new THREE.PlaneGeometry(1.8,.72);rear.rotateY(Math.PI);rear.translate(0,2.1,-2.55);
   const sides=[-1,1].map(side=>{const g=new THREE.PlaneGeometry(2.6,.72);g.rotateY(side*Math.PI/2);g.translate(side*1.065,2.1,-.9);return g;});
   const geometry=mergeGeometries([rear,...sides])!;[rear,...sides].forEach(g=>g.dispose());this.sign=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({map:texture}),TRAFFIC_LIMIT);this.sign.count=0;this.sign.frustumCulled=false;scene.add(this.sign);
  }
  this.meshes=TRAFFIC_TYPES.map((t,i)=>{const mesh=new THREE.InstancedMesh(vehicleGeometry(i),this.material,TRAFFIC_LIMIT);mesh.name=`traffic-${t.name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);return mesh;});
 }
 reset(){this.history.clear();this.lanes.reset();this.indicators.count=0;this.shadows.count=0;this.actors=[];this.time=this.impacts=0;for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();this.lastEvent=undefined;this.meshes.forEach(m=>m.count=0);if(this.sign)this.sign.count=0;}
 update(time:number,player:number,playerLateral=Infinity,playerSpeed=0){
  if(time<this.time)this.reset();const dt=time-this.time,previous=this.actors;this.time=time;
  // Actual motion is authoritative once observed. Retain only lightweight history
  // for the finite route recipe; meshes/reactions still use the 12-actor pool.
  const candidates:TrafficActor[]=trafficRecipe(this.seed,this.length).map(recipe=>{
   const old=previous.find(a=>a.id===recipe.id),saved=this.history.get(recipe.id),nominalDistance=recipe.distance+recipe.speed*time;
   if(old)return {...old,nominalDistance,distance:old.distance+old.speed*dt,speed:old.speed+(recipe.speed-old.speed)*(1-Math.exp(-dt*1.8)),...(dt>0?{previousDistance:old.distance,previousLateral:old.lateral,previousVisible:old.visible}:{})};
   const distance=saved?saved.distance+saved.speed*(time-saved.time):nominalDistance;
   return {...recipe,nominalDistance,distance,speed:saved?.speed??recipe.speed,cruiseSpeed:recipe.speed,lane:0,lateral:0,visible:false,y:0,grade:0,previousDistance:distance,previousLateral:0,previousVisible:false};
  });
  for(const a of candidates)if(previous.some(old=>old.id===a.id))this.history.set(a.id,{distance:a.distance,speed:a.speed,time});
  const inside=candidates.filter(a=>a.distance>=player-180&&a.distance<=player+850&&a.distance<this.length-20);
  this.actors=inside.filter(a=>previous.some(old=>old.id===a.id));
  const entering=inside.filter(a=>!previous.some(old=>old.id===a.id)&&(time===0||Math.abs(a.distance-player)>120)).sort((a,b)=>Math.abs(a.distance-player)-Math.abs(b.distance-player));
  for(const a of entering){if(this.actors.length>=TRAFFIC_LIMIT)break;this.actors.push(a);}

  for(const a of this.actors){const r=this.reactions.get(a.id);if(r){a.distance+=r.boost*.85*(1-Math.exp(-dt/.85));r.boost*=Math.exp(-dt/.85);r.offset+=r.velocity*.55*(1-Math.exp(-dt/.55));r.velocity*=Math.exp(-dt/.55);r.offset*=Math.exp(-dt*.55);const follow=1-Math.exp(-dt/.07);r.yaw+=(THREE.MathUtils.clamp(r.velocity*.075,-.38,.38)-r.yaw)*follow;r.roll+=(THREE.MathUtils.clamp(r.velocity*.03,-.17,.17)-r.roll)*follow;}}
  this.actors=this.actors.filter(a=>a.distance>=player-180&&a.distance<=player+850).sort((a,b)=>b.distance-a.distance).slice(0,TRAFFIC_LIMIT);for(const [id,r] of this.reactions)if(!this.actors.some(a=>a.id===id)){r.effects.dispose();this.reactions.delete(id);}const counts=[0,0,0,0];let shadowCount=0,lampCount=0;
  for(const a of this.actors){const outer=Math.min(5.25,Math.max(1.75,this.halfAt(a.distance)-1.75));a.lateral=a.type===0?-1.75:a.type===1?outer:-outer;}
  this.lanes.update(time,this.actors,this.halfAt,{distance:player,lateral:playerLateral,speed:playerSpeed},id=>{const r=this.reactions.get(id);return !!r&&(r.touching||Math.abs(r.velocity)>.5||Math.abs(r.offset)>.4);});
  for(let i=0;i<this.actors.length;i++){
   const a=this.actors[i],spec=TRAFFIC_TYPES[a.type];const half=this.halfAt(a.distance),lanes=Math.max(2,Math.floor(half/3.5)*2);
   // Follow a narrowing lane taper continuously rather than jumping when the lane count changes.

   const reaction=this.reactions.get(a.id);if(reaction)a.lateral+=reaction.offset;
   a.lane=Math.max(0,Math.min(lanes-1,Math.round(a.lateral/3.5+(lanes-1)/2)));
   // Simple headway remains active during maneuvers and impact recovery.
   for(let j=0;j<i;j++){const leader=this.actors[j];const gap=Math.max(16,(spec.length+TRAFFIC_TYPES[leader.type].length)/2+6);if(Math.abs(a.lateral-leader.lateral)<2.7&&leader.distance-a.distance<gap){a.distance=leader.distance-gap;a.speed=Math.min(a.speed,leader.speed);if(reaction)reaction.boost=Math.min(0,reaction.boost);}}
   const safeEdge=this.halfAt(a.distance)-Math.max(1.75,spec.width/2+Math.abs(reaction?.yaw??0)*spec.length/2+.12);const unclamped=a.lateral;a.lateral=THREE.MathUtils.clamp(a.lateral,-safeEdge,safeEdge);if(reaction){reaction.offset+=a.lateral-unclamped;if(dt>0){const old=previous.find(p=>p.id===a.id);reaction.slide=old?Math.abs(a.lateral-old.lateral)/dt:0;}}
   this.history.set(a.id,{distance:a.distance,speed:a.speed,time});a.visible=this.roadReady(a.distance-spec.length/2)&&this.roadReady(a.distance+spec.length/2)&&(time===0||!!previous.find(old=>old.id===a.id)?.visible||Math.abs(a.distance-player)>80);if(!a.visible)continue;
   const p=this.sample(a.distance),front=this.sample(Math.min(this.length,a.distance+spec.axle)),rear=this.sample(Math.max(0,a.distance-spec.axle));
   const frontY=front.position.y+front.right.y*a.lateral,rearY=rear.position.y+rear.right.y*a.lateral,bank=-Math.atan(p.right.y);a.grade=(frontY-rearY)/Math.hypot(front.position.x-rear.position.x,front.position.z-rear.position.z);a.y=(frontY+rearY)/2+.02;
   this.dummy.position.copy(p.position).addScaledVector(p.right,a.lateral);this.dummy.position.y=a.y;this.dummy.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank+(reaction?.roll??0),'YXZ');this.dummy.updateMatrix();this.shadowPose.position.copy(this.dummy.position);this.shadowPose.position.y=p.position.y+p.right.y*a.lateral+.035;this.shadowPose.rotation.set(-Math.atan(a.grade),-p.roadHeading+(reaction?.yaw??0),bank,'YXZ');this.shadowPose.scale.set(spec.width*1.45,1,spec.length*1.15);this.shadowPose.updateMatrix();this.shadows.setMatrixAt(shadowCount++,this.shadowPose.matrix);if(a.type===3)this.sign?.setMatrixAt(counts[3],this.dummy.matrix);this.meshes[a.type].setMatrixAt(counts[a.type]++,this.dummy.matrix);
   if(a.signal){for(const end of [-1,1]){this.lampPose.position.set(-a.signal*(spec.width/2-.25),.75,end*(spec.length/2+.09)).applyMatrix4(this.dummy.matrix);this.lampPose.quaternion.copy(this.dummy.quaternion);this.lampPose.updateMatrix();this.indicators.setMatrixAt(lampCount++,this.lampPose.matrix);}}
   if(reaction){
    if(dt>0)reaction.skid.update(a.speed,0,dt,0,0,reaction.slide);
    const contacts:TireContact[]=[];
    for(const end of [-1,1])for(const side of [-1,1]){const point=new THREE.Vector3(side*(spec.width/2-.04),0,end*spec.axle).applyMatrix4(this.dummy.matrix),d=a.distance+((point.x-p.position.x)*p.tangent.x+(point.z-p.position.z)*p.tangent.z)/Math.hypot(p.tangent.x,p.tangent.z),road=this.sample(d);const lateral=(point.x-road.position.x)*road.right.x+(point.z-road.position.z)*road.right.z;point.y=road.position.y+road.right.y*lateral+.02;const normal=new THREE.Vector3().crossVectors(road.right,road.tangent).normalize();contacts.push({name:(end<0?'rear':'front')+'-wheel-'+side,surface:point.toArray(),normal:normal.toArray(),gap:0,onRoad:Math.abs(a.lateral)+spec.width/2<this.halfAt(d)});}
    reaction.effects.update(time,a.speed,reaction.skid.intensity,contacts,1);
   }
  }
  this.indicators.count=lampCount;this.indicators.instanceMatrix.needsUpdate=true;
  this.shadows.count=shadowCount;this.shadows.instanceMatrix.needsUpdate=true;
  if(this.sign){this.sign.count=counts[3];this.sign.instanceMatrix.needsUpdate=true;}this.meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true;});
 }
 /** Swept overlap plus persistent separation. Returns a new event only on contact entry. */
 hit(time:number,s:DrivingState,previous:{distance:number;lateral:number},dt:number,halfWidth=1.55,halfLength=2.8,heading=0):TrafficCollision|undefined {
  let event:TrafficCollision|undefined;
  for(const a of this.actors){
   if(!a.visible||!a.previousVisible)continue;
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
 inspect(){return {historySize:this.history.size,historyLimit:trafficRecipe(this.seed,this.length).length,laneChanges:this.lanes.inspect(),indicators:this.indicators.count,capacity:TRAFFIC_LIMIT,impacts:this.impacts,actors:this.actors.map(a=>({...a,typeName:TRAFFIC_TYPES[a.type].name})),geometries:this.meshes.length+2+(this.sign?1:0),contactShadows:this.shadows.count,shadowCasting:this.meshes.some(m=>m.castShadow),reactions:[...this.reactions].map(([id,r])=>({id,offset:r.offset,boost:r.boost,slide:r.slide,yaw:r.yaw,roll:r.roll,touching:r.touching,skidIntensity:r.skid.intensity,effects:r.effects.inspect()})),lastEvent:this.lastEvent};}
 dispose(){this.history.clear();this.lanes.reset();this.indicators.removeFromParent();this.indicators.geometry.dispose();(this.indicators.material as THREE.Material).dispose();this.shadows.removeFromParent();this.shadows.geometry.dispose();const shadowMaterial=this.shadows.material as THREE.MeshBasicMaterial;shadowMaterial.map?.dispose();shadowMaterial.dispose();for(const r of this.reactions.values())r.effects.dispose();this.reactions.clear();if(this.sign){this.sign.removeFromParent();this.sign.geometry.dispose();const m=this.sign.material as THREE.MeshBasicMaterial;m.map?.dispose();m.dispose();}this.meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});this.material.dispose();}
}
