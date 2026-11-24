import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,beachVista,macroLighthouseStation,macroLighthouseX,macroScenicDistance} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_SUN} from '../src/coast-sun-direction';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {coastBeachX} from '../src/coast-layout';
afterEach(()=>{setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
it('locally adjusts the beach with fixed sun, same start and exact remote route',()=>{
 setBeachMacro('right');setSunsetRoute(true);setSunSide('left');const old=coastWorkerRoad().track,sun=COAST_SUN.clone();
 setBeachVista(true);const next=coastWorkerRoad().track,worker=coastWorkerRoad().track;
 expect(COAST_SUN.toArray()).toEqual(sun.toArray());expect(next.length).toBe(old.length);
 for(let d=350;d<=14550;d+=10){const p=next.sample(d);expect(p).toEqual(worker.sample(d));expect(Number.isFinite(p.curvature)).toBe(true);
  if(d<=4350||d>=8450){expect(p.position.distanceTo(old.sample(d).position)).toBeLessThan(.000001);expect(p.tangent.angleTo(old.sample(d).tangent)).toBeLessThan(.000001);}
 }
 let bands=0,hard=false;for(let d=4351;d<6550;d+=2){const p=next.sample(d);expect(p.curvature).toBeGreaterThan(-.000001);const h=p.curvature>.001;if(h&&!hard)bands++;hard=h;if(d>4850)expect(p.curvature).toBeLessThan(.0001);}
 expect(bands).toBe(1);expect(next.sample(6000).roadHeading-old.sample(6000).roadHeading).toBeCloseTo(-.09,4);
 for(const d of [4350,4570,4850,6550,8450]){expect(next.sample(d-.01).position.distanceTo(next.sample(d+.01).position)).toBeLessThan(.03);expect(next.sample(d-.01).tangent.angleTo(next.sample(d+.01).tangent)).toBeLessThan(.002);}
});
it('supports the enlarged existing landmark and keeps bathers immersed',()=>{
 setBeachMacro('right');setSunsetRoute(true);setBeachVista(true);const t=coastWorkerRoad().track,d=macroLighthouseStation();
 for(const dz of [-11,0,11])for(const dx of [-11,0,11]){const p=t.sample(d+dz);expect(coastBeachHeight(macroLighthouseX()+dx,p.position.y,p.right.y,d+dz)).toBe(18);}
 for(const offset of [-50,8,69,128])for(let i=0;i<3;i++){const at=macroScenicDistance(5980+offset+i*3),p=t.sample(at),x=coastBeachX(-26,at)-1.1-(i%2)*1.5;expect(coastBeachHeight(x,p.position.y,p.right.y,at)).toBeLessThan(-5);}
});
