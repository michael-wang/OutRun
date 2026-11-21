import {afterEach,expect,it,vi} from 'vitest';
import {coastAuthoredRoad} from '../src/content/authored-road';

async function segmentName(site:'original'|'relocated'|'immediate'){
 vi.resetModules();
 vi.stubEnv('VITE_KENTING_INSTALLATION',site);
 const {coastSegmentNameAt}=await import('../src/coast-journey-layout');
 return (station:number)=>coastSegmentNameAt(station,coastAuthoredRoad.startDistance);
}
afterEach(()=>vi.unstubAllEnvs());

it('selects the entering segment at each installed road port in either travel direction',async()=>{
 const name=await segmentName('relocated');
 for(const [port,before,after] of [
  [4350,'教學 · 小鎮與夜市','海灘入口連接道'],
  [5000,'海灘入口連接道','墾丁海水浴場'],
  [7450,'墾丁海水浴場','海岬出口連接道'],
  [8450,'海岬出口連接道','岬口搶位'],
 ] as const){
  expect(name(port-.01)).toBe(before);
  expect(name(port)).toBe(after);
  expect(name(port+.01)).toBe(after);
  expect(name(port-.01)).toBe(before);
 }
});

it('uses the full station for the installation and start-relative metres for authored chapter names',async()=>{
 const name=await segmentName('relocated');
 expect(name(350)).toBe('教學 · 海岸田園');
 expect(name(1819.99)).toBe('教學 · 海岸田園');
 expect(name(1820)).toBe('教學 · 悠閒沙灘');
 expect(name(4600)).toBe('海灘入口連接道');
 expect(name(9219.99)).toBe('岬口搶位');
 expect(name(9220)).toBe('花田到稻浪');
 expect(name(14550)).toBe('港口衝線');
 expect(name(350)).toBe('教學 · 海岸田園');
});

it('keeps the original beach footprint when the R1 connector pair is not installed',async()=>{
 const name=await segmentName('original');
 expect(name(4350)).toBe('墾丁海水浴場');
 expect(name(6799.99)).toBe('墾丁海水浴場');
 expect(name(6800)).toBe('漁港到帆船灣');
});

it('does not invent an entry connector when the Beach and A6 ports already coincide',async()=>{
 const name=await segmentName('immediate');
 expect(name(4349.99)).toContain('教學');
 expect(name(4350)).toBe('墾丁海水浴場');
 expect(name(4800)).toBe('墾丁海水浴場');
 expect(name(6799.99)).toBe('墾丁海水浴場');
 expect(name(6800)).toBe('海岬沿岸');
 expect(name(7099.99)).toBe('海岬沿岸');
 expect(name(7100)).toBe('工作漁港');
 expect(name(7539.99)).toBe('工作漁港');
 expect(name(7540)).toBe('海岬沿岸');
 expect(name(8450)).toBe('岬口搶位');
});
