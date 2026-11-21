import {afterEach,expect,it} from 'vitest';
import * as THREE from 'three';
import {setBeachMacro,macroHidePreRevealBeach} from '../src/beach-macro';
import {COAST_SUN,COAST_SHADOW_AWAY,COAST_SHADOW_ACROSS} from '../src/coast-sun-direction';
import {COAST_EFFECTS} from '../src/content/coast-effects';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastShadowOffset,COAST_SHADOW_YAW} from '../src/coast-sun-shadow';
import {updateCoastShadowLights} from '../src/coast-shadow-coverage';
import {coastBeachShadowAnchors} from '../src/coast-dusk-shadows';
afterEach(()=>setBeachMacro('none'));
it('keeps one fixed sun inside the sea-left chase sector across the right beach',()=>{
 setBeachMacro('right');const road=coastWorkerRoad().track,sun=COAST_SUN.clone();
 for(let d=4850;d<=6550;d+=50){const s=road.sample(d),forward=s.tangent.clone().setY(0).normalize(),right=s.right.clone().setY(0).normalize();
  const angle=Math.atan2(sun.dot(right),sun.dot(forward))*180/Math.PI;
  expect(angle).toBeGreaterThan(-20);expect(angle).toBeLessThan(-12);expect(COAST_SUN.toArray()).toEqual(sun.toArray());
 }
 expect(sun.y).toBeCloseTo(new THREE.Vector3(...COAST_EFFECTS.lighting.sunDirection).normalize().y,12);
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();updateCoastShadowLights(near,far,new THREE.Vector3(),road.sample,5600,road.length);
 expect(near.position.clone().sub(near.target.position).normalize().distanceTo(sun)).toBeLessThan(1e-10);
 expect(far.position.clone().sub(far.target.position).normalize().distanceTo(sun)).toBeLessThan(1e-10);
 expect(coastShadowOffset(10).normalize().distanceTo(COAST_SHADOW_AWAY)).toBeLessThan(1e-10);
 expect(COAST_SHADOW_ACROSS.dot(COAST_SHADOW_AWAY)).toBeCloseTo(0);
 expect(COAST_SHADOW_YAW).toBeCloseTo(Math.atan2(-sun.x,-sun.z));
});
it('restores exact accepted lighting for default, B and retired variants',()=>{
 const accepted=new THREE.Vector3(...COAST_EFFECTS.lighting.sunDirection).normalize();
 for(const variant of ['none','b','left']){setBeachMacro('right');setBeachMacro(variant);expect(COAST_SUN.toArray()).toEqual(accepted.toArray());}
});
it('suppresses only pre-reveal visitor dressing in the right layout',()=>{
 setBeachMacro('right');expect(macroHidePreRevealBeach(4350)).toBe(true);for(const d of [3999,4850,6000,9000])expect(macroHidePreRevealBeach(d)).toBe(false);
 expect(coastBeachShadowAnchors().filter(a=>a.x<0&&a.d>=4000&&a.d<4850&&['umbrella','visitor','bench','shop'].includes(a.kind??''))).toHaveLength(0);
 for(const v of ['none','b']){setBeachMacro(v);expect(macroHidePreRevealBeach(4350)).toBe(false);}
});
