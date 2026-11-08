import {PlaytestFrameGate} from './playtest-frame-gate';

export const WARMUP_MS=10_000,MEASURE_MS=20_000;
export const cpuPhases=['physics','world','trafficUpdate','wheelGroundRaycasts','effects','otherRender','ocean','boatShadow','mainScene'] as const;
export type CpuPhase=typeof cpuPhases[number]|'callback';
export type CpuTotals=Record<CpuPhase,number>;
export const emptyCpu=():CpuTotals=>({callback:0,physics:0,world:0,trafficUpdate:0,wheelGroundRaycasts:0,effects:0,otherRender:0,ocean:0,boatShadow:0,mainScene:0});
const rounded=(n:number)=>Math.round(n*1000)/1000;
function percentile(sorted:number[],p:number){
 return sorted[Math.max(0,Math.ceil(sorted.length*p)-1)];
}
/** One uninterrupted Playing run. Exclude frames straddling the warmup
 * boundary and finish on the first complete interval past 20 seconds. */
export class FpsMeasurement {
 warmAt:number|null=null;
 measureAt:number|null=null;
 private previous=0;
 private bucketAt=0;
 private bucketFrames=0;
 private bucketWorst=0;
 private bucketOver50=0;
 private bucketOver100=0;
 private gate=new PlaytestFrameGate();
 private cpu=emptyCpu();
 private gaps:number[]=[];
 private draws=0;
 private triangles=0;
 private seconds:{elapsedMs:number;durationMs:number;frames:number;fps:number;distanceM:number;speedKmh:number}[]=[];
 readonly gpuMs:number[]=[];
 private startState?:Record<string,unknown>;
 constructor(private readonly snapshot:()=>Record<string,unknown>){}
 frame(now:number,distanceM:number,speedKmh:number,cpu:CpuTotals,drawCalls:number,triangles:number){
  this.warmAt??=now;
  if(this.measureAt===null){
   if(now-this.warmAt>=WARMUP_MS){
    this.measureAt=this.previous=this.bucketAt=now;
    this.startState=this.snapshot();
   }
   return;
  }
  const gap=now-this.previous;
  if(gap<=0)return;
  this.previous=now;this.gaps.push(gap);
  this.cpu.callback+=cpu.callback;
  for(const phase of cpuPhases)this.cpu[phase]+=cpu[phase];
  this.draws+=drawCalls;this.triangles+=triangles;this.bucketFrames++;
  this.bucketWorst=Math.max(this.bucketWorst,gap);
  if(gap>50)this.bucketOver50++;
  if(gap>100)this.bucketOver100++;
  const duration=now-this.measureAt;
  const bucketDuration=now-this.bucketAt;
  if(bucketDuration>=1000||duration>=MEASURE_MS){
   const fps=this.bucketFrames*1000/bucketDuration;
   this.seconds.push({elapsedMs:rounded(duration),durationMs:rounded(bucketDuration),frames:this.bucketFrames,
    fps:rounded(fps),distanceM:rounded(distanceM),speedKmh:rounded(speedKmh)});
   this.gate.ingest({fps,seconds:duration/1000,durationMs:bucketDuration,distanceM,
    worstFrameGapMs:this.bucketWorst,over50ms:this.bucketOver50,over100ms:this.bucketOver100});
   this.bucketAt=now;this.bucketFrames=this.bucketWorst=this.bucketOver50=this.bucketOver100=0;
  }
  if(duration<MEASURE_MS)return;
  const count=this.gaps.length,ordered=this.gaps.sort((a,b)=>a-b);
  const fps=(p:number)=>rounded(1000/ordered[count-Math.max(1,Math.ceil(count*p))]);
  const medianFps=(1000/ordered[Math.floor((count-1)/2)]+1000/ordered[Math.floor(count/2)])/2;
  const iso=(at:number)=>new Date(performance.timeOrigin+at).toISOString();
  const phaseMeans=Object.fromEntries(cpuPhases.map(key=>[key,rounded(this.cpu[key]/count)]));
  return {
   warmupStartedAt:iso(this.warmAt),startedAt:iso(this.measureAt),endedAt:iso(now),
   warmupMs:rounded(this.measureAt-this.warmAt),durationMs:rounded(duration),frames:count,
   start:this.startState!,end:this.snapshot(),
   fps:{mean:rounded(1000*count/duration),median:rounded(medianFps),p05:fps(.05),p01:fps(.01)},
   frameGapMs:{p95:rounded(percentile(ordered,.95)),p99:rounded(percentile(ordered,.99)),
    max:rounded(ordered[count-1]),over33_3:ordered.filter(v=>v>33.3).length,
    over50:ordered.filter(v=>v>50).length,over100:ordered.filter(v=>v>100).length},
   cpuMeanMs:{callbackTotal:rounded(this.cpu.callback/count),phases:phaseMeans},
   meanDrawCalls:rounded(this.draws/count),meanTriangles:rounded(this.triangles/count),seconds:this.seconds,
   playtestGate:this.gate.report,
  };
 }
}
