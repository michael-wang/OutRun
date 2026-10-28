import {describe,it,expect} from 'vitest';
import {generateStage} from '../src/stage-one';
import {createPilotTrack,pilotSample,validatePilot} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';
import {mkdirSync,writeFileSync} from 'node:fs';

describe('Stage One generation',()=>{
 it('replays five codes exactly and varies real driving content',()=>{
  const fingerprints=new Set<string>();
  for(const seed of [1,2,3,42,710]){
   const a=generateStage(seed),b=generateStage(seed);expect(a).toEqual(b);validatePilot(a);fingerprints.add(a.contentFingerprint);
   expect(a.entrySpeed).toBe(0);expect(a.placements.filter(p=>p.channel==='curvature')).toHaveLength(16);
   expect(a.placements.filter(p=>p.channel==='elevation')).toHaveLength(8);
   expect(a.placements.filter(p=>p.channel==='width').length).toBeGreaterThanOrEqual(6);
   for(const beat of a.beats){const phase=a.worldPhases.find(p=>beat.startS>=p.startS&&beat.endS<=p.endS);expect(phase?.world,`${a.stageCode}/${beat.id}`).toBe(beat.world);}
   const track=createPilotTrack(a);for(let s=0;s<a.length;s+=100){const road=pilotSample(a,BRICK_START+s),p=track.sample(BRICK_START+s);expect(Number.isFinite(p.position.x)).toBe(true);expect(road.lanes).toBeGreaterThanOrEqual(2);expect(road.lanes).toBeLessThanOrEqual(8);expect(Math.abs(road.grade)).toBeLessThan(.7);}
  }expect(fingerprints.size).toBe(5);expect([1,2,3,42,710].some(seed=>generateStage(seed).placements.some(p=>p.channel==='elevation'&&p.id==='E04'))).toBe(true);
 });
 it('does not bring non-adjacent road sections into the same corridor',()=>{
  for(const seed of Array.from({length:40},(_,i)=>i+1)){const stage=generateStage(seed),track=createPilotTrack(stage),points=[];for(let d=BRICK_START;d<BRICK_START+stage.length;d+=40)points.push(track.sample(d).position);
   for(let i=0;i<points.length;i++)for(let j=i+20;j<points.length;j++){const a=points[i],b=points[j],horizontal=Math.hypot(a.x-b.x,a.z-b.z);expect(horizontal>35||Math.abs(a.y-b.y)>20,`seed ${seed} sections ${i}/${j}`).toBe(true);}
  }
 },30000);
 it('biases real amplitudes toward canyon while allowing exceptions',()=>{
  const totals={city:{dramatic:0,total:0},coast:{dramatic:0,total:0},canyon:{dramatic:0,total:0}};
  for(let seed=1;seed<=100;seed++){const stage=generateStage(seed);for(const beat of stage.beats){const p=stage.placements.find(p=>p.channel==='elevation'&&p.beat===beat.id)!;if(p.channel!=='elevation')throw Error('missing');const row=totals[beat.world];row.total++;if(p.parameters.amplitude>=115)row.dramatic++;expect((p.parameters.amplitude>=115)).toBe(beat.verticality==='dramatic');}}
  expect(totals.canyon.dramatic/totals.canyon.total).toBeGreaterThan(totals.city.dramatic/totals.city.total);
  expect(totals.canyon.dramatic/totals.canyon.total).toBeGreaterThan(totals.coast.dramatic/totals.coast.total);
  expect(totals.city.dramatic).toBeGreaterThan(0);expect(totals.coast.dramatic).toBeGreaterThan(0);expect(totals.canyon.dramatic).toBeLessThan(totals.canyon.total);
  mkdirSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8',{recursive:true});writeFileSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/biome-distribution.json',JSON.stringify({seeds:100,totals},null,2));
 },30000);
 it('records five stage timelines and checks phase-boundary continuity',()=>{
  const rows=[];for(const seed of [1,2,3,42,710]){
   const stage=generateStage(seed),track=createPilotTrack(stage),samples=[];
   for(let s=0;s<=stage.length;s+=100){const road=pilotSample(stage,BRICK_START+s),p=track.sample(BRICK_START+s);samples.push({s,demand:road.demand,height:road.height,grade:road.grade,lanes:road.lanes,x:p.position.x,z:p.position.z});}
   for(const phase of stage.worldPhases.slice(1)){const s=BRICK_START+phase.startS,a=track.sample(s-.01),b=track.sample(s+.01),x=pilotSample(stage,s-.01),y=pilotSample(stage,s+.01);expect(a.position.distanceTo(b.position)).toBeLessThan(.1);expect(Math.abs(x.grade-y.grade)).toBeLessThan(.001);expect(Math.abs(x.lanes-y.lanes)).toBeLessThan(.01);}
   rows.push({code:stage.stageCode,fingerprint:stage.contentFingerprint,beats:stage.beats,worldPhases:stage.worldPhases,placements:stage.placements,samples});
  }mkdirSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8',{recursive:true});writeFileSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/five-seed-timelines.json',JSON.stringify(rows,null,2));
 });
});
