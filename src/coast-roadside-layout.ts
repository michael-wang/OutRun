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
 {start:7000,end:9970,kind:'mixed'},
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
 const along=smooth(site.start,site.start+18,d)*(1-smooth(site.end-18,site.end,d));
 const across=smooth(COAST_DRAIN_X.leftLip,COAST_DRAIN_X.innerLeft,x)*
  (1-smooth(COAST_DRAIN_X.innerRight,COAST_DRAIN_X.rightLip,x));
 return (site.kind==='covered'?.88:1.12)*along*across;
}
/** A short concrete driveway crossing and scattered grates interrupt the rural
 * gutter; in town most of the same channel is closed with cover slabs.
 */
export function coastDrainCovered(d:number){
 const site=coastDrainAt(d);
 if(!site)return false;
 if(site.kind==='covered')return true;
 // Only a few short village/farm driveways have concrete crossings, not a
 // repeating stripe every few metres of the real open ditch.
 return [
  [1036,1082],[1250,1267],[2070,2110],[2700,2745],
  [4730,4760],[5850,5885],[7350,7390],
  [8710,8765],[8975,9035],[9550,9595],
 ].some(([from,to])=>d>=from&&d<to);
}
/** Preserve the existing invisible off-road corridor but stop the car BEFORE
 * its right tyres could hang over the open culvert. The safe limit eases in
 * over 70m so entering a demonstration section cannot jerk the car sideways.
 */
export function coastDrainRightLimit(d:number,usualLimit:number){
 const safe=COAST_DRAIN_X.leftLip-1.13-.12;
 let influence=0;
 for(const site of COAST_SIDE_DRAINS){
  const near=smooth(site.start-70,site.start,d),far=1-smooth(site.end,site.end+70,d);
  influence=Math.max(influence,near*far);
 }
 return usualLimit-Math.max(0,usualLimit-safe)*influence;
}
export type CoastUtilityPole={d:number;x:number;height:number;transformer:boolean;lamp?:boolean};
/** Old hero-region poles keep their exact coordinates; the rest of the
 * coast is populated in uneven 95–175m runs. Far fewer lamps than the
 * historical 64m road-light row: roughly 1 in 4 poles carries a light.
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
export const COAST_UTILITY_POLES:readonly CoastUtilityPole[]=Object.freeze(
 [...CURATED_POLES,...generated].sort((a,b)=>a.d-b.d),
);
export function coastPoleLinks(start:number,end:number){
 return COAST_UTILITY_POLES.slice(1).flatMap((next,i)=>{
  const prev=COAST_UTILITY_POLES[i];
  // Don't connect different scenic chapters with a 2km floating wire!
  if(next.d-prev.d>240||next.d<=start||prev.d>=end)return [];
  return [{from:prev,to:next,start:Math.max(prev.d,start),end:Math.min(next.d,end)}];
 });
}
