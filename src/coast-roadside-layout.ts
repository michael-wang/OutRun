/** 台灣鄉間路側樣板 R0 — Worker-side absolute-distance recipes.
 * One rural stretch, one village/town stretch and one fishing-farm stretch.
 * Avoid ocean-side ditches: the left shoulder is beach and open water.
 */
export const COAST_SIDE_DRAINS=[
 {start:780,end:1515,kind:'open'},
 {start:3965,end:4435,kind:'covered'},
 {start:8525,end:9210,kind:'mixed'},
] as const;
export type CoastDrain=(typeof COAST_SIDE_DRAINS)[number];
export const COAST_DRAIN_X={outerRoad:14.45,leftLip:14.65,innerLeft:15.25,innerRight:16.65,rightLip:17.35,outerLand:17.65} as const;
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
 const along=smooth(site.start,site.start+12,d)*(1-smooth(site.end-12,site.end,d));
 const across=smooth(COAST_DRAIN_X.leftLip,COAST_DRAIN_X.innerLeft,x)*
  (1-smooth(COAST_DRAIN_X.innerRight,COAST_DRAIN_X.rightLip,x));
 return (site.kind==='covered'?.48:.62)*along*across;
}
/** A short concrete driveway crossing and scattered grates interrupt the rural
 * gutter; in town most of the same channel is closed with cover slabs.
 */
export function coastDrainCovered(d:number){
 const site=coastDrainAt(d);
 if(!site)return false;
 if(site.kind==='covered')return !(d>=4100&&d<4135);
 if(site.kind==='mixed')return (d>=8710&&d<8765)||(d>=8975&&d<9035);
 return (d>=1036&&d<1082)||(d>=1250&&d<1267);
}
export type CoastUtilityPole={d:number;x:number;height:number;transformer:boolean};
/** Fixed irregular but believable spacing; strategically skip the hero gate.
 * All poles stand landward of the roadside drain and before the rice plots.
 */
export const COAST_UTILITY_POLES:readonly CoastUtilityPole[]=[
 {d:808,x:18.9,height:10.6,transformer:false},
 {d:906,x:18.7,height:10.2,transformer:false},
 {d:988,x:19.0,height:10.7,transformer:false},
 {d:1131,x:18.9,height:10.4,transformer:true},
 {d:1257,x:18.7,height:10.6,transformer:false},
 {d:1403,x:19.1,height:10.2,transformer:false},
 {d:3973,x:18.8,height:10.8,transformer:false},
 {d:4060,x:19.2,height:10.5,transformer:false},
 {d:4183,x:18.8,height:10.8,transformer:true},
 {d:4316,x:18.9,height:10.3,transformer:false},
 {d:4412,x:18.8,height:10.5,transformer:false},
 {d:8536,x:19.1,height:10.3,transformer:false},
 {d:8640,x:18.9,height:10.6,transformer:false},
 {d:8786,x:19.1,height:10.5,transformer:false},
 {d:8908,x:18.8,height:10.2,transformer:true},
 {d:9106,x:18.9,height:10.4,transformer:false},
];
export function coastPoleLinks(start:number,end:number){
 return COAST_UTILITY_POLES.slice(1).flatMap((next,i)=>{
  const prev=COAST_UTILITY_POLES[i];
  // Don't connect different scenic chapters with a 2km floating wire!
  if(next.d-prev.d>240||next.d<=start||prev.d>=end)return [];
  return [{from:prev,to:next,start:Math.max(prev.d,start),end:Math.min(next.d,end)}];
 });
}
