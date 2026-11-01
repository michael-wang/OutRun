import {it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,TRAFFIC_LIMIT} from '../src/traffic';

it('a broken-down vehicle emits a soft, prominent seven-puff plume in one pooled draw',()=>{
 const scene=new THREE.Scene();
 const sample=(d:number)=>({
  position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
 });
 const broken={id:9999,type:0,distance:500,speed:0,group:9999,stationary:true as const,stopSide:1};
 const traffic=new Traffic(scene,sample as any,()=>7,69000,1,()=>true,[broken]);
 const camera=new THREE.PerspectiveCamera(47,915/412,1,1400);
 camera.position.set(0,3.6,350);
 traffic.update(0,350,0,0,camera,412);
 const smoke=scene.getObjectByName('breakdown-engine-smoke') as THREE.InstancedMesh;
 const material=smoke.material as THREE.MeshBasicMaterial;
 expect(traffic.inspect().breakdownSmoke).toBe(7);
 expect(traffic.inspect().smokeCapacity).toBe(TRAFFIC_LIMIT*7);
 expect(smoke.count).toBe(7);
 expect(smoke.geometry.type).toBe('PlaneGeometry');
 expect(material.transparent).toBe(true);
 expect(material.opacity).toBeGreaterThan(.5);
 expect(material.map).toBeInstanceOf(THREE.DataTexture);
 expect(material.map!.image.data.some((v:number,i:number)=>i%4===3&&v===0)).toBe(true);
 const matrix=new THREE.Matrix4(),scale=new THREE.Vector3(),position=new THREE.Vector3(),rotation=new THREE.Quaternion();
 smoke.getMatrixAt(0,matrix);matrix.decompose(position,rotation,scale);
 expect(scale.x).toBeGreaterThan(.5);
 expect(position.y).toBeGreaterThan(.5);
 expect(traffic.inspect().outlineColor).toBe('#d7ff00');
 traffic.reset();expect(smoke.count).toBe(0);
 traffic.dispose();expect(smoke.parent).toBeNull();
});
