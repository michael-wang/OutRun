import {BRICK_START} from './bricks';
import {CURVATURE_PER_STEER,REFERENCE_KMH,REFERENCE_SPEED,REFERENCE_TRAVEL,requiredSteering} from './challenges';
import {DEFAULT_PACE} from './pace';
import {pilotSample,type PilotCandidate,type WorldName} from './pilot-composer';
import {selectRoadInterchange} from './road-interchange';

/** Route-planning metadata, independent of the camera, worker and driving loop. */
export type RoadFeatureKind='u-turn'|'long-straight'|'long-curve'|'s-bends'|'merge'|'exit';
export type RoadTurn='left'|'right';
export interface RoadFeatureAnalysis {
 /** Approximate time at 230 km/h indicated with the accepted default pace. */
 readonly durationSeconds:number;
 /** Time under a meaningful turn load (|demand| >= 0.15). */
 readonly activeTurnSeconds:number;
 /** Normalized steering required at reference speed; values >1 require slowing. */
 readonly peakSteer:number;
 readonly meanSteer:number;
 /** Integral of absolute curvature: S-bends do not cancel opposite headings. */
 readonly totalTurnDegrees:number;
 /** Significant left/right reversals, not raw noisy sign flips. */
 readonly reversals:number;
}
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
 readonly turns?:number;
 readonly pattern?:string;
 readonly lanesBefore?:number;
 readonly lanesAfter?:number;
 /** Measured 1–10 score, never assigned by feature name. */
 readonly intensity:number;
 readonly analysis:Readonly<RoadFeatureAnalysis>;
}

export const ROAD_FEATURE_LABELS:Record<RoadFeatureKind,string>={
 'u-turn':'U-turn','long-straight':'長距離直線','long-curve':'長距離彎道',
 's-bends':'連續彎道','merge':'車道匯入','exit':'車道匯出',
};
export const ROAD_FEATURE_KINDS=Object.keys(ROAD_FEATURE_LABELS) as RoadFeatureKind[];
export const ROAD_FEATURE_REFERENCE=Object.freeze({
 speedKmh:REFERENCE_KMH,
 pace:DEFAULT_PACE,
 metersPerSecond:REFERENCE_TRAVEL,
});

/** Observational R0.1 thresholds; no changes to authored placements.
 * 20m resolution keeps computation cheap and deterministic at planning time.
 * Five reference seconds is ~559m, NOT the old 260m / 2.3s classification. */
export const ROAD_FEATURE_RULES=Object.freeze({
 stepMeters:20,
 straightMaxDemand:.085,
 minStraightMeters:350,
 turnMinDemand:.15,
 /** Near-zero signed curvature preserves the full bend angle at its eased tails. */
 minSignedDemand:.006,
 minCurveSeconds:5,
 minCurveMeters:REFERENCE_TRAVEL*5,
 minCurveDegrees:30,
 minCurvePeakSteer:.35,
 minCurveMeanSteer:.25,
 uTurnDegrees:145,
 minUTurnPeakSteer:.85,
 minRhythmTurnMeters:100,
 minRhythmTurnDegrees:20,
 minRhythmPeakSteer:.75,
 minRhythmMeanSteer:.45,
 maxRhythmGapMeters:90,
 minRhythmTurns:2,
});
type TurnRun={start:number;end:number;sign:1|-1;angle:number;peakSteer:number;steerMeters:number;activeMeters:number};
type RoadSample={from:number;to:number;demand:number;steer:number};
const positive=(n:number):RoadTurn=>n>=0?'left':'right';
const degrees=(rad:number)=>Math.abs(rad)*180/Math.PI;
const round2=(n:number)=>Math.round(n*100)/100;
const clampScore=(n:number)=>Math.max(1,Math.min(10,Math.round(n)));

/** One transparent, physical score for all six classes, including ramps.
 * Steering effort dominates, duration rewards sustained input, absolute angle
 * captures tight geometry, and true reversals add counter-steering pressure.
 * No class-specific score floors or mandatory 8–10 feature fabrication. */
export function drivingIntensity(a:RoadFeatureAnalysis):number{
 const sustained=Math.min(1,a.durationSeconds/10)*a.meanSteer;
 return clampScore(1+2.5*a.peakSteer+1.1*a.meanSteer+
  .012*Math.min(200,a.totalTurnDegrees)+1.15*a.reversals+1.2*sustained);
}

/** Called once when generateTrip finishes an r7 route. Read-only, seeded,
 * and excluded from road fingerprint; never invoked during frame rendering. */
export function analyzeRoadFeatures(stage:PilotCandidate):readonly RoadFeature[]{
 const length=stage.length,step=ROAD_FEATURE_RULES.stepMeters;
 const sources:Omit<RoadFeature,'id'|'biome'|'intensity'|'analysis'>[]=[];
 const turns:TurnRun[]=[],samples:RoadSample[]=[];
 const biomeAt=(start:number,end:number)=>{
  const middle=Math.max(0,Math.min(length,(start+end)*.5-BRICK_START));
  return (stage.worldPhases.find(p=>middle<p.endS)??stage.worldPhases.at(-1))?.world??stage.world;
 };
 const add=(feature:Omit<RoadFeature,'id'|'biome'|'intensity'|'analysis'>)=>{
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
 // Exactly the actual signed curvature sampled by the driving track. Each
 // 20m measurement is retained for later metrics; no second pilotSample pass.
 for(let from=0;from<length;from+=step){
  const to=Math.min(length,from+step),demand=pilotSample(stage,BRICK_START+(from+to)/2).demand;
  const steer=Math.abs(requiredSteering(demand*CURVATURE_PER_STEER,REFERENCE_SPEED));
  samples.push({from,to,demand,steer});
  const magnitude=Math.abs(demand),sign:1|-1=demand>=0?1:-1;
  if(magnitude<=ROAD_FEATURE_RULES.straightMaxDemand){
   if(straightStart===undefined)straightStart=from;
  }else flushStraight(from);
  // Signed-angle packets include the eased shoulders of each bend. The
  // previous .15 cutoff shaved ~1.5° off 146° hairpins asymmetrically.
  // Count meaningful (> .15) steering DISTANCE separately for long curves.
  if(magnitude>=ROAD_FEATURE_RULES.minSignedDemand){
   if(turn&&turn.sign!==sign)flushTurn();
   if(!turn)turn={start:from,end:to,sign,angle:0,peakSteer:0,steerMeters:0,activeMeters:0};
   turn.end=to;turn.angle+=demand*CURVATURE_PER_STEER*(to-from);
   turn.peakSteer=Math.max(turn.peakSteer,steer);
   turn.steerMeters+=steer*(to-from);
   if(magnitude>=ROAD_FEATURE_RULES.turnMinDemand)turn.activeMeters+=to-from;
  }else flushTurn();
 }
 flushStraight(length);flushTurn();
 // Bridge a <=40m shallow trough of the SAME sign, never a true reversal.
 const merged:TurnRun[]=[];
 for(const run of turns){
  const last=merged.at(-1);
  if(last&&last.sign===run.sign&&run.start-last.end<=40){
   last.end=run.end;last.angle+=run.angle;
   last.peakSteer=Math.max(last.peakSteer,run.peakSteer);
   last.steerMeters+=run.steerMeters;
   last.activeMeters+=run.activeMeters;
  }else merged.push({...run});
 }
 const strong=(run:TurnRun)=>run.end-run.start>=ROAD_FEATURE_RULES.minRhythmTurnMeters&&
  degrees(run.angle)>=ROAD_FEATURE_RULES.minRhythmTurnDegrees&&
  run.peakSteer>=ROAD_FEATURE_RULES.minRhythmPeakSteer&&
  run.steerMeters/(run.end-run.start)>=ROAD_FEATURE_RULES.minRhythmMeanSteer;
 for(const run of merged){
  const lengthMeters=run.end-run.start,angle=degrees(run.angle);
  const start=BRICK_START+run.start,end=BRICK_START+run.end;
  if(angle>=ROAD_FEATURE_RULES.uTurnDegrees&&run.peakSteer>=ROAD_FEATURE_RULES.minUTurnPeakSteer){
   add({kind:'u-turn',start,end,direction:positive(run.sign),turnDegrees:Math.round(angle)});
  }
  if(run.activeMeters>=ROAD_FEATURE_RULES.minCurveMeters&&angle>=ROAD_FEATURE_RULES.minCurveDegrees&&
   run.peakSteer>=ROAD_FEATURE_RULES.minCurvePeakSteer&&
   run.steerMeters/lengthMeters>=ROAD_FEATURE_RULES.minCurveMeanSteer){
   add({kind:'long-curve',start,end,direction:positive(run.sign),turnDegrees:Math.round(angle)});
  }
 }
 // A sharp L→R is already a rhythm; three turns are not mandatory. Soft
 // C06/C07 undulations do not pass the same physical steering threshold.
 // Iterating ALL runs prevents linking strong turns across a skipped soft turn.
 let group:TurnRun[]=[];
 const flushGroup=()=>{
  if(group.length>=ROAD_FEATURE_RULES.minRhythmTurns){
   const signs=group.map(run=>positive(run.sign));
   add({kind:'s-bends',start:BRICK_START+group[0].start,end:BRICK_START+group.at(-1)!.end,
    direction:signs[0],turns:group.length,pattern:signs.map(s=>s==='left'?'左':'右').join('→')});
  }
  group=[];
 };
 for(const run of merged){
  if(!strong(run)){flushGroup();continue;}
  const last=group.at(-1);
  if(last&&(run.sign===last.sign||run.start-last.end>ROAD_FEATURE_RULES.maxRhythmGapMeters))flushGroup();
  group.push(run);
 }
 flushGroup();
 // A real merge/exit is authored geometry; generic width variation isn't one.
 const interchange=selectRoadInterchange(stage);
 if(interchange&&interchange.lanes.wide===5){
  add({kind:'merge',start:interchange.entry.start,end:interchange.entry.end,
   direction:'right',lanesBefore:4,lanesAfter:5});
  add({kind:'exit',start:interchange.exit.start,end:interchange.exit.end,
   direction:'right',lanesBefore:5,lanesAfter:4});
 }
 const assess=(feature:typeof sources[number]):Readonly<RoadFeatureAnalysis>=>{
  const from=feature.start-BRICK_START,to=feature.end-BRICK_START,span=to-from;
  let peakSteer=0,steerMeters=0,absoluteTurn=0,activeMeters=0;
  for(const s of samples){
   if(s.to<=from)continue;
   if(s.from>=to)break;
   const overlap=Math.min(to,s.to)-Math.max(from,s.from);
   if(overlap<=0)continue;
   peakSteer=Math.max(peakSteer,s.steer);
   steerMeters+=s.steer*overlap;
   if(Math.abs(s.demand)>=ROAD_FEATURE_RULES.turnMinDemand)activeMeters+=overlap;
   absoluteTurn+=Math.abs(s.demand)*CURVATURE_PER_STEER*overlap;
  }
  let reversals=0,previousSign=0;
  for(const run of merged){
   if(run.end<=from||run.start>=to||!strong(run)||
    Math.min(to,run.end)-Math.max(from,run.start)<ROAD_FEATURE_RULES.minRhythmTurnMeters/2)continue;
   if(previousSign&&previousSign!==run.sign)reversals++;
   previousSign=run.sign;
  }
  return Object.freeze({
   durationSeconds:round2(span/REFERENCE_TRAVEL),
   activeTurnSeconds:round2(activeMeters/REFERENCE_TRAVEL),
   peakSteer:round2(peakSteer),
   meanSteer:round2(steerMeters/span),
   totalTurnDegrees:Math.round(degrees(absoluteTurn)),
   reversals,
  });
 };
 const ordered=sources.sort((a,b)=>a.start-b.start||a.end-b.end||a.kind.localeCompare(b.kind));
 return Object.freeze(ordered.map((f,i)=>{
  const analysis=assess(f);
  return Object.freeze({...f,id:`rf-${f.kind}-${Math.round(f.start)}-${i}`,
   biome:biomeAt(f.start,f.end),analysis,intensity:drivingIntensity(analysis)});
 }));
}
