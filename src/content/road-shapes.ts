/** Preserved accepted C02/E02 cosine profiles for the authored coast.
 * These are deterministic math functions, not the retired L1 shape catalog. */
export type Knot=readonly [number,number];
export function profile(knots:readonly Knot[],t:number){
 // Identical endpoint/derivative handling to the accepted L1 evaluator.
 t=Math.max(knots[0][0],Math.min(knots.at(-1)![0],t));
 let i=1;while(i<knots.length-1&&(t>knots[i][0]||knots[i][0]===knots[i-1][0]))i++;
 const [a,lo]=knots[i-1],[b,hi]=knots[i],u=Math.max(0,Math.min(1,(t-a)/(b-a)));
 return {value:lo+(hi-lo)*(.5-.5*Math.cos(Math.PI*u)),
  derivative:t<=a||t>=b?0:(hi-lo)*Math.PI*Math.sin(Math.PI*u)/(2*(b-a))};
}
export function sweepKnots(steer:number):Knot[]{
 // C02 used duplicated boundary knots; retain them for bit-for-bit parity.
 return [[0,0],[0,0],[.2,steer],[.8,steer],[1,0],[1,0]];
}
export function riseKnots(base:number,rise:number):Knot[]{
 // E02 used a 12% approach / 12% exit shelf.
 return [[0,base],[.12,base],[.88,base+rise],[1,base+rise]];
}
