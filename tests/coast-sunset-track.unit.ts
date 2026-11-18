import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {sunsetHeadingOffset,SUNSET_CONNECTORS} from '../src/content/coast-sunset-track';
afterEach(()=>{setSunsetRoute(false);setBeachMacro('none');});
it('keeps default/B exact and retains the right beach and cape alignment',()=>{
 for(const variant of ['none','b','right']){
  setBeachMacro(variant);setSunsetRoute(false);const old=coastWorkerRoad();setSunsetRoute(true);const revised=coastWorkerRoad();
  expect(revised.track.length).toBe(old.track.length);
  for(let d=350;d<=14550;d+=25){
   if(variant!=='right'||d>=4000&&d<=8450)expect(revised.track.sample(d)).toEqual(old.track.sample(d));
   expect(revised.halfAt(d)).toBe(8.75);
  }
 }
});
it('keeps interior shape and physical travel while matching main and worker',()=>{
 setBeachMacro('right');setSunsetRoute(false);const old=coastWorkerRoad().track;
 setSunsetRoute(true);const revised=coastWorkerRoad().track,worker=coastWorkerRoad().track;
 for(let d=350;d<=14500;d+=10){
  const p=revised.sample(d),q=revised.sample(d+1);
  expect(p).toEqual(worker.sample(d));expect(p.position.y).toBeCloseTo(old.sample(d).position.y,8);
  expect(p.position.distanceTo(q.position)).toBeCloseTo(old.sample(d).position.distanceTo(old.sample(d+1).position),7);
  expect(Number.isFinite(p.curvature)).toBe(true);expect(Math.abs(p.curvature)).toBeLessThan(.025);
  if(!SUNSET_CONNECTORS.some(([a,b])=>d>=a-3&&d<=b+3)&&!(d>=4000&&d<=8450))expect(p.curvature).toBeCloseTo(old.sample(d).curvature,4);
 }
 for(const d of [4000,8450,...SUNSET_CONNECTORS.flatMap(([a,b])=>[a,b])]){
  expect(revised.sample(d-.01).position.distanceTo(revised.sample(d+.01).position)).toBeLessThan(.03);
  expect(revised.sample(d-.01).tangent.angleTo(revised.sample(d+.01).tangent)).toBeLessThan(.002);
 }
 expect(sunsetHeadingOffset(350)*180/Math.PI).toBe(-40);
});
