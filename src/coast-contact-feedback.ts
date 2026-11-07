import {coastBarrierStyle,coastBarrierStoneAt} from './coast-layout';

/** Actual roadside contact material. A 'block' district only has discrete
 * 12m concrete bollards: the gaps are STILL invisible safety edges, never
 * imaginary concrete. StoneContact handles the physical stone first.
 */
export type CoastContactSurface='metal'|'concrete'|'soft';
export function coastContactSurface(distance:number,side:number):CoastContactSurface{
 const laneSide: -1|1=side<0?-1:1;
 const style=coastBarrierStyle(distance,laneSide);
 if(style==='rail')return 'metal';
 if(style==='block'){
  const closest=Math.round(distance/12)*12;
  for(const slot of [closest-12,closest,closest+12]){
   if(slot<0||coastBarrierStyle(slot,laneSide)!=='block')continue;
   const stone=coastBarrierStoneAt(slot,laneSide);
   // Only its actual finite concrete length can sound like concrete.
   if(Math.abs(stone.d-distance)<stone.length*.5+.4)return 'concrete';
  }
 }
 return 'soft';
}
