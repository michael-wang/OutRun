import {it,expect} from 'vitest';
import * as THREE from 'three';
import {createState} from '../src/handling';
import {GuardrailContact} from '../src/guardrail-contact';
import {CANYON_BEND} from '../src/canyon-identity';
import {TireEffects,type TireContact} from '../src/tire-effects';
it('sweeps the finite rail, contains a yawed car and latches held-outward contact',()=>{
 const g=new GuardrailContact(1.55,2.8),s={...createState(),distance:620,lateral:8,speed:80,heading:.35,appliedSteer:1};
 const hard=g.update(s,590,6,.05,true);expect(hard).toBeGreaterThan(.7);expect(s.speed).toBeLessThan(65);expect(s.lateral+g.extent(s.heading+g.yaw)).toBeLessThanOrEqual(CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness);
 for(let i=0;i<300;i++){const old=s.lateral;s.lateral+=.15;g.update(s,620,old,1/120,true);}expect(g.impacts).toBe(1);
 s.appliedSteer=-1;s.lateral=4;g.update(s,620,4,.02,true);s.lateral=8;expect(g.update(s,620,4,.02,true)).toBeGreaterThan(0);expect(g.impacts).toBe(2);g.reset();expect(g.impacts).toBe(0);
 const light={...createState(),distance:650,lateral:g.limit(0)+.001,speed:25,appliedSteer:.25};expect(g.update(light,649,light.lateral-.01,.02,true)).toBeLessThan(.3);expect(light.speed).toBeGreaterThan(23);
});
it('does nothing on other seeds or outside the rail interval',()=>{
 for(const [distance,enabled] of [[400,true],[1000,true],[650,false]] as const){const g=new GuardrailContact(1.55,2.8),s={...createState(),distance,lateral:9,speed:80};const before={...s};expect(g.update(s,distance-1,8,.01,enabled)).toBe(0);expect(s).toEqual(before);}
});
it('dust is contact/speed driven, independent of skid and never makes marks',()=>{
 const scene=new THREE.Scene(),dust=new TireEffects(scene,'dust');const contacts=(z:number,road:boolean):TireContact[]=>['rear','front'].flatMap(a=>[-1,1].map(side=>({name:`${a}-wheel-${side}`,surface:[side,0,z],onRoad:road,gap:0,normal:[0,1,0]})));
 for(let i=1;i<60;i++)dust.update(i/60,70,1,contacts(i,true),200);expect(dust.inspect().particles).toBe(0);
 for(let i=60;i<120;i++)dust.update(i/60,70,0,contacts(i,false),200);expect(dust.inspect().particles).toBeGreaterThan(0);expect(dust.inspect().segments).toBe(0);
 for(let i=120;i<360;i++)dust.update(i/60,70,0,contacts(i,true),200);expect(dust.inspect().particles).toBe(0);dust.clear();expect(dust.inspect().emittedByWheel).toEqual([0,0,0,0]);dust.dispose();expect(scene.children).toHaveLength(0);
});
