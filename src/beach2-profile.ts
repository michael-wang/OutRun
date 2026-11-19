/** Isolated Kenting 2 Macro. Stations are track coordinates (HUD = track - 350).
 * Composition revision removes the redundant left nose and lengthens the bay.
 */
let enabled=false;
export const beach2=()=>enabled;
export function setBeach2(value:unknown){enabled=value===true||value==='1';}
export const BEACH2={start:4800,core:4850,length:1400,end:6800,cameras:[0,180,743,1072],tower:1170} as const;
// Track stations: HUD 4550..5700 plus 120 m for the visible approach/exit.
export const BEACH2_INCIDENT_SIGHTLINE={start:4780,end:6170} as const;
export const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(10+t*(-15+6*t));};
export const beach2Weight=(d:number)=>enabled?ease((d-BEACH2.start)/50)*(1-ease((d-6250)/550)):0;
export const beach2Site=(d:number)=>enabled&&d>=4800&&d<=6500;
export function interpolate(rows:readonly (readonly [number,number])[],s:number){
 if(s<=rows[0][0])return rows[0][1];
 for(let i=1;i<rows.length;i++)if(s<rows[i][0]){const [a,x]=rows[i-1],[b,y]=rows[i];return x+(y-x)*ease((s-a)/(b-a));}
 return rows.at(-1)![1];
}
export const beach2Heading=(s:number)=>interpolate([[0,0],[300,-3],[700,1],[1000,4],[1170,8],[1400,14]],s)*Math.PI/180;
export const beach2RoadHeight=(s:number)=>-5+interpolate([[0,4],[300,3.7],[700,3.5],[1000,4.5],[1170,7],[1400,11]],s);
export const beach2PreviousShore=(d:number)=>interpolate([[0,-55],[180,-57],[450,-48],[650,-33],[800,-32],[970,-40],[1170,-57],[1400,-48]],d-BEACH2.core);
/** Revision 3 Macro: two smooth seaward pockets; the near-swimming cove stays put. */
export const beach2Widening=(d:number)=>30*Math.max(
 ease((d-5070)/100)*(1-ease((d-5280)/90)),
 ease((d-5350)/80)*(1-ease((d-5500)/85)),
);
export const beach2Shore=(d:number)=>beach2PreviousShore(d)-beach2Widening(d);
/** Continuous cross-section: beach and shelf end at actual sea level, not a
 * broad raised platform. Landward terrain remains the existing hill system. */
const capeCrest = [[900,0],[948,.85],[992,2.15],[1040,3.85],[1100,6.4],
 [1159,10],[1192,10],[1250,9.8],[1325,10.4],[1410,10.2],[1500,10]] as const;
// Oblique outcrop on the road-facing apron. Discontinuous along the coast,
// embedded at its two ends and zero at both the paved verge and tower foot.
export function capeOutcrop(s:number,x:number){
 const line=-23+3.7*Math.sin((s-1000)/37)+1.7*Math.sin((s-1000)/17);
 const t=(x-line)/5.8;
 if(Math.abs(t)>=1)return 0;
 const lobes=(ease((s-974)/31)*(1-ease((s-1024)/24))+
  ease((s-1055)/26)*(1-ease((s-1113)/22))+
  ease((s-1143)/18)*(1-ease((s-1187)/19))+
  ease((s-1230)/30)*(1-ease((s-1294)/33))+
  .67*ease((s-1320)/19)*(1-ease((s-1367)/26)));
 const footing=ease((Math.hypot(s-BEACH2.tower,x+35)-4.2)/5);
 return footing*lobes*ease((t+1)/.58)*(1-ease((t+.42)/1.42));
}
export function beach2Ground(x:number,d:number,roadY:number,rightY:number,original:number,shoreline=beach2Shore(d)){
 const w=beach2Weight(d);if(!w||x>=-10)return original;
 const s=d-BEACH2.core,shore=shoreline,edge=roadY-10*rightY-.1;
 let y:number;
 if(x<=shore)y=-5-Math.min(15,(shore-x)*.16);
 else {
  const t=(x-shore)/(-10-shore);
  y=-5+(edge+5)*Math.pow(t,1.25);
  // A gently rising bedding plane runs inland from the water. Keep the
  // cap level across the lighthouse footing, then continue it past the tower.
  const reach=x-shore;
  const phase=s-930;
  const shelfHeight=interpolate(capeCrest,s);
  const irregular=1.4*Math.sin(phase/28)+.8*Math.sin(phase/13+.6);
  const toe=3.5+irregular*.65;
  const lower=ease(reach/toe);
  const face=ease((reach-toe)/(5.7+1.3*Math.sin(phase/37)));
  const upper=ease((reach-toe-6.8-irregular)/(5.8+.9*Math.cos(phase/21)));
  const seaward=.12*lower+.50*face+.38*upper;
  const crestEdge=-32+2.2*Math.sin((s-1170)/66);
  const landward=1-ease((x-crestEdge)/(-10-crestEdge));
  const headland=-5+shelfHeight*seaward;
  const join=ease((s-887)/72)*(1-ease((s-1440)/145));
  const newLand=Math.max(y,y+(headland-y)*landward)+.66*capeOutcrop(s,x)*ease((reach-3)/7);
  // Outside the local outcrop, meet the existing post-beach coast.
  const oldShelf=ease((s-1000)/170)*ease(reach/16)*(1-ease((x+32)/22));
  const prior=Math.max(y,-5+10*oldShelf);
  y=prior+(newLand-prior)*join;
 }
 return original+(y-original)*w;
}
