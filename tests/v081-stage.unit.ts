import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {generateStage} from '../src/stage-one';
import {BRICK_START} from '../src/bricks';
import {createPilotTrack,pilotSample,validatePilot} from '../src/pilot-composer';

it('composes reproducible multi-curve cores with distinct L3 buffers and measured widths',()=>{
 const rows=[];
 for(const seed of [1,2,3,42,710]){
  const stage=generateStage(seed);expect(generateStage(seed)).toEqual(stage);validatePilot(stage);
  expect(stage.generatorVersion).toBe('v0.8.3-r1');expect(stage.revision).toBe(4);
  for(const beat of stage.beats){const local=stage.placements.filter(p=>p.beat===beat.id);expect(local.filter(p=>p.channel==='curvature').length).toBeGreaterThanOrEqual(2);expect(local.some(p=>p.channel==='elevation')).toBe(true);}
  expect(new Set(stage.buffers.map(x=>x.role)).size).toBeGreaterThan(2);
  const track=createPilotTrack(stage);for(const beat of stage.beats)for(const seam of [beat.startS,beat.endS]){const a=pilotSample(stage,BRICK_START+seam-.01),b=pilotSample(stage,BRICK_START+seam+.01),pa=track.sample(BRICK_START+seam-.01),pb=track.sample(BRICK_START+seam+.01);expect(Math.abs(a.height-b.height)).toBeLessThan(.05);expect(Math.abs(a.grade-b.grade)).toBeLessThan(.001);expect(Math.abs(a.lanes-b.lanes)).toBeLessThan(.001);expect(Math.abs(a.demand-b.demand)).toBeLessThan(.001);expect(pa.position.distanceTo(pb.position)).toBeLessThan(.05);expect(Math.abs(pa.roadHeading-pb.roadHeading)).toBeLessThan(.001);}
  const curves=stage.placements.filter(p=>p.channel==='curvature').sort((a,b)=>a.startS-b.startS),coverage=curves.reduce((sum,p)=>sum+p.endS-p.startS,0)/stage.length,gaps=curves.slice(1).map((p,i)=>p.startS-curves[i].endS);
  expect(coverage).toBeGreaterThan(.6);expect(Math.max(...gaps)).toBeLessThan(732);
  const widths={four:0,wide:0,narrow:0,taper:0};for(let s=0;s<stage.length;s+=5){const n=pilotSample(stage,BRICK_START+s).lanes;if(Math.abs(n-4)<.001)widths.four++;else if(Math.abs(n-6)<.001||Math.abs(n-8)<.001)widths.wide++;else if(Math.abs(n-2)<.001)widths.narrow++;else widths.taper++;}
  const total=Object.values(widths).reduce((a,b)=>a+b,0),shares=Object.fromEntries(Object.entries(widths).map(([k,v])=>[k,v/total]));expect(shares.four).toBeGreaterThan(.5);expect(shares.narrow).toBeLessThan(.15);expect(shares.wide).toBeGreaterThan(.15);
  const samples=[];for(let s=0;s<=stage.length;s+=100){const p=pilotSample(stage,BRICK_START+s);samples.push({s,demand:p.demand,height:p.height,grade:p.grade,lanes:p.lanes});}
  rows.push({code:stage.stageCode,fingerprint:stage.contentFingerprint,coverage,gaps,shares,beats:stage.beats,buffers:stage.buffers,placements:stage.placements,worldPhases:stage.worldPhases,samples});
 }
 mkdirSync('docs/evidence/v0.8.3/regressions/v0.8.2/regressions/v0.8.1',{recursive:true});writeFileSync('docs/evidence/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/stage-metrics.json',JSON.stringify(rows,null,2));
},30000);
