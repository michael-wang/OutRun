import {describe,it,expect} from 'vitest';
import {RaceTrafficWorld,breakdownLaneLateral} from '../src/race-traffic-world';
import {roadLaneCenters} from '../src/traffic-flow';
import {rearImpactResponse} from '../src/arcade-contact';
import {TrafficImpact} from '../src/traffic-impact';
import {createState} from '../src/handling';

const dims=()=>({width:2.2,length:4.9});
const fixture=[
 {id:1,type:0,distance:1200,speed:45,group:1,member:0},
 {id:2,type:0,distance:1440,speed:0,group:-1,stationary:true,stopSide:-1,stopLane:1},
 {id:3,type:0,distance:1710,speed:30,group:2,member:1},
 {id:4,type:0,distance:1810,speed:55,group:2,member:2},
];
const world=()=>new RaceTrafficWorld(fixture,42,10000,()=>8.75,dims);
describe('whole-course traffic authority',()=>{
 it('retains each finite traffic state when the player changes position or camera focus',()=>{
  const w=world();
  const ids=w.cars.map(c=>c.id);
  expect(w.inspect().total).toBe(4);
  expect(w.obstacles(1400,500).map(c=>c.id)).toEqual(ids);
  const remote={id:777,distance:1900,speed:70,lateral:7,width:2.3,length:4.9};
  const player={id:888,distance:350,speed:30,lateral:-7,width:2.3,length:4.9};
  for(let step=1;step<=100;step++)w.advance(step*.1,[remote],player);
  const at10=w.cars.map(c=>({...c}));
  expect(w.inspect().total).toBe(4);
  expect(w.obstacles(1400,400).some(c=>c.id===2)).toBe(true);
  player.distance=7000;remote.distance=7500;
  w.advance(11,[remote],player);
  expect(w.inspect().total).toBe(4);
  expect(w.get(1)!.distance).toBeGreaterThanOrEqual(at10.find(c=>c.id===1)!.distance);
  expect(w.get(2)?.stationary).toBe(true);
  expect(w.get(2)?.speed).toBe(0);
 });
 it('is seed-deterministic without needing an active mesh or nearby player',()=>{
  const first=world(),second=world();
  for(let time=.1;time<=6;time+=.1){first.advance(time,[],{id:77,distance:350,speed:0,lateral:0,width:2.3,length:4.9});second.advance(time,[],{id:77,distance:350,speed:0,lateral:0,width:2.3,length:4.9});}
  expect(first.inspect()).toEqual(second.inspect());
 });
 it('never lets a moving lane follower pass through a stopped car',()=>{
  const stopped=[{id:21,type:0,distance:1250,speed:0,group:0,stationary:true,stopLane:2,stopSide:1}];
  const moving=[{id:22,type:0,distance:1140,speed:45,group:1,member:0}];
  const w=new RaceTrafficWorld([...stopped,...moving],40,5000,()=>8.75,dims);
  const lane=breakdownLaneLateral(2,1,8.75);
  w.adopt(22,1140,45,lane);w.get(21)!.lateral=lane;w.get(21)!.targetLateral=lane;
  for(let i=1;i<130;i++)w.advance(i*.1);
  const a=w.get(22)!,b=w.get(21)!;
  expect(a.distance).toBeGreaterThan(1140);
  if(Math.abs(a.lateral-b.lateral)<(a.width+b.width)/2+.16)
   expect(a.distance+a.length/2+b.length/2).toBeLessThanOrEqual(b.distance+.01);
 });
 it('retains a persistent collision impulse for a remote moving vehicle',()=>{
  const w=world(),before={...w.get(1)!};
  w.forceContact(1,.72,7);
  w.advance(.4);
  const after=w.get(1)!;
  expect(after.speed).toBeLessThan(before.speed);
  expect(after.lateral).not.toBeCloseTo(before.lateral,1);
  expect(after.sideVelocity).toBeGreaterThan(0);
 });
 it('places stopped vehicles in center and outside lanes',()=>{
  const centers=roadLaneCenters(8.75);
  expect(centers).toHaveLength(5);
  for(let i=0;i<5;i++)expect(breakdownLaneLateral(i,1,8.75)).toBe(centers[i]);
 });
});
describe('arcade rear impact momentum and sideslip',()=>{
 it('costs the leading car more speed and gives it more lateral impulse',()=>{
  for(const strength of [.15,.5,1]){
   const effect=rearImpactResponse(strength);
   expect(effect.trailingSpeedMultiplier).toBeGreaterThan(effect.leadingSpeedMultiplier);
   expect(effect.trailingSideSpeed).toBeGreaterThan(0);
   expect(effect.leadingSideSpeed).toBeGreaterThan(effect.trailingSideSpeed);
  }
 });
 it('charges the player based on being rear or leading, not on identity',()=>{
  const rear=createState(),front=createState();rear.speed=front.speed=60;
  const event={actorId:99,type:0,kind:'rear' as const,side:1,distance:600,lateral:0,severity:.8};
  const rearImpact=new TrafficImpact(),frontImpact=new TrafficImpact();
  rearImpact.kick(rear,{...event,playerIsTrailing:true});
  frontImpact.kick(front,{...event,playerIsTrailing:false});
  expect(rear.speed).toBeGreaterThan(front.speed);
  expect(Math.abs(frontImpact.velocity)).toBeGreaterThan(Math.abs(rearImpact.velocity));
  expect(rear.speed).toBeGreaterThan(45);
 });
});
