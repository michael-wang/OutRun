import {roadLaneCenters} from '../traffic-flow';
import {trafficRandom} from '../traffic-lanes';
import type {Breakdown} from '../breakdowns';
import type {CoastAccident} from './coast-onboarding';

/** Real parked cars, consumed by Traffic's collision and render authority. */
export interface AccidentVehicle extends Breakdown{
 incidentId:'A4';stopYaw:number;stopOffset?:number;
}
export function coastAccidentLayout(
 halfAt:(distance:number)=>number,site:CoastAccident,seed:number,
):AccidentVehicle[]{
 const lanes=roadLaneCenters(halfAt(site.distance));
 if(lanes.length<4||site.minimumOpenLanes>lanes.length-2)
  throw Error('First-map incident requires an open passing corridor');
 const tutorial=site.layout==='right-lane';
 // Teach the concept with two staggered cars entirely in the RIGHT-most
 // lane. Later encounters may seed 2–3 cars across other lanes.
 const count=tutorial?2:Math.min(lanes.length-site.minimumOpenLanes,
  trafficRandom(seed^0xa41,71)<.5?2:3);
 // Later events may put a seeded group on either side of the highway.
 // Occupy adjacent lanes with one coherent wreck scene, leaving a real
 // two-lane escape corridor instead of random all-lane scatter.
 const start=tutorial?lanes.length-1:
  Math.floor(trafficRandom(seed^0xa45,18)*(lanes.length-count+1));
 const indices=Array.from({length:count},(_,i)=>tutorial?lanes.length-1:start+i);
 const offsets=tutorial?[-18,23]:[-16,14,39];
 const types=tutorial?[0,0]:[0,2,0];
 return indices.map((lane,i)=>{
  const distance=site.distance+offsets[i]+(trafficRandom(seed^0xa42,i)-.5)*5;
  const stopYaw=(i%2===0?1:-1)*(.09+.07*trafficRandom(seed^0xa43,i));
  return {
   incidentId:'A4' as const,id:910000+i,type:types[i],distance,
   speed:0,group:-40,stationary:true,stopLane:lane,
   stopSide:lane<lanes.length/2?-1:1,
   stopYaw,stopOffset:tutorial?(i===0?-.12:.10):0,
  };
 });
}
