import {BRICK_START} from './bricks';
import {generateTrip} from './trip';
import {COAST_ULTRA_STAGE} from './coast-ultra-stage';
import {CANYON_ROADLOCK_STAGE} from './designer-canyon-roadlock';

/** Keep each accepted road in its native coordinates. Chapters are time ellipses,
 * not a new road generator or a forced geometric join between unrelated maps. */
export function isScenicJourney(params:URLSearchParams){
 return !['showcase','mode','trip','stage','lab','challenge','pace','velocity'].some(k=>params.has(k));
}
let chapters:ReturnType<typeof buildChapters>|undefined;
function buildChapters(){
 const city=generateTrip(1,10),phase=city.worldPhases.find(p=>p.world==='city')!;
 return [
  {id:'city',title:'都市叢林',time:'正午',stage:city,start:BRICK_START+phase.startS+500,end:BRICK_START+phase.endS-200},
  {id:'coast',title:'海濱公路',time:'黃昏',stage:COAST_ULTRA_STAGE,start:BRICK_START,end:BRICK_START+COAST_ULTRA_STAGE.length},
  {id:'canyon',title:'大峽谷',time:'翌日清晨',stage:CANYON_ROADLOCK_STAGE,start:BRICK_START,end:BRICK_START+CANYON_ROADLOCK_STAGE.length},
 ] as const;
}
export function journeyChapters(){return chapters??=buildChapters();}
