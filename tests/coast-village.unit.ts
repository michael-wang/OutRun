import {it,expect} from 'vitest';
import {COAST_VILLAGE_SITES,COAST_REST_SPOTS} from '../src/coast-village-layout';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {createPilotTrack} from '../src/pilot-composer';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';

it('places clustered frontages and waffle carts inside districts with unique chunk ownership',()=>{
 const front=COAST_VILLAGE_SITES.filter(s=>!s.rear);
 const owned=Array.from({length:11},(_,i)=>COAST_VILLAGE_SITES.filter(s=>s.d>=i*1000&&s.d<(i+1)*1000)).flat();
 expect(owned).toHaveLength(COAST_VILLAGE_SITES.length);expect(new Set(owned).size).toBe(owned.length);
 for(const district of COAST_DISTRICTS){
  const sites=front.filter(s=>s.d>=district.start&&s.d<district.end),gaps=sites.slice(1).map((s,i)=>s.d-sites[i].d);
  expect(Math.max(...gaps)-Math.min(...gaps)).toBeGreaterThan(20);
  const groups=new Map<number,number>();for(const site of sites)groups.set(site.group,(groups.get(site.group)??0)+1);
  expect([...groups.values()].some(n=>n===1)).toBe(true);expect([...groups.values()].some(n=>n>=3)).toBe(true);
  if(district.kind==='market')expect(sites.some(s=>s.kind==='waffle')).toBe(true);
 }
 for(const s of COAST_VILLAGE_SITES){expect(COAST_DISTRICTS.some(d=>s.d>d.start&&s.d<d.end)).toBe(true);expect(s.x).toBeGreaterThanOrEqual(22);expect(s.x).toBeLessThan(75);}
 expect(COAST_VILLAGE_SITES.filter(s=>s.kind==='home').length).toBeGreaterThan(40);
 expect(COAST_VILLAGE_SITES.filter(s=>s.kind!=='home').length).toBeGreaterThan(55);
});
it('keeps seaside benches and children on dry beach outside the driving corridor',()=>{
 const track=createPilotTrack(COAST_ULTRA_STAGE);
 expect(COAST_REST_SPOTS.length).toBeGreaterThanOrEqual(12);
 for(const spot of COAST_REST_SPOTS){
  expect(spot.x).toBeLessThan(-18);const p=track.sample(spot.d);
  expect(coastBeachHeight(spot.x,p.position.y,p.right.y,spot.d)).toBeGreaterThan(-3.7);
  if(spot.children)for(const j of [0,1]){const d=spot.d+(j?5:-5),q=track.sample(d);expect(coastBeachHeight(spot.x-4-j,q.position.y,q.right.y,d)).toBeGreaterThan(-4);}
 }
});
