import type {WebGLRenderer} from 'three';
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

export type CpuPhase='callback'|'physics'|'world'|'ocean'|'boatShadow'|'mainScene'|'otherRender';
type CpuTotals=Record<CpuPhase,number>;
const emptyCpu=():CpuTotals=>({callback:0,physics:0,world:0,ocean:0,boatShadow:0,mainScene:0,otherRender:0});
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
type OutstandingQuery={query:WebGLQuery;distanceM:number;seconds:number};
const captureSeconds=600; // 10-minute journey, bounded memory usage

export class DriveFpsDiagnostics {
 readonly enabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fpsdiag')==='1';
 private startAt=0;
 private lastAt=0;
 private bucketAt=0;
 private bucketGaps:number[]=[];
 private bucketCpu:CpuTotals=emptyCpu();
 private bucketDraws=0;
 private bucketTriangles=0;
 private samples:DriveFpsSecond[]=[];
 private spikes:{seconds:number;distanceM:number;region:DriveRegion;gapMs:number;cpuMs:CpuTotals}[]=[];
 private currentCpu:CpuTotals=emptyCpu();
 private panel?:HTMLDivElement;
 private status?:HTMLSpanElement;
 private readonly gl?:WebGL2RenderingContext;
 private readonly ext?:GpuExtension;
 private pending:OutstandingQuery[]=[];
 private runningQuery?:OutstandingQuery;
 private gpuSamples:GpuSample[]=[];
 private frameCount=0;
 private readonly startedWall=new Date().toISOString();

 constructor(private renderer:WebGLRenderer,private captureExtras:()=>Record<string,unknown>){
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
  if(!this.enabled||!this.gl||!this.ext||this.runningQuery||this.pending.length>=3||this.frameCount++%30!==0)return;
  try{
   const query=this.gl.createQuery();
   if(!query)return;
   this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT,query);
   this.runningQuery={query,distanceM,seconds:Math.round((performance.now()-this.startAt)/1000)};
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
   if(!this.gl.getQueryParameter(candidate.query,this.gl.QUERY_RESULT_AVAILABLE))return;
   const disjoint=this.gl.getParameter(this.ext.GPU_DISJOINT_EXT) as boolean;
   const nano=this.gl.getQueryParameter(candidate.query,this.gl.QUERY_RESULT) as number;
   if(!disjoint&&Number.isFinite(nano))this.gpuSamples.push({
    seconds:candidate.seconds,distanceM:candidate.distanceM,
    region:driveRegionAt(candidate.distanceM),gpuMs:round(nano/1000000),
   });
   this.gl.deleteQuery(candidate.query);this.pending.shift();
  }catch{
   this.gl.deleteQuery(candidate.query);this.pending.shift();
  }
 }
 frame(now:number,playing:boolean,distanceM:number,drawCalls:number,triangles:number){
  if(!this.enabled)return;
  this.pollGpu();
  if(!playing||document.hidden){
   this.lastAt=0;this.bucketGaps=[];this.bucketCpu=emptyCpu();this.currentCpu=emptyCpu();
   return;
  }
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
  if(this.samples.length>=captureSeconds)return;
  this.bucketGaps.push(gap);
  for(const key of Object.keys(this.currentCpu) as CpuPhase[])this.bucketCpu[key]+=this.currentCpu[key];
  const cpu={...this.currentCpu};this.currentCpu=emptyCpu();
  this.bucketDraws=drawCalls;this.bucketTriangles=triangles;
  if(gap>50&&this.spikes.length<200)this.spikes.push({
   seconds:round((now-this.startAt)/1000),distanceM:Math.round(distanceM),region:driveRegionAt(distanceM),
   gapMs:round(gap),cpuMs:cpu,
  });
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
  this.bucketAt=now;this.bucketGaps=[];this.bucketCpu=emptyCpu();
  this.updatePanel(row);
 }
 report(){
  return {
   kind:'outrun-drive-fps-diagnostic-v1',
   generatedAt:new Date().toISOString(),startedAt:this.startedWall,
   device:navigator.userAgent,
   viewport:{cssWidth:innerWidth,cssHeight:innerHeight,dpr:devicePixelRatio},
   drawingBuffer:{width:this.renderer.domElement.width,height:this.renderer.domElement.height},
   gpuTimerSupported:!!this.ext,
   mainRiceMeters:FARM_ZONES[0].rice,mainFlowerMeters:FARM_ZONES[0].flowers,
   regionSummary:summarizeDriveRegions(this.samples),
   seconds:this.samples,
   gpuSamples:this.gpuSamples,
   slowFrames:this.spikes,
   limitations:'Frame FPS is rAF-based. CPU phase timings measure JavaScript/driver submission, not total GPU work. Timer query GPU ms (if supported) is nonblocking and includes ocean FFT, boat shadows and main scene together. Context switches, GC, browser UI and thermal state may affect frame gaps. Visible draw calls exclude some prior offscreen FFT work.',
  };
 }
 private createPanel(){
  const panel=document.createElement('div');panel.id='drive-fps-diagnostic';
  panel.style.cssText='position:fixed;right:7px;top:75px;z-index:310;background:#0e2b36e8;color:#fff2dc;border:1px solid #ffd19c77;padding:5px 8px;border-radius:7px;max-width:270px;font:11px/1.4 system-ui;pointer-events:auto';
  const status=document.createElement('span');status.textContent='FPS 診斷準備中';panel.append(status);
  const button=document.createElement('button');button.type='button';button.textContent='匯出 FPS JSON';
  button.style.cssText='display:block;margin-top:4px;border:0;border-radius:4px;padding:4px 7px;background:#ffd19c;color:#14333a;font:11px system-ui';
  button.onclick=()=>this.download();panel.append(button);document.body.append(panel);
  this.panel=panel;this.status=status;
  (window as typeof window & {__driveFpsDiagnostics?:DriveFpsDiagnostics}).__driveFpsDiagnostics=this;
 }
 private updatePanel(row:DriveFpsSecond){
  if(!this.status)return;
  this.status.textContent='FPS '+row.fps.toFixed(0)+' · '+row.region+' · '+row.distanceM+'m | scene '+row.cpuMeanMs.mainScene+'ms · water '+row.cpuMeanMs.ocean+'ms · '+row.drawCalls+' draws';
 }
 private download(){
  const output=JSON.stringify(this.report(),null,2);
  const url=URL.createObjectURL(new Blob([output],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='outrun-fps-'+new Date().toISOString().replaceAll(':','-')+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
