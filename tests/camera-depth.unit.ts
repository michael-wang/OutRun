import {expect,it} from 'vitest';
import * as THREE from 'three';
import {CHASE,CHASE_NEAR} from '../src/chase';

it('keeps enough perspective depth precision for distant road over 10cm recessed sand',()=>{
 const far=2200,road=1000,sand=road+.1,bits=2**24;
 const depth=(near:number,distance:number)=>{
  const camera=new THREE.PerspectiveCamera(CHASE.fov,16/9,near,far);
  return (new THREE.Vector3(0,0,-distance).project(camera).z+1)/2;
 };
 const difference=(near:number)=>Math.abs(depth(near,road)-depth(near,sand))*bits;
 expect(CHASE_NEAR).toBe(1);
 expect(difference(CHASE_NEAR)).toBeGreaterThan(1);
 expect(difference(CHASE_NEAR)).toBeGreaterThan(difference(.1)*8);
});
