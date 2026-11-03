import {describe,it,expect} from 'vitest';
import {createPilotTrack,pilotSample,validatePilot,pilotWeights} from '../src/pilot-composer';
import {CURVATURE_PER_STEER,REFERENCE_TRAVEL} from '../src/challenges';
import {BRICK_START} from '../src/bricks';
import {shoulderProfile,roadOffset} from '../src/road-profile';
import {prepareRoadChunk} from '../src/road-chunk';
import {DESIGNER_CANYON_STAGE} from '../src/designer-canyon';
import {CANYON_ROADLOCK_STAGE as stage,CANYON_ROADLOCK_MOMENTS as moments,
 CANYON_ROADLOCK_CURVES as curves,CANYON_ROADLOCK_ELEVATION as climbs,
 CANYON_ROADLOCK_LENGTH as length,CANYON_ROADLOCK_PLACEHOLDERS as props} from '../src/designer-canyon-roadlock';

describe('Grand Canyon Road Lock — driving before scenery',()=>{
 it('is a fixed, independent four-lane 5.65km route with exactly three hero beats',()=>{
  validatePilot(stage);
  expect(stage.tripCode).toBe('CUT-CANYON-ROADLOCK-01');
  expect(stage.length).toBe(5650);
  expect(stage.generatorVersion).toBe('canyon-roadlock-v1');
  expect(stage.baseLanes).toBe(4);
  expect(stage.roadWidth).toBe(14);
  expect(stage.worldPhases).toHaveLength(1);
  expect(stage.scenicLandmarks).toEqual([]);
  expect(stage.canyonPrototype).toBeUndefined();
  expect(moments.map(m=>m.endS-m.startS).reduce((a,b)=>a+b,0)).toBe(length);
  expect(moments.filter(m=>m.role==='hero')).toHaveLength(3);
  expect(curves).toHaveLength(8);
  expect(climbs).toHaveLength(5);
  expect(stage.placements.filter(p=>p.channel==='width')).toHaveLength(0);
  expect(stage.placements.filter(p=>p.channel==='curvature')).toHaveLength(8);
  // The accepted Designer's Cut remains a separate 3.2km scene.
  expect(DESIGNER_CANYON_STAGE.length).toBe(3200);
  expect(DESIGNER_CANYON_STAGE.generatorVersion).toBe('designer-canyon-v1');
  expect(DESIGNER_CANYON_STAGE.canyonPrototype?.authored).toBe(true);
 });
 it('has two opposite *nearly 180 degree* hairpins, not gentle S wiggles',()=>{
  const signedAngle=(a:number,b:number)=>{
   let angle=0;
   for(let d=a;d<b;d+=2)angle+=pilotSample(stage,BRICK_START+d+1).demand*CURVATURE_PER_STEER*2;
   return angle*180/Math.PI;
  };
  const left=signedAngle(500,1220),right=signedAngle(1970,2710);
  expect(left).toBeGreaterThan(169);
  expect(left).toBeLessThan(190);
  expect(right).toBeLessThan(-169);
  expect(right).toBeGreaterThan(-190);
  expect(Math.abs(left+right)).toBeLessThan(8);
 });
 it('uses strong but finite grades and ±26° physical banking with four available lanes',()=>{
  const track=createPilotTrack(stage);
  let maximum=0,minimumHeight=Infinity,maximumHeight=-Infinity;
  let leftBank=0,rightBank=0;
  for(let d=BRICK_START;d<BRICK_START+length;d+=10){
   const frame=track.sample(d),road=pilotSample(stage,d);
   maximum=Math.max(maximum,Math.abs(road.grade));
   minimumHeight=Math.min(minimumHeight,road.height);
   maximumHeight=Math.max(maximumHeight,road.height);
   expect(road.lanes).toBe(4);
   expect(Number.isFinite(frame.position.x+frame.position.y+frame.position.z+frame.right.y)).toBe(true);
   const bank=Math.atan(-frame.right.y)*180/Math.PI;
   expect(Math.abs(bank)).toBeLessThan(30);
   if(d>=BRICK_START+750&&d<=BRICK_START+1100)leftBank=Math.max(leftBank,bank);
   if(d>=BRICK_START+2250&&d<=BRICK_START+2510)rightBank=Math.min(rightBank,bank);
  }
  expect(maximum).toBeGreaterThan(.24);
  expect(maximum).toBeLessThan(.34);
  expect(minimumHeight).toBeCloseTo(120,0);
  expect(maximumHeight).toBeGreaterThanOrEqual(418);
  expect(leftBank).toBeGreaterThan(23);
  expect(rightBank).toBeLessThan(-23);
 },30000);
 it('avoids nonadjacent horizontal road intersections, even between hairpin levels',()=>{
  const track=createPilotTrack(stage),points=[];
  for(let d=BRICK_START;d<=BRICK_START+length;d+=20)points.push({d,p:track.sample(d).position});
  let minimum=Infinity;
  // This is deliberate O(N²) OFFLINE QA for a single ~6km authored route,
  // not a per-frame check and not an extra runtime world generator.
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   if(points[j].d-points[i].d<=160)continue;
   const a=points[i].p,b=points[j].p;
   minimum=Math.min(minimum,Math.hypot(a.x-b.x,a.z-b.z));
  }
  expect(minimum).toBeGreaterThan(38);
 },30000);
 it('keeps sparse PLACEHOLDER rocks outside all swept driving corridors',()=>{
  const track=createPilotTrack(stage),road=[];
  for(let d=BRICK_START;d<=BRICK_START+length;d+=25)road.push(track.sample(d).position);
  expect(props).toHaveLength(18);
  for(const p of props){
   const frame=track.sample(p.at),offset=roadOffset(p.offset,7,shoulderProfile(p.at,stage.seed));
   const center=frame.position.clone().addScaledVector(frame.right,offset);
   const radius=Math.hypot(p.width,p.depth)/2+12;
   const closest=Math.min(...road.map(x=>Math.hypot(x.x-center.x,x.z-center.z)));
   expect(closest,p.kind+' @ '+p.at).toBeGreaterThan(radius);
  }
 },30000);
 it('paints FOUR mountain lanes, solid yellow center, no race curb and no surf',()=>{
  const track=createPilotTrack(stage),half=(d:number)=>pilotSample(stage,d).halfWidth;
  const weights=(d:number)=>pilotWeights(stage,d);
  const make=(a:number,b:number,paint:boolean)=>prepareRoadChunk(
   track.sample,half,weights,a,b,track.length,false,true,[],
   d=>shoulderProfile(d,stage.seed),undefined,true,undefined,stage.scenerySections,
   undefined,false,paint);
  const a=make(1000,2000,true),b=make(2000,3000,true),legacy=make(1000,2000,false);
  const asphalt=a.find(x=>x.kind==='asphalt')!,other=legacy.find(x=>x.kind==='asphalt')!;
  expect(asphalt.positions).toEqual(other.positions);
  expect(asphalt.indices).toEqual(other.indices);
  expect(asphalt.colors.length).toBe(asphalt.positions.length);
  expect(asphalt.colors.every(x=>x>=.7&&x<=1)).toBe(true);
  expect(a.some(x=>x.kind==='center-line')).toBe(true);
  expect(a.filter(x=>x.kind==='line').length).toBeGreaterThan(0);
  // Chunk upload merges both painted edge strips into one material batch.
  const edge=a.find(x=>x.kind==='edge-white')!;
  expect(edge).toBeDefined();
  const lateral=Array.from(edge.uvs).filter((_,i)=>i%2===0);
  expect(Math.min(...lateral)).toBeLessThan(-1.6);
  expect(Math.max(...lateral)).toBeGreaterThan(1.6);
  expect(a.some(x=>x.kind==='edge-red'||x.kind==='surf')).toBe(false);
  expect(b.some(x=>x.kind==='asphalt')).toBe(true);
 },30000);
});
