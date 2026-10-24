export interface InputState { gas: boolean; brake: boolean; steer: number }
export interface DrivingState {
  distance: number; speed: number; lateral: number;
  /** Body and velocity errors relative to road heading; positive means right. */
  heading: number; velocityHeading: number; worldHeading: number;
  steering: number; yawRate: number; slipAngle: number; slip: number;
  offRoad: boolean; footprintEdge: number; curvature: number;
}
export const MAX_SPEED = 65;
export const ROAD_HALF_WIDTH = 7;
export const createState = (): DrivingState => ({ distance: 0, speed: 0, lateral: 0,
  heading: 0, velocityHeading: 0, worldHeading: 0, steering: 0, yawRate: 0,
  slipAngle: 0, slip: 0, offRoad: false, footprintEdge: 1.13, curvature: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const angleDifference = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
export const steeringRate = (speed: number) => Math.min(.6, speed * .035);
export function updateFootprint(s: DrivingState) {
  // Oriented footprint (2.26 wide x 4.7 long), not a lane-center threshold.
  s.footprintEdge = Math.abs(s.lateral) + 1.13 * Math.abs(Math.cos(s.heading)) + 2.35 * Math.abs(Math.sin(s.heading));
  s.offRoad = s.footprintEdge > ROAD_HALF_WIDTH;
}
/** Frenet kinematics: curvature changes the reference frame, NEVER world yaw.
 * ds/dt = v cos(error)/(1-k*lateral); dl/dt = v sin(error).
 * Both heading errors subtract k*ds. No lane spring, offset clamp or road steering.
 */
export function step(s: DrivingState, input: InputState, dt: number, curvature: number): void {
  dt = clamp(dt, 0, .05);
  s.curvature = curvature;
  updateFootprint(s);
  const acceleration = (input.gas ? 19 * (1 - s.speed / 88) : -3.8) - (input.brake ? 34 : 0)
    - (s.offRoad ? 10 + s.speed * .07 : 0);
  s.speed = clamp(s.speed + acceleration * dt, 0, MAX_SPEED);
  s.steering += (clamp(input.steer, -1, 1) - s.steering) * (1 - Math.exp(-dt * 12));
  s.yawRate = s.steering * steeringRate(s.speed);
  s.worldHeading += s.yawRate * dt;
  s.heading += s.yawRate * dt;
  // Tire response lags body yaw under fast steering: velocity really slides.
  const grip = 9 - 5.5 * clamp((s.speed - 25) / 35, 0, 1);
  s.velocityHeading += angleDifference(s.heading - s.velocityHeading) * (1 - Math.exp(-grip * dt));
  const ds = s.speed * Math.cos(s.velocityHeading) / Math.max(.3, 1 - curvature * s.lateral) * dt;
  s.lateral += s.speed * Math.sin(s.velocityHeading) * dt;
  s.distance += ds;
  s.heading = angleDifference(s.heading - curvature * ds);
  s.velocityHeading = angleDifference(s.velocityHeading - curvature * ds);
  s.slipAngle = angleDifference(s.heading - s.velocityHeading);
  s.slip = clamp(Math.abs(s.slipAngle) / .18, 0, 1) * clamp(s.speed / 25, 0, 1);
  updateFootprint(s);
}
