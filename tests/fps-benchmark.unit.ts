import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolveFixedFpsBenchmark} from '../src/fps-benchmark';

const distance=(query:string,coast=true,len=10380)=>resolveFixedFpsBenchmark(new URLSearchParams(query),coast,len);

it('enables stationary FPS benchmark only with both explicit opt-ins and a valid coast coordinate',()=>{
 expect(distance('fpsdiag=1&fpsbench=1&at=6500')).toBe(6500);
 expect(distance('fpsdiag=1&fpsbench=1&at=350')).toBe(350);
 for(const q of [
  'fpsdiag=1&at=6500','fpsbench=1&at=6500',
  'fpsdiag=1&fpsbench=1','fpsdiag=1&fpsbench=1&at=0',
  'fpsdiag=1&fpsbench=1&at=999999',
  'fpsdiag=1&fpsbench=1&at=NaN',
  'fpsdiag=1&fpsbench=1&at=',
  'fpsdiag=1&fpsbench=1&at=6500&qa=1',
 ])expect(distance(q),q).toBeNull();
 expect(distance('fpsdiag=1&fpsbench=1&at=6500',false)).toBeNull();
});

it('does not accidentally unfreeze a fixed-location benchmark on resume or restart',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 expect(main).toContain('if(fpsBenchDistance!==null){state.distance=fpsBenchDistance;state.speed=0;}');
 expect(main).toContain("if(fpsBenchDistance!==null){\n   // Hold the exact camera and car pose.");
 expect(main).toContain("fpsBenchmark:{mode:'fixed-position',distanceM:fpsBenchDistance,physicsFrozen:true,");
});
