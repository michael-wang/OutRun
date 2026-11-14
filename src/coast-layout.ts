import {coastDrainAt,coastDrainCovered,COAST_DRAIN_X} from './coast-roadside-layout';

/** Coast-only visitor beaches: a large relaxed second act, two lively
 * bays beside town, and just two quiet pockets on the fishing coast.
 * The opening has an open sea vista without a crowded tourist beach.
 */
export const COAST_BEACHES=[
 {distance:2560,radius:740,extra:50},
 {distance:4310,radius:440,extra:34},
 {distance:6020,radius:420,extra:32},
 {distance:8150,radius:275,extra:19},
 {distance:9610,radius:240,extra:16},
] as const;
// Sand points in absolute HUD metres. The shorter flank and longer flank
// differ at each point; water comes back close to the road between them.
// These shape the terrain independently of visitor beaches and their props.
export const COAST_SAND_POINTS=[
 {start:910,tip:1280,end:1500,reach:40},
 {start:1510,tip:1710,end:2070,reach:29},
 {start:2750,tip:3030,end:3220,reach:32},
 {start:3680,tip:3900,end:4180,reach:38},
 {start:4450,tip:4750,end:4970,reach:46},
 {start:5450,tip:5685,end:5830,reach:44},
 {start:6410,tip:6770,end:6970,reach:52},
 {start:6990,tip:7200,end:7480,reach:31},
 {start:7850,tip:8030,end:8320,reach:31},
 {start:8730,tip:9130,end:9340,reach:46},
 {start:9510,tip:9780,end:10030,reach:54},
 {start:10060,tip:10240,end:10520,reach:30},
 {start:11640,tip:11850,end:12050,reach:28},
 {start:12410,tip:12600,end:12880,reach:38},
] as const;
export function coastBeachExtra(d:number){
 let extra=0;
 for(const bay of COAST_BEACHES){const t=Math.max(0,1-Math.abs(d-bay.distance)/bay.radius);extra+=bay.extra*t*t*(3-2*t);}
 for(const point of COAST_SAND_POINTS){
  if(d<point.start)break;
  if(d>point.end)continue;
  const t=d<point.tip?(d-point.start)/(point.tip-point.start):(point.end-d)/(point.end-point.tip);
  extra+=point.reach*t*t*(3-2*t);
  break;
 }
 return extra+2*(1+Math.sin(d*.019+Math.sin(d*.007)));
}
/** Remap the old cross-section, preserving the inner dry shoulder exactly. */
export function coastBeachX(x:number,d:number){
 if(x>=-11)return x;
 const e=coastBeachExtra(d);
 return x<-26?x-e:-11+(x+11)*(15+e)/15;
}
export function coastProfileX(x:number,d:number){
 if(x>=-11)return x;
 const e=coastBeachExtra(d);
 return x<-26-e?x+e:-11+(x+11)*15/(15+e);
}
export const COAST_MARKET_BEACHES=[2560,6020] as const;
export const COAST_BEACH_STALLS=COAST_MARKET_BEACHES.flatMap(centre=>
 [-128,-111,-78,-28,3,19].map((offset,i)=>({d:centre+offset,x:-21-i%2*3})));
export const COAST_LANDINGS=[4490,4570,4775,8920].map(d=>({d,x:-25,radius:7}));

/** Ten main breakers carry the detailed water contact and long sunset shadows.
 * The reefs between them share the local surf and the streamed rock batches. */
export const COAST_ROCKS=[
 {d:2110,r:4.4,out:2},{d:2155,r:2.7,out:5},
 {d:12085,r:6.5,out:2},{d:12115,r:4.1,out:4},
 {d:6372,r:5.4,out:8},{d:6508,r:6.7,out:15},
 {d:6660,r:7.3,out:7},{d:6818,r:6.4,out:12},
 {d:9780,r:5.8,out:2},{d:9810,r:3.6,out:5},
] as const;
// Unequal strings of skerries: low tables close to the wet sand and heavier
// blocks offshore. The gaps between strings admit a clear line of white water.
export const COAST_REEF_ROCKS=[
 [6320,3.1,3],[6332,2.3,9],[6356,3.7,18],[6379,2.8,22],[6389,4.1,5],
 [6420,3.4,10],[6431,5.0,18],[6438,2.2,2],[6455,2.8,6],[6479,4.7,12],
 [6495,3.5,2],[6518,4.3,4],[6532,3.5,23],[6561,5.6,12],[6574,2.6,4],
 [6592,3.2,6],[6614,4.9,22],[6621,2.6,7],[6645,3.8,3],[6673,4.2,17],
 [6692,2.8,5],[6707,3.7,13],[6725,5.1,21],[6737,2.7,4],[6752,3.7,11],
 [6782,4.6,19],[6793,2.5,3],[6828,3.8,5],[6850,4.1,15],[6867,2.9,8],
 [6884,3.2,6],
].map(([d,r,out])=>({d,r,out}));
export const coastRockX=(rock:{d:number;out:number})=>coastBeachX(-26,rock.d)-rock.out;

/** Compact town → housing → farm openings → markets → quiet gaps.
 * No permanent market or dense housing before 3.4km or after 7km.
 */
export const COAST_DISTRICTS=[
 {start:3460,end:3880,kind:'homes'},
 {start:3950,end:4430,kind:'market'},
 {start:4930,end:5300,kind:'homes'},
 {start:5350,end:5680,kind:'market'},
 {start:6220,end:6480,kind:'homes'},
 {start:6540,end:6940,kind:'market'},
] as const;
export const coastDistrictAt=(d:number)=>COAST_DISTRICTS.find(s=>d>=s.start&&d<s.end);
/** Resort pedestrian links, absolute distances so chunk seams never reset paint. */
export const COAST_CROSSWALKS=[1050,2410,3690,4180,5460,6640,7940,9600] as const;
export const coastCrosswalkNear=(d:number,margin=8)=>COAST_CROSSWALKS.some(at=>Math.abs(d-at)<margin);
/** Choose barriers from coastal life, not a 144m checkerboard.
 * Seaward public beach pockets need walkable low stone; remote coastline
 * receives long uninterrupted metal rail. Inland districts get safe, porous
 * frontage. All boundaries are authored in absolute route metres.
 */
export type CoastBarrierStyle='opening'|'block'|'rail'|'rock'|'none';
/** Physical distance from the asphalt edge, not the former highway shoulder.
 * Rural stone blocks sit immediately BEFORE the open ditch; covered drains
 * and the deliberately unguarded fishing section have NO visible barrier.
 */
export function coastBarrierClearance(d:number,side:-1|1=-1){
 // The seaward rail and tourist bollards sit just OUTSIDE the -11m
 // asphalt apron; previously they stood beyond the sand at -12.63m.
 if(side===-1)return 2.40;
 return coastDrainAt(d)?.kind==='open'?1.05:TRIP_BARRIER_INNER_FALLBACK;
}
const TRIP_BARRIER_INNER_FALLBACK=3.6+.28;
export function coastBarrierStyle(d:number,side:-1|1=-1):CoastBarrierStyle {
 if(side===-1){
  // An invisible left ocean wall is not acceptable in the first map.
  // Continuous, low visible protection lets the player understand why
  // they cannot leave the coastal highway without blocking the sea view.
  // Promenades get concrete/steel posts and a low linking beam.
  if(COAST_BEACHES.some(b=>Math.abs(d-b.distance)<Math.min(440,b.radius*.70)))return 'block';
  return 'rail';
 }
 if(coastCrosswalkNear(d,14))return 'opening';
 if(side===1){
  const drain=coastDrainAt(d);
  if(drain){
   if(drain.kind==='open')return coastDrainCovered(d)?'none':'block';
   return 'none'; // town lid and remote unguarded rural ditch
  }
 }
 return coastDistrictAt(d)!==undefined||coastCrosswalkNear(d,65)?'block':'rail';
}
/** The sea-side collision limit is backed by continuous VISIBLE protection:
 * low steel guardrails between public beaches, linked bollard/beam parapets
 * on promenades. Inland drainage/junction safety rules remain unchanged.
 * GuardrailContact handles player-body dimensions; CoastStoneContact checks
 * individual concrete blocks before the continuous boundary contact.
 */
export function coastDriveBounds(d:number,half:number){
 const sea=coastBarrierStyle(d,-1);
 const inland=coastBarrierStyle(d,1);
 const seaRailCentre=half+coastBarrierClearance(d,-1);
 const left=sea==='rail'?-seaRailCentre+.05
  :sea==='block'?-seaRailCentre-.38:-11.0;
 const right=inland==='block'?COAST_DRAIN_X.leftLip+.06
  :coastDrainAt(d)?COAST_DRAIN_X.outerRoad:half+.15;
 return {left,right};
}

/** Retained only for legacy geometry snapshots; current coast layouts no
 * longer select 'rock' as a guardrail style. Offshore scenic rocks remain.
 */
export function coastBarrierRockAt(d:number){
 const slot=Math.floor(d/33);
 const noise=(k:number)=>{const v=Math.sin((slot+73)*41.79+k*107.31)*43152.57;return v-Math.floor(v);};
 return {
  d:Math.max(0,d+(noise(1)-.5)*7.5),
  offset:3.3+noise(2)*.90,
  width:2.2+noise(3)*1.2,
  height:1.2+noise(4)*1.20,
  length:2.7+noise(5)*1.6,
  yaw:(noise(6)-.5)*.9,
 };
}

/** Stable, modest human irregularity, shared by render and shadow coordinates. */
export function coastBarrierStoneAt(d:number,side:-1|1){
 const slot=Math.floor(d/12);
 const rand=(salt:number)=>{const v=Math.sin((slot+1)*97.13+(side+3)*31.77+salt*17.11)*43758.5453;return v-Math.floor(v);};
 return {d:Math.max(0,d+(rand(1)-.5)*3.2),length:2.2+rand(2),height:.40+rand(3)*.07};
}
/** The former 64m standalone lamp grid is retired. Taiwan-style street
 * lights are now a sparse attribute of COAST_UTILITY_POLES instead.
 */
export const COAST_LAMPS:readonly number[]=[];
