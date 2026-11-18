import {it,expect,afterEach} from 'vitest';
import {setBeachMacro,beachMacro,macroScenicDistance,macroMountainBlend,macroLighthouseX} from '../src/beach-macro';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {farmPlotsInChunk} from '../src/coast-farm-layout';
import {coastBeachX,coastRocks,coastReefRocks,COAST_ROCKS} from '../src/coast-layout';
afterEach(()=>setBeachMacro('none'));
it('removes the retired left option',()=>{setBeachMacro('left');expect(beachMacro()).toBe('none');});
it('has one early right braking turn then a long gentle right beach; reconnects only after the beach',()=>{
 setBeachMacro('none');const base=coastWorkerRoad();setBeachMacro('right');const main=coastWorkerRoad(),worker=coastWorkerRoad();
 expect(main.track.length).toBe(base.track.length);
 for(const d of [350,4000,4349,4350,8450,9000,14550])expect(main.track.sample(d)).toEqual(base.track.sample(d));
 let hardBands=0,previousHard=false;
 for(let d=4351;d<8450;d+=2){const s=main.track.sample(d);
  expect(s).toEqual(worker.track.sample(d));expect(main.halfAt(d)).toBe(8.75);
  expect(Number.isFinite(s.curvature)).toBe(true);
  expect(s.position.distanceTo(main.track.sample(d+1).position)).toBeLessThan(1.20);
  if(d<6550){expect(s.curvature).toBeGreaterThan(-.000001);const hard=s.curvature>.001;if(hard&&!previousHard)hardBands++;previousHard=hard;}
  if(d>4850&&d<6550)expect(s.curvature).toBeLessThan(.0001);
 }
 expect(farmPlotsInChunk(4000,5000)).toHaveLength(0);expect(hardBands).toBe(1);expect(main.track.sample(4710).curvature).toBeGreaterThan(.009);
 for(const d of [4350,8450])expect(main.track.sample(d-.01).tangent.angleTo(main.track.sample(d+.01).tangent)).toBeLessThan(.0001);
 expect(macroMountainBlend(4500)).toBe(1);expect(coastBeachHeight(48,-1,0,4500)).toBeGreaterThan(10);
});
it.each(['b','right'])('keeps %s bathers submerged and the relocated lighthouse supported',variant=>{
 setBeachMacro(variant);const road=coastWorkerRoad().track;
 for(const offset of [-50,8,69,128])for(let i=0;i<3;i++){
  const d=macroScenicDistance(5980+offset+i*3),s=road.sample(d),x=coastBeachX(-26,d)-1.1-(i%2)*1.5;
  expect(coastBeachHeight(x,s.position.y,s.right.y,d)).toBeLessThan(-5);
 }
 const centre=macroScenicDistance(6175);
 for(const d of [centre-8,centre,centre+8])for(const x of [-8,0,8].map(x=>x+macroLighthouseX())){const s=road.sample(d);expect(coastBeachHeight(x,s.position.y,s.right.y,d)).toBe(12);}
 if(variant==='right'){const s=road.sample(centre);for(let x=-13;x>=macroLighthouseX();x-=2)expect(coastBeachHeight(x,s.position.y,s.right.y,centre)).toBeGreaterThan(-5);}
});
it('keeps accepted route default, far route exact and main/worker variant identical',()=>{setBeachMacro('none');const base=coastWorkerRoad();setBeachMacro('b');const main=coastWorkerRoad(),worker=coastWorkerRoad();expect(main.track.length).toBe(base.track.length);for(const d of [350,5000,5270,6570,7000,14500])expect(main.track.sample(d).position.toArray()).toEqual(base.track.sample(d).position.toArray());for(let d=5270;d<=6570;d+=5){const a=main.track.sample(d),b=worker.track.sample(d);expect(a.position.toArray()).toEqual(b.position.toArray());expect(Number.isFinite(a.curvature)).toBe(true);expect(main.halfAt(d)).toBe(8.75);expect(a.position.distanceTo(main.track.sample(d+.1).position)).toBeLessThan(.14);}expect(main.track.sample(5500).position.distanceTo(base.track.sample(5500).position)).toBeGreaterThan(25);});
it('raises real sea-side masses without raising roadway',()=>{setBeachMacro('none');const original=coastBeachHeight(0,-1.15,0,5500);setBeachMacro('b');expect(coastBeachHeight(0,-1.15,0,5500)).toBe(original);expect(coastBeachHeight(-38,-1.15,0,5500)).toBeGreaterThan(15);expect(coastBeachHeight(-50,-1.15,0,6175)).toBeGreaterThan(10);expect(coastBeachHeight(-180,-1.15,0,5500)).toBeLessThan(-5);});

it('relocates existing reef geometry and shared water markers after the extended beach only',()=>{setBeachMacro('none');expect(coastRocks()).toEqual(COAST_ROCKS);setBeachMacro('right');for(const r of [...coastRocks(),...coastReefRocks()])expect(r.d<4700||r.d>6550).toBe(true);expect(coastRocks().filter(r=>r.d>6750&&r.d<7200)).toHaveLength(4);setBeachMacro('none');expect(coastRocks()).toEqual(COAST_ROCKS);});
