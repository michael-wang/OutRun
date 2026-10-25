import { expect, it } from 'vitest';
import { createState,step } from './handling';
import { createTrack } from './track';
import { EngineSound } from './sound';
import { plannedSpeed,scriptedDriver } from '../tests/driver';
import {COURSE} from './challenges';
it('real world distance scales with speed; audio follows speed and throttle',()=>{
 const distances:number[]=[],notes:number[]=[];const sound=new EngineSound();
 for(const speed of [16.67,33.33,60]){
  const s={...createState(),speed};let integrated=0;
  for(let i=0;i<120;i++){step(s,{gas:false,brake:false,steer:0},1/120,0);integrated+=s.speed/120;}
  expect(s.distance).toBeCloseTo(integrated,10);distances.push(s.distance);
  sound.update(speed,0,true);notes.push(sound.inspect().engineHz);
 }
 expect(distances[2]/distances[0]).toBeGreaterThan(3.5);expect(notes[2]).toBeGreaterThan(notes[1]);expect(notes[1]).toBeGreaterThan(notes[0]);
 sound.update(60,0,false);expect(sound.inspect().engineHz).toBeLessThan(notes[2]);
 for(let i=0;i<20;i++)sound.update(60,.8,true);expect(sound.inspect().skidLevel).toBeGreaterThan(0);sound.pause();expect(sound.inspect().windLevel).toBe(0);
});
it('Extreme then S sequence rewards braking with a clean exit',()=>{
 const track=createTrack(),results=[],start=COURSE.find(c=>c.id==='extreme')!.start-150,end=COURSE.find(c=>c.id==='s-right')!.end;
 for(const careful of [false,true]){
  const s={...createState(),distance:start,speed:65},driver=scriptedDriver();let off=0,brakes=0,time=0,maxStep=0;
  while(s.distance<end&&time<80){
   const input=driver({...s,highSpeedPace:1.75} as typeof s,track.sample(s.distance).curvature,plannedSpeed(s.distance,track.sample,1.75));
   if(!careful){input.gas=true;input.brake=false;input.steer=0;}brakes+=Number(input.brake);
   for(let j=0;j<12;j++){const before=track.sample(s.distance).position;step(s,input,1/120,track.sample(s.distance).curvature,1.75);maxStep=Math.max(maxStep,track.sample(s.distance).position.distanceTo(before));}
   time+=.1;off+=Number(s.offRoad);
  }
  results.push({off,brakes,time,speed:s.speed});expect(maxStep).toBeLessThan(1.1);
 }
 expect(results[0].off).toBeGreaterThan(0);expect(results[1].off).toBe(0);expect(results[1].brakes).toBeGreaterThan(0);expect(results[1].speed).toBeGreaterThan(results[0].speed);
 const samples=Array.from({length:700},(_,i)=>track.sample(start+(end-start)*i/700));
 expect(Math.min(...samples.map(s=>s.curvature))).toBeLessThan(-.0005);expect(Math.max(...samples.map(s=>s.curvature))).toBeGreaterThan(.002);
 expect(Math.max(...samples.map(s=>s.position.y))-Math.min(...samples.map(s=>s.position.y))).toBeGreaterThan(10);
});
