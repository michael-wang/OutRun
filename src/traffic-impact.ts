import type {DrivingState} from './handling';
export interface TrafficCollision {actorId:number;type:number;kind:'side'|'rear';side:number;distance:number;lateral:number;severity:number;relativeSpeed?:number}
/** Short road-space impulse layered after the unchanged steering integrator. */
export class TrafficImpact {
 velocity=0;yaw=0;roll=0;slide=0;flash=0;event?:TrafficCollision;
 reset(){this.velocity=this.yaw=this.roll=this.slide=this.flash=0;this.event=undefined;}
 kick(s:DrivingState,event:TrafficCollision){
  this.event=event;const hard=event.kind==='rear',v=event.severity;
  const heavy=event.type===1||event.type===2;s.speed*=1-(hard?(.18+.4*v)*(heavy?1.08:.9):.04+.16*v);
  this.velocity=event.side*(hard?4+6*v:2.2+3.5*v);
  this.flash=.12+.12*v;
 }
 update(s:DrivingState,dt:number,half:number){
  if(dt<=0)return;const old=s.lateral,decay=Math.exp(-dt/.4);
  if(Math.abs(this.velocity)>.001)s.lateral=Math.max(-half-1.1,Math.min(half+1.1,s.lateral+this.velocity*.4*(1-decay)));
  this.slide=Math.abs(s.lateral-old)/dt;this.velocity*=decay;const follow=1-Math.exp(-dt/.07);this.yaw+=(-Math.max(-.30,Math.min(.30,this.velocity*.065))-this.yaw)*follow;this.roll+=(Math.max(-.12,Math.min(.12,this.velocity*.025))-this.roll)*follow;this.flash=Math.max(0,this.flash-dt);
 }
}

/** Swept point against an expanded vehicle rectangle; catches fast crossings. */
export function sweptContact(x0:number,z0:number,x1:number,z1:number,width:number,length:number){
 let enter=0,exit=1,axis:'side'|'rear'=Math.abs(x0)/width>Math.abs(z0)/length?'side':'rear';
 for(const [a,b,r,label] of [[x0,x1,width,'side'],[z0,z1,length,'rear']] as const){
  const d=b-a;if(Math.abs(d)<1e-9){if(Math.abs(a)>r)return;continue;}
  const lo=Math.min((-r-a)/d,(r-a)/d),hi=Math.max((-r-a)/d,(r-a)/d);
  if(lo>enter){enter=lo;axis=label;}exit=Math.min(exit,hi);if(enter>exit)return;
 }
 if(exit<0||enter>1)return;return {time:enter,kind:axis};
}
