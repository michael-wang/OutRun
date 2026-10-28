import { createTrack } from '../src/track.ts';
import { createState,step } from '../src/handling.ts';
import { plannedSpeed,scriptedDriver } from '../tests/driver.ts';
import { writeFileSync } from 'node:fs';
const track=createTrack(),runs=[];
for(const careful of [false,true]){
 const state={...createState(),distance:1500,speed:65},driver=scriptedDriver(),trace=[];
 let seconds=0;
 while(state.distance<2300&&seconds<40){
  const input=driver(state,track.sample(state.distance).curvature,plannedSpeed(state.distance,track.sample));
  if(!careful){input.gas=true;input.brake=false;}
  for(let j=0;j<12;j++)step(state,input,1/120,track.sample(state.distance).curvature);
  seconds+=.1;trace.push({seconds,...state,input});
 }
 runs.push({careful,seconds,exitSpeed:state.speed,offRoadSeconds:trace.filter(s=>s.offRoad).length*.1,brakeSeconds:trace.filter(s=>s.input.brake).length*.1,trace});
}
// A separate, more practiced test line anticipates tire slip and brakes later.
// Both comparisons use the same steering policy; only gas/brake policy differs.
const expertRuns=[];
for(const careful of [false,true]){
 const state={...createState(),distance:1500,speed:65},trace=[];let seconds=0,pulse=0;
 while(state.distance<2500&&seconds<40){
  const k=track.sample(state.distance).curvature,grip=9-5.5*Math.max(0,Math.min(1,(state.speed-25)/35));
  const desired=Math.max(-1,Math.min(1,(k*state.speed*(1+2/grip)-2*state.heading-.1*state.lateral)/Math.max(.1,Math.min(.6,state.speed*.035))));
  pulse+=Math.abs(desired);const steer=pulse>=.5?Math.sign(desired):0;if(steer)pulse-=1;
  const target=Math.min(65,...[0,15,30,45,60,90].map(d=>Math.sqrt((.55/Math.max(.001,Math.abs(track.sample(state.distance+d).curvature)))**2+2*26*d)));
  const input={steer,gas:careful?state.speed<target:true,brake:careful&&state.speed>target+3};
  for(let j=0;j<12;j++)step(state,input,1/120,track.sample(state.distance).curvature);
  seconds+=.1;trace.push({seconds,...state,input});
 }
 expertRuns.push({careful,seconds,exitSpeed:state.speed,offRoadSeconds:trace.filter(s=>s.offRoad).length*.1,trace});
}
if(expertRuns[1].offRoadSeconds!==0||expertRuns[1].seconds>=expertRuns[0].seconds)throw new Error('Clean braking line did not outperform full throttle');
const profile=Array.from({length:Math.ceil(track.length/5)},(_,i)=>{const s=track.sample(i*5);return {distance:i*5,height:s.position.y,curvature:s.curvature,grade:s.tangent.y};});
writeFileSync('docs/evidence/v0.3/road-challenge.json',JSON.stringify({length:track.length,runs,expertRuns,profile},null,2));
console.log(runs.map(({trace,...summary})=>summary));
console.log(expertRuns.map(({trace,...summary})=>summary));
