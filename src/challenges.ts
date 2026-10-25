import {effectivePace,DEFAULT_PACE} from './pace';
export const REFERENCE_KMH=230,REFERENCE_SPEED=REFERENCE_KMH/3.6;
export const REFERENCE_TRAVEL=REFERENCE_SPEED*effectivePace(REFERENCE_SPEED,DEFAULT_PACE);
export const AUTHORITY_AT_REFERENCE=12;
export interface Challenge {
 id:string;label:string;turnDirection:'left'|'right'|'none';targetRequiredSteering:number;
 referenceIndicatedSpeedKmH:number;nominalDurationAtReferenceSpeed:number;roadWidth:number;
 transitionSeconds:number;elevationProfile:'coastal-roll';
}
const segment=(id:string,label:string,demand:number,seconds:number,ramp=1):Challenge=>({id,label,
 targetRequiredSteering:demand,turnDirection:demand<0?'left':demand>0?'right':'none',
 referenceIndicatedSpeedKmH:REFERENCE_KMH,nominalDurationAtReferenceSpeed:seconds,
 roadWidth:14,transitionSeconds:demand?ramp:0,elevationProfile:'coastal-roll'});
/** Gameplay first; identical half-turn sequences close the coast loop. */
export const CHALLENGES:Challenge[]=[
 segment('launch','Open coast',0,4),
 segment('low','Low · one notch',.25,5),segment('relief-low','Release',0,1),
 segment('medium','Medium · two notches',-.5,5),segment('relief-medium','Release',0,1),
 segment('high','High · three notches',.75,4.5),segment('brake-zone','Brake before the tight right',0,1),
 segment('extreme','Extreme · brake to 190',1.2,4.5),segment('relief-extreme','Release',0,1),
 segment('s-left','S · left',-.5,3,.6),segment('s-center','S · release',0,.4),
 segment('s-right','S · right',.5,3,.6),segment('exit','Open coast',0,1.6),
];
// Cosine ramps each integrate to half their duration. This fixed global
// calibration makes the authored steering-time integral produce a half-turn.
const demandSeconds=CHALLENGES.reduce((a,c)=>a+c.targetRequiredSteering*(c.nominalDurationAtReferenceSpeed-c.transitionSeconds),0);
export const CURVATURE_PER_STEER=Math.PI/(REFERENCE_TRAVEL*demandSeconds);
export const PRESSURE_GAIN=AUTHORITY_AT_REFERENCE/(CURVATURE_PER_STEER*REFERENCE_SPEED**2);
export const steeringAuthority=(v:number)=>AUTHORITY_AT_REFERENCE*Math.max(0,v)/REFERENCE_SPEED;
export const curvePressure=(k:number,v:number)=>PRESSURE_GAIN*k*Math.max(0,v)**2;
export const requiredSteering=(k:number,v:number)=>v>0?curvePressure(k,v)/steeringAuthority(v):0;
export const curvatureForDemand=(u:number)=>u*CURVATURE_PER_STEER;
let cursor=0;
export const COURSE=CHALLENGES.map(c=>{const length=c.nominalDurationAtReferenceSpeed*REFERENCE_TRAVEL,start=cursor;cursor+=length;return {...c,start,length,end:cursor,transitionLength:c.transitionSeconds*REFERENCE_TRAVEL};});
export const HALF_LENGTH=cursor,TRACK_LENGTH=2*HALF_LENGTH;
export function challengeAt(distance:number){
 const d=((distance%HALF_LENGTH)+HALF_LENGTH)%HALF_LENGTH;
 const c=COURSE.find(c=>d<c.end)??COURSE[0];return {...c,offset:d-c.start};
}
export function authoredDemand(distance:number){
 const c=challengeAt(distance),r=c.transitionLength,u=r?Math.min(1,c.offset/r,(c.length-c.offset)/r):1;
 return c.targetRequiredSteering*(.5-.5*Math.cos(Math.PI*Math.max(0,u)));
}
export const roadCurvature=(d:number)=>curvatureForDemand(authoredDemand(d));
