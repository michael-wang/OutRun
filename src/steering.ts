export const STEERING_STEPS=4,STEERING_DEAD_ZONE=.08,STEERING_HYSTERESIS=.025;
/** Schmitt target bands. The separate actuator smooths correction, not selection. */
export function quantizeSteering(raw:number,previous=0,steps=STEERING_STEPS){
 raw=Math.max(-1,Math.min(1,raw));if(raw===0)return 0;
 const sign=Math.sign(raw),magnitude=Math.abs(raw);
 let level=Math.sign(previous)===sign?Math.round(Math.abs(previous)*steps):0;
 const threshold=(higher:number)=>higher===1?STEERING_DEAD_ZONE:(higher-.5)/steps;
 while(level<steps&&magnitude>=threshold(level+1)+STEERING_HYSTERESIS)level++;
 while(level>0&&magnitude<threshold(level)-STEERING_HYSTERESIS)level--;
 return level?sign*level/steps:0;
}

export interface SteeringActuator {appliedSteer:number;steerFrom:number;steerTo:number;steerTime:number}
export const STEER_ONSET_SECONDS=.10,STEER_RELEASE_SECONDS=.06;
const smooth=(t:number)=>t*t*(3-2*t);
const integral=(t:number)=>t*t*t-.5*t*t*t*t;
/** Finite cubic response. Return exact mean output over dt for stable integration. */
export function actuateSteering(s:SteeringActuator,target:number,dt:number){
 if(target!==s.steerTo){s.steerFrom=s.appliedSteer;s.steerTo=target;s.steerTime=0;}
 const duration=target===0?STEER_RELEASE_SECONDS:STEER_ONSET_SECONDS;
 const a=Math.min(1,s.steerTime/duration),b=Math.min(1,(s.steerTime+dt)/duration);
 const active=(b-a)*duration,remaining=Math.max(0,dt-active);
 const area=duration*(s.steerFrom*(b-a)+(target-s.steerFrom)*(integral(b)-integral(a)))+target*remaining;
 s.steerTime+=dt;s.appliedSteer=b===1?target:s.steerFrom+(target-s.steerFrom)*smooth(b);
 return dt?area/dt:s.appliedSteer;
}
