import {REFERENCE_TRAVEL} from './challenges';
import {LANE_WIDTH} from './road-profile';
import {createPilotTrack,validatePilot,type PilotCandidate,type Placement,type WorldName} from './pilot-composer';
import {BRICK_START} from './bricks';
import type {CurvatureId,ElevationId} from './l1-profiles';

export const STAGE_VERSION='v0.8.2-r1';
export type Verticality='gentle'|'rolling'|'dramatic';
export const WORLD_META:Record<WorldName,{verticalityWeights:Record<Verticality,number>}>= {
 city:{verticalityWeights:{gentle:5,rolling:4,dramatic:1}},
 coast:{verticalityWeights:{gentle:3,rolling:5,dramatic:2}},
 canyon:{verticalityWeights:{gentle:1,rolling:4,dramatic:5}},
};
export interface StageBeat {id:string;startS:number;endS:number;world:WorldName;verticality:Verticality;role:string}
export interface TransitionBuffer {startS:number;endS:number;role:'launch'|'connector'|'scenic'|'braking'|'finish'}
export interface StageCandidate extends PilotCandidate {stageCode:string;beats:StageBeat[];buffers:TransitionBuffer[]}
function random(seed:number){let x=seed>>>0;return ()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function hash(v:unknown){let h=2166136261;for(const c of JSON.stringify(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function candidate(seed:number,attempt:number):StageCandidate {
 const rng=random((seed+Math.imul(attempt,0x9e3779b9))>>>0),pick=<T>(xs:readonly T[])=>xs[Math.floor(rng()*xs.length)];
 const length=13500,baseHeight=45,baseLanes=4 as const,placements:Placement[]=[],beats:StageBeat[]=[],buffers:TransitionBuffer[]=[];
 // L3 owns the optional connectors; L2 cores contain the driving phrases.
 const launch=180,finish=300,gaps=Array.from({length:7},(_,i)=>i===5?240:i===2?360:pick([30,60,100,150,210]));
 const weights=Array.from({length:8},()=>.9+rng()*.2),coreTotal=length-launch-finish-gaps.reduce((a,b)=>a+b,0),sum=weights.reduce((a,b)=>a+b,0),sizes=weights.map(x=>Math.floor(coreTotal*x/sum));sizes[7]+=coreTotal-sizes.reduce((a,b)=>a+b,0);
 const starts:number[]=[],ends:number[]=[];let cursor=launch;buffers.push({startS:0,endS:launch,role:'launch'});
 for(let i=0;i<8;i++){starts.push(cursor);cursor+=sizes[i];ends.push(cursor);if(i<7){const end=cursor+gaps[i];buffers.push({startS:cursor,endS:end,role:i===2?'scenic':i===5?'braking':'connector'});cursor=end;}}
 buffers.push({startS:cursor,endS:length,role:'finish'});
 const cityIndex=rng()<.5?1:2,coastIndex=rng()<.5?4:5;
 const cityEnd=ends[cityIndex]+gaps[cityIndex]/2,coastEnd=ends[coastIndex]+gaps[coastIndex]/2;
 const worldPhases=[{startS:0,endS:cityEnd,world:'city' as const,beat:'City departure'},{startS:cityEnd,endS:coastEnd,world:'coast' as const,beat:'Open coast'},{startS:coastEnd,endS:length,world:'canyon' as const,beat:'Canyon payoff'}];
 const roles=['Departure','City rhythm','Sea reveal','Coast sweep','Coastal reversal','Canyon approach','Brake challenge','Ridge release'];
 for(let i=0;i<8;i++){
  const start=starts[i],end=ends[i],mid=(start+end)/2,phase=worldPhases.find(p=>mid<p.endS)??worldPhases[2],worldWeights=WORLD_META[phase.world].verticalityWeights,draw=rng()*(worldWeights.gentle+worldWeights.rolling+worldWeights.dramatic);
  const verticality:Verticality=draw<worldWeights.gentle?'gentle':draw<worldWeights.gentle+worldWeights.rolling?'rolling':'dramatic';
  const beat=`S01-${String(i+1).padStart(2,'0')}`,role=roles[i];beats.push({id:beat,startS:start,endS:end,world:phase.world,verticality,role});
  const innerGap=pick([35,65,100,145]),firstStart=start+50,lastEnd=end-50,split=Math.round(firstStart+(lastEnd-firstStart-innerGap)*(.46+rng()*.08)),secondStart=split+innerGap;
  const direction=(rng()<.5?-1:1) as 1|-1,secondDirection=(rng()<.72?-direction:direction) as 1|-1;
  const choices:CurvatureId[]=['C02','C03','C04','C05','C06','C07'];
  for(const [j,a,z,dir] of [[0,firstStart,split,direction],[1,secondStart,lastEnd,secondDirection]] as const){const technical=(i===2&&j===1)||(i===4&&j===0)||(i===6&&j===1),id:CurvatureId=i===6&&j===1?'C08':pick(choices),effort=technical?1.2+rng()*.18:.34+rng()*.32;placements.push({channel:'curvature',id,startS:a,endS:z,parameters:{effort,direction:dir,start:0,end:1,secondary:.55+rng()*.35},transition:'smooth',beat});}
  const eid:ElevationId=pick(verticality==='dramatic'?['E03','E05']:['E03','E04','E05']);
  // A valley starts and ends at the held road height; keep its floor above sea level.
  const amplitude=verticality==='gentle'?12+rng()*13:verticality==='rolling'?(eid==='E04'?27+rng()*8:40+rng()*30):115+rng()*(eid==='E05'?8:30);
  placements.push({channel:'elevation',id:eid,startS:start,endS:end,parameters:{base:eid==='E04'?baseHeight-amplitude:baseHeight,amplitude,direction:1,shelfStart:.32,shelfEnd:.68},transition:'smooth',beat});
  // Mostly four lanes. Long open highways hold a real 6/8-lane width; a
  // short canyon bottleneck is optional and never pretends a taper is 3 lanes.
  if(i===1||i===3||i===5||(i===7&&rng()<.5)){const wide=pick([6,8] as const);placements.push({channel:'width',id:'W02',startS:start+100,endS:start+250,parameters:{from:4,to:wide,start:0,end:1},transition:'smooth',beat},{channel:'width',id:'W03',startS:end-250,endS:end-100,parameters:{from:wide,to:4,start:0,end:1},transition:'smooth',beat});}
  else if(i===6&&rng()<.45)placements.push({channel:'width',id:'W04',startS:start+300,endS:end-300,parameters:{from:4,to:2,start:0,end:1},transition:'smooth',beat});
 }
 placements.sort((a,b)=>a.startS-b.startS);const stageCode=`S01-${STAGE_VERSION}-${seed.toString(36).toUpperCase()}-ALB1`;
 const data={seed,length,placements,worldPhases,beats,buffers,baseHeight,baseLanes,generatorVersion:STAGE_VERSION};
 const stage:StageCandidate={id:'STAGE-01',revision:3,name:'Stage 01: Pacific Getaway',intent:'City departure, coastal release and a canyon challenge.',emotionalRole:'journey',sceneryAct:2,seed,world:'city',generatorVersion:STAGE_VERSION,contentFingerprint:hash(data),stageCode,beats,buffers,baseHeight,baseLanes,placements,worldPhases,referenceSpeed:230,entrySpeed:0,nominalDuration:length/REFERENCE_TRAVEL,length,roadWidth:baseLanes*LANE_WIDTH,lanes:[[0,4],[length/REFERENCE_TRAVEL,4]],elevation:[[0,baseHeight],[length/REFERENCE_TRAVEL,baseHeight]],requiredSteerProfile:[[0,0]],entry:'Standing start',exit:'Canyon relief and finish',warning:{leadMeters:300,text:'BRAKE · 180 km/h'},tags:['stage'],antiAdjacency:[],autoValidation:'PENDING'};
 validatePilot(stage);return stage;
}
/** Reject obvious same-level crossings without changing live handling or the requested seed. */
function clearCorridor(stage:StageCandidate){
 const track=createPilotTrack(stage),cells=new Map<string,{i:number;x:number;z:number}[]>(),cell=180;
 for(let s=0,i=0;s<stage.length;s+=40,i++){
  const p=track.sample(BRICK_START+s).position,x=Math.floor(p.x/cell),z=Math.floor(p.z/cell);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const old of cells.get(`${x+dx},${z+dz}`)??[]){if(i-old.i>=20&&Math.hypot(p.x-old.x,p.z-old.z)<175)return false;}
  const key=`${x},${z}`,list=cells.get(key)??[];list.push({i,x:p.x,z:p.z});cells.set(key,list);
 }return true;
}
export function generateStage(rawSeed:number):StageCandidate {
 const seed=(rawSeed>>>0)||1;
 for(let attempt=0;attempt<64;attempt++){const stage=candidate(seed,attempt);if(clearCorridor(stage))return stage;}
 throw Error(`Unable to construct a clear Stage One for seed ${seed}`);
}
