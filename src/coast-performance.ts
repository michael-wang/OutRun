/** Limit GPU work by elapsed time, not screen Hz. Initialize even at dt=0. */
export class OceanCadence {
 private elapsed=0;
 private sinceUpdate=0;
 private next=0;
 private initialized=false;
 constructor(private hz:number){}
 step(dt:number):number|null{
  if(this.initialized&&dt===0)return null;
  this.elapsed+=dt;this.sinceUpdate+=dt;
  if(this.initialized&&this.elapsed+1e-6<this.next)return null;
  const delta=this.sinceUpdate;this.sinceUpdate=0;this.initialized=true;
  this.next=Math.max(this.next+1/this.hz,this.elapsed);
  return delta;
 }
}

// A metre-high blade is about one pixel at 500 m on the landscape phone
// viewport. Leave room beyond the fade for a 200 m batch and a road bend.
export const MOBILE_MEADOW_COVER={fadeStart:300,fadeEnd:500,far:670} as const;

/** Matching near/far tree thresholds avoid a hole at the mobile LOD switch. */
export function natureVisible(n:{center:number;near:number;far:number;meadow?:'cover'|'detail'},position:number,mobile:boolean){
 const delta=n.center-position,range=Math.abs(delta);
 const limit=(d:number)=>!mobile?d:d===600?360:d===420?280:d===260?160:d===650?420:d;
 const far=mobile&&n.meadow==='cover'?MOBILE_MEADOW_COVER.far:limit(n.far);
 return delta>-250&&range>=limit(n.near)&&range<far;
}
