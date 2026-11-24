import {afterEach,expect,it,vi} from 'vitest';

afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});

it('preserves independent Sail Bay patrol boats in both Kenting candidates',async()=>{
 for(const mode of ['original','relocated','immediate'] as const){
  vi.resetModules();vi.stubEnv('VITE_KENTING_INSTALLATION',mode);
  const {configureKentingCoast}=await import('../src/beach-macro');
  configureKentingCoast();
  const {COAST_BOATS,coastBoatAdmitted}=await import('../src/coast-boats');
  const byId=(id:string)=>COAST_BOATS.find(b=>b.id===id)!;
  const fleet=['bay-sail-entry','bay-sail-inlet','bay-sail-west','bay-sail-east','bay-sail-point'].map(byId);
  for(const boat of fleet)expect(coastBoatAdmitted(boat),mode+':'+boat.id).toBe(true);
  if(mode==='immediate'){
   for(const boat of fleet){
    expect(boat.distance-boat.travel-boat.length/2).toBeGreaterThan(4850);
    expect(boat.distance+boat.travel+boat.length/2).toBeLessThan(6250);
    expect(boat.offshore-boat.sway-boat.length/2).toBeGreaterThan(150);
   }
   expect(new Set(fleet.map(b=>b.distance)).size).toBe(5);
  }else expect(fleet.map(b=>b.distance)).toEqual([7080,7420,7770,8080,8415]);
  // R1 does not delete boats: it defers harbour ownership until R2.
  expect(coastBoatAdmitted(byId('quay-trawler'))).toBe(mode==='original');
  if(mode!=='original')expect(coastBoatAdmitted(byId('quay-longliner'))).toBe(false);
 }
});
