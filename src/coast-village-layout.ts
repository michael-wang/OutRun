import {COAST_BEACHES,COAST_DISTRICTS} from './coast-layout';
import {COAST_TOWN_SIDE_STREETS,TOWN_BACK_LANE} from './coast-town-access';
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
   const setback=j===2?76+rand(k+13)*14:28+rand(key+10)*13+(rand(k+13)-.5)*6;
   COAST_VILLAGE_SITES.push({d,x:market?23+rand(k+10)*8:setback,yaw:(rand(k+11)-.5)*(market?.42:.32),key:k,group,kind});
   if(!market&&slot%2===1){
    const inland=slot%4===1;
    const x=TOWN_BACK_LANE.x+(inland?1:-1)*(13+rand(k+13)*10);
    const yaw=(inland?0:Math.PI)+(rand(k+14)-.5)*.4;
    COAST_VILLAGE_SITES.push({d:d+5+rand(k+12)*6,x,yaw,key:k+7,group,kind:'home',rear:true});
   }
   d+=market?9+rand(k+16)*4:18+rand(k+16)*7;
  }
  d+=market?19+rand(key+20)*20:22+rand(key+20)*25;
 }
}
// A pair of side-street lots between the two main rows lets the junction
// read as an inhabited lane from the driver's angle. Keep occupied lots.
for(const street of COAST_TOWN_SIDE_STREETS){
 if(COAST_DISTRICTS[street.district].kind!=='homes')continue;
 for(const side of [-1,1]){
  const key=70000+street.d*2+side,d=street.d+side*(15+rand(key)*3);
  const x=(side<0?68:97)+rand(key+1)*6;
  if(COAST_VILLAGE_SITES.some(s=>Math.abs(s.d-d)<17&&Math.abs(s.x-x)<17))continue;
  COAST_VILLAGE_SITES.push({d,x,key,group:key,kind:'home',rear:true,yaw:side*1.25});
 }
}
export {COAST_TOWN_SIDE_STREETS};
export type {CoastTownSideStreet} from './coast-town-access';
export const COAST_REST_SPOTS=COAST_BEACHES.flatMap((bay,index)=>{
 const half=Math.min(330,bay.radius*.6),count=Math.floor(half*2/135);
 return Array.from({length:count},(_,i)=>({d:bay.distance-half+45+i*135+rand(index*43+i)*22,x:-15.2-rand(index*71+i+6)*1.35,key:index*100+i,people:i%3===0?1:2,children:i%3!==1}));
});
