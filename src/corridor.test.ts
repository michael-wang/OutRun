import { expect, it } from 'vitest';
import { CORRIDOR_LIMIT, createState, step } from './handling';
import { createTrack } from './track';
import { scriptedDriver } from '../tests/driver';
const track = createTrack();
for (const side of [-1, 1]) {
  for (const distance of [240,740]) {
    it(`boundary ${side}, bend ${distance}: holds without spinning; inward steering recovers`, () => {
      const s = {...createState(), distance, speed:55};
      let contacted=false, previous=s.lateral, lastDistance=s.distance, contactYaw=0;
      for(let i=0;i<18*120;i++) {
        step(s,{gas:true,brake:false,steer:side},1/120,track.sample(s.distance).curvature);
        expect(Math.abs(s.lateral)).toBeLessThanOrEqual(CORRIDOR_LIMIT);
        expect(Math.abs(s.lateral-previous)).toBeLessThan(.55);
        if(contacted){expect(s.lateral).toBe(side*CORRIDOR_LIMIT);expect(s.distance).toBeGreaterThan(lastDistance);expect(s.offRoad).toBe(true);expect(Math.abs(s.heading)).toBeLessThanOrEqual(.28);}
        if(!contacted&&s.corridorSide===side){contacted=true;contactYaw=s.worldHeading;}
        previous=s.lateral;lastDistance=s.distance;
      }
      expect(contacted).toBe(true);expect(s.distance).toBeGreaterThan(distance+100);expect(s.speed).toBeLessThan(35);
      for(let i=0;i<240;i++) step(s,{gas:true,brake:false,steer:0},1/120,track.sample(s.distance).curvature);
      expect(s.lateral).toBe(side*CORRIDOR_LIMIT);expect(s.offRoad).toBe(true);expect(Math.abs(s.heading)).toBeLessThanOrEqual(.28);
      const driver=scriptedDriver();let recoveredAt=Infinity;
      for(let i=0;i<80;i++) {const input=s.corridorSide?{gas:true,brake:false,steer:-s.corridorSide}:driver(s,track.sample(s.distance).curvature);for(let j=0;j<12;j++) step(s,input,1/120,track.sample(s.distance).curvature);if(!s.offRoad){recoveredAt=i/10;break;}}
      console.log({side,distance,recoveredAt});expect(recoveredAt).toBeLessThan(6);
    });
  }
}
