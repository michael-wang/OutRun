import {it,expect} from 'vitest';
import {COAST_SCENIC_ACTS,coastScenicActAt,coastVegetationDensity} from '../src/coast-journey-layout';
import {COAST_BEACHES,COAST_DISTRICTS} from '../src/coast-layout';
import {FARM_ZONES,FARM_PLOTS,FARM_HOMES} from '../src/coast-farm-layout';
import {COAST_RURAL_SHOWCASE,COAST_RURAL_HOUSES} from '../src/coast-rural-layout';
import {COAST_REST_SPOTS,COAST_VILLAGE_SITES} from '../src/coast-village-layout';
import {COAST_BOATS} from '../src/coast-boats';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';

it('directs four contiguous parts of one ten-kilometre coastal journey',()=>{
 expect(COAST_SCENIC_ACTS.map(x=>x.id)).toEqual([
  'rural-opening','quiet-beach','town-and-market','fishing-farewell',
 ]);
 expect(COAST_SCENIC_ACTS[0].start).toBe(0);
 expect(COAST_SCENIC_ACTS.at(-1)!.end).toBe(10000);
 for(let i=1;i<COAST_SCENIC_ACTS.length;i++)
  expect(COAST_SCENIC_ACTS[i].start).toBe(COAST_SCENIC_ACTS[i-1].end);
 for(const d of [0,1799,1800,3399,3400,6999,7000,9999])
  expect(coastScenicActAt(d)).toBe(COAST_SCENIC_ACTS.find(x=>d>=x.start&&d<x.end));
 expect(COAST_ULTRA_STAGE.beats.map(x=>[x.startS,x.endS])).toEqual(
  COAST_SCENIC_ACTS.map(x=>[x.start,x.end]));
});

it('opens with uninterrupted sea and a field-first courtyard landmark',()=>{
 expect(COAST_DISTRICTS.every(z=>z.start>=3400&&z.end<=7000)).toBe(true);
 expect(COAST_BEACHES.every(b=>b.distance-b.radius>=1800)).toBe(true);
 expect(FARM_ZONES[0].main).toBe(true);
 expect(FARM_ZONES[0].rice[0]).toBeLessThan(350);
 expect(FARM_ZONES[0].flowers[0]).toBeLessThan(1400);
 expect(FARM_ZONES[0].flowers[1]).toBeLessThan(1800);
 expect(COAST_RURAL_SHOWCASE.approachAt).toBe(850);
 expect(COAST_RURAL_SHOWCASE.start).toBeGreaterThanOrEqual(900);
 expect(COAST_RURAL_SHOWCASE.end).toBeLessThan(1150);
 const courtyard=COAST_RURAL_HOUSES.find(x=>x.kind==='courtyard')!;
 expect(courtyard).toBeDefined();
 expect(courtyard.d).toBeLessThan(1150);
 expect(courtyard.x).toBeLessThan(60); // readable by fast road-side players
 for(const house of COAST_RURAL_HOUSES){
  const radius=house.kind==='courtyard'?18:11;
  expect(FARM_PLOTS.some(p=>
   house.d+radius>p.start&&house.d-radius<p.end
   &&house.x+radius>p.left&&house.x-radius<p.right)).toBe(false);
 }
 expect(COAST_BOATS.filter(b=>b.distance<1800)).toHaveLength(1);
});

it('keeps the second act a visitor beach with sparse inland scrub',()=>{
 const chapter=COAST_SCENIC_ACTS[1];
 const active=COAST_BEACHES.filter(b=>b.distance>=chapter.start&&b.distance<chapter.end);
 expect(active).toHaveLength(1);
 expect(active[0].extra).toBeGreaterThan(40);
 expect(COAST_REST_SPOTS.filter(x=>x.d>=chapter.start&&x.d<chapter.end).length).toBeGreaterThanOrEqual(3);
 expect(FARM_ZONES.every(z=>z.end<=chapter.start||z.start>=chapter.end)).toBe(true);
 expect(coastVegetationDensity(2350)).toBeLessThan(coastVegetationDensity(1100)*.35);
 expect(coastVegetationDensity(3100)).toBeLessThan(.25);
});

it('groups homes and night markets in the middle, with modest farm clearings',()=>{
 const chapter=COAST_SCENIC_ACTS[2],districts=COAST_DISTRICTS.filter(z=>z.start>=chapter.start&&z.end<=chapter.end);
 expect(districts.filter(z=>z.kind==='market').length).toBeGreaterThanOrEqual(3);
 expect(districts.filter(z=>z.kind==='homes').length).toBeGreaterThanOrEqual(3);
 expect(COAST_VILLAGE_SITES.filter(x=>x.kind==='waffle'&&x.d>=chapter.start&&x.d<chapter.end).length).toBeGreaterThanOrEqual(3);
 const townPockets=FARM_ZONES.filter(z=>z.start>=chapter.start&&z.end<=chapter.end);
 expect(townPockets).toHaveLength(2);
 for(const z of townPockets){
  expect(z.right).toBeLessThan(170);
  expect(districts.some(d=>z.start<d.end&&z.end>d.start)).toBe(false);
  expect(FARM_HOMES.some(h=>h.d>=z.start&&h.d<z.end)).toBe(true);
 }
 expect(COAST_BOATS.filter(b=>b.distance>=chapter.start&&b.distance<chapter.end&&b.kind==='sail').length).toBeGreaterThanOrEqual(4);
});

it('finishes amid fishing boats, working crops and only small tourist coves',()=>{
 const chapter=COAST_SCENIC_ACTS[3];
 const fishing=COAST_BOATS.filter(b=>b.distance>=chapter.start&&b.distance<chapter.end&&b.kind==='fishing');
 expect(fishing.length).toBeGreaterThanOrEqual(6);
 expect(COAST_BOATS.every(b=>b.kind!=='fishing'||b.distance>=chapter.start)).toBe(true);
 const lateFarms=FARM_ZONES.filter(z=>z.start>=chapter.start&&z.end<=chapter.end);
 expect(lateFarms).toHaveLength(2);
 expect(lateFarms.every(z=>z.right>=200)).toBe(true);
 expect(COAST_BEACHES.filter(b=>b.distance>=chapter.start).every(b=>b.radius<300)).toBe(true);
 expect(COAST_REST_SPOTS.filter(x=>x.d>=chapter.start).length)
  .toBeLessThan(COAST_REST_SPOTS.filter(x=>x.d>=1800&&x.d<7000).length);
});
