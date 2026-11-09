import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {expect,it,vi} from 'vitest';

const scope='https://example.org/OutRun/';
const prefix='outrun:'+scope+':';
const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8')
 .replace("'BUILD_REVISION'","'new-build'")
 .replace('/* BUILD_FILES */ []',"/* BUILD_FILES */ ['index.html','assets/new-bundle.js']");

function harness(){
 type Handler=(event:any)=>void;
 const handlers=new Map<string,Handler>();
 const entries=new Map<string,Map<string,Response>>();
 const urlOf=(input:Request|string)=>typeof input==='string'?input:input.url;
 const open=async(name:string)=>{
  if(!entries.has(name))entries.set(name,new Map());
  const items=entries.get(name)!;
  return {
   addAll:async(requests:Request[])=>{for(const req of requests)items.set(req.url,new Response('cached:'+req.url));},
   match:async(key:Request|string)=>items.get(urlOf(key))?.clone(),
   put:async(key:Request|string,value:Response)=>{items.set(urlOf(key),value.clone());},
  };
 };
 const caches={
  open,
  keys:async()=>[...entries.keys()],
  delete:async(name:string)=>entries.delete(name),
  match:async(key:Request|string)=>{
   for(const items of entries.values()){
    const found=items.get(urlOf(key));if(found)return found.clone();
   }
   return undefined;
  },
 };
 const skipWaiting=vi.fn(async()=>{});
 const claim=vi.fn(async()=>{});
 const fetch=vi.fn(async()=>new Response('latest-network-html',{status:200}));
 const self={
  registration:{scope},skipWaiting,clients:{claim},
  addEventListener:(kind:string,handler:Handler)=>{handlers.set(kind,handler);},
 };
 runInNewContext(source,{self,caches,fetch,URL,Request,Response});
 const lifecycle=async(kind:'install'|'activate')=>{
  let work:Promise<unknown>|undefined;
  handlers.get(kind)!({waitUntil:(promise:Promise<unknown>)=>{work=promise;}});
  if(!work)throw new Error(kind+' did not register a lifecycle promise');
  await work;
 };
 const request=async(url:string,mode:'navigate'|'cors'='cors')=>{
  let result:Promise<Response>|undefined;
  handlers.get('fetch')!({
   request:{url,method:'GET',mode},
   respondWith:(promise:Promise<Response>)=>{result=promise;},
  });
  if(!result)throw new Error('Unexpected unmanaged fetch: '+url);
  return result;
 };
 return {caches,fetch,skipWaiting,claim,lifecycle,request};
}

it('precaches the new release before activating and claiming existing tabs',async()=>{
 const worker=harness();
 await worker.lifecycle('install');
 expect(worker.skipWaiting).toHaveBeenCalledTimes(1);
 const keys=await worker.caches.keys();
 expect(keys).toContain(prefix+'new-build');
 expect(await (await worker.caches.open(prefix+'new-build')).match(scope+'index.html')).toBeDefined();
 await worker.lifecycle('activate');
 expect(worker.claim).toHaveBeenCalledTimes(1);
});

it('refreshes navigation from the network but still starts offline from the complete cache',async()=>{
 const worker=harness();
 await worker.lifecycle('install');
 await worker.lifecycle('activate');
 const fresh=await worker.request(scope+'?at=5200','navigate');
 expect(await fresh.text()).toBe('latest-network-html');
 expect(worker.fetch).toHaveBeenCalledTimes(1);
 expect(worker.fetch.mock.calls[0][1]).toEqual({cache:'no-cache'});
 worker.fetch.mockRejectedValueOnce(new Error('offline'));
 const offline=await worker.request(scope+'?at=5200','navigate');
 expect(await offline.text()).toBe('cached:'+scope+'index.html');
});

it('keeps one older release for lazy-loaded assets in still-open game tabs',async()=>{
 const worker=harness();
 await (await worker.caches.open(prefix+'obsolete')).put(scope+'assets/obsolete.js',new Response('obsolete'));
 await (await worker.caches.open(prefix+'previous')).put(scope+'assets/previous.js',new Response('previous-code'));
 await worker.lifecycle('install');
 await worker.lifecycle('activate');
 const keys=await worker.caches.keys();
 expect(keys).toContain(prefix+'new-build');
 expect(keys).toContain(prefix+'previous');
 expect(keys).not.toContain(prefix+'obsolete');
 const previous=await worker.request(scope+'assets/previous.js');
 expect(await previous.text()).toBe('previous-code');
 expect(worker.fetch).not.toHaveBeenCalled();
});
