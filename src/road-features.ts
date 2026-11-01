import {BRICK_START} from './bricks';
import {CURVATURE_PER_STEER} from './challenges';
import {pilotSample,type PilotCandidate,type WorldName} from './pilot-composer';
import {selectRoadInterchange} from './road-interchange';

/** Route-planning metadata, not runtime view-dependent scenery or driving state.
 * Once produced for a seed, all chunks and QA consumers reuse the same records. */
export type RoadFeatureKind='u-turn'|'long-straight'|'long-curve'|'s-bends'|'merge'|'exit';
export type RoadTurn='left'|'right';
export interface RoadFeature {
 readonly id:string;
 readonly kind:RoadFeatureKind;
 /** Absolute route distances, compatible with Road Worker and Scene Inspector. */
 readonly start:number;
 readonly end:number;
 readonly biome:WorldName;
 readonly direction?:RoadTurn;
 /** Accumulated heading change for one continuous turn, in unsigned degrees. */
 readonly turnDegrees?:number;
 /** Alternating-turn count for s-bends (L-R-L, R-L-R, etc.). */
 readonly turns?:number;
 readonly pattern?:string;
 readonly lanesBefore?:number;
 readonly lanesAfter?:number;
}

export const ROAD_FEATURE_LABELS:Record<RoadFeatureKind,string>={
 'u-turn':'U-turn','long-straight':'長距離直線','long-curve':'長距離彎道',
 's-bends':'連續彎道','merge':'車道匯入','exit':'車道匯出',
};
export const ROAD_FEATURE_KINDS=Object.keys(ROAD_FEATURE_LABELS) as RoadFeatureKind[];

/** All thresholds are route-planning criteria, not a new steering model.
 * The 20m samples classify the ACTUAL signed curvature, so C06/C07 can reverse
 * direction inside a single authored placement. */
export const ROAD_FEATURE_RULES=Object.freeze({
 stepMeters:20,
 straightMaxDemand:.085,
 minStraightMeters:350,
 turnMinDemand:.12,
 minCurveMeters:260,
 minCurveDegrees:14,
 uTurnDegrees:145,
 minRhythmTurnMeters:65,
 minRhythmTurnDegrees:8,
 maxRhythmGapMeters:135,
 minRhythmTurns:3,
});
type TurnRun={start:number;end:number;sign:1|-1;angle:number};
const positive=(n:number)=>n>=0?'left' as const:'right' as const;

/** Analyses a completed recipe exactly once during route planning. Does not
 * touch Three.js, geometry, camera or scene streaming, and does not change
 * route placements or their fingerprint. A second seed creates a new plan. */
export function analyzeRoadFeatures(stage:PilotCandidate):readonly RoadFeature[]{
 const length=stage.length,step=ROAD_FEATURE_RULES.stepMeters;
 const sources:Omit<RoadFeature,'id'|'biome'>[]=[];
 const turns:TurnRun[]=[];
 const biomeAt=(start:number,end:number)=>{
  const middle=Math.max(0,Math.min(length,(start+end)*.5-BRICK_START));
  return (stage.worldPhases.find(p=>middle<p.endS)??stage.worldPhases.at(-1))?.world??stage.world;
 };
 const add=(feature:Omit<RoadFeature,'id'|'biome'>)=>{
  if(feature.end>feature.start&&feature.start>=BRICK_START&&feature.end<=BRICK_START+length)sources.push(feature);
 };
 let turn:TurnRun|undefined,straightStart:number|undefined;
 const flushTurn=()=>{if(turn){turns.push(turn);turn=undefined;}};
 const flushStraight=(end:number)=>{
  if(straightStart!==undefined&&end-straightStart>=ROAD_FEATURE_RULES.minStraightMeters){
   add({kind:'long-straight',start:BRICK_START+straightStart,end:BRICK_START+end});
  }
  straightStart=undefined;
 };
 for(let from=0;from<length;from+=step){
  const to=Math.min(length,from+step),demand=pilotSample(stage,BRICK_START+(from+to)/2).demand;
  const magnitude=Math.abs(demand),sign:1|-1=demand>=0?1:-1;
  if(magnitude<=ROAD_FEATURE_RULES.straightMaxDemand){
   if(straightStart===undefined)straightStart=from;
  }else flushStraight(from);
  if(magnitude>=ROAD_FEATURE_RULES.turnMinDemand){
   if(turn&&turn.sign!==sign)flushTurn();
   if(!turn)turn={start:from,end:to,sign,angle:0};
   turn.end=to;turn.angle+=demand*CURVATURE_PER_STEER*(to-from);
  }else flushTurn();
 }
 flushStraight(length);flushTurn();
 // Ignore sub-40m knot troughs inside the SAME turn, but never connect across
 // an actual left/right reversal.
 const merged:TurnRun[]=[];
 for(const run of turns){
  const last=merged.at(-1);
  if(last&&last.sign===run.sign&&run.start-last.end<=40){
   last.end=run.end;last.angle+=run.angle;
  }else merged.push({...run});
 }
 for(const run of merged){
  const degrees=Math.abs(run.angle)*180/Math.PI;
  const start=BRICK_START+run.start,end=BRICK_START+run.end;
  if(degrees>=ROAD_FEATURE_RULES.uTurnDegrees){
   add({kind:'u-turn',start,end,direction:positive(run.sign),turnDegrees:Math.round(degrees)});
  }
  if(run.end-run.start>=ROAD_FEATURE_RULES.minCurveMeters&&degrees>=ROAD_FEATURE_RULES.minCurveDegrees){
   add({kind:'long-curve',start,end,direction:positive(run.sign),turnDegrees:Math.round(degrees)});
  }
 }
 // An S rhythm is a run of >= 3 substantial alternating turns. Single C07
 // placements can qualify; do not assume the authored placement's direction
 // stays constant inside the profile.
 const eligible=merged.filter(run=>run.end-run.start>=ROAD_FEATURE_RULES.minRhythmTurnMeters&&
  Math.abs(run.angle)*180/Math.PI>=ROAD_FEATURE_RULES.minRhythmTurnDegrees);
 let group:TurnRun[]=[];
 const flushGroup=()=>{
  if(group.length>=ROAD_FEATURE_RULES.minRhythmTurns){
   const signs=group.map(run=>positive(run.sign));
   add({kind:'s-bends',start:BRICK_START+group[0].start,end:BRICK_START+group.at(-1)!.end,
    direction:signs[0],turns:group.length,pattern:signs.map(s=>s==='left'?'左':'右').join('→')});
  }
  group=[];
 };
 for(const run of eligible){
  const last=group.at(-1);
  if(last&&(run.sign===last.sign||run.start-last.end>ROAD_FEATURE_RULES.maxRhythmGapMeters))flushGroup();
  group.push(run);
 }
 flushGroup();
 // Only the actual authored merge/exit is a junction. An unrelated width
 // taper isn't automatically a road connection or an imaginary feeder road.
 const interchange=selectRoadInterchange(stage);
 if(interchange&&interchange.lanes.wide===5){
  add({kind:'merge',start:interchange.entry.start,end:interchange.entry.end,
   direction:'right',lanesBefore:4,lanesAfter:5});
  add({kind:'exit',start:interchange.exit.start,end:interchange.exit.end,
   direction:'right',lanesBefore:5,lanesAfter:4});
 }
 const ordered=sources.sort((a,b)=>a.start-b.start||a.end-b.end||a.kind.localeCompare(b.kind));
 return Object.freeze(ordered.map((f,i)=>Object.freeze({
  ...f,id:`rf-${f.kind}-${Math.round(f.start)}-${i}`,biome:biomeAt(f.start,f.end),
 })));
}
