import {LANE_WIDTH} from './road-profile';
export type CurvatureId='C01'|'C02'|'C03'|'C04'|'C05'|'C06'|'C07'|'C08';
export type ElevationId='E01'|'E02'|'E03'|'E04'|'E05'|'E06';
export type WidthId='W01'|'W02'|'W03'|'W04';
export type Knot=readonly [number,number];
export interface CurveParameters {effort:number;direction:1|-1;start:number;end:number;secondary:number}
export interface ElevationParameters {base:number;amplitude:number;direction:1|-1;shelfStart:number;shelfEnd:number}
export interface WidthParameters {from:2|4|6|8;to:2|4|6|8;start:number;end:number}
/** Reuse the accepted cosine knot interpolation, exposing its exact derivative. */
export function profile(knots:readonly Knot[],t:number){
 // Full-length shapes can share an endpoint with the approach/exit knot.
 t=Math.max(knots[0][0],Math.min(knots.at(-1)![0],t));
 let i=1;while(i<knots.length-1&&(t>knots[i][0]||knots[i][0]===knots[i-1][0]))i++;
 const [a,lo]=knots[i-1],[b,hi]=knots[i],u=Math.max(0,Math.min(1,(t-a)/(b-a)));
 return {value:lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*u)),derivative:t<=a||t>=b?0:(hi-lo)*Math.PI*Math.sin(Math.PI*u)/(2*(b-a))};
}
export function curvatureKnots(id:CurvatureId,p:CurveParameters):Knot[]{
 const shapes:Record<CurvatureId,readonly Knot[]>={
  C01:[[0,0],[1,0]],C02:[[0,0],[.2,1],[.8,1],[1,0]],
  C03:[[0,0],[.18,.25],[.75,1],[.86,1],[1,0]],
  C04:[[0,0],[.14,1],[.25,1],[.82,.25],[1,0]],
  C05:[[0,0],[.15,1],[.3,1],[.45,.15],[.65,p.secondary],[.85,p.secondary],[1,0]],
  C06:[[0,0],[.15,1],[.32,1],[.5,0],[.68,-p.secondary],[.85,-p.secondary],[1,0]],
  C07:[[0,0],[.12,1],[.22,0],[.36,-p.secondary],[.46,0],[.6,.8],[.7,0],[.84,-1],[1,0]],
  C08:[[0,0],[.25,1],[.75,1],[1,0]],
 };
 return [[0,0],...shapes[id].map(([t,v])=>[p.start+t*(p.end-p.start),v*p.effort*p.direction] as Knot),[1,0]];
}
export function elevationKnots(id:ElevationId,p:ElevationParameters):Knot[]{
 const {base:b,amplitude:a,direction:d}=p;
 const shapes:Record<ElevationId,readonly Knot[]>={E01:[[0,0],[1,0]],E02:[[0,0],[.12,0],[.88,d],[1,d]],E03:[[0,0],[.12,0],[.48,1],[.55,.98],[.9,0],[1,0]],E04:[[0,1],[.1,1],[.5,0],[.9,1],[1,1]],E05:[[0,0],[.1,0],[p.shelfStart,1],[p.shelfEnd,1],[.9,0],[1,0]],E06:[[0,0],[.1,0],[.27,1],[.44,.05],[.62,.85],[.8,0],[.9,.25],[1,.25]]};
 return shapes[id].map(([t,v])=>[t,b+a*v]);
}
export function widthKnots(id:WidthId,p:WidthParameters):Knot[]{
 const {from:a,to:b,start,end}=p;
 if(id==='W01')return [[0,a],[1,a]];
 if(id==='W04'){const span=end-start;return [[0,a],[start,a],[start+span*.32,b],[start+span*.65,b],[end,a],[1,a]];}
 return [[0,a],[start,a],[end,b],[1,b]];
}
export function resolveL1(length:number,t:number,c:readonly Knot[],e:readonly Knot[],w:readonly Knot[]){
 const elevation=profile(e,t),lanes=profile(w,t).value;
 return {demand:profile(c,t).value,height:elevation.value,grade:elevation.derivative/length,lanes,halfWidth:lanes*LANE_WIDTH/2};
}
