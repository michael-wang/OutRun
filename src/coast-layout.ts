import {coastDrainAt,coastDrainCovered} from './coast-roadside-layout';

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
export function coastBeachExtra(d:number){
 let extra=0;
 for(const bay of COAST_BEACHES){const t=Math.max(0,1-Math.abs(d-bay.distance)/bay.radius);extra+=bay.extra*t*t*(3-2*t);}
 // Small scallops between the broad beaches, with no per-frame terrain work.
 return extra+2*(1+Math.sin(d*.019+Math.sin(d*.007)));
}
/** Remap the old cross-section, preserving the inner dry shoulder exactly. */
export function coastBeachX(x:number,d:number){
 const e=coastBeachExtra(d);
 return x>=-11?x:x<-26?x-e:-11+(x+11)*(15+e)/15;
}
export function coastProfileX(x:number,d:number){
 const e=coastBeachExtra(d);
 return x>=-11?x:x<-26-e?x+e:-11+(x+11)*15/(15+e);
}
/** Shared by instanced rocks, water clipping, wash foam and spray. */
export const COAST_ROCKS=[
 {d:2110,r:4.4,out:2},{d:2155,r:2.7,out:5},
 {d:3260,r:5.1,out:3},{d:3295,r:3.4,out:6},
 {d:4950,r:4.7,out:1},{d:4990,r:2.9,out:7},
 {d:7760,r:5.3,out:3},{d:7800,r:3.2,out:7},
 {d:9380,r:4.8,out:2},{d:9425,r:3.1,out:6},
] as const;
export const coastRockX=(rock:typeof COAST_ROCKS[number])=>coastBeachX(-26,rock.d)-rock.out;

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
export type CoastBarrierStyle='opening'|'block'|'rail'|'none';
/** Physical distance from the asphalt edge, not the former highway shoulder.
 * Rural stone blocks sit immediately BEFORE the open ditch; covered drains
 * and the deliberately unguarded fishing section have NO visible barrier.
 */
export function coastBarrierClearance(d:number,side:-1|1=-1){
 return side===1&&coastDrainAt(d)?.kind==='open'?1.05:TRIP_BARRIER_INNER_FALLBACK;
}
const TRIP_BARRIER_INNER_FALLBACK=3.6+.28;
export function coastBarrierStyle(d:number,side:-1|1=-1):CoastBarrierStyle {
 if(coastCrosswalkNear(d,14))return 'opening';
 if(side===1){
  const drain=coastDrainAt(d);
  if(drain){
   if(drain.kind==='open')return coastDrainCovered(d)?'none':'block';
   return 'none'; // town lid and remote unguarded rural ditch
  }
 }
 if(side===-1){
  return COAST_BEACHES.some(b=>Math.abs(d-b.distance)<Math.min(440,b.radius*.70))
   ?'block':'rail';
 }
 return coastDistrictAt(d)!==undefined||coastCrosswalkNear(d,65)?'block':'rail';
}
/** Stable, modest human irregularity, shared by render and shadow coordinates. */
export function coastBarrierStoneAt(d:number,side:-1|1){
 const slot=Math.floor(d/12);
 const rand=(salt:number)=>{const v=Math.sin((slot+1)*97.13+(side+3)*31.77+salt*17.11)*43758.5453;return v-Math.floor(v);};
 return {d:Math.max(0,d+(rand(1)-.5)*3.2),length:2.2+rand(2),height:.40+rand(3)*.07};
}
export const COAST_LAMPS=Array.from({length:156},(_,i)=>380+i*64);
