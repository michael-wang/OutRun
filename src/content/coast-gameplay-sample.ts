import {COAST_STAGE,type CoastStageContent} from './coast-stage';
import {authoredRoadPlacements,type AuthoredRoad} from './authored-road';

/** Gameplay and QA metadata follow authored stage distances, never Pilot/Trip
 * placement planners. The legacy feedback shapes are a read-only projection
 * until the old local review panel is removed. */
const projected=new WeakMap<AuthoredRoad,ReturnType<typeof authoredRoadPlacements>>();
function placements(road:AuthoredRoad){
 let value=projected.get(road);
 if(!value){value=authoredRoadPlacements(road);projected.set(road,value);}
 return value;
}

export function coastGameplayAt(distance:number,content:CoastStageContent=COAST_STAGE){
 const {road,scenicActs}=content;
 const rawS=distance-road.startDistance;
 const s=Math.max(0,Math.min(road.length,rawS));
 const activePlacements=placements(road).filter(p=>s>=p.startS&&s<=p.endS);
 const beatIndex=scenicActs.findIndex(act=>rawS>=act.start&&rawS<act.end);
 const l2InstanceId=beatIndex>=0?`COAST-SCENIC-${beatIndex+1}`:undefined;
 const bufferRole=rawS>=0&&rawS<100?'launch':
  rawS>=road.length-80&&rawS<road.length?'finish':undefined;
 return {
  world:'coast' as const,
  beat:l2InstanceId??`L3-${bufferRole??'finish'}`,
  l2InstanceId,bufferRole,
  lanes:road.lanes,active:activePlacements.map(p=>p.id),activePlacements,
 };
}

/** Historic feedback export expects this tiny phase projection. It does NOT
 * drive visuals, road samples, traffic or world switching. */
export function coastFeedbackPhases(content:CoastStageContent=COAST_STAGE){
 return [{startS:0,endS:content.road.length,world:'coast' as const,beat:'Sunset coast journey'}];
}
