import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {generateTrip} from '../src/trip';
import {BRICK_START} from '../src/bricks';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';
import {addJourneyScenery} from '../src/scenery';
import {planUrbanEnclosureSections,sceneryGroundMixAt,sceneryGroundY,
 type ScenerySection} from '../src/scenery-cross-section';

const flat=(d:number)=>({position:new THREE.Vector3(0,45,d),
 right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,0,1),
 roadHeading:0,curvature:0});

/** Count actual instanced building bodies, not names in the route's metadata. */
function cityBodies(){
 const scene=new THREE.Scene();
 const sections:readonly ScenerySection[]=[{
  id:'test-city',kind:'urban-both',start:0,end:1600,
  left:'city',right:'city',urbanCore:true,
 }];
 const result=addJourneyScenery(scene,flat as any,1600,2,1,()=>7,()=>[0,0,1],
  {start:0,end:1200,openRoad:true,landmarkSites:[],scenerySections:sections,denseCity:true});
 const palette=new Set(['e6c5a0','dba98c','b9c7b8','e5c8b6','c8b6aa','d4c49e']);
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3();
 const bodies:{x:number;y:number;h:number}[]=[];
 scene.traverse(node=>{
  if(!(node instanceof THREE.InstancedMesh)||node.geometry.type!=='BoxGeometry')return;
  if(!palette.has((node.material as THREE.MeshStandardMaterial).color.getHexString()))return;
  for(let i=0;i<node.count;i++){
   node.getMatrixAt(i,matrix);matrix.decompose(p,rot,scale);
   if(scale.x>=21&&scale.y>=17&&scale.z>=12)
    bodies.push({x:p.x,y:p.y,h:scale.y});
  }
 });
 return {bodies,instances:result.instances,draws:result.draws};
}

describe('Scenery Credibility R1.1 — believable enclosed streets',()=>{
 it('makes a separate replayable r10 plan; archives r9 geometry, landmarks, and cross-sections intact',()=>{
  for(const seed of [1,2,7]){
   const old=generateTrip(seed,9),now=generateTrip(seed,10);
   expect(old.generatorVersion).toBe('v0.9-r9');
   expect(old.tripCode).toContain('ALB9');
   expect(now.generatorVersion).toBe('v0.9-r10');
   expect(now.tripCode).toContain('ALB10');
   expect(old.scenerySections!.every(s=>!s.urbanCore)).toBe(true);
   expect(now.contentFingerprint).not.toBe(old.contentFingerprint);
   expect(now.worldPhases).toEqual(old.worldPhases);
   expect(now.beats).toEqual(old.beats);
   expect(now.scenicCues).toEqual(old.scenicCues);
   expect(now.scenicLandmarks).toEqual(old.scenicLandmarks);
   expect(now.roadFeatures).toEqual(old.roadFeatures);
   expect(now.bankFeatures).toEqual(old.bankFeatures);
   expect(now.placements.filter(p=>p.channel!=='elevation'))
    .toEqual(old.placements.filter(p=>p.channel!=='elevation'));
   expect(generateTrip(seed,9)).toEqual(old);
   expect(generateTrip(seed,10)).toEqual(now);
  }
 },30000);
 it('limits city grade without flattening canyon/coast or changing horizontal driving geometry',()=>{
  for(const seed of [1,2,7]){
   const before=generateTrip(seed,9),after=generateTrip(seed,10);
   const oldElev=before.placements.filter(p=>p.channel==='elevation');
   const newElev=after.placements.filter(p=>p.channel==='elevation');
   expect(newElev).toHaveLength(oldElev.length);
   let city=0,nonCity=0;
   for(let i=0;i<newElev.length;i++){
    const p=newElev[i],q=oldElev[i];
    const beat=after.beats.find(b=>b.id===p.beat)!;
    expect([p.id,p.startS,p.endS]).toEqual([q.id,q.startS,q.endS]);
    if(beat.world==='city'){
     city++;
     expect(p.parameters.amplitude).toBeLessThanOrEqual(3.5);
     expect(p.parameters.amplitude).toBeLessThanOrEqual(q.parameters.amplitude);
     for(const f of [.12,.24,.48,.7,.88]){
      const d=BRICK_START+p.startS+(p.endS-p.startS)*f;
      expect(Math.abs(pilotSample(after,d).grade)).toBeLessThan(.035);
     }
    }else{nonCity++;expect(p).toEqual(q);}
   }
   expect(city).toBeGreaterThan(0);expect(nonCity).toBeGreaterThan(0);
   const r10=createPilotTrack(after),r9=createPilotTrack(before);
   for(let d=BRICK_START;d<BRICK_START+after.length;d+=2300){
    const a=r10.sample(d),b=r9.sample(d);
    expect(a.position.x).toBeCloseTo(b.position.x,5);
    expect(a.position.z).toBeCloseTo(b.position.z,5);
    expect(a.curvature).toBeCloseTo(b.curvature,7);
   }
  }
 },30000);
 it('converts each urban core to two enclosed sides without inventing a city waterfront',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed,10),sections=trip.scenerySections!;
   expect(sections).toHaveLength(32);
   expect(sections).toEqual(planUrbanEnclosureSections(trip.beats));
   const cities=sections.filter(s=>s.urbanCore);
   expect(cities.length).toBeGreaterThan(6);
   expect(cities.every(s=>s.left==='city'||s.left==='hillside')).toBe(true);
   expect(cities.every(s=>s.right==='city')).toBe(true);
   expect(cities.some(s=>s.kind==='urban-hillside')).toBe(true);
   expect(Object.isFrozen(sections)).toBe(true);
   for(const s of sections)expect(Object.isFrozen(s)).toBe(true);
  }
 });
 it('instantiates comparable near and middle city blocks on BOTH sides',()=>{
  const {bodies,instances,draws}=cityBodies();
  const near=bodies.filter(b=>Math.abs(b.x)>=27&&Math.abs(b.x)<60);
  const mid=bodies.filter(b=>Math.abs(b.x)>80&&Math.abs(b.x)<135);
  const left=near.filter(b=>b.x<0).length,right=near.filter(b=>b.x>0).length;
  expect(left).toBeGreaterThan(12);
  expect(right).toBeGreaterThan(12);
  expect(Math.abs(left-right)).toBeLessThanOrEqual(3);
  expect(mid.filter(b=>b.x<0).length).toBeGreaterThan(4);
  expect(mid.filter(b=>b.x>0).length).toBeGreaterThan(4);
  expect(instances).toBeGreaterThan(near.length+mid.length);
  expect(draws).toBeLessThan(300);
  for(const b of bodies){
   const mix={leftLand:1,rightSea:0,urban:1};
   const y=sceneryGroundY(b.x,45,0,x=>x,0,mix);
   expect(Math.abs(b.y-b.h/2-y),`floating block x=${b.x}`).toBeLessThan(.06);
  }
 },30000);
 it('keeps far urban terrain as a continuous lower shelf, with smooth transitions',()=>{
  const mix={leftLand:1,rightSea:0,urban:1},physical=(x:number)=>x;
  for(const side of [-1,1]){
   const yNear=sceneryGroundY(side*35,45,0,physical,0,mix);
   const yFar=sceneryGroundY(side*260,45,0,physical,0,mix);
   expect(yNear).toBeGreaterThan(40);
   expect(yFar).toBeGreaterThan(38);
   expect(yFar).toBeLessThan(yNear);
  }
  const r9={leftLand:0,rightSea:0};
  expect(sceneryGroundY(-160,45,0,physical,0,r9)).toBeCloseTo(-5.05);
  const sections:ScenerySection[]=[
   {id:'coast',kind:'coastal-left',start:0,end:1400,left:'sea',right:'coastal-land'},
   {id:'city',kind:'urban-both',start:1400,end:3000,left:'city',right:'city',urbanCore:true},
  ];
  for(const d of [1220,1399,1400,1401,1580]){
   const a=sceneryGroundMixAt(sections,d-.01),b=sceneryGroundMixAt(sections,d+.01);
   expect(Math.abs((a.urban??0)-(b.urban??0))).toBeLessThan(.001);
  }
  expect(sceneryGroundMixAt(sections,1400).urban).toBeCloseTo(.5);
 });
});
