import {beach2,BEACH2} from './beach2-profile';
/** Revision 3 Composition sites; local metres from the unchanged Macro anchor. */
export const BEACH2_VILLAGE=[
 {s:235,x:23,kind:'shop',yaw:.26},{s:267,x:43,kind:'stay',yaw:.14},{s:272,x:24,kind:'stall',yaw:.32},
 {s:425,x:24,kind:'shop',yaw:.30},{s:477,x:44,kind:'stay',yaw:.12},
 {s:752,x:31,kind:'guest',yaw:.23},
] as const;
export const BEACH2_ACTIVITY=[
 {s:-112,x:-22.5,n:2,label:'curve exit shade'}, {s:-63,x:-24,n:1,label:'shore entrance'}, {s:5,x:-21.5,n:1,label:'refreshments'},
 {s:122,x:-24,n:2,label:'arrival shade'}, {s:219,x:-21,n:3,label:'rental social hub'},
 {s:236,x:-25,n:1,label:'near-bank games'}, {s:360,x:-46,n:2,label:'middle sand families'},
 {s:403,x:-25,n:1,label:'promenade meeting'}, {s:445,x:-58,n:2,label:'seaward picnic'},
 {s:522,x:-24,n:2,label:'cross-bay pause'}, {s:590,x:-37,n:3,label:'second sand pocket'},
 {s:655,x:-22.5,n:2,label:'swim preparation'}, {s:747,x:-23,n:2,label:'lifeguard cove'},
 {s:825,x:-20.5,n:1,label:'quiet waterside rest'},
] as const;
// Offsets from the core along the road. Water offsets are metres seaward
// of the sampled waterline; dry play groups use the landward sand pocket.
export const BEACH2_SWIM_PODS=[
 {s:235,members:[[0,7,'raised'],[3,9,'ring'],[1,12,'swim']]},
 {s:695,members:[[0,8,'ring'],[2,13,'swim'],[5,9,'raised']]},
 {s:778,members:[[0,10,'raised'],[4,7,'ring'],[6,12,'swim']]},
] as const;
// The eight original tower-lane swimmers join the bathing cove in three parties.
// Each entry is [metres from BEACH2.core, metres seaward of waterline, activity, facing angle].
export const BEACH2_COVE_PARTIES=[
 [[673,4.1,'wade',.8],[676,7.2,'ring',-.9]],
 [[709,4.6,'wade',-1.17],[712,6.7,'ring',1.42],[714,10.5,'stroke',0]],
 [[730,4.4,'wade',.36],[733,7.4,'ring',-1.94],[735,11.0,'stroke',0]],
] as const;
export const BEACH2_SAND_PLAY=[{s:226,x:-20.4,yaw:.52},{s:721,x:-20.6,yaw:-.64}] as const;
/** Only the near-ground shop forecourts and approach sight gaps are cleared.
 * Existing hills and vegetation BETWEEN the three clusters remain intact. */
export function beach2VillageClearing(d:number,x:number){
 if(!beach2()||x<15||x>67)return false;
 const s=d-BEACH2.core;
 return (s>=145&&s<=305)||(s>=365&&s<=515)||(s>=705&&s<=790);
}

// The three accepted outcrop footprints are local to the scenic package anchor.
// Broken gravel / strand-grass margins in local station and lateral metres.
export const BEACH2_VERGE_PATCHES=[
 [83,-17.4,9],[246,-17.6,8],[349,-16.1,7],
 [499,-16.1,5],[703,-17.4,6],[889,-17,5.5]
] as const;

export const BEACH2_CAPE_LEDGES=[
 {start:1095,length:31,toe:-15.4,diagonal:4.4,width:4.5,relief:.78},
 {start:1120,length:38,toe:-17.4,diagonal:6.1,width:5.4,relief:1.03},
 {start:1154,length:27,toe:-20.2,diagonal:5.1,width:4.6,relief:.7},
] as const;
export const BEACH2_CAPE_PLANTS=[
 [1099,-25,.53,.8],[1103,-26,.66,2.3],[1127,-33,.77,1.2],[1132,-32,.59,.2],
 [1148,-38,.9,2.6],[1150,-40,.66,-.8],[1179,-32,.59,2.4],[1194,-36,.81,3.1],
 [1197,-37,.63,-.3],[1212,-39,.72,1.7],
] as const;
