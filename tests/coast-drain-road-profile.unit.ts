import {coastLampAtlas,COAST_LAMP_RANGE} from '../src/coast-lamp-lighting';
import {addCoastDusk} from '../src/coast-dusk';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {it,expect} from 'vitest';
import * as THREE from 'three';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {shoulderProfile} from '../src/road-profile';
import {prepareRoadChunk} from '../src/road-chunk';
import {addCoastResort} from '../src/coast-resort';
import {coastBarrierStyle,coastBarrierClearance,coastDriveBounds} from '../src/coast-layout';
import {COAST_DRAIN_X,COAST_LAMP_HEAD,COAST_UTILITY_POLES} from '../src/coast-roadside-layout';
import {GuardrailContact} from '../src/guardrail-contact';
import {coastBarrierShadowAnchors} from '../src/coast-dusk-shadows';
import {addJourneyScenery} from '../src/scenery';
import {step,createState} from '../src/handling';

const runtime=coastWorkerRoad(),track=runtime.track,stage=runtime.stage,half=runtime.halfAt;
const shoulder=(d:number)=>shoulderProfile(d,804);
function road(from:number,to:number){
 return prepareRoadChunk(track.sample,half,runtime.weightsAt,from,to,track.length,
  false,true,[],shoulder,undefined,true,undefined,stage.scenerySections);
}
function lateralPositions(mesh:{positions:Float32Array},d:number){
 // Chunk vertices span d +/- 11m. A single mid-frame projection invents
 // extra lateral width around R5's new banked bends. Compare each point
 // against its closest LOCAL road frame in the horizontal world plane.
 const frames=Array.from({length:12},(_,i)=>track.sample(d-11+i*2));
 const p=new THREE.Vector3();
 return Array.from({length:mesh.positions.length/3},(_,i)=>{
  p.fromArray(mesh.positions,i*3);
  let nearest=frames[0],distance=Infinity;
  for(const frame of frames){
   const dx=p.x-frame.position.x,dz=p.z-frame.position.z,dist=dx*dx+dz*dz;
   if(dist<distance){distance=dist;nearest=frame;}
  }
  const norm=Math.hypot(nearest.right.x,nearest.right.z);
  return ((p.x-nearest.position.x)*nearest.right.x+
   (p.z-nearest.position.z)*nearest.right.z)/norm;
 });
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
 expect(coastBarrierStyle(3990,-1)).toBe('rail'); // low visible protection along the open coast
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
it('keeps the car fully on asphalt on BOTH sides, matching guardrail and stone positions',()=>{
 for(const [d,side] of [[850,-1],[500,-1],[2500,-1],[3990,1],[8550,1]] as const){
  const bounds=coastDriveBounds(d,half(d));
  expect(bounds.left).toBeLessThanOrEqual(-10.95);
  expect(bounds.right).toBeLessThanOrEqual(COAST_DRAIN_X.leftLip+.07);
  const contact=new GuardrailContact(1.15,2.1,x=>coastDriveBounds(x,half(x)));
  const state=createState();state.distance=d;state.speed=60;
  state.lateral=side<0?-13:13;
  const impact=contact.update(state,d-0.5,state.lateral-side*.5,.016,true);
  expect(impact).toBeGreaterThan(0);
  expect(state.lateral).toBeGreaterThanOrEqual(bounds.left+1.15-.1);
  expect(state.lateral).toBeLessThanOrEqual(bounds.right-1.15+.1);
  expect(contact.inspect().impacts).toBe(1);
 }
 const beach=coastDriveBounds(2500,8.75);
 expect(beach.left).toBeCloseTo(-8.75-coastBarrierClearance(2500,-1)-.38);
 const metal=coastDriveBounds(500,8.75);
 expect(metal.left).toBeCloseTo(-8.75-coastBarrierClearance(500,-1)+.05);
 const rightStone=coastDriveBounds(850,8.75);
 expect(rightStone.right).toBeGreaterThan(COAST_DRAIN_X.outerRoad);
});
it('selects the nearest available world-Z lamp across overlapping light ranges',()=>{
 const heads=COAST_UTILITY_POLES.filter(p=>p.lamp).map(p=>{
  const frame=track.sample(p.d),v=frame.position.clone().addScaledVector(frame.right,p.x-COAST_LAMP_HEAD.reach);
  v.y=coastBeachHeight(p.x,frame.position.y,frame.right.y,p.d)+p.height-COAST_LAMP_HEAD.drop;
  return v;
 });
 const {texture,firstZ,cells}=coastLampAtlas(heads);
 try{
  const data=texture.image.data as Float32Array;
  // A curved road compresses world-Z separation between fixtures.
  // A one-fixture-per-cell atlas cannot represent both lamps' FULL 38m
  // footprint in their overlap. Assert what the production shader actually
  // implements: the nearest lamp by world-Z, without missing either region.
  const ordered=[...heads].sort((a,b)=>a.z-b.z);
  const nearest=(z:number)=>ordered.reduce((best,other)=>
   Math.abs(other.z-z)<Math.abs(best.z-z)?other:best,ordered[0]);
  const overlaps=ordered.filter((head,i)=>
   i>0&&head.z-ordered[i-1].z<2*COAST_LAMP_RANGE);
  for(const head of heads){
   for(let z=Math.floor(head.z-COAST_LAMP_RANGE);z<=Math.floor(head.z+COAST_LAMP_RANGE);z++){
    const cell=THREE.MathUtils.clamp(z-firstZ,0,cells-1);
    const fixture=nearest(firstZ+cell+.5);
    expect(Math.abs(data[cell*4+2]-fixture.z)).toBeLessThan(.001);
   }
  }
  // R5 scenery acceptance must evaluate the 2D lamp/parallax limitation
  // whenever the road curls back in world Z; see the map brief.
  expect(overlaps.length).toBeLessThan(heads.length);
 }finally{texture.dispose();}
});
it('lights the actual utility fixtures after a jump in either direction',()=>{
 const scene=new THREE.Scene(),dusk=addCoastDusk(scene,track.sample);
 const lights=scene.children.filter((o):o is THREE.PointLight=>o instanceof THREE.PointLight);
 expect(lights).toHaveLength(1);
 for(const d of [906,8640,4060]){
  dusk.update(d);
  const pole=COAST_UTILITY_POLES.find(p=>p.d===d)!,frame=track.sample(d);
  const expected=frame.position.clone().addScaledVector(frame.right,pole.x-COAST_LAMP_HEAD.reach);
  expected.y=coastBeachHeight(pole.x,frame.position.y,frame.right.y,d)+pole.height-COAST_LAMP_HEAD.drop;
  expect(lights.some(l=>l.position.distanceTo(expected)<.01&&l.intensity>0&&l.distance>20&&!l.castShadow)).toBe(true);
 }
});
it('resolves PC pole bases after sorting the bulbs and keeps the original mobile atlas size',()=>{
 const heads=[new THREE.Vector3(4,13,165),new THREE.Vector3(-2,12,10)];
 const poles=new Map(heads.map((head,i)=>[head,new THREE.Vector4(head.x-2.96,head.y-9,head.z,i)]));
 const mobile=coastLampAtlas(heads),pc=coastLampAtlas(heads,poles);
 try{
  expect(mobile.poleShadows).toBe(false);
  expect(pc.texture.image.height).toBe(mobile.texture.image.height+1);
  for(const head of heads){
   const cell=Math.floor(head.z)-pc.firstZ;
   const index=pc.texture.image.data[cell*4+3];
   expect(index).toBeGreaterThanOrEqual(pc.cells);
   const base=new THREE.Vector4().fromArray(pc.texture.image.data,index*4);
   for(let i=0;i<4;i++)expect(base.getComponent(i)).toBeCloseTo(poles.get(head)!.getComponent(i),4);
   expect(mobile.texture.image.data[cell*4+3]).toBe(0);
  }
 }finally{pc.texture.dispose();mobile.texture.dispose();}
});
it('mounts a warm fixture ON every real canal-side utility pole',()=>{
 const mounted=COAST_UTILITY_POLES.filter(p=>p.lamp);
 expect(mounted.map(p=>p.d)).toEqual(expect.arrayContaining([906,4060,4316,8640]));
 expect(mounted.length).toBe(COAST_UTILITY_POLES.length);
 for(const d of [906,4060,8640]){
  const scene=new THREE.Scene();
  const result=addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,
   half,runtime.weightsAt,{
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
 const pole=COAST_UTILITY_POLES.find(p=>p.d===906)!;
 expect(shadows.some(s=>s.kind==='lamp'&&s.d===pole.d&&s.x===pole.x)).toBe(true);
 expect(shadows.filter(s=>s.kind==='lamp'&&s.d>=780&&s.d<1515).length)
  .toBe(COAST_UTILITY_POLES.filter(p=>p.d>=780&&p.d<1515).length);
});
