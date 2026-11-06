import type {DrivingState} from './handling';
import {coastBarrierStyle,coastBarrierStoneAt,coastBarrierClearance} from './coast-layout';
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
  const first=Math.max(0,Math.ceil(from/12)*12);
  for(let slot=first;slot<=to;slot+=12){
   // The remote countryside has no stones; town covers have no barrier.
   if(coastBarrierStyle(slot,1)!=='block')continue;
   const stone=coastBarrierStoneAt(slot,1);
   if(!this.sceneryReady(stone.d))continue;
   const x=this.halfAt(stone.d)+coastBarrierClearance(stone.d,1);
   const width=this.carHalfWidth+.56/2+.06;
   const length=this.carHalfLength+stone.length*.5+.06;
   const contact=sweptContact(
    previous.lateral-x,previous.distance-stone.d,
    state.lateral-x,state.distance-stone.d,width,length,
   );
   if(!contact)continue;
   // Continuous touching one concrete stone is ONE collision episode, even
   // when the driver holds steering into the block for several frames.
   if(this.recentSlot===slot&&time-this.lastHitTime<1.25)continue;
   this.recentSlot=slot;this.lastHitTime=time;
   const approach=Math.max(0,(state.lateral-previous.lateral)/dt);
   const severity=Math.min(1,Math.max(.22,
    state.speed/125*.55+approach/13*.35));
   this.impacts++;
   this.yaw=.12*severity;
   this.roll=.075*severity;
   this.flash=.20;
   state.speed*=1-(.11+.28*severity);
   state.lateral=Math.min(state.lateral,x-width+.02);
   state.lateralRate=Math.min(0,state.lateralRate);
   state.corridorSide=0;
   return {distance:stone.d,lateral:x,severity,slot};
  }
 }
 inspect(){return {impacts:this.impacts,lastSlot:this.recentSlot,yaw:this.yaw,roll:this.roll,flash:this.flash};}
}
