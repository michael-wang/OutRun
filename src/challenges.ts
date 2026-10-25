import {effectivePace,DEFAULT_PACE} from './pace';
export const REFERENCE_KMH=230,REFERENCE_SPEED=REFERENCE_KMH/3.6;
export const REFERENCE_TRAVEL=REFERENCE_SPEED*effectivePace(REFERENCE_SPEED,DEFAULT_PACE);
export const AUTHORITY_AT_REFERENCE=12;
// Preserve v0.5's shared inverse calibration; scene never changes grip or authority.
export const CURVATURE_PER_STEER=Math.PI/(REFERENCE_TRAVEL*5.825);
export const PRESSURE_GAIN=AUTHORITY_AT_REFERENCE/(CURVATURE_PER_STEER*REFERENCE_SPEED**2);
export const steeringAuthority=(v:number)=>AUTHORITY_AT_REFERENCE*Math.max(0,v)/REFERENCE_SPEED;
export const curvePressure=(k:number,v:number)=>PRESSURE_GAIN*k*Math.max(0,v)**2;
export const requiredSteering=(k:number,v:number)=>v>0?curvePressure(k,v)/steeringAuthority(v):0;
export const curvatureForDemand=(u:number)=>u*CURVATURE_PER_STEER;
export interface Challenge {id:string;label:string;turnDirection:'left'|'right'|'none';targetRequiredSteering:number;referenceIndicatedSpeedKmH:number;nominalDurationAtReferenceSpeed:number;roadWidth:number;transitionSeconds:number;elevationProfile:'scenic-journey';act:number}
// Authored turns and solved neutral lengths close the route without position correction.
// Each act is 40 reference seconds. Offline authoring: scripts/route-prototype-v06.mjs.
const beats:[string,string,number,number,number,number][]=[
 [
  "launch",
  "Azure Coast · launch",
  0,
  4,
  1,
  0
 ],
 [
  "low",
  "Low · one notch",
  0.25,
  5,
  1,
  0
 ],
 [
  "relief-low",
  "relief-low",
  0,
  1,
  1,
  0
 ],
 [
  "high",
  "High · fast right sweep",
  0.75,
  5.166666666666667,
  1,
  0
 ],
 [
  "high-view",
  "Breathe · enjoy the view",
  0,
  3.773703092721993,
  0,
  0
 ],
 [
  "relief-medium",
  "relief-medium",
  0,
  1,
  1,
  0
 ],
 [
  "relief-medium-view",
  "Breathe · enjoy the view",
  0,
  3.773703092721993,
  0,
  0
 ],
 [
  "medium",
  "Medium · fast left sweep",
  -0.5,
  6,
  1,
  0
 ],
 [
  "medium-view",
  "Breathe · enjoy the view",
  0,
  0.13317521620607223,
  0,
  0
 ],
 [
  "coast-rest",
  "coast-rest",
  0,
  1,
  1,
  0
 ],
 [
  "coast-rest-view",
  "Breathe · enjoy the view",
  0,
  0.13317521620607223,
  0,
  0
 ],
 [
  "coast-crest",
  "Coast · lighthouse crest",
  0.5,
  5.516666666666667,
  1,
  0
 ],
 [
  "coast-crest-view",
  "Breathe · enjoy the view",
  0,
  3.5029100488105365,
  0,
  0
 ],
 [
  "canyon-entry",
  "canyon-entry",
  0,
  2.2155149948849924,
  1,
  1
 ],
 [
  "brake-zone",
  "brake-zone",
  0,
  2,
  1,
  1
 ],
 [
  "brake-zone-view",
  "Breathe · enjoy the view",
  0,
  2.2155149948849924,
  0,
  1
 ],
 [
  "extreme",
  "Extreme · brake to 190",
  1.2,
  4.5,
  1,
  1
 ],
 [
  "extreme-view",
  "Breathe · enjoy the view",
  0,
  0.6745023169997544,
  0,
  1
 ],
 [
  "relief-extreme",
  "relief-extreme",
  0,
  1,
  1,
  1
 ],
 [
  "relief-extreme-view",
  "Breathe · enjoy the view",
  0,
  0.6745023169997544,
  0,
  1
 ],
 [
  "s-left",
  "S · left",
  -0.5,
  3,
  0.6,
  1
 ],
 [
  "s-center",
  "s-center",
  0,
  0.4,
  1,
  1
 ],
 [
  "s-right",
  "S · right",
  0.5,
  3,
  0.6,
  1
 ],
 [
  "s-right-view",
  "Breathe · enjoy the view",
  0,
  0.6745023169997544,
  0,
  1
 ],
 [
  "canyon-soft",
  "canyon-soft",
  -0.25,
  2.266666666666667,
  1,
  1
 ],
 [
  "canyon-soft-view",
  "Breathe · enjoy the view",
  0,
  1.166928457012026,
  0,
  1
 ],
 [
  "canyon-left",
  "Canyon · tight left · brake to 190",
  -1.2,
  3.2,
  1,
  1
 ],
 [
  "canyon-left-view",
  "Breathe · enjoy the view",
  0,
  3.1624697392699566,
  0,
  1
 ],
 [
  "canyon-release",
  "canyon-release",
  0,
  1,
  1,
  1
 ],
 [
  "canyon-release-view",
  "Breathe · enjoy the view",
  0,
  3.1624697392699566,
  0,
  1
 ],
 [
  "canyon-exit",
  "Canyon · rising exit",
  0.75,
  4.52,
  1,
  1
 ],
 [
  "canyon-exit-view",
  "Breathe · enjoy the view",
  0,
  1.1669284570121468,
  0,
  1
 ],
 [
  "city-entry",
  "city-entry",
  0,
  4.880340969358602,
  1,
  2
 ],
 [
  "boulevard",
  "City · broad boulevard",
  0.5,
  7,
  1,
  2
 ],
 [
  "boulevard-view",
  "Breathe · enjoy the view",
  0,
  1.0939425092060815,
  0,
  2
 ],
 [
  "city-left",
  "City · harbor descent",
  -0.5,
  4,
  1,
  2
 ],
 [
  "city-left-view",
  "Breathe · enjoy the view",
  0,
  2.553898552336003,
  0,
  2
 ],
 [
  "city-skyline",
  "City · skyline sweep",
  0.75,
  4.177777777777778,
  1,
  2
 ],
 [
  "city-skyline-view",
  "Breathe · enjoy the view",
  0,
  1.0481734962261244,
  0,
  2
 ],
 [
  "city-left-low",
  "city-left-low",
  -0.25,
  5,
  1,
  2
 ],
 [
  "city-left-low-view",
  "Breathe · enjoy the view",
  0,
  1.1495197026431594,
  0,
  2
 ],
 [
  "city-right-low",
  "city-right-low",
  0.25,
  5,
  1,
  2
 ],
 [
  "city-right-low-view",
  "Breathe · enjoy the view",
  0,
  1.0481734962261244,
  0,
  2
 ],
 [
  "exit",
  "exit",
  0,
  2,
  1,
  2
 ],
 [
  "exit-view",
  "Breathe · enjoy the view",
  0,
  1.0481734962261244,
  0,
  2
 ]
];
export const CHALLENGES:Challenge[]=beats.map(([id,label,u,seconds,r,act])=>({id,label,targetRequiredSteering:u,turnDirection:u<0?'left':u>0?'right':'none',referenceIndicatedSpeedKmH:REFERENCE_KMH,nominalDurationAtReferenceSpeed:seconds,roadWidth:14,transitionSeconds:u?r:0,elevationProfile:'scenic-journey',act}));
let cursor=0;
export const COURSE=CHALLENGES.map(c=>{const length=c.nominalDurationAtReferenceSpeed*REFERENCE_TRAVEL,start=cursor;cursor+=length;return {...c,start,length,end:cursor,transitionLength:c.transitionSeconds*REFERENCE_TRAVEL};});
export const TRACK_LENGTH=cursor;
export function challengeAt(distance:number){const d=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH;const c=COURSE.find(c=>d<c.end)??COURSE[0];return {...c,offset:d-c.start};}
export function authoredDemand(distance:number){const c=challengeAt(distance),r=c.transitionLength,u=r?Math.min(1,c.offset/r,(c.length-c.offset)/r):1;return c.targetRequiredSteering*(.5-.5*Math.cos(Math.PI*Math.max(0,u)));}
export const roadCurvature=(d:number)=>curvatureForDemand(authoredDemand(d));
