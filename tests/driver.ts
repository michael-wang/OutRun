import type { DrivingState, InputState } from '../src/handling';
/** Test driver reads upcoming road like a player; never imported by production. */
export function plannedSpeed(distance:number,sample:(distance:number)=>{curvature:number},pace=1) {
  return Math.min(65,...[0,15,30,45,60,90].map(ahead=>ahead*pace).map(ahead=>Math.sqrt((.45/Math.max(.001,Math.abs(sample(distance+ahead).curvature)))**2+2*18*ahead/pace)));
}
/** External test driver only. 100ms digital button taps, no gameplay autopilot. */
export function scriptedDriver() {
  let pulse=0;
  return (s:DrivingState,curvature:number,speedLimit=65):InputState=>{
    const desired=Math.max(-1,Math.min(1,(curvature*s.speed - 2*s.heading - .08*s.lateral)/Math.max(.1,Math.min(.6,s.speed*.035))));
    pulse+=Math.abs(desired);
    const steer=pulse>=.5?Math.sign(desired):0;
    if(steer)pulse-=1;
    const cornerSpeed=Math.min(speedLimit,.45/Math.max(.001,Math.abs(curvature)));
    return {gas:s.speed<cornerSpeed,brake:s.speed>cornerSpeed+3,steer};
  };
}
