import {afterEach,expect,it,vi} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan,setBeachLife} from '../src/beach-macro';
import {setBeach2,BEACH2,beach2Heading} from '../src/beach2-profile';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {coastBeachX} from '../src/coast-layout';
import {COAST_SUN} from '../src/coast-sun-direction';
import {addBeach2Macro} from '../src/beach2-macro';
import * as THREE from 'three';
import {addCoastSwimmers} from '../src/coast-swimmers';
import {BEACH2_COVE_PARTIES} from '../src/beach2-composition-layout';
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);setBeachPlan(true);setBeachLife(true);}
afterEach(()=>{setBeach2(false);setBeachMacro('none');setSunsetRoute(false);setSunSide(null);setBeachVista(false);setBeachFlow(false);setCoastClose(false);setBeachPlan(false);setBeachLife(false);});
it('preserves the complete outer route, sun, distance contract and five lanes',()=>{
 setup();const old=coastWorkerRoad(),sun=COAST_SUN.toArray();setBeach2(true);const next=coastWorkerRoad();
 expect(next.track.length).toBe(old.track.length);expect(COAST_SUN.toArray()).toEqual(sun);
 for(let d=350;d<=14550;d+=10){const a=old.track.sample(d),b=next.track.sample(d);expect(next.halfAt(d)).toBe(8.75);if(d<=BEACH2.start||d>=BEACH2.end){expect(b.position.toArray()).toEqual(a.position.toArray());expect(b.tangent.toArray()).toEqual(a.tangent.toArray());}}
});
it('joins without position or slope steps and removes the redundant left nose turn',()=>{
 setup();const baseline=coastWorkerRoad().track;setBeach2(true);const t=coastWorkerRoad().track;
 for(const d of [4800,4850,5150,5550,5850,6020,6250,6800]){expect(t.sample(d+.01).position.distanceTo(t.sample(d-.01).position)).toBeLessThan(.035);expect(t.sample(d+.01).tangent.angleTo(t.sample(d-.01).tangent)).toBeLessThan(.003);}
 for(let d=4801;d<6800;d+=2){const a=t.sample(d);expect(a.right.y).toBe(baseline.sample(d).right.y);expect(Math.abs(a.tangent.y)).toBeLessThan(.09);expect(Math.abs(a.curvature)).toBeLessThan(.012);expect(a.position.toArray().every(Number.isFinite)).toBe(true);}
 expect(Math.abs((beach2Heading(300)-beach2Heading(0))*180/Math.PI)).toBeLessThan(4);
});
it('uses the same real waterline for terrain and mask, with immersed swimmers and connected tower',()=>{
 setup();setBeach2(true);const t=coastWorkerRoad().track;
 const y=(d:number,x:number)=>{const p=t.sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 for(let d=4800;d<=6800;d+=5){const shore=coastBeachX(-26,d);expect(y(d,shore)).toBeCloseTo(-5,6);expect(y(d,shore-5)).toBeLessThan(-5);}
 const root=addBeach2Macro(new THREE.Scene(),t.sample);
 const actors=root.userData.waterActors as {water:number;depth:number;pose:string;bounds:THREE.Box3}[];
 expect(actors).toHaveLength(29);
 for(const actor of actors){
  expect(actor.bounds.min.y).toBeLessThan(actor.water);
  expect(actor.bounds.max.y).toBeGreaterThan(actor.water+.1);
  if(actor.pose==='wade')expect(Math.abs(actor.bounds.min.y-(actor.water-actor.depth))).toBeLessThan(.15);
 }
 expect(root.userData.poses).toMatchObject({lookout:3,'sand-keep':2,build:2,pat:2});
 expect(root.getObjectByName('instanced-beach-activity')?.children.every(c=>c instanceof THREE.InstancedMesh)).toBe(true);
 for(const p of root.userData.swimmers){expect(p.depth).toBeGreaterThan(.7);expect(p.depth).toBeLessThan(2);}
 for(const p of root.userData.shoreActivity.placements)if(!p.water)expect(p.ground).toBeGreaterThan(-4.5);
 // Reclaimed HUD4.80–5.15km must remain low, connected, genuinely dry shore.
 for(let d=5150;d<=5500;d+=5){const shore=coastBeachX(-26,d);expect(-10-shore).toBeGreaterThan(20);for(let x=shore+1;x<=-12;x+=2){expect(y(d,x)).toBeGreaterThan(-5);expect(y(d,x)).toBeLessThan(1);}}
 expect(root.userData.tower.ground).toBeCloseTo(5,4);
 for(const d of [6020,6050,6100])expect(y(d,-35)).toBeGreaterThan(4);
});

it('keeps composition on dry ground and separated from the roadway and swimming water',()=>{
 setup();setBeach2(true);const root=addBeach2Macro(new THREE.Scene(),coastWorkerRoad().track.sample);
 const rows=root.userData.shoreActivity.placements as {kind:string;station:number;lateral:number;ground:number;water:boolean}[];
 const people=rows.filter(p=>p.kind==='dry-person'||p.kind==='seated');
 expect(people.length).toBeGreaterThan(60);
 for(const p of rows){expect(Math.abs(p.lateral)).toBeGreaterThan(10);if(!p.water)expect(p.ground).toBeGreaterThan(-4.5);}
 for(const [lo,hi]of [[5100,5310],[5380,5510]]){
  const group=people.filter(p=>p.station>=lo&&p.station<=hi&&p.lateral<0);
  expect(group.some(p=>p.lateral>-28)).toBe(true);
  expect(group.some(p=>p.lateral<-38)).toBe(true);
 }
 expect(people.filter(p=>p.station>=5800&&p.station<5990)).toHaveLength(0);
 const pods=rows.filter(p=>p.kind.startsWith('swim-pod-'));
 expect(pods).toHaveLength(9);
 for(const p of pods){expect(p.water).toBe(true);expect(p.ground).toBeLessThan(-5.8);}
 expect(rows.filter(p=>p.kind==='sand-building')).toHaveLength(2);
 // Static batching must remain bounded as activity density changes.
 expect(root.children.filter(o=>o instanceof THREE.Mesh).length).toBeLessThan(15);
 expect(root.userData.swimmers.every((p:{depth:number})=>p.depth>.7&&p.depth<2)).toBe(true);
});

it('faces seats seaward and uses distinct flat path and raised flights on the cape',()=>{
 setup();setBeach2(true);const scene=addBeach2Macro(new THREE.Scene(),coastWorkerRoad().track.sample);
 const seats=scene.userData.shoreActivity.placements.filter((p:{kind:string})=>p.kind==='seat') as {occupied:boolean;seaward:number;yaw:number}[];
 expect(seats.every(s=>s.seaward>.83)).toBe(true);
 expect(seats.some(s=>s.occupied)&&seats.some(s=>!s.occupied)).toBe(true);
 expect(new Set(seats.map(s=>s.yaw.toFixed(2))).size).toBeGreaterThan(8);
 const walk=scene.userData.walk;
 expect(walk.risers).toBeGreaterThan(10);expect(walk.risers).toBeLessThan(walk.points.length/2);
 expect(walk.maxRiser).toBeLessThan(.19);
 expect(walk.points.at(-1).y-walk.points[0].y).toBeGreaterThan(6);
});

it('keeps the new scattered gravel and existing site fixtures in compatible static batches',()=>{
 setup();setBeach2(true);const error=vi.spyOn(console,'error');
 try {
  const scene=addBeach2Macro(new THREE.Scene(),coastWorkerRoad().track.sample);
  expect(scene.userData.shoreActivity.placements.filter((p:{kind:string})=>p.kind==='strand-margin')).toHaveLength(24);
  expect(error.mock.calls.flat().join(' ')).not.toContain('mergeGeometries() failed');
 } finally {error.mockRestore();}
});

it('keeps swimmer placement and wader feet when Ultra Water enables buoyancy',()=>{
 setup();
 setBeach2(true);
 const sample=coastWorkerRoad().track.sample;
 const batches=(uniforms?:Record<string,THREE.IUniform>)=>
  addBeach2Macro(new THREE.Scene(),sample,uniforms).getObjectByName('instanced-beach-activity')!.children as THREE.InstancedMesh[];
 const original=batches(),withWaves=batches({});
 expect(withWaves.map(m=>m.name)).toEqual(original.map(m=>m.name));
 const floating=new Set<THREE.Material|THREE.Material[]>();
 let waderBatches=0;
 for(const [i,m] of withWaves.entries()){
  const baseline=original[i];
  if(!/^(float-|wade-)/.test(m.name))expect(m.count).toBe(baseline.count);
  expect(m.instanceMatrix.array.slice(0,baseline.count*16)).toEqual(baseline.instanceMatrix.array);
  if(/^(float-|tread-|crawl-|short-ripple$)/.test(m.name)){
   expect(m.material).not.toBe(baseline.material);
   floating.add(m.material);
  }else{
   expect(m.material).toBe(baseline.material);
   if(m.name.startsWith('wade-'))waderBatches++;
  }
 }
 expect(floating.size).toBe(1);
 expect(waderBatches).toBeGreaterThan(0);
});

it('retains a level tower footing and a connected rocky shelf above the unchanged waterline',()=>{
 setup();setBeach2(true);
 const road=coastWorkerRoad().track;
 const ground=(d:number,x:number)=>{const p=road.sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 for(const d of [6018,6020,6022])for(const x of [-37,-35,-33])expect(ground(d,x)).toBeCloseTo(5,2);
 for(let d=5830;d<=6210;d+=5){
  const shore=coastBeachX(-26,d);
  expect(ground(d,shore)).toBeCloseTo(-5,5);
  expect(ground(d,shore-2)).toBeLessThan(-5);
  expect(ground(d,shore+3)).toBeGreaterThan(-5);
 }
 const crest=(d:number)=>ground(d,coastBeachX(-26,d)+19);
 expect(crest(5950)).toBeGreaterThan(crest(5900)+1);
 expect(crest(6000)).toBeGreaterThan(crest(5950)+1);
 for(const d of [6030,6080,6120,6170])expect(crest(d)).toBeGreaterThan(3.5);
});

it('moves the eight cape swimmers exactly once, removes only the five legacy cape markers and grounds the waders',()=>{
 setup();setBeach2(true);
 const sample=coastWorkerRoad().track.sample;
 const scene=new THREE.Scene();
 addCoastSwimmers(scene,sample,{});
 const coastBatch=(name:string)=>scene.getObjectByName(name) as THREE.InstancedMesh;
 expect(scene.getObjectByName('cape-marker-buoys')).toBeUndefined();
 const survivingPieces=Array.from(coastBatch('coast-swim-area').geometry.getAttribute('piece').array);
 expect(survivingPieces.filter(piece=>piece===5)).toHaveLength(5);
 expect(coastBatch('cove-crawl-lanes').count).toBe(10);
 expect(coastBatch('coast-swim-area').count).toBe(45);
 const root=addBeach2Macro(scene,sample,{});
 const people=root.userData.waterActors as {station:number;pose:string;bounds:THREE.Box3;depth:number}[];
 expect(people.length+coastBatch('cove-crawl-lanes').count/5).toBe(29+8);
 for(const party of BEACH2_COVE_PARTIES)for(const [s,,activity] of party){
  if(activity==='stroke')continue;
  const actor=people.find(p=>p.station===BEACH2.core+s)!;
  expect(actor.pose).toBe(activity==='ring'?'float':'wade');
  expect(actor.bounds.min.y).toBeLessThan(-5);
  expect(actor.bounds.max.y).toBeGreaterThan(-4.5);
  if(activity==='wade')expect(Math.abs(actor.bounds.min.y+5+actor.depth)).toBeLessThan(.15);
 }
});
