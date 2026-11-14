import {CHALLENGES,COURSE,REFERENCE_TRAVEL,curvatureForDemand} from '../challenges';
import {generatedBank,seamlessBank,type BankFeature,type BankStrength} from '../banking';
import {LANE_WIDTH} from '../road-profile';
import {createTrack} from '../track';
import {sampleAuthoredRoad,validateAuthoredRoad,type AuthoredRoad} from './authored-road';

/** The existing coast runtime keeps these stage labels for HUD/AI compatibility.
 * Road shape itself belongs exclusively to the stage JSON. */
interface CoastTrackIdentity{
 id:string;
 name:string;
 sceneryAct:number;
 bankFeatures?:readonly BankFeature[];
}

/** Authoring -> road spans, without Pilot placements, Brick or Trip. The
 * shared createTrack integrator still owns position, heading and bank frames. */
export function authoredRoadCourse(road:AuthoredRoad,stage:CoastTrackIdentity){
 validateAuthoredRoad(road);
 if(road.id!=='coast')throw Error('Only the accepted coast uses this road adapter');
 const template={...CHALLENGES[0],label:stage.name,act:stage.sceneryAct,
  roadWidth:road.lanes*LANE_WIDTH,transitionLength:0,transitionSeconds:0};
 const course:typeof COURSE=[];
 let cursor=0;
 const add=(end:number,demand:number,label:string)=>{
  if(end<=cursor)return;
  const start=cursor,length=end-start;
  course.push({...template,id:`${stage.id}-${course.length}`,label,start,end,length,
   nominalDurationAtReferenceSpeed:length/REFERENCE_TRAVEL,targetRequiredSteering:demand});
  cursor=end;
 };
 for(const turn of road.turns){
  add(turn.start,0,'Approach');
  add(turn.end,turn.steer,turn.label);
 }
 // Preserve the existing 600m post-finish relief: chunks, camera and AI can
 // safely sample beyond the visible 10km race without ever missing the road.
 add(road.startDistance+road.length+600,0,'Relief');
 return course;
}

/** The coast needs no Pilot generator. Its JSON now provides both its sampled
 * curvature/elevation and the track's integration spans. Coast's existing
 * banking curve (weights [1,0,0]) is retained without altering the physics. */
export function createAuthoredCoastTrack(
 road:AuthoredRoad,stage:CoastTrackIdentity,bank?:BankStrength
){
 const course=authoredRoadCourse(road,stage);
 const coastWeights=[1,0,0] as const;
 const bankAt=seamlessBank(course.at(-1)!.end,
  d=>generatedBank(curvatureForDemand(sampleAuthoredRoad(road,d).demand),coastWeights,3),
  stage.bankFeatures??road.banks??[]);
 return createTrack({course,
  heightAt:d=>sampleAuthoredRoad(road,d),
  demandAt:d=>sampleAuthoredRoad(road,d).demand,
  loop:false,banking:bank===undefined,smoothBank:true,bankAt,
 });
}
