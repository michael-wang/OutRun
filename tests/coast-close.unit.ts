import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,coastClose} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachX} from '../src/coast-layout';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {COAST_SUN} from '../src/coast-sun-direction';
afterEach(()=>{setCoastClose(false);setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);}
it('narrows only the post-tower shore while retaining every driven road sample and fixed sun',()=>{
 setup();const before=coastWorkerRoad().track,sun=COAST_SUN.toArray();
 const shores=Array.from({length:1421},(_,i)=>coastBeachX(-26,350+i*10));
 setCoastClose(true);const after=coastWorkerRoad().track;
 for(let i=0;i<shores.length;i++){const d=350+i*10,a=after.sample(d),b=before.sample(d);
  expect(a.position.toArray()).toEqual(b.position.toArray());expect(a.tangent.toArray()).toEqual(b.tangent.toArray());
  if(d<=6500||d>=8450)expect(coastBeachX(-26,d)).toBe(shores[i]);
  if(d>=6900&&d<=7900){expect(coastBeachX(-26,d)).toBeGreaterThan(-60);expect(coastBeachX(-26,d)).toBeLessThan(-50);}
 }
 expect(COAST_SUN.toArray()).toEqual(sun);
});
it('preserves tower support, connected high shoulder and submerged waterline through the taper',()=>{
 setup();setCoastClose(true);const t=coastWorkerRoad().track;
 const y=(d:number,x:number)=>{const p=t.sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 for(const d of [6439,6450,6461])for(const x of [-116,-105,-94])expect(y(d,x)).toBeCloseTo(18,2);
 for(let d=6500;d<=8450;d+=5){const shore=coastBeachX(-26,d);
  expect(y(d,shore)).toBeCloseTo(-5,8);expect(y(d,shore-2)).toBeLessThan(-5);
  expect(Math.abs(coastBeachX(-26,d+.01)-coastBeachX(-26,d-.01))).toBeLessThan(.02);
  expect(y(d,-13)).toBeGreaterThan(y(d,shore));
 }
 for(const d of [6800,7000,7400]){expect(y(d,-23)).toBeGreaterThan(18);expect(y(d,coastBeachX(-26,d)+5)).toBeLessThan(0);}
});
