import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {bridgeSpan,bridgeShoulders} from '../src/bridge';
import {prepareRoadChunk} from '../src/road-chunk';
import {selectRoadInterchange,interchangeRampAt,interchangeRampSpan,interchangeTrafficShift,
 interchangeCenterOffset,interchangeLaneBoundaries,interchangeRailOpening,interchangeSceneryClear,RAMP_WIDTH,type RoadInterchange} from '../src/road-interchange';
import {Traffic} from '../src/traffic';

const fixture=(seed:number)=>{
 const trip=generateTrip(seed),track=createPilotTrack(trip);
 const half=(d:number)=>pilotSample(trip,d).halfWidth,weights=(d:number)=>pilotWeights(trip,d);
 const bridge=bridgeSpan(track.sample,half,weights,track.length);
 const site=selectRoadInterchange(trip,bridge);
 return {trip,track,bridge,site,half,weights};
};

describe('Road Credibility R1 — one real merge/exit',()=>{
 it('selects a deterministic real 4→5→4 lane topology while keeping the original four lanes fixed',()=>{
  for(const seed of [1,2,7]){
   const {trip,track,bridge,site,half}=fixture(seed);
   expect(site,`seed ${seed} must contain a testable interchange`).toBeDefined();
   expect(selectRoadInterchange(trip,bridge)).toEqual(site);
   const j=site!;
   expect(j.lanes).toEqual({before:4,wide:5,after:4});
   expect(j.entry.start).toBeLessThan(j.entry.end);
   expect(j.entry.end+250).toBeLessThan(j.exit.start);
   expect(j.exit.start).toBeLessThan(j.exit.end);
   expect(half(j.entry.start-20)).toBeCloseTo(7,3);
   expect(half(j.entry.end+90)).toBeCloseTo(8.75,3);
   expect(half(j.exit.end+50)).toBeCloseTo(7,3);
   // In world space, the LEFT EDGE and existing lane separators are unmoved.
   // Only the right side grows one physical 3.5m lane.
   const t=track.sample(j.entry.end+90),old=createPilotTrack(generateTrip(seed,6)).sample(j.entry.end+90);
   const oldLeft=old.position.clone().addScaledVector(old.right,-7);
   const newLeft=t.position.clone().addScaledVector(t.right,-8.75);
   const oldRight=old.position.clone().addScaledVector(old.right,7);
   const newRight=t.position.clone().addScaledVector(t.right,8.75);
   expect(Math.hypot(newLeft.x-oldLeft.x,newLeft.z-oldLeft.z)).toBeLessThan(.02);
   expect(Math.hypot(newRight.x-oldRight.x,newRight.z-oldRight.z)).toBeCloseTo(RAMP_WIDTH,1);
   const offset=interchangeCenterOffset(j,j.entry.end+90);
   expect(offset).toBeCloseTo(1.75);
   const boundaries=interchangeLaneBoundaries(j,j.entry.end+90,8.75)!;
   expect(boundaries.map(x=>x*8.75/7+offset)).toEqual([-3.5,0,3.5,7]);
   if(bridge)expect(j.exit.end+300<bridge.start-250||j.entry.start-300>bridge.end+250).toBe(true);
   expect(selectRoadInterchange(generateTrip(seed,6))).toBeUndefined();
  }
 },30000);
 it('makes slip roads taper into asphalt, and clears only the right-side physical rail mouths',()=>{
  const j=fixture(1).site!;
  for(const kind of ['entry','exit'] as const){
   const span=interchangeRampSpan(j,kind);
   expect(span.to-span.from).toBeGreaterThan(250);
   const a=interchangeRampAt(j,kind,span.from)!,middle=interchangeRampAt(j,kind,(span.from+span.to)/2)!,b=interchangeRampAt(j,kind,span.to)!;
   // The incoming lane grows into a full fifth mainline lane; the outgoing
   // lane begins full-width and only then tapers into its own exit road.
   expect(a.width).toBeCloseTo(kind==='entry'?0:RAMP_WIDTH);
   expect(b.width).toBeCloseTo(kind==='exit'?0:RAMP_WIDTH);
   expect(middle.width).toBeGreaterThan(2);
   expect(middle.width).toBeLessThanOrEqual(RAMP_WIDTH);
   expect(middle.gap).toBeGreaterThan(1);
   expect(interchangeRampAt(j,kind,span.from-1)).toBeNull();
  }
  expect(interchangeRailOpening(j,j.entry.end,1)).toBe(true);
  expect(interchangeRailOpening(j,j.exit.start,1)).toBe(true);
  expect(interchangeRailOpening(j,j.entry.end,-1)).toBe(false);
  expect(interchangeRailOpening(j,j.entry.start-340,1)).toBe(false);
  expect(interchangeSceneryClear(j,j.entry.start-150,1)).toBe(true);
  expect(interchangeSceneryClear(j,j.entry.start-150,-1)).toBe(false);
  expect(interchangeSceneryClear(j,(j.entry.end+j.exit.start)/2,1)).toBe(false);
 });
 it('streams the feeder asphalt and its supports in existing material batches, preserving mainline vertices',()=>{
  const {trip,track,bridge,site,half,weights}=fixture(1),j=site!;
  const shoulders=(d:number)=>bridgeShoulders(d,trip.seed,bridge);
  const prepare=(a:number,b:number,useJunction:boolean,cache=true)=>prepareRoadChunk(
   track.sample,half,weights,a,b,track.length,trip.seed===1,true,[],shoulders,bridge,cache,useJunction?j:undefined);
  for(const location of [j.entry.start,j.exit.start]){
   const from=location-60,to=location+140;
   const original=prepare(from,to,false),expanded=prepare(from,to,true);
   const baseAsphalt=original.find(m=>m.kind==='asphalt')!,wideAsphalt=expanded.find(m=>m.kind==='asphalt')!;
   expect(wideAsphalt.positions.length).toBeGreaterThan(baseAsphalt.positions.length);
   expect(Array.from(wideAsphalt.positions.slice(0,baseAsphalt.positions.length))).toEqual(Array.from(baseAsphalt.positions));
   expect(wideAsphalt.rayRanges?.length).toBeGreaterThan(1);
   expect(expanded.every(m=>['asphalt','sand','grass','line','rail','support','edge-white','edge-red','surf','steel','deck','water'].includes(m.kind))).toBe(true);
   expect(expanded.filter(m=>m.kind==='support').every(m=>m.normals===undefined)).toBe(true);
   for(const m of expanded){
    expect(Array.from(m.positions).every(Number.isFinite)).toBe(true);
    expect(Array.from(m.indices).every(Number.isFinite)).toBe(true);
    if(m.normals)expect(m.normals.length).toBe(m.positions.length);
   }
  }
  // Absolute-distance interpolation is byte-identical with and without S2B memoization.
  const a=j.entry.start-50,b=j.entry.start+90;
  const cached=prepare(a,b,true,true),raw=prepare(a,b,true,false);
  expect(cached.map(m=>[m.kind,m.positions,m.indices])).toEqual(raw.map(m=>[m.kind,m.positions,m.indices]));
 },30000);
 it('right-side buses use the new lane, then return safely before the exit taper',()=>{
  const {trip,site}=fixture(1),j=site!;
  const middle=j.entry.end+280,exitApproach=j.exit.start-120;
  expect(interchangeTrafficShift(j,j.entry.start)).toBe(0);
  expect(interchangeTrafficShift(j,middle)).toBeCloseTo(RAMP_WIDTH);
  expect(interchangeTrafficShift(j,exitApproach)).toBeCloseTo(0);
  const scene=new THREE.Scene();
  const sample=(d:number)=>({
   position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
   tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
  });
  const bus={id:100000,type:1,distance:middle,speed:22,group:100000};
  const half=(d:number)=>pilotSample(trip,d).halfWidth;
  const traffic=new Traffic(scene,sample as any,half,trip.length+950,trip.seed,()=>true,[bus],j);
  traffic.update(0,middle-250,0,60);
  const actor=traffic.inspect().actors.find(a=>a.id===bus.id)!;
  expect(actor.visible).toBe(true);
  expect(actor.lateral).toBeGreaterThan(6.8);
  expect(actor.lateral).toBeLessThanOrEqual(half(actor.distance)-1.75);
  traffic.dispose();
 },30000);
});
