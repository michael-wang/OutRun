import {afterEach,expect,it,vi} from 'vitest';

async function build(site:'original'|'relocated'|'immediate') {
  vi.resetModules();
  vi.stubEnv('VITE_KENTING_INSTALLATION',site);
  const {configureKentingCoast}=await import('../src/beach-macro');
  configureKentingCoast();
  const {coastWorkerRoad}=await import('../src/content/coast-worker-road');
  const {KENTING_INSTALLATION}=await import('../src/kenting-installation');
  return {...coastWorkerRoad(),site:KENTING_INSTALLATION};
}
afterEach(()=>vi.unstubAllEnvs());

it('installs the complete protected road with one rigid translation and rejoins the accepted stage',async()=>{
  const old=await build('original'),moved=await build('relocated');
  const {delta,tutorialExit,roadEntry,roadExit,connectedAt}=moved.site;
  expect(delta).toBe(650);
  const displacement=moved.track.sample(roadEntry).position.sub(old.track.sample(roadEntry-delta).position);
  expect(displacement.y).toBe(0);
  expect(displacement.length()).toBeCloseTo(delta,8);
  for(let d=350;d<=14550;d+=5) {
    const edge=d<=tutorialExit || d>=connectedAt;
    if(!edge && (d<roadEntry||d>roadExit))continue;
    const s=edge?d:d-delta;
    const before=old.track.sample(s),after=moved.track.sample(d);
    if(!edge)before.position.add(displacement);
    expect(after.position.distanceTo(before.position)).toBeLessThan(1e-7);
    expect(after.curvature).toBeCloseTo(before.curvature,11);
    expect(after.tangent.distanceTo(before.tangent)).toBeLessThan(1e-10);
    expect(after.right.distanceTo(before.right)).toBeLessThan(1e-10);
    expect(moved.halfAt(d)).toBe(old.halfAt(s));
  }
  // +/- 5 mm includes both evaluated curve branches at every construction seam.
  for(const d of [tutorialExit,roadEntry,roadExit,connectedAt]){
    const a=moved.track.sample(d-.005),b=moved.track.sample(d+.005);
    expect(a.position.distanceTo(b.position)).toBeLessThan(.013);
    expect(a.tangent.distanceTo(b.tangent)).toBeLessThan(.0001);
    expect(Math.abs(a.curvature-b.curvature)).toBeLessThan(.00003);
    expect(a.right.distanceTo(b.right)).toBeLessThan(.0001);
  }
});

it('joins A6 to the original big right-hand reveal without inventing a connector',async()=>{
 const baseline=await build('original'),immediate=await build('immediate');
 expect(immediate.site.mode).toBe('immediate');
 expect(immediate.site.relocated).toBe(true); // Legacy harbour/woods are isolated.
 expect(immediate.site.shifted).toBe(false);
 expect(immediate.site.delta).toBe(0);
 expect(immediate.site.tutorialExit).toBe(immediate.site.roadEntry);
 for(const d of [350,4000,4150,4200,4350,4550,4635,4738,4800,4850,6020,6800,7600,8450,14550]){
  const a=baseline.track.sample(d),b=immediate.track.sample(d);
  expect(a.position.distanceTo(b.position)).toBeLessThan(1e-8);
  expect(a.tangent.distanceTo(b.tangent)).toBeLessThan(1e-8);
  expect(a.right.distanceTo(b.right)).toBeLessThan(1e-8);
  expect(a.curvature).toBeCloseTo(b.curvature,10);
 }
 const curve=immediate.track.sample(4700);
 expect(curve.curvature).toBeGreaterThan(.005); // Existing main right-turn reveal.
});

it('uses the accepted no-extra-connector Kenting layout by default',async()=>{
  vi.resetModules();
  vi.stubEnv('VITE_KENTING_INSTALLATION','');
  const {KENTING_INSTALLATION}=await import('../src/kenting-installation');
  expect(KENTING_INSTALLATION.mode).toBe('immediate');
  expect(KENTING_INSTALLATION.delta).toBe(0);
  expect(KENTING_INSTALLATION.roadEntry).toBe(KENTING_INSTALLATION.tutorialExit);
  expect(KENTING_INSTALLATION.shifted).toBe(false);
  expect(KENTING_INSTALLATION.relocated).toBe(true); // Old harbour/woods stay deferred.
});
