import {it,expect,vi} from 'vitest';

it('reopens the artwork progress surface on replay and cancels stale completion timers',async()=>{
 vi.useFakeTimers();vi.resetModules();
 const nodes=new Map<string,any>(),dataset:Record<string,string>={};
 const get=(id:string)=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',dataset:{},style:{},attributes:{},setAttribute(k:string,v:string){this.attributes[k]=v;}});return nodes.get(id);};
 vi.stubGlobal('document',{getElementById:get,documentElement:{dataset}});
 try{
  const l=await import('../src/loading');l.loadingFinished();l.loadingStarted();
  l.loadingProgress(35,'海岸','海浪與夕陽');vi.advanceTimersByTime(300);
  expect(get('game-loading').hidden).toBe(false);expect(dataset.loading).toBe('true');expect(get('loading-percent').textContent).toBe('35%');
  l.loadingProgress(20,'道路','進度不倒退');expect(get('loading-track').attributes['aria-valuenow']).toBe('35');
  l.loadingFinished();vi.advanceTimersByTime(300);expect(get('game-loading').hidden).toBe(true);expect(dataset.loading).toBeUndefined();
  l.loadingStarted();expect(get('loading-percent').textContent).toBe('0%');vi.advanceTimersByTime(15000);expect(get('loading-slow').hidden).toBe(false);
  l.loadingFailed('測試失敗');l.loadingFinished();vi.advanceTimersByTime(500);expect(get('game-loading').hidden).toBe(false);expect(get('startup-fallback').hidden).toBe(false);
 }finally{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();vi.resetModules();}
});
