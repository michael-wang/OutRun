import {BRICK_START} from './bricks';
import {COAST_ULTRA_STAGE} from './coast-ultra-stage';

/** R0 retirement boundary: the old City/Canyon procedural journey is not a
 * playable mode. The prior city second-stage recipe has no retained use.
 * The accepted coast remains while new authored stages await their data format.
 */
// The inactive transition implementation in main.ts still compares chapter IDs
// against canyon until it is removed together with the legacy road pipeline.
// Widen its *type only*; there is no canyon or city stage entry at runtime.
export type LegacyChapter = {
 id:'coast'|'canyon';title:string;time:string;
 stage:typeof COAST_ULTRA_STAGE;start:number;end:number
};
export function journeyChapters():readonly LegacyChapter[]{
 return [{id:'coast',title:'海濱公路',time:'黃昏',
  stage:COAST_ULTRA_STAGE,start:BRICK_START,end:BRICK_START+COAST_ULTRA_STAGE.length}] as const;
}
