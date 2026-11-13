import {it,expect} from 'vitest';
import * as THREE from 'three';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_STAGE} from '../src/content/coast-stage';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';
import {COAST_CROSSWALKS,coastDistrictAt,coastBarrierStyle,coastBarrierStoneAt,coastBarrierClearance,coastDriveBounds,COAST_BEACHES} from '../src/coast-layout';
import {addCoastResort} from '../src/coast-resort';
import {addCoastMountains} from '../src/coast-mountains';
import {farmClearing} from '../src/coast-farm-layout';
const runtime=coastWorkerRoad(),track=runtime.track,halfAt=runtime.halfAt,stage=runtime.stage;
const road=(start:number,end:number)=>prepareRoadChunk(track.sample,halfAt,()=>[1,0,0],start,end,track.length,false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections);

it('uses five full-width coastal lanes throughout the native scenic road',()=>{
 expect(COAST_STAGE.road.lanes).toBe(5);expect(COAST_STAGE.road.lanes*3.5).toBe(17.5);
 for(let d=350;d<=10350;d+=50){expect(COAST_STAGE.road.lanes).toBe(5);expect(halfAt(d)).toBe(8.75);}
});

it('replaces racing curbs and tall continuous rails; keeps crossings at districts and the farm visit',()=>{
 for(const at of COAST_CROSSWALKS){
  expect(!!coastDistrictAt(at)||farmClearing(at,20)||COAST_BEACHES.some(b=>Math.abs(at-b.distance)<b.radius*.8)).toBe(true);
  expect(['rail','block']).toContain(coastBarrierStyle(at,-1)); // continuous visible sea boundary
  const meshes=road(at-8,at+8);
  expect(meshes.some(m=>['edge-red','edge-white','rail'].includes(m.kind))).toBe(false);
  const paint=meshes.find(m=>m.kind==='line')!,p=track.sample(at);
  // Verify a dense crossing across both lane halves, beyond the two edge lines.
  const xs:number[]=[];for(let i=0;i<paint.positions.length;i+=3){const v=new THREE.Vector3().fromArray(paint.positions,i).sub(p.position);if(Math.abs(v.dot(p.tangent))<3)xs.push(v.dot(p.right));}
  expect(xs.length).toBeGreaterThan(100);
  expect(Math.min(...xs)).toBeLessThan(-8);expect(Math.max(...xs)).toBeGreaterThan(8);
 }
});
it('keeps concrete and rails outside the driven lanes, bounded in height and batched',()=>{
 const scene=new THREE.Scene(),stats=addCoastResort(scene,track.sample,halfAt,0,1000);
 expect(stats.draws).toBe(2);expect(scene.children).toHaveLength(2); // concrete stones and sparse seaward metal rails, no dark boulders
 const matrix=new THREE.Matrix4(),scale=new THREE.Vector3();
 for(const mesh of scene.children as THREE.InstancedMesh[]){
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);scale.setFromMatrixScale(matrix);expect(scale.y).toBeLessThanOrEqual(mesh.geometry.name==='coast-ungarded-natural-rock'?2.5:.721);
   const p=new THREE.Vector3().setFromMatrixPosition(matrix);
   let distance=Infinity;for(let d=0;d<=1010;d+=1)distance=Math.min(distance,p.clone().sub(track.sample(d).position).setY(0).length());
   expect(distance).toBeGreaterThan(9.35); // concrete stones sit just outside the new 10m paved verge
  }
  mesh.dispose();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
});
it('fades coastal grass warmth before the inland foothills',()=>{
 // Road chunks merge all cross-section strips into one geometry.
 const mesh=road(2350,2375).find(piece=>piece.kind==='grass')!;
 expect(mesh).toBeDefined();
 const p=track.sample(2350),position=new THREE.Vector3();
 let nearTotal=0,farTotal=0,nearCount=0,farCount=0;
 for(let i=0;i<mesh.positions.length;i+=3){
  position.fromArray(mesh.positions,i).sub(p.position);
  const x=position.dot(p.right),green=mesh.colors[i+1];
  if(x<50&&x>12){nearTotal+=green;nearCount++;}
  if(x>300){farTotal+=green;farCount++;}
 }
 expect(nearCount).toBeGreaterThan(10);
 expect(farCount).toBeGreaterThan(5);
 // More distant inland grass must not appear as a brighter yellow-green
 // patch than vegetation immediately beside the road.
 expect(farTotal/farCount).toBeLessThan(nearTotal/nearCount);
});
it('bakes two high inland mountain layers with a small fixed mesh budget',()=>{
 const scene=new THREE.Scene();addCoastMountains(scene,track.sample,track.length);
 expect(scene.children).toHaveLength(2);
 const origin=track.sample(0).position,axis=track.sample(track.length).position.clone().sub(origin).setY(0).normalize(),right=new THREE.Vector3(axis.z,0,-axis.x);if(right.dot(track.sample(5000).right)<0)right.negate();
 let triangles=0;
 for(const mesh of scene.children as THREE.Mesh[]){
  const p=mesh.geometry.attributes.position;let peak=0;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);peak=Math.max(peak,v.y);expect(v.sub(origin).dot(right)).toBeGreaterThan(400);}
  expect(peak).toBeGreaterThan(mesh.name.endsWith('0')?200:400);triangles+=mesh.geometry.index!.count/3;
  // Full slopes carry sunlight variation, instead of a single flat colour band.
  const normals=mesh.geometry.attributes.normal,colors=mesh.geometry.attributes.color;
  let darkest=Infinity,lightest=0,steep=0;
  for(let i=0;i<colors.count;i++){const l=colors.getX(i)+colors.getY(i)+colors.getZ(i);darkest=Math.min(darkest,l);lightest=Math.max(lightest,l);if(Math.abs(normals.getY(i))<.9)steep++;}
  // Normalize relief contrast to the baked brightness: the rear range is
  // intentionally much darker, so an absolute lightness gap is misleading.
  expect(lightest).toBeGreaterThan(0);
  expect((lightest-darkest)/lightest).toBeGreaterThan(.08);
  // Lower, gentler middle ridges naturally have fewer steep-facing vertices.
  // Still require meaningful relief on both mountain sheets.
  expect(steep).toBeGreaterThan(70);
  expect((mesh.material as THREE.MeshBasicMaterial).fog).toBe(false);
  mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
 expect(triangles).toBeLessThan(14000);
});

it('protects the entire sea-side with low visible rails and linked promenade blocks',()=>{
 for(const bay of COAST_BEACHES){
  const half=Math.min(440,bay.radius*.70);
  for(let d=Math.ceil((bay.distance-half+24)/12)*12;d<bay.distance+half-24;d+=12)
   if(!COAST_CROSSWALKS.some(at=>Math.abs(d-at)<14))
    expect(coastBarrierStyle(d,-1)).toBe('block');
 }
 for(let d=240;d<=1740;d+=12)
  expect(coastBarrierStyle(d,-1)).toBe('rail');
 expect(coastBarrierStyle(4100,1)).toBe('none'); // covered town drain; no rail
 expect(coastBarrierStyle(850,1)).toBe('block'); // rural concrete stones
 expect(coastBarrierStyle(8550,1)).toBe('none'); // unguarded fishing countryside
 expect(coastBarrierStyle(5500,1)).toBe('none'); // covered town drains have no metal rail
 expect(coastBarrierStyle(3300,1)).toBe('none'); // open visitor-coast drainage
 expect(coastBarrierStyle(2740,1)).toBe('none'); // visitor-coast gutter with no railing
 for(const at of COAST_CROSSWALKS){
  expect(['rail','block']).toContain(coastBarrierStyle(at,-1));
  expect(coastBarrierStyle(at,1)).toBe('opening');
 }
 const styles=Array.from({length:834},(_,i)=>coastBarrierStyle(i*12,-1));
 expect(styles.slice(1).filter((v,i)=>v!==styles[i]).length).toBeLessThan(50); // a few authored open/rail pockets, never 12m alternation
});

it('adds deterministic but non-periodic stone imperfections without moving into the roadway',()=>{
 const a=coastBarrierStoneAt(1548,-1);
 expect(coastBarrierStoneAt(1548,-1)).toEqual(a);
 expect(a.d).toBeGreaterThan(1546);
 expect(a.d).toBeLessThan(1550);
 expect(a.length).toBeGreaterThan(2.1);
 expect(a.length).toBeLessThan(3.3);
 expect(a.height).toBeGreaterThan(.38);
 expect(a.height).toBeLessThan(.5);
 expect(coastBarrierStoneAt(1560,-1)).not.toEqual(a);
 expect(coastBarrierStoneAt(1548,1).d).not.toEqual(a.d);
});


it('R5c: the visible seaward guardrail matches the real coast collision bound',()=>{
 for(const d of [350,1200,2560,4100,7500,10500,16250,20500,24200,29700]){
  const style=coastBarrierStyle(d,-1);
  expect(style==='rail'||style==='block').toBe(true);
  const limit=coastDriveBounds(d,8.75).left;
  const visible=-8.75-coastBarrierClearance(d,-1);
  expect(Math.abs(limit-visible)).toBeLessThan(.50);
 }
 const scene=new THREE.Scene(),stats=addCoastResort(scene,track.sample,halfAt,12000,12120);
 expect(stats.draws).toBeGreaterThan(0);
 const mesh=scene.children.find(x=>x instanceof THREE.InstancedMesh&&x.geometry.name==='coast-rail') as THREE.InstancedMesh;
 expect(mesh.count).toBeGreaterThan(15);
 scene.traverse(o=>{if(o instanceof THREE.InstancedMesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});
});
