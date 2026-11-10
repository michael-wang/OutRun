/** Minimal race HUD geometry; pure calculations so rear markers are easy to verify. */
export const REAR_RIVAL_RANGE_METERS=200;

export interface RearRivalCandidate {
 id:string; name:string; distance:number; lateral:number; finishTime:number|null;
}
export interface RearRivalTag {
 id:string; name:string; distanceMeters:number; leftPercent:number; row:number;
}
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));

/** A driver's positive road-lateral direction is screen right in the chase camera.
 * Distances are route-space metres, and labels only represent LIVE cars behind. */
export function layoutRearRivalTags(
 player:{distance:number;lateral:number},
 rivals:readonly RearRivalCandidate[],roadHalfWidth:number,
):RearRivalTag[]{
 const behind=rivals.filter(r=>r.finishTime===null&&
  player.distance-r.distance>0&&player.distance-r.distance<=REAR_RIVAL_RANGE_METERS)
  .sort((a,b)=>b.distance-a.distance||(a.id<b.id?-1:1));
 const placed:RearRivalTag[]=[];
 for(const r of behind){
  const leftPercent=clamp(50+56*(r.lateral-player.lateral)/Math.max(4,2*roadHalfWidth),24,76);
  // Stack nearby lane markers vertically rather than allowing text overlap.
  const row=placed.filter(mark=>Math.abs(mark.leftPercent-leftPercent)<9).length;
  placed.push({id:r.id,name:r.name,distanceMeters:Math.round(player.distance-r.distance),leftPercent,row});
 }
 return placed;
}

/** Display exact recorded crossing time, never invent a finish time for a live racer. */
export function formatRaceTime(seconds:number|null):string{
 if(seconds===null)return '競賽中';
 const t=Math.max(0,seconds);
 const mins=Math.floor(t/60),whole=Math.floor(t%60),tenths=Math.floor(t*10)%10;
 return `${mins}:${String(whole).padStart(2,'0')}.${tenths}`;
}
