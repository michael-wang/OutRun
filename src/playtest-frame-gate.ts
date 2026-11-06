/** Playtest-only quality gate. Does not pretend desktop CI can measure Pixel FPS. */
export type FrameIncident={
 kind:'below-30-fps'|'slow-frame'|'severe-frame';
 seconds:number;distanceM:number;fps:number;worstFrameGapMs:number;
};
export const FRAME_BUDGET={
 targetFps:60,blockBelowFps:30,slowFrameMs:50,severeFrameMs:100,
} as const;
export class PlaytestFrameGate {
 private incidents:FrameIncident[]=[];
 private samples=0;private fpsBelow30=0;private frame50=0;private frame100=0;
 private minimumFps=Infinity;private largestGap=0;
 ingest(row:{fps:number;seconds:number;distanceM:number;worstFrameGapMs:number;over50ms:number;over100ms:number}){
  if(!Number.isFinite(row.fps)||row.fps<=0)return;
  this.samples++;this.minimumFps=Math.min(this.minimumFps,row.fps);
  this.largestGap=Math.max(this.largestGap,row.worstFrameGapMs);
  this.frame50+=row.over50ms;this.frame100+=row.over100ms;
  const below30=row.fps<FRAME_BUDGET.blockBelowFps;
  if(below30)this.fpsBelow30++;
  const kind:FrameIncident['kind']|undefined=below30?'below-30-fps':
   row.worstFrameGapMs>=FRAME_BUDGET.severeFrameMs?'severe-frame':
   row.worstFrameGapMs>=FRAME_BUDGET.slowFrameMs?'slow-frame':undefined;
  if(kind){
   this.incidents.push({kind,seconds:row.seconds,distanceM:row.distanceM,
    fps:row.fps,worstFrameGapMs:row.worstFrameGapMs});
   if(this.incidents.length>64)this.incidents.shift();
  }
 }
 get report(){
  return {
   verdict:this.fpsBelow30>0||this.frame100>0?'REVIEW_REQUIRED':
    this.frame50>0?'WATCH':'PASS' as 'PASS'|'WATCH'|'REVIEW_REQUIRED',
   seconds:this.samples,minimumFps:this.samples?this.minimumFps:null,
   oneSecondBucketsBelow30:this.fpsBelow30,framesOver50ms:this.frame50,
   framesOver100ms:this.frame100,worstFrameGapMs:this.largestGap,
   thresholds:FRAME_BUDGET,incidents:[...this.incidents],
   disclaimer:'Phone-only rAF playback gate; passing desktop unit tests does not certify real mobile frame rate. Release decisions belong to the owner.',
  };
 }
}
