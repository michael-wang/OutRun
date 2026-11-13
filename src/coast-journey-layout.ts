import {COAST_EFFECTS,type VegetationStageEffects} from './content/coast-effects';
import {COAST_DIRECTION,type CoastChapter} from './content/coast-direction';

/** One stage-authored visual rhythm. Chapter distances are relative to
 * ROAD_START; hero slot distances in direction.json are absolute HUD metres. */
export const COAST_SCENIC_ACTS:readonly CoastChapter[]=COAST_DIRECTION.chapters;
export type CoastScenicAct=CoastChapter;
export function coastScenicActAt(distance:number):CoastScenicAct{
 return COAST_SCENIC_ACTS.find(act=>distance>=act.start&&distance<act.end)
  ??(distance<0?COAST_SCENIC_ACTS[0]:COAST_SCENIC_ACTS[COAST_SCENIC_ACTS.length-1]);
}
const smooth=(a:number,b:number,v:number)=>{
 const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return t*t*(3-2*t);
};
/** Sparse dry scrub behind the visitor beach; scenery outside the first
 * authored farming districts is incrementally replaced after driving QA. */
export function coastVegetationDensity(
 d:number,settings:VegetationStageEffects=COAST_EFFECTS.vegetation,
){
 const zone=settings.quietBeach;
 const quiet=smooth(zone.start,zone.fullStart,d)*
  (1-smooth(zone.fullEnd,zone.end,d));
 return settings.baseDensity*(1-quiet)+zone.density*quiet;
}
