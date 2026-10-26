import {laneProfile,LANE_WIDTH,type LaneKnot} from './road-profile';
import {REFERENCE_TRAVEL,REFERENCE_KMH,CHALLENGES} from './challenges';
import {createTrack} from './track';
export const CATALOG_VERSION='brick-lab-2',ENGINE_VERSION='v0.7A.1/v0.6-handling';
export type HumanVote='UNREVIEWED'|'KEEP'|'REWORK'|'REJECT';
export interface ChallengeBrick {
 id:string;revision:number;name:string;intent:string;emotionalRole:string;sceneryAct:number;seed:number;
 referenceSpeed:number;entrySpeed:number;requiredSteerProfile:readonly (readonly [number,number])[];
 nominalDuration:number;length:number;roadWidth:number;lanes:readonly LaneKnot[];elevation:readonly (readonly [number,number])[];
 entry:string;exit:string;warning:{leadMeters:number;text:string};tags:string[];antiAdjacency:string[];
 autoValidation:'PENDING'|'PASS'|'FAIL';
}
const definitions=[
 ['Coastal Panorama Sweeper','Hold the throttle and follow the long ocean bend.','relaxed speed',0,230,14,[[3,0],[8,.75],[3,0],[5,-.5],[4,0]],[[0,12],[12,65],[23,12]]],
 ['Double-S Rhythm','Alternate left and right, then release to settle.','rhythmic skill',0,230,14,[[3,0],[3,-.5],[3,.5],[3,-.5],[3,.5],[4,0]],[[0,14],[19,14]]],
 ['Crest & Reveal','Climb toward the sky, then follow the revealed coast.','surprise',0,230,14,[[4,0],[5,.25],[3,0],[6,-.5],[5,0]],[[0,12],[9,172],[13,160],[23,18]]],
 ['Canyon Brake Test','Brake before the marked right turn, then accelerate out.','mastery',1,230,14,[[5,0],[5,1.2],[5,0],[3,-.25],[4,0]],[[0,25],[10,38],[22,25]]],
 ['Downhill Acceleration Reward','Open the throttle through the broad downhill sweep.','release',1,170,16,[[3,0],[8,-.5],[4,.25],[7,0]],[[0,210],[3,205],[18,25],[22,12]]],
 ['Edge Discipline','Hold a clean line between the close canyon edges.','concentration',1,230,12,[[3,0],[6,.5],[2,0],[5,-.5],[4,0]],[[0,25],[10,38],[20,25]]],
 ['City Boulevard Slalom','Link the spacious city bends with deliberate reversals.','urban spectacle',2,230,16,[[3,0],[5,.5],[2,0],[5,-.5],[2,0],[5,.5],[5,0]],[[0,25],[12,20],[27,12]]],
 ['Harbor Hairpin & Relief','Brake for the harbor turn, then enjoy the open-water exit.','tension to release',2,230,16,[[5,0],[3.8,-1.25],[2,0],[6,.25],[8,0]],[[0,35],[8.8,32],[24.8,12]]],
] as const;
const laneProfiles:readonly (readonly LaneKnot[])[]=[
 [[0,4],[10,4],[15,6],[23,6]],[[0,4],[19,4]],
 [[0,2],[7,2],[12,4],[23,4]],[[0,2],[22,2]],
 [[0,4],[6,4],[12,6],[22,6]],[[0,4],[2,4],[7,2],[12,2],[17,4],[20,4]],
 [[0,6],[3,6],[8,8],[18,8],[23,6],[27,6]],[[0,4],[4,2],[10,2],[15,4],[24.8,4]]
];
// Technical evidence: docs/V0.7A1_HANDOFF.md and docs/evidence/v0.7a1/. Human votes are separate.
export const BRICKS:ChallengeBrick[]=definitions.map(([name,intent,emotionalRole,sceneryAct,entrySpeed,roadWidth,profile,elevation],i)=>{
 const nominalDuration=profile.reduce((sum,p)=>sum+p[0],0);
 return {id:`BRK-0${i+1}`,revision:2,name,intent,emotionalRole,sceneryAct,seed:7101+i*97,referenceSpeed:REFERENCE_KMH,entrySpeed,requiredSteerProfile:profile,nominalDuration,length:nominalDuration*REFERENCE_TRAVEL,roadWidth:laneProfiles[i][0][1]*LANE_WIDTH,lanes:laneProfiles[i],elevation,
 entry:'Straight, zero grade, centered car; three or more seconds to prepare.',exit:'Straight relief, zero grade, explicit completion before the road buffer.',warning:{leadMeters:300,text:i===3||i===7?'BRAKE · 180 km/h':i===2?'CREST · BEND AHEAD':'FOLLOW THE ROAD'},tags:[emotionalRole,sceneryAct===0?'coast':sceneryAct===1?'canyon':'city'],antiAdjacency:i===3||i===7?['technical','blind-crest']:[],autoValidation:'PASS'};
});
export const BRICK_START=350;
export function brickCourse(brick:ChallengeBrick){
 let cursor=0;
 const pieces:[[number,number],...Array<[number,number]>]=[[BRICK_START/REFERENCE_TRAVEL,0],...brick.requiredSteerProfile.map(p=>[p[0],p[1]] as [number,number]),[1000/REFERENCE_TRAVEL,0]];
 return pieces.map(([seconds,u],i)=>{const length=seconds*REFERENCE_TRAVEL,start=cursor;cursor+=length;return {...CHALLENGES[0],id:`${brick.id}-${i}`,label:brick.name,act:brick.sceneryAct,turnDirection:u<0?'left' as const:u>0?'right' as const:'none' as const,targetRequiredSteering:u,nominalDurationAtReferenceSpeed:seconds,roadWidth:brick.roadWidth,transitionSeconds:u?.8:0,start,end:cursor,length,transitionLength:u?.8*REFERENCE_TRAVEL:0};});
}
export function brickElevation(brick:ChallengeBrick,distance:number){
 const t=Math.max(0,Math.min(brick.nominalDuration,(distance-BRICK_START)/REFERENCE_TRAVEL)),knots=brick.elevation;
 let i=1;while(i<knots.length-1&&t>knots[i][0])i++;
 const [a,lo]=knots[i-1],[b,hi]=knots[i],u=(t-a)/(b-a);
 return {height:lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*u)),grade:distance<=BRICK_START||distance>=BRICK_START+brick.length?0:(hi-lo)*Math.PI/2*Math.sin(Math.PI*u)/((b-a)*REFERENCE_TRAVEL)};
}
export function brickWidth(brick:ChallengeBrick,distance:number){return laneProfile(brick.lanes,(distance-BRICK_START)/REFERENCE_TRAVEL);}
export function createBrickTrack(brick:ChallengeBrick){return createTrack({course:brickCourse(brick),heightAt:d=>brickElevation(brick,d),loop:false});}
