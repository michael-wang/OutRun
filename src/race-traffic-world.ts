import {approachTrafficSpeed,roadLaneCenters,nearestTrafficLane,plannedTrafficLateral,trafficFollowingTarget,trafficStopBeforeLeader} from './traffic-flow';
import type {TrafficSlot} from './traffic-flow';

/** Course-wide traffic truth. Rendering/streaming are only consumers of this state.
 * A racer cannot drive into an easier world by leaving the player's camera. */
export interface TrafficWorldRecipe {
 id:number;type:number;distance:number;speed:number;group:number;member?:number;
 stationary?:boolean;stopSide?:number;stopLane?:number;
}
export interface TrafficWorldCar extends TrafficSlot {
 type:number;cruiseSpeed:number;targetSpeed:number;targetLateral:number;
 width:number;group:number;member:number;finished:boolean;sideVelocity:number;
}
export interface RaceRoadUser extends TrafficSlot {width:number;finished?:boolean}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(v,b));
const approach=(from:number,to:number,step:number)=>from+clamp(to-from,-step,step);
const randomized=(seed:number,id:number)=>{
 let n=(seed^Math.imul(id+1,0x9e3779b1))>>>0;
 n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);
 return ((n^(n>>>16))>>>0)/4294967296;
};
export function breakdownLaneLateral(lane:number|undefined,side:number|undefined,half:number){
 const lanes=roadLaneCenters(half);
 if(lane!==undefined)return lanes[clamp(lane,0,lanes.length-1)];
 return (side??1)*(half-1.75);
}
export class RaceTrafficWorld {
 readonly cars:TrafficWorldCar[];
 private readonly byId=new Map<number,TrafficWorldCar>();
 private time=0;
 private decisionAt=0;
 private readonly sorted:TrafficWorldCar[]=[];
 private readonly users:RaceRoadUser[]=[];
 constructor(recipes:readonly TrafficWorldRecipe[],private seed:number,
  private length:number,private halfAt:(distance:number)=>number,
  private dimensions:(type:number)=>{width:number;length:number}){
  this.cars=recipes.map(row=>{
   const half=this.halfAt(row.distance);
   const lateral=row.stationary
    ?breakdownLaneLateral(row.stopLane,row.stopSide,half)
    :plannedTrafficLateral(seed,row.group,row.member??0,half);
   const d=this.dimensions(row.type);
   const car:TrafficWorldCar={id:row.id,type:row.type,group:row.group,member:row.member??0,
    distance:row.distance,speed:row.stationary?0:row.speed,cruiseSpeed:row.speed,
    targetSpeed:row.stationary?0:row.speed,lateral,targetLateral:lateral,
    width:d.width,length:d.length,stationary:row.stationary,finished:row.distance>=length-15,sideVelocity:0};
   this.byId.set(car.id,car);return car;
  });
 }
 get(id:number){return this.byId.get(id);}
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
   if(this.time>=this.decisionAt){this.decide();this.decisionAt=this.time+.16;}
   const current=this.sorted;
   for(const car of current){
    if(car.stationary||car.finished)continue;
    car.speed=approachTrafficSpeed(car.speed,car.targetSpeed,dt);
    car.lateral=approach(car.lateral,car.targetLateral,Math.abs(car.sideVelocity)>.3?1.2*dt:3.7*dt);
    if(Math.abs(car.sideVelocity)>.01){
     const half=this.halfAt(Math.min(this.length-1,Math.max(0,car.distance)));
     car.lateral=clamp(car.lateral+car.sideVelocity*dt,-half+car.width*.5,half-car.width*.5);
     car.sideVelocity*=Math.exp(-dt*2.5);
    }
    car.distance+=car.speed*dt;
    if(car.distance>=this.length-15){car.finished=true;continue;}
   }
   // The source for distance/width/headway is the whole race, NOT the render pool.
   // Resolve in road order so a follower never tunnels through a stalled car.
   for(let i=0;i<current.length;i++){
    const car=current[i];if(car.stationary||car.finished)continue;
    let nearest:TrafficWorldCar|RaceRoadUser|undefined;
    for(let j=0;j<i;j++){
     const lead=current[j];if(lead.finished||lead.distance<=car.distance||lead.distance-car.distance>40)continue;
     if(Math.abs(lead.lateral-car.lateral)>(lead.width+car.width)*.5+.16)continue;
     if(!nearest||lead.distance<nearest.distance)nearest=lead;
    }
    for(const lead of this.users)if(lead.distance>car.distance&&lead.distance-car.distance<40
      &&Math.abs(lead.lateral-car.lateral)<(lead.width+car.width)*.5+.16
      &&(!nearest||lead.distance<nearest.distance))nearest=lead;
    if(nearest) {
     const safe=trafficStopBeforeLeader(car,nearest);
     if(safe<car.distance){car.distance=safe;car.speed=Math.min(car.speed,nearest.speed);}
    }
   }
  }
 }
 private decide(){
  const ordered=this.sorted;ordered.length=0;
  for(const car of this.cars)if(!car.finished)ordered.push(car);
  ordered.sort((a,b)=>b.distance-a.distance||a.id-b.id);
  for(let i=0;i<ordered.length;i++){
   const car=ordered[i];if(car.stationary)continue;
   const lanes=roadLaneCenters(this.halfAt(Math.min(this.length-1,Math.max(0,car.distance))));
   let nearest:TrafficWorldCar|RaceRoadUser|undefined;
   for(let j=0;j<i;j++){
    const lead=ordered[j];if(lead.distance-car.distance>300)break;
    if(Math.abs(lead.lateral-car.lateral)>(lead.width+car.width)*.5+.15)continue;
    if(!nearest||lead.distance<nearest.distance)nearest=lead;
   }
   for(const lead of this.users)if(lead.distance>car.distance&&lead.distance-car.distance<=300
    &&Math.abs(lead.lateral-car.lateral)<(lead.width+car.width)*.5+.15
    &&(!nearest||lead.distance<nearest.distance))nearest=lead;
   const needPass=!!nearest&&nearest.distance-car.distance<Math.min(190,55+Math.max(0,car.speed-nearest.speed)*4.5)
     &&(nearest.speed<car.cruiseSpeed-3||nearest.stationary);
   if(needPass){
    const lane=nearestTrafficLane(car.lateral,lanes);
    const prefer=randomized(this.seed,car.id)<.5?-1:1;
    for(const dir of [prefer,-prefer]){
     const target=lanes[lane+dir];if(target===undefined)continue;
     const conflict=[...ordered,...this.users].some(other=>other.id!==car.id&&!('finished'in other&&other.finished)
       &&Math.abs(other.lateral-target)<(car.width+other.width)*.5+.7
       &&other.distance>car.distance-22&&other.distance<car.distance+45);
     if(conflict)continue;
     // Never deliberately block every lane alongside an existing traffic wall.
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
 inspect(){return {time:this.time,total:this.cars.length,active:this.cars.filter(c=>!c.finished).length,
  finished:this.cars.filter(c=>c.finished).length,rows:this.cars.map(c=>({id:c.id,distance:c.distance,speed:c.speed,lateral:c.lateral,stationary:!!c.stationary,finished:c.finished}))};}
}
