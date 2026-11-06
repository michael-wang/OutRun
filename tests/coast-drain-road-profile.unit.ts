import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';
import {prepareRoadChunk} from '../src/road-chunk';
import {addCoastResort} from '../src/coast-resort';
import {coastBarrierStyle,coastBarrierClearance} from '../src/coast-layout';
import {coastDrainRightLimit,COAST_DRAIN_X,COAST_UTILITY_POLES} from '../src/coast-roadside-layout';
import {coastBarrierShadowAnchors} from '../src/coast-dusk-shadows';
import {addJourneyScenery} from '../src/scenery';
import {step,createState} from '../src/handling';

const track=createPilotTrack(stage),half=(d:number)=>pilotSample(stage,d).halfWidth;
const shoulder=(d:number)=>shoulderProfile(d,804);
function road(from:number,to:number){
 return prepareRoadChunk(track.sample,half,d=>pilotWeights(stage,d),from,to,track.length,
  false,true,[],shoulder,undefined,true,undefined,stage.scenerySections);
}
function lateralPositions(mesh:{positions:Float32Array},d:number){
 const center=track.sample(d),p=new THREE.Vector3();
 return Array.from({length:mesh.positions.length/3},(_,i)=>
  p.fromArray(mesh.positions,i*3).sub(center.position).dot(center.right));
}
it('replaces BEIGE shoulder with asphalt apron, a real gap for the ditch, and dry earth behind it',()=>{
 for(const d of [850,3990,8550]){
  const parts=road(d-11,d+11);
  const paved=parts.find(p=>p.kind==='asphalt')!,sand=parts.find(p=>p.kind==='sand')!;
  const dirt=parts.find(p=>p.kind==='grass')!;
  const asphaltX=lateralPositions(paved,d),sandX=lateralPositions(sand,d),grassX=lateralPositions(dirt,d);
  expect(Math.max(...asphaltX)).toBeGreaterThan(COAST_DRAIN_X.outerRoad-.35);
  expect(Math.max(...asphaltX)).toBeLessThan(COAST_DRAIN_X.leftLip+.35);
  expect(Math.max(...sandX)).toBeLessThan(9.25); // no tan apron 8.75–14.75m
  expect(Math.min(...grassX)).toBeGreaterThan(14.10); // no grass covering channel
 }
 const ordinary=road(20,40),ordinaryPaved=ordinary.find(p=>p.kind==='asphalt')!;
 const ordinarySand=ordinary.find(p=>p.kind==='sand')!;
 expect(Math.max(...lateralPositions(ordinaryPaved,30))).toBeLessThan(9.3);
 expect(Math.max(...lateralPositions(ordinarySand,30))).toBeGreaterThan(13.5);
});
it('delivers distinct Taiwan roadside treatments instead of one highway guardrail',()=>{
 expect(coastBarrierStyle(850,1)).toBe('block');
 expect(coastBarrierClearance(850,1)).toBe(1.05);
 expect(coastBarrierStyle(3990,1)).toBe('none');
 expect(coastBarrierStyle(8550,1)).toBe('none');
 expect(coastBarrierStyle(3990,-1)).toBe('rail'); // left sea safety unchanged
 for(const [start,end,right] of [[840,930,'block'],[3980,4080,'none'],[8540,8660,'none']] as const){
  const scene=new THREE.Scene();addCoastResort(scene,track.sample,half,start,end);
  const centers:number[]=[];
  for(const mesh of scene.children as THREE.InstancedMesh[]){
   for(let i=0;i<mesh.count;i++){
    const matrix=new THREE.Matrix4();mesh.getMatrixAt(i,matrix);
    const world=new THREE.Vector3().setFromMatrixPosition(matrix);
    // Curved highway: project against the closest road frame, not the
    // mid-section tangent (which can shift the measured side offset).
    let nearest=Infinity,x=0;
    for(let d=start;d<end;d+=2){
     const frame=track.sample(d),delta=world.clone().sub(frame.position);
     const longitudinal=Math.abs(delta.dot(frame.tangent));
     if(longitudinal<nearest){nearest=longitudinal;x=delta.dot(frame.right);}
    }
    if(x>0)centers.push(x);
   }
  }
  if(right==='block'){
   expect(centers.length).toBeGreaterThan(0);
   expect(Math.max(...centers)).toBeLessThan(11.4);
   expect(Math.min(...centers)).toBeGreaterThan(9.2);
  }else expect(centers).toHaveLength(0);
  for(const mesh of scene.children as THREE.InstancedMesh[]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
 }
});
it('keeps the third act drain invisible-wall safe while leaving normal road steering unchanged',()=>{
 const oldLimit=8.75+2.6;
 expect(coastDrainRightLimit(0,oldLimit)).toBe(oldLimit);
 expect(coastDrainRightLimit(850,oldLimit)).toBeLessThan(9.1);
 expect(coastDrainRightLimit(3990,oldLimit)).toBeLessThan(9.1);
 expect(coastDrainRightLimit(8550,oldLimit)).toBeLessThan(9.1);
 expect(coastDrainRightLimit(40,oldLimit)).toBeGreaterThan(9.1); // smooth approach
 const state=createState();state.distance=8550;state.lateral=10.2;state.speed=50;
 step(state,{gas:true,brake:false,steer:1},.016,0,1,8.75,0,0,coastDrainRightLimit);
 expect(state.lateral+1.13).toBeLessThan(COAST_DRAIN_X.leftLip-.08);
 const normal=createState();normal.distance=20;normal.lateral=10.2;normal.speed=50;
 step(normal,{gas:true,brake:false,steer:1},.016,0,1,8.75,0,0,coastDrainRightLimit);
 expect(normal.lateral).toBeGreaterThan(10);
});
it('mounts occasional lights ON existing poles without adding regular standalone lamps or new spacing',()=>{
 const mounted=COAST_UTILITY_POLES.filter(p=>p.lamp);
 expect(mounted.map(p=>p.d)).toEqual(expect.arrayContaining([906,1257,4060,4316,8640,9106]));
 expect(mounted.length).toBeGreaterThan(10);
 expect(mounted.length).toBeLessThan(COAST_UTILITY_POLES.length*.42);
 for(const d of [906,4060,8640]){
  const scene=new THREE.Scene();
  const result=addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,
   half,d=>pilotWeights(stage,d),{
    start:Math.floor(d/1000)*1000,end:Math.floor(d/1000)*1000+1000,
    openRoad:true,coastUltra:true,shoulders:shoulder,scenerySections:stage.scenerySections,
   });
  expect(result.instances).toBeGreaterThan(20);
  const lit:THREE.InstancedMesh[]=[];
  scene.traverse(o=>{if(o instanceof THREE.InstancedMesh){
   const m=o.material as THREE.MeshStandardMaterial;
   if(m.color.getHexString()==='f8dfaa'&&m.emissiveIntensity>.5)lit.push(o);
  }});
  expect(lit.length).toBeGreaterThanOrEqual(1);
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);const mat=o.material as THREE.Material;if(mat)materials.add(mat);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 }
 const shadows=coastBarrierShadowAnchors(1600,half);
 expect(shadows.some(s=>s.kind==='lamp'&&s.d===906&&s.x===18.7)).toBe(true);
 expect(shadows.some(s=>s.kind==='lamp'&&s.d>=780&&s.d<1515&&s.d!==906&&s.d!==1257)).toBe(false);
});
