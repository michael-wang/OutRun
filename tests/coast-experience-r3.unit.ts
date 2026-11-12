import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';
import {coastCurveConeLayout} from '../src/coast-curve-cones';
import {RoadCones} from '../src/road-cones';
import {coastBarrierStyle,coastDriveBounds} from '../src/coast-layout';
import {CoastStoneContact} from '../src/coast-stone-contact';
import {FinishStats} from '../src/finish-stats';
import {createState} from '../src/handling';

const runtime=coastWorkerRoad(),stage=runtime.stage,track=runtime.track,half=runtime.halfAt;

it('paints the sea-side shoulder blacktop right up to the beach edge',()=>{
 const parts=prepareRoadChunk(track.sample,half,runtime.weightsAt,830,858,track.length,
  false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections);
 const asphalt=parts.find(x=>x.kind==='asphalt')!,sand=parts.find(x=>x.kind==='sand')!;
 const frame=track.sample(844),v=new THREE.Vector3();
 const roadX=Array.from({length:asphalt.positions.length/3},(_,i)=>
  v.fromArray(asphalt.positions,i*3).sub(frame.position).dot(frame.right));
 expect(Math.min(...roadX)).toBeLessThan(-10.6);
 expect(Math.max(...roadX)).toBeGreaterThan(10);
 const sandX=Array.from({length:sand.positions.length/3},(_,i)=>
  v.fromArray(sand.positions,i*3).sub(frame.position).dot(frame.right));
 expect(sandX.some(x=>x<-14)).toBe(true); // still a natural beach
});

it('keeps low visitor blocks, sparse seaward rails and open ocean vistas without dark boulders',()=>{
 expect(coastBarrierStyle(850,-1)).toBe('none');
 expect(coastBarrierStyle(500,-1)).toBe('rail');
 expect(coastBarrierStyle(2500,-1)).toBe('block');
 expect(coastBarrierStyle(7500,-1)).toBe('none');
 for(const d of [495,528,3440,4800,8500,9400])
  expect(coastBarrierStyle(d,-1)).not.toBe('rock');
 expect(coastDriveBounds(850,half(850)).left).toBeCloseTo(-11,5);
 expect(coastDriveBounds(500,half(500)).left).toBeLessThan(-11);
 // The removed boulders must not leave ghost impacts behind the ocean view.
 const hit=new CoastStoneContact(half,1.15,2.1);
 const s=createState();s.distance=501;s.lateral=-11.2;s.speed=75;
 expect(hit.update(s,{distance:489,lateral:-11.2},.15,1)).toBeUndefined();
});

it('adds only sparse outside-of-turn cone groups, never a multi-lane blockade',()=>{
 const groups=coastCurveConeLayout(track.sample,half,track.length);
 expect(groups.length).toBeGreaterThanOrEqual(10);
 expect(groups.length).toBeLessThanOrEqual(35);
 const grouped=new Map<number,typeof groups>();
 for(const c of groups){
  const g=Math.floor((c.id-800000)/8),items=grouped.get(g)??[];items.push(c);grouped.set(g,items);
  expect(Math.abs(c.lateral??0)).toBeGreaterThanOrEqual(half(c.distance)+.2);
  expect(coastBarrierStyle(c.distance,c.side)).not.toBe('block');
 }
 for(const items of grouped.values()){
  expect(items).toHaveLength(5);
  const outside=items[0].side;
  expect(items.every(x=>x.side===outside)).toBe(true);
  expect(items.at(-1)!.distance-items[0].distance).toBeLessThan(65);
 }
 const cones=new RoadCones(track.sample,half,new THREE.Scene(),stage.seed,track.length,
  ()=>true,undefined,false,false,true);
 expect(cones.recipe.length).toBeGreaterThan(groups.length);
 expect(cones.recipe.filter(c=>c.id>=800000)).toEqual(groups);
 cones.dispose();
});

it('reports time-weighted displayed speed, highest instantaneous speed and actual collisions',()=>{
 const a=new FinishStats();
 a.addFrame(2,10);a.addFrame(3,30);
 a.addCollisions();a.addCollisions(2);
 expect(a.summary(5)).toEqual({
  time:'00:05.0',averageKmh:79,maximumKmh:108,collisions:3,
 });
 expect(a.summary(62.35).time).toBe('01:02.3');
 a.reset();
 expect(a.summary(0)).toEqual({time:'00:00.0',averageKmh:0,maximumKmh:0,collisions:0});
});
it('keeps finish figures secondary, only when the driving session has completed',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 expect(main).toContain('id="player-finish-stats"');
 expect(main).toContain("finishPanel.hidden=!brickCompleted");
 expect(main).toContain('finishStats.addCollisions()');
 expect(main).toContain('finishStats.addFrame(dt,state.speed)');
 expect(css).toContain('#player-finish-stats[hidden]');
 expect(css).not.toContain('#player-finish-stats{background:');
});

it('keeps the current eight-car results panel compact and off the main driving view',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const board=css.slice(css.indexOf('/* One restrained results board:'));
 expect(main).toContain('id="race-standings"');
 expect(main).toContain('id="race-standings-list"');
 expect(main).toContain("panel.setAttribute('aria-label',brickCompleted?'旅程結算':'開始駕駛')");
 expect(board).toContain('#race-standings');
 expect(board).toContain('left:max(18px,env(safe-area-inset-left))');
 expect(board).toContain('width:min(325px,37vw)');
 expect(board).toContain('background:rgba(10,23,30,.84)');
 expect(board).toContain('#race-standings[hidden]{display:none!important}');
 expect(board).toContain('grid-template-columns:25px minmax(0,1fr) 73px');
});
