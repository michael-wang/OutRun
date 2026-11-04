import {it,expect} from 'vitest';
import {SceneTaskProfiler,SCENE_TASK_SOFT_BUDGET_MS} from '../src/scene-task-profiler';

it('attributes oversized synchronous scenery work to kind, chunk and player distance',()=>{
 const profiler=new SceneTaskProfiler();
 profiler.record('scenery-geometry',7,1.2,2205,35,1000);
 profiler.record('scenery-field',7,39.8,2205,34,1001);
 profiler.record('scenery-field',7,57.7,2205,33,1002);
 profiler.record('queue-sort',2,.15,2205,32,1003);
 const report=profiler.snapshot();
 expect(report.budgetMs).toBe(SCENE_TASK_SOFT_BUDGET_MS);
 expect(report.totalTasks).toBe(4);
 expect(report.overBudgetTasks).toBe(2);
 expect(report.byKind['scenery-field'].overBudget).toBe(2);
 expect(report.byKind['scenery-field'].over16).toBe(2);
 expect(report.byKind['scenery-field'].over33).toBe(2);
 expect(report.byKind['scenery-field'].over50).toBe(1);
 expect(report.byKind['scenery-field'].worstMs).toBe(57.7);
 expect(report.lastSlow).toEqual(expect.objectContaining({
  kind:'scenery-field',chunk:7,atDistanceM:2205,ms:57.7,
 }));
 expect(profiler.recentSlowTasks()).toHaveLength(2);
});

it('bounds retained task-latency data and ignores invalid durations',()=>{
 const profiler=new SceneTaskProfiler(4);
 for(let i=0;i<200;i++)profiler.record('scenery-instances',i%4,8.5,1000+i,10,i);
 profiler.record('other',0,Number.NaN,0,0,300);
 profiler.record('other',0,-1,0,0,301);
 const report=profiler.snapshot();
 expect(report.totalTasks).toBe(200);
 expect(report.overBudgetTasks).toBe(200);
 expect(report.byKind['scenery-instances'].count).toBe(200);
 expect(report.byKind['scenery-instances'].meanMs).toBe(8.5);
 expect(report.byKind['other']).toBeUndefined();
 expect(profiler.recentSlowTasks()).toHaveLength(96);
 expect(profiler.recentSlowTasks()[0].atDistanceM).toBe(1104);
});
