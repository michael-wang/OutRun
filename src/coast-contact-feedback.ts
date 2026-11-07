import {coastBarrierStyle} from './coast-layout';

/** Which thing actually meets the car at an authored coast boundary.
 * 'soft' is invisible containment, never a pretend steel fence.
 * Individual bollards are handled first by CoastStoneContact, while this
 * fallback classifies their underlying continuous road-edge safety bound.
 */
export type CoastContactSurface='metal'|'concrete'|'soft';
export function coastContactSurface(distance:number,side:number):CoastContactSurface{
 const style=coastBarrierStyle(distance,side<0?-1:1);
 if(style==='rail')return 'metal';
 if(style==='block')return 'concrete';
 return 'soft';
}
