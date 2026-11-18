import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide} from '../src/beach-macro';
import {COAST_SUN,COAST_SHADOW_AWAY} from '../src/coast-sun-direction';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
afterEach(()=>{setSunsetRoute(false);setBeachMacro('none');setSunSide(null);});
it('compares fixed world sun directions without changing route geometry or elevation',()=>{
 setBeachMacro('right');setSunsetRoute(true);setSunSide(null);
 const baseline=coastWorkerRoad().track,sun=COAST_SUN.clone();
 for(const [side,az] of [['left',-10],['wide',0]] as const){
  setSunSide(side);const track=coastWorkerRoad().track;
  expect(Math.atan2(COAST_SUN.x,COAST_SUN.z)*180/Math.PI).toBeCloseTo(az);
  expect(COAST_SUN.y).toBe(sun.y);
  expect(COAST_SHADOW_AWAY.x).toBeCloseTo(-COAST_SUN.x/Math.hypot(COAST_SUN.x,COAST_SUN.z));
  for(let d=350;d<=14550;d+=100)expect(track.sample(d)).toEqual(baseline.sample(d));
 }
 setSunSide(null);expect(COAST_SUN.toArray()).toEqual(sun.toArray());
});
