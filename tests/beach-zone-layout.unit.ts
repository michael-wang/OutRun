import {afterEach,expect,it} from 'vitest';
import * as THREE from 'three';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan} from '../src/beach-macro';
import {beachKitPose,beachSwimSites,BEACH_ZONES} from '../src/beach-zone-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachX} from '../src/coast-layout';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {addBeachBlockout} from '../src/beach-blockout';
import {canonicalGameQuery} from '../src/runtime-query';
afterEach(()=>{setBeachPlan(false);setCoastClose(false);setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);}
it('keeps the driven route and tower/post-tower coast unchanged while refitting low beach only',()=>{
 setup();const before=coastWorkerRoad().track,shore=[4800,6200,6450,6950,7900,8500].map(d=>coastBeachX(-26,d));setBeachPlan(true);const after=coastWorkerRoad().track;
 for(let d=350;d<14550;d+=20){expect(after.sample(d).position.toArray()).toEqual(before.sample(d).position.toArray());expect(after.sample(d).tangent.toArray()).toEqual(before.sample(d).tangent.toArray());}
 for(const [i,d] of [4800,6200,6450,6950,7900,8500].entries())expect(coastBeachX(-26,d)).toBe(shore[i]);
 for(const d of [5160,5440,5710]){const x=coastBeachX(-26,d),p=after.sample(d);expect(x).toBeGreaterThan(-90);expect(x).toBeLessThan(-65);expect(coastBeachHeight(x,p.position.y,p.right.y,d)).toBeCloseTo(-5,8);}
});
it('moves package groups together with their anchor and keeps water activity genuinely immersed',()=>{
 setup();setBeachPlan(true);const sample=coastWorkerRoad().track.sample;
 for(let i=0;i<12;i++){const id='kenting-beach-parasol-'+i,a=beachKitPose(id,5980)!,b=beachKitPose(id,6030)!;expect(b.station-a.station).toBe(50);expect(b.lateral).toBe(a.lateral);}
 expect(beachSwimSites(6030)[0].station-beachSwimSites(5980)[0].station).toBe(50);
 const root=addBeachBlockout(new THREE.Scene(),sample,5980,true,new Set(Array.from({length:12},(_,i)=>'kenting-beach-parasol-'+i)));
 const people=root.children.filter(o=>o.name==='swimmer-proxy');expect(people).toHaveLength(18);
 for(const o of people){const d=o.userData.station,p=sample(d),bounds=new THREE.Box3().setFromObject(o);expect(coastBeachHeight(o.userData.lateral,p.position.y,p.right.y,d)).toBeLessThan(-5);expect(bounds.min.y).toBeLessThan(-5);expect(bounds.max.y).toBeGreaterThan(-5);expect(o.scale.x).toBeLessThanOrEqual(1.35);}
 const activity=root.userData.shoreActivity;expect(activity.visitors).toHaveLength(18);expect(activity.draws).toBeLessThanOrEqual(8);expect(activity.entry).toBe(5980+BEACH_ZONES.entryForwardM);
 for(const v of activity.visitors){expect(v.lateral).toBeLessThan(-13);expect(v.feet-v.ground).toBeCloseTo(.01,8);}
});
it('exposes only an explicit dev comparison on the current coast baseline',()=>{
 expect(canonicalGameQuery(new URLSearchParams('beachPlan=1')).has('beachPlan')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=right&sunsetRoute=1&beachVista=1&beachFlow=1&coastClose=1&beachPlan=1')).has('beachPlan')).toBe(import.meta.env.DEV);
});
