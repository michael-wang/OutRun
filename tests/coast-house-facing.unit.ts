import {it,expect} from 'vitest';
import {COAST_HERO_TREE_SITES} from '../src/coast-nature';
import * as THREE from 'three';
import {coastHomeFacingYaw,houseApproachFrontScore,rotatedHouseExtent} from '../src/coast-house-facing';
import {COAST_RURAL_HOUSES,COAST_RURAL_SHOWCASE,RURAL_CREEK} from '../src/coast-rural-layout';
import {COAST_VILLAGE_SITES} from '../src/coast-village-layout';
import {FARM_HOMES,FARM_PLOTS} from '../src/coast-farm-layout';
import {addJourneyScenery} from '../src/scenery';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';

const track=createPilotTrack(COAST_ULTRA_STAGE);

it('keeps household orientations individual and presents the frontage to approaching drivers',()=>{
 const near=COAST_VILLAGE_SITES.filter(s=>s.kind==='home'&&!s.rear)
  .map(s=>coastHomeFacingYaw(s.key,'village')+s.yaw);
 const farm=FARM_HOMES.filter(s=>s.d!==1015&&s.d!==1065)
  .map(s=>coastHomeFacingYaw(s.key,'farm')+s.yaw);
 const shops=COAST_VILLAGE_SITES.filter(s=>s.kind!=='home')
  .map(s=>coastHomeFacingYaw(s.key,'shop'));
 expect(near.length).toBeGreaterThan(25);
 for(const yaw of [...near,...farm])expect(houseApproachFrontScore(yaw,35,65)).toBeGreaterThan(.56);
 expect(new Set(near.map(y=>Math.round(y*180/Math.PI))).size).toBeGreaterThanOrEqual(20);
 expect(shops.every(y=>Math.abs(y)<.20)).toBe(true); // shops remain town-like
 for(const context of ['farm','village','shop'] as const){
  expect(coastHomeFacingYaw(12345,context)).toBe(coastHomeFacingYaw(12345,context));
 }
});
it('puts the hero courtyard gate in a three-quarter approaching-camera view',()=>{
 const hero=COAST_RURAL_HOUSES.find(s=>s.kind==='courtyard')!;
 expect(COAST_RURAL_SHOWCASE.approachAt).toBe(850);
 expect(hero.d).toBe(1056);
 expect(hero.x).toBeLessThan(60);
 expect(hero.yaw).toBeGreaterThan(.32);
 // Model entrances/windows are local -X. With the CORRECT road-right
 // frame, PI faces the road; a positive extra angle reveals the gate.
 expect(houseApproachFrontScore(hero.yaw,hero.x,150)).toBeGreaterThan(.69);
 expect(houseApproachFrontScore(hero.yaw,hero.x,90)).toBeGreaterThan(.77);
 const footprint=rotatedHouseExtent(11.5,17,hero.yaw);
 expect(hero.x-footprint.right).toBeGreaterThan(RURAL_CREEK.right+5);
 expect(hero.d-footprint.along).toBeGreaterThan(1034);
 for(const house of COAST_RURAL_HOUSES){
  const [halfX,halfZ]=house.kind==='courtyard'?[11.5,17]:house.kind==='townhouse'?[4.5,5.5]:[6.5,8.5];
  const extent=rotatedHouseExtent(halfX,halfZ,house.yaw);
  expect(house.x-extent.right).toBeGreaterThan(34.1);
  expect(FARM_PLOTS.some(plot=>
   house.d+extent.along>plot.start&&house.d-extent.along<plot.end
   &&house.x+extent.right>plot.left&&house.x-extent.right<plot.right)).toBe(false);
 }
});
it('keeps a real gate-facing transform in the actual batched scenery, without new draw calls',()=>{
 const scene=new THREE.Scene(),stage=COAST_ULTRA_STAGE;
 const result=addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,
  d=>pilotSample(stage,d).halfWidth,d=>pilotWeights(stage,d),{
   start:1000,end:1100,openRoad:true,coastUltra:true,
   shoulders:d=>shoulderProfile(d,804),scenerySections:stage.scenerySections,
  });
 const meshes:THREE.InstancedMesh[]=[];
 scene.traverse(obj=>{if(obj instanceof THREE.InstancedMesh)meshes.push(obj);});
 const hero=meshes.find(m=>m.geometry.name==='coast-rural-courtyard')!;
 expect(hero).toBeDefined();
 expect(hero.count).toBe(1);
 const matrix=new THREE.Matrix4();hero.getMatrixAt(0,matrix);
 const entrance=new THREE.Vector3(-1,0,0).transformDirection(matrix);
 const site=COAST_RURAL_HOUSES.find(s=>s.kind==='courtyard')!;
 const eye=track.sample(site.d-150).position;
 const center=new THREE.Vector3().setFromMatrixPosition(matrix);
 const toViewer=eye.clone().sub(center).setY(0).normalize();
 expect(entrance.dot(toViewer)).toBeGreaterThan(.5);
 // Five former hand-built 2D-looking trees now render via the shared 3D
 // nature model, not as 15+ individual scenery primitive instances.
 expect(result.instances).toBeGreaterThan(18);
 expect(COAST_HERO_TREE_SITES).toHaveLength(5);
 expect(meshes.filter(m=>m.geometry.name.startsWith('coast-rural-'))).toHaveLength(4);
 const geos=new Set(meshes.map(m=>m.geometry));
 const mats=new Set(meshes.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]));
 geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
});
