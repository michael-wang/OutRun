import {it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {createState,step} from '../src/handling';
import {createTrack,ROAD_BEATS,RHYTHM_LENGTH} from '../src/track';
import {scriptedDriver,plannedSpeed} from './driver';
it('complete rhythm cycle rewards a planned digital line over gas only',()=>{
 const track=createTrack(),runs=[];
 for(const careful of [false,true]){
  const s={...createState(),speed:65,highSpeedPace:1.75},driver=scriptedDriver();let off=0,time=0,maxSlip=0;const trace=[];
  while(s.distance<RHYTHM_LENGTH&&time<240){
   const input=careful?driver(s,track.sample(s.distance).curvature,plannedSpeed(s.distance,track.sample,1.75)):{gas:true,brake:false,steer:0};
   for(let j=0;j<12;j++)step(s,input,1/120,track.sample(s.distance).curvature,1.75);
   time+=.1;off+=Number(s.offRoad);maxSlip=Math.max(maxSlip,Math.abs(s.slipAngle));trace.push({...s,input,time});
  }
  runs.push({careful,time,off,maxSlip,trace});expect(s.distance).toBeGreaterThanOrEqual(RHYTHM_LENGTH);
 }
 writeFileSync('docs/evidence/v0.4/rhythm-unit.json',JSON.stringify({beats:ROAD_BEATS.map(b=>({...b,nominalSeconds:b.length/113.75})),runs},null,2));
 expect(runs[1].off).toBe(0);expect(runs[1].time).toBeLessThan(runs[0].time);
 const end=track.sample(track.length-.001),start=track.sample(0);expect(end.position.distanceTo(start.position)).toBeLessThan(.01);
});

