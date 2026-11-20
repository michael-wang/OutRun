import {afterEach,expect,it,vi} from 'vitest';

async function build(site:'original'|'relocated') {
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
