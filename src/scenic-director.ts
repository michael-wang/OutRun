import {BRICK_START} from './bricks';
import {REFERENCE_SPEED,REFERENCE_TRAVEL,CURVATURE_PER_STEER,requiredSteering} from './challenges';
import {drivingIntensity,ROAD_FEATURE_RULES,type RoadFeature} from './road-features';
import {pilotSample,pilotWeights,type Placement,type PilotCandidate,type WorldName} from './pilot-composer';
import type {JourneyLandmark} from './scenery';
import type {StageBeat} from './stage-one';

export type ScenicRole='flow'|'rhythm'|'sweep'|'reveal'|'technical';
export interface ScenicCuePlan {
 readonly id:string;
 readonly role:ScenicRole;
 readonly title:string;
 readonly start:number;
 readonly end:number;
 readonly biome:WorldName;
 readonly targetIntensity:readonly [number,number];
}
export interface ScenicCue extends ScenicCuePlan {
 readonly intensity:number;
 readonly peakSteer:number;
 readonly meanSteer:number;
 readonly effectiveTurnSeconds:number;
 readonly totalTurnDegrees:number;
 readonly reversals:number;
}
export const SCENIC_R1_ROLES:Readonly<Record<ScenicRole,{title:string;target:readonly [number,number]}>>=Object.freeze({
 flow:{title:'舒展與鋪陳',target:[2,4]},
 rhythm:{title:'急左接急右',target:[5,8]},
 sweep:{title:'高速長彎',target:[3,5]},
 reveal:{title:'豁然開朗的長直線',target:[1,3]},
 technical:{title:'山區髮夾彎',target:[8,10]},
});
/** Repeatable eight-beat narrative with a guaranteed rhythm -> sweep -> reveal
 * phrase. Actual measurements can fall outside these advisory target ranges. */
export const SCENIC_R1_SEQUENCE=Object.freeze([
 'flow','rhythm','sweep','reveal','flow','flow','rhythm','sweep',
] as const);

const directionFor=(seed:number,index:number):1|-1=>(seed+index*13)%2===0?1:-1;
const round2=(v:number)=>Math.round(v*100)/100;

/** Compose only signed curvature. All accepted biome, grade, lane-width,
 * interchange, driving and worker data remain the same as the source route.
 * Each paired L/R phrase integrates to zero final heading (but not position),
 * so world travel remains forward rather than accidentally making loops. */
export function planScenicRoad(beats:readonly StageBeat[],seed:number,
 protectedLandmarks:readonly number[]=[]):{
 curves:Placement[];cues:readonly ScenicCuePlan[];
}{
 // One technical landmark in the canyon, never in an urban neighborhood and
 // never interrupting the essential rhythm -> long curve -> straight phrase.
 const canyonCandidates=beats.map((beat,i)=>({beat,i}))
  .filter(x=>x.i>=4&&x.beat.world==='canyon'&&[0,4,5].includes(x.i%8));
 // A landmark is a visual payoff, not something to hide around a 170°
 // switchback. Prefer canyon beats >420m from all established arch anchors.
 const distant=canyonCandidates.filter(({beat})=>protectedLandmarks.every(d=>
  d<BRICK_START+beat.startS-420||d>BRICK_START+beat.endS+420));
 const candidates=distant.length?distant:canyonCandidates;
 const technicalIndex=candidates[Math.floor(candidates.length/2)]?.i??
  beats.findIndex((b,i)=>i>=4&&b.world==='canyon'&&[0,4,5].includes(i%8));
 const curves:Placement[]=[],cues:ScenicCuePlan[]=[];
 for(let i=0;i<beats.length;i++){
  const b=beats[i],role:ScenicRole=i===technicalIndex?'technical':SCENIC_R1_SEQUENCE[i%SCENIC_R1_SEQUENCE.length];
  const definition=SCENIC_R1_ROLES[role],length=b.endS-b.startS;
  cues.push(Object.freeze({id:'director-'+b.id,role,title:definition.title,
   start:BRICK_START+b.startS,end:BRICK_START+b.endS,biome:b.world,
   targetIntensity:definition.target}));
  if(role==='reveal')continue;
  const gap=role==='rhythm'?65:role==='sweep'?90:role==='technical'?95:100;
  const span=role==='rhythm'?Math.min(410,(length-300)/2):
   role==='sweep'?Math.min(920,(length-260)/2):
   role==='technical'?Math.min(710,(length-260)/2):
   Math.min(665,(length-400)/2);
  if(span<=0)throw Error('Scenic beat is too short: '+b.id);
  const effort=role==='rhythm'?.97+(seed+i)%3*.025:
   role==='sweep'?.52+(seed+i)%3*.025:
   role==='technical'?1.18+(seed+i)%3*.025:
   .32+(seed+i)%3*.03;
  const id: 'C02'|'C08'=role==='rhythm'||role==='technical'?'C08':'C02';
  const first=directionFor(seed,i),padding=(length-2*span-gap)/2;
  for(let j=0;j<2;j++){
   const startS=b.startS+padding+j*(span+gap);
   curves.push({channel:'curvature',id,startS,endS:startS+span,
    parameters:{effort,direction:j===0?first:(-first) as 1|-1,start:0,end:1,secondary:.7},
    transition:'smooth',beat:b.id});
  }
 }
 return {curves,cues:Object.freeze(cues)};
}

/** Audit the composed beat at reference speed, after road feature detection.
 * Scores describe actual geometry, not the roles' target ranges or brick names. */
export function scoreScenicRoad(stage:PilotCandidate,cues:readonly ScenicCuePlan[],
 features:readonly RoadFeature[]):readonly ScenicCue[]{
 return Object.freeze(cues.map(cue=>{
  const from=cue.start-BRICK_START,to=cue.end-BRICK_START,span=to-from;
  let steerMeters=0,activeMeters=0,angle=0,peakSteer=0;
  for(let s=from;s<to;s+=ROAD_FEATURE_RULES.stepMeters){
   const end=Math.min(to,s+ROAD_FEATURE_RULES.stepMeters),distance=end-s;
   const demand=pilotSample(stage,BRICK_START+(s+end)/2).demand;
   const steer=Math.abs(requiredSteering(demand*CURVATURE_PER_STEER,REFERENCE_SPEED));
   steerMeters+=steer*distance;angle+=Math.abs(demand)*CURVATURE_PER_STEER*distance;
   if(Math.abs(demand)>=ROAD_FEATURE_RULES.turnMinDemand)activeMeters+=distance;
   peakSteer=Math.max(peakSteer,steer);
  }
  const reversals=features.filter(f=>f.kind==='s-bends'&&f.start>=cue.start&&f.end<=cue.end)
   .reduce((n,f)=>n+f.analysis.reversals,0);
  const meanSteer=steerMeters/span,totalTurnDegrees=Math.round(angle*180/Math.PI);
  const intensity=drivingIntensity({
   durationSeconds:span/REFERENCE_TRAVEL,activeTurnSeconds:activeMeters/REFERENCE_TRAVEL,
   peakSteer,meanSteer,totalTurnDegrees,reversals,
  });
  return Object.freeze({...cue,intensity,peakSteer:round2(peakSteer),meanSteer:round2(meanSteer),
   effectiveTurnSeconds:round2(activeMeters/REFERENCE_TRAVEL),totalTurnDegrees,reversals});
 }));
}

/** Give fixed landmark types a genuinely readable camera approach.
 * Reuse the same final list in QA and Worker scenery; the small candidate
 * search runs once per seed, never per streamed chunk or rendered frame.
 * Existing r7 landmarks and all other landmark kinds remain untouched. */
export function placeScenicLandmarks(stage:PilotCandidate,
 nominal:readonly JourneyLandmark[]):readonly JourneyLandmark[]{
 const chosen:JourneyLandmark[]=[];
 for(const site of nominal){
  if(site.kind!=='canyon-arch'){chosen.push(Object.freeze({...site}));continue;}
  let best=site.distance,bestScore=Infinity;
  for(let offset=-1800;offset<=1800;offset+=100){
   const d=site.distance+offset;
   if(d<BRICK_START+550||d>BRICK_START+stage.length-450)continue;
   if(pilotWeights(stage,d)[1]<.9)continue;
   if(chosen.some(p=>p.kind==='canyon-arch'&&Math.abs(p.distance-d)<1500))continue;
   let maximum=0,sum=0,count=0;
   // A long, calm approach avoids an arch suddenly disappearing around a bend.
   // 400m is the existing chase-camera inspection distance range.
   for(let ahead=0;ahead<=420;ahead+=35){
    const turn=Math.abs(pilotSample(stage,d-ahead).demand);
    maximum=Math.max(maximum,turn);sum+=turn;count++;
   }
   const score=maximum*100+sum/count*45+Math.abs(offset)*.003;
   if(score<bestScore){best=d;bestScore=score;}
  }
  chosen.push(Object.freeze({...site,distance:best}));
 }
 return Object.freeze(chosen.sort((a,b)=>a.distance-b.distance));
}
