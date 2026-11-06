/** Fixed art direction for the isolated coastal trial; metres along its existing road. */
export const COAST_BEACHES=[
 {distance:1570,radius:630,extra:42},
 {distance:4500,radius:610,extra:38},
 {distance:6450,radius:540,extra:36},
 {distance:8270,radius:650,extra:46},
 {distance:9820,radius:420,extra:28},
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
 {d:570,r:4.4,out:2},{d:605,r:2.7,out:5},
 {d:2250,r:5.1,out:3},{d:2285,r:3.4,out:6},
 {d:4550,r:4.7,out:1},{d:4590,r:2.9,out:7},
 {d:6620,r:5.3,out:3},{d:6660,r:3.2,out:7},
 {d:9520,r:4.8,out:2},{d:9565,r:3.1,out:6},
] as const;
export const coastRockX=(rock:typeof COAST_ROCKS[number])=>coastBeachX(-26,rock.d)-rock.out;

export const COAST_DISTRICTS=[
 {start:480,end:980,kind:'homes'},
 {start:3900,end:4350,kind:'market'},
 {start:5050,end:5760,kind:'homes'},
 {start:6720,end:7310,kind:'market'},
 {start:7930,end:9060,kind:'market'},
 {start:9450,end:10100,kind:'homes'},
] as const;
export const coastDistrictAt=(d:number)=>COAST_DISTRICTS.find(s=>d>=s.start&&d<s.end);
/** Resort pedestrian links, absolute distances so chunk seams never reset paint. */
export const COAST_CROSSWALKS=[750,2700,3930,5410,7010,8460,9740] as const;
export const coastCrosswalkNear=(d:number,margin=8)=>COAST_CROSSWALKS.some(at=>Math.abs(d-at)<margin);
/** Choose barriers from coastal life, not a 144m checkerboard.
 * Seaward public beach pockets need walkable low stone; remote coastline
 * receives long uninterrupted metal rail. Inland districts get safe, porous
 * frontage. All boundaries are authored in absolute route metres.
 */
export type CoastBarrierStyle='opening'|'block'|'rail';
export function coastBarrierStyle(d:number,side:-1|1=-1):CoastBarrierStyle {
 if(coastCrosswalkNear(d,14))return 'opening';
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
