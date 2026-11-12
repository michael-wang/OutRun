import planFile from '../../content/stages/coast/onboarding.json';
import type {AuthoredRoad} from './authored-road';

/** R5a first-map *content*: simple authored windows, not a random director. */
export interface FirstMapTraffic{
 firstCivilianDistance:number;
 firstWaveCount:1|2;
 nextWaveDistance:number;
}
export interface CoastLesson{
 id:'A0'|'A1'|'A2'|'A3';
 start:number;end:number;label:string;goal:string;
}
export interface CoastOnboarding{
 schemaVersion:1;id:'coast';revision:string;
 lessons:CoastLesson[];
 traffic:FirstMapTraffic;
 breakdownsAfter:number;
}
export const COAST_ONBOARDING=planFile as CoastOnboarding;

export function validateCoastOnboarding(plan:CoastOnboarding,road:AuthoredRoad){
 if(plan?.schemaVersion!==1||plan.id!==road.id||!plan.revision)
  throw Error('Invalid coast onboarding header');
 const lessons=plan.lessons;
 if(!Array.isArray(lessons)||lessons.length!==4)
  throw Error('First map needs four opening lessons');
 const ids=['A0','A1','A2','A3'];
 for(let i=0;i<lessons.length;i++){
  const lesson=lessons[i];
  if(lesson.id!==ids[i]||!lesson.label?.trim()||!lesson.goal?.trim()||
     !Number.isFinite(lesson.start)||!Number.isFinite(lesson.end)||
     lesson.start<(i===0?road.startDistance:lessons[i-1].end)||
     lesson.end<=lesson.start||
     lesson.end>road.startDistance+road.length)
   throw Error('Invalid or overlapping opening lesson');
 }
 const [launch,sweep,pass,sBend]=lessons;
 if(launch.start!==road.startDistance||launch.end!==road.turns[0].start||
    sweep.start!==road.turns[0].start||sweep.end!==road.turns[0].end||
    pass.start!==sweep.end||pass.end!==road.turns[1].start||
    sBend.start!==road.turns[1].start||sBend.end!==road.turns[2].end||
    Math.sign(road.turns[1].steer)===Math.sign(road.turns[2].steer))
  throw Error('Opening lessons do not match authored road geometry');
 const t=plan.traffic;
 if(!t||!Number.isFinite(t.firstCivilianDistance)||
    !Number.isFinite(t.nextWaveDistance)||
    ![1,2].includes(t.firstWaveCount)||
    t.firstCivilianDistance<pass.start+100||
    t.firstCivilianDistance>=pass.end||
    t.nextWaveDistance<sBend.end+250||
    t.nextWaveDistance>=road.startDistance+road.length-100||
    !Number.isFinite(plan.breakdownsAfter)||
    plan.breakdownsAfter<sBend.end+500||
    plan.breakdownsAfter>=road.startDistance+road.length-300)
  throw Error('Opening civilian/road hazard pacing is unsafe');
}

/** Pure lookup for development overlays and review data; no runtime state machine. */
export function coastLessonAt(distance:number,plan:CoastOnboarding=COAST_ONBOARDING){
 return plan.lessons.find(lesson=>distance>=lesson.start&&distance<lesson.end);
}
