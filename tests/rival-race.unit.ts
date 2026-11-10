import {describe,it,expect} from 'vitest';
import {RivalRace,worldSpeed,crossingTime,raceEntries,equalRiviera,type Obstacle} from '../src/rival-race';
import {createState,step} from '../src/handling';
import {DEFAULT_PACE} from '../src/pace';
import * as THREE from 'three';
import {Traffic,trafficRecipe} from '../src/traffic';
import {plannedTrafficLateral} from '../src/traffic-flow';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';
const flat=()=>({curvature:0,grade:0,half:7});
const parked=()=>({distance:350,lateral:0,speed:0});
const dt=1/120;
function ticks(seconds:number,fn:()=>void){for(let i=0;i<Math.round(seconds/dt);i++)fn();}
describe('Riviera GT race',()=>{
 it('has seven distinct AI cars with the player powertrain and a non-overlapping grid',()=>{
  const race=new RivalRace(10350,()=>({...flat(),half:8.75}),()=>[]);race.reset(350);
  expect(race.rivals).toHaveLength(7);
  expect(new Set(race.rivals.map(r=>r.entry.id)).size).toBe(7);
  expect(race.rivals.every(r=>r.entry.car===equalRiviera)).toBe(true);
  // Player occupies the last grid slot with every opponent safely ahead.
  expect(race.rank(350,null,'PLAYER',{distance:350,lateral:0,speed:0})).toBe(8);
  expect(race.rivals.every(r=>r.distance>=350+12)).toBe(true);
  for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){
   const a=race.rivals[i],b=race.rivals[j];
   expect(Math.abs(a.distance-b.distance)>equalRiviera.length+1||Math.abs(a.lateral-b.lateral)>equalRiviera.width+.2).toBe(true);
  }
 });
 it('orders the full field by finish time, then by progress, with Chinese display names',()=>{
  const race=new RivalRace(3000,flat,()=>[]);race.reset(350);
  expect(race.standings({distance:350,lateral:0,speed:0})).toHaveLength(8);
  expect(race.rivals.map(r=>r.entry.name)).toEqual(['對手一','對手二','對手三','對手四','對手五','對手六','對手七']);
  race.playerFinish=50;
  const r1=race.rivals[0],r2=race.rivals[1];
  r1.finishTime=47;r2.finishTime=49;
  const rows=race.standings({distance:3000,lateral:0,speed:0});
  expect(rows.slice(0,3).map(r=>r.name)).toEqual(['對手一','對手二','玩家']);
  expect(rows.map(r=>r.rank)).toEqual([1,2,3,4,5,6,7,8]);
  expect(rows.slice(3).every(r=>r.finishTime===null)).toBe(true);
 });
 it('calibrates wheel force against the actual player gearbox in three speed bands',()=>{
  for(const [kmh,min,max] of [[10,.97,1.03],[150,.97,1.03],[255,.97,1.03]]){
   const race=new RivalRace(10350,flat,()=>[],[raceEntries[0]]);race.reset(350);
   const p=createState();p.speed=kmh/3.6;
   const r=race.rivals[0];r.speed=p.speed;const v=p.speed;
   ticks(.5,()=>{const old={distance:p.distance,lateral:p.lateral};step(p,{gas:true,brake:false,steer:0},dt,0,DEFAULT_PACE,7);race.step(dt,p,old);});
   const ratio=(r.speed-v)/(p.speed-v);expect(ratio).toBeGreaterThan(min);expect(ratio).toBeLessThan(max);
  }
 });
 it('brakes on approach to a tight bend and clears a stalled or slow car without overlap',()=>{
  for(const speed of [0,10]){
   const p=parked(),hazard:Obstacle={id:'van',speed,lateral:-5.25,distance:530,width:2.2,length:5.5};
   const race=new RivalRace(4000,d=>({...flat(),curvature:d>720&&d<920?.015:0}),(_d,t)=>[{...hazard,distance:530+t*speed}],[raceEntries[0]]);
   race.reset(350);let passed=false,slowed=false,changed=false;
   ticks(35,()=>{race.step(dt,p,p);const r=race.rivals[0],gap=r.distance-(530+race.time*speed);
    if(Math.abs(gap)<5)expect(Math.abs(r.lateral-hazard.lateral)).toBeGreaterThan(2.18);
    if(r.targetLane!==0)changed=true;if(gap>6)passed=true;
    if(r.distance>720&&r.distance<920&&r.targetSpeed<45)slowed=true;
   });expect({passed,slowed,changed}).toEqual({passed:true,slowed:true,changed:true});
  }
 });
 it('charges both cars for contact, constrains penetration and cools the impulse',()=>{
  const race=new RivalRace(10350,flat,()=>[],[raceEntries[0]]);race.reset(350);
  const r=race.rivals[0],p={distance:r.distance-4.91,lateral:r.lateral,speed:35};r.speed=16;
  const old={...p};p.distance+=.38;
  const hit=race.step(dt,p,old);expect(hit?.kind).toBe('rear');expect(p.speed).toBeLessThan(35);expect(r.speed).toBeLessThan(16.1);
  expect(r.distance-p.distance).toBeGreaterThanOrEqual(4.89);
  expect(race.step(dt,p,p)).toBeUndefined();
 });
 it('orders same-tick crossings by fraction, and keeps running after a player finishes',()=>{
  expect(crossingTime(98,102,100,4,.1)).toBe(4.05);
  const p={distance:101,lateral:0,speed:60},race=new RivalRace(100,flat,()=>[],[raceEntries[0],raceEntries[1]]);
  race.reset(30);race.rivals[0].distance=99.9;race.rivals[0].speed=60;
  race.step(.04,p,{distance:99.99,lateral:0});
  expect(race.playerFinish).toBeLessThan(race.rivals[0].finishTime!);
  expect(race.rank(p.distance,race.playerFinish,'PLAYER',p)).toBe(1);
  ticks(12,()=>race.step(dt,p,p));expect(race.rivals.every(r=>r.finishTime!==null)).toBe(true);
 });
 it('safely changes the race order while catching a slower player from behind',()=>{
  const p={distance:410,lateral:-5.25,speed:7},race=new RivalRace(10350,flat,()=>[],[raceEntries[0],raceEntries[1]]);race.reset(350);
  expect(race.rank(p.distance,null,'PLAYER',p)).toBe(1);
  ticks(14,()=>{const old={...p};p.distance+=worldSpeed(p.speed)*dt;race.step(dt,p,old);
   for(const r of race.rivals)if(Math.abs(r.distance-p.distance)<4.8)expect(Math.abs(r.lateral-p.lateral)).toBeGreaterThan(2.15);});
  expect(race.rank(p.distance,null,'PLAYER',p)).toBe(3);
 });
 it('takes a clear inside line to defend against a closing racer without a contact impulse',()=>{
  const race=new RivalRace(3000,()=>({...flat(),curvature:.004}),()=>[],[raceEntries[0]]);race.reset(350);
  const r=race.rivals[0];r.speed=30;
  const p={distance:r.distance-14,lateral:r.lateral,speed:45};
  expect(race.step(dt,p,p)).toBeUndefined();
  expect(r.behavior).toBe('防守');expect(r.targetLane).toBe(r.lane+1);
  expect(Math.abs(r.lateral-r.previousLateral)).toBeLessThan(.01);
 });
 it('matches player acceleration on an unobstructed straight',()=>{
  const race=new RivalRace(10350,flat,()=>[],[raceEntries[0]]);race.reset(350);
  const player=createState();player.distance=350;
  ticks(25,()=>{
   const previous={distance:player.distance,lateral:player.lateral};
   step(player,{gas:true,brake:false,steer:0},dt,0,DEFAULT_PACE,7);
   race.step(dt,player,previous);
  });
  expect(Math.abs(race.rivals[0].speed-player.speed)).toBeLessThan(.75);
  expect(Math.abs(race.rivals[0].distance-player.distance-12)).toBeLessThan(4);
 });
 it('reserves the open middle lane when both drivers approach stopped traffic abreast',()=>{
  const road=()=>({...flat(),half:5.25}),p=parked();
  const hazards=[-3.5,3.5].map((lateral,i)=>({id:'stalled'+i,lateral,distance:440,speed:0,length:5,width:2.1}));
  const race=new RivalRace(4000,road,()=>hazards,[raceEntries[0],raceEntries[1]]);race.reset(350);
  const [silver,yellow]=race.rivals;
  silver.speed=yellow.speed=26;
  let contested=false;
  ticks(18,()=>{
   race.step(dt,p,p);
   if(Math.abs(silver.distance-yellow.distance)<12){
    expect(silver.targetLane===1&&yellow.targetLane===1).toBe(false);
    if(silver.targetLane===1||yellow.targetLane===1)contested=true;
   }
   if(Math.abs(silver.distance-yellow.distance)<4.88)expect(Math.abs(silver.lateral-yellow.lateral)).toBeGreaterThanOrEqual(2.24);
  });
  expect(contested).toBe(true);expect(Math.min(silver.distance,yellow.distance)).toBeGreaterThan(460);
 });
 it('makes a fast offscreen follower yield instead of passing through a slower racer',()=>{
  let anchor={distance:330,speed:50,time:0};const p=parked(),x=-5.25,tail='T17';
  const at=(t:number)=>anchor.distance+(t-anchor.time)*anchor.speed;
  const race=new RivalRace(3000,flat,(_d,t)=>[{id:tail,type:0,distance:at(t),speed:anchor.speed,lateral:x,width:2,length:5}], [raceEntries[0]]);
  race.reset(350);race.yieldTraffic=(_o,distance,speed,time)=>{anchor={distance,speed,time};};
  ticks(5,()=>{race.step(dt,p,p);expect(race.rivals[0].distance-at(race.time)).toBeGreaterThan(4.94);});
  expect(anchor.time).toBeGreaterThan(0);
 });
 it('preserves moving traffic as a local obstacle after it leaves the player render pool',()=>{
  const sample=(distance:number)=>({position:new THREE.Vector3(0,0,distance),right:new THREE.Vector3(-1,0,0),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0});
  const traffic=new Traffic(new THREE.Scene(),sample,()=>7,10350,1);
  traffic.update(0,350,0,0);
  const lead=traffic.inspect().actors.find(a=>!a.stationary)!;
  traffic.update(.1,lead.distance+30,0,100);
  expect(traffic.inspect().actors.some(a=>a.id===lead.id)).toBe(false);
  const row=traffic.raceObstacles(lead.distance,1,500).find(a=>a.id==='T'+lead.id)!;
  const later=traffic.raceObstacles(row.distance,2,200).find(a=>a.id===row.id)!;
  expect(row.speed).toBeGreaterThan(0);expect(later.distance-row.distance).toBeCloseTo(row.speed);
  traffic.dispose();
 });
 it('finishes the authored 10 km with the player parked under three traffic seeds',()=>{
  const track=createPilotTrack(COAST_ULTRA_STAGE),end=BRICK_START+COAST_ULTRA_STAGE.length;
  for(const seed of [17,945,1206]){
   const recipes=trafficRecipe(seed,end),p=parked();
   const race=new RivalRace(end,d=>{const q=track.sample(d);return {curvature:q.curvature,grade:q.tangent.y,half:pilotSample(COAST_ULTRA_STAGE,d).halfWidth};},
    (center,t,radius)=>recipes.flatMap(row=>{const d=row.distance+row.speed*t;return Math.abs(d-center)<radius?[{id:'T'+row.id,distance:d,lateral:plannedTrafficLateral(seed,row.group,row.member??0,pilotSample(COAST_ULTRA_STAGE,d).halfWidth),width:2.1,length:5,speed:row.speed}]:[];}));
   race.reset(350);
   for(let i=0;i<300*60&&!race.rivals.every(r=>r.finishTime!==null);i++){
    race.step(1/60,p,p);
    for(const r of race.rivals)expect(r.speed).toBeLessThanOrEqual(raceEntries[0].car.topSpeed);
   }
   expect(race.rivals.map(r=>r.finishTime)).not.toContain(null);
   expect(race.rivals).toHaveLength(7);
   expect(race.rivals.every(r=>Number.isFinite(r.finishTime))).toBe(true);
  }
 },20000);
});
