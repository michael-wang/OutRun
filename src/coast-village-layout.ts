import {COAST_BEACHES,COAST_DISTRICTS} from './coast-layout';
const rand=(n:number)=>{const x=Math.sin(n*127.1+847.3)*43758.5453;return x-Math.floor(x);};
export type VillageSite={d:number;x:number;yaw:number;key:number;group:number;kind:'home'|'stall'|'waffle';rear?:boolean};
/** Absolute route recipes: clustered frontages, courtyards and occasional lone
 * buildings. Independent of chunk order; no frame-time random placement. */
export const COAST_VILLAGE_SITES:VillageSite[]=[];
for(const [index,district] of COAST_DISTRICTS.entries()){
 const market=district.kind==='market';let d=district.start+18,slot=0;
 for(let pocket=0;d<district.end-20;pocket++){
  const key=index*10000+pocket*113,group=index*100+pocket;
  const count=pocket%4===0?1:market?4+Math.floor(rand(key+5)*3):3+Math.floor(rand(key+5)*2);
  for(let j=0;j<count&&d<district.end-20;j++,slot++){
   const k=key+j*19,kind=market?(pocket%4===1&&j===0?'waffle':'stall'):'home';
   COAST_VILLAGE_SITES.push({d,x:market?23+rand(k+10)*8:28+rand(key+10)*8+(rand(k+13)-.5)*5,yaw:(rand(k+11)-.5)*(market?.42:.32),key:k,group,kind});
   if(!market&&slot%2===1)COAST_VILLAGE_SITES.push({d:d+5+rand(k+12)*6,x:57+rand(k+13)*12,yaw:(rand(k+14)-.5)*.4,key:k+7,group,kind:'home',rear:true});
   d+=market?9+rand(k+16)*4:18+rand(k+16)*7;
  }
  d+=market?19+rand(key+20)*20:22+rand(key+20)*25;
 }
}
/** Short residential/market T-streets, designed in gaps between actual
 * buildings rather than intersecting their entrances. Two home streets and
 * one market lane per district add a lived-in cross-street rhythm. Deterministic
 * and entirely visual: never change the drivable coastal highway geometry.
 */
export type CoastTownSideStreet={d:number;width:number;length:number;district:number};
export const COAST_TOWN_SIDE_STREETS:readonly CoastTownSideStreet[]=COAST_DISTRICTS.flatMap((district,index)=>{
 const homes=COAST_VILLAGE_SITES.filter(h=>h.d>=district.start-10&&h.d<=district.end+10);
 const count=district.kind==='homes'?2:1,used:number[]=[],roads:CoastTownSideStreet[]=[];
 for(let n=0;n<count;n++){
  const target=district.start+(n+1)*(district.end-district.start)/(count+1);
  let best:number|undefined,bestScore=-Infinity;
  for(let d=district.start+22;d<district.end-22;d+=4){
   if(used.some(previous=>Math.abs(d-previous)<78))continue;
   const clearance=Math.min(...homes.map(h=>Math.abs(h.d-d)));
   if(clearance<10.5)continue;
   const score=clearance*1.3-Math.abs(d-target)*.34;
   if(score>bestScore){best=d;bestScore=score;}
  }
  if(best!==undefined){used.push(best);roads.push({d:best,width:6.6,length:district.kind==='homes'?80:64,district:index});}
 }
 return roads;
});
export const COAST_REST_SPOTS=COAST_BEACHES.flatMap((bay,index)=>{
 const half=Math.min(330,bay.radius*.6),count=Math.floor(half*2/135);
 return Array.from({length:count},(_,i)=>({d:bay.distance-half+45+i*135+rand(index*43+i)*22,x:-15.2-rand(index*71+i+6)*1.35,key:index*100+i,people:i%3===0?1:2,children:i%3!==1}));
});
