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
export function roadOffset(offset:number,halfWidth:number,shoulders?:Shoulders){
 if(shoulders&&Math.abs(offset)>7){const side=Math.sign(offset),width=side<0?shoulders.left:shoulders.right,extra=Math.abs(offset)-7;return side*(halfWidth+(extra<=6?extra*width/6:extra+width-6));}
 return Math.abs(offset)<=7?offset*halfWidth/7:offset+Math.sign(offset)*(halfWidth-7);
}

export interface Shoulders {left:number;right:number}
const ease=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10);};
/** r7: absolute-distance profiles; independent of chunk boundaries and frame time. */
export function shoulderProfile(distance:number,seed:number):Shoulders {
 const shift=seed===1?0:(seed%7)*35,d=distance-shift,phase=((d-2200)%4000+4000)%4000;
 if(d<2200)return {left:6,right:6};
 const second=phase>=2000,t=phase%2000,blend=ease(Math.min(t,1200-t)/300);
 return {left:6+((second?6.8:1.6)-6)*blend,right:6+((second?1.6:6.8)-6)*blend};
}
