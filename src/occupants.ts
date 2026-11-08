import * as THREE from 'three';
import type {WindGroom} from './hero-groom';
import {CLAP_TIMES,CHEER_END,type Cheer,type passengerArm} from './passenger-cheer';
export type Traveler={body:THREE.Group,head:THREE.Group,arms:ReturnType<typeof passengerArm>[],hair:WindGroom,poseDriverArms?:(turn:number)=>void};
/** Small presentation pivots, driven only by observed travel and applied input. */
export function createOccupantMotion(people:Traveler[]){
 let phase=0,wind=0,turn=0,pitch=0,lastSpeed=0;
 let sway=0,swayRate=0,tipSway=0,flutterPhase=0;
 let cheerTime=-1,nextCheer=0;
 let cheer:Cheer='applause';
 function pose(){
  people.forEach((p,index)=>{
   p.body.rotation.z=turn*(index===0?.08:.12);p.body.rotation.x=pitch;
   p.head.rotation.y=-turn*.12;p.head.rotation.z=-turn*.035;
   if(index===1&&cheer==='wave'&&cheerTime>=0)
    p.head.rotation.y+=.40*THREE.MathUtils.smoothstep(cheerTime,0,.4)*(1-THREE.MathUtils.smoothstep(cheerTime,.88,CHEER_END));
   p.arms.forEach(arm=>{
    arm.root.rotation.z=cheerTime<0?turn*.02:0;
    arm.root.rotation.x=cheerTime<0?pitch*.25:0;
    arm.pose(cheerTime,cheer);
   });
   p.poseDriverArms?.(turn);
   p.hair.sync(wind,sway,tipSway,flutterPhase);
  });
 }
 return {onCleanPass(){
  if(phase<nextCheer)return;
  const roll=Math.random();
  if(roll>=.28)return;
  const wave=nextCheer===0?roll>=.14:cheer==='applause';
  cheer=wave?'wave':'applause';
  nextCheer=phase+14;cheerTime=0;return cheer;
 },advance(ds:number,input:number,dt:number,rightAcceleration=0){
  if(dt<=0)return false;phase+=dt;const speed=Math.abs(ds)/dt,blend=1-Math.exp(-dt/.16);
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
  const before=cheerTime;
  if(cheerTime>=0)cheerTime+=dt;
  const clap=cheer==='applause'&&before>=0&&CLAP_TIMES.some(at=>before<at&&cheerTime>=at);
  if(cheerTime>=CHEER_END)cheerTime=-1;
  lastSpeed=speed;pose();return clap;
 },reset(){phase=wind=turn=pitch=lastSpeed=sway=swayRate=tipSway=flutterPhase=nextCheer=0;cheerTime=-1;pose();},
 inspect:()=>({wind,turn,pitch,phase,sway,tipSway,cheerTime,cheer,people:people.map(p=>({
  lean:p.body.rotation.z,head:p.head.rotation.y,hair:p.hair.locks?.map(l=>({back:l.rotation.x,side:l.rotation.z}))??[],
 }))})};
}
