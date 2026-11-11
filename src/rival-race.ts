import {advancePowertrain,createPowertrain} from './powertrain';
import {MAX_SPEED} from './handling';
import {DEFAULT_PACE,effectivePace} from './pace';
import {sweptContact,type TrafficCollision} from './traffic-impact';
import {rearImpactResponse} from './arcade-contact';

export interface DriverProfile {
  anticipation:number; reactionTime:number; overtaking:number; aggression:number; riskTolerance:number;
}
export interface CarSpec {
  lowForce:number; midForce:number; highForce:number; topSpeed:number; brake:number; cornerGrip:number;
  width:number; length:number;
}
export interface RacerEntry {
  id:string; name:string; paint:number; gridSide:number; gridOffset:number; gridLaneOffset?:number; driver:DriverProfile; car:CarSpec;
}
// All eight entrants (player + seven rivals) use the same physical powertrain.
// Everyone starts ahead of the player: two cars at +12m, three at +27m and two at +42m.
// Each row has distinct lanes, leaving a fair chase from eighth place.
const clubDriver:DriverProfile={anticipation:2.6,reactionTime:.17,overtaking:.76,aggression:.32,riskTolerance:.48};
export const equalRiviera:CarSpec={lowForce:1,midForce:1,highForce:1,topSpeed:MAX_SPEED,brake:34,cornerGrip:22,width:2.25,length:4.9};
/** Public driver names follow A → Z, then wrap to A for later expansion. */
export const RIVAL_DRIVER_NAMES = ["Aaron","Bruno","Cody","Damon","Ethan","Felix","Gavin","Henry","Ivan","Jason","Kevin","Leo","Mason","Noah","Oscar","Peter","Quinn","Ryan","Sean","Theo","Uma","Victor","Will","Xavier","Yuri","Zane"] as const;
export function rivalDriverName(index:number):string {
  const slot=((Math.trunc(index)%RIVAL_DRIVER_NAMES.length)+RIVAL_DRIVER_NAMES.length)%RIVAL_DRIVER_NAMES.length;
  return RIVAL_DRIVER_NAMES[slot];
}
export const raceEntries:RacerEntry[]=[
  {id:'RIVAL 1',name:rivalDriverName(0),paint:0xcbd0d3,gridSide:-1,gridLaneOffset:-2,gridOffset:12,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 2',name:rivalDriverName(1),paint:0xffbe16,gridSide:1,gridLaneOffset:1,gridOffset:12,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 3',name:rivalDriverName(2),paint:0x52b9e4,gridSide:-1,gridLaneOffset:-2,gridOffset:27,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 4',name:rivalDriverName(3),paint:0x19a478,gridSide:1,gridLaneOffset:0,gridOffset:27,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 5',name:rivalDriverName(4),paint:0xe75b68,gridSide:1,gridLaneOffset:2,gridOffset:27,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 6',name:rivalDriverName(5),paint:0xee8737,gridSide:-1,gridLaneOffset:-1,gridOffset:42,driver:clubDriver,car:equalRiviera},
  {id:'RIVAL 7',name:rivalDriverName(6),paint:0xa17ad6,gridSide:1,gridLaneOffset:1,gridOffset:42,driver:clubDriver,car:equalRiviera},
];
export interface RaceBody {distance:number; lateral:number; speed:number}
export interface Obstacle extends RaceBody {id:string; type?:number; width:number; length:number}
export interface RaceRoad {curvature:number; grade:number; half:number}
/** Stable internal IDs are independent from player-facing English driver names. */
export interface RaceStanding {
 id:string; name:string; rank:number; distance:number;
 finishTime:number|null; isPlayer:boolean;
}
type Behavior='加速'|'煞車'|'跟車'|'超車'|'避障'|'防守'|'完賽';
export class RivalState {
  distance=0; lateral=0; speed=0; previousDistance=0; previousLateral=0; lateralRate=0;
  lane=0; targetLane=0; targetX=0; targetSpeed=0; half=7; grade=0; curvature=0;
  finishTime:number|null=null; behavior:Behavior='加速'; nextDecision=0; lastDecision=0;
  obstacles:Obstacle[]=[]; nearest='—'; gap=Infinity; braking=false; slip=0; impulse=0; laneHold=0;
  readonly gearbox=createPowertrain();
  constructor(readonly entry:RacerEntry){}
}
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export const worldSpeed=(v:number)=>v*effectivePace(v,DEFAULT_PACE);
/** Emission comes from actual stressful maneuvers, not a continuously-curved road.
 * Ordinary high-speed cruising/gradual cornering must never smoke indefinitely. */
export function rivalSkidDemand(r:Pick<RivalState,'speed'|'targetSpeed'|'braking'|'lateralRate'|'targetX'|'lateral'|'impulse'>):number {
 const contact=clamp((Math.abs(r.impulse)-.28)/2.8,0,.78);
 const hardBrake=r.braking&&r.speed>38&&r.speed-r.targetSpeed>8
  ?clamp((r.speed-r.targetSpeed-8)/23,0,.55):0;
 const activeSwerve=clamp((Math.abs(r.lateralRate)-3)/1.3,0,.45)*
  clamp((Math.abs(r.targetX-r.lateral)-1.5)/2,0,1);
 return Math.max(contact,hardBrake,activeSwerve);
}
const laneX=(lane:number,half:number)=>-half+(lane+.5)*(2*half/laneCount(half));
const laneCount=(half:number)=>Math.max(2,Math.round(2*half/3.5));
const nearestLane=(x:number,half:number)=>clamp(Math.floor((x+half)/(2*half)*laneCount(half)),0,laneCount(half)-1);
export function crossingTime(previous:number,next:number,line:number,time:number,dt:number){
  if(previous>=line||next<line)return null;
  return time+dt*(line-previous)/(next-previous);
}
export class RivalRace {
  rivals:RivalState[]=[];
  time=0; playerFinish:number|null=null;
  // When a faster background traffic car reaches a racer's rear bumper, keep
  // its authoritative traffic trajectory behind that racer between decisions.
  yieldTraffic?:(row:Obstacle,distance:number,speed:number,time:number)=>void;
  private contactTimes=new Map<string,number>();
  private trafficContacts=new Map<string,number>();
  impactTraffic?:(row:Obstacle,severity:number,side:number)=>void;
  constructor(readonly finish:number,private road:(d:number)=>RaceRoad,
    private traffic:(d:number,t:number,radius:number)=>Obstacle[],private entries=raceEntries){}
  reset(start:number){
    this.time=0;this.playerFinish=null;this.contactTimes.clear();this.trafficContacts.clear();
    const gridBase=Math.min(start,Math.max(0,this.finish-90));
    this.rivals=this.entries.map(entry=>{
      const r=new RivalState(entry);
      r.distance=gridBase+entry.gridOffset;
      r.half=this.road(r.distance).half;
      const count=laneCount(r.half),middle=Math.floor(count/2);
      r.targetLane=r.lane=clamp(middle+(entry.gridLaneOffset??entry.gridSide*(Math.floor(count/2))),0,count-1);
      r.lateral=r.targetX=laneX(r.lane,r.half);
      r.previousDistance=r.distance;r.previousLateral=r.lateral;
      return r;
    });
  }
  private decide(r:RivalState,player:RaceBody){
    const {car,driver}=r.entry;
    const road=this.road(r.distance),travel=worldSpeed(r.speed);
    r.grade=road.grade;r.half=road.half;r.curvature=road.curvature;
    r.lane=nearestLane(r.lateral,r.half);
    const horizon=Math.max(60,travel*driver.anticipation);
    let corner=car.topSpeed,apex=road.curvature;
    for(let i=0;i<=6;i++){
      const lead=horizon*i/6;
      const sample=i?this.road(Math.min(this.finish,r.distance+lead)):road;
      const limit=Math.sqrt(car.cornerGrip/Math.max(.00001,Math.abs(sample.curvature)));
      const indicated=limit/effectivePace(Math.min(r.speed,limit),DEFAULT_PACE);
      const entry=Math.sqrt(indicated*indicated+2*car.brake*lead/DEFAULT_PACE);
      if(entry<corner){corner=entry;apex=sample.curvature;}
    }
    r.obstacles=this.traffic(r.distance,this.time,horizon+60);
    const cars:Obstacle[]=[...r.obstacles];
    if(this.playerFinish===null)cars.push({...player,id:'PLAYER',width:2.3,length:4.9,speed:worldSpeed(player.speed)});
    for(const other of this.rivals)if(other!==r&&other.finishTime===null){
      cars.push({id:other.entry.id,distance:other.distance,lateral:other.lateral,speed:worldSpeed(other.speed),width:other.entry.car.width,length:other.entry.car.length});
    }
    const laneWidth=2*r.half/laneCount(r.half);
    const count=laneCount(r.half);
    const space=Array.from({length:count},()=>({front:Infinity,speed:Infinity,rear:Infinity,id:'—',blocked:false}));
    for(const carAhead of cars){
      const delta=carAhead.distance-r.distance;
      const gap=Math.abs(delta)-(car.length+carAhead.length)*.5;
      for(let lane=0;lane<count;lane++){
        if(Math.abs(laneX(lane,r.half)-carAhead.lateral)>(car.width+carAhead.width)*.5+.28)continue;
        const s=space[lane];
        if(delta>=0&&gap<s.front){s.front=gap;s.speed=carAhead.speed;s.id=carAhead.id;}
        if(delta<0)s.rear=Math.min(s.rear,gap);
        const closing=delta>=0?travel-carAhead.speed:carAhead.speed-travel;
        if(gap<4+Math.max(0,closing)*(.9+.5*(1-driver.riskTolerance)))s.blocked=true;
      }
    }
    const current=space[r.lane],desiredGap=6+travel*(.46-driver.riskTolerance*.2);
    const passing=current.front<desiredGap+Math.max(0,travel-current.speed)*driver.anticipation+25&&current.speed<worldSpeed(corner)-1;
    const defending=!passing&&cars.some(c=>(c.id.startsWith('RIVAL')||c.id==='PLAYER')&&
      r.distance>c.distance&&r.distance-c.distance<16&&c.speed>travel+1);
    let lane=clamp(r.targetLane,0,count-1);
    if(lane!==r.lane&&space[lane].blocked)lane=r.lane;
    if(this.time>=r.laneHold&&lane===r.lane){
      let bestScore=0;
      for(let candidate=0;candidate<count;candidate++){
        const side=Math.sign(candidate-r.lane),s=space[candidate];
        if(!side||s.blocked||s.rear<7||s.front<desiredGap*.7)continue;
        const across=space.slice(Math.min(candidate,r.lane)+Number(side>0),Math.max(candidate,r.lane)+Number(side>0));
        if(across.some(strip=>strip.blocked))continue;
        // Reserve the strip already being entered by a neighbouring racer.
        if(this.rivals.some(o=>o!==r&&o.finishTime===null&&Math.abs(o.distance-r.distance)<14&&Math.abs(o.targetX-laneX(candidate,r.half))<laneWidth*.6))continue;
        const inside=side===Math.sign(apex)?1:0;
        const gain=passing?(Math.min(horizon,s.front)-Math.min(horizon,current.front))*driver.overtaking:
          defending&&inside&&Math.abs(apex)>.0008?driver.aggression*20:0;
        const score=gain-Math.abs(candidate-r.lane)*3;
        if(score>bestScore+1){bestScore=score;lane=candidate;}
      }
      if(lane!==r.lane)r.laneHold=this.time+1.05;
    }
    r.targetLane=lane;r.targetX=laneX(lane,r.half);r.gap=current.front;r.nearest=current.id;
    const target=space[lane];
    let limit=corner;
    const following=(s:typeof target)=>{
      if(s.front<desiredGap)return Math.max(0,s.speed+.9*(s.front-desiredGap))/effectivePace(r.speed,DEFAULT_PACE);
      const room=Math.max(0,s.front-desiredGap);
      return Math.sqrt(s.speed*s.speed+2*car.brake*room)/effectivePace(r.speed,DEFAULT_PACE);
    };
    limit=Math.min(limit,following(target));
    if(Math.abs(r.lateral-laneX(r.lane,r.half))<car.width*.88)limit=Math.min(limit,following(current));
    r.targetSpeed=clamp(limit,0,car.topSpeed);
    r.behavior=lane!==r.lane?(current.speed===0?'避障':defending?'防守':'超車'):
      passing?'跟車':r.speed>limit+1?'煞車':'加速';
    r.nextDecision=this.time+driver.reactionTime;r.lastDecision=this.time;
  }
  private move(r:RivalState,dt:number){
    const c=r.entry.car,k=r.speed*3.6;
    const force=k<110?c.lowForce+(c.midForce-c.lowForce)*clamp((k-55)/55,0,1):
      c.midForce+(c.highForce-c.midForce)*clamp((k-185)/55,0,1);
    const gas=r.speed<r.targetSpeed;
    const engine=advancePowertrain(r.gearbox,r.speed,gas,dt);
    r.braking=r.speed>r.targetSpeed+.8;
    // Match the player powertrain, throttle-off drag, braking and grade formula.
    // Only the driver's target-speed decisions may differ from the player.
    const resistance=gas?r.gearbox.roadDrag:3.8;
    const grade=-9.81*r.grade/Math.hypot(1,r.grade);
    r.speed=clamp(r.speed+(engine*force-resistance-r.gearbox.shiftDrag+grade-(r.braking?c.brake:0))*dt,0,c.topSpeed);
    const steer=clamp((r.targetX-r.lateral)*2,-4.2,4.2);
    r.lateralRate+=clamp(steer-r.lateralRate,-7*dt,7*dt);
    r.lateral=clamp(r.lateral+(r.lateralRate+r.impulse)*dt,-r.half+c.width/2,r.half-c.width/2);
    r.impulse*=Math.exp(-dt*3);
    r.distance+=worldSpeed(r.speed)*dt;
    for(const o of r.obstacles){
      const front=o.distance+(this.time-r.lastDecision+dt)*o.speed;
      const length=(c.length+o.length)*.5+.08,width=(c.width+o.width)*.5+.12;
      const limit=front-length;
      if(Math.abs(r.distance-front)<length&&Math.abs(r.lateral-o.lateral)<width&&Math.abs(r.previousLateral-o.lateral)>=width){
        r.lateral=o.lateral+Math.sign(r.previousLateral-o.lateral)*width;r.lateralRate=r.impulse=0;
      }
      if(Math.abs(r.lateral-o.lateral)>=width)continue;
      const previousFront=front-o.speed*dt;
      if(this.yieldTraffic&&o.speed>worldSpeed(r.speed)&&r.previousDistance>=previousFront+length-.02&&r.distance<front+length){
        const time=this.time+dt,safe=r.distance-length-.02,speed=worldSpeed(r.speed);
        this.yieldTraffic(o,safe,speed,time);
        o.distance=safe-(time-r.lastDecision)*speed;o.speed=speed;
      }else if(r.previousDistance<=limit+.01&&r.distance>=limit){
        r.distance=Math.max(r.previousDistance,limit);r.braking=true;
        const key=r.entry.id+'/'+o.id;
        if((this.trafficContacts.get(key)??-10)<this.time-.95){
          this.trafficContacts.set(key,this.time);
          const severity=clamp((worldSpeed(r.speed)-o.speed)/45,.15,.95);
          const response=rearImpactResponse(severity);
          r.speed*=response.trailingSpeedMultiplier;
          const side=r.lateral<=o.lateral?-1:1;
          r.impulse+=side*response.trailingSideSpeed;
          if(o.id.startsWith('T')&&o.speed>1)this.impactTraffic?.(o,severity,-side);
        }
        // Keep a real following gap until a passing lane opens, rather than
        // instantaneously setting the rear car's speed to the front car's.
        r.targetSpeed=Math.min(r.targetSpeed,(o.speed+4)/effectivePace(r.speed,DEFAULT_PACE));
      }
    }
    r.slip=rivalSkidDemand(r);
  }
  step(dt:number,player:RaceBody,oldPlayer:{distance:number;lateral:number}):TrafficCollision|undefined{
    let hit:TrafficCollision|undefined;
    for(const r of this.rivals){
      r.previousDistance=r.distance;r.previousLateral=r.lateral;
      if(r.finishTime!==null)continue;
      if(this.time>=r.nextDecision)this.decide(r,player);
      this.move(r,dt);
    }
    for(let i=0;i<this.rivals.length;i++){
      const r=this.rivals[i];if(r.finishTime!==null)continue;
      for(let j=-1;j<i;j++){
        const other=j<0?undefined:this.rivals[j];
        if(other?other.finishTime!==null:this.playerFinish!==null)continue;
        const b=other??player,old=other?{distance:other.previousDistance,lateral:other.previousLateral}:oldPlayer;
        const dx=r.previousLateral-old.lateral,dz=r.previousDistance-old.distance;
        const w=(r.entry.car.width+(other?.entry.car.width??2.28))*.5;
        const l=(r.entry.car.length+(other?.entry.car.length??4.9))*.5;
        const contact=sweptContact(dx,dz,r.lateral-b.lateral,r.distance-b.distance,w,l);
        if(!contact)continue;
        const side=Math.sign(dx)||1;
        const relative=Math.abs(r.speed-b.speed);
        if(contact.kind==='rear'){
          if(dz<0)r.distance=Math.min(r.distance,b.distance-l-.002);
           else b.distance=Math.min(b.distance,r.distance-l-.002);
        }else r.lateral=b.lateral+side*(w+.002);
        const key=i+'/'+j;
        if((this.contactTimes.get(key)??-10)>this.time-.95)continue;
        this.contactTimes.set(key,this.time);
        const severity=clamp(.15+relative/40,.15,.8);
         const rSide=Math.abs(r.lateral)>r.half-r.entry.car.width*.5-.7?-Math.sign(r.lateral):side;
         if(contact.kind==='rear'){
          const response=rearImpactResponse(severity),rBehind=dz<0;
          r.speed*=rBehind?response.trailingSpeedMultiplier:response.leadingSpeedMultiplier;
          r.impulse=rSide*(rBehind?response.trailingSideSpeed:response.leadingSideSpeed);
          if(other){
           other.speed*=rBehind?response.leadingSpeedMultiplier:response.trailingSpeedMultiplier;
           other.impulse=-rSide*(rBehind?response.leadingSideSpeed:response.trailingSideSpeed);
          }
         }else{
          r.speed*=1-.08*severity;r.impulse=side*(1+severity*2);
          if(other){other.speed*=1-.08*severity;other.impulse=-r.impulse;}
         }
         if(!other)hit={actorId:-100-i,type:0,kind:contact.kind,side:-side,severity,
          playerIsTrailing:contact.kind==='rear'?dz>0:undefined,
          distance:r.distance,lateral:(r.lateral+b.lateral)*.5};
      }
    }
    for(const r of this.rivals)if(r.finishTime===null){
      r.finishTime=crossingTime(r.previousDistance,r.distance,this.finish,this.time,dt);
      if(r.finishTime!==null){r.distance=this.finish;r.speed=0;r.behavior='完賽';}
    }
    if(this.playerFinish===null)this.playerFinish=crossingTime(oldPlayer.distance,player.distance,this.finish,this.time,dt);
    this.time+=dt;
    return hit;
  }
  /** Full seven-rival state is independent of the traffic render pool. */
  snapshot(){
    return {time:this.time,playerFinish:this.playerFinish,
     rivals:this.rivals.map(r=>{
      const {entry,obstacles,...values}=r;
      return {id:entry.id,...values,gearbox:{...r.gearbox}};
     })};
  }
  restore(saved:ReturnType<RivalRace['snapshot']>){
    if(!saved||!Number.isFinite(saved.time)||!Array.isArray(saved.rivals)
       ||saved.rivals.length!==this.rivals.length
       ||saved.rivals.some((r,i)=>r.id!==this.rivals[i].entry.id
           ||!Number.isFinite(r.distance)||!Number.isFinite(r.lateral)
           ||!Number.isFinite(r.speed)||!Number.isInteger(r.gearbox?.gear)))
      throw Error('Invalid rival checkpoint');
    this.time=saved.time;this.playerFinish=saved.playerFinish;
    this.contactTimes.clear();this.trafficContacts.clear();
    this.rivals.forEach((r,i)=>{
      const {id,...values}=saved.rivals[i];
      Object.assign(r,values);
      r.obstacles=[];
      r.nextDecision=this.time;r.lastDecision=this.time;
    });
  }
  /** Finishers lead by actual crossing time. Everyone else is live-ranked by progress. */
  standings(player:RaceBody):RaceStanding[]{
    const rows:Omit<RaceStanding,'rank'>[]=[
      {id:'PLAYER',name:'玩家',distance:player.distance,finishTime:this.playerFinish,isPlayer:true},
      ...this.rivals.map(r=>({id:r.entry.id,name:r.entry.name,distance:r.distance,finishTime:r.finishTime,isPlayer:false})),
    ];
    rows.sort((a,b)=>{
      if(a.finishTime!==null&&b.finishTime!==null)return a.finishTime-b.finishTime||(a.id<b.id?-1:a.id>b.id?1:0);
      if(a.finishTime!==null)return -1;
      if(b.finishTime!==null)return 1;
      return b.distance-a.distance||(a.id<b.id?-1:a.id>b.id?1:0);
    });
    return rows.map((r,i)=>({...r,rank:i+1}));
  }
  rank(distance:number,finishTime:number|null,id:string,player:RaceBody){
    const ahead=(d:number,t:number|null,key:string)=>key!==id&&(t!==null?
      finishTime===null||t<finishTime||t===finishTime&&key<id:finishTime===null&&(d>distance||d===distance&&key<id));
    let rank=1+Number(ahead(player.distance,this.playerFinish,'PLAYER'));
    for(const r of this.rivals)if(ahead(r.distance,r.finishTime,r.entry.id))rank++;
    return rank;
  }
}
