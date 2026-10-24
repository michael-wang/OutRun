/** Development-only measurements. No motion/scenery/speed is altered here. */
export const WORLD_SCALE = {metersPerUnit:1,roadWidth:14,markerSpacing:12};
export interface AuditFrame {
  wall:number; simulated:number; progress:number; speed:number; position:number[]; camera:number[]; trackLength?:number; heading?:number;
}
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
export class SpeedAudit {
  private previous?:AuditFrame;
  private start?:AuditFrame;
  private traveled=0;
  private cameraTravel=0;
  private frameTimes:number[]=[];
  private passes:number[]=[];
  readonly rows:Record<string,unknown>[]=[];
  reset(){this.previous=undefined;this.start=undefined;this.traveled=0;this.cameraTravel=0;this.frameTimes=[];this.passes=[];this.rows.length=0;}
  record(frame:AuditFrame){
    const previous=this.previous;this.previous=frame;
    if(!previous){this.start=frame;return;}
    const seconds=(frame.wall-previous.wall)/1000;
    if(seconds<=0)return;
    this.traveled+=distance(frame.position,previous.position);
    this.cameraTravel+=distance(frame.camera,previous.camera);
    this.frameTimes.push(seconds*1000);
    // Crossings of stationary 12m landmark planes, interpolated in wall time.
    // These are world pass events, not counts of posts visible in the viewport.
    const length=frame.trackLength??Infinity;
    let lap=Number.isFinite(length)?Math.floor(previous.progress/length):0;
    let origin=Number.isFinite(length)?lap*length:0;
    let station=origin+(Math.floor((previous.progress-origin)/12)+1)*12;
    if(station>=origin+length)station=origin+length;
    while(station<=frame.progress){
      this.passes.push(previous.wall+(frame.wall-previous.wall)*(station-previous.progress)/(frame.progress-previous.progress));
      if(station>=origin+length){lap++;origin=lap*length;}
      station=Math.min(station+12,origin+length);
    }
    const elapsed=(frame.wall-this.start!.wall)/1000;
    if(elapsed<1)return;
    const sorted=[...this.frameTimes].sort((a,b)=>a-b);
    this.rows.push({wallSeconds:elapsed,simulationSeconds:frame.simulated-this.start!.simulated,
      displayedKmh:Math.round(frame.speed*3.6),gameSpeed:frame.speed,...WORLD_SCALE,
      worldMetersPerSecond:this.traveled/elapsed,roadWidthsPerSecond:this.traveled/elapsed/WORLD_SCALE.roadWidth,
      trackMetersPerSecond:(frame.progress-this.start!.progress)/elapsed,
      cameraMetersPerSecond:this.cameraTravel/elapsed,markerPasses:this.passes.length,markerPassWallMs:[...this.passes],
      markerPassesPerSecond:this.passes.length/elapsed,fps:this.frameTimes.length/elapsed,
      medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],
      worldPosition:frame.position,cameraPosition:frame.camera,worldHeading:frame.heading});
    if(this.rows.length>120)this.rows.shift();
    this.start=frame;this.traveled=0;this.cameraTravel=0;this.frameTimes=[];this.passes=[];
  }
}
