import packages from '../content/scenery/packages.json';
import {beachPlan} from './beach-macro';
import {KENTING_ANCHOR} from './beach-blockout-config';
/** Small site adapter for the existing Scenic Package; no coordinates in assets. */
export const BEACH_ZONES=packages.packages['kenting-beach'].macroLayout;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function beachZoneBlend(d:number,anchor=KENTING_ANCHOR){
 return beachPlan()?smooth((d-anchor-BEACH_ZONES.shoreStartM)/200)*(1-smooth((d-anchor-BEACH_ZONES.shoreEndM+200)/200)):0;
}
export function beachKitPose(id:string,anchor=KENTING_ANCHOR){
 const match=/^kenting-beach-parasol-(\d+)$/.exec(id);
 if(match){const i=Number(match[1]),z=BEACH_ZONES.zones[Math.floor(i/4)];if(!z)return undefined;
  return {station:anchor+z.forwardM+(i%2)*8+Math.floor(i%4/2)*12,lateral:z.rightM-Math.floor(i%4/2)*9};}
 if(id==='kenting-beach-rental')return {station:anchor+BEACH_ZONES.rentalForwardM,lateral:-25};
 if(id==='kenting-beach-lifeguard')return {station:anchor+BEACH_ZONES.lifeguardForwardM,lateral:-30};
 return undefined;
}
export function beachSwimSites(anchor=KENTING_ANCHOR){
 return BEACH_ZONES.zones.flatMap((z,pocket)=>Array.from({length:6},(_,i)=>({station:anchor+z.forwardM+35+i*4,offshore:7+(i%3)*1.6,pocket,pose:(['raised','ring','swim'] as const)[i%3]})));
}
