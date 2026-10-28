import { effectivePace } from '../../src/pace';
export interface InputState { gas: boolean; brake: boolean; steer: number }
export interface DrivingState {
  distance: number; speed: number; lateral: number;
  /** Body and velocity errors relative to road heading; positive means right. */
  heading: number; velocityHeading: number; worldHeading: number;
  steering: number; yawRate: number; slipAngle: number; slip: number;
  offRoad: boolean; footprintEdge: number; curvature: number;
  /** Boundary-only contact, released by deliberate inward steering. */
  corridorSide: number;
  steerHold:number; steerSign:number; drifting:boolean; driftRelease:number;
}
export const MAX_SPEED = 65;
export const ROAD_HALF_WIDTH = 7;
// Whole 2.26 x 4.7m vehicle fits outside asphalt, including its rotated footprint.
export const CORRIDOR_LIMIT = ROAD_HALF_WIDTH + 2.6;
export const createState = (): DrivingState => ({ distance: 0, speed: 0, lateral: 0,
  heading: 0, velocityHeading: 0, worldHeading: 0, steering: 0, yawRate: 0,
  slipAngle: 0, slip: 0, offRoad: false, footprintEdge: 1.13, curvature: 0, corridorSide: 0,steerHold:0,steerSign:0,drifting:false,driftRelease:0 });
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const angleDifference = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
export const steeringRate = (speed: number) => Math.min(.65, speed * .035);
export function updateFootprint(s: DrivingState) {
  // Oriented footprint (2.26 wide x 4.7 long), not a lane-center threshold.
  s.footprintEdge = Math.abs(s.lateral) + 1.13 * Math.abs(Math.cos(s.heading)) + 2.35 * Math.abs(Math.sin(s.heading));
  s.offRoad = s.footprintEdge > ROAD_HALF_WIDTH;
}
/** Frenet kinematics: curvature changes the reference frame, NEVER world yaw.
 * ds/dt = v cos(error)/(1-k*lateral); dl/dt = v sin(error).
 * Both heading errors subtract k*ds. No lane spring or road steering. The outer
 * shoulder alone has a positional contact constraint and outward-yaw stop.
 */
export function step(s: DrivingState, input: InputState, dt: number, curvature: number, highSpeedPace=1): void {
  dt = clamp(dt, 0, .05);
  s.curvature = curvature;
  updateFootprint(s);
  const acceleration = (input.gas&&!input.brake ? 19 * (1 - s.speed / 88) + 6 * Math.max(0,1-s.speed/20) : -3.8) - (input.brake ? 34 : 0)
    - (s.offRoad ? 10 + s.speed * .07 : 0);
  s.speed = clamp(s.speed + acceleration * dt, 0, MAX_SPEED);
  const pace=effectivePace(s.speed,highSpeedPace),travelSpeed=s.speed*pace;
  // Wall-time hold ramp: higher world pace must not make a brief tap engage faster.
  const sign=Math.sign(input.steer);
  if(sign&&sign!==s.steerSign)s.steerHold=0;
  s.steerHold=sign?Math.min(1,s.steerHold+dt):Math.max(0,s.steerHold-dt*2.5);
  if(sign)s.steerSign=sign;
  const ramp=clamp(s.steerHold/.85,0,1),authority=.16+.84*ramp*ramp*(3-2*ramp);
  const demand=clamp(input.steer,-1,1)*authority;
  s.steering+=(demand-s.steering)*(1-Math.exp(-dt*(sign?9:16)));
  // Sustained input alone is insufficient: ordinary partial-authority turns keep grip.
  const deliberate=s.speed>35&&s.steerHold>.65&&Math.abs(s.steering)>.85&&Math.abs(input.steer)>.8&&!s.corridorSide;
  if(deliberate){s.drifting=true;s.driftRelease=0;}else{s.driftRelease+=dt;if(s.driftRelease>.16||s.speed<28||s.corridorSide)s.drifting=false;}
  if (input.steer * s.corridorSide < 0) s.corridorSide = 0;
  // Preserve player turn radius as travel rises. Zero input never adds yaw.
  s.yawRate = s.corridorSide ? 0 : s.steering * steeringRate(s.speed)*pace;
  s.worldHeading += s.yawRate * dt;
  s.heading += s.yawRate * dt;
  // Tire response lags body yaw under fast steering: velocity really slides.
  const grip = s.drifting?1.1:9-3*clamp((s.speed-25)/35,0,1);
  s.velocityHeading += angleDifference(s.heading - s.velocityHeading) * (1 - Math.exp(-grip * pace * dt));
  const denominator = Math.max(.3, 1 - curvature * s.lateral);
  const attempted = s.lateral + travelSpeed * Math.sin(s.velocityHeading) * dt;
  if (Math.abs(attempted) >= CORRIDOR_LIMIT) s.corridorSide = Math.sign(attempted);
  s.lateral = s.corridorSide ? s.corridorSide * CORRIDOR_LIMIT : attempted;
  // Sliding along the boundary preserves progress even when facing across it.
  // Neither this projection nor contact changes heading or moves the car inward.
  const forward = s.corridorSide ? Math.max(.35, Math.cos(s.velocityHeading)) : Math.cos(s.velocityHeading);
  const ds = travelSpeed * forward / denominator * dt;
  s.distance += ds;
  s.heading = angleDifference(s.heading - curvature * ds);
  s.velocityHeading = angleDifference(s.velocityHeading - curvature * ds);
  s.slipAngle = angleDifference(s.heading - s.velocityHeading);
  s.slip = clamp((Math.abs(s.slipAngle)-.10)/.5, 0, 1) * clamp(s.speed / 25, 0, 1);
  updateFootprint(s);
}
