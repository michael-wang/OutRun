import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_STAGE} from '../src/content/coast-stage';
import {trafficRecipe,Traffic} from '../src/traffic';
import {breakdownLayout} from '../src/breakdowns';

const plan=COAST_STAGE.onboarding;
const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
});

it('R5a: seeded sparse civilian introduction follows A1; next group starts beyond A3',()=>{
 for(const seed of [1,804,804^1234,912384]){
  const rows=trafficRecipe(seed,10950,plan.traffic);
  expect(rows[0].distance).toBeGreaterThan(plan.lessons[1].end);
  expect(rows[0].distance).toBeGreaterThanOrEqual(plan.traffic.firstCivilianDistance);
  expect(rows.filter(r=>r.group===0)).toHaveLength(plan.traffic.firstWaveCount);
  expect(rows.filter(r=>r.group>0).every(r=>r.distance>=plan.traffic.nextWaveDistance)).toBe(true);
  expect(rows.every(r=>r.distance>plan.lessons[0].end)).toBe(true);
  expect(trafficRecipe(seed,10950,plan.traffic)).toBe(rows);
 }
});

it('R5a: the race intro does not spawn new civilian cars at the 300m entry',()=>{
 const seed=804,traffic=new Traffic(new THREE.Scene(),sample,()=>8.75,10950,seed,
  ()=>true,[],undefined,true,false,false,0,plan.traffic);
 try{
  traffic.rivalLeaders=()=>[];
  traffic.enableRaceMode();
  const before=traffic.inspectWorld();
  expect(before.total).toBe(trafficRecipe(seed,10950,plan.traffic).length);
  traffic.update(25,350,0,0);
  const after=traffic.inspectWorld();
  expect(after.rows.some(r=>r.id>=2000000)).toBe(false);
  expect(after.total).toBe(before.total);
  traffic.reset(17);
  expect(traffic.inspectWorld().total).toBe(trafficRecipe(seed^17,10950,plan.traffic).length);
 }finally{traffic.dispose();}
});

it('R5a: roadside breakdowns cannot interrupt the initial teaching corridor',()=>{
 for(const seed of [2,17,804,4019]){
  const rows=breakdownLayout(sample,()=>8.75,10350,seed,true,plan.breakdownsAfter);
  expect(rows.every(r=>r.distance>=plan.breakdownsAfter)).toBe(true);
 }
});

it("R5a.1: tutorial's first car is curated, but later highway encounters remain seeded random",()=>{
 const scheduleA=trafficRecipe(804^11,10950,plan.traffic);
 const scheduleB=trafficRecipe(804^12,10950,plan.traffic);
 expect(scheduleA.filter(r=>r.group===0)).toHaveLength(1);
 expect(scheduleB.filter(r=>r.group===0)).toHaveLength(1);
 const laterA=scheduleA.filter(r=>r.group>0);
 const laterB=scheduleB.filter(r=>r.group>0);
 expect(laterA.length).toBeGreaterThan(15);
 expect(laterB.length).toBeGreaterThan(15);
 expect(laterA.map(r=>[r.distance,r.type,r.speed])).not.toEqual(laterB.map(r=>[r.distance,r.type,r.speed]));
 expect(laterA[0].distance).toBeGreaterThan(plan.lessons[3].end+250);
});
