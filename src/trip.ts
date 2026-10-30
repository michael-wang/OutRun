import {REFERENCE_TRAVEL} from './challenges';
import {LANE_WIDTH} from './road-profile';
import {validatePilot,type Placement,type WorldName} from './pilot-composer';
import {WORLD_META,type StageCandidate,type StageBeat,type TransitionBuffer,type Verticality} from './stage-one';
import type {CurvatureId,ElevationId} from './l1-profiles';

export const TRIP_VERSION='v0.9-r2';
export interface TripCandidate extends StageCandidate {tripCode:string}
function random(seed:number){let x=seed>>>0;return ()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function hash(v:unknown){let h=2166136261;for(const c of JSON.stringify(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
/** Independent long-form recipe; only lightweight placement metadata is created here. */
export function generateTrip(rawSeed:number,revision:1|2=2):TripCandidate {
 const version=revision===1?'v0.9-r1':TRIP_VERSION;
 const seed=(rawSeed>>>0)||1,rng=random(seed),pick=<T>(v:readonly T[])=>v[Math.floor(rng()*v.length)];
 const length=69000,baseHeight=45,baseLanes=4 as const,placements:Placement[]=[],beats:StageBeat[]=[],buffers:TransitionBuffer[]=[];
 const worlds:WorldName[]=['city','coast','canyon'];
 for(let i=worlds.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[worlds[i],worlds[j]]=[worlds[j],worlds[i]];}
 const phaseCount=6,phaseWeights=Array.from({length:phaseCount},()=>.8+rng()*.4),phaseSum=phaseWeights.reduce((a,b)=>a+b,0);let phaseCursor=0;
 const worldPhases=phaseWeights.map((v,i)=>{const startS=phaseCursor,endS=i===phaseCount-1?length:Math.round(startS+length*v/phaseSum);phaseCursor=endS;return {startS,endS,world:worlds[i%3],beat:['Departure','Open horizon','Ridge and curves','Scenic release','Renewed rhythm','Homeward run'][i]};});
 const count=32,launch=220,finish=300,gaps=Array.from({length:count-1},(_,i)=>i%8===5?pick([350,450,550]):pick([35,65,110,170]));
 const weights=Array.from({length:count},()=>.82+rng()*.36),available=length-launch-finish-gaps.reduce((a,b)=>a+b,0),sum=weights.reduce((a,b)=>a+b,0),sizes=weights.map(w=>Math.floor(available*w/sum));sizes[count-1]+=available-sizes.reduce((a,b)=>a+b,0);
 let cursor=launch;buffers.push({startS:0,endS:launch,role:'launch'});
 const roles=['Open sweeper','S rhythm','Technical approach','Crest reveal','High-speed release','Counter bends','Ridge challenge','Scenic cruise'];
 for(let i=0;i<count;i++){
  const start=cursor,end=start+sizes[i],mid=(start+end)/2,phase=worldPhases.find(p=>mid<p.endS)??worldPhases.at(-1)!,w=WORLD_META[phase.world].verticalityWeights,draw=rng()*(w.gentle+w.rolling+w.dramatic),verticality:Verticality=draw<w.gentle?'gentle':draw<w.gentle+w.rolling?'rolling':'dramatic';
  const beat=`TRIP-${String(i+1).padStart(2,'0')}`,role=roles[(i+seed)%roles.length];beats.push({id:beat,startS:start,endS:end,world:phase.world,verticality,role});
  const dir=(rng()<.5?-1:1) as 1|-1,technical=role==='Technical approach'||role==='Ridge challenge';
  // Each local phrase has equal opposing signed profiles. This bounds cumulative
  // heading while retaining independent steering, and prevents accidental loops.
  const pairGap=45,usable=end-start-160-pairGap*3,span=usable/4;
  for(let pair=0;pair<2;pair++){
   const shape:CurvatureId=technical&&pair===1?pick(['C03','C08'] as const):role==='S rhythm'?pick(['C06','C07'] as const):pick(['C02','C03','C04','C05'] as const);
   const effort=technical&&pair===1?1.28+rng()*.17:.36+rng()*.26,secondary=.55+rng()*.35,sign=(pair===0?dir:-dir) as 1|-1;
   for(let j=0;j<2;j++){const lo=start+80+(pair*2+j)*(span+pairGap);placements.push({channel:'curvature',id:shape,startS:lo,endS:lo+span,parameters:{effort,direction:(j===0?sign:-sign) as 1|-1,start:0,end:1,secondary},transition:'smooth',beat});}
  }
  const eid:ElevationId=pick(verticality==='dramatic'?['E03','E05']:['E03','E04','E05']);const amplitude=verticality==='gentle'?12+rng()*13:verticality==='rolling'?(eid==='E04'?27+rng()*8:40+rng()*30):115+rng()*30;
  placements.push({channel:'elevation',id:eid,startS:start,endS:end,parameters:{base:eid==='E04'?baseHeight-amplitude:baseHeight,amplitude,direction:1,shelfStart:.32,shelfEnd:.68},transition:'smooth',beat});
  if(i%5===1||i%8===4){const wide=pick([6,8] as const);placements.push({channel:'width',id:'W02',startS:start+100,endS:start+250,parameters:{from:4,to:wide,start:0,end:1},transition:'smooth',beat},{channel:'width',id:'W03',startS:end-250,endS:end-100,parameters:{from:wide,to:4,start:0,end:1},transition:'smooth',beat});}
  else if(technical&&rng()<.25)placements.push({channel:'width',id:'W04',startS:start+200,endS:end-200,parameters:{from:4,to:2,start:0,end:1},transition:'smooth',beat});
  cursor=end;if(i<count-1){const next=cursor+gaps[i];buffers.push({startS:cursor,endS:next,role:i%8===5?'scenic':'connector'});cursor=next;}
 }
 buffers.push({startS:cursor,endS:length,role:'finish'});placements.sort((a,b)=>a.startS-b.startS);
 const tripCode=`TRIP-${version}-${seed.toString(36).toUpperCase()}-${revision===1?'ALB1':'ALB2'}`,data={seed,length,placements,worldPhases,beats,buffers,baseHeight,baseLanes,generatorVersion:version};
 const result:TripCandidate={id:'ROAD-TRIP-10M',revision,name:'10-Minute Road Trip',intent:'A changing journey through city, coast and canyon.',emotionalRole:'journey',sceneryAct:2,seed,world:worldPhases[0].world,generatorVersion:version,contentFingerprint:hash(data),stageCode:tripCode,tripCode,beats,buffers,baseHeight,baseLanes,placements,worldPhases,referenceSpeed:230,entrySpeed:0,nominalDuration:length/REFERENCE_TRAVEL,length,roadWidth:baseLanes*LANE_WIDTH,lanes:[[0,4],[length/REFERENCE_TRAVEL,4]],elevation:[[0,baseHeight],[length/REFERENCE_TRAVEL,baseHeight]],requiredSteerProfile:[[0,0]],entry:'Standing start',exit:'Journey finish',warning:{leadMeters:300,text:'BRAKE · 180 km/h'},tags:['trip'],antiAdjacency:[],autoValidation:'PENDING'};
 validatePilot(result);return result;
}
