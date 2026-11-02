import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {DESIGNER_CANYON_STAGE,DESIGNER_CUT,DESIGNER_CANYON_PROPS,
 DESIGNER_CANYON_VERSION,DESIGNER_CANYON_LENGTH} from '../src/designer-canyon';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights,validatePilot} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {addJourneyScenery} from '../src/scenery';
import {canyonGroundY,canyonSceneEnvelope} from '../src/grand-canyon-scene';
import {canyonVistaProjection} from '../src/canyon-vista';
import {BRICK_START} from '../src/bricks';

describe('Grand Canyon Designer’s Cut — fixed track, not a generated route',()=>{
 it('is a statically authored self-contained route, separate from every old seed',()=>{
  const s=DESIGNER_CANYON_STAGE;
  validatePilot(s);
  expect(s.generatorVersion).toBe(DESIGNER_CANYON_VERSION);
  expect(s.tripCode).toBe('CUT-CANYON-01');
  expect(s.length).toBe(DESIGNER_CANYON_LENGTH);
  expect(s.worldPhases).toEqual([{startS:0,endS:s.length,world:'canyon',beat:'Designed canyon route'}]);
  expect(s.placements.filter(p=>p.channel==='curvature')).toHaveLength(4);
  expect(s.placements.filter(p=>p.channel==='elevation')).toHaveLength(2);
  expect(s.placements.filter(p=>p.channel==='width')).toHaveLength(0);
  expect(s.canyonPrototype?.authored).toBe(true);
  expect(s.designerCut).toBe(DESIGNER_CUT);
  expect(s.scenicLandmarks).toEqual([]);
  expect(DESIGNER_CANYON_PROPS.length).toBeGreaterThanOrEqual(16);
  expect(new Set(DESIGNER_CANYON_PROPS.map(p=>p.at))).toHaveProperty('size',DESIGNER_CANYON_PROPS.length);
  expect(DESIGNER_CANYON_PROPS.every(p=>p.at>BRICK_START&&p.at<BRICK_START+s.length&&Math.abs(p.offset)>25)).toBe(true);
  const old=generateTrip(1,12);
  expect(old.tripCode).toContain('TRIP-v0.9-r12-1');
  expect(old.designerCut).toBeUndefined();
  expect(old.length).toBe(69000);
 });
 it('is finite, gentle enough to drive, and has no discontinuous authored road links',()=>{
  const s=DESIGNER_CANYON_STAGE,track=createPilotTrack(s);
  const heads:number[]=[];
  for(let d=BRICK_START;d<BRICK_START+s.length;d+=20){
   const p=track.sample(d),q=pilotSample(s,d);
   expect(Number.isFinite(p.position.x+p.position.y+p.position.z+p.curvature)).toBe(true);
   expect(q.lanes).toBe(4);
   expect(Math.abs(q.grade)).toBeLessThan(.15);
   heads.push(p.roadHeading);
  }
  const delta=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  expect(heads.slice(1).every((n,i)=>Math.abs(delta(n,heads[i]))<.18)).toBe(true);
 });
 it('supports a real fixed-Y river and asymmetric cut slope, without default world ocean',()=>{
  const scene=DESIGNER_CANYON_STAGE.canyonPrototype!,d=(scene.start+scene.end)/2,y=130;
  expect(scene.riverY).toBeGreaterThan(-5);
  expect(scene.riverY).toBeLessThan(100);
  expect(canyonSceneEnvelope(scene,d)).toBe(1);
  expect(canyonGroundY(scene,d,-112,y,100)).toBeLessThan(scene.riverY);
  expect(canyonGroundY(scene,d,-200,y,100)).toBeGreaterThan(scene.riverY+15);
  expect(canyonGroundY(scene,d,100,y,100)).toBeGreaterThan(y+20);
  expect(canyonGroundY(scene,d,10,y,100)).toBe(100);
  expect(canyonGroundY(scene,scene.start,-112,y,100)).toBe(100);
 });
 it('streams identical 1km water seams, keeping the driving surface intact',()=>{
  const s=DESIGNER_CANYON_STAGE,t=createPilotTrack(s);
  const half=(d:number)=>pilotSample(s,d).halfWidth,weights=(d:number)=>pilotWeights(s,d);
  const build=(a:number,b:number)=>prepareRoadChunk(t.sample,half,weights,a,b,t.length,
   false,true,[],undefined,undefined,true,undefined,s.scenerySections,s.canyonPrototype);
  const a=build(1000,2000),b=build(2000,3000);
  const wa=a.find(m=>m.kind==='water')!,wb=b.find(m=>m.kind==='water')!;
  expect(wa).toBeDefined();expect(wb).toBeDefined();
  expect(Array.from(wa.positions.slice(-6))).toEqual(Array.from(wb.positions.slice(0,6)));
  for(const m of [wa,wb]){
   expect(m.positions.length).toBeGreaterThan(6);
   expect(Array.from(m.positions).every(Number.isFinite)).toBe(true);
   expect(Array.from(m.positions).filter((_,i)=>i%3===1).every(y=>Math.abs(y-s.canyonPrototype!.riverY)<.001)).toBe(true);
  }
  const road=a.find(m=>m.kind==='asphalt')!;
  expect(road.positions.length).toBeGreaterThan(0);
  expect(road.rayRanges?.length).toBeGreaterThan(0);
 },30000);
 it('only instantiates manually placed objects, never the old 30m canyon avenue',()=>{
  const s=DESIGNER_CANYON_STAGE,t=createPilotTrack(s),scene=new THREE.Scene();
  const result=addJourneyScenery(scene,t.sample,t.length,s.sceneryAct,s.seed,
   d=>pilotSample(s,d).halfWidth,d=>pilotWeights(s,d),{
    start:BRICK_START,end:BRICK_START+1600,openRoad:true,
    landmarkSites:s.scenicLandmarks,scenerySections:s.scenerySections,
    canyonPrototype:s.canyonPrototype,designerCut:s.designerCut,
   });
  expect(result.instances).toBeGreaterThan(4);
  expect(result.instances).toBeLessThan(200);
  expect(result.draws).toBeLessThan(80);
 });
 it('checks that the authored river reveal has at least one natural chase-camera view',()=>{
  const s=DESIGNER_CANYON_STAGE,site=s.canyonPrototype!,sample=createPilotTrack(s).sample;
  const hits=[];
  for(let from=BRICK_START+700;from<=BRICK_START+1750;from+=100){
   for(const lead of [200,300,400]){
    const target=Math.min(site.end-150,from+lead);
    if(target<=from+50)continue;
    const p=canyonVistaProjection(s,site,from,target,1705/863,sample);
    if(p.riverVisible||p.rimVisible)hits.push({from,target,...p});
   }
  }
  // This is a frustum-only diagnostic; real visibility still needs screenshots.
  expect(hits.length).toBeGreaterThan(0);
 },30000);
});
