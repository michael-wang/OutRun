import {BRICK_START} from './bricks';
import {pilotSample,type PilotCandidate} from './pilot-composer';
import type {BridgeSpan} from './bridge';

export interface RoadInterchange {
 beat:string;side:1;
 entry:{start:number;end:number};exit:{start:number;end:number};
 /** Selected from an EXISTING 4->6->4 width phrase. Nothing reauthors the road. */
 lanes:{before:4;wide:6;after:4};
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export type RampKind='entry'|'exit';
export const RAMP_WIDTH=3.5;
/** Only one proof-of-concept interchange per r7 trip, never retroactively
 * changing its accepted lane/curve/elevation placements or historical seeds. */
export function selectRoadInterchange(stage:PilotCandidate,bridge?:BridgeSpan):RoadInterchange|undefined{
 if(stage.id!=='ROAD-TRIP-10M'||stage.generatorVersion!=='v0.9-r7')return undefined;
 const widths=stage.placements.filter(p=>p.channel==='width');
 const pairs:RoadInterchange[]=[];
 for(const p of widths){
  if(p.id!=='W02'||p.parameters.from!==4||p.parameters.to!==6)continue;
  const next=widths.find(q=>q.channel==='width'&&q.id==='W03'&&q.beat===p.beat
   &&q.startS>p.endS&&q.parameters.from===6&&q.parameters.to===4);
  if(!next)continue;
  const start=BRICK_START+p.startS,end=BRICK_START+next.endS;
  if(start<BRICK_START+700||end>BRICK_START+stage.length-500)continue;
  if(bridge&&start-300<bridge.end+250&&end+300>bridge.start-250)continue;
  pairs.push({beat:p.beat,side:1,entry:{start,end:BRICK_START+p.endS},
   exit:{start:BRICK_START+next.startS,end},lanes:{before:4,wide:6,after:4}});
 }
 if(!pairs.length)return undefined;
 // Prefer an urban/coastal interchange in a moderate grade and bend. A fallback
 // within an existing six-lane phrase still works if a seed has no easy site.
 return pairs.sort((a,b)=>{
  const rating=(site:RoadInterchange)=>{
   const d=site.entry.start,phase=stage.worldPhases.find(p=>d-BRICK_START<p.endS)??stage.worldPhases.at(-1);
   const grade=Math.abs(pilotSample(stage,d).grade),demand=Math.abs(pilotSample(stage,d).demand);
   return (phase?.world==='city'?0:phase?.world==='coast'?3:30)+grade*90+demand*5;
  };
  return rating(a)-rating(b)||a.entry.start-b.entry.start;
 })[0];
}
export function interchangeRampSpan(site:RoadInterchange,kind:RampKind){
 return kind==='entry'?
  {from:site.entry.start-250,to:site.entry.end+85}:
  {from:site.exit.start-90,to:site.exit.end+240};
}
/** Right-side slip road is separate at its remote end and narrows smoothly to
 * a clear merge nose. Distances are physical meters beyond mainline asphalt. */
export function interchangeRampAt(site:RoadInterchange,kind:RampKind,d:number){
 const span=interchangeRampSpan(site,kind);
 if(d<span.from||d>span.to)return null;
 const t=(d-span.from)/(span.to-span.from);
 const nearEnd=kind==='entry'?(span.to-d)/85:(d-span.from)/85;
 const farEnd=kind==='entry'?(d-span.from)/65:(span.to-d)/65;
 const width=RAMP_WIDTH*smooth(nearEnd)*smooth(farEnd);
 const gap=kind==='entry'?15*(1-smooth(t)):15*smooth(t);
 return {gap,width};
}
export function interchangeRailOpening(site:RoadInterchange,d:number,side:-1|1){
 return side===1&&(
  d>=site.entry.start+10&&d<=site.entry.end+75||
  d>=site.exit.start-75&&d<=site.exit.end-10
 );
}
export function interchangeSceneryClear(site:RoadInterchange,d:number,side:-1|1){
 if(side!==1)return false;
 const entry=interchangeRampSpan(site,'entry'),exit=interchangeRampSpan(site,'exit');
 return d>=entry.from-18&&d<=entry.to+18||d>=exit.from-18&&d<=exit.to+18;
}
/** Buses (the current right-hand traffic type) use the extra lane while it
 * actually exists, then signal and rejoin well BEFORE the six-to-four taper.
 * The regular lane AI and safety/collision code retain their baseline state. */
export function interchangeTrafficShift(site:RoadInterchange,d:number){
 const enter=smooth((d-site.entry.end-35)/180);
 const leave=1-smooth((d-(site.exit.start-430))/240);
 return RAMP_WIDTH*Math.max(0,enter*leave);
}
