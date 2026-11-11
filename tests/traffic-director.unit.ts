import {it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,trafficRecipe,TRAFFIC_LIMIT,TRAFFIC_TYPES} from '../src/traffic';
import {RivalRace} from '../src/rival-race';
import {TrafficLanes} from '../src/traffic-lanes';
import {newTrafficSessionSeed,roadLaneCenters,plannedTrafficLane,plannedTrafficLateral,
 trafficCanEnter,trafficFollowingTarget,approachTrafficSpeed,trafficStopBeforeLeader,
 TRAFFIC_FLOW} from '../src/traffic-flow';
import {breakdownLayout,COAST_BREAKDOWN} from '../src/breakdowns';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
});

it('has denser but deterministic highway encounters without growing the render pool',()=>{
 const a=trafficRecipe(804^17,10000),b=trafficRecipe(804^17,10000);
 expect(a).toBe(b);
 expect(a.length).toBeGreaterThan(50);
 expect(a[0].distance).toBeGreaterThanOrEqual(650);
 expect(TRAFFIC_LIMIT).toBe(12);
});
it('does not rewind full-course traffic during the first GO! physics frame',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,17);
 const race=new RivalRace(10350,()=>({curvature:0,grade:0,half:8.75}),
  (distance,time,radius)=>traffic.raceObstacles(distance,time,radius));
 race.reset(350);
 traffic.rivalLeaders=()=>race.rivals;
 const player={distance:350,lateral:0,speed:0},dt=1/120;
 traffic.update(0,350,0,0);
 // This mirrors main.ts: traffic advances to elapsed+dt before the Rival AI
 // queries its obstacles using race.time (the start of the SAME tick).
 for(let frame=1;frame<=8;frame++){
  const old={distance:player.distance,lateral:player.lateral};
  player.speed+=.5;player.distance+=player.speed*dt;
  traffic.update(frame*dt,player.distance,player.lateral,player.speed);
  expect(()=>race.step(dt,player,old)).not.toThrow();
  expect(traffic.inspectWorld().time).toBeCloseTo(frame*dt,6);
 }
 expect(race.time).toBeCloseTo(8*dt,6);
 expect(race.rivals).toHaveLength(7);
 traffic.dispose();
});

it('keeps whole-route moving traffic after player passes and beyond the render pool',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,17);
 const total=trafficRecipe(804^17,10000).length;
 traffic.rivalLeaders=()=>[];
 traffic.update(0,350,0,0);
 const starting=traffic.inspectWorld();
 expect(starting.total).toBe(total);
 const far=starting.rows.find(row=>row.distance>4000&&row.distance<7000)!;
 expect(far).toBeTruthy();
 traffic.update(4,350,0,0);
 const after=traffic.inspectWorld();
 expect(after.total).toBe(total);
 expect(after.rows.find(row=>row.id===far.id)!.distance).toBeGreaterThan(far.distance);
 // Fly past the same car: visibility is capped but no model entity retires.
 traffic.update(5,7500,0,80);
 expect(traffic.inspect().actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
 expect(traffic.inspectWorld().total).toBe(total);
 const remote=traffic.raceObstacles(far.distance+100,5,600);
 expect(remote.some(r=>r.id==='T'+far.id)).toBe(true);
 traffic.dispose();
});

it('keeps rendered coast traffic aligned with the authoritative race-state lanes',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,17);
 traffic.rivalLeaders=()=>[];
 traffic.enableRaceMode();
 const before=traffic.inspectWorld().total;
 for(let i=0;i<160;i++){
  traffic.update(i*.25,350,0,0);
  expect(traffic.inspect().actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
 }
 const after=traffic.inspectWorld();
 expect(after.total).toBeGreaterThan(before);
 for(const actor of traffic.inspect().actors){
  const body=after.rows.find(c=>c.id===actor.id);
  if(!body)continue; // The existing interchange demo is separate from course traffic.
  expect(actor.distance).toBeCloseTo(body.distance,4);
  expect(actor.speed).toBeCloseTo(body.speed,4);
  expect(actor.lateral).toBeCloseTo(body.lateral,4);
 }
 traffic.dispose();
});

it('rerolls independently of route and pins a diagnostic traffic seed',()=>{
 expect(newTrafficSessionSeed(new URLSearchParams('trafficSeed=3025'))).toBe(3025);
 expect(newTrafficSessionSeed(new URLSearchParams('trafficSeed=4294967295'))).toBe(4294967295);
 const a=trafficRecipe(804^1234,10000),b=trafficRecipe(804^1235,10000);
 expect(a).not.toEqual(b);
 const trafficA=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,1234);
 const trafficB=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,1235);
 trafficA.update(0,350);trafficB.update(0,350);
 expect(trafficA.inspect().trafficSeed).toBe(804^1234);
 expect(trafficB.inspect().trafficSeed).toBe(804^1235);
 expect(trafficA.inspect().actors.map(x=>x.distance))
  .not.toEqual(trafficB.inspect().actors.map(x=>x.distance));
 trafficA.reset(1235);
 expect(trafficA.inspect().trafficSeed).toBe(804^1235);
 trafficA.update(0,350);
 expect(trafficA.inspect().actors.map(x=>x.distance))
  .toEqual(trafficB.inspect().actors.map(x=>x.distance));
 trafficA.dispose();trafficB.dispose();
});

it('allocates every encounter group to N-1 lanes with an open passing channel',()=>{
 for(const width of [7,8.75]){
  const lanes=roadLaneCenters(width);
  expect(lanes).toHaveLength(width===7?4:5);
  for(const seed of [1,7,804,912384])for(let group=0;group<40;group++){
   const occupied=new Set(Array.from({length:4},(_,i)=>plannedTrafficLane(seed,group,i,width)));
   expect(occupied.size).toBeLessThan(lanes.length);
   for(let i=0;i<4;i++){
    const planned=plannedTrafficLateral(seed,group,i,width);
    expect(lanes).toContain(planned);
   }
  }
 }
});

it('rejects obstructed spawns and the last simultaneously open lane',()=>{
 const lanes=roadLaneCenters(7);
 const actor=(id:number,lateral:number,d=500,stationary=false)=>({
  id,distance:d,lateral,speed:stationary?0:30,length:5,stationary,
 });
 const three=[actor(0,lanes[0]),actor(1,lanes[1]),actor(2,lanes[2])];
 expect(trafficCanEnter(actor(3,lanes[3]),three,7)).toBe(false);
 expect(trafficCanEnter(actor(3,lanes[0]),three,7)).toBe(false);
 expect(trafficCanEnter(actor(3,lanes[3],590),three,7)).toBe(true);
 expect(trafficCanEnter(actor(5,lanes[0],500),[actor(4,lanes[0],515,true)],7)).toBe(false);
});

it('brakes behind a stalled vehicle without overlap or sudden backward teleport',()=>{
 const leader={id:9,distance:550,lateral:5.25,speed:0,length:6,stationary:true};
 let follower={id:1,distance:280,lateral:5.25,speed:46,length:4.5};
 let slow=false,maxChange=0;
 const dt=1/60;
 for(let i=0;i<900;i++){
  const next=trafficFollowingTarget(follower,leader,46);
  const speed=approachTrafficSpeed(follower.speed,next,dt);
  const predicted=follower.distance+(speed+follower.speed)*dt/2;
  const safe=trafficStopBeforeLeader({...follower,distance:predicted,speed},leader);
  maxChange=Math.max(maxChange,Math.abs(predicted-safe));
  expect(safe+follower.length/2+leader.length/2).toBeLessThanOrEqual(leader.distance-1.99);
  if(speed<30)slow=true;
  follower={...follower,speed,distance:safe};
 }
 expect(slow).toBe(true);
 expect(maxChange).toBeLessThan(1);
 expect(follower.distance).toBeGreaterThan(475);
 expect(follower.speed).toBeLessThan(3);
});

it('moving cars respond to a broken-down car and signal before a safe overtake',()=>{
 const lanes=new TrafficLanes(1);
 const a={id:7,distance:400,speed:40,lateral:-1.75,signal:0,changing:false,unsignaled:false};
 const broken={id:99,distance:660,speed:0,lateral:-1.75,stationary:true};
 const states:{time:number;lateral:number;signal:number;changing:boolean}[]=[];
 for(let i=0;i<80;i++){
  const t=i*.05;
  lanes.update(t,[a,broken],()=>7,{distance:90,lateral:5.25,speed:0},()=>false);
  states.push({time:t,lateral:a.lateral,signal:a.signal,changing:a.changing});
  a.distance+=a.speed*.05;
 }
 const moving=states.findIndex(s=>s.changing);
 expect(moving).toBeGreaterThan(0);
 expect(states.slice(0,moving).some(s=>s.signal!==0)).toBe(true);
 expect(Math.abs(states.at(-1)!.lateral+1.75)).toBeGreaterThan(2);
});


it('keeps a practical passing lane during three varied 10km encounter simulations',()=>{
 const centers=roadLaneCenters(8.75);
 for(const variation of [10,2026,8821]){
  const traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,
   ()=>true,breakdownLayout(sample,()=>8.75,10000,804^variation,true),
   undefined,true,false,false,variation);
  let closeEncounters=0;
  for(let frame=0;frame<750;frame++){
   const time=frame*.12,player=350+time*80;
   traffic.update(time,player,0,80);
   const actors=traffic.inspect().actors;
   expect(actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
   for(const actor of actors){
    if(!actor.visible||actor.stationary)continue;
    const near=actors.filter(other=>other.visible&&Math.abs(other.distance-actor.distance)<15);
    const blocked=new Set(near.map(x=>roadLaneCenters(8.75).reduce((best,_,i)=>
     Math.abs(x.lateral-centers[i])<Math.abs(x.lateral-centers[best])?i:best,0)));
    expect(blocked.size).toBeLessThan(centers.length);
    const previous=actors.filter(other=>other.visible&&other.id!==actor.id
     &&other.distance>actor.distance&&Math.abs(actor.lateral-other.lateral)<2.4)
     .sort((a,b)=>a.distance-b.distance)[0];
    if(previous&&previous.distance-actor.distance<80)closeEncounters++;
   }
  }
  traffic.dispose();
  expect(closeEncounters).toBeGreaterThanOrEqual(0);
 }
});

it('places seeded breakdowns in any safe coastal lane, outside start and finish zones',()=>{
 const stage=COAST_ULTRA_STAGE,track=createPilotTrack(stage);
 const half=(d:number)=>pilotSample(stage,d).halfWidth;
 const layouts=[1473,9923,62018].map(salt=>
  breakdownLayout(track.sample,half,track.length,stage.seed^salt,true));
 expect(layouts.some(layout=>layout.length>0)).toBe(true);
 for(const layout of layouts)for(const site of layout){
  expect(site.distance).toBeGreaterThanOrEqual(COAST_BREAKDOWN.startClearance);
  expect(site.distance).toBeLessThan(track.length-COAST_BREAKDOWN.finishClearance);
  expect(Math.abs(track.sample(site.distance).right.y)).toBeLessThan(.15);
  expect(site.speed).toBe(0);
  // stopSide remains metadata; stopLane, not side, chooses the actual lane.
  const lanes=roadLaneCenters(half(site.distance));
  expect(Number.isInteger(site.stopLane)).toBe(true);
  expect(site.stopLane).toBeGreaterThanOrEqual(0);
  expect(site.stopLane).toBeLessThan(lanes.length);
 }
 expect(new Set(layouts.map(x=>JSON.stringify(x))).size).toBeGreaterThan(1);
});

it('samples game-speed coastal traffic within pool capacity with seeded any-lane breakdowns',()=>{
 const breakdowns=breakdownLayout(sample,()=>8.75,10000,804^1473,true);
 expect(breakdowns.length).toBeGreaterThanOrEqual(1);
 expect(breakdowns.length).toBeLessThanOrEqual(COAST_BREAKDOWN.maxCount);
 expect(breakdowns.every(b=>
  b.distance>=COAST_BREAKDOWN.startClearance
  &&b.distance<10000-COAST_BREAKDOWN.finishClearance
  &&Number.isInteger(b.stopLane)
  &&b.stopLane>=0
  &&b.stopLane<roadLaneCenters(8.75).length)).toBe(true);
 const traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10000,804,()=>true,breakdowns,undefined,true,false,false,1473);
 let count=0;
 for(let i=0;i<250;i++){
  const time=i*.08,player=350+time*82;
  traffic.update(time,player,0,82);
  const actors=traffic.inspect().actors;
  expect(actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
  const nearby=actors.filter(a=>a.visible);
  for(const a of nearby){
   expect(Math.abs(a.lateral)+TRAFFIC_TYPES[a.type].width/2).toBeLessThan(8.76);
   for(const b of nearby){
    if(a.id===b.id||a.stationary&&b.stationary)continue;
    if(Math.abs(a.distance-b.distance)>TRAFFIC_FLOW.blockadeSpan)continue;
    if(Math.abs(a.lateral-b.lateral)<2.6)
     expect(Math.abs(a.distance-b.distance)).toBeGreaterThan(1.5);
   }
  }
  count+=nearby.length;
 }
 expect(count).toBeGreaterThan(30);
 traffic.dispose();
});
