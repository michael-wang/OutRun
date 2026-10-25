const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
/** Presentation only: input must agree with a real bend before attitude appears. */
export function bodyYawTarget(applied:number,required:number,speed:number){
 if(Math.sign(applied)!==Math.sign(required))return 0;
 const load=Math.min(Math.abs(applied),Math.abs(required));
 const knots=[[.08,0],[.25,6],[.5,20],[.75,40],[1,57]];
 let degrees=0;
 for(let i=1;i<knots.length;i++){
  const [a,lo]=knots[i-1],[b,hi]=knots[i];
  if(load>a)degrees=lo+(hi-lo)*smooth((load-a)/(b-a));
  if(load<=b)break;
 }
 // Brief deliberate overcorrection can accentuate a genuinely loaded fast arc.
 degrees+=Math.max(0,Math.abs(applied)-load)*40*smooth((load-.5)/.25);
 return Math.sign(applied)*Math.min(60,degrees)*Math.PI/180*clamp(speed/60);
}
