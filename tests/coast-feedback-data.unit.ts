import {expect,it} from 'vitest';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY} from '../src/content/coast-stage';
import {authoredRoadPlacements} from '../src/content/authored-road';
import {coastFeedbackPhases} from '../src/content/coast-gameplay-sample';
import {coastReviewKey,emptyCoastReview,readCoastReview,exportCoastReview} from '../src/content/coast-feedback-data';

it('P0: feedback storage keeps the accepted historical identity and schema',()=>{
 const id=COAST_RUNTIME_IDENTITY;
 expect(id.id).toBe('ROAD-TRIP-10M');
 expect(id.revision).toBe(30);
 expect(id.stageCode).toBe('COAST-RESORT-R8');
 expect(id.generatorVersion).toBe('v0.9-r10');
 expect(coastReviewKey()).toBe('l2:'+id.id+':r30:'+id.contentFingerprint);
 const row=exportCoastReview(emptyCoastReview()).records[0];
 expect(row.id).toBe(id.id);
 expect(row.seed).toBe(COAST_STAGE.manifest.seed);
 expect(row.beats.map(b=>[b.startS,b.endS,b.role])).toEqual(
  COAST_STAGE.scenicActs.map(b=>[b.start,b.end,b.label]));
 expect(row.placements).toEqual(authoredRoadPlacements(COAST_STAGE.road));
 expect(row.worldPhases).toEqual(coastFeedbackPhases());
});

it('P0: existing device feedback still decodes and validates safely',()=>{
 const key=coastReviewKey(),row={humanVote:'KEEP',difficulty:4,overallNote:'Old coast review',
  events:[{kind:'issue',note:'A curve',anchor:{s:1085}}]};
 expect(readCoastReview(JSON.stringify({[key]:row}))).toEqual(row);
 expect(readCoastReview('corrupted')).toEqual(emptyCoastReview());
 expect(readCoastReview(JSON.stringify({[key]:{...row,difficulty:99,
  overallNote:'a'.repeat(400)}}))).toMatchObject({difficulty:null,overallNote:'a'.repeat(360)});
});

it('P0: reviewed road exports update with authored content only',()=>{
 const road=COAST_STAGE.road;
 const revised={...COAST_STAGE,manifest:{...COAST_STAGE.manifest,seed:271},
  road:{...road,turns:road.turns.map((t,i)=>i===0?{...t,steer:.6}:t)}};
 const row=exportCoastReview(emptyCoastReview(),revised).records[0];
 expect(row.seed).toBe(271);
 const current=exportCoastReview(emptyCoastReview()).records[0];
 // The new R5a course begins with a straight, and elevation is now
 // ordered before the first curve. Inspect semantic identity, not slot 0.
 const editedCurve=row.placements.find(p=>p.channel==='curvature');
 const baselineCurve=current.placements.find(p=>p.channel==='curvature');
 expect(editedCurve).toBeDefined();
 expect(baselineCurve).toBeDefined();
 expect(editedCurve!.parameters).not.toEqual(baselineCurve!.parameters);
});
