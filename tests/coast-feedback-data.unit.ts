import {expect,it} from 'vitest';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY} from '../src/content/coast-stage';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {coastReviewKey,emptyCoastReview,readCoastReview,exportCoastReview} from '../src/content/coast-feedback-data';

it('R2j: coastal identity and feedback export match the accepted legacy schema',()=>{
 const b=COAST_ULTRA_STAGE,i=COAST_RUNTIME_IDENTITY;
 expect(i.id).toBe(b.id);expect(i.revision).toBe(b.revision);
 expect(i.stageCode).toBe(b.stageCode);expect(i.tripCode).toBe(b.tripCode);
 expect(i.generatorVersion).toBe(b.generatorVersion);
 expect(i.contentFingerprint).toBe(b.contentFingerprint);
 expect(coastReviewKey()).toBe('l2:'+b.id+':r'+b.revision+':'+b.contentFingerprint);
 const result=exportCoastReview(emptyCoastReview()).records[0];
 for(const key of ['id','stageCode','tripCode','seed','contentFingerprint'])
  expect(result[key as keyof typeof result]).toBe(b[key as keyof typeof b]);
 expect(result.beats).toEqual(b.beats);
 expect(result.buffers).toEqual(b.buffers);
 expect(result.placements).toEqual(b.placements);
 expect(result.worldPhases).toEqual(b.worldPhases);
});

it('R2j: old local storage is recovered without loading L2/Pilot catalogs',()=>{
 const key=coastReviewKey(),row={humanVote:'KEEP',difficulty:4,overallNote:'Old coast review',
  events:[{kind:'issue',note:'A curve',anchor:{s:1085}}]};
 expect(readCoastReview(JSON.stringify({[key]:row}))).toEqual(row);
 expect(readCoastReview('corrupted')).toEqual(emptyCoastReview());
 expect(readCoastReview(JSON.stringify({[key]:{...row,difficulty:99,
  overallNote:'a'.repeat(400)}})).toMatchObject({difficulty:null,overallNote:'a'.repeat(360)});
});

it('R2j: feedback content edits are exported from authored stage data',()=>{
 const road=COAST_STAGE.road;
 const edited={...COAST_STAGE,manifest:{...COAST_STAGE.manifest,seed:271},
  road:{...road,turns:road.turns.map((t,index)=>index===0?{...t,steer:.6}:t)}};
 const result=exportCoastReview(emptyCoastReview(),edited).records[0];
 expect(result.seed).toBe(271);
 expect(result.placements[0].parameters.effort).not.toEqual(COAST_ULTRA_STAGE.placements[0].parameters.effort);
});
