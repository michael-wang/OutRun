import {CANYON_BEND} from './canyon-identity';
import type {DrivingState} from './handling';
/** Post-step road-space contact response. Steering/handling integration stays unchanged. */
export class GuardrailContact {
 impacts=0;strength=0;yaw=0;roll=0;flash=0;private push=0;private latched=false;
 constructor(readonly halfWidth:number,readonly halfLength:number){}
 reset(){this.impacts=this.strength=this.yaw=this.roll=this.flash=this.push=0;this.latched=false;}
 extent(heading:number){return Math.abs(Math.cos(heading))*this.halfWidth+Math.abs(Math.sin(heading))*this.halfLength+.08;}
 limit(heading:number){return CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-this.extent(heading+this.yaw);}
 update(s:DrivingState,previousDistance:number,previousLateral:number,dt:number,enabled:boolean){
  const decay=Math.exp(-dt/.12);this.yaw*=decay;this.roll*=decay;this.flash=Math.max(0,this.flash-dt);
  s.lateral-=this.push*dt;this.push*=decay;
  const intersects=enabled&&Math.max(previousDistance,s.distance)+this.halfLength>=CANYON_BEND.start&&Math.min(previousDistance,s.distance)-this.halfLength<CANYON_BEND.end;
  if(!intersects){this.latched=false;return 0;}
  const limit=this.limit(s.heading);if(s.lateral<limit-.6&&s.appliedSteer<=0)this.latched=false;
  if(s.lateral<=limit)return 0;
  let impact=0;
  if(!this.latched){
   const outward=Math.max(0,(s.lateral-previousLateral)/Math.max(dt,.001));
   impact=Math.max(.08,Math.min(1,outward/9*s.speed/60));this.strength=impact;this.impacts++;this.latched=true;
   s.speed*=1-(.025+.25*impact);this.push=1+6*impact;this.yaw=.12*impact;this.roll=.07*impact;this.flash=.18;
  }
  s.lateral=Math.min(s.lateral,this.limit(s.heading));s.lateralRate=Math.min(0,s.lateralRate);s.corridorSide=0;
  return impact;
 }
 inspect(heading=0){return {impacts:this.impacts,strength:this.strength,yaw:this.yaw,roll:this.roll,flash:this.flash,latched:this.latched,limit:this.limit(heading)};}
}
