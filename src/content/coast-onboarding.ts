import planFile from '../../content/stages/coast/onboarding.json';
import type {AuthoredRoad} from './authored-road';

/** R5a first-map *content*: simple authored windows, not a random director. */
export interface FirstMapTraffic{
 firstCivilianDistance:number;
 firstCruiseKmh:number;
 firstWaveCount:1|2;
 nextWaveDistance:number;
}
export interface CoastLesson{
 id:'A0'|'A1'|'A2'|'A3';
 start:number;end:number;label:string;goal:string;
}
/** A4 is an authored curving-road accident with seeded 2–3 stopped cars.
 * It shares Traffic's normal obstacle/physics pipeline. */
export interface CoastAccident{
 id:'A4';start:number;end:number;distance:number;label:string;
 /** First tutorial accident is predictable; later incidents use seeded lanes. */
 layout:'right-lane'|'seeded-lanes';
 minimumOpenLanes:2|3;
}
/** A5/A6 are drivable road whiteboxes after the accident. */
export interface CoastDriftLesson{
 id:'A5'|'A6';start:number;end:number;label:string;goal:string;
 suggestedEntryKmh:number;
}
export interface CoastOnboarding{
 schemaVersion:1;id:'coast';revision:string;
 lessons:CoastLesson[];
 accident:CoastAccident;
 driftLessons:CoastDriftLesson[];
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
    // Actual continuous S: no hidden straight and rapid but finite crossover.
    road.turns[1].end!==road.turns[2].start||
    (road.turns[1].rampFraction??.2)>.1||
    (road.turns[2].rampFraction??.2)>.1||
    Math.sign(road.turns[1].steer)===Math.sign(road.turns[2].steer))
  throw Error('Opening lessons do not match authored road geometry');
 const accident=plan.accident,incidentCurve=road.turns[3];
 if(!accident||accident.id!=='A4'||!accident.label?.trim()||!incidentCurve||
    accident.start!==incidentCurve.start||accident.end!==incidentCurve.end||
    !['right-lane','seeded-lanes'].includes(accident.layout)||
    !Number.isFinite(accident.distance)||
    accident.start<sBend.end+60||accident.distance<accident.start+150||
    accident.distance>accident.end-110||
    ![2,3].includes(accident.minimumOpenLanes)||
    Math.abs(incidentCurve.steer)<.20||Math.abs(incidentCurve.steer)>.55)
  throw Error('Invalid curved first-map accident');
 const drifts=plan.driftLessons;
 if(!Array.isArray(drifts)||drifts.length!==2)
  throw Error('Expected exactly two first-map drift lessons');
 for(const [i,lesson] of drifts.entries()){
  const curve=road.turns[i+4];
  if(lesson.id!==(i===0?'A5':'A6')||!curve||
     lesson.start!==curve.start||lesson.end!==curve.end||
     !lesson.label?.trim()||!lesson.goal?.trim()||
     !Number.isFinite(lesson.suggestedEntryKmh)||
     lesson.suggestedEntryKmh<120||lesson.suggestedEntryKmh>250||
     lesson.start<(i===0?accident.end+180:drifts[0].end+350)||
     Math.abs(curve.steer)<.65||Math.abs(curve.steer)>1.3)
   throw Error('Invalid first-map drift teaching window');
 }
 if(drifts[0].suggestedEntryKmh<=drifts[1].suggestedEntryKmh||
    Math.abs(road.turns[4].steer)>=Math.abs(road.turns[5].steer)||
    Math.sign(road.turns[4].steer)===Math.sign(road.turns[5].steer))
  throw Error('Drift lessons must progressively build difficulty');
 const t=plan.traffic;
 if(!t||!Number.isFinite(t.firstCivilianDistance)||
    !Number.isFinite(t.firstCruiseKmh)||t.firstCruiseKmh<30||t.firstCruiseKmh>90||
    !Number.isFinite(t.nextWaveDistance)||
    ![1,2].includes(t.firstWaveCount)||
    // The bus is already moving during the launch. Its initial station
    // lies inside the sweeper so drivers catch it on the exit.
    t.firstCivilianDistance<sweep.start+150||
    t.firstCivilianDistance>=pass.end||
    t.nextWaveDistance<drifts[1].end+300||
    t.nextWaveDistance>=road.startDistance+road.length-100||
    !Number.isFinite(plan.breakdownsAfter)||
    plan.breakdownsAfter<drifts[1].end+400||
    plan.breakdownsAfter>=road.startDistance+road.length-300)
  throw Error('Opening civilian/road hazard pacing is unsafe');
}

/** Pure lookup for development overlays and review data; no runtime state machine. */
export function coastLessonAt(distance:number,plan:CoastOnboarding=COAST_ONBOARDING){
 return plan.lessons.find(lesson=>distance>=lesson.start&&distance<lesson.end)
  ??(distance>=plan.accident.start&&distance<plan.accident.end?plan.accident:undefined)
  ??plan.driftLessons.find(lesson=>distance>=lesson.start&&distance<lesson.end);
}
