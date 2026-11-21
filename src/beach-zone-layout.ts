import {kentingPlaced} from './kenting-installation';
import packages from '../content/scenery/packages.json';
import {beachPlan} from './beach-macro';
import layout from '../content/stages/coast/scenic-layout.json';
const KENTING_ANCHOR=kentingPlaced(layout.heroAnchors.find(a=>a.id==='beach-market')!.roadDistance);
export function beachMarketFrontage(d:number,x:number){
 return x< -11&&Math.abs(d-KENTING_ANCHOR)<=160;
}
/** Small site adapter for the existing Scenic Package; no coordinates in assets. */
export const BEACH_ZONES=packages.packages['kenting-beach'].macroLayout;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function beachZoneBlend(d:number,anchor=KENTING_ANCHOR){
 return beachPlan()?smooth((d-anchor-BEACH_ZONES.shoreStartM)/200)*(1-smooth((d-anchor-BEACH_ZONES.shoreEndM+200)/200)):0;
}
