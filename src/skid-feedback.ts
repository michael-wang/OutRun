const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Presentation only: shared audio/visual stress, independent of AudioContext and handling. */
export class SkidFeedback {
 intensity=0;private loaded=0;private quiet=0;private active=false;
 reset(){this.intensity=this.loaded=this.quiet=0;this.active=false;}
 update(speed:number,slip:number,dt:number,requiredSteer=0,appliedSteer=0,collisionSlide=0){
  const cornerStress=slip*clamp((Math.abs(requiredSteer)-.3)/.45)*clamp((Math.abs(appliedSteer)-.18)/.42);
  const stress=Math.max(cornerStress,clamp((Math.abs(collisionSlide)-1.2)/3.5));
  const speedGain=collisionSlide>1.2?clamp((speed-8)/15):clamp((speed*3.6-100)/60);
  this.loaded=stress>.20&&speedGain>0?this.loaded+dt:0;
  this.quiet=stress<.12||speedGain===0?this.quiet+dt:0;
  if(this.loaded>.10)this.active=true;
  if(this.quiet>.18)this.active=false;
  const target=(.15+.85*clamp((stress-.2)/.8))*speedGain;
  this.intensity=this.active?(this.quiet>0?this.intensity*Math.exp(-dt/0.06):target):0;
  return this.intensity;
 }
}
