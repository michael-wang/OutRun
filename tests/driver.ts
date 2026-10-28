import {requiredSteering} from '../src/challenges';
import type {DrivingState,InputState} from '../src/handling';
/** Test-only preview braking. Not imported by normal gameplay. */
export function plannedSpeed(distance:number,sample:(d:number)=>{curvature:number},pace=1.75){
 const maxDemand=Math.max(...[0,30,60,100,150].map(d=>Math.abs(requiredSteering(sample(distance+d*pace/1.75).curvature,230/3.6))));
 return maxDemand>1?190/3.6:230/3.6;
}
export function scriptedDriver(){return (s:DrivingState,k:number,speedLimit=230/3.6):InputState=>({
 gas:s.speed<speedLimit,brake:s.speed>speedLimit+1,
 steer:Math.max(-1,Math.min(1,requiredSteering(k,s.speed)-s.lateral*.08)),
});}
