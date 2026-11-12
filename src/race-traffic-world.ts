import {approachTrafficSpeed,roadLaneCenters,nearestTrafficLane,plannedTrafficLateral,trafficFollowingTarget,trafficStopBeforeLeader} from './traffic-flow';
import type {TrafficSlot} from './traffic-flow';
import {DEFAULT_PACE,effectivePace} from './pace';

/** Course-wide traffic truth. Rendering/streaming are only consumers of this state.
 * A racer cannot drive into an easier world by leaving the player's camera. */
export interface TrafficWorldRecipe {
 id:number;type:number;distance:number;speed:number;group:number;member?:number;
 stationary?:boolean;stopSide?:number;stopLane?:number;stopYaw?:number;incidentId?:'A4';
}
/** Stable road-driver personality, independent of rendering or vehicle model. */
export type TrafficDriverStyle='safe'|'normal'|'dangerous';
interface TrafficDriverProfile {
 lookAhead:number;minimumGain:number;speedGap:number;
 laneCooldown:number;signalDelay:number;laneSpeed:number;
 reverseAfter:number;rearClearance:number;
}
export const TRAFFIC_DRIVER_PROFILES:Record<TrafficDriverStyle,TrafficDriverProfile>={
 safe:{lookAhead:125,minimumGain:60,speedGap:5,laneCooldown:5.5,
  signalDelay:.70,laneSpeed:2.4,reverseAfter:7,rearClearance:26},
 normal:{lookAhead:190,minimumGain:18,speedGap:2.6,laneCooldown:2.4,
  signalDelay:.45,laneSpeed:3.7,reverseAfter:3.5,rearClearance:15},
 dangerous:{lookAhead:235,minimumGain:6,speedGap:.7,laneCooldown:1.7,
  signalDelay:.25,laneSpeed:5.2,reverseAfter:2.2,rearClearance:7},
};
export interface TrafficWorldCar extends TrafficSlot {
 driverStyle:TrafficDriverStyle;
 type:number;cruiseSpeed:number;targetSpeed:number;targetLateral:number;
 width:number;group:number;member:number;finished:boolean;sideVelocity:number;
 stopLane?:number;stopSide?:number;stopYaw?:number;incidentId?:'A4';
 blockedFor:number;reverseLeft:number;escapeUntil:number;escapeCooldown:number;indicateUntil:number;laneChangeUntil:number;
 laneChanges:number;escapeCount:number;
}
export interface RaceRoadUser extends TrafficSlot {width:number;finished?:boolean}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(v,b));
const approach=(from:number,to:number,step:number)=>from+clamp(to-from,-step,step);
const randomized=(seed:number,id:number)=>{
 let n=(seed^Math.imul(id+1,0x9e3779b1))>>>0;
 n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);
 return ((n^(n>>>16))>>>0)/4294967296;
};
/** One driver profile per traffic vehicle, drawn once from the seeded schedule. */
export function trafficDriverStyle(seed:number,id:number):TrafficDriverStyle{
 const roll=randomized(seed^0x23bb,id);
 return roll<.25?'safe':roll<.76?'normal':'dangerous';
}
export function breakdownLaneLateral(lane:number|undefined,side:number|undefined,half:number){
 const lanes=roadLaneCenters(half);
 if(lane!==undefined)return lanes[clamp(lane,0,lanes.length-1)];
 return (side??1)*(half-1.75);
}
/** Racing traffic cruises around 200 km/h while preserving some faster/slower outliers. */
export function coastRaceCruise(seed:number,id:number,type:number):number{
 const factor=randomized(seed^0x719a,id),style=trafficDriverStyle(seed,id);
 // The three curves share a ~200 km/h average, but their behaviors differ.
 const indicated=(style==='safe'?150+30*factor:
  style==='normal'?185+33*factor:220+45*factor)-(type===1?8:0);
 // Traffic and race cars must use the same route-distance calibration:
 // 200 indicated km/h means 200 km/h × the approved arcade travel pace.
 const meters=indicated/3.6;
 return meters*effectivePace(meters,DEFAULT_PACE);
}
export class RaceTrafficWorld {
 readonly cars:TrafficWorldCar[];
 private readonly byId=new Map<number,TrafficWorldCar>();
 private time=0;
 private decisionAt=0;
 private readonly sorted:TrafficWorldCar[]=[];
 private readonly users:RaceRoadUser[]=[];
 private spawnAt=4;
 private spawnIndex=0;
 private nextId=2000000;
 constructor(recipes:readonly TrafficWorldRecipe[],private seed:number,
  private length:number,private halfAt:(distance:number)=>number,
  private dimensions:(type:number)=>{width:number;length:number},private racing=false,
   private readonly entryTraffic=true){
  this.cars=recipes.map(row=>{
   const half=this.halfAt(row.distance);
   const lateral=row.stationary
    ?breakdownLaneLateral(row.stopLane,row.stopSide,half)
    :plannedTrafficLateral(seed,row.group,row.member??0,half);
   const d=this.dimensions(row.type),yaw=row.stationary?(row.stopYaw??0):0;
   // The traffic AI sees the projected footprint of each angled wreck.
   const width=Math.abs(d.width*Math.cos(yaw))+Math.abs(d.length*Math.sin(yaw));
   const length=Math.abs(d.length*Math.cos(yaw))+Math.abs(d.width*Math.sin(yaw));
   const car:TrafficWorldCar={id:row.id,type:row.type,group:row.group,member:row.member??0,
    driverStyle:trafficDriverStyle(seed,row.id),
    distance:row.distance,speed:row.stationary?0:row.speed,cruiseSpeed:row.speed,
    targetSpeed:row.stationary?0:row.speed,lateral,targetLateral:lateral,
    width,length,stationary:row.stationary,finished:row.distance>=this.length-15,sideVelocity:0,
     stopLane:row.stopLane,stopSide:row.stopSide,stopYaw:row.stopYaw,incidentId:row.incidentId,blockedFor:0,reverseLeft:0,escapeUntil:0,escapeCooldown:0,indicateUntil:0,laneChangeUntil:0,laneChanges:0,escapeCount:0};
   this.byId.set(car.id,car);return car;
  });
 }
 get(id:number){return this.byId.get(id);}
 private spawn(){
  if(!this.racing||!this.entryTraffic)return;
  const lastRacer=this.users.length?Math.min(...this.users.map(r=>r.distance)):this.length;
  if(lastRacer>1550){this.spawnAt=Infinity;return;}
  while(this.spawnAt<=this.time&&this.cars.length<240){
   const index=this.spawnIndex++,id=this.nextId++;
   const type=randomized(this.seed^0x4ef,index)<.60?0:randomized(this.seed^0x1ae,index)<.55?2:1;
   const laneCenters=roadLaneCenters(this.halfAt(300));
   const lateral=laneCenters[Math.floor(randomized(this.seed^0x331,index)*laneCenters.length)];
   const crowded=this.cars.some(car=>!car.finished&&Math.abs(car.distance-300)<15&&
     Math.abs(car.lateral-lateral)<(car.width+2.6)*.5+.4);
   if(!crowded){
    const shape=this.dimensions(type),speed=coastRaceCruise(this.seed,id,type);
    const car:TrafficWorldCar={id,type,group:10000+index,member:0,distance:300,speed,
     driverStyle:trafficDriverStyle(this.seed,id),
     cruiseSpeed:speed,targetSpeed:speed,lateral,targetLateral:lateral,width:shape.width,length:shape.length,
     stationary:false,finished:false,sideVelocity:0,blockedFor:0,reverseLeft:0,escapeUntil:0,
     escapeCooldown:0,indicateUntil:0,laneChangeUntil:0,laneChanges:0,escapeCount:0};
    this.cars.push(car);this.byId.set(car.id,car);
   }
   this.spawnAt+=4+randomized(this.seed^0x41a,index)*2.5;
  }
 }
 /** Player and rival states are supplied each step; never inferred from visibility. */
 advance(time:number,rivals:readonly RaceRoadUser[]=[],player?:RaceRoadUser){
  if(time<this.time-.0001)throw Error('RaceTrafficWorld time went backwards; reset required');
  if(time<=this.time)return;
  this.users.length=0;for(const r of rivals)if(!r.finished)this.users.push(r);
  if(player&&!player.finished)this.users.push(player);
  let remaining=time-this.time;
  // Bound recovery after tab suspension; long jumps are still simulated, not teleported.
  while(remaining>1e-7){
   const dt=Math.min(.12,remaining);
   this.time+=dt;remaining-=dt;
   this.spawn();
   if(this.time>=this.decisionAt){this.decide();this.decisionAt=this.time+.16;}
   const current=this.sorted;
   for(const car of current){
    if(car.stationary||car.finished)continue;
    if(car.reverseLeft>0){
     car.reverseLeft=Math.max(0,car.reverseLeft-dt);
     car.distance=Math.max(0,car.distance-5*dt);
     car.speed=0;
     if(car.reverseLeft===0)car.indicateUntil=this.time+.35;
     continue;
    }
    car.speed=approachTrafficSpeed(car.speed,car.targetSpeed,dt);
    const canSteer=this.time>=car.indicateUntil;
    const lateralRate=car.escapeUntil>this.time?5.7:
      this.racing?TRAFFIC_DRIVER_PROFILES[car.driverStyle].laneSpeed:3.7;
    if(canSteer)car.lateral=approach(car.lateral,car.targetLateral,
      (Math.abs(car.sideVelocity)>.3?1.2:lateralRate)*dt);
    if(Math.abs(car.sideVelocity)>.01){
     const half=this.halfAt(Math.min(this.length-1,Math.max(0,car.distance)));
     car.lateral=clamp(car.lateral+car.sideVelocity*dt,-half+car.width*.5,half-car.width*.5);
     car.sideVelocity*=Math.exp(-dt*2.5);
    }
    car.distance+=car.speed*dt;
    if(car.distance>=this.length-15){car.finished=true;continue;}
    if(car.targetSpeed<5&&car.speed<4&&this.time>=car.escapeUntil)car.blockedFor+=dt;
    else if(car.targetSpeed>8||car.speed>8)car.blockedFor=0;
    if(car.blockedFor>(this.racing?TRAFFIC_DRIVER_PROFILES[car.driverStyle].reverseAfter:2.1)
     &&this.time>car.escapeCooldown){
     const lanes=roadLaneCenters(this.halfAt(car.distance));
     const lane=nearestTrafficLane(car.lateral,lanes);
     const dir=randomized(this.seed^0x3af,car.id+Math.floor(this.time))<.5?-1:1;
     const target=lanes[lane+dir]??lanes[lane-dir]??lanes[lane];
     if(target!==car.lateral){
      car.targetLateral=target;car.reverseLeft=.75;car.escapeCount++;
      car.escapeUntil=this.time+3.3;car.escapeCooldown=this.time+10;car.laneChangeUntil=this.time+3.3;
     }
     car.blockedFor=0;
    }
   }
   // The source for distance/width/headway is the whole race, NOT the render pool.
   // Resolve in road order so a follower never tunnels through a stalled car.
   for(let i=0;i<current.length;i++){
    const car=current[i];if(car.stationary||car.finished)continue;
    let nearest:TrafficWorldCar|RaceRoadUser|undefined;
    for(let j=i-1;j>=0;j--){
     const lead=current[j];if(lead.finished||lead.distance<=car.distance||lead.distance-car.distance>40)continue;
     if(Math.abs(lead.lateral-car.lateral)>(lead.width+car.width)*.5+.16)continue;
     if(!nearest||lead.distance<nearest.distance)nearest=lead;
    }
    for(const lead of this.users)if(lead.distance>car.distance&&lead.distance-car.distance<40
      &&Math.abs(lead.lateral-car.lateral)<(lead.width+car.width)*.5+.16
      &&(!nearest||lead.distance<nearest.distance))nearest=lead;
    if(nearest&&car.escapeUntil<=this.time) {
     const safe=trafficStopBeforeLeader(car,nearest);
     if(safe<car.distance){car.distance=safe;car.speed=Math.min(car.speed,nearest.speed);}
    }
   }
  }
 }

 /** Sample only nearby entries in the sorted road-space index; never create
  * meshes or scan the full race for each candidate lane. */
 private laneSpace(car:TrafficWorldCar,ordered:readonly TrafficWorldCar[],
  index:number,lateral:number,lookAhead:number,rearRange:number){
  let front=Infinity,frontSpeed=car.cruiseSpeed,rear=Infinity;
  const scan=(other:TrafficWorldCar|RaceRoadUser)=>{
   if(other.id===car.id||'finished'in other&&other.finished)return;
   if(Math.abs(other.lateral-lateral)>(car.width+other.width)*.5+.28)return;
   const delta=other.distance-car.distance;
   const gap=Math.max(0,Math.abs(delta)-(car.length+other.length)*.5);
   if(delta>=0&&gap<front){front=gap;frontSpeed=other.speed;}
   else if(delta<0&&gap<rear)rear=gap;
  };
  for(let j=index-1;j>=0;j--){
   const other=ordered[j];if(other.distance-car.distance>lookAhead+12)break;
   scan(other);
  }
  for(let j=index+1;j<ordered.length;j++){
   const other=ordered[j];if(car.distance-other.distance>rearRange+12)break;
   scan(other);
  }
  for(const user of this.users)if(Math.abs(user.distance-car.distance)<=lookAhead+12
    ||Math.abs(user.distance-car.distance)<=rearRange+12)scan(user);
  return {front,frontSpeed,rear};
 }
 private decide(){
  const ordered=this.sorted;ordered.length=0;
  for(const car of this.cars)if(!car.finished)ordered.push(car);
  ordered.sort((a,b)=>b.distance-a.distance||a.id-b.id);
  for(let i=0;i<ordered.length;i++){
   const car=ordered[i];if(car.stationary)continue;
   const lanes=roadLaneCenters(this.halfAt(Math.min(this.length-1,Math.max(0,car.distance))));
   let nearest:TrafficWorldCar|RaceRoadUser|undefined;
   for(let j=i-1;j>=0;j--){
    const lead=ordered[j];if(lead.distance-car.distance>300)break;
    if(Math.abs(lead.lateral-car.lateral)>(lead.width+car.width)*.5+.15)continue;
    if(!nearest||lead.distance<nearest.distance)nearest=lead;
   }
   for(const lead of this.users)if(lead.distance>car.distance&&lead.distance-car.distance<=300
    &&Math.abs(lead.lateral-car.lateral)<(lead.width+car.width)*.5+.15
    &&(!nearest||lead.distance<nearest.distance))nearest=lead;
   const needPass=!!nearest&&nearest.distance-car.distance<Math.min(190,55+Math.max(0,car.speed-nearest.speed)*4.5)
     &&(nearest.speed<car.cruiseSpeed-3||nearest.stationary);
   if(this.racing){
    const profile=TRAFFIC_DRIVER_PROFILES[car.driverStyle];
    if(car.reverseLeft>0||car.escapeUntil>this.time){
     // A backing/escaping driver owns its maneuver until finished.
     car.targetSpeed=car.cruiseSpeed;continue;
    }
    if(this.time>car.laneChangeUntil&&Math.abs(car.targetLateral-car.lateral)<.3){
     const lane=nearestTrafficLane(car.lateral,lanes);
     const current=this.laneSpace(car,ordered,i,car.lateral,profile.lookAhead,profile.rearClearance);
     const slower=current.frontSpeed<car.cruiseSpeed-profile.speedGap;
     if(slower&&current.front<profile.lookAhead){
      let choice=-1,improvement=profile.minimumGain;
      const prefer=randomized(this.seed^0x7ab,car.id+Math.floor(this.time/3))<.5?-1:1;
      for(const dir of [prefer,-prefer]){
       const candidate=lane+dir;if(candidate<0||candidate>=lanes.length)continue;
       const opportunity=this.laneSpace(car,ordered,i,lanes[candidate],
        profile.lookAhead+55,profile.rearClearance+20);
       // Only change if the adjacent lane is genuinely freer; the highest
       // risk-tolerance style can cut close behind, but not THROUGH a car.
       if(opportunity.rear<profile.rearClearance
         ||opportunity.front<Math.max(11,current.front+profile.minimumGain))continue;
       const gain=Math.min(opportunity.front,profile.lookAhead+55)-current.front;
       if(gain>improvement){improvement=gain;choice=candidate;}
      }
      if(choice>=0){
       car.targetLateral=lanes[choice];car.laneChanges++;car.indicateUntil=this.time+profile.signalDelay;
       car.laneChangeUntil=this.time+profile.laneCooldown;
      }
     }
    }
   }else if(needPass){
    const lane=nearestTrafficLane(car.lateral,lanes);
    const prefer=randomized(this.seed,car.id)<.5?-1:1;
    for(const dir of [prefer,-prefer]){
     const target=lanes[lane+dir];if(target===undefined)continue;
     const conflict=[...ordered,...this.users].some(other=>other.id!==car.id&&!('finished'in other&&other.finished)
       &&Math.abs(other.lateral-target)<(car.width+other.width)*.5+.7
       &&other.distance>car.distance-22&&other.distance<car.distance+45);
     if(conflict)continue;
     const free=lanes.filter(x=>[...ordered,...this.users].every(other=>
       other.id===car.id||Math.abs(other.distance-car.distance)>28
       ||Math.abs(other.lateral-x)>(car.width+other.width)*.5+.5));
     if(free.length<=1&&free.some(x=>x===target))continue;
     car.targetLateral=target;break;
    }
   }
   // Follow when no viable bypass exists; same physics near and far.
   car.targetSpeed=trafficFollowingTarget(car,nearest??null,car.cruiseSpeed);
  }
 }
 /** Merge actual visible body changes (including collisions) into the race truth. */
 adopt(id:number,distance:number,speed:number,lateral:number){
  const car=this.byId.get(id);if(!car||car.finished)return;
  car.distance=Math.max(0,distance);car.speed=Math.max(0,speed);car.lateral=lateral;
  car.targetLateral=lateral; // The next global lane decision may change it.
 }
 forceContact(id:number,slowdown:number,sideSpeed:number){
  const c=this.byId.get(id);if(!c||c.finished||c.stationary)return;
  c.speed=Math.max(0,c.speed*slowdown);
  c.sideVelocity=clamp(c.sideVelocity+sideSpeed,-12,12);
 }
 impact(id:number,speed:number,lateral:number){
  const c=this.byId.get(id);if(!c||c.finished)return;
  c.speed=Math.max(0,speed);c.lateral=lateral;c.targetLateral=lateral;
 }
 /** Caller can retire only finished participants or traffic behind the last racer. */
 obstacles(center:number,radius:number){
  const result:TrafficWorldCar[]=[];
  for(const car of this.cars)if(!car.finished&&Math.abs(car.distance-center)<=radius)result.push(car);
  return result;
 }
 snapshot(){
  return {time:this.time,decisionAt:this.decisionAt,
    spawnAt:Number.isFinite(this.spawnAt)?this.spawnAt:null,
    spawnIndex:this.spawnIndex,nextId:this.nextId,
    cars:this.cars.map(c=>({...c}))};
 }
 restore(saved:ReturnType<RaceTrafficWorld['snapshot']>){
  if(!saved||!Number.isFinite(saved.time)||!Number.isFinite(saved.decisionAt)
    ||!Array.isArray(saved.cars)||saved.cars.length>240
    ||!Number.isInteger(saved.spawnIndex)||!Number.isInteger(saved.nextId)
    ||saved.cars.some(c=>!Number.isInteger(c.id)||!Number.isFinite(c.distance)
      ||!Number.isFinite(c.lateral)||!Number.isFinite(c.speed)))
    throw Error('Invalid traffic checkpoint');
  this.time=saved.time;
  // The sorted road-order index is ephemeral; rebuild it on the first resumed tick.
  this.decisionAt=saved.time;
  this.spawnAt=saved.spawnAt===null?Infinity:saved.spawnAt;
  this.spawnIndex=saved.spawnIndex;this.nextId=saved.nextId;
  this.cars.splice(0,this.cars.length,...saved.cars.map(c=>({...c})));
  this.byId.clear();for(const car of this.cars)this.byId.set(car.id,car);
  this.sorted.length=0;this.users.length=0;
 }
 inspect(){return {time:this.time,total:this.cars.length,active:this.cars.filter(c=>!c.finished).length,
  finished:this.cars.filter(c=>c.finished).length,rows:this.cars.map(c=>({id:c.id,distance:c.distance,speed:c.speed,lateral:c.lateral,targetLateral:c.targetLateral,driverStyle:c.driverStyle,laneChanges:c.laneChanges,escapeCount:c.escapeCount,blockedFor:c.blockedFor,reverseLeft:c.reverseLeft,escapeUntil:c.escapeUntil,stationary:!!c.stationary,finished:c.finished}))};}
}
