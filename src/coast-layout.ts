/** Fixed art direction for the isolated coastal trial; metres along its existing road. */
export const COAST_BEACHES=[
 {distance:1570,radius:630,extra:42},
 {distance:8270,radius:650,extra:46},
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
 {start:2560,end:3290,kind:'homes'},
 {start:3460,end:4050,kind:'homes'},
 {start:7930,end:9060,kind:'market'},
] as const;
export const coastDistrictAt=(d:number)=>COAST_DISTRICTS.find(s=>d>=s.start&&d<s.end);
export const COAST_LAMPS=Array.from({length:156},(_,i)=>380+i*64);
