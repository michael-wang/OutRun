import {afterEach,expect,it,vi} from 'vitest';

afterEach(()=>{
 vi.useRealTimers();
 vi.unstubAllGlobals();
 vi.resetModules();
});

it('automatically clears the stage cover after readiness and reopens it for replay',async()=>{
 vi.useFakeTimers();
 const ids=[
  'game-loading','loading-slow','startup-fallback',
  'startup-error','loading-hint','loading-fill','loading-percent',
  'loading-track','loading-title','loading-detail',
 ];
 const nodes=new Map(ids.map(id=>[id,{
  id,hidden:id==='loading-slow'||id==='startup-fallback',
  dataset:{} as Record<string,string>,style:{} as Record<string,string>,
  textContent:'',attributes:{} as Record<string,string>,
  removeAttribute(key:string){delete this.attributes[key];},
  setAttribute(key:string,value:string){this.attributes[key]=value;},
 }]));
 const root={dataset:{playerUi:'true',loading:'true'} as Record<string,string>};
 vi.stubGlobal('document',{
  documentElement:root,
  getElementById:(id:string)=>{
   const n=nodes.get(id);
   if(!n)throw Error('Unknown loading id '+id);
   return n;
  },
 });
 vi.resetModules();
 const {loadingProgress,loadingFinished,loadingStarted}=
  await import('../src/loading');
 const get=(id:string)=>nodes.get(id)!;
 loadingProgress(42,'正在建立公路','內部詳細準備說明');
 expect(get('loading-title').textContent).toBe('正在建立公路');
 expect(get('loading-track').attributes['aria-valuenow']).toBe('42');
 loadingFinished();
 expect(get('game-loading').hidden).toBe(false);
 vi.advanceTimersByTime(300);
 expect(get('game-loading').hidden).toBe(true);
 expect(root.dataset.loading).toBeUndefined();

 // Replay uses the same overlay but continues automatically after loading.
 loadingStarted();
 expect(get('game-loading').hidden).toBe(false);
 expect(get('game-loading').dataset.phase).toBe('loading');
 loadingFinished();
 vi.advanceTimersByTime(300);
 expect(get('game-loading').hidden).toBe(true);
 expect(root.dataset.loading).toBeUndefined();
});
