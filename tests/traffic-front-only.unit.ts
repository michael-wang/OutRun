import {it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,TRAFFIC_TYPES,TRAFFIC_LIMIT} from '../src/traffic';
import {trafficHasBeenPassed} from '../src/traffic-flow';
const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
});
it('does not retire a side-by-side car early, but retires it after its nose clears the rear bumper',()=>{
 expect(trafficHasBeenPassed(100,8.6,105)).toBe(false);
 expect(trafficHasBeenPassed(100,8.6,108)).toBe(true);
 expect(trafficHasBeenPassed(100,4.4,105)).toBe(false);
 expect(trafficHasBeenPassed(100,4.4,106)).toBe(true);
});
it('removes passed actors and never lets them respawn from the rear after the driver brakes',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1);
 const removed=new Set<number>();
 const seen=new Map<number,{distance:number;type:number}>();
 let active=new Set<number>();
 const playerAt=(t:number)=>350+Math.min(36,t)*105;
 for(let frame=0;frame<900;frame++){
  const t=frame*.1,player=playerAt(t);
  traffic.update(t,player,0,t<36?105:0);
  const actors=traffic.inspect().actors;
  expect(actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
  const ids=new Set(actors.map(a=>a.id));
  for(const id of removed)expect(ids.has(id),`car ${id} should not catch the stationary player`).toBe(false);
  for(const id of active)if(!ids.has(id)){
   const last=seen.get(id);
   if(last&&trafficHasBeenPassed(last.distance,TRAFFIC_TYPES[last.type].length,player))removed.add(id);
  }
  for(const a of actors){
   // At the back of the car it is still side-by-side, not a pursuer.
   expect(trafficHasBeenPassed(a.distance,TRAFFIC_TYPES[a.type].length,player)).toBe(false);
   seen.set(a.id,{distance:a.distance,type:a.type});
  }
  active=ids;
 }
 expect(removed.size).toBeGreaterThan(2);
 expect(traffic.inspect().passedCount).toBeGreaterThan(0);
 traffic.reset();
 expect(traffic.inspect().passedCount).toBe(0);
 traffic.dispose();
});
