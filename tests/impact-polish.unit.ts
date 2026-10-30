import {it,expect} from 'vitest';
import * as THREE from 'three';
import {ImpactSparks} from '../src/impact-sparks';
import {EngineSound} from '../src/sound';
import {Traffic} from '../src/traffic';
import {TireEffects} from '../src/tire-effects';
it('compact smoke fills high-speed wheel travel at 30 FPS without exceeding its pool',()=>{
 const scene=new THREE.Scene(),fx=new TireEffects(scene);let z=0;
 for(let i=0;i<60;i++){z+=4.5;fx.update((i+1)/30,78,1,['rear-wheel--1','rear-wheel-1','front-wheel--1','front-wheel-1'].map((name,j)=>({name,gap:0,onRoad:true,surface:[j%2?1:-1,0,z+(j>1?5:0)]})),1);}
 expect(fx.inspect().emittedByWheel.every(n=>n>180)).toBe(true);expect(fx.inspect().particles).toBeLessThanOrEqual(192);fx.dispose();
});
it('vehicle sparks burst once and fade, while guardrails retain continuous contact emission',()=>{
 const scene=new THREE.Scene(),p=new THREE.Vector3(),r=new THREE.Vector3(1,0,0),t=new THREE.Vector3(0,0,1),sparks=new ImpactSparks(scene,true);
 sparks.burst(0,p,r,t,.2);sparks.update(.01,p,r,t,1);const small=sparks.inspect().particles;expect(small).toBeGreaterThan(20);expect(sparks.inspect().flash).toBe(true);
 sparks.clear();sparks.burst(0,p,r,t,1);sparks.update(.01,p,r,t,1);expect(sparks.inspect().particles).toBeGreaterThan(small);
 for(let i=2;i<100;i++)sparks.update(i/60,p,r,t,1);expect(sparks.inspect().particles).toBe(0);expect(sparks.inspect().flash).toBe(false);sparks.dispose();
 const rail=new ImpactSparks(scene);for(let i=0;i<100;i++)rail.update(i/60,p,r,t,1);expect(rail.inspect().particles).toBeGreaterThan(0);rail.clear();expect(rail.inspect().particles).toBe(0);rail.dispose();expect(scene.children).toHaveLength(0);
});
it('surface audio follows wheel contact and speed without skid or audio unlock',()=>{
 const audio=new EngineSound();audio.update(60,0,true);for(let i=0;i<60;i++)audio.surface(60,0,1/60);expect(audio.inspect().gravelLevel).toBe(0);
 for(let i=0;i<60;i++)audio.surface(60,2,1/60);expect(audio.inspect().gravelLevel).toBeGreaterThan(.15);expect(audio.inspect().skidIntensity).toBe(0);
 for(let i=0;i<60;i++)audio.surface(60,0,1/60);expect(audio.inspect().gravelLevel).toBeLessThan(.0001);audio.impact(1,'vehicle');expect(audio.inspect().lastImpact).toBe('vehicle');audio.impact(1);expect(audio.inspect().lastImpact).toBe('guardrail');audio.pause();expect(audio.inspect().gravelLevel).toBe(0);
});
it('traffic contact shadows are distance invariant, grade aligned and bounded',()=>{
 const scene=new THREE.Scene(),sample=(d:number)=>({position:new THREE.Vector3(0,.1*d,d),right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,.1,1).normalize(),roadHeading:0,curvature:0}),traffic=new Traffic(scene,sample,()=>7,69000,1);
 traffic.update(0,350);const a=traffic.inspect().actors.find(a=>a.id===0)!;let previous:number[]|undefined;
 for(const gap of [200,100,50,25]){traffic.update(0,a.distance-gap);const info=traffic.inspect(),shadows=scene.getObjectByName('traffic-contact-shadows') as THREE.InstancedMesh,index=info.actors.findIndex(b=>b.id===a.id),m=new THREE.Matrix4();shadows.getMatrixAt(index,m);expect(shadows.count).toBe(info.actors.filter(a=>a.visible).length);expect(m.elements[13]).toBeCloseTo(a.distance*.1+.035,3);if(previous)expect(m.elements).toEqual(previous);previous=[...m.elements];expect(info.shadowCasting).toBe(false);}
 traffic.reset();expect(traffic.inspect().contactShadows).toBe(0);traffic.dispose();expect(scene.children).toHaveLength(0);
});
