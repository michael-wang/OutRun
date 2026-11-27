import {RaceTrafficWorld} from '../race-traffic-world';
import {plannedTrafficLane, nearestTrafficLane} from '../traffic-flow';
import {sweptContact} from '../traffic-impact';
import {rearImpactResponse} from '../arcade-contact';
import {bend,edge,laneWidth,length as finish} from './route.mjs';

export const incidents=[
 {distance:1618,side:1,yaw:-.13,body:'hatch'},
 {distance:4040,side:-1,yaw:.16,body:'dropside'},
];
// Short groups on the early boulevards, with passing room between them. Metres ahead at race start.
const leads=[85,182,279,347,437,529,624,709,814,912,1022,1145,1250,1372,1486,1588,1690,1800,1935,2060,2188,2298,2430,2575,2720,2850,3010,3180,3350,3510,3730,3950,4210,4490,4780,5075,5390,5690,6010,6330];
const serviceTypes=new Map([[0,3],[3,2],[12,2],[17,3],[24,2],[33,2]]);
export const cityVehicleSize=type=>type===2?{width:2.49,length:10.60}:type===3?{width:2.12,length:5.76}:{width:1.92,length:4.38};
const finishes=finish+580;
export const civilianCount=leads.length;
export const rivalStart=civilianCount+incidents.length;
const playerID=100, clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const baseLanes=[-2,-1,1,2].map(n=>Math.sign(n)*(Math.abs(n)-.5)*laneWidth);
export function cityLanesAt(d){
 const lanes=baseLanes.filter(x=>Math.abs(x)+1.25<=edge(d,Math.sign(x)));
 for(const side of [-1,1])if(edge(d,side)>=13.28)lanes.push(side*12);
 return lanes.sort((a,b)=>a-b);
}
function jitter(seed,i){let x=Math.imul(seed^(i*193+17),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
function entryRecipes(seed,entry){
 // Bookmarks stage the same pack relative to the driver. Incident locations are course landmarks.
 const cars=leads.map((lead,id)=>({id,type:serviceTypes.get(id)??0,distance:entry+lead+Math.round(35*jitter(seed,id)),
  speed:serviceTypes.get(id)===3?53:serviceTypes.get(id)===2?24:27+Math.round(10*jitter(seed^924,id)),group:id>>1,member:id%2}));
 for(const [i,stop] of incidents.entries())cars.push({id:civilianCount+i,type:0,distance:stop.distance,speed:0,group:40+i,
  stationary:true,stopYaw:stop.yaw,stopSide:stop.side,incidentId:i+1});
 for(let i=0;i<2;i++)cars.push({id:rivalStart+i,type:1,distance:entry+(i?164:22),speed:50+i*2,group:50+i});
 return cars;
}
// The City's pinching lanes are asymmetric. Supply their real centres to the existing
// road-space traffic director, which owns following, passing, sweeps and moving wrecks.
export class CityTraffic {
 constructor(seed=5390,entry=0){
  this.time=0;this.contacts=[];this.passIds=new Set();this.latched=new Map();
  const recipes=entryRecipes(seed,entry);
  this.world=new RaceTrafficWorld(recipes,seed,finishes,()=>14.4,
   cityVehicleSize,true,false,cityLanesAt);
  this.actors=this.world.cars;
  this.before=this.actors.map(()=>({x:0,d:0,speed:0}));
  this.finishedRivals=new Map();
  for(const c of this.actors){
   const lanes=cityLanesAt(c.distance);
   const index=c.stationary?(c.stopSide>0?lanes.length-1:0):
    c.id>=rivalStart?(c.id===rivalStart?1:lanes.length-1):plannedTrafficLane(seed,c.group,c.member,lanes.length*1.75);
   const chosen=c.type===2?0:c.type===3?lanes.length-2:Math.min(index,lanes.length-1);
   c.lateral=c.targetLateral=lanes[chosen];
   if(!c.stationary&&c.id<rivalStart){
    const nearby=incidents.find(stop=>Math.abs(stop.distance-c.distance)<95);
    if(nearby&&Math.sign(c.lateral)===nearby.side)c.lateral=c.targetLateral=lanes[nearestTrafficLane(-c.lateral,lanes)];
   }
  }
 }
 step(dt,p){
  if(!(dt>0))return;
  this.time+=dt;this.dt=dt;
  for(const c of this.actors){
   const was=this.before[c.id];was.x=c.lateral;was.d=c.distance;was.speed=c.speed;
   if(c.finished||c.stationary)continue;
   // Leave a disappearing lane before the curb cuts it off. Never add a lane just because a fork is visible.
   const ahead=c.distance+Math.min(95,c.speed*1.65),lo=-edge(ahead,-1)+1.4,hi=edge(ahead,1)-1.4;
   if(c.targetLateral<lo||c.targetLateral>hi){
    const lanes=cityLanesAt(ahead);c.targetLateral=lanes[nearestTrafficLane(c.lateral,lanes)];
   }
   if(c.id>=rivalStart){
    let wanted=69+(c.id-rivalStart)*.85;
    for(let off=0;off<=96;off+=16)wanted=Math.min(wanted,Math.sqrt(15.8/Math.max(.00012,Math.abs(bend(c.distance+off)))+34*off));
    // Preserve the pacing car's previous 5 m/s² free-road pickup. The common
    // director still controls braking and chooses a safe lane around slower cars.
    const openTarget=Math.min(wanted,c.targetSpeed);
    if(openTarget>c.speed)c.speed+=Math.min(openTarget-c.speed,2.2*dt);
    c.cruiseSpeed=wanted;
   }
  }
  const user={id:playerID,distance:p.d,lateral:p.x,speed:p.speed,width:1.92,length:4.38};
  this.world.advance(this.time,[],user);
  let impact;
  for(const c of this.actors){
   if(c.finished)continue;
   c.lateral=clamp(c.lateral,-edge(c.distance,-1)+c.width/2,edge(c.distance,1)-c.width/2);
   const was=this.before[c.id];
   if(c.id<rivalStart&&!c.stationary&&was.d>=p.oldD&&c.distance<p.d)this.passIds.add(c.id);
   if(c.id>=rivalStart&&c.distance>=finish&&!this.finishedRivals.has(c.id))this.finishedRivals.set(c.id,this.time);
   if(Math.abs(c.distance-p.d)>10&&Math.abs(was.d-p.oldD)>10&&!this.latched.has(playerID*128+c.id))continue;
   const e=this.resolve(p,c);if(e)impact=e;
  }
  // The director prevents ordinary rear-end pileups. Resolve exceptional swept
  // side contacts (e.g. an impulse into a changing lane) for every AI pair too.
  for(let i=0;i<this.actors.length;i++){
   const a=this.actors[i];if(a.finished||a.stationary)continue;
   for(let j=0;j<i;j++){
    const b=this.actors[j];if(b.finished||b.stationary)continue;
    if(Math.abs(a.distance-b.distance)>11&&!this.latched.has(i*128+j))continue;
    this.resolve(a,b);
   }
  }
  return impact;
 }
 resolve(a,b){
  const player=a.id===undefined,aid=player?playerID:a.id,key=aid*128+b.id;
  const was=this.before[b.id],dx=(player?a.x:a.lateral)-b.lateral,dz=(player?a.d:a.distance)-b.distance;
  const halfW=((player?1.92:a.width)+b.width)*.5,halfL=((player?4.38:a.length)+b.length)*.5;
  const held=this.latched.get(key);
  if(held!==undefined){
   if((Math.abs(dx)>halfW+.44||Math.abs(dz)>halfL+1.60)&&this.time-held>.38)this.latched.delete(key);
   else if(player&&Math.abs(dx)<halfW&&Math.abs(dz)<halfL&&a.oldD<=was.d&&a.speed>b.speed){
    a.d=Math.min(a.d,b.distance-halfL);a.speed=Math.min(a.speed,b.speed);
   }
   return;
  }
  const oldX=(player?a.oldX:this.before[aid].x)-was.x,oldZ=(player?a.oldD:this.before[aid].d)-was.d;
  const cross=sweptContact(oldX,oldZ,dx,dz,halfW,halfL);if(!cross)return;
  const relative=Math.abs(a.speed-b.speed),sideSpeed=player?Math.abs(a.vel):Math.abs(((a.lateral-this.before[aid].x)-(b.lateral-was.x))/this.dt);
  const force=clamp((cross.kind==='rear'?relative/37:sideSpeed/12),.10,1);
  const impulse=rearImpactResponse(force),trailing=oldZ<=0;
  let sign=Math.sign(Math.abs(oldX)>.08?oldX:dx)||1;
  if(Math.abs(dx)<.6&&Math.abs(b.lateral)>4)sign=-Math.sign(b.lateral);
  const before=a.speed,sideKick=(trailing?impulse.trailingSideSpeed:impulse.leadingSideSpeed)*sign;
  const mult=cross.kind==='side'?1-(.035+.09*force):trailing?impulse.trailingSpeedMultiplier:impulse.leadingSpeedMultiplier;
  if(player){
   a.speed*=mult;
   a.x=clamp(a.x+sign*Math.min(.55,halfW-Math.min(halfW,Math.abs(dx))),-edge(a.d,-1)+1,edge(a.d,1)-1);
   if(trailing&&cross.kind==='rear'&&dz>-halfL)a.d=Math.min(a.d,b.distance-halfL);
   a.kick=sideKick;
  }else this.world.forceContact(a.id,mult,sideKick);
  if(b.stationary)this.world.bumpIncident(b.id,before,-sign);
  else this.world.forceContact(b.id,cross.kind==='side'?mult:trailing?impulse.leadingSpeedMultiplier:impulse.trailingSpeedMultiplier,-sideKick);
  this.latched.set(key,this.time);
  const event={time:this.time,a:player?'player':aid,b:b.id,type:b.stationary?'incident':b.id>=rivalStart?'rival':'civilian',kind:cross.kind,force,before,after:a.speed,d:player?a.d:a.distance};
  if(this.contacts.length===80)this.contacts.shift();this.contacts.push(event);return event;
 }
}
