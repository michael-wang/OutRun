/** Arcade traffic director: deterministic for a traffic seed, independent of
 * the authored road/landscape seed. Pure, bounded helpers usable by QA.
 *
 * Design invariants:
 *  - Encounter groups reserve at least one whole lane for overtaking.
 *  - New cars are not materialized into another car's envelope or in a
 *    simultaneous all-lane blockade.
 *  - Following/obstacle response uses continuous speed (no long-range snap).
 */
export const TRAFFIC_FLOW=Object.freeze({
 laneWidth:3.5,
 roadEntryClearance:34,
 blockadeSpan:38,
 leaderLookAhead:300,
 followingSeconds:1.4,
 baseHeadway:8,
 maximumBrake:15, // m/s²; emergency-braking arcade driver
 maximumAcceleration:2.8, // m/s²
});
export type TrafficSlot={id:number;distance:number;lateral:number;speed:number;length:number;stationary?:boolean};

/** A normal arcade run is different each time; ?trafficSeed=1234 pins QA.
 * Crypto is preferred for freshness, but Math.random works in older browsers.
 * The number remains local to the session, never mutating the scenery seed.
 */
export function newTrafficSessionSeed(query?:URLSearchParams){
 const raw=query?.get('trafficSeed');
 if(raw!==null&&raw!==undefined&&/^[0-9]{1,10}$/.test(raw)){
  const n=Number(raw);
  if(n<=0xffffffff)return n>>>0;
 }
 if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){
  const data=new Uint32Array(1);crypto.getRandomValues(data);return data[0]>>>0;
 }
 return Math.floor(Math.random()*4294967296)>>>0;
}

export function roadLaneCenters(halfWidth:number){
 const count=Math.max(2,Math.round(halfWidth*2/TRAFFIC_FLOW.laneWidth));
 const first=-(count-1)*TRAFFIC_FLOW.laneWidth/2;
 return Array.from({length:count},(_,i)=>first+i*TRAFFIC_FLOW.laneWidth);
}
export function nearestTrafficLane(lateral:number,centers:readonly number[]){
 let best=0;
 for(let i=1;i<centers.length;i++)if(Math.abs(lateral-centers[i])<Math.abs(lateral-centers[best]))best=i;
 return best;
}
const hash=(n:number)=>{
 let x=n>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);
 return ((x^(x>>>16))>>>0)/4294967296;
};
/** Allocate every group to at most N-1 physical lanes. The fourth member of
 * a four-lane group shares a lane longitudinally rather than closing the road.
 * Vehicle type does not force every bus/truck onto a single blocking channel.
 */
export function plannedTrafficLane(seed:number,group:number,member:number,halfWidth:number){
 const count=roadLaneCenters(halfWidth).length;
 const reserved=Math.floor(hash(seed^Math.imul(group+41,0x9e3779b1))*count);
 const lanes=Array.from({length:count},(_,i)=>i).filter(i=>i!==reserved);
 // Rotate occupied lanes so neighboring groups don't look identical.
 const first=Math.floor(hash(seed^Math.imul(group+923,0x632be59b))*lanes.length);
 return lanes[(first+member)%lanes.length];
}
export function plannedTrafficLateral(seed:number,group:number,member:number,halfWidth:number){
 const centers=roadLaneCenters(halfWidth);
 return centers[plannedTrafficLane(seed,group,member,halfWidth)];
}

/** Only an entrant can be denied. Already-visible traffic is never deleted
 * to make room, so the driver cannot see cars popping out of existence. */
export function trafficCanEnter(candidate:TrafficSlot,visible:readonly TrafficSlot[],halfWidth:number){
 const centers=roadLaneCenters(halfWidth),blocked=new Set<number>();
 for(const actor of visible){
  const distance=Math.abs(candidate.distance-actor.distance);
  if(distance<TRAFFIC_FLOW.roadEntryClearance
   &&Math.abs(candidate.lateral-actor.lateral)<TRAFFIC_FLOW.laneWidth*.87)return false;
  if(distance<TRAFFIC_FLOW.blockadeSpan)
   blocked.add(nearestTrafficLane(actor.lateral,centers));
 }
 if(visible.some(a=>a.stationary&&Math.abs(a.distance-candidate.distance)<50
  &&Math.abs(a.lateral-candidate.lateral)<TRAFFIC_FLOW.laneWidth*.85))return false;
 if(blocked.size>=centers.length-1&&!blocked.has(nearestTrafficLane(candidate.lateral,centers)))return false;
 return true;
}

/** A mobile traffic vehicle approaches the speed of the leader smoothly.
 * Obstacle margins scale with closing speed; slow trucks must brake early
 * before stopped cars, not touch them and then teleport backward. */
export function trafficFollowingTarget(
 follower:TrafficSlot,leader:TrafficSlot|null,cruise:number,
){
 if(!leader||leader.distance<=follower.distance)return Math.max(0,cruise);
 const gap=leader.distance-follower.distance-(follower.length+leader.length)/2;
 const closing=Math.max(0,follower.speed-leader.speed);
 const safe=TRAFFIC_FLOW.baseHeadway+follower.speed*TRAFFIC_FLOW.followingSeconds
  +closing*closing/(2*TRAFFIC_FLOW.maximumBrake);
 return Math.max(0,Math.min(cruise,leader.speed+(gap-safe)/2.5));
}
export function approachTrafficSpeed(current:number,target:number,dt:number){
 if(!(dt>0))return current;
 const rate=target<current?TRAFFIC_FLOW.maximumBrake:TRAFFIC_FLOW.maximumAcceleration;
 const step=Math.min(rate*dt,Math.abs(target-current));
 return Math.max(0,current+Math.sign(target-current)*step);
}

/** End-of-step safety clamp: the leader can never be hit by our AI vehicle.
 * The displacement adjustment is normally sub-centimetre after the early
 * braking above; it only handles unusual large-dt / streaming re-entries.
 */
export function trafficStopBeforeLeader(follower:TrafficSlot,leader:TrafficSlot|null){
 if(!leader||leader.distance<=follower.distance)return follower.distance;
 const clearance=(follower.length+leader.length)/2+2;
 return Math.min(follower.distance,leader.distance-clearance);
}
