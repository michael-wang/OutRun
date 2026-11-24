export const PACE_VARIANTS = [1,1.5,1.75,2] as const;
/** A metre per second on the gauge is a metre per second along the route. */
export const DEFAULT_PACE = 1;
/** Keep road geometry/curve-authoring calibration at its approved 1.75x baseline.
 * Changing the player's travel pace must not reshape previously authored stages.
 */
export const AUTHORING_PACE = 1.75;
export function selectedPace(value:string|null):number {
  const n=Number(value);return PACE_VARIANTS.some(p=>p===n)?n:DEFAULT_PACE;
}
/** Historical high-speed curve, also used for the fixed road-authoring reference. */
export function effectivePace(speed:number,highSpeedPace:number):number {
  const t=Math.max(0,Math.min(1,(speed*3.6-50)/150));
  return 1+(highSpeedPace-1)*t*t*(3-2*t);
}

/** Convert indicated m/s into longitudinal route m/s using the shared driving policy. */
export function worldSpeed(indicatedMps:number, highSpeedPace=DEFAULT_PACE):number {
  return indicatedMps*effectivePace(indicatedMps,highSpeedPace);
}
