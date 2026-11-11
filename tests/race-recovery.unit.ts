import {describe,it,expect} from 'vitest';
import {CHECKPOINT_MAX_AGE_MS,RACE_CHECKPOINT_KEY,clearRaceCheckpoint,readRaceCheckpoint,saveRaceCheckpoint,type RaceCheckpointData} from '../src/race-recovery';
import {createState} from '../src/handling';

function memoryStore(){
 const m=new Map<string,string>();
 return {
  getItem:(k:string)=>m.get(k)??null,
  setItem:(k:string,v:string)=>{m.set(k,v);},
  removeItem:(k:string)=>{m.delete(k);},
 };
}
function stub():RaceCheckpointData{
 return {stage:'coast',elapsed:84,trafficSessionVariation:42,
  player:{...createState(),distance:4800,speed:62},
  race:{time:84,playerFinish:null,rivals:Array.from({length:7},(_,i)=>({id:'RIVAL '+(i+1)}))} as RaceCheckpointData['race'],
  traffic:{time:84,trafficSeed:42,world:{cars:[]}} as RaceCheckpointData['traffic'],
  cones:null,triangles:null,stats:{speedMetres:300,peak:82,collisions:2},rivalPassCount:3};
}
describe('race interruption recovery storage',()=>{
 it('survives reload with lap, rank, traffic seed and time',()=>{
  const s=memoryStore();
  expect(saveRaceCheckpoint(stub(),'build-a',s,1000)).toBe(true);
  expect(readRaceCheckpoint('build-a',s,1500)).toMatchObject({
   elapsed:84,trafficSessionVariation:42,player:{distance:4800,speed:62},
   race:{time:84},rivalPassCount:3,stats:{collisions:2}});
 });
 it('rejects stale and incompatible checkpoints',()=>{
  const s=memoryStore();
  saveRaceCheckpoint(stub(),'build-a',s,1000);
  expect(readRaceCheckpoint('build-b',s,1001)).toBeNull();
  expect(s.getItem(RACE_CHECKPOINT_KEY)).toBeNull();
  saveRaceCheckpoint(stub(),'build-a',s,1000);
  expect(readRaceCheckpoint('build-a',s,1000+CHECKPOINT_MAX_AGE_MS)).toBeNull();
  clearRaceCheckpoint(s);
  expect(s.getItem(RACE_CHECKPOINT_KEY)).toBeNull();
 });
 it('ignores corrupt checkpoint bytes and schema',()=>{
  const s=memoryStore();s.setItem(RACE_CHECKPOINT_KEY,'{not-json');
  expect(readRaceCheckpoint('build-a',s,1000)).toBeNull();
  s.setItem(RACE_CHECKPOINT_KEY,JSON.stringify({schema:1,version:'build-a',stage:'coast',savedAt:1000,elapsed:22}));
  expect(readRaceCheckpoint('build-a',s,1000)).toBeNull();
 });
});
