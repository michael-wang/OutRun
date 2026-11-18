import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {addBeachBlockout} from '../src/beach-blockout';
import {beachBlockoutAnchor,beachPreviewAnchor,blockoutReplacesStall} from '../src/beach-blockout-config';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {COAST_REEF_ROCKS} from '../src/coast-layout';
import type {createTrack} from '../src/track';

describe('disposable beach sightline blockout',()=>{
 const sample=((d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(-1,0,0),roadHeading:0})) as ReturnType<typeof createTrack>['sample'];
 it('removes placeholder masonry only after authored asset loads and keeps gulls independently moving',()=>{
  const root=addBeachBlockout(new THREE.Scene(),sample,5980,true);
  const tower=root.getObjectByName('lighthouse-proxy')!;
  expect(tower.children).toHaveLength(5);
  const before=tower.children.map(b=>b.position.clone());
  root.userData.update(2);
  expect(tower.children.every((b,i)=>b.position.distanceTo(before[i])>.1)).toBe(true);
  expect(tower.children[0].position.distanceTo(tower.children[1].position)).toBeGreaterThan(1);
  const fallback=addBeachBlockout(new THREE.Scene(),sample);
  expect(fallback.getObjectByName('lighthouse-proxy')!.children.length).toBeGreaterThan(5);
 });
 it('keeps occupants partially immersed and the tower on the sea side when relocated',()=>{
  for(const anchor of [5980,8000]){
   const scene=new THREE.Scene(),root=addBeachBlockout(scene,sample,anchor);
   const tower=root.getObjectByName('lighthouse-proxy')!;
   expect(tower.position.x).toBe(50);expect(tower.position.z).toBe(anchor+195);
   const swimmers=root.children.filter(o=>o.name==='swimmer-proxy');expect(swimmers).toHaveLength(12);
   for(const s of swimmers){expect(s.userData.torsoBottom).toBeLessThan(-5);expect(s.userData.headTop).toBeGreaterThan(-5);expect(s.userData.station).toBeGreaterThanOrEqual(anchor-50);}
   expect(root.children.every(o=>o.position.x>11.15)).toBe(true);
   scene.remove(root);expect(scene.children).toHaveLength(0);
  }
 });
 it('leaves other sites and inland stalls alone and makes suppression opt-in',()=>{
  expect(beachBlockoutAnchor(new URLSearchParams(),14550)).toBeUndefined();
  expect(beachPreviewAnchor(new URLSearchParams(),14550)).toBe(5980);
  expect(beachPreviewAnchor(new URLSearchParams('beachBlockout=0'),14550)).toBeUndefined();
  const anchor=beachBlockoutAnchor(new URLSearchParams('beachBlockout=1'),14550);
  expect(anchor).toBe(5980);
  expect(blockoutReplacesStall(5992,-21,anchor)).toBe(true);
  expect(blockoutReplacesStall(5992,21,anchor)).toBe(false);
  expect(blockoutReplacesStall(2560,-21,anchor)).toBe(false);
  expect(blockoutReplacesStall(6141,-21,anchor)).toBe(false);
  expect(blockoutReplacesStall(5992,-21,undefined)).toBe(false);
 });
 it.each([5900,5980])('places bathers over submerged ground at anchor %s',anchor=>{
  const {track}=coastWorkerRoad();const root=addBeachBlockout(new THREE.Scene(),track.sample,anchor);
  const tower=root.getObjectByName('lighthouse-proxy')!;
  const swimmers=root.children.filter(o=>o.name==='swimmer-proxy');
  const stations=swimmers.map(o=>o.userData.station);
  expect(Math.max(...stations)-Math.min(...stations)).toBeGreaterThan(150);
  for(const swimmer of swimmers){
   const {station,lateral}=swimmer.userData,p=track.sample(station);
   expect(coastBeachHeight(lateral,p.position.y,p.right.y,station)).toBeLessThan(-5);
   expect(swimmer.position.y).toBe(-5);
   expect(swimmer.scale.x).toBeLessThanOrEqual(1.35);
   const visibleBounds=new THREE.Box3().setFromObject(swimmer);
   expect(visibleBounds.min.y).toBeLessThan(-5);
   expect(visibleBounds.max.y).toBeGreaterThan(-5);
   expect(swimmer.position.distanceTo(tower.position)).toBeGreaterThan(25);
   expect(COAST_REEF_ROCKS.every(rock=>Math.abs(rock.d-station)>40)).toBe(true);
  }
 });
});
