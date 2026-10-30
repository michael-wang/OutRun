import {effectivePace} from './pace';
import {steeringAuthority,curvePressure,requiredSteering} from './challenges';
import {quantizeSteering,actuateSteering} from './steering';
import {bodyYawTarget} from './body-pose';
import {createPowertrain,advancePowertrain,type PowertrainState} from './powertrain';
export interface InputState {gas:boolean;brake:boolean;steer:number;rawSteer?:number}
export interface DrivingState extends PowertrainState {
 distance:number;speed:number;lateral:number;
 /** Rendering attitude only; never drives longitudinal or lateral navigation. */
 heading:number;velocityHeading:number;worldHeading:number;steering:number;yawRate:number;
 slipAngle:number;slip:number;offRoad:boolean;footprintEdge:number;curvature:number;
 corridorSide:number;steeringTarget:number;drifting:boolean;
 rawSteer:number;effectiveSteer:number;requiredSteer:number;lateralRate:number;weightRoll:number;bank:number;
 appliedSteer:number;steerFrom:number;steerTo:number;steerTime:number;grade:number;gradeAcceleration:number;
}
export const MAX_SPEED=360/3.6,ROAD_HALF_WIDTH=7,CORRIDOR_LIMIT=9.6;
export const createState=():DrivingState=>({...createPowertrain(),distance:0,speed:0,lateral:0,heading:0,velocityHeading:0,worldHeading:0,
 steering:0,yawRate:0,slipAngle:0,slip:0,offRoad:false,footprintEdge:1.13,curvature:0,corridorSide:0,
 steeringTarget:0,drifting:false,rawSteer:0,effectiveSteer:0,requiredSteer:0,lateralRate:0,weightRoll:0,bank:0,
 appliedSteer:0,steerFrom:0,steerTo:0,steerTime:0,grade:0,gradeAcceleration:0});
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export const angleDifference=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
export function updateFootprint(s:DrivingState,roadHalfWidth=ROAD_HALF_WIDTH){
 // Collision envelope belongs to road-relative navigation, never the cinematic body pose.
 s.footprintEdge=Math.abs(s.lateral)+1.13;
 s.offRoad=s.footprintEdge>roadHalfWidth;
}
/** Arcade balance remains the target; grip converges lateral velocity over a brief
 * speed-dependent interval. Banking relieves pressure without automatic steering. */
export function step(s:DrivingState,input:InputState,dt:number,curvature:number,highSpeedPace=1,width:number|((distance:number)=>number)=ROAD_HALF_WIDTH,grade=0,bank=0){
 const halfAt=typeof width==='number'?()=>width:width,roadHalfWidth=halfAt(s.distance);
 const corridorLimit=roadHalfWidth+(CORRIDOR_LIMIT-ROAD_HALF_WIDTH);
 dt=clamp(dt,0,.05);s.curvature=curvature;updateFootprint(s,roadHalfWidth);
 const driving=input.gas&&!input.brake,driveForce=advancePowertrain(s,s.speed,driving,dt);
 s.grade=Number.isFinite(grade)?grade:0;s.gradeAcceleration=s.speed<.001&&!driving?0:-9.81*s.grade/Math.hypot(1,s.grade);
 const acceleration=driveForce-s.roadDrag-s.shiftDrag-(driving?0:3.8-s.roadDrag)+s.gradeAcceleration
  // The slower engine needs a proportional shoulder drag: still a strong,
  // immediate speed loss, but enough torque remains for bounded recovery.
  -(input.brake?34:0)-(s.offRoad?5+s.speed*.04:0);
 s.netAcceleration=acceleration;s.speed=clamp(s.speed+acceleration*dt,0,MAX_SPEED);
 s.rawSteer=input.rawSteer??input.steer;s.steeringTarget=s.rawSteer;
 s.effectiveSteer=quantizeSteering(input.steer,s.effectiveSteer);s.steering=s.effectiveSteer;
 const appliedMean=actuateSteering(s,s.effectiveSteer,dt);
 s.bank=bank;
 const relief=Math.sign(bank)===Math.sign(curvature)?1-Math.min(.28,Math.abs(bank)*1.35):1;
 s.requiredSteer=requiredSteering(curvature,s.speed)*relief;
 const target=steeringAuthority(s.speed)*appliedMean-curvePressure(curvature,s.speed)*relief;
 const tau=.065+.14*Math.min(1,s.speed/80),oldRate=s.lateralRate,decay=Math.exp(-dt/tau);
 let rate=target+(oldRate-target)*decay;
 if(Math.abs(target)<.001&&Math.abs(rate)<.015)rate=0;
 const meanRate=rate===0&&Math.abs(target)<.001?0:dt>0?target+(oldRate-target)*tau*(1-decay)/dt:rate;
 const transfer=clamp((rate-oldRate)/Math.max(dt,.001)*.0018,-.045,.045);
 s.weightRoll+=(transfer-s.weightRoll)*(1-Math.exp(-dt/.14));
 if(s.corridorSide&&s.effectiveSteer*s.corridorSide<0&&rate*s.corridorSide<0)s.corridorSide=0;
 if(s.corridorSide&&Math.abs(s.lateral)<corridorLimit-1e-5)s.corridorSide=0;
 const attempted=s.lateral+meanRate*dt;
 if(Math.abs(attempted)>=corridorLimit)s.corridorSide=Math.sign(attempted);
 s.lateralRate=s.corridorSide?0:rate;s.lateral=s.corridorSide?s.corridorSide*corridorLimit:attempted;
 const ds=s.speed*effectivePace(s.speed,highSpeedPace)*dt;s.distance+=ds;
 const load=Math.sign(s.appliedSteer)===Math.sign(s.requiredSteer)?Math.min(Math.abs(s.appliedSteer),Math.abs(s.requiredSteer)):0;
 const body=bodyYawTarget(s.appliedSteer,s.requiredSteer,s.speed);
 const oldHeading=s.heading;s.heading+=(body-s.heading)*(1-Math.exp(-dt/(body===0?.14:.12)));
 if(Math.abs(s.heading)<1e-7)s.heading=0;
 s.velocityHeading=Math.atan2(s.lateralRate,Math.max(1,s.speed));s.yawRate=dt>0?(s.heading-oldHeading)/dt:0;
 s.worldHeading+=curvature*ds; // diagnostic tangent; renderer uses exact geometry
 s.slipAngle=s.heading;s.slip=Math.max(clamp((load-.55)/.25,0,1),clamp((Math.abs(s.lateralRate)-2.5)/5,0,1))*Math.min(1,s.speed/50);
 s.drifting=s.slip>.2;
 const nextHalf=halfAt(s.distance),nextLimit=nextHalf+(CORRIDOR_LIMIT-ROAD_HALF_WIDTH);
 if(Math.abs(s.lateral)>nextLimit){s.corridorSide=Math.sign(s.lateral);s.lateral=s.corridorSide*nextLimit;s.lateralRate=0;}
 updateFootprint(s,nextHalf);
}
