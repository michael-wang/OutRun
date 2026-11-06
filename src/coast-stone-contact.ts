import type {DrivingState} from './handling';
import {coastBarrierStyle,coastBarrierStoneAt,coastBarrierRockAt,coastBarrierClearance} from './coast-layout';
import {sweptContact} from './traffic-impact';

export interface CoastStoneHit {
 distance:number;
 lateral:number;
 severity:number;
 /** 12m absolute-distance marker slot: identical to the visible instanced block. */
 slot:number;
}

/** Collision with EACH individual low concrete stone, not an invisible
 * continuous highway wall. Stones and render use the same 12m slot, sampled
 * dimensions, jitter, side and halfAt, so gaps are genuinely passable.
 *
 * Only a handful of nearby slots are tested per simulation tick. Swept
 * contact catches fast (>300km/h) approach and a 12m frame jump without
 * 1m collision substeps. Never collide before the scenery is actually ready.
 */
export class CoastStoneContact {
 impacts=0;yaw=0;roll=0;flash=0;
 private recentSlot=-1;
 private lastHitTime=-Infinity;
 constructor(
  private readonly halfAt:(d:number)=>number,
  private readonly carHalfWidth:number,
  private readonly carHalfLength:number,
  private readonly sceneryReady:(d:number)=>boolean=()=>true,
 ){}
 reset(){
  this.impacts=0;this.yaw=this.roll=this.flash=0;
  this.recentSlot=-1;this.lastHitTime=-Infinity;
 }
 update(state:DrivingState,previous:{distance:number;lateral:number},dt:number,time:number):CoastStoneHit|undefined{
  const decay=Math.exp(-Math.max(0,dt)/.2);
  this.yaw*=decay;this.roll*=decay;this.flash=Math.max(0,this.flash-dt);
  if(!(dt>0))return;
  const from=Math.max(0,Math.min(previous.distance,state.distance)-this.carHalfLength-4);
  const to=Math.max(previous.distance,state.distance)+this.carHalfLength+4;
  // Existing 12m concrete markers AND individual 33m sea-side boulders
  // share a small swept collision check. No invisible wall in their gaps.
  type Target={slot:number;side:-1|1;d:number;x:number;width:number;length:number;kind:'stone'|'rock'};
  const targets:Target[]=[];
  for(let slot=Math.max(0,Math.ceil(from/12)*12);slot<=to;slot+=12){
   for(const side of [-1,1] as const){
    if(coastBarrierStyle(slot,side)!=='block')continue;
    const stone=coastBarrierStoneAt(slot,side);
    targets.push({slot:slot*2+(side>0?1:0),side,d:stone.d,
     x:side*(this.halfAt(stone.d)+coastBarrierClearance(stone.d,side)),
     width:.56,length:stone.length,kind:'stone'});
   }
  }
  for(let slot=Math.max(0,Math.ceil(from/33)*33);slot<=to;slot+=33){
   if(coastBarrierStyle(slot,-1)!=='rock')continue;
   const b=coastBarrierRockAt(slot);
   targets.push({slot:100000+slot,side:-1,d:b.d,
    x:-(this.halfAt(b.d)+b.offset),width:b.width,length:b.length,kind:'rock'});
  }
  for(const target of targets){
   if(!this.sceneryReady(target.d))continue;
   const halfW=this.carHalfWidth+target.width*.5+.06;
   const halfL=this.carHalfLength+target.length*.5+.06;
   const contact=sweptContact(
    previous.lateral-target.x,previous.distance-target.d,
    state.lateral-target.x,state.distance-target.d,halfW,halfL,
   );
   if(!contact)continue;
   if(this.recentSlot===target.slot&&time-this.lastHitTime<1.25)continue;
   this.recentSlot=target.slot;this.lastHitTime=time;
   const outward=Math.max(0,(state.lateral-previous.lateral)*target.side/dt);
   const severity=Math.min(1,Math.max(.22,
    state.speed/125*.55+outward/13*.35));
   this.impacts++;
   this.yaw=target.side*.12*severity;
   this.roll=target.side*.075*severity;
   this.flash=.20;
   state.speed*=1-(.11+.28*severity);
   state.lateral=target.side>0
    ?Math.min(state.lateral,target.x-halfW+.02)
    :Math.max(state.lateral,target.x+halfW-.02);
   state.lateralRate=target.side>0?Math.min(0,state.lateralRate):Math.max(0,state.lateralRate);
   state.corridorSide=0;
   return {distance:target.d,lateral:target.x,severity,slot:target.slot};
  }
 }
 inspect(){return {impacts:this.impacts,lastSlot:this.recentSlot,yaw:this.yaw,roll:this.roll,flash:this.flash};}
}
