import {afterEach,expect,it,vi} from 'vitest';

afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});

it('preserves independent Sail Bay patrol boats in both Kenting candidates',async()=>{
 for(const mode of ['original','relocated','immediate'] as const){
  vi.resetModules();vi.stubEnv('VITE_KENTING_INSTALLATION',mode);
  const {configureKentingCoast}=await import('../src/beach-macro');
  configureKentingCoast();
  const {COAST_BOATS,coastBoatAdmitted}=await import('../src/coast-boats');
  const byId=(id:string)=>COAST_BOATS.find(b=>b.id===id)!;
  for(const id of ['bay-sail-entry','bay-sail-inlet','bay-sail-west','bay-sail-east','bay-sail-point']){
   expect(coastBoatAdmitted(byId(id)),mode+':'+id).toBe(true);
  }
  // R1 does not delete boats: it defers harbour ownership until R2.
  expect(coastBoatAdmitted(byId('quay-trawler'))).toBe(mode==='original');
  if(mode!=='original')expect(coastBoatAdmitted(byId('quay-longliner'))).toBe(false);
 }
});
