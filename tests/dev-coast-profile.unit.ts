import {it,expect,afterEach} from 'vitest';
import * as THREE from 'three';
import {resolveDevCoast} from '../src/dev-coast-profile';
import {canonicalGameQuery} from '../src/runtime-query';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan,setBeachLife,setBeachCrowdStyle} from '../src/beach-macro';
import {addBeachFestival,addBeachGulls} from '../src/beach-festival';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {BEACH_ZONES} from '../src/beach-zone-layout';
afterEach(()=>{setBeachCrowdStyle('dense');setBeachLife(false);setBeachPlan(false);setCoastClose(false);setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
it('resolves the accepted dev route without expanding the visible or replay query',()=>{
 const raw=canonicalGameQuery(new URLSearchParams('at=4000'));expect(raw.toString()).toBe('at=4000');const result=resolveDevCoast(raw,true);expect(result.get('beachMacro')).toBe('right');expect(result.get('sunSide')).toBe('left');expect(result.get('beachLife')).toBe('1');expect(raw.toString()).toBe('at=4000');expect(resolveDevCoast(raw,false).toString()).toBe('at=4000');
 expect(resolveDevCoast(new URLSearchParams('coast=original'),true).has('beachMacro')).toBe(false);expect(resolveDevCoast(new URLSearchParams('beachMacro=b'),true).get('sunsetRoute')).toBe(null);
 expect(resolveDevCoast(new URLSearchParams('beach=dense'),true).get('beachLife')).toBe('1');
});
it('balances distinct pockets with clear entry/lifeguard corridors and submerged water groups',()=>{
 setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);setBeachPlan(true);setBeachLife(true);setBeachCrowdStyle('balanced');const track=coastWorkerRoad().track,root=new THREE.Group(),crowd=addBeachFestival(root,track.sample,5980),p=crowd.userData;
 expect(p.shore).toBeGreaterThan(100);expect(p.shore).toBeLessThan(300);expect(p.water).toBe(78);expect(p.parasols).toBeLessThan(30);
 for(const r of p.people){if(!r.water){expect(Math.abs(r.station-5980-BEACH_ZONES.entryForwardM)).toBeGreaterThanOrEqual(14);if(r.lateral>-48)expect(Math.abs(r.station-5980-BEACH_ZONES.lifeguardForwardM)).toBeGreaterThanOrEqual(14);}else expect(r.ground).toBeLessThanOrEqual(-5.5);}
 const gulls=addBeachGulls(root,track.sample,5980),before=JSON.stringify(gulls.userData.positions);gulls.userData.update(3);expect(gulls.count).toBe(6);expect(JSON.stringify(gulls.userData.positions)).not.toBe(before);
});
