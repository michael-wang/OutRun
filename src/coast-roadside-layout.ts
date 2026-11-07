import {townStreetAt} from './coast-town-access';
/** Taiwan roadside drainage R2 — almost the entire ten-kilometre coast.
 * An uninterrupted inland-side roadside theme; coast-side beach/sea untouched.
 * Fields and open country have open U-drains, town fronts have flush covers;
 * tiny cover crossings/driveway spans are encoded by coastDrainCovered().
 */
export const COAST_SIDE_DRAINS=[
 {start:60,end:1900,kind:'open'},
 {start:1900,end:3400,kind:'mixed'},
 {start:3400,end:4435,kind:'covered'},
 {start:4435,end:4900,kind:'open'},
 {start:4900,end:5680,kind:'covered'},
 {start:5680,end:6200,kind:'mixed'},
 {start:6200,end:7000,kind:'covered'},
 // Near the finish this channel runs beneath a continuous concrete
 // culvert. Never expose an abrupt blue water source at 9,954m.
 {start:7000,end:9600,kind:'mixed'},
 {start:9600,end:10100,kind:'covered'},
] as const;
export type CoastDrain=(typeof COAST_SIDE_DRAINS)[number];
/** Physical metres right of the road centre on the five-lane coast.
 * Asphalt ends immediately beside the 10.26m lip. The previous channel
 * started at 14.65m BEHIND a sandy 6m shoulder and metal highway rail.
 * This tighter, steep-sided cross-section reads as Taiwanese roadside.
 */
export const COAST_DRAIN_X={outerRoad:10.12,leftLip:10.26,innerLeft:10.48,innerRight:12.38,rightLip:12.62,outerLand:14.75} as const;
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function coastDrainAt(d:number):CoastDrain|undefined{
 return COAST_SIDE_DRAINS.find(x=>d>=x.start&&d<x.end);
}
export function coastDrainOverlaps(start:number,end:number){
 return COAST_SIDE_DRAINS.some(x=>x.start<end&&x.end>start);
}
export function coastDrainDepth(x:number,d:number){
 const site=coastDrainAt(d);
 if(!site)return 0;
 // Adjacent scenic chapters are one continuous physical channel, not
 // eight little disconnected trenches that flatten at every zone boundary.
 const first=COAST_SIDE_DRAINS[0],last=COAST_SIDE_DRAINS[COAST_SIDE_DRAINS.length-1];
 const along=smooth(first.start,first.start+18,d)*(1-smooth(last.end-18,last.end,d));
 const across=smooth(COAST_DRAIN_X.leftLip,COAST_DRAIN_X.innerLeft,x)*
  (1-smooth(COAST_DRAIN_X.innerRight,COAST_DRAIN_X.rightLip,x));
 return (site.kind==='covered'?.88:1.12)*along*across;
}
/** Small one-lane farm/house access slabs, never 40m-long fake drain covers.
 * Distances are authored near rice plots, farmsteads, and scattered houses.
 * All placements are absolute route coordinates so bridges align across chunks.
 */
export const COAST_DRAIN_BRIDGES:readonly {d:number;width:number}[]=[
 {d:115,width:7},{d:340,width:6},{d:560,width:6},{d:785,width:6},
 {d:1052,width:8},{d:1260,width:7},{d:1490,width:6},{d:1745,width:7},
 {d:2090,width:7},{d:2730,width:7},
 {d:4472,width:7},{d:4665,width:6},{d:4865,width:7},
 {d:5756,width:7},{d:5960,width:6},{d:6165,width:7},
 {d:7160,width:7},{d:7390,width:6},{d:7630,width:6},
 {d:7885,width:6},{d:8160,width:7},
 {d:8430,width:7},{d:8660,width:6},{d:8880,width:6},
 {d:9100,width:6},{d:9325,width:6},{d:9550,width:6},{d:9670,width:7},
];
export function coastDrainBridgeAt(d:number){
 return COAST_DRAIN_BRIDGES.find(bridge=>Math.abs(d-bridge.d)<bridge.width*.5);
}
/** A covered town drain has precast lids; a farm crossing is a short bridge
 * over the OPEN channel, whose water must still flow underneath the slab. */
export function coastDrainCovered(d:number){
 const site=coastDrainAt(d);
 return !!site&&(site.kind==='covered'||!!coastDrainBridgeAt(d));
}
/** Preserve the existing invisible off-road corridor but stop the car BEFORE
 * its right tyres could hang over the open culvert. The safe limit eases in
 * over 70m so entering a demonstration section cannot jerk the car sideways.
 */
export function coastDrainRightLimit(d:number,usualLimit:number){
 const safe=COAST_DRAIN_X.leftLip-1.13-.12;
 let influence=0;
 for(const site of COAST_SIDE_DRAINS){
  const near=smooth(Math.max(0,site.start-70),site.start,d),far=1-smooth(site.end,site.end+70,d);
  influence=Math.max(influence,near*far);
 }
 return usualLimit-Math.max(0,usualLimit-safe)*influence;
}
export type CoastUtilityPole={d:number;x:number;height:number;transformer:boolean;lamp?:boolean};
/** All coastal poles are moved immediately behind the far canal lip. Every
 * pole carries a warm road lamp. Uneven rural spacing and wire sag remain.
 * Stable absolute coordinates support replay and chunk-boundary ownership.
 */
const CURATED_POLES:readonly CoastUtilityPole[]=[
 {d:808,x:18.9,height:10.6,transformer:false},
 {d:906,x:18.7,height:10.2,transformer:false,lamp:true},
 {d:988,x:19.0,height:10.7,transformer:false},
 {d:1131,x:18.9,height:10.4,transformer:true},
 {d:1257,x:18.7,height:10.6,transformer:false,lamp:true},
 {d:1403,x:19.1,height:10.2,transformer:false},
 {d:3973,x:18.8,height:10.8,transformer:false},
 {d:4060,x:19.2,height:10.5,transformer:false,lamp:true},
 {d:4183,x:18.8,height:10.8,transformer:true},
 {d:4316,x:18.9,height:10.3,transformer:false,lamp:true},
 {d:4412,x:18.8,height:10.5,transformer:false},
 {d:8536,x:19.1,height:10.3,transformer:false},
 {d:8640,x:18.9,height:10.6,transformer:false,lamp:true},
 {d:8786,x:19.1,height:10.5,transformer:false},
 {d:8908,x:18.8,height:10.2,transformer:true},
 {d:9106,x:18.9,height:10.4,transformer:false,lamp:true},
];
function poleNoise(seed:number){
 let x=seed>>>0;
 x=Math.imul(x^(x>>>16),0x7feb352d);
 x=Math.imul(x^(x>>>15),0x846ca68b);
 return ((x^(x>>>16))>>>0)/4294967296;
}
const POLE_FILL_GAPS=[
 [90,730],[1530,3850],[4580,8420],[9240,9930],
] as const;
const generated:CoastUtilityPole[]=[];
for(const [index,[from,to]] of POLE_FILL_GAPS.entries()){
 let d=from+19+poleNoise(index*503+41)*30,step=0;
 while(d<to){
  const z=Math.round(d),r=poleNoise(index*10007+step*177+83);
  generated.push({
   d:z,x:18.55+poleNoise(z+71)*.75,
   height:10.0+poleNoise(z+421)*.92,
   transformer:step%13===8,
   lamp:r>.69 && step%3!==0,
  });
  d+=98+poleNoise(index*911+step*83+77)*76;
  step++;
 }
}
/** Clearance prevents a pole from standing inside a narrow access bridge.
 * The outer bank starts at x=12.62; poles sit about 0.55m farther inland. */
export const COAST_UTILITY_POLES:readonly CoastUtilityPole[]=Object.freeze(
 [...CURATED_POLES,...generated].map(p=>{
  let d=p.d;
  const near=COAST_DRAIN_BRIDGES.find(b=>Math.abs(d-b.d)<b.width*.5+5);
  if(near)d=near.d+near.width*.5+9;
  // Pole + road-light must not stand on a town side-street junction.
  // Recheck after each move so close crossings never accidentally collide.
  for(let n=0;n<3;n++){
   const road=townStreetAt(d,10);
   if(!road)break;
   const direction=d<road.d?-1:1;
   d=Math.round(road.d+direction*(road.width*.5+12));
  }
  return {...p,d,x:COAST_DRAIN_X.rightLip+.55+(poleNoise(Math.round(d)+71)-.5)*.22,lamp:true};
 }).sort((a,b)=>a.d-b.d),
);
export function coastPoleLinks(start:number,end:number){
 return COAST_UTILITY_POLES.slice(1).flatMap((next,i)=>{
  const prev=COAST_UTILITY_POLES[i];
  // Don't connect different scenic chapters with a 2km floating wire!
  if(next.d-prev.d>240||next.d<=start||prev.d>=end)return [];
  return [{from:prev,to:next,start:Math.max(prev.d,start),end:Math.min(next.d,end)}];
 });
}
