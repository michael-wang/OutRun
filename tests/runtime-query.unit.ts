import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {GAME_QUERY_KEYS,DEV_QUERY_KEYS,canonicalGameQuery} from '../src/runtime-query';
it('accepts only approved diagnostics, positioning and replayable traffic seed',()=>{
 expect(GAME_QUERY_KEYS).toEqual(['fpsdiag','startupdiag','at','trafficSeed','rivaldebug']);
 expect(canonicalGameQuery(new URLSearchParams('showcase=coast&qa=1&fpsbench=1&autobench=1&fpsdiag=1&startupdiag=1&at=6500')).toString()).toBe('fpsdiag=1&startupdiag=1&at=6500');
 expect(canonicalGameQuery(new URLSearchParams('showcase=canyon&at=NaN&fpsdiag=0')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=349')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=850&trafficSeed=2026&foo=1')).toString()).toBe('at=850&trafficSeed=2026');
 expect(canonicalGameQuery(new URLSearchParams('rivaldebug=1')).toString()).toBe('rivaldebug=1');
 expect(canonicalGameQuery(new URLSearchParams('trafficSeed=not-a-number')).toString()).toBe('');
});
it('exposes authored-prefab QA only in development builds',()=>{
 expect(DEV_QUERY_KEYS).toEqual(['prefabdebug','r5qa','r6','hairWind','hairMid','hairUpper']);
 const keys=canonicalGameQuery(new URLSearchParams('at=985&prefabdebug=1'));
 expect(keys.get('at')).toBe('985');
 expect(keys.has('prefabdebug')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('prefabdebug=0')).has('prefabdebug')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('r5qa=1')).has('r5qa')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('r6=previous')).has('r6')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('r6=unknown')).has('r6')).toBe(false);
 for(const preset of ['baseline','dramatic','wild'])expect(canonicalGameQuery(new URLSearchParams('hairWind='+preset)).has('hairWind')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairWind=unknown')).has('hairWind')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('hairMid=old')).has('hairMid')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairMid=new')).has('hairMid')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('hairUpper=old')).has('hairUpper')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairUpper=invalid')).has('hairUpper')).toBe(false);
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
