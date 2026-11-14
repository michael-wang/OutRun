/** One cross-section for asphalt, paint, shoulders, scenery and handling. */
export const LANE_WIDTH=3.5;
/** Absolute start of the finite authored coast (the first HUD road metre). */
export const ROAD_START=350;
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
/** Fixed props outside the shoulder keep their full vehicle-clearance margin. */
export function roadObjectOffset(offset:number,halfWidth:number,shoulders?:Shoulders){const value=roadOffset(offset,halfWidth,shoulders);return shoulders&&Math.abs(offset)>=15?Math.sign(value)*Math.max(Math.abs(value),halfWidth+6.5):value;}


/**
 * r7 roadside visibility boundary: a continuous low rail and its 12 m markers
 * share one distance from the asphalt edge. Keeps the ordinary offroad corridor
 * behind a VISIBLE obstacle, without changing road width or ALB steering.
 */
export const TRIP_BARRIER_INNER_M=3.6;
export const TRIP_BARRIER_OUTER_M=3.82;
export const TRIP_MARKER_CENTER_M=3.82;

/** Convert edge clearance (meters) into the raw legacy scenery offset.
 * On tapered shoulders the raw value is nonlinear; never assume width=6. */
export function tripBarrierRawOffset(side:-1|1,clearanceM:number,shoulders:Shoulders):number{
 const width=side<0?shoulders.left:shoulders.right;
 const rawExtra=clearanceM<=width?clearanceM*6/width:6+clearanceM-width;
 return side*(7+rawExtra);
}


/** Predict the true coastal terrain drop at a roadside point, rather than planting
 * trees/marker posts on an exposed cliff face. Mirrors the terrain height rule
 * used by r7 scenery's left-side coastal gradient (right-side hills are exempt). */
export function coastalCliffDropAtLateral(roadY:number,rightY:number,lateral:number,half:number,shoulders:Shoulders,canyonWeight:number):number{
 if(lateral>=-half)return 0;
 const extra=Math.abs(lateral)-half,shoulderWidth=shoulders.left;
 const raw=-(extra<=shoulderWidth?7+extra*6/shoulderWidth:13+extra-shoulderWidth);
 if(raw>=-13)return 0;
 const weight=Math.max(0,Math.min(1,canyonWeight));
 const near=roadY+rightY*roadOffset(-13,half,shoulders)-.1;
 const far=roadY+rightY*roadOffset(-27,half,shoulders);
 const coast=-5.05*(1-weight)+(far-2-27*.015)*weight;
 const ground=raw>-27?near+(coast-near)*Math.min(1,(-raw-13)/14):
   -5.05*(1-weight)+(roadY+rightY*lateral-2-Math.abs(raw)*.015)*weight;
 return Math.max(0,roadY+rightY*lateral-ground);
}
