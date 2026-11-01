import {expect,it} from 'vitest';
import * as THREE from 'three';
import {Traffic} from '../src/traffic';
import {roadHidesVehicle,trafficOutlineGeometry,trafficOutlineRadius,TRAFFIC_OUTLINE} from '../src/traffic-outline';

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
it('crest hint requires an actual on-road obstruction in front of a nearby vehicle',()=>{
 const half=()=>7;
 expect(roadHidesVehicle(road(()=>0),half,0,220,eye,aim)).toBe(false);
 expect(roadHidesVehicle(road(d=>8*Math.exp(-((d-110)/30)**2)),half,0,220,eye,aim)).toBe(true);
 expect(roadHidesVehicle(road(d=>8*Math.exp(-((d-110)/30)**2),55),half,0,220,eye,aim)).toBe(false);
 expect(roadHidesVehicle(road(()=>10),half,0,400,eye,new THREE.Vector3(0,11.5,400))).toBe(false);
});
it('traffic reuses four outline instances and resets all optional crest hints',()=>{
 const scene=new THREE.Scene(),flat=road(()=>0),traffic=new Traffic(scene,flat as any,()=>7,69000,1);
 const camera=new THREE.PerspectiveCamera(47,915/412,.1,1400);camera.position.set(0,3.6,492);
 traffic.update(0,500,0,0,camera,412);
 const outlines=scene.children.filter(o=>o.name.startsWith('traffic-outline-')) as THREE.InstancedMesh[];
 expect(outlines).toHaveLength(4);
 expect(outlines.reduce((sum,m)=>sum+m.count,0)).toBeGreaterThan(0);
 expect(scene.children.filter(o=>o.name.startsWith('traffic-crest-hint')&&o.visible)).toHaveLength(0);
 traffic.reset();expect(outlines.every(m=>m.count===0)).toBe(true);
 traffic.dispose();expect(outlines.every(m=>m.parent===null)).toBe(true);
});
