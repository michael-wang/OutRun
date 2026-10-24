export interface InputState { gas: boolean; brake: boolean; steer: number }
export interface DrivingState { distance: number; speed: number; lateral: number; heading: number; slip: number }
export const MAX_SPEED = 65;
export const createState = (): DrivingState => ({ distance: 0, speed: 0, lateral: 0, heading: 0, slip: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Road-relative arcade model. Distances are scene units, not calibrated real-world meters. */
export function step(state: DrivingState, input: InputState, dt: number, curvature: number): void {
  dt = clamp(dt, 0, 0.05);
  const steer = clamp(input.steer, -1, 1);
  const offroad = Math.abs(state.lateral) > 6.6;
  const acceleration = (input.gas ? 19 * (1 - state.speed / 88) : -3.8) - (input.brake ? 34 : 0) - (offroad ? 18 : 0);
  state.speed = clamp(state.speed + acceleration * dt, 0, MAX_SPEED);
  const demand = Math.abs(steer) * 0.9 + Math.abs(curvature) * state.speed * 2.3;
  const targetSlip = clamp((state.speed - 27) / 26, 0, 1) * clamp((demand - 0.33) / 0.75, 0, 1);
  state.slip += (targetSlip - state.slip) * (1 - Math.exp(-dt * (targetSlip > state.slip ? 3.5 : 5)));
  const outward = clamp(-curvature * state.speed * state.speed * 0.014, -1.5, 1.5);
  const lateralVelocity = steer * (2.8 + state.speed * 0.075) + outward * state.slip;
  state.lateral = clamp(state.lateral + lateralVelocity * dt * Math.min(1, state.speed / 6), -7.25, 7.25);
  const desiredHeading = steer * (0.10 + state.slip * 0.25) + outward * state.slip * 0.035;
  state.heading += (desiredHeading - state.heading) * (1 - Math.exp(-dt * 7));
  if (state.speed < 0.1) state.heading *= Math.exp(-dt * 6);
  state.distance += state.speed * Math.max(0.94, Math.cos(state.heading)) * dt;
}

