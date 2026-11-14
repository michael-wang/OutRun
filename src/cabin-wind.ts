/** Actual world air/car velocities in m/s; presentation only, never physics. */
export type CabinWindInput={airX:number;airZ:number;velocityX:number;velocityZ:number;yaw:number;time:number};
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
