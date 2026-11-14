/** Actual world air/car velocities in m/s; presentation only, never physics. */
export type HairWindPreset='baseline'|'dramatic'|'wild';
export const hairWindPreset=(value:string|null):HairWindPreset=>value==='dramatic'||value==='wild'?value:'baseline';
export type CabinWindInput={airX:number;airZ:number;velocityX:number;velocityZ:number;yaw:number;time:number;preset?:HairWindPreset};
export type CabinAir={x:number;y:number;z:number;exposure:number};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/** Open Riviera cabin: windshield attenuates head-on flow, the exposed side
 * keeps crosswind; two smooth wake bands prevent a stationary swept-back pose.
 * These are art-directed cabin eddies, not another environmental gust field. */
export function cabinWind(input:CabinWindInput,out:CabinAir={x:0,y:0,z:0,exposure:0}):CabinAir{
 const {airX,airZ,velocityX,velocityZ,yaw,time:t}=input;
 if(!Number.isFinite(airX)||!Number.isFinite(airZ)||!Number.isFinite(velocityX)||!Number.isFinite(velocityZ)||!Number.isFinite(yaw)||!Number.isFinite(t)){
  out.x=out.y=out.z=out.exposure=0;return out;
 }
 const x=airX-velocityX,z=airZ-velocityZ,c=Math.cos(yaw),s=Math.sin(yaw);
 const lateral=c*x-s*z,fore=s*x+c*z;
 const speed=Math.hypot(velocityX,velocityZ),load=speed/(speed+14);
 const slow=Math.sin(t*2.13+.7),wake=Math.sin(t*5.17+1.2*Math.sin(t*.61));
 out.exposure=.40+.08*slow; // windshield + A-pillar wake at passenger head
 out.x=clamp(lateral*.65+load*(5.5*slow+3.0*wake),-32,32);
 out.y=load*(1.8+2.5*Math.sin(t*3.31+.8));
 out.z=clamp(fore*out.exposure+load*(5.8*wake+2.8*Math.sin(t*1.37)),-38,20);
 return out;
}

/** Dev art experiment: correlated cabin wake sampled at each authored lock.
 * Output is stylized spring forcing, NOT metres/second or a physics force.
 * Crown weights, bones, stiffness and damping remain identical in all modes. */
export function experimentalHairWind(preset:'dramatic'|'wild',air:CabinAir,speed:number,time:number,chain:number,depth:number,turn:number,brakeWake:number,out:{x:number;y:number;z:number}){
 const wild=preset==='wild',strength=wild?1.65:1;
 const drive=Math.tanh(Math.max(0,speed)/18),fast=Math.tanh(Math.max(0,speed-25)/45);
 const side=chain<3?-1:1,phase=chain*.91;
 const t=time-chain*.037-depth*.029;
 // Shared low-frequency buffet, progressively decorrelated wake, small fast tips.
 const buffet=Math.sin(t*2.0+.35*Math.sin(t*.47));
 const wake=Math.sin(t*6.2+phase+1.1*Math.sin(t*1.13+phase*.4));
 const curl=Math.sin(t*10.1-phase*.72+.55*Math.sin(t*2.8));
 const flutter=Math.sin(t*(27+chain*1.7)-phase*1.6-depth*.8)*.65+Math.sin(t*41.3+phase)*.35;
 const amp=(.85+.06*chain)*(1+.32*turn*side);
 const flex=[.34,.83,1.15][depth],tip=depth===2?1:depth===1?.25:0;
 const energy=drive*(.75+.45*fast)*strength*flex*amp;
 out.x=air.x*.018*flex+energy*(.48*buffet+.46*wake+.19*curl+.16*tip*flutter)+turn*.32*flex*amp;
 out.y=air.y*.012*flex+energy*(.12+.20*curl+.12*wake+.11*tip*flutter)+brakeWake*.35*flex;
 out.z=air.z*.012*flex+energy*(-.76-.42*buffet+.42*curl+.22*wake+.12*tip*flutter)+brakeWake*.65*flex;
 return out;
}
