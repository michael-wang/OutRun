import {effectivePace} from './pace';
import {steeringAuthority,curvePressure,requiredSteering} from './challenges';
import {quantizeSteering} from './steering';
export interface InputState {gas:boolean;brake:boolean;steer:number;rawSteer?:number}
export interface DrivingState {
 distance:number;speed:number;lateral:number;
 /** Rendering attitude only; never drives longitudinal or lateral navigation. */
 heading:number;velocityHeading:number;worldHeading:number;steering:number;yawRate:number;
 slipAngle:number;slip:number;offRoad:boolean;footprintEdge:number;curvature:number;
 corridorSide:number;steeringTarget:number;drifting:boolean;
 rawSteer:number;effectiveSteer:number;requiredSteer:number;lateralRate:number;
}
export const MAX_SPEED=65,ROAD_HALF_WIDTH=7,CORRIDOR_LIMIT=9.6;
export const createState=():DrivingState=>({distance:0,speed:0,lateral:0,heading:0,velocityHeading:0,worldHeading:0,
 steering:0,yawRate:0,slipAngle:0,slip:0,offRoad:false,footprintEdge:1.13,curvature:0,corridorSide:0,
 steeringTarget:0,drifting:false,rawSteer:0,effectiveSteer:0,requiredSteer:0,lateralRate:0});
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export const angleDifference=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
export function updateFootprint(s:DrivingState){
 s.footprintEdge=Math.abs(s.lateral)+1.13*Math.abs(Math.cos(s.heading))+2.35*Math.abs(Math.sin(s.heading));
 s.offRoad=s.footprintEdge>ROAD_HALF_WIDTH;
}
/** Arcade balance: x' = authority(v)*notch - pressure(k,v).
 * No yaw/slip/velocity integration feeds navigation. Pace affects travel only. */
export function step(s:DrivingState,input:InputState,dt:number,curvature:number,highSpeedPace=1){
 dt=clamp(dt,0,.05);s.curvature=curvature;updateFootprint(s);
 const acceleration=(input.gas&&!input.brake?19*(1-s.speed/88)+6*Math.max(0,1-s.speed/20):-3.8)
  -(input.brake?34:0)-(s.offRoad?10+s.speed*.07:0);
 s.speed=clamp(s.speed+acceleration*dt,0,MAX_SPEED);
 s.rawSteer=input.rawSteer??input.steer;s.steeringTarget=s.rawSteer;
 s.effectiveSteer=quantizeSteering(input.steer,s.effectiveSteer);s.steering=s.effectiveSteer;
 s.requiredSteer=requiredSteering(curvature,s.speed);
 const rate=steeringAuthority(s.speed)*s.effectiveSteer-curvePressure(curvature,s.speed);
 if(s.corridorSide&&s.effectiveSteer*s.corridorSide<0&&rate*s.corridorSide<0)s.corridorSide=0;
 const attempted=s.lateral+rate*dt;
 if(Math.abs(attempted)>=CORRIDOR_LIMIT)s.corridorSide=Math.sign(attempted);
 s.lateralRate=s.corridorSide?0:rate;s.lateral=s.corridorSide?s.corridorSide*CORRIDOR_LIMIT:attempted;
 const ds=s.speed*effectivePace(s.speed,highSpeedPace)*dt;s.distance+=ds;
 const imbalance=s.effectiveSteer-s.requiredSteer;
 const body=clamp(imbalance*.18+s.effectiveSteer*.055,-.28,.28)*Math.min(1,s.speed/20);
 s.heading=body;s.velocityHeading=0;s.yawRate=0;
 s.worldHeading+=curvature*ds; // diagnostic tangent; renderer uses exact geometry
 s.slipAngle=body;s.slip=clamp((Math.abs(imbalance)-.3)*.65,0,.8)*Math.min(1,s.speed/35);
 s.drifting=s.slip>.2;updateFootprint(s);
}
