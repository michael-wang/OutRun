import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {AUTO_SHADOW_PHASES,AUTO_SHADOW_TOTAL_SECONDS,autoShadowPhaseAt,AutoShadowBenchmark} from '../src/fps-auto-benchmark';

describe('automatic zero-touch coast shadow benchmark',()=>{
 it('provides neighboring A baselines for every ablation, plus a warmup',()=>{
  expect(AUTO_SHADOW_PHASES.map(p=>p.id)).toEqual(['warmup','A1','B','A2','C','A3','D','A4']);
  expect(AUTO_SHADOW_TOTAL_SECONDS).toBe(110);
  expect(autoShadowPhaseAt(0).id).toBe('warmup');
  expect(autoShadowPhaseAt(12).id).toBe('A1');
  expect(autoShadowPhaseAt(26).id).toBe('B');
  expect(autoShadowPhaseAt(40).id).toBe('A2');
  expect(autoShadowPhaseAt(54).id).toBe('C');
  expect(autoShadowPhaseAt(68).id).toBe('A3');
  expect(autoShadowPhaseAt(82).id).toBe('D');
  expect(autoShadowPhaseAt(96).id).toBe('A4');
  expect(autoShadowPhaseAt(110).id).toBe('complete');
  expect(AUTO_SHADOW_PHASES.filter(x=>x.compare&&x.id.startsWith('A'))).toHaveLength(4);
 });
 it('switches techniques by elapsed render time, not user taps',()=>{
  const map={dynamicMap:true,staticMap:true};
  const events:string[]=[];
  const bench=new AutoShadowBenchmark((id,on)=>{map[id]=on},(id)=>{events.push(id)});
  bench.noteTouch(0); // Single tap to launch the game.
  for(let ms=0;ms<=111000;ms+=1000)bench.tick(ms,true);
  expect(events).toEqual(['warmup','A1','B','A2','C','A3','D','A4','complete']);
  expect(map).toEqual({dynamicMap:true,staticMap:true});
  const snap=bench.snapshot(111000);
  expect(snap.phase).toBe('complete');
  expect(snap.stable).toBe(false);
  expect(snap.touchCount).toBe(1);
 });
 it('ignores the first four seconds of each phase, and six seconds after touch',()=>{
  const bench=new AutoShadowBenchmark(()=>{});
  bench.noteTouch(0);bench.tick(0,true);
  bench.tick(12900,true);
  expect(bench.snapshot(12900).phase).toBe('A1');
  expect(bench.snapshot(12900).stable).toBe(false);
  bench.tick(17000,true);
  expect(bench.snapshot(17000).stable).toBe(true);
  bench.noteTouch(18000);
  expect(bench.snapshot(20000).stable).toBe(false);
  expect(bench.snapshot(25000).stable).toBe(true);
 });
 it('pauses the protocol clock while the game is paused or backgrounded',()=>{
  const bench=new AutoShadowBenchmark(()=>{});
  bench.tick(0,true);
  bench.tick(4000,true);
  bench.tick(5000,false);
  bench.tick(90000,false);
  bench.tick(91000,true);
  expect(bench.snapshot(91000).elapsedSeconds).toBe(4);
  bench.tick(94000,true);
  expect(bench.snapshot(94000).elapsedSeconds).toBe(7);
 });
 it('wires the opt-in URL to the real render loop and diagnostic JSON',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  expect(main).toContain("params.get('autobench')==='1'");
  expect(main).toContain('autoShadowBenchmark?.tick(now,mode===');
  expect(main).toContain('auto:autoShadowBenchmark.snapshot(performance.now())');
  expect(main).toContain('autoShadowBenchmark?.noteTouch(performance.now())');
 });
});
