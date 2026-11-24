import {it,expect} from 'vitest';
import * as THREE from 'three';
import {addCoastGullFlights} from '../src/coast-gull-flights';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
it('uses a bounded flock per authored site, independent flight phases and continuous motion',()=>{
 const sample=coastWorkerRoad().track.sample,root=new THREE.Group();
 const flights=addCoastGullFlights(root,sample,{station:6020,position:new THREE.Vector3(0,5,0)});
 flights.update(2,350);expect(root.children.every(b=>!b.visible)).toBe(true);
 for(const site of flights.inspect()){
  flights.update(2,site.station);
  const active=flights.inspect().filter(s=>s.active);expect(active).toHaveLength(1);
  const a=active[0].birds;flights.update(2.02,site.station);
  const b=flights.inspect().find(s=>s.active)!.birds;
  for(let i=0;i<a.length;i++){
   const delta=new THREE.Vector3().fromArray(a[i].position).distanceTo(new THREE.Vector3().fromArray(b[i].position));
   expect(delta).toBeGreaterThan(.01);expect(delta).toBeLessThan(.4);
  }
  expect(new Set(b.map(bird=>bird.bank.toFixed(3))).size).toBeGreaterThan(1);
 }
 expect(root.children.every(b=>b.frustumCulled)).toBe(true);
});