import {BRICK_START} from './bricks';
import type {PilotCandidate} from './pilot-composer';
import type {BridgeSpan} from './bridge';

export interface RoadInterchange {
 beat:string;side:1;
 entry:{start:number;end:number};exit:{start:number;end:number};
 /** Before generation, a 4→6→4 pair is selected; the chosen pair becomes 4→5→4. */
 lanes:{before:4;wide:5|6;after:4};
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
  if(p.id!=='W02'||p.parameters.from!==4||(p.parameters.to!==6&&p.parameters.to!==5))continue;
  const next=widths.find(q=>q.channel==='width'&&q.id==='W03'&&q.beat===p.beat
   &&q.startS>p.endS&&q.parameters.from===p.parameters.to&&q.parameters.to===4);
  if(!next)continue;
  const start=BRICK_START+p.startS,end=BRICK_START+next.endS;
  if(start<BRICK_START+700||end>BRICK_START+stage.length-500)continue;
  if(bridge&&start-300<bridge.end+250&&end+300>bridge.start-250)continue;
  pairs.push({beat:p.beat,side:1,entry:{start,end:BRICK_START+p.endS},
   exit:{start:BRICK_START+next.startS,end},lanes:{before:4,wide:p.parameters.to,after:4}});
 }
 if(!pairs.length)return undefined;
 // The single converted five-lane phrase stays selected after generation.
 // Before conversion, prefer an urban/coastal six-lane phrase.
 return pairs.sort((a,b)=>{
  const rating=(site:RoadInterchange)=>{
   const d=site.entry.start,phase=stage.worldPhases.find(p=>d-BRICK_START<p.endS)??stage.worldPhases.at(-1);
   return (site.lanes.wide===5?-100:0)+(phase?.world==='city'?0:phase?.world==='coast'?3:30);
   // The authored curvature/grade are preserved; this only picks a corridor.
  };
  return rating(a)-rating(b)||a.entry.start-b.entry.start;
 })[0];
}
/** A single right-side lane (3.5m) widens the mainline without moving its
 * established left edge. The common centerline follows the new cross-section,
 * and the driving/traffic frame subtracts this shift to preserve old lanes. */
export function interchangeCenterOffset(site:RoadInterchange|undefined,d:number){
 if(!site||site.lanes.wide!==5||d<=site.entry.start||d>=site.exit.end)return 0;
 if(d<site.entry.end)return RAMP_WIDTH*(.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,(d-site.entry.start)/(site.entry.end-site.entry.start)))))/2;
 if(d<=site.exit.start)return RAMP_WIDTH/2;
 return RAMP_WIDTH*(.5+.5*Math.cos(Math.PI*Math.max(0,Math.min(1,(d-site.exit.start)/(site.exit.end-site.exit.start)))))/2;
}
export function interchangeLaneBoundaries(site:RoadInterchange|undefined,d:number,halfWidth:number){
 if(!site||site.lanes.wide!==5||d<site.entry.start||d>site.exit.end)return null;
 const shift=interchangeCenterOffset(site,d);
 // The existing four-lane markings do not move; the fifth line appears only
 // after the added lane is nearly wide enough to drive.
 const base=[-3.5,0,3.5];
 if(shift>1.25)base.push(7);
 return base.map(worldX=>((worldX-shift)*7/halfWidth));
}
export function interchangeRampSpan(site:RoadInterchange,kind:RampKind){
 return kind==='entry'?
  {from:site.entry.start-310,to:site.entry.end+12}:
  {from:site.exit.start-12,to:site.exit.end+310};
}
/** Right-side slip road is separate at its remote end and narrows smoothly to
 * a clear merge nose. Distances are physical meters beyond mainline asphalt. */
export function interchangeRampAt(site:RoadInterchange,kind:RampKind,d:number){
 const span=interchangeRampSpan(site,kind);
 if(d<span.from||d>span.to)return null;
 const t=(d-span.from)/(span.to-span.from);
 const width=RAMP_WIDTH*smooth(kind==='entry'?(d-span.from)/65:(span.to-d)/65);
 const gap=kind==='entry'?13*(1-smooth(t)):13*smooth(t);
 // The ramp overlays the fifth (rightmost) lane at the merge/split throat.
 // Afterward that lane *is* the mainline lane; it does not appear as a
 // disconnected accessory beside the highway.
 const overlap=RAMP_WIDTH*(kind==='entry'?smooth((d-site.entry.start)/(site.entry.end-site.entry.start)):
   1-smooth((d-site.exit.start)/(site.exit.end-site.exit.start)));
 return {gap,width,overlap};
}
export function interchangeRailOpening(site:RoadInterchange,d:number,side:-1|1){
 if(side!==1)return false;
 const entry=interchangeRampSpan(site,'entry'),exit=interchangeRampSpan(site,'exit');
 return d>=entry.from&&d<=entry.to||d>=exit.from&&d<=exit.to;
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
