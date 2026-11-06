import type {ConeRecipe} from './road-cones';
import type {createTrack} from './track';
import {coastBarrierStyle,coastCrosswalkNear} from './coast-layout';

/** A few SHORT cone warnings on the outside of the strongest coastal bends.
 * No road geometry changes. Actual left/right comes from successive tangent
 * vectors in the route's own frame (not a guessed curvature sign). Skip
 * crossings and physical stone/rock sections; never form a whole-lane wall.
 * Output is deterministic for one authored route, never time-random traffic.
 */
export function coastCurveConeLayout(
 sample:ReturnType<typeof createTrack>['sample'],
 halfAt:(d:number)=>number,length:number,
):ConeRecipe[]{
 const opportunities:{d:number;score:number;side:-1|1}[]=[];
 for(let d=630;d<length-420;d+=30){
  if(coastCrosswalkNear(d,70))continue;
  const p=sample(d),a=sample(d-24).tangent,b=sample(d+24).tangent;
  const direction=b.clone().sub(a).dot(p.right);
  const score=Math.abs(direction);
  if(score<.003)continue;
  const side:1|-1=direction>0?-1:1; // centrifugal outside of bend
  const style=coastBarrierStyle(d,side);
  if(style!=='none'&&style!=='opening')continue;
  if(coastBarrierStyle(d-32,side)!=='none'||
   coastBarrierStyle(d+42,side)!=='none')continue;
  opportunities.push({d,score,side});
 }
 opportunities.sort((a,b)=>b.score-a.score);
 const best=opportunities[0]?.score??0;
 const chosen:typeof opportunities=[];
 for(const candidate of opportunities){
  if(chosen.length>=7)break;
  if(candidate.score<best*.48)break;
  if(chosen.some(x=>Math.abs(x.d-candidate.d)<490))continue;
  chosen.push(candidate);
 }
 chosen.sort((a,b)=>a.d-b.d);
 return chosen.flatMap((c,i)=>Array.from({length:5},(_,j)=>{
  const d=c.d-27+j*12;
  // Only use the outside edge of the outermost lane (never block all five).
  const lateral=c.side*(halfAt(d)+.36+(j%3)*.09);
  return {id:800000+i*8+j,distance:d,side:c.side,
   lateral,inset:-.36};
 }));
}
