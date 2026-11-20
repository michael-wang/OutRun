import {COAST_EFFECTS,type VegetationStageEffects} from './content/coast-effects';
import {COAST_DIRECTION,type CoastChapter} from './content/coast-direction';
import {KENTING_INSTALLATION} from './kenting-installation';

/** One stage-authored visual rhythm. Chapter distances are relative to
 * ROAD_START; hero slot distances in direction.json are absolute HUD metres. */
export const COAST_SCENIC_ACTS:readonly CoastChapter[]=COAST_DIRECTION.chapters;
export type CoastScenicAct=CoastChapter;
export function coastScenicActAt(distance:number):CoastScenicAct{
 return COAST_SCENIC_ACTS.find(act=>distance>=act.start&&distance<act.end)
  ??(distance<0?COAST_SCENIC_ACTS[0]:COAST_SCENIC_ACTS[COAST_SCENIC_ACTS.length-1]);
}

/** Ports are absolute track stations. The chapter authoring table alone uses
 * distance from the starting grid. At a shared port the new segment owns the label. */
export function coastSegmentNameAt(track:number,startDistance:number):string {
 const site=KENTING_INSTALLATION;
 if(track<site.tutorialExit) return '教學 · '+coastScenicActAt(track-startDistance).label;
 if(site.relocated && track<site.roadEntry) return '海灘入口連接道';
 if(track>=site.roadEntry && track<site.roadExit) return '墾丁海水浴場';
 if(site.relocated && track<site.connectedAt) return site.shifted?'海岬出口連接道':'海岬沿岸';
 return coastScenicActAt(track-startDistance).label;
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
