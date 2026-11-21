import {afterEach, expect, it, vi} from 'vitest';

async function loadSite(site:'original'|'relocated'|'immediate') {
  vi.resetModules();
  vi.stubEnv('VITE_KENTING_INSTALLATION',site);
  const macro=await import('../src/beach-macro');
  macro.configureKentingCoast();
  const layout=await import('../src/coast-layout');
  const terrain=await import('../src/coast-terrain');
  const {coastBeachHeight,COAST_SEA_LEVEL}=await import('../src/scenery-cross-section');
  const profile=await import('../src/beach2-profile');
  const {coastWorkerRoad}=await import('../src/content/coast-worker-road');
  const {COAST_SHORE_NAME,COAST_SHORE_KEY}=await import('../src/coast-shore-asset');
  const {sample}=coastWorkerRoad().track;
  const height=(station:number,x:number)=>{
    const p=sample(station);
    return coastBeachHeight(x,p.position.y,p.right.y,station);
  };
  return {macro,layout,terrain,profile,height,sea:COAST_SEA_LEVEL,mask:COAST_SHORE_NAME,key:COAST_SHORE_KEY};
}
afterEach(()=>vi.unstubAllEnvs());

it('preserves the accepted shore cross-sections and the inland ridge in installed local metres',async()=>{
  const old=await loadSite('original'),moved=await loadSite('relocated');
  expect([old.mask,moved.mask]).toEqual(['coast-shore','coast-shore-beach2-r1']);
  expect(old.key).not.toBe(moved.key);
  for(let s=-500;s<=1400;s+=10){
    const a=old.profile.BEACH2.core+s,b=moved.profile.BEACH2.core+s;
    const edge=old.layout.coastBeachX(-26,a);
    expect(moved.layout.coastBeachX(-26,b)).toBeCloseTo(edge,8);
    expect(moved.height(b,edge)).toBeCloseTo(moved.sea,8);
    for(const x of [edge-5,edge+3,-20,11,35,75,125,225]){
      expect(moved.height(b,x)).toBeCloseTo(old.height(a,x),7);
    }
    expect(moved.layout.coastDriveBounds(b,8.75)).toEqual(old.layout.coastDriveBounds(a,8.75));
    for(const side of [-1,1] as const){
      expect(moved.layout.coastVisibleBarrierStyle(b,side)).toBe(old.layout.coastVisibleBarrierStyle(a,side));
    }
  }
});

it('clears the old reveal and admits only the installed beach and cap with a finite return to the ordinary coast',async()=>{
  const moved=await loadSite('relocated');
  expect(moved.profile.beach2Weight(4850)).toBe(0);
  expect(moved.profile.beach2Weight(5500)).toBe(1);
  expect(moved.macro.macroMountainBlend(4350)).toBe(0);
  expect(moved.macro.macroMountainBlend(5000)).toBe(1);
  expect(moved.layout.coastVisibleBarrierStyle(4750,-1)).not.toBe('stone-post');
  expect(moved.layout.coastVisibleBarrierStyle(5400,-1)).toBe('stone-post');
  expect(moved.layout.coastDriveBounds(5400,8.75).left).toBeLessThan(-8.75);
  const old=await loadSite('original');
  for(let s=8450;s<14550;s+=37){
    expect(moved.layout.coastBeachX(-26,s)).toBe(old.layout.coastBeachX(-26,s));
    for(const x of [-75,-28,35,70,105]){
      expect(moved.height(s,x)).toBeCloseTo(old.height(s,x),8);
    }
  }
});

it('isolates the harbour shore cache while preserving the A6 and Kenting terrain',async()=>{
 const original=await loadSite('original'),immediate=await loadSite('immediate'),late=await loadSite('relocated');
 expect(immediate.mask).toBe('coast-shore-working-harbour');
 expect(immediate.mask).not.toBe(original.mask);
 expect(immediate.mask).not.toBe(late.mask);
 expect(immediate.key).not.toBe(original.key);
 for(const d of [3900,4000,4100,4200,4300,4350,4500,4700,4850,5500,6020,6800]){
  for(const x of [-90,-55,-20,11,35,75,150]){
   expect(immediate.height(d,x)).toBeCloseTo(original.height(d,x),7);
  }
 }
 expect(immediate.macro.macroMountainBlend(4200)).toBeGreaterThan(0);
 expect(late.macro.macroMountainBlend(4200)).toBe(0);
});
