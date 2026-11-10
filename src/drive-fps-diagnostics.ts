import {FpsMeasurement,cpuPhases,emptyCpu,WARMUP_MS,MEASURE_MS,type CpuPhase,type CpuTotals} from './fps-measurement';
import {GAME_VERSION} from './build-info';
import type {WebGLRenderer} from 'three';
import {PlaytestFrameGate} from './playtest-frame-gate';
import {FARM_ZONES} from './coast-farm-layout';

/** Opt-in driving profiler (?fpsdiag=1); no gameplay or rendering changes. */
export type DriveRegion='approach'|'main-rice'|'main-flowers'|'exit'|'other-rice'|'other-flowers'|'other';
export function driveRegionAt(distance:number):DriveRegion {
 const first=FARM_ZONES[0];
 if(distance>=first.rice[0]-600&&distance<first.rice[0])return 'approach';
 if(distance>=first.rice[0]&&distance<first.rice[1])return 'main-rice';
 if(distance>=first.flowers[0]&&distance<first.flowers[1])return 'main-flowers';
 if(distance>=first.flowers[1]&&distance<first.flowers[1]+600)return 'exit';
 for(const zone of FARM_ZONES.slice(1)){
  if(distance>=zone.rice[0]&&distance<zone.rice[1])return 'other-rice';
  if(distance>=zone.flowers[0]&&distance<zone.flowers[1])return 'other-flowers';
 }
 return 'other';
}

const average=(rows:number[])=>rows.length?rows.reduce((sum,x)=>sum+x,0)/rows.length:0;
const round=(n:number)=>Math.round(n*100)/100;

export type DriveFpsSecond={
 seconds:number;distanceM:number;region:DriveRegion;fps:number;frames:number;
 meanFrameGapMs:number;p95FrameGapMs:number;worstFrameGapMs:number;
 over33ms:number;over50ms:number;over100ms:number;
 cpuMeanMs:CpuTotals;
 drawCalls:number;triangles:number;geometryCount:number;textureCount:number;
 extras:Record<string,unknown>;
};
export function summarizeDriveRegions(rows:DriveFpsSecond[]){
 const regions=['approach','main-rice','main-flowers','exit','other-rice','other-flowers','other'] as DriveRegion[];
 return Object.fromEntries(regions.map(region=>{
  const matches=rows.filter(r=>r.region===region);
  return [region,{
   seconds:matches.length,
   meanFps:round(average(matches.map(x=>x.fps))),
   minFps:matches.length?Math.min(...matches.map(x=>x.fps)):null,
   meanMainSceneCpuMs:round(average(matches.map(x=>x.cpuMeanMs.mainScene))),
   meanOceanCpuMs:round(average(matches.map(x=>x.cpuMeanMs.ocean))),
   meanWorldCpuMs:round(average(matches.map(x=>x.cpuMeanMs.world))),
   meanDrawCalls:round(average(matches.map(x=>x.drawCalls))),
   longFramesOver50ms:matches.reduce((sum,x)=>sum+x.over50ms,0),
  }];
 }));
}

type GpuExtension={TIME_ELAPSED_EXT:number;GPU_DISJOINT_EXT:number};
type GpuSample={seconds:number;distanceM:number;region:DriveRegion;gpuMs:number};
type OutstandingQuery={query:WebGLQuery;distanceM:number;seconds:number;owner?:FpsMeasurement};
const captureSeconds=600; // 10-minute journey, bounded memory usage

export class DriveFpsDiagnostics {
 private exportPanel?:HTMLElement;
 private status?:HTMLOutputElement;
 private run?:FpsMeasurement;
 private lastWindow?:Record<string,unknown>;
 private statusSecond=-1;
 readonly enabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fpsdiag')==='1';
 private startAt=0;
 private lastAt=0;
 private bucketAt=0;
 private bucketGaps:number[]=[];
 private bucketCpu:CpuTotals=emptyCpu();
 private samples:DriveFpsSecond[]=[];
 private spikes:{seconds:number;distanceM:number;region:DriveRegion;gapMs:number;cpuMs:CpuTotals}[]=[];
 private currentCpu:CpuTotals=emptyCpu();
 private readonly gl?:WebGL2RenderingContext;
 private readonly ext?:GpuExtension;
 private pending:OutstandingQuery[]=[];
 private runningQuery?:OutstandingQuery;
 private gpuSamples:GpuSample[]=[];
 private frameCount=0;
 private readonly startedWall=new Date().toISOString();
 private readonly frameGate=new PlaytestFrameGate();

 constructor(private renderer:WebGLRenderer,private captureExtras:()=>Record<string,unknown>,private captureScenario:()=>Record<string,unknown>){
  if(!this.enabled)return;
  const context=renderer.getContext();
  if('beginQuery' in context){
   const gl=context as WebGL2RenderingContext;
   const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2') as GpuExtension|null;
   if(ext){this.gl=gl;this.ext=ext;}
  }
  this.createPanel();
 }

 /** CPU wall time for an individual engine phase, not GPU execution time. */
 cpu(phase:CpuPhase,ms:number){
  if(this.enabled&&Number.isFinite(ms))this.currentCpu[phase]+=ms;
 }
 /** Periodic nonblocking GPU timer query. Includes ocean FFT, boat shadows and the main draw. */
 beginGpu(distanceM:number){
  if(!this.enabled||!this.startAt||!this.gl||!this.ext||this.runningQuery||this.pending.length>=3||this.frameCount++%30!==0)return;
  try{
   const query=this.gl.createQuery();
   if(!query)return;
   this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT,query);
   this.runningQuery={query,distanceM,owner:this.run?.measureAt!=null?this.run:undefined,seconds:Math.round((performance.now()-this.startAt)/1000)};
  }catch{this.runningQuery=undefined;}
 }
 endGpu(){
  if(!this.runningQuery||!this.gl||!this.ext)return;
  try{this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);this.pending.push(this.runningQuery);}
  catch{this.gl.deleteQuery(this.runningQuery.query);}
  this.runningQuery=undefined;
 }
 private pollGpu(){
  if(!this.gl||!this.ext||!this.pending.length)return;
  const candidate=this.pending[0];
  try{
   if(this.gl.getParameter(this.ext.GPU_DISJOINT_EXT)){
    for(const item of this.pending)this.gl.deleteQuery(item.query);
    this.pending.length=0;return;
   }
   if(!this.gl.getQueryParameter(candidate.query,this.gl.QUERY_RESULT_AVAILABLE))return;
   const nano=this.gl.getQueryParameter(candidate.query,this.gl.QUERY_RESULT) as number;
   if(Number.isFinite(nano)){
    const gpuMs=round(nano/1e6);
    if(candidate.owner&&candidate.owner===this.run)candidate.owner.gpuMs.push(gpuMs);
    if(this.samples.length<captureSeconds)this.gpuSamples.push({
     seconds:candidate.seconds,distanceM:candidate.distanceM,region:driveRegionAt(candidate.distanceM),gpuMs,
    });
   }
   this.gl.deleteQuery(candidate.query);this.pending.shift();
  }catch{
   this.gl.deleteQuery(candidate.query);this.pending.shift();
  }
 }
 startWindow(){
  if(!this.enabled)return;
  const gl=this.renderer.getContext();
  this.run=new FpsMeasurement(()=>({...this.captureScenario(),
   viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},
   drawingBuffer:{width:gl.drawingBufferWidth,height:gl.drawingBufferHeight,pixelRatio:this.renderer.getPixelRatio()},
   geometryCount:this.renderer.info.memory.geometries,textureCount:this.renderer.info.memory.textures,
  }));
  this.statusSecond=-1;
 }
 cancelWindow(reason:string){
  if(!this.run)return;
  this.run=undefined;this.status!.textContent='測試已中斷 · '+reason;
 }
 private measureFrame(now:number,distance:number,speed:number,calls:number,triangles:number){
  const run=this.run!;
  const result=run.frame(now,distance,speed,this.currentCpu,calls,triangles);
  if(result){
   this.lastWindow={
    kind:'outrun-standard-fps-v1',version:GAME_VERSION,buildCommit:import.meta.env.VITE_BUILD_SHA??null,
    device:{userAgent:navigator.userAgent},...result,
    gpu:{status:!this.ext?'unsupported':run.gpuMs.length?'sampled':'no-valid-samples',
     samplesMs:run.gpuMs,meanMs:run.gpuMs.length?round(average(run.gpuMs)):null,
     pendingAtEnd:this.pending.filter(q=>q.owner===run).length},
    definitions:{fps:'Mean is frames / actual window duration. Median and low percentiles describe instantaneous frame FPS; P01/P05 use nearest rank.',
     cpu:'Milliseconds per measured frame. callbackTotal includes all phases. trafficUpdate includes physics substeps and visual updates; physics excludes that traffic time. effects covers tire, dust, spark and exhaust preparation. otherRender is remaining render preparation.',
     draws:'Final scene render counters per frame, excluding earlier offscreen renders.',
     gpu:'Nonblocking timer for ocean update, boat depth pass and scene render. Only resolved, non-disjoint samples issued inside this window.'},
   };
   this.run=undefined;this.status!.textContent='測試完成 · '+result.fps.mean+' FPS';
   this.download(this.lastWindow,'outrun-standard-fps');
   return;
  }
  const measuring=run.measureAt!==null;
  const remaining=Math.ceil(((measuring?MEASURE_MS:WARMUP_MS)-(now-(run.measureAt??run.warmAt!)))/1000);
  // The sign distinguishes the two clocks without writing to the DOM every frame.
  const clock=measuring?remaining:-remaining;
  if(clock!==this.statusSecond){
   this.statusSecond=clock;this.status!.textContent=(measuring?'量測':'暖機')+' · '+remaining+' 秒';
  }
 }
 frame(now:number,playing:boolean,distanceM:number,drawCalls:number,triangles:number,speedKmh:number){
  if(!this.enabled)return;
  this.pollGpu();
  if(!playing||document.hidden){
   this.cancelWindow('離開駕駛畫面');
   this.lastAt=0;this.bucketGaps=[];this.bucketCpu=emptyCpu();this.currentCpu=emptyCpu();
   return;
  }
  if(this.run)this.measureFrame(now,distanceM,speedKmh,drawCalls,triangles);
  if(!this.lastAt){
   this.lastAt=now;
   if(!this.startAt)this.startAt=now;
   this.bucketAt=now;
   this.currentCpu=emptyCpu();
   return;
  }
  const gap=now-this.lastAt;this.lastAt=now;
  if(gap<=0||gap>1000){
   this.bucketAt=now;this.bucketGaps=[];this.bucketCpu=emptyCpu();this.currentCpu=emptyCpu();
   return;
  }
  if(this.samples.length>=captureSeconds){this.currentCpu=emptyCpu();return;}
  this.bucketGaps.push(gap);
  this.bucketCpu.callback+=this.currentCpu.callback;
  for(const phase of cpuPhases)this.bucketCpu[phase]+=this.currentCpu[phase];
  if(gap>50&&this.spikes.length<200)this.spikes.push({
   seconds:round((now-this.startAt)/1000),distanceM:Math.round(distanceM),region:driveRegionAt(distanceM),
   gapMs:round(gap),cpuMs:{...this.currentCpu},
  });
  this.currentCpu.callback=0;
  for(const phase of cpuPhases)this.currentCpu[phase]=0;
  if(now-this.bucketAt<1000)return;
  const gaps=this.bucketGaps.slice().sort((a,b)=>a-b),count=gaps.length;
  const elapsed=now-this.bucketAt;
  const cpuMean={} as CpuTotals;
  for(const key of Object.keys(this.bucketCpu) as CpuPhase[])cpuMean[key]=round(this.bucketCpu[key]/Math.max(1,count));
  const memory=this.renderer.info.memory;
  const row:DriveFpsSecond={
   seconds:round((now-this.startAt)/1000),distanceM:Math.round(distanceM),region:driveRegionAt(distanceM),
   fps:round(count*1000/elapsed),frames:count,
   meanFrameGapMs:round(average(gaps)),p95FrameGapMs:round(gaps[Math.max(0,Math.ceil(count*.95)-1)]??0),
   worstFrameGapMs:round(gaps[count-1]??0),
   over33ms:gaps.filter(x=>x>33.3).length,over50ms:gaps.filter(x=>x>50).length,over100ms:gaps.filter(x=>x>100).length,
   cpuMeanMs:cpuMean,drawCalls,triangles,geometryCount:memory.geometries,textureCount:memory.textures,
   extras:this.captureExtras(),
  };
  this.samples.push(row);
  this.frameGate.ingest(row);
  this.bucketAt=now;this.bucketGaps=[];this.bucketCpu=emptyCpu();
 }
 report(){
  return {
   kind:'outrun-drive-fps-diagnostic-v1',version:GAME_VERSION,buildCommit:import.meta.env.VITE_BUILD_SHA??null,
   standardTest:this.lastWindow,
   generatedAt:new Date().toISOString(),startedAt:this.startedWall,
   device:navigator.userAgent,
   viewport:{cssWidth:innerWidth,cssHeight:innerHeight,dpr:devicePixelRatio},
   drawingBuffer:{width:this.renderer.domElement.width,height:this.renderer.domElement.height},
   gpuTimerSupported:!!this.ext,
   mainRiceMeters:FARM_ZONES[0].rice,mainFlowerMeters:FARM_ZONES[0].flowers,
   regionSummary:summarizeDriveRegions(this.samples),
   playtestGate:this.frameGate.report,
   seconds:this.samples,
   gpuSamples:this.gpuSamples,
   slowFrames:this.spikes,
   limitations:'Frame FPS is rAF-based. CPU phase timings measure JavaScript/driver submission, not total GPU work. Timer query GPU ms (if supported) is nonblocking and includes ocean FFT, boat shadows and main scene together. Context switches, GC, browser UI and thermal state may affect frame gaps. Visible draw calls exclude some prior offscreen FFT work.',
  };
 }
 private createPanel(){
  // ?fpsdiag=1: the FPS badge already shows live performance. Keep only
  // the export control and the active standard-test countdown here.
  const panel=document.createElement('div');panel.id='drive-fps-diagnostic';
  const button=document.createElement('button');button.type='button';
  button.textContent='匯出 FPS JSON';
  button.setAttribute('aria-label','匯出 FPS 診斷 JSON');
  button.onclick=()=>this.download();
  this.status=document.createElement('output');
  panel.append(this.status,button);document.body.append(panel);
  this.exportPanel=panel;
  (window as typeof window & {__driveFpsDiagnostics?:DriveFpsDiagnostics}).__driveFpsDiagnostics=this;
 }
 dispose(){
  this.endGpu();
  for(const {query} of this.pending)this.gl?.deleteQuery(query);
  this.pending=[];
  this.exportPanel?.remove();
  const host=window as typeof window & {__driveFpsDiagnostics?:DriveFpsDiagnostics};
  if(host.__driveFpsDiagnostics===this)delete host.__driveFpsDiagnostics;
 }
 placeExportIn(host:HTMLElement){
  if(this.exportPanel&&this.exportPanel.parentElement!==host)host.append(this.exportPanel);
 }
 private download(report:unknown=this.report(),prefix='outrun-fps'){
  const output=JSON.stringify(report,null,2);
  const url=URL.createObjectURL(new Blob([output],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download=prefix+'-'+new Date().toISOString().replaceAll(':','-')+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
