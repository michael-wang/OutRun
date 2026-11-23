
import {expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {configureKentingCoast} from '../src/beach-macro';
import {addBeach2Macro} from '../src/beach2-macro';
import {addCoastGullFlights} from '../src/coast-gull-flights';
import {addCoastSwimmers} from '../src/coast-swimmers';
import {BEACH2_COVE_PARTIES} from '../src/beach2-composition-layout';
import {COAST_DIRECTION,COAST_INSTALLED_HEROES} from '../src/content/coast-direction';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachX} from '../src/coast-layout';
import {boatDeferred,landingDeferred} from '../src/content/kenting-neighbours';
import {KENTING_INSTALLATION,kentingStation} from '../src/kenting-installation';

it('installs one tower, its birds, its dry and immersed activity, and both offshore crawl lanes',()=>{
  configureKentingCoast();
  const sample=coastWorkerRoad().track.sample, world=new THREE.Scene();
  const root=addBeach2Macro(world,sample,{});
  const {tower,waterActors,shoreActivity}=root.userData;
  const rows=shoreActivity.placements as {station:number;kind:string;ground:number;water:boolean}[];
  const towers=rows.filter(row=>row.kind==='beach2-lighthouse');
  expect(towers).toHaveLength(1);
  expect(towers[0].station).toBe(kentingStation(1170));
  expect(tower.ground).toBeCloseTo(5,4);
  expect(rows.filter(row=>row.kind==='sand-building')).toHaveLength(2);
  expect(rows.filter(row=>!row.water).every(row=>row.ground>-4.5)).toBe(true);
  expect(shoreActivity.clearIntervals).toEqual([[kentingStation(950),kentingStation(1140)]]);
  expect(waterActors).toHaveLength(35);
  for(const actor of waterActors){
    expect(actor.bounds.min.y).toBeLessThan(actor.water);
    expect(actor.bounds.max.y).toBeGreaterThan(actor.water+.1);
  }

  const flights=addCoastGullFlights(world,sample,{station:tower.station,position:tower.world});
  flights.update(1,tower.station);
  expect(flights.inspect().find(f=>f.id==='lantern-cape')).toMatchObject({
    station:tower.station,count:5,active:true,center:[tower.world.x,tower.world.y+17,tower.world.z]
  });

  addCoastSwimmers(world,sample,{});
  const lanes=world.getObjectByName('cove-crawl-lanes') as THREE.InstancedMesh;
  const market=world.children.filter(o=>o.name==='coast-swim-area') as THREE.InstancedMesh[];
  expect(market).toHaveLength(1);
  expect(market[0].count).toBe(45); // eight swimmers and five retained town markers
  expect(lanes.count).toBe(10); // two swimmers, no extra marker row at the former cape
  const strokes=BEACH2_COVE_PARTIES.flatMap(p=>[...p]).filter(row=>row[2]==='stroke');
  for(const [index,[s,offshore]] of strokes.entries()){
    const station=kentingStation(s), frame=sample(station);
    const pos=frame.position.clone().addScaledVector(frame.right,coastBeachX(-26,station)-offshore);
    const matrix=new THREE.Matrix4();lanes.getMatrixAt(index*5,matrix);
    const actual=new THREE.Vector3().setFromMatrixPosition(matrix);
    expect(actual.x).toBeCloseTo(pos.x,3);expect(actual.z).toBeCloseTo(pos.z,3);
  }
  // Immediate uses the relocated build pipeline without shifting the accepted tower.
  if(KENTING_INSTALLATION.shifted)expect(towers[0].station).not.toBe(6020);
  if(KENTING_INSTALLATION.relocated)expect(Math.min(...rows.map(row=>row.station))).toBe(kentingStation(-375));
});

it('isolates only the unfinished harbour and woods placements in the trial layout',()=>{
  const trial=KENTING_INSTALLATION.relocated;
  for(const id of ['working-harbour','coastal-woods']){
    expect(COAST_DIRECTION.heroSlots.some(slot=>slot.id===id)).toBe(true);
    expect(COAST_INSTALLED_HEROES.some(slot=>slot.id===id)).toBe(!trial);
  }
  expect(COAST_INSTALLED_HEROES.find(slot=>slot.id==='beach-market')?.distance).toBe(kentingStation(1130));
  for(const station of [4490,4570,4775])expect(landingDeferred(station)).toBe(trial);
  expect(landingDeferred(8920)).toBe(false);
  for(const id of ['quay-trawler','quay-longliner'])expect(boatDeferred(id)).toBe(trial);
  expect(boatDeferred('bay-sail-entry')).toBe(false);
});

it('moves every beach placement and instance while removing the vacated footprint',async()=>{
  async function capture(layout:'original'|'relocated'){
    vi.resetModules();vi.stubEnv('VITE_KENTING_INSTALLATION',layout);
    const coast=await import('../src/beach-macro');
    coast.configureKentingCoast();
    const {coastWorkerRoad}=await import('../src/content/coast-worker-road');
    const {addBeach2Macro}=await import('../src/beach2-macro');
    const site=addBeach2Macro(new THREE.Scene(),coastWorkerRoad().track.sample,{});
    const batches=site.getObjectByName('instanced-beach-activity')!.children as THREE.InstancedMesh[];
    return {batches,rows:site.userData.shoreActivity.placements as {
      station:number;kind:string;lateral:number;ground:number
    }[],tower:site.userData.tower.world as THREE.Vector3};
  }
  try{
    const original=await capture('original'),moved=await capture('relocated');
    const shift=moved.tower.clone().sub(original.tower);
    expect(shift.length()).toBeCloseTo(650,6);
    expect(moved.rows.length).toBe(original.rows.length);
    expect(original.rows.find(row=>row.kind==='beach2-lighthouse')?.station).toBe(6020);
    expect(moved.rows.find(row=>row.kind==='beach2-lighthouse')?.station).toBe(6670);
    expect(moved.rows.some(row=>row.kind==='beach2-lighthouse'&&row.station===6020)).toBe(false);
    for(const [i,p] of original.rows.entries()){
      const at=moved.rows[i];
      expect(at.kind).toBe(p.kind);expect(at.station).toBe(p.station+650);
      expect(at.lateral).toBe(p.lateral);expect(at.ground).toBeCloseTo(p.ground,6);
    }
    const first=Math.min(...original.rows.map(p=>p.station));
    expect(moved.rows.filter(p=>p.station>=first&&p.station<first+650)).toHaveLength(0);
    expect(moved.batches.map(m=>[m.name,m.count])).toEqual(original.batches.map(m=>[m.name,m.count]));
    // Float32 translations at kilometre-scale world coordinates carry up to
    // half a millimetre of rounding. Orientation and scale remain unchanged.
    const before=new THREE.Matrix4(),after=new THREE.Matrix4(),expected=new THREE.Vector3(),actual=new THREE.Vector3();
    for(const [j,batch] of moved.batches.entries())for(let i=0;i<batch.count;i++){
      batch.getMatrixAt(i,after);original.batches[j].getMatrixAt(i,before);
      expected.setFromMatrixPosition(before).add(shift);actual.setFromMatrixPosition(after);
      expect(expected.distanceTo(actual)).toBeLessThan(.001);
      expect(after.setPosition(0,0,0).toArray()).toEqual(before.setPosition(0,0,0).toArray());
    }
  }finally{vi.unstubAllEnvs();vi.resetModules();}
});
