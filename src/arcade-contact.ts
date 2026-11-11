/** Symmetric arcade rear-end impulse. It is deliberately NOT rigid-body physics:
 * the leading car loses more forward momentum and is pushed across the lane,
 * while the following car pays a smaller speed cost and also slides sideways. */
export interface RearImpactResponse {
 trailingSpeedMultiplier:number; leadingSpeedMultiplier:number;
 trailingSideSpeed:number; leadingSideSpeed:number;
}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function rearImpactResponse(severity:number):RearImpactResponse{
 const strength=clamp(severity,0,1);
 return {
  trailingSpeedMultiplier:1-(.055+.125*strength),
  leadingSpeedMultiplier:1-(.12+.19*strength),
  trailingSideSpeed:1.8+2.4*strength,
  leadingSideSpeed:3.8+5.7*strength,
 };
}
