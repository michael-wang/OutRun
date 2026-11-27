import {describe,expect,it} from 'vitest';
import {advanceCheckpoints,checkpointRace,gates} from '../src/city/checkpoint-race.mjs';
import {CityTraffic,cityVehicleSize,rivalStart} from '../src/city/city-traffic.mjs';

const rivals=(a:number,b:number)=>[a,b].map((d,id)=>({id,from:d,to:d}));
describe('City race clock',()=>{
 it('seeds each bookmark in its own remaining sector',()=>{
  expect(checkpointRace().deadline).toBe(26);
  expect(checkpointRace(1035)).toMatchObject({next:1,deadline:38,awards:0});
  expect(checkpointRace(3009)).toMatchObject({next:1,deadline:8});
  expect(checkpointRace(6620)).toMatchObject({next:4,deadline:11});
 });
 it('uses the crossing time within the frame, including an exact tie',()=>{
  for(const late of [0,.002]){
   const s=checkpointRace();
   const e=advanceCheckpoints(s,1034,1036,25.98+late,26.02+late,rivals(1037,1040));
   expect(e.kind).toBe(late?'timeout':'gate');expect(e.time).toBeCloseTo(26);
   if(!late)expect(s.deadline).toBe(64);
  }
 });
 it('never credits a gate after an expired run',()=>{
  const s=checkpointRace();
  expect(advanceCheckpoints(s,1000,1034,25.98,26,rivals(0,0)).kind).toBe('timeout');
  expect(advanceCheckpoints(s,1034,1036,26,26.03,rivals(0,0))).toBeUndefined();
  expect(s.events).toHaveLength(0);expect(s.awards).toBe(0);
 });
 it('interpolates the two rivals independently, caps carry, and pays each only once',()=>{
  const s=checkpointRace();
  const e=advanceCheckpoints(s,1034,1036,17,19,[{id:0,from:1032,to:1036},{id:1,from:1034,to:1036}]);
  expect(e).toMatchObject({bonus:2,rank:2});expect(s.deadline).toBe(18+6+38+2);
  expect(advanceCheckpoints(s,1033,1036,20,21,rivals(0,0))).toBeUndefined();
  expect(advanceCheckpoints(s,3009,3011,49,51,rivals(0,0))).toMatchObject({bonus:2,rank:1});
  const third=advanceCheckpoints(s,4639,4641,78,80,rivals(0,0));
  expect(third.bonus).toBe(0);expect(s.awards).toBe(4);
 });
 it('records finish rank without paying a duplicate bonus or awarding a tied position',()=>{
  for(const rank of [1,2,3]){
   const s=checkpointRace(6600);
   const others=[7100,7100];for(let i=0;i<rank-1;i++)others[i]=7110;
   const finish=gates.at(-1).at;
   expect(advanceCheckpoints(s,finish-1,finish+1,8,9,rivals(others[0],others[1]))).toMatchObject({kind:'finish',rank,bonus:0});
   expect(advanceCheckpoints(s,7108,7112,9,10,rivals(0,0))).toBeUndefined();
  }
 });
});
describe('City service fleet',()=>{
 it('uses long-body collision envelopes and civilian speed classes',()=>{
  const traffic=new CityTraffic(5390),services=traffic.actors.filter((c:any)=>[2,3].includes(c.type));
  expect(services.filter((c:any)=>c.type===2)).toHaveLength(4);
  expect(services.filter((c:any)=>c.type===3)).toHaveLength(2);
  for(const c of services){const box=cityVehicleSize(c.type);expect(c.width).toBe(box.width);expect(c.length).toBe(box.length);expect(c.id).toBeLessThan(rivalStart);expect(c.cruiseSpeed).toBe(c.type===3?53:24);}
  const bus=services.find((c:any)=>c.type===2);
  for(const c of traffic.actors)c.finished=c.id!==bus.id;
  const p={d:bus.distance-6.7,oldD:bus.distance-8.3,x:bus.lateral,oldX:bus.lateral,speed:60,vel:0,kick:0};
  expect(traffic.step(1/60,p)).toMatchObject({b:bus.id,kind:'rear'});
 });
});
