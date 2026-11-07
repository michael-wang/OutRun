export const PACE_VARIANTS = [1,1.5,1.75,2] as const;
/** Runtime movement multiplier for new drives (the analog gauge is unchanged). */
export const DEFAULT_PACE = 1.50;
/** Keep road geometry/curve-authoring calibration at its approved 1.75x baseline.
 * Changing the player's travel pace must not reshape previously authored stages.
 */
export const AUTHORING_PACE = 1.75;
export function selectedPace(value:string|null):number {
  const n=Number(value);return PACE_VARIANTS.some(p=>p===n)?n:DEFAULT_PACE;
}
/** Indicated speed remains an arcade gauge; world velocity is explicitly boosted. */
export function effectivePace(speed:number,highSpeedPace:number):number {
  const t=Math.max(0,Math.min(1,(speed*3.6-50)/150));
  return 1+(highSpeedPace-1)*t*t*(3-2*t);
}
