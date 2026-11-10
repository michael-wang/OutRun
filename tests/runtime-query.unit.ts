import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {GAME_QUERY_KEYS,canonicalGameQuery} from '../src/runtime-query';
it('accepts only approved diagnostics, positioning and replayable traffic seed',()=>{
 expect(GAME_QUERY_KEYS).toEqual(['fpsdiag','startupdiag','at','trafficSeed','rivaldebug']);
 expect(canonicalGameQuery(new URLSearchParams('showcase=coast&qa=1&fpsbench=1&autobench=1&fpsdiag=1&startupdiag=1&at=6500')).toString()).toBe('fpsdiag=1&startupdiag=1&at=6500');
 expect(canonicalGameQuery(new URLSearchParams('showcase=canyon&at=NaN&fpsdiag=0')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=349')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=850&trafficSeed=2026&foo=1')).toString()).toBe('at=850&trafficSeed=2026');
 expect(canonicalGameQuery(new URLSearchParams('rivaldebug=1')).toString()).toBe('rivaldebug=1');
 expect(canonicalGameQuery(new URLSearchParams('trafficSeed=not-a-number')).toString()).toBe('');
});
it('defaults to a playable coast without the 0-speed FPS benchmark',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 expect(main).toContain('coastUltraMode=true');
 expect(main).toContain('const playerUi=!!trip;');
 expect(main).toContain('if(atDistance!==null){state.distance=atDistance;state.speed=0;}');
 expect(main).not.toContain('fpsBenchDistance');
 expect(main).not.toContain('autoShadowBenchmark');
 expect(main).not.toContain("params.get('showcase')");
});
