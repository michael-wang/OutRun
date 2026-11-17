import {it,expect} from 'vitest';
import * as THREE from 'three';
import {CameraOrbit} from '../src/camera-orbit';
import {chaseTargets} from '../src/chase';

it('integrates frame-independent full orbit, holds on release and ignores disabled input',()=>{
 const a=new CameraOrbit(),b=new CameraOrbit();
 for(let i=0;i<600;i++)a.advance(1,1/60,true);
 for(let i=0;i<300;i++)b.advance(1,1/30,true);
 expect(a.angle).toBeCloseTo(b.angle,10);
 const held=a.angle;a.advance(.17,1,true);a.advance(0,.2,true);a.advance(-1,.2,false);
 expect(a.angle).toBe(held);a.reset();expect(a.angle).toBe(0);
 a.advance(1,.1,true);expect(a.angle).toBe(0);
 a.advance(0,.1,true);a.advance(1,.1,true);expect(a.angle).toBeGreaterThan(0);
});
it('rotates in world Y without changing follow height, radius or anchor',()=>{
 const o=new CameraOrbit(),p=new THREE.Vector3(13,7,-32);
 const original=chaseTargets(p,.4,16/9,.08),t={eye:original.eye.clone(),look:original.look.clone()};
 o.angle=Math.PI/2;o.apply(t,p);
 expect(t.eye.y).toBeCloseTo(original.eye.y);expect(t.look.y).toBeCloseTo(original.look.y);
 expect(t.eye.distanceTo(p)).toBeCloseTo(original.eye.distanceTo(p));
 expect(p.toArray()).toEqual([13,7,-32]);
 o.reset();const reset=chaseTargets(p,.4,16/9,.08);o.apply(reset,p);
 expect(reset.eye.toArray()).toEqual(original.eye.toArray());
});
