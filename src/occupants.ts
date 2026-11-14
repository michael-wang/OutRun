import * as THREE from 'three';
import type {WindGroom} from './hero-groom';
import type {CabinWindInput} from './cabin-wind';
import {CLAP_TIMES,CHEER_END,type Cheer,type passengerArm} from './passenger-cheer';
import type {createHeroinePerformance,HeroineAction} from './heroine-performance';
export type Traveler={body:THREE.Group,head:THREE.Group,arms:ReturnType<typeof passengerArm>[],hair:WindGroom,performance?:ReturnType<typeof createHeroinePerformance>,smile?:(weight:number)=>void,poseHead?:(rotation:THREE.Euler)=>void,poseDriverArms?:(turn:number)=>void};
/** Small presentation pivots, driven only by observed travel and applied input. */
export function createOccupantMotion(people:Traveler[]){
 let phase=0,wind=0,turn=0,pitch=0,lastSpeed=0;
 let sway=0,swayRate=0,tipSway=0,flutterPhase=0;
 let cheerTime=-1,nextCheer=0;
 let cheer:Cheer='applause';
 let passengerLook=0;
 function pose(time=cheerTime,gesture=cheer){
  people.forEach((p,index)=>{
   p.body.rotation.z=turn*(index===0?.08:.12);p.body.rotation.x=pitch;
   p.head.rotation.set(0,-turn*.12+(index===1?passengerLook:0),-turn*.035);
   if(index===1&&gesture==='wave'&&time>=0)
    p.head.rotation.y+=.40*THREE.MathUtils.smoothstep(time,0,.4)*(1-THREE.MathUtils.smoothstep(time,.88,CHEER_END));
   p.arms.forEach(arm=>{
    arm.root.rotation.z=time<0?turn*.02:0;
    arm.root.rotation.x=time<0?pitch*.25:0;
    arm.pose(time,gesture);
   });
   p.poseDriverArms?.(turn);
   p.poseHead?.(p.head.rotation);
   p.smile?.(.58+(time<0?0:.42*Math.sin(Math.PI*Math.min(time/CHEER_END,1))));
   p.hair.sync(wind,sway,tipSway,flutterPhase);
  });
 }
 const performance=people[1]?.performance;
 return {posePassenger(time:number,gesture:Cheer){performance?.preview(gesture,time);pose(time,gesture);},hasHeroine:!!performance,
 heroineAction(action:HeroineAction){const started=performance?.start(action)??false;if(started)cheerTime=-1;return started;},
 get heroineActive(){return performance?.active;},
 cancelHeroine(){performance?.reset();},
 dispose(){performance?.dispose();},
 previewHeroine(action:HeroineAction,time:number){performance?.preview(action,time);pose();},
 setPassengerLook(yaw:number){passengerLook=Number.isFinite(yaw)?THREE.MathUtils.clamp(yaw,-.6,.6):0;pose();},onCleanPass(){
  if(phase<nextCheer||cheerTime>=0||performance?.active)return;
  const roll=Math.random();
  if(roll>=.28)return;
  const wave=nextCheer===0?roll>=.14:cheer==='applause';
  cheer=wave?'wave':'applause';
  nextCheer=phase+14;cheerTime=0;performance?.start(cheer);return cheer;
 },onRivalPass(){
  // A Rival pass deserves applause only if she is not already celebrating.
  // No delayed applause: passes made during a gesture are intentionally skipped.
  if(performance||cheerTime>=0)return;
  nextCheer=Math.max(nextCheer,phase+2);
  cheer='applause';cheerTime=0;return 'applause' as const;
 },advance(ds:number,input:number,dt:number,rightAcceleration=0,air?:CabinWindInput){
  if(dt<=0)return false;performance?.advance(dt);phase+=dt;const speed=Math.abs(ds)/dt,blend=1-Math.exp(-dt/.16);
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
  lastSpeed=speed;pose();people.forEach(p=>p.hair.step?.(dt,air));return clap;
 },reset(){phase=wind=turn=pitch=lastSpeed=sway=swayRate=tipSway=flutterPhase=nextCheer=passengerLook=0;cheer='applause';cheerTime=-1;performance?.reset();pose();people.forEach(p=>p.hair.reset?.());},
 inspect:()=>({wind,turn,pitch,phase,sway,tipSway,cheerTime,cheer,heroineAction:performance?.active,people:people.map(p=>({
  lean:p.body.rotation.z,head:p.head.rotation.y,hair:p.hair.locks?.map(l=>({back:l.rotation.x,side:l.rotation.z}))??[],spring:p.hair.inspect?.(),
 }))})};
}
