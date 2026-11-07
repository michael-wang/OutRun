import * as THREE from 'three';
import type {createBlondeBob} from './hero-groom';
export type Traveler={body:THREE.Group,head:THREE.Group,arms:THREE.Group[],hair?:ReturnType<typeof createBlondeBob>};
/** Small presentation pivots, driven only by observed travel and applied input. */
export function createOccupantMotion(people:Traveler[],wheel:THREE.Mesh){
 let phase=0,wind=0,turn=0,pitch=0,lastSpeed=0;
 let sway=0,swayRate=0,tipSway=0,flutterPhase=0;
 function pose(){
  people.forEach((p,index)=>{
   p.body.rotation.z=turn*(index===0?.08:.12);p.body.rotation.x=pitch;
   p.head.rotation.y=-turn*.12;p.head.rotation.z=-turn*.035;
   p.arms.forEach((arm,i)=>{
    // Driver's left elbow stays planted on the door, even in a long sweeper;
    // only the right steering arm and passenger arms react freely.
    const resting=index===0&&i===1;
    arm.rotation.z=turn*(resting?.007:index===0?.045:.02);
    arm.rotation.x=pitch*(resting?.08:.25)+(resting?0:index===0?turn*.025:0);
   });
   p.hair?.sync(wind,sway,tipSway,flutterPhase);
  });
  wheel.rotation.z=-turn*.32;
 }
 return {advance(ds:number,input:number,dt:number,rightAcceleration=0){
  if(dt<=0)return;phase+=dt;const speed=Math.abs(ds)/dt,blend=1-Math.exp(-dt/.16);
  wind+=(THREE.MathUtils.smoothstep(speed,0,84)-wind)*blend;
  flutterPhase+=dt*(4.5+5.5*wind);
  // Positive model X points to the passenger's left. In a right turn
  // inertia carries loose hair that way, with the ends following last.
  const load=THREE.MathUtils.clamp(rightAcceleration/12,-1,1)*Math.min(speed/14,1);
  swayRate=(swayRate+dt*82*(load-sway))/(1+10*dt+82*dt*dt);
  sway+=swayRate*dt;
  tipSway+=(sway-tipSway)*(1-Math.exp(-dt/.105));
  turn+=(THREE.MathUtils.clamp(input,-1,1)-turn)*blend;
  pitch+=(THREE.MathUtils.clamp(-(speed-lastSpeed)/dt*.0015,-.045,.045)-pitch)*blend;
  lastSpeed=speed;pose();
 },reset(){phase=wind=turn=pitch=lastSpeed=sway=swayRate=tipSway=flutterPhase=0;pose();},
 inspect:()=>({wind,turn,pitch,phase,sway,tipSway,people:people.map(p=>({
  lean:p.body.rotation.z,head:p.head.rotation.y,hair:p.hair?.locks.map(l=>({back:l.rotation.x,side:l.rotation.z}))??[],
 }))})};
}
