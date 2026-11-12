import {describe,it,expect} from 'vitest';
import {RaceTrafficWorld,breakdownLaneLateral,coastRaceCruise,trafficDriverStyle,TRAFFIC_DRIVER_PROFILES,type TrafficDriverStyle} from '../src/race-traffic-world';
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
 it('recovers full-course moving and broken traffic without inventing a new clock',()=>{
  const original=world();
  for(let time=.1;time<=6;time+=.1)original.advance(time);
  const saved=original.snapshot();
  const restored=world();restored.restore(saved);
  expect(restored.inspect()).toEqual(original.inspect());
  expect(restored.snapshot().cars).toEqual(saved.cars);
  restored.advance(saved.time+.25);
  expect(restored.get(1)!.distance).toBeGreaterThan(saved.cars.find(car=>car.id===1)!.distance);
  expect(restored.get(2)!.stationary).toBe(true);
 });

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

describe('Racing R0.2h continuous coast traffic',()=>{
 it('uses world-distance arcade pace for a traffic average near 200 indicated km/h',()=>{
  const speeds=Array.from({length:1200},(_,id)=>coastRaceCruise(804,id,id%4)*3.6/1.5);
  const average=speeds.reduce((sum,s)=>sum+s,0)/speeds.length;
  expect(average).toBeGreaterThan(185);
  expect(average).toBeLessThan(220);
  expect(speeds.some(speed=>speed<175)).toBe(true);
  expect(speeds.some(speed=>speed>240)).toBe(true);
 });
 it('adds deterministic arrivals from the road start while a player remains nearby',()=>{
  const player={id:-9999,distance:350,lateral:0,speed:0,width:2.3,length:4.9};
  const worldA=new RaceTrafficWorld(fixture,42,10000,()=>8.75,dims,true);
  const worldB=new RaceTrafficWorld(fixture,42,10000,()=>8.75,dims,true);
  worldA.advance(45,[],player);worldB.advance(45,[],player);
  expect(worldA.cars.length).toBeGreaterThan(fixture.length+4);
  expect(worldA.cars.length).toBeLessThan(240);
  expect(worldA.cars.some(car=>car.id>=2000000)).toBe(true);
  expect(worldA.inspect()).toEqual(worldB.inspect());
  // Once the last racer has cleared the entry corridor no new road traffic is necessary.
  const count=worldA.cars.length;
  worldA.advance(46,[],{...player,distance:2500});
  worldA.advance(70,[],{...player,distance:2500});
  expect(worldA.cars.length).toBe(count);
 });
 it('can initiate a reversible blocked-lane maneuver without teleporting',()=>{
  const cars=roadLaneCenters(8.75).map((x,id)=>({
   id:id+100,type:0,distance:560,speed:0,group:-1,stationary:true,stopLane:id,
  }));
  const follower={id:50,type:0,distance:544,speed:0,group:1,member:0};
  const w=new RaceTrafficWorld([...cars,follower],23,10000,()=>8.75,dims,true);
  w.adopt(50,544,0,0);w.get(50)!.targetLateral=0;
  w.get(50)!.driverStyle='dangerous';w.get(50)!.blockedFor=2.5;
  const p={id:-9999,distance:350,lateral:-7,speed:0,width:2.3,length:4.9};
  w.advance(.12,[],p);
  expect(w.get(50)!.reverseLeft).toBeGreaterThan(0);
  const before=w.get(50)!.distance;
  w.advance(.5,[],p);
  expect(w.get(50)!.distance).toBeLessThan(before);
  expect(w.get(50)!.targetLateral).not.toBe(0);
 });
});

describe('Racing R0.2i traffic driver personalities and early overtakes',()=>{
 it('assigns deterministic stable personalities with meaningfully different cruising speeds',()=>{
  const styles=Array.from({length:1500},(_,id)=>trafficDriverStyle(804,id));
  expect(new Set(styles)).toEqual(new Set(['safe','normal','dangerous']));
  expect(styles.map((style,id)=>style===trafficDriverStyle(804,id)).every(Boolean)).toBe(true);
  const count=(style:TrafficDriverStyle)=>styles.filter(s=>s===style).length;
  expect(count('safe')).toBeGreaterThan(260);
  expect(count('normal')).toBeGreaterThan(650);
  expect(count('dangerous')).toBeGreaterThan(260);
  const avg=(style:TrafficDriverStyle)=>{
   const ids=styles.flatMap((s,id)=>s===style?[id]:[]);
   return ids.reduce((total,id)=>total+coastRaceCruise(804,id,id%4)*3.6/1.5,0)/ids.length;
  };
  expect(avg('safe')).toBeLessThan(avg('normal'));
  expect(avg('normal')).toBeLessThan(avg('dangerous'));
  expect(TRAFFIC_DRIVER_PROFILES.dangerous.lookAhead).toBeGreaterThan(TRAFFIC_DRIVER_PROFILES.safe.lookAhead);
 });
 const approaching=(style:TrafficDriverStyle,neighbors=false)=>{
  const recipes=[
   {id:100,type:0,distance:640,speed:0,group:0,stationary:true,stopLane:2},
   {id:101,type:0,distance:500,speed:70,group:1,member:0},
   ...(neighbors?[
    {id:102,type:0,distance:550,speed:0,group:0,stationary:true,stopLane:1},
    {id:103,type:0,distance:550,speed:0,group:0,stationary:true,stopLane:3},
   ]:[]),
  ];
  const w=new RaceTrafficWorld(recipes,42,10000,()=>8.75,dims,true);
  const follower=w.get(101)!;follower.driverStyle=style;w.adopt(101,500,70,0);
  follower.cruiseSpeed=70;follower.targetSpeed=70;
  w.advance(.1,[],{id:-99,distance:350,speed:0,lateral:-7,width:2.3,length:4.9});
  return follower;
 };
 it('normal and dangerous drivers seek a faster lane well before contact',()=>{
  const safe=approaching('safe'),normal=approaching('normal'),dangerous=approaching('dangerous');
  expect(safe.targetLateral).toBe(0);
  expect(normal.targetLateral).not.toBe(0);
  expect(dangerous.targetLateral).not.toBe(0);
  expect(normal.distance).toBeLessThan(570);
  expect(normal.laneChanges).toBe(1);
  expect(dangerous.laneChanges).toBe(1);
 });
 it('does not trade a blocked lane for an even shorter gap',()=>{
  const normal=approaching('normal',true),dangerous=approaching('dangerous',true);
  expect(normal.targetLateral).toBe(0);
  expect(dangerous.targetLateral).toBe(0);
  expect(normal.laneChanges).toBe(0);
  expect(dangerous.laneChanges).toBe(0);
 });
 it('safe drivers wait longer to reverse than impatient aggressive drivers',()=>{
  expect(TRAFFIC_DRIVER_PROFILES.safe.reverseAfter).toBeGreaterThan(TRAFFIC_DRIVER_PROFILES.normal.reverseAfter);
  expect(TRAFFIC_DRIVER_PROFILES.normal.reverseAfter).toBeGreaterThan(TRAFFIC_DRIVER_PROFILES.dangerous.reverseAfter);
 });
});


describe('R5b.2 authoritative movable accident',()=>{
 const wreck={id:910000,type:0,distance:4635,speed:0,group:-40,
  stationary:true,stopLane:4,stopSide:1,stopYaw:.13,stopOffset:-.12,incidentId:'A4' as const};
 const world=()=>new RaceTrafficWorld([wreck],42,10350,()=>8.75,dims,true,false);
 it('moves an impacted wreck without letting the race AI drive it away',()=>{
  const a=world(),before=a.get(wreck.id)!;
  const original={distance:before.distance,yaw:before.stopYaw,lateral:before.lateral};
  expect(a.bumpIncident(wreck.id,80,-1)).toBe(true);
  expect(a.bumpIncident(wreck.id,80,-1)).toBe(false);
  a.advance(.3);
  const after=a.get(wreck.id)!;
  expect(after.distance).toBeGreaterThan(original.distance+.1);
  expect(after.stopYaw).not.toEqual(original.yaw);
  expect(after.lateral).not.toEqual(original.lateral);
  expect(after.stationary).toBe(true);
  expect(after.incidentMotion?.hits).toBe(1);
  const saved=a.snapshot(),restored=world();restored.restore(saved);
  a.advance(1);restored.advance(1);
  expect(restored.get(wreck.id)).toEqual(a.get(wreck.id));
 });
 it('does not fake physical motion on an unrelated stopped car',()=>{
  const ordinary={...wreck,id:999,incidentId:undefined,stopYaw:0};
  const a=new RaceTrafficWorld([ordinary],42,10350,()=>8.75,dims,true,false);
  expect(a.bumpIncident(999,80,1)).toBe(false);
  a.advance(.3);expect(a.get(999)?.distance).toBe(4635);
 });
});
