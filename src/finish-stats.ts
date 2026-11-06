/** Small, intentionally secondary driving totals for the scenery-first
 * finish view. Average is TIME-weighted actual dashboard speed, not the
 * exaggerated world-distance scaler used for arcade travelling pace.
 */
export class FinishStats {
 private speedMetres=0;
 private peak=0;
 private collisions=0;
 reset(){this.speedMetres=0;this.peak=0;this.collisions=0;}
 addFrame(dt:number,metresPerSecond:number){
  if(!Number.isFinite(dt)||dt<=0||!Number.isFinite(metresPerSecond))return;
  const v=Math.max(0,metresPerSecond);
  this.speedMetres+=v*dt;
  this.peak=Math.max(this.peak,v);
 }
 addCollisions(n=1){if(n>0&&Number.isFinite(n))this.collisions+=Math.floor(n);}
 summary(elapsedSeconds:number){
  const t=Math.max(0,Number.isFinite(elapsedSeconds)?elapsedSeconds:0);
  const minutes=Math.floor(t/60),seconds=Math.floor(t%60),tenths=Math.floor(t*10)%10;
  return {
   time:`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths}`,
   averageKmh:Math.round(t>0?this.speedMetres/t*3.6:0),
   maximumKmh:Math.round(this.peak*3.6),
   collisions:this.collisions,
  };
 }
}
