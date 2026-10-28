/** One cross-section for asphalt, paint, shoulders, scenery and handling. */
export const LANE_WIDTH=3.5;
export type LaneKnot=readonly [number,number];
export function laneProfile(knots:readonly LaneKnot[],seconds:number){
 let i=1;while(i<knots.length-1&&seconds>knots[i][0])i++;
 const [a,lo]=knots[i-1],[b,hi]=knots[i],t=Math.max(0,Math.min(1,(seconds-a)/(b-a)));
 const lanes=lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*t));
 return {lanes,halfWidth:lanes*LANE_WIDTH/2};
}
/** Existing scenery coordinates are measured around a 14-unit road. */
export function roadOffset(offset:number,halfWidth:number){
 return Math.abs(offset)<=7?offset*halfWidth/7:offset+Math.sign(offset)*(halfWidth-7);
}
