import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar,type BrakeLightController} from '../src/car';
import {isHighRevUpshift} from '../src/exhaust-effects';

describe('player-car arcade visual feedback',()=>{
  it('brightens existing shared rear lamp material without changing car mesh geometry',()=>{
    const car=createCar();
    const controller=car.userData.brakeLights as BrakeLightController;
    const before=new THREE.Box3().setFromObject(car);
    expect(controller).toBeDefined();
    const idle=controller.inspect();
    expect(idle.braking).toBe(false);
    controller.set(true);
    const active=controller.inspect();
    expect(active.braking).toBe(true);
    expect(active.emissiveIntensity).toBeGreaterThan(idle.emissiveIntensity*4);
    controller.set(false);
    expect(controller.inspect()).toEqual(idle);
    controller.set(true);
    controller.reset();
    expect(controller.inspect()).toEqual(idle);
    const after=new THREE.Box3().setFromObject(car);
    expect(after.equals(before)).toBe(true);
  });
  it('emits only on real, high-RPM throttle-on upshifts',()=>{
    expect(isHighRevUpshift(1,2,true,false,6900)).toBe(true);
    expect(isHighRevUpshift(2,3,true,false,5200)).toBe(true);
    expect(isHighRevUpshift(2,2,true,false,7000)).toBe(false);
    expect(isHighRevUpshift(4,3,true,false,7000)).toBe(false);
    expect(isHighRevUpshift(1,2,false,false,7000)).toBe(false);
    expect(isHighRevUpshift(1,2,true,true,7000)).toBe(false);
    expect(isHighRevUpshift(1,2,true,false,2500)).toBe(false);
  });
});
