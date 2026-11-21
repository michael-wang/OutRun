import {it,expect,afterEach} from 'vitest';
import * as THREE from 'three';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan,setBeachLife,beachRailHidden,macroLighthouseScale} from '../src/beach-macro';
import {setBeach2} from '../src/beach2-profile';
import {coastVisibleBarrierStyle,coastDriveBounds,coastBeachX} from '../src/coast-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBarrierShadowAnchors} from '../src/coast-dusk-shadows';
import {addCoastResort} from '../src/coast-resort';
import {addLighthouseBeacon} from '../src/lighthouse-beacon';
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);setBeachPlan(true);}
afterEach(()=>{setBeachLife(false);setBeachPlan(false);setCoastClose(false);setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
it('removes only beach sea-side visual barriers and their shadows, never physical limits or route/shore',()=>{
 setup();const before=coastWorkerRoad().track,stations=[4000,4850,5200,5800,6050,6450,8000],bounds=stations.map(d=>coastDriveBounds(d,8.75)),shore=stations.map(d=>coastBeachX(-26,d));
 const old=new THREE.Scene(),a=addCoastResort(old,before.sample,()=>8.75,5100,5200);setBeachLife(true);const after=coastWorkerRoad().track,newScene=new THREE.Scene(),b=addCoastResort(newScene,after.sample,()=>8.75,5100,5200);
 expect(b.instances).toBeLessThan(a.instances);expect(beachRailHidden(5300,-1)).toBe(true);expect(beachRailHidden(5300,1)).toBe(false);expect(beachRailHidden(6450,-1)).toBe(false);
 stations.forEach((d,i)=>{expect(coastDriveBounds(d,8.75)).toEqual(bounds[i]);expect(coastBeachX(-26,d)).toBe(shore[i]);});
 for(let d=350;d<=14550;d+=25){expect(after.sample(d).position.toArray()).toEqual(before.sample(d).position.toArray());}
 expect(coastBarrierShadowAnchors(6600,()=>8.75).filter(a=>a.x<0&&a.d>4860&&a.d<6040&&['rail','rail-beam','concrete'].includes(a.kind??''))).toHaveLength(0);
});
it('rotates the beacon in world-time and preserves its scale',()=>{
 setup();expect(macroLighthouseScale()).toBe(1.5);setBeachLife(true);expect(macroLighthouseScale()).toBe(1.95);
 const beacon=addLighthouseBeacon(new THREE.Group());beacon.userData.update(0);const first=beacon.quaternion.clone();beacon.userData.update(3);expect(beacon.rotation.y).toBeCloseTo(Math.PI/2);expect(beacon.quaternion.equals(first)).toBe(false);beacon.userData.update(12);expect(beacon.rotation.y).toBeCloseTo(0);
});

it('renders spaced beach stones with matching shadows while preserving the driving limits',()=>{
 setup();setBeachLife(true);
 const slots=Array.from({length:115},(_,i)=>4680+12*i);
 const limits=slots.map(d=>coastDriveBounds(d,8.75));
 setBeach2(true);
 try{
  const style=(d:number)=>coastVisibleBarrierStyle(d,-1);
  const posts=slots.filter(d=>style(d)==='stone-post');
  expect(posts.length).toBeGreaterThan(100);
  for(const access of [4990,5500,5595,5868])expect(style(access)).toBe('opening');
  expect(coastVisibleBarrierStyle(5064,1)).not.toBe('stone-post');
  expect(style(6060)).not.toBe('stone-post');
  slots.forEach((d,i)=>expect(coastDriveBounds(d,8.75)).toEqual(limits[i]));
  const shadows=coastBarrierShadowAnchors(6050,()=>8.75).filter(a=>a.x<0&&a.d>=4678&&a.d<=6050);
  expect(shadows.filter(a=>a.kind==='concrete')).toHaveLength(posts.length);
  expect(shadows.some(a=>a.kind==='rail-beam')).toBe(false);
 }finally{setBeach2(false);}
});
