import {expect,it} from 'vitest';
import * as THREE from 'three';
import {Traffic,trafficRecipe,TRAFFIC_LIMIT} from '../src/traffic';
import {roadHidesVehicle,trafficOutlineGeometry,trafficOutlineRadius,trafficOutlineStrength,TRAFFIC_OUTLINE} from '../src/traffic-outline';

const eye=new THREE.Vector3(0,3.6,-8),aim=new THREE.Vector3(0,1.5,220);
const road=(height:(d:number)=>number,x=0)=>(d:number)=>({position:new THREE.Vector3(x,height(d),d),right:new THREE.Vector3(1,0,0)});
it('traffic outline geometry stays a bounded hull for every vehicle type',()=>{
 for(let type=0;type<4;type++){
  const geometry=trafficOutlineGeometry(type);
  geometry.computeBoundingBox();
  expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
  expect(geometry.boundingBox!.max.y).toBeGreaterThan(1.5);
  expect(geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(.19);
  geometry.dispose();
 }
});
it('outline rim grows with viewing distance without an unbounded world-space halo',()=>{
 expect(trafficOutlineRadius(150,47,412)).toBeGreaterThan(trafficOutlineRadius(30,47,412));
 expect(trafficOutlineRadius(1000,47,412)).toBe(TRAFFIC_OUTLINE.maximumMeters);
 expect(trafficOutlineRadius(1,47,412)).toBe(TRAFFIC_OUTLINE.minimumMeters);
});
it('distant yellow rim fades to zero before the car becomes a near obstacle',()=>{
 expect(trafficOutlineStrength(-10)).toBe(0);
 expect(trafficOutlineStrength(TRAFFIC_OUTLINE.nearCutoffMeters)).toBe(0);
 expect(trafficOutlineStrength((TRAFFIC_OUTLINE.nearCutoffMeters+TRAFFIC_OUTLINE.fullStrengthMeters)/2)).toBeCloseTo(.5);
 expect(trafficOutlineStrength(TRAFFIC_OUTLINE.fullStrengthMeters)).toBe(1);
 expect(trafficOutlineStrength(1000)).toBe(1);
});
it('crest hint requires an actual on-road obstruction in front of a nearby vehicle',()=>{
 const half=()=>7;
 expect(roadHidesVehicle(road(()=>0),half,0,220,eye,aim)).toBe(false);
 expect(roadHidesVehicle(road(d=>8*Math.exp(-(((d-110)/30)**2))),half,0,220,eye,aim)).toBe(true);
 expect(roadHidesVehicle(road(d=>8*Math.exp(-(((d-110)/30)**2)),55),half,0,220,eye,aim)).toBe(false);
 expect(roadHidesVehicle(road(()=>10),half,0,400,eye,new THREE.Vector3(0,11.5,400))).toBe(false);
});
it('traffic reuses four outline instances and resets all optional crest hints',()=>{
 const scene=new THREE.Scene(),flat=(d:number)=>({...road(()=>0)(d),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0}),traffic=new Traffic(scene,flat as any,()=>7,69000,1);
 const camera=new THREE.PerspectiveCamera(47,915/412,.1,1400);camera.position.set(0,3.6,492);
 traffic.update(0,500,0,0,camera,412);
 const outlines=scene.children.filter(o=>o.name.startsWith('vehicle-outline-')) as THREE.InstancedMesh[];
 expect(outlines).toHaveLength(4);
 expect((outlines[0].material as THREE.MeshBasicMaterial).color.getHexString()).toBe('ffea38');
 expect(outlines.reduce((sum,m)=>sum+m.count,0)).toBeGreaterThan(0);
 const initial=traffic.inspect();
 expect(outlines.reduce((sum,m)=>sum+m.count,0)).toBe(
  initial.actors.filter(a=>a.visible&&trafficOutlineStrength(a.distance-500)>0).length
 );
 // Near traffic keeps its unmodified model, while farther cars remain highlighted.
 camera.position.set(0,3.6,742);traffic.update(.1,750,0,0,camera,412);
 const approaching=traffic.inspect();
 expect(approaching.actors.some(a=>a.visible&&a.distance-750<=TRAFFIC_OUTLINE.nearCutoffMeters)).toBe(true);
 expect(approaching.outlineInstances.reduce((sum,n)=>sum+n,0)).toBe(
  approaching.actors.filter(a=>a.visible&&trafficOutlineStrength(a.distance-750)>0).length
 );
 expect(scene.children.filter(o=>o.name.startsWith('vehicle-crest-hint')&&o.visible)).toHaveLength(0);
 traffic.reset();expect(outlines.every(m=>m.count===0)).toBe(true);
 traffic.dispose();expect(outlines.every(m=>m.parent===null)).toBe(true);
});

it('crest hint pool activates behind a hill and uses the road depth buffer',()=>{
 const scene=new THREE.Scene();
 const sample=(d:number)=>({...road(q=>9*Math.exp(-(((q-570)/22)**2)))(d),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0});
 const traffic=new Traffic(scene,sample as any,()=>7,69000,1),camera=new THREE.PerspectiveCamera(47,915/412,.1,1400);
 camera.position.set(0,3.6,492);traffic.update(0,500,0,0,camera,412);
 expect(traffic.inspect().crestHints).toBeGreaterThan(0);
 const active=scene.children.filter(o=>o.name.startsWith('vehicle-crest-hint')&&o.visible) as THREE.LineSegments[];
 expect(active).toHaveLength(traffic.inspect().crestHints);
 expect((active[0].material as THREE.LineBasicMaterial).depthFunc).toBe(THREE.GreaterDepth);
 traffic.reset();expect(active.every(l=>!l.visible)).toBe(true);
 traffic.dispose();
});

it('near-outline cutoff never interrupts the driving loop or hill warning checks',()=>{
 const scene=new THREE.Scene(),sample=(d:number)=>({
  ...road(q=>9*Math.exp(-(((q-570)/25)**2)))(d),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
 });
 const traffic=new Traffic(scene,sample as any,()=>7,69000,1);
 const camera=new THREE.PerspectiveCamera(47,915/412,.1,1400);
 const first=trafficRecipe(1,69000)[0].distance;
 let sawFar=false,sawNear=false;
 // The first traffic group passes through both outline distances and the 300m crest window.
 for(let frame=0;frame<240;frame++){
  const time=frame/20,player=first-270+time*60;
  camera.position.set(0,3.6,player-8);
  expect(()=>traffic.update(time,player,0,60,camera,412)).not.toThrow();
  const report=traffic.inspect(),car=report.actors.find(a=>a.id===0);
  expect(report.actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);
  expect(report.outlineInstances.reduce((sum,n)=>sum+n,0)).toBe(
   report.actors.filter(a=>a.visible&&trafficOutlineStrength(a.distance-player)>0).length
  );
  if(car?.visible){
   if(car.distance-player>=TRAFFIC_OUTLINE.fullStrengthMeters)sawFar=true;
   if(car.distance-player<=TRAFFIC_OUTLINE.nearCutoffMeters)sawNear=true;
  }
 }
 expect(sawFar).toBe(true);
 expect(sawNear).toBe(true);
 traffic.dispose();
});
