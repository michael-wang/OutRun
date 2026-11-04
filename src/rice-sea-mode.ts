/** Rice Sea R8.8 A/B experiment. dev defaults to the new hybrid renderer.
 * ?rice=legacy restores the untouched R8.7 rice construction and startup gate.
 * Never use this parameter as an extra journey mode selector.
 */
export type RiceSeaMode='hybrid'|'legacy';
export const RICE_SEA_MODE:RiceSeaMode=typeof location!=='undefined'&&new URLSearchParams(location.search).get('rice')==='legacy'?'legacy':'hybrid';
export const HYBRID_RICE_SEA=RICE_SEA_MODE==='hybrid';
