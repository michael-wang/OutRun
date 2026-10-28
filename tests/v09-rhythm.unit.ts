import {test,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {pilotSample} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';

test('five trips favor four lanes and include wide roads and varied driveable shapes',()=>{
 for(let seed=1;seed<=5;seed++){
  const trip=generateTrip(seed);let four=0,wide=0,narrow=0,curved=0;
  for(let s=0;s<trip.length;s+=25){const x=pilotSample(trip,BRICK_START+s);if(Math.abs(x.lanes-4)<.03)four++;if(x.lanes>=5.99)wide++;if(x.lanes<=3.01)narrow++;if(Math.abs(x.demand)>.08)curved++;}
  const total=Math.ceil(trip.length/25);expect(four/total).toBeGreaterThan(.5);expect(wide/total).toBeGreaterThan(.05);expect(narrow/total).toBeLessThan(.1);expect(curved/total).toBeGreaterThan(.4);
 }
});
