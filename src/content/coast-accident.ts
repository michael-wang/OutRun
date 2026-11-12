import {roadLaneCenters} from '../traffic-flow';
import {trafficRandom} from '../traffic-lanes';
import type {Breakdown} from '../breakdowns';
import type {CoastAccident} from './coast-onboarding';

/** Small seeded, REAL collision obstacles. The visual wrecks belong to the
 * existing Traffic instancing path, not a separate scenery prefab. */
export interface AccidentVehicle extends Breakdown{
 incidentId:'A4';stopYaw:number;
}
export function coastAccidentLayout(
 halfAt:(distance:number)=>number,site:CoastAccident,seed:number,
):AccidentVehicle[]{
 const lanes=roadLaneCenters(halfAt(site.distance));
 if(lanes.length<4||site.minimumOpenLanes>lanes.length-2)
  throw Error('First-map incident requires an open passing corridor');
 const count=Math.min(lanes.length-site.minimumOpenLanes,
  trafficRandom(seed^0xa41,71)<.5?2:3);
 // Five-lane version keeps two genuine open outside lanes. Vehicles are
 // staggered longitudinally and yawed, never stacked in one solid wall.
 const start=Math.max(1,Math.floor((lanes.length-count)/2));
 const indices=Array.from({length:count},(_,i)=>start+i);
 const offsets=[-16,14,39],types=[0,2,0]; // A car, a skewed utility truck, optionally a second car
 return indices.map((lane,i)=>{
  const distance=site.distance+offsets[i]+(trafficRandom(seed^0xa42,i)-.5)*7;
  const stopYaw=(i%2===0?1:-1)*(.14+.10*trafficRandom(seed^0xa43,i));
  return {
   incidentId:'A4' as const,id:910000+i,type:types[i],distance,
   speed:0,group:-40,stationary:true,stopLane:lane,
   stopSide:lane<lanes.length/2?-1:1,stopYaw,
  };
 });
}
