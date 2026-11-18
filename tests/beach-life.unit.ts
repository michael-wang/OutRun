import {it,expect,afterEach} from 'vitest';
import * as THREE from 'three';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan,setBeachLife,beachRailHidden,macroLighthouseScale} from '../src/beach-macro';
import {coastDriveBounds,coastBeachX} from '../src/coast-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBarrierShadowAnchors} from '../src/coast-dusk-shadows';
import {addCoastResort} from '../src/coast-resort';
import {addBeachFestival,addLighthouseBeacon} from '../src/beach-festival';
import {canonicalGameQuery} from '../src/runtime-query';
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
it('instances dense human-scale activity with dry feet and genuinely submerged swimmers',()=>{
 setup();setBeachLife(true);const root=addBeachFestival(new THREE.Group(),coastWorkerRoad().track.sample,5980);
 expect(root.userData.shore).toBeGreaterThan(600);expect(root.userData.water).toBeGreaterThanOrEqual(180);expect(root.userData.draws).toBeLessThanOrEqual(14);
 for(const p of root.userData.people){expect(p.scale).toBeLessThanOrEqual(1.35);if(p.water){expect(p.ground).toBeLessThanOrEqual(-5.5);expect(p.y).toBe(-5);}else expect(p.y-.94*p.scale).toBeCloseTo(p.ground,8);}
});
it('rotates the beacon in world-time, preserves baseline scale and explicit comparison query',()=>{
 setup();expect(macroLighthouseScale()).toBe(1.5);setBeachLife(true);expect(macroLighthouseScale()).toBe(1.95);
 const beacon=addLighthouseBeacon(new THREE.Group());beacon.userData.update(0);const first=beacon.quaternion.clone();beacon.userData.update(3);expect(beacon.rotation.y).toBeCloseTo(Math.PI/2);expect(beacon.quaternion.equals(first)).toBe(false);beacon.userData.update(12);expect(beacon.rotation.y).toBeCloseTo(0);
 expect(canonicalGameQuery(new URLSearchParams('beachLife=1')).has('beachLife')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=right&sunsetRoute=1&beachVista=1&beachFlow=1&coastClose=1&beachPlan=1&beachLife=1')).has('beachLife')).toBe(import.meta.env.DEV);
});
