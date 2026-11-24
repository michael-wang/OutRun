
export interface RoadInterchange {
 beat:string;side:1;
 entry:{start:number;end:number};exit:{start:number;end:number};
 /** Before generation, a 4→6→4 pair is selected; the chosen pair becomes 4→5→4. */
 lanes:{before:4;wide:5|6;after:4};
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export type RampKind='entry'|'exit';
export const RAMP_WIDTH=3.5;
export const RAMP_DROP={entry:11,exit:14} as const;
export const RAMP_RETAINING_WALL_OFFSET=4.2;

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
 const gap=kind==='entry'?13*(1-smooth(t)):18*smooth(t);
 // The ramp overlays the fifth (rightmost) lane at the merge/split throat.
 // Afterward that lane *is* the mainline lane; it does not appear as a
 // disconnected accessory beside the highway.
 const overlap=RAMP_WIDTH*(kind==='entry'?smooth((d-site.entry.start)/(site.entry.end-site.entry.start)):
   1-smooth((d-site.exit.start)/(site.exit.end-site.exit.start)));
 return {gap,width,overlap};
}
/** At the far end, each ramp is lower than the highway and disappears
 * beneath ordinary graded terrain. All transitions meet the original
 * road surface before the merge/split (zero gap in vertical continuity). */
export function interchangeRampElevation(site:RoadInterchange,kind:RampKind,d:number){
 if(kind==='entry'){
  const start=site.entry.start;
  return -RAMP_DROP.entry*(1-smooth((d-(start-220))/260));
 }
 const start=site.exit.start;
 return -RAMP_DROP.exit*smooth((d-(start+45))/230);
}
/** Wall begins before the incoming road first appears, or AFTER the outgoing
 * lane has separated. Both ends sink into the terrain rather than ending at
 * a vertical cut. The position is 4.2m outside the mainline asphalt. */
export function interchangeWallSpan(site:RoadInterchange,kind:RampKind){
 return kind==='entry'
  ?{from:site.entry.start-450,to:site.entry.start+10}
  :{from:site.exit.start+75,to:site.exit.end+330};
}
export function interchangeWallTop(site:RoadInterchange,kind:RampKind,d:number){
 const span=interchangeWallSpan(site,kind);
 if(d<span.from||d>span.to)return null;
 const ramp=interchangeRampAt(site,kind,d);
 const separation=ramp?ramp.gap-ramp.overlap:
  kind==='entry'&&d<interchangeRampSpan(site,kind).from?13:
  kind==='exit'&&d>interchangeRampSpan(site,kind).to?18:0;
 // A retaining wall may never cross the throat where a driver can enter
 // or leave the highway. On the outside, the wall rises above camera height.
 const safe=smooth((separation-4.4)/2.8);
 const enter=smooth((d-span.from)/85),leave=smooth((span.to-d)/105);
 const top=-4+11*enter*leave*safe;
 return top;
}
export function interchangeWallVisible(site:RoadInterchange,d:number){
 return (['entry','exit'] as const).some(kind=>(interchangeWallTop(site,kind,d)??-Infinity)>1);
}
/** A single reproducible safe demonstration car: the vehicle starts on the
 * lower feeder, rises along its center and joins the actual rightmost lane.
 * There is no new lane-change AI, and it cannot collide before reaching
 * the highway proper. */
export const INTERCHANGE_DEMO_CAR_ID=-17240;
export function interchangeDemoCarLateral(site:RoadInterchange,d:number,half:number){
 const r=interchangeRampAt(site,'entry',d);
 return r?half+r.gap-r.overlap+r.width*.5:half-RAMP_WIDTH/2;
}
export function interchangeRailOpening(site:RoadInterchange,d:number,side:-1|1){
 if(side!==1)return false;
 const entry=interchangeRampSpan(site,'entry'),exit=interchangeRampSpan(site,'exit');
 return d>=entry.from&&d<=entry.to||d>=exit.from&&d<=exit.to;
}
export function interchangeSceneryClear(site:RoadInterchange,d:number,side:-1|1){
 if(side!==1)return false;
 const entry=interchangeRampSpan(site,'entry'),exit=interchangeRampSpan(site,'exit');
 const inWall=interchangeWallSpan(site,'entry'),outWall=interchangeWallSpan(site,'exit');
 return d>=Math.min(entry.from-18,inWall.from-35)&&d<=Math.max(entry.to+18,inWall.to+35)||
  d>=Math.min(exit.from-18,outWall.from-35)&&d<=Math.max(exit.to+18,outWall.to+35);
}
/** Buses (the current right-hand traffic type) use the extra lane while it
 * actually exists, then signal and rejoin well BEFORE the six-to-four taper.
 * The regular lane AI and safety/collision code retain their baseline state. */
export function interchangeTrafficShift(site:RoadInterchange,d:number){
 const enter=smooth((d-site.entry.end-35)/180);
 const leave=1-smooth((d-(site.exit.start-430))/240);
 return RAMP_WIDTH*Math.max(0,enter*leave);
}
