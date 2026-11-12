import {COAST_EFFECTS,type VegetationStageEffects} from './content/coast-effects';

/** Absolute-route scenic direction for the 10 km coastal journey.
 * Existing road curvature, sea simulation and mountains remain unchanged.
 * Scene authors (housing, crops, vegetation, beach life, boats) use one set
 * of non-overlapping chapters instead of unrelated per-system intervals.
 */
export const COAST_SCENIC_ACTS=[
 {id:'rural-opening',start:0,end:1800,label:'海岸田園',focus:'rice-flower-courtyard'},
 {id:'quiet-beach',start:1800,end:3400,label:'悠閒沙灘',focus:'beach-sparse-inland'},
 {id:'town-and-market',start:3400,end:7000,label:'小鎮與夜市',focus:'housing-market-farm-pockets'},
 {id:'fishing-farewell',start:7000,end:10000,label:'漁村與農莊',focus:'fishing-rice-flowers'},
] as const;
export type CoastScenicAct=(typeof COAST_SCENIC_ACTS)[number];
export function coastScenicActAt(distance:number):CoastScenicAct{
 return COAST_SCENIC_ACTS.find(act=>distance>=act.start&&distance<act.end)
  ??(distance<0?COAST_SCENIC_ACTS[0]:COAST_SCENIC_ACTS[3]);
}
const smooth=(a:number,b:number,v:number)=>{
 const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return t*t*(3-2*t);
};
/** Sparse dry scrub behind the visitor beach; preserve trees around farmland
 * and houses. Worker-only deterministic plant budget, not a live LOD effect. */
export function coastVegetationDensity(
 d:number,settings:VegetationStageEffects=COAST_EFFECTS.vegetation,
){
 const zone=settings.quietBeach;
 const quiet=smooth(zone.start,zone.fullStart,d)*
  (1-smooth(zone.fullEnd,zone.end,d));
 return settings.baseDensity*(1-quiet)+zone.density*quiet;
}
