import type { DrivingState, InputState } from '../src/handling';
/** External test driver only. 100ms digital button taps, no gameplay autopilot. */
export function scriptedDriver() {
  let pulse=0;
  return (s:DrivingState,curvature:number):InputState=>{
    const desired=Math.max(-1,Math.min(1,(curvature*s.speed - 1.8*s.velocityHeading - .075*s.lateral)/Math.max(.1,Math.min(.6,s.speed*.035))));
    pulse+=Math.abs(desired);
    const steer=pulse>=.5?Math.sign(desired):0;
    if(steer)pulse-=1;
    return {gas:true,brake:false,steer};
  };
}
