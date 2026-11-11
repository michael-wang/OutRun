import {describe,it,expect} from 'vitest';
import {RaceStartSignals,raceStartSignal,type RaceStartSignal} from '../src/race-start-signals';

describe('three-light arcade race countdown',()=>{
 it('maps simulated remaining time to 3, 2, 1, GO',()=>{
  expect([3,2.01,2,1.01,1,.01,0].map(raceStartSignal))
   .toEqual([3,3,2,2,1,1,'GO']);
 });
 it('plays each cue only once despite 120 Hz simulation updates',()=>{
  const gate=new RaceStartSignals(),events:RaceStartSignal[]=[];
  for(let t=3;t>=0;t-=1/120)gate.advance(t,cue=>(events.push(cue),true));
  gate.advance(0,cue=>(events.push(cue),true));
  expect(events).toEqual([3,2,1,'GO']);
 });
 it('retries an initially locked audio context and resets on replay',()=>{
  const gate=new RaceStartSignals(),events:RaceStartSignal[]=[];
  gate.advance(3,()=>false);
  expect(gate.current).toBeNull();
  gate.advance(2.95,cue=>(events.push(cue),true));
  gate.advance(2.94,cue=>(events.push(cue),true));
  gate.reset();
  gate.advance(3,cue=>(events.push(cue),true));
  expect(events).toEqual([3,3]);
 });
});
