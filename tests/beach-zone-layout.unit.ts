import {afterEach,expect,it} from 'vitest';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachX} from '../src/coast-layout';
import {coastBeachHeight} from '../src/scenery-cross-section';
afterEach(()=>{setBeachPlan(false);setCoastClose(false);setBeachFlow(false);setBeachVista(false);setSunsetRoute(false);setSunSide(null);setBeachMacro('none');});
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);}
it('keeps the driven route and tower/post-tower coast unchanged while refitting low beach only',()=>{
 setup();const before=coastWorkerRoad().track,shore=[4800,6200,6450,6950,7900,8500].map(d=>coastBeachX(-26,d));setBeachPlan(true);const after=coastWorkerRoad().track;
 for(let d=350;d<14550;d+=20){expect(after.sample(d).position.toArray()).toEqual(before.sample(d).position.toArray());expect(after.sample(d).tangent.toArray()).toEqual(before.sample(d).tangent.toArray());}
 for(const [i,d] of [4800,6200,6450,6950,7900,8500].entries())expect(coastBeachX(-26,d)).toBe(shore[i]);
 for(const d of [5160,5440,5710]){const x=coastBeachX(-26,d),p=after.sample(d);expect(x).toBeGreaterThan(-90);expect(x).toBeLessThan(-65);expect(coastBeachHeight(x,p.position.y,p.right.y,d)).toBeCloseTo(-5,8);}
});
