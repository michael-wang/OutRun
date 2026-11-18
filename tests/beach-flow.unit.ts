import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,beachFlow,macroLighthouseStation,macroLighthouseX,macroScenicDistance} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {coastBeachX} from '../src/coast-layout';
import {COAST_SUN} from '../src/coast-sun-direction';
import {canonicalGameQuery} from '../src/runtime-query';
import * as THREE from 'three';
import {addCoastResort} from '../src/coast-resort';
import {coastBarrierClearance} from '../src/coast-layout';
afterEach(()=>{setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);}
it('keeps the accepted start/turn/sun and creates only low-demand beach curvature',()=>{
 setup();const before=coastWorkerRoad().track,sun=COAST_SUN.clone();setBeachFlow(true);const after=coastWorkerRoad().track;
 expect(COAST_SUN.toArray()).toEqual(sun.toArray());expect(after.length).toBe(before.length);
 let lateralChange=0,maxGrade=0;
 for(let d=350;d<=14550;d+=10){const a=after.sample(d),b=before.sample(d);
  if(d<=4850||d>=8450){expect(a.position.distanceTo(b.position)).toBeLessThan(1e-6);expect(a.tangent.angleTo(b.tangent)).toBeLessThan(1e-6);}
  if(d>=4850&&d<=6550){expect(Math.abs(a.curvature)).toBeLessThan(.0004);expect(Math.abs(a.roadHeading-b.roadHeading)).toBeLessThan(.05);lateralChange=Math.max(lateralChange,Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z));}
  maxGrade=Math.max(maxGrade,Math.abs(a.tangent.y)/Math.hypot(a.tangent.x,a.tangent.z));
 }
 expect(lateralChange).toBeGreaterThan(15);expect(lateralChange).toBeLessThan(19);expect(maxGrade).toBeLessThan(.075);
 for(const d of [4850,5800,6420,6450,6550,7050,7400,8450]){expect(after.sample(d-.01).position.distanceTo(after.sample(d+.01).position)).toBeLessThan(.03);expect(after.sample(d-.01).tangent.angleTo(after.sample(d+.01).tangent)).toBeLessThan(.002);}
});
it('continues the elevated coast behind the tower and leaves the real waterline submerged',()=>{
 setup();setBeachFlow(true);const t=coastWorkerRoad().track,d=macroLighthouseStation(),x=macroLighthouseX();
 const height=(d:number,x:number)=>{const p=t.sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 for(const dz of [-11,0,11])for(const dx of [-11,0,11])expect(height(d+dz,x+dx)).toBeCloseTo(18,2);
 for(const at of [6500,6700,7000,7300])expect(height(at,x)).toBeGreaterThanOrEqual(18);
 expect(t.sample(7000).position.y).toBeGreaterThan(t.sample(6450).position.y+3.5);
 for(let at=5800;at<=8450;at+=20){const shore=coastBeachX(-26,at);expect(height(at,shore)).toBeCloseTo(-5,8);expect(height(at,shore-2)).toBeLessThan(-5);}
 for(const offset of [-50,8,69,128])for(let i=0;i<3;i++){const at=macroScenicDistance(5980+offset+i*3),shore=coastBeachX(-26,at)-1.1-(i%2)*1.5;expect(height(at,shore)).toBeLessThan(-5);}
});
it('gates the new comparison without altering old URLs',()=>{
 for(const q of ['beachFlow=1','beachMacro=b&beachFlow=1','beachMacro=right&sunsetRoute=1&beachFlow=1'])expect(canonicalGameQuery(new URLSearchParams(q)).has('beachFlow')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=right&sunsetRoute=1&beachVista=1&beachFlow=1')).has('beachFlow')).toBe(import.meta.env.DEV);
 setBeachFlow(true);expect(beachFlow()).toBe(false);
});
it('supports both ends of long visible guardrail beams on the new uphill road',()=>{
 setup();setBeachFlow(true);const road=coastWorkerRoad(),scene=new THREE.Scene();
 addCoastResort(scene,road.track.sample,road.halfAt,6096,6097);
 const beam=scene.children.find(o=>o instanceof THREE.InstancedMesh&&o.geometry.name==='coast-rail') as THREE.InstancedMesh;
 expect(beam).toBeDefined();const matrix=new THREE.Matrix4();beam.getMatrixAt(0,matrix);
 const ends=[new THREE.Vector3(0,0,-.5).applyMatrix4(matrix),new THREE.Vector3(0,0,.5).applyMatrix4(matrix)];
 expect(ends[1].y-ends[0].y).toBeGreaterThan(.7);
 for(const [i,d] of [6096-12.15/2,6096+12.15/2].entries()){
  const p=road.track.sample(d),x=-(road.halfAt(d)+coastBarrierClearance(d,-1));
  expect(ends[i].y).toBeCloseTo(coastBeachHeight(x,p.position.y,p.right.y,d)+.51,4);
 }
});
