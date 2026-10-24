import {steeringRate,type DrivingState,type InputState} from '../src/handling';
/** Preview braking exists only in the external test driver. */
export function plannedSpeed(distance:number,sample:(distance:number)=>{curvature:number},pace=1) {
 return Math.min(65,...[0,15,30,45,60,90].map(a=>a*pace).map(a=>Math.sqrt((.22/Math.max(.001,Math.abs(sample(distance+a).curvature)))**2+2*18*a/pace)));
}
/** External digital feedback driver; never loaded by normal gameplay. */
export function scriptedDriver() {
 return (s:DrivingState,curvature:number,speedLimit=65):InputState=>{
  const limit=Math.min(speedLimit,.22/Math.max(.001,Math.abs(curvature)));
  const targetHeading=curvature*s.speed/(s.drifting?1.1:6)-s.lateral*.018;
  const desired=Math.max(-1,Math.min(1,(curvature*s.speed+3*(targetHeading-s.heading))/Math.max(.1,steeringRate(s.speed))));
  const steer=Math.abs(desired)>.04 && (desired*s.steering<0 || Math.abs(desired)>Math.abs(s.steering)*.92)?Math.sign(desired):0;
  return {gas:s.speed<limit,brake:s.speed>limit+2,steer};
 };
}
