/** P0: generic bounded main-thread scene task telemetry, independent of specific scenery. */
export const SCENE_TASK_SOFT_BUDGET_MS=3;
export type SceneTaskKind=
 'road-geometry'|'roadside-instances'|'road-annotation'
 |'scenery-geometry'|'scenery-instances'|'scenery-field'
 |'ready-marker'|'retire-field'|'retire-instances'|'retire-geometry'|'queue-sort'|'pump-overhead'|'other';

type Accumulator={count:number;sumMs:number;worstMs:number;overBudget:number;over16:number;over33:number;over50:number;sampleMs:number[]};
export type SceneTaskSpike={
 kind:SceneTaskKind;chunk:number;ms:number;atDistanceM:number;remainingTasks:number;atMs:number;detail?:string;resourceId?:number;
};
const fmt=(n:number)=>Math.round(n*100)/100;
export class SceneTaskProfiler {
 private totals=new Map<SceneTaskKind,Accumulator>();
 private byDetail=new Map<string,Accumulator>();
 private slow:SceneTaskSpike[]=[];
 private total=0;
 private overBudget=0;
 private maxMs=0;
 constructor(readonly budgetMs=SCENE_TASK_SOFT_BUDGET_MS){}
 record(kind:SceneTaskKind,chunk:number,ms:number,atDistanceM:number,remainingTasks:number,atMs:number,detail?:string,resourceId?:number){
  if(!Number.isFinite(ms)||ms<0)return;
  const track=<K extends string>(group:Map<K,Accumulator>,key:K)=>{
   let a=group.get(key);
   if(!a){a={count:0,sumMs:0,worstMs:0,overBudget:0,over16:0,over33:0,over50:0,sampleMs:[]};group.set(key,a);}
   a.count++;a.sumMs+=ms;a.worstMs=Math.max(a.worstMs,ms);
   if(ms>this.budgetMs)a.overBudget++;
   if(ms>16.7)a.over16++;if(ms>33.3)a.over33++;if(ms>50)a.over50++;
   a.sampleMs.push(ms);if(a.sampleMs.length>128)a.sampleMs.shift();
  };
  track(this.totals,kind);
  if(detail)track(this.byDetail,`${kind}/${detail}`);
  this.total++;this.maxMs=Math.max(this.maxMs,ms);
  if(ms>this.budgetMs)this.overBudget++;
  if(ms>8){
   this.slow.push({kind,chunk,ms:fmt(ms),atDistanceM:Math.round(atDistanceM),remainingTasks,atMs:fmt(atMs),
    ...(detail?{detail}:{}),...(resourceId===undefined?{}:{resourceId})});
   if(this.slow.length>96)this.slow.shift();
  }
 }
 snapshot(){
  const summarize=<K extends string>(totals:Map<K,Accumulator>)=>Object.fromEntries([...totals].map(([kind,a])=>{
   const sorted=[...a.sampleMs].sort((x,y)=>x-y),index=Math.max(0,Math.ceil(sorted.length*.95)-1);
   return [kind,{
    count:a.count,totalMs:fmt(a.sumMs),meanMs:fmt(a.sumMs/a.count),worstMs:fmt(a.worstMs),
    recentP95Ms:fmt(sorted[index]??0),overBudget:a.overBudget,over16:a.over16,over33:a.over33,over50:a.over50,
   }];
  }));
  return {
   budgetMs:this.budgetMs,totalTasks:this.total,overBudgetTasks:this.overBudget,worstTaskMs:fmt(this.maxMs),
   byKind:summarize(this.totals),byDetail:summarize(this.byDetail),lastSlow:this.slow.at(-1)??null,slowTaskEvents:this.slow.length,
  };
 }
 /** Export full retained spikes only by explicit user request; snapshots stay compact. */
 recentSlowTasks(){return [...this.slow];}
}
