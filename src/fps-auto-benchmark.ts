/**
 * Stationary shadow A/B without touchscreen interaction between phases.
 * Browser JS cannot disable Android's touch-initiated DVFS boost; this
 * isolates its transient by warming up, scheduling changes automatically,
 * and tagging samples affected by real pointer events.
 */
export const AUTO_SHADOW_PHASES=[
 {id:'warmup',label:'暖機／Touch Boost 衰退',durationSeconds:12,dynamicMap:true,staticMap:true,compare:false},
 {id:'A1',label:'基準 1：完整陰影',durationSeconds:14,dynamicMap:true,staticMap:true,compare:true},
 {id:'B',label:'關閉即時 Shadow Map',durationSeconds:14,dynamicMap:false,staticMap:true,compare:true},
 {id:'A2',label:'基準 2：完整陰影',durationSeconds:14,dynamicMap:true,staticMap:true,compare:true},
 {id:'C',label:'關閉靜態 Shadow Map',durationSeconds:14,dynamicMap:true,staticMap:false,compare:true},
 {id:'A3',label:'基準 3：完整陰影',durationSeconds:14,dynamicMap:true,staticMap:true,compare:true},
 {id:'D',label:'兩套 Shadow Map 都關閉',durationSeconds:14,dynamicMap:false,staticMap:false,compare:true},
 {id:'A4',label:'基準 4：完整陰影',durationSeconds:14,dynamicMap:true,staticMap:true,compare:true},
] as const;
export type AutoShadowPhaseId=typeof AUTO_SHADOW_PHASES[number]['id']|'complete';
type ShadowSwitch='dynamicMap'|'staticMap';
export const AUTO_SHADOW_TOTAL_SECONDS=AUTO_SHADOW_PHASES.reduce<number>((sum,p)=>sum+p.durationSeconds,0);
export function autoShadowPhaseAt(elapsedSeconds:number){
 let left=Math.max(0,elapsedSeconds);
 for(let index=0;index<AUTO_SHADOW_PHASES.length;index++){
  const phase=AUTO_SHADOW_PHASES[index];
  if(left<phase.durationSeconds)return {index,id:phase.id,phaseElapsedSeconds:left,phaseDurationSeconds:phase.durationSeconds};
  left-=phase.durationSeconds;
 }
 return {index:AUTO_SHADOW_PHASES.length,id:'complete' as const,phaseElapsedSeconds:0,phaseDurationSeconds:0};
}
export class AutoShadowBenchmark{
 private elapsedSeconds=0;
 private previousFrameAt:number|undefined;
 private phaseIndex=-1;
 private lastTouchAt:number|undefined;
 private touchCount=0;
 constructor(
  private readonly apply:(id:ShadowSwitch,enabled:boolean)=>void,
  private readonly onPhase?:(id:AutoShadowPhaseId,label:string)=>void,
 ){}
 noteTouch(now:number){this.lastTouchAt=now;this.touchCount++;}
 tick(now:number,active:boolean){
  if(!active){this.previousFrameAt=undefined;return;}
  if(this.previousFrameAt!==undefined)this.elapsedSeconds+=Math.max(0,(now-this.previousFrameAt)/1000);
  this.previousFrameAt=now;
  const phase=autoShadowPhaseAt(this.elapsedSeconds);
  if(phase.index===this.phaseIndex)return;
  this.phaseIndex=phase.index;
  const settings=AUTO_SHADOW_PHASES[phase.index];
  this.apply('dynamicMap',settings?.dynamicMap??true);
  this.apply('staticMap',settings?.staticMap??true);
  this.onPhase?.(phase.id,settings?.label??'自動測試完成 · 可以匯出 JSON');
 }
 snapshot(now:number){
  const phase=autoShadowPhaseAt(this.elapsedSeconds);
  const settings=AUTO_SHADOW_PHASES[phase.index];
  const touchAgeSeconds=this.lastTouchAt===undefined?null:Math.max(0,(now-this.lastTouchAt)/1000);
  const afterTransitionSeconds=phase.phaseElapsedSeconds;
  return {
   protocol:'touch-free-shadow-abab',
   phase:phase.id,
   phaseIndex:phase.index,
   phaseElapsedSeconds:Math.round(afterTransitionSeconds*10)/10,
   elapsedSeconds:Math.round(this.elapsedSeconds*10)/10,
   totalSeconds:AUTO_SHADOW_TOTAL_SECONDS,
   lastTouchAgeSeconds:touchAgeSeconds===null?null:Math.round(touchAgeSeconds*10)/10,
   touchCount:this.touchCount,
   // Ignore mixed one-second bins, shader/map transition, and post-touch boost.
   stable:!!settings?.compare&&afterTransitionSeconds>=4&&(touchAgeSeconds===null||touchAgeSeconds>=6),
  };
 }
}
