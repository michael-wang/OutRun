import * as THREE from 'three';
type Traveler={body:THREE.Group,head:THREE.Group,arms:THREE.Group[],locks:THREE.Group[]};
/** Small presentation pivots, driven only by observed travel and applied input. */
export function createOccupantMotion(people:Traveler[],wheel:THREE.Mesh){
 let phase=0,wind=0,turn=0,pitch=0,lastSpeed=0;
 function pose(){
  people.forEach((p,index)=>{
   p.body.rotation.z=turn*(index===0?.08:.12);p.body.rotation.x=pitch;
   p.head.rotation.y=-turn*.12;p.head.rotation.z=-turn*.035;
   p.arms.forEach((arm,i)=>{arm.rotation.z=turn*(index===0?.045:.02);arm.rotation.x=pitch*.25+(index===0?turn*(i===0?-.025:.025):0);});
   p.locks.forEach((lock,i)=>{
    const gust=Math.sin(phase*6.1+i*.8)*.07+Math.sin(phase*10.7+i)*.035;
    lock.rotation.x=.12+wind*(1.18+gust);
    lock.rotation.z=wind*(turn*.28+Math.sin(phase*5.3+i*1.2)*.12);
    const tip=lock.children.find(o=>o instanceof THREE.Group)!;
    tip.rotation.x=wind*(.12+Math.sin(phase*8.3+i)*.12);
    tip.rotation.z=wind*(turn*.15+Math.sin(phase*7.7+i)*.16);
   });
  });
  wheel.rotation.z=-turn*.32;
 }
 return {advance(ds:number,input:number,dt:number){
  if(dt<=0)return;phase+=dt;const speed=Math.abs(ds)/dt,blend=1-Math.exp(-dt/.16);
  wind+=(THREE.MathUtils.clamp(speed/113.75,0,1)-wind)*blend;
  turn+=(THREE.MathUtils.clamp(input,-1,1)-turn)*blend;
  pitch+=(THREE.MathUtils.clamp(-(speed-lastSpeed)/dt*.0015,-.045,.045)-pitch)*blend;
  lastSpeed=speed;pose();
 },reset(){phase=wind=turn=pitch=lastSpeed=0;pose();},inspect:()=>({wind,turn,pitch,phase,people:people.map(p=>({lean:p.body.rotation.z,head:p.head.rotation.y,hair:p.locks.map(l=>({back:l.rotation.x,side:l.rotation.z}))}))})};
}
