import {BRICK_START} from './bricks';
import {COAST_ULTRA_STAGE} from './coast-ultra-stage';

/** R0 retirement boundary: the old City/Canyon procedural journey is not a
 * playable mode. The prior city second-stage recipe has no retained use.
 * The accepted coast remains while new authored stages await their data format.
 */
export function journeyChapters(){
 return [{id:'coast',title:'海濱公路',time:'黃昏',
  stage:COAST_ULTRA_STAGE,start:BRICK_START,end:BRICK_START+COAST_ULTRA_STAGE.length}] as const;
}
