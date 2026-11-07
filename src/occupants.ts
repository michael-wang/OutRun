import * as THREE from 'three';
type Traveler={body:THREE.Group,head:THREE.Group,arms:THREE.Group[],locks:THREE.Group[],scarf?:THREE.Group[]};
/** Small presentation pivots, driven only by observed travel and applied input. */
export function createOccupantMotion(people:Traveler[],wheel:THREE.Mesh){
 let phase=0,wind=0,turn=0,pitch=0,lastSpeed=0;
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
   p.locks.forEach((lock,i)=>{
    // Hair layers flutter with speed; the scalp stays rooted and smooth.
    const gust=Math.sin(phase*4.6+i*.91)*.041+Math.sin(phase*7.9+i*1.19)*.019;
    lock.rotation.x=.018+wind*(.22+gust);
    lock.rotation.z=wind*(turn*.085+Math.sin(phase*3.9+i*1.27)*.085);
    const tip=lock.getObjectByName('blonde-tip-joint');
    if(tip){
      tip.rotation.x=wind*(.09+Math.sin(phase*5.3+i*.8)*.07);
      tip.rotation.z=wind*(turn*.055+Math.sin(phase*4.7+i*.7)*.085);
    }
   });
   p.scarf?.forEach((tail,i)=>{
    tail.rotation.x=wind*(.22+.05*Math.sin(phase*3.7+i*.7));
    tail.rotation.z=wind*(turn*.10+.07*Math.sin(phase*4.2+i*1.3));
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
 },reset(){phase=wind=turn=pitch=lastSpeed=0;pose();},inspect:()=>({wind,turn,pitch,phase,people:people.map(p=>({lean:p.body.rotation.z,head:p.head.rotation.y,hair:p.locks.map(l=>({back:l.rotation.x,side:l.rotation.z})),scarf:p.scarf?.map(l=>({back:l.rotation.x,side:l.rotation.z}))??[]}))})};
}
