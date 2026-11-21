import {afterEach,expect,it,vi} from 'vitest';
import inventory from '../content/scenery/coast-neighbours.json';
import layout from '../content/stages/coast/scenic-layout.json';

afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});

it('owns exactly the existing harbour and woods source resources without guessing their next placement',()=>{
 expect(inventory.schemaVersion).toBe(1);
 expect(inventory.status).toBe('SOURCE_OWNERSHIP_ONLY_UNPLACED');
 expect(inventory.preferredSequence).toEqual(['tutorial','kenting-beach','working-harbour','coastal-woods']);
 for(const [key,segment] of Object.entries(inventory.segments)){
  expect(segment.id).toBe(key);
  expect(segment.entryPort).toBeNull();
  expect(segment.exitPort).toBeNull();
  expect(segment.productionStatus).toBe('SOURCE_ONLY');
  expect(layout.heroAnchors.find(s=>s.id===segment.heroId)?.roadDistance).toBe(segment.referenceAnchorM);
 }
 const harbour=inventory.segments['working-harbour'];
 expect(harbour.landings.map(s=>harbour.referenceAnchorM+s.localM)).toEqual([4490,4570,4775]);
 expect(harbour.boats.map(s=>[s.id,harbour.referenceAnchorM+s.localM])).toEqual([
  ['quay-trawler',4520],['quay-longliner',4780],
 ]);
 const woods=inventory.segments['coastal-woods'];
 expect(woods.inlandCopses.map(s=>woods.referenceAnchorM+s.localM)).toEqual([
  5325,5374,5414,5454,5492,5592,5634,5688,5714,
 ]);
 expect(woods.shoreWindbreakCentersLocalM.map(s=>woods.referenceAnchorM+s)).toEqual([
  5530,5563,5598,5630,5671,5710,
 ]);
 const allBoatIds=harbour.boats.map(s=>s.id);
 expect(new Set(allBoatIds).size).toBe(allBoatIds.length);
});

it('derives the original source coordinates from one registry and preserves other coastal assets',async()=>{
 vi.stubEnv('VITE_KENTING_INSTALLATION','original');
 const sources=await import('../src/content/kenting-neighbours');
 const {COAST_LANDINGS}=await import('../src/coast-layout');
 const {COAST_BOATS}=await import('../src/coast-boats');
 expect(sources.COAST_WORKING_HARBOUR_LANDINGS).toEqual([
  {d:4490,x:-25,radius:7},{d:4570,x:-25,radius:7},{d:4775,x:-25,radius:7},
 ]);
 expect(COAST_LANDINGS).toEqual([...sources.COAST_WORKING_HARBOUR_LANDINGS,{d:8920,x:-25,radius:7}]);
 expect(sources.COAST_WOODS_INLAND_SITES.map(([d,x,h])=>[d,x,h])).toEqual([
  [5325,38,14],[5374,61,17],[5414,67,19],[5454,61,16],[5492,72,18],
  [5592,69,18],[5634,61,17],[5688,48,15],[5714,37,12],
 ]);
 expect(sources.COAST_WOODS_SHORE_CENTERS).toEqual([5530,5563,5598,5630,5671,5710]);
 for(const source of sources.COAST_WORKING_HARBOUR_BOATS){
  const boat=COAST_BOATS.find(b=>b.id===source.id)!;
  expect(boat).toMatchObject({
   kind:'fishing',distance:source.d,offshore:source.offshore,length:source.length,
  });
  expect(sources.boatDeferred(boat.id)).toBe(false);
 }
 expect(sources.landingDeferred(4490)).toBe(false);
 expect(sources.landingDeferred(8920)).toBe(false);
 expect(sources.heroDeferred('working-harbour')).toBe(false);
});

it('keeps unfinished harbour and woods deferred only in isolated Kenting trial modes',async()=>{
 for(const mode of ['immediate','relocated'] as const){
  vi.resetModules();vi.stubEnv('VITE_KENTING_INSTALLATION',mode);
  const sources=await import('../src/content/kenting-neighbours');
  for(const id of ['working-harbour','coastal-woods'])expect(sources.heroDeferred(id)).toBe(true);
  for(const station of [4490,4570,4775])expect(sources.landingDeferred(station)).toBe(true);
  for(const id of ['quay-trawler','quay-longliner'])expect(sources.boatDeferred(id)).toBe(true);
  expect(sources.landingDeferred(8920)).toBe(false);
  expect(sources.boatDeferred('bay-sail-entry')).toBe(false);
  expect(sources.heroDeferred('bay-entrance')).toBe(false);
 }
});
