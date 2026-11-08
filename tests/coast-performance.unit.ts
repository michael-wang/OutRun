import {describe,it,expect} from 'vitest';
import {OceanCadence,natureVisible} from '../src/coast-performance';
// @ts-ignore Vendored JavaScript has no declarations.
import {OceanSim} from '../src/ultra-water/water/OceanSim.js';

describe('sustained mobile coast workload',()=>{
 it('caps ocean work at 30Hz on 60/90/120Hz displays without slowing simulation time',()=>{
  for(const hz of [30,60,90,120]){
   const cadence=new OceanCadence(30);let calls=0,time=0,wall=0;
   expect(cadence.step(0)).toBe(0);
   for(let i=0;i<hz*10;i++){
    const dt=(1+(i%2?.08:-.08))/hz;wall+=dt;
    const step=cadence.step(dt);if(step!==null){calls++;time+=step;}
   }
   expect(calls).toBeLessThanOrEqual(300);expect(calls).toBeGreaterThanOrEqual(299);
   expect(wall-time).toBeLessThan(1/30+.001);
   expect(time).toBeLessThanOrEqual(wall+1e-8);
  }
 });
 it('does not queue a burst of GPU catch-up work after a slow frame',()=>{
  const cadence=new OceanCadence(30);cadence.step(0);
  expect(cadence.step(.08)).toBe(.08);expect(cadence.step(0)).toBeNull();
  expect(cadence.step(.02)).toBe(.02);
 });
 it('keeps exactly one tree LOD visible through the mobile switch',()=>{
  const near={center:1000,near:0,far:600},far={center:1000,near:600,far:1800};
  for(const mobile of [false,true])for(let d=0;d<1800;d++){
   expect(Number(natureVisible(near,1000-d,mobile))+Number(natureVisible(far,1000-d,mobile))).toBe(1);
  }
  expect(natureVisible(near,640,true)).toBe(false);
  expect(natureVisible(far,640,true)).toBe(true);
  expect(natureVisible(near,640,false)).toBe(true);
  for(const limit of [260,420,600,650])expect(natureVisible({center:1000,near:0,far:limit},900,true)).toBe(true);
 });
 it('reduces FFT targets and pass work together, preserving the desktop default and four cascades',()=>{
  function probe(resolution?:number){
   const draws:{width:number;height:number;sub:number}[]=[];let target:any;
   const renderer={capabilities:{getMaxAnisotropy:()=>16},getClearColor:(c:any)=>c,getClearAlpha:()=>1,setClearColor:()=>{},clear:()=>{},setRenderTarget:(t:any)=>{target=t;},render:(mesh:any)=>{draws.push({width:target.width,height:target.height,sub:mesh.material.uniforms.uSub?.value??0});}};
   const sim=new OceanSim(renderer,undefined,resolution?{resolution,anisotropy:1}:undefined);
   sim.update(1/30);draws.length=0;sim.update(1/30);
   expect(sim.displacement).toHaveLength(4);expect(sim.slope).toHaveLength(4);
   expect(sim.time).toBeCloseTo(2/30);
   for(const material of [sim.initMat,sim.evolveMat,sim.fftMat,sim.assembleMat])expect(material.fragmentShader).toContain(`#define N ${resolution??256}\n`);
   expect(Math.max(...draws.map(d=>d.sub))).toBe(resolution??256);
   expect(sim.out[0][0].texture.anisotropy).toBe(resolution?1:16);
   const pixels=draws.reduce((n,d)=>n+d.width*d.height,0);
   for(const rt of [sim.h0RT,sim.ping,sim.pong,...sim.out.flat()])rt.dispose();
   for(const m of [sim.initMat,sim.evolveMat,sim.fftMat,sim.assembleMat])m.dispose();
   return pixels;
  }
  expect(probe(128)/probe()).toBeCloseTo(2/9);
 });
});
