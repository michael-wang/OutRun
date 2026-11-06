/** Rural roadside art direction.
 *
 * Every house model's entrance/windows are on its local -X side. The route
 * sample.right is world NEGATIVE X on a straight road: placing homes at
 * positive right means local -X needs a Math.PI flip to face the roadway.
 * Do not drop that flip! The angles below are additional deltas to Math.PI.
 *
 * Positive yaw looks a little toward an APPROACHING driver's viewpoint
 * (roadside plus back along the route). Not every home gets this treatment:
 * loosely farm-oriented parcels, quiet inward courtyards and irregular
 * roadside fronts keep the village from looking like an exhibition row.
 *
 * These choices are pure per-house hashes: stable across Worker chunks and
 * free of per-frame camera or look-at rotations.
 */
export type CoastHomeContext='farm'|'village'|'shop';
const rand=(key:number,salt:number)=>{
 let x=(Math.imul((key^salt)>>>0,0x9e3779b1)+0x7f4a7c15)>>>0;
 x=Math.imul(x^(x>>>16),0x85ebca6b);
 x=Math.imul(x^(x>>>13),0xc2b2ae35);
 return ((x^(x>>>16))>>>0)/4294967296;
};

/** Signed radians RELATIVE to road heading, before the small site yaw.
 * A deliberately uneven mix: no alternating regular +/- facade patterns.
 */
export function coastHomeFacingYaw(key:number,context:CoastHomeContext):number{
 const style=rand(key,0x53f0a1),offset=rand(key,0x718ac4),micro=(rand(key,0x241a9d)-.5)*.11;
 if(context==='shop')return (offset-.5)*.24+micro;
 if(context==='farm'){
  if(style<.43)return .43+offset*.42+micro;  // 43% readable on approach
  if(style<.72)return .14-offset*.51+micro;  // original varied road fronts
  if(style<.89)return -.53-offset*.74+micro; // faces a side yard/path
  return -1.95-offset*.30+micro;              // occasional inward-facing farm
 }
 if(style<.31)return .36+offset*.43+micro;
 if(style<.77)return .16-offset*.43+micro;
 if(style<.90)return -.40-offset*.67+micro;
 return 1.0+offset*.26+micro;
}

/** Conservative rotated ground footprint in road coordinates.
 * Used in tests to check that hero courtyard stays clear of creek and the
 * playable verge despite turning its gate toward the oncoming camera.
 */
export function rotatedHouseExtent(halfX:number,halfZ:number,yaw:number){
 const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
 return {right:halfX*c+halfZ*s,along:halfX*s+halfZ*c};
}

/** Facing score for a house at lateral x and a viewer 'lead' metres before
 * it on the road. 1 = full front view; 0 = edge-on; negative = rear wall.
 * yaw is the ADDITION to the road-facing Math.PI, not an absolute world yaw.
 */
export function houseApproachFrontScore(yaw:number,lateral:number,lead:number){
 const towardRoad=-lateral,towardDriver=-lead;
 const dx=-Math.cos(yaw),dz=-Math.sin(yaw);
 return (dx*towardRoad+dz*towardDriver)/Math.hypot(lateral,lead);
}
