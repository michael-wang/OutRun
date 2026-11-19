import {beach2,beach2Site} from './beach2-profile';
import {configureCoastSun} from './coast-sun-direction';
/** Reversible local spatial study; never changes the default route. */
export type BeachMacro='none'|'b'|'right';
let active:BeachMacro='none';
let oriented=false;
let vista=false;
let flow=false;
let closeCoast=false;
let plan=false;
let life=false;
let crowdStyle:'dense'|'balanced'='dense';
export const beachCrowdStyle=()=>crowdStyle;
export function setBeachCrowdStyle(value:unknown){crowdStyle=value==='dense'?'dense':'balanced';}
export const beachLife=()=>beachPlan()&&life;
export function setBeachLife(value:unknown){life=value===true||value==='1';}
/** Visual-only opening: never used by coastDriveBounds or contact solvers. */
export const beachRailHidden=(d:number,side:number)=>beachLife()&&side===-1&&d>=(beach2()?4680:4850)&&d<=6050;
export const beachPlan=()=>coastClose()&&plan;
export function setBeachPlan(value:unknown){plan=value===true||value==='1';}
export const coastClose=()=>beachFlow()&&closeCoast;
export function setCoastClose(value:unknown){closeCoast=value===true||value==='1';}
/** Preserve the tower foundation, then taper to a narrow connected high coast. */
export const macroCoastCloseBlend=(d:number)=>coastClose()?ease((d-6500)/400)*(1-ease((d-7900)/550)):0;
export const beachFlow=()=>beachVista()&&flow;
export function setBeachFlow(value:unknown){flow=value===true||value==='1';}
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(10+t*(-15+6*t));};
/** Regional raised coast; continues behind the tower before the remote join. */
export const macroCoastRise=(d:number)=>beachFlow()?(18*ease((d-5800)/620)+4*ease((d-6450)/600))*(1-ease((d-7400)/1050)):0;
export const macroRoadRise=(d:number,enabled=beachFlow())=>enabled?(22*ease((d-5800)/620)+4*ease((d-6450)/600))*(1-ease((d-7400)/1050)):0;
/** One broad shallow bow, zero position/tangent change at both beach ends. */
export const macroBeachBow=(d:number,enabled=beachFlow())=>enabled&&d>4850&&d<6550?18*Math.sin(Math.PI*(d-4850)/1700)**4:0;
export const beachVista=()=>sunsetRoute()&&vista;
export function setBeachVista(value:unknown){vista=value===true||value==='1';}
export const macroLighthouseStation=()=>beachMacro()==='right'?(beachVista()?6450:6560):6175;
export const macroLighthouseScale=()=>beachVista()?(beachLife()?1.95:1.5):1;
let side='';
export const sunSide=()=>sunsetRoute()?side:'';
export function setSunSide(value:unknown){side=sunsetRoute()&&(value==='left'||value==='wide')?value:'';configureCoastSun(active,side);}
export const sunsetRoute=()=>oriented&&active==='right';
export function setSunsetRoute(value:unknown){oriented=value===true||value==='1';}
export const beachMacro=()=>active;
export function setBeachMacro(value:unknown){active=value==='b'||value==='right'?value:'none';configureCoastSun(active);}
export const macroHidePreRevealBeach=(d:number)=>beach2Site(d)||(active==='right'&&d>=4000&&d<4850);
export const macroComparison=()=>active==='right';
/** Keep the cape, authored lighthouse and its gull/fallback root together. */
export const macroLighthouseX=()=>active==='right'?-105:-50;
export const macroBounds=()=>macroComparison()?[4350,8450] as const:[5270,6570] as const;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** Continuous extension of the existing inland hills, not a separate mound. */
export const macroMountainBlend=(d:number)=>active==='right'?smooth((d-3950)/400)*(1-smooth((d-4850)/400)):0;
export const macroClearApproach=(d:number)=>beach2Site(d)||(active==='right'&&d>=4000&&d<=5350);
export const macroScenicDistance=(d:number,anchor=5980)=>active==='right'?anchor-980+(d-anchor+120)*(1560/315):d;
export const macroReefDistance=(d:number)=>active==='right'&&d>=6320&&d<=6884?6750+(d-6320)*.8:d;
export function macroBump(d:number,centre:number,radius:number){const t=Math.abs(d-centre)/radius;return t>=1?0:Math.pow(Math.cos(t*Math.PI/2),4);}
export function macroRoadOffset(d:number){
 // The revised right route is built from headings; a displacement bump
 // would introduce the unwanted opposite-sign approach turn.
 if(macroComparison())return 0;
 return active==='b'?32*macroBump(d,5500,230)-65*macroBump(d,6050,520):0;
}
export function macroBeachExtra(d:number){
 if(active==='right')return 65*smooth((d-4850)/250)*(1-smooth((d-6550)/400));
 return active==='b'?38*macroBump(d,6000,470)+35*macroBump(d,6175,160):0;
}
/** Physical coastal heights, always outside the retained road/verge. */
export function macroLandHeight(x:number,d:number){
 if(active==='none'||beachFlow()||Math.abs(x)<=13)return -Infinity;
 // New comparison uses an inland/right hill. The accepted B sea-side
 // screen remains exactly as authored, accessible through its old URL.
 if(x>0)return -Infinity;
 const screen=active==='b'?25*macroBump(d,5500,220)*macroBump(x,-38,26):0;
 // A small level summit supports the existing 15m-wide foundation; slopes
 // continue into the real shoreline rather than leaving a floating plinth.
 const capeAt=macroLighthouseStation();
 const cape=(beachVista()?23:17)*macroBump(Math.max(0,Math.abs(d-capeAt)-25),0,130)*macroBump(Math.max(0,Math.abs(x-macroLighthouseX())-(beachVista()?15:10)),0,35);
 return Math.max(screen,cape)>0?-5+Math.max(screen,cape):-Infinity;
}
