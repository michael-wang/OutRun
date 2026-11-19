import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {GAME_QUERY_KEYS,DEV_QUERY_KEYS,canonicalGameQuery,isDevelopmentRace} from '../src/runtime-query';
it('accepts only approved diagnostics, positioning and replayable traffic seed',()=>{
 expect(GAME_QUERY_KEYS).toEqual(['car','fpsdiag','startupdiag','at','trafficSeed','rivaldebug']);
 expect(canonicalGameQuery(new URLSearchParams('showcase=coast&qa=1&fpsbench=1&autobench=1&fpsdiag=1&startupdiag=1&at=6500')).toString()).toBe('fpsdiag=1&startupdiag=1&at=6500');
 expect(canonicalGameQuery(new URLSearchParams('showcase=canyon&at=NaN&fpsdiag=0')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=349')).toString()).toBe('');
 expect(canonicalGameQuery(new URLSearchParams('at=850&trafficSeed=2026&foo=1')).toString()).toBe('at=850&trafficSeed=2026');
 expect(canonicalGameQuery(new URLSearchParams('rivaldebug=1')).toString()).toBe('rivaldebug=1');
 expect(canonicalGameQuery(new URLSearchParams('trafficSeed=not-a-number')).toString()).toBe('');
});
it('exposes authored-prefab QA only in development builds',()=>{
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=b')).get('beachMacro')).toBe(import.meta.env.DEV?'b':null);
 for(const variant of ['right'])expect(canonicalGameQuery(new URLSearchParams('beachMacro='+variant)).get('beachMacro')).toBe(import.meta.env.DEV?variant:null);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=left')).has('beachMacro')).toBe(false);
 expect(DEV_QUERY_KEYS).toContain('sunsetRoute');
 expect(canonicalGameQuery(new URLSearchParams('sunsetRoute=1')).has('sunsetRoute')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=b&sunsetRoute=1')).has('sunsetRoute')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachMacro=right&sunsetRoute=1')).has('sunsetRoute')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('beachBlockout=1&beachAnchor=6100')).has('beachBlockout')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('beachBlockout=0')).get('beachBlockout')).toBe(import.meta.env.DEV?'0':null);
 expect(canonicalGameQuery(new URLSearchParams('beachAnchor=6100')).has('beachAnchor')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('beachBlockout=1&beachAnchor=NaN')).has('beachAnchor')).toBe(false);
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
 expect(canonicalGameQuery(new URLSearchParams('hairStyle=r6c')).has('hairStyle')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairStyle=r6d')).has('hairStyle')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairStyle=r6f')).has('hairStyle')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairStyle=r6g')).has('hairStyle')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('hairStyle=invalid')).has('hairStyle')).toBe(false);
 expect(canonicalGameQuery(new URLSearchParams('heroine=previous')).has('heroine')).toBe(import.meta.env.DEV);
 expect(canonicalGameQuery(new URLSearchParams('heroine=invalid')).has('heroine')).toBe(false);
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

it('preserves explicit classic rollback and defaults all other values',()=>{expect(canonicalGameQuery(new URLSearchParams('car=classic')).get('car')).toBe('classic');expect(canonicalGameQuery(new URLSearchParams('car=unknown')).has('car')).toBe(false);});

it('auto-runs only effective, validated options in development',()=>{
 const selected=(query:string)=>isDevelopmentRace(canonicalGameQuery(new URLSearchParams(query)));
 for(const query of ['', 'utm_source=test','hero3d=1','sunSide=left','at=0x1200','at=14550','at=1e3','fpsdiag=false','trafficSeed=-1'])expect(selected(query)).toBe(false);
 for(const query of ['at=350','at=4600.25','at=14549','trafficSeed=0','fpsdiag=1','utm_source=test&beach2=1','car=classic'])expect(selected(query)).toBe(import.meta.env.DEV);
});
