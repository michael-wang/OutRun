/** Fixed art direction for the isolated coastal trial; metres along its existing road. */
export const COAST_BEACHES=[
 {distance:800,radius:245,extra:36},
 {distance:1840,radius:290,extra:43},
 {distance:2920,radius:260,extra:32},
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
 {d:490,r:4.4,out:2},{d:525,r:2.7,out:5},
 {d:1150,r:5.1,out:3},{d:1185,r:3.4,out:6},
 {d:1460,r:4.7,out:1},{d:1500,r:2.9,out:7},
 {d:2240,r:5.3,out:3},{d:2280,r:3.2,out:7},
 {d:3250,r:4.8,out:2},{d:3295,r:3.1,out:6},
] as const;
export const coastRockX=(rock:typeof COAST_ROCKS[number])=>coastBeachX(-26,rock.d)-rock.out;
