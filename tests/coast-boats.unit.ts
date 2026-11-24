import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {COAST_BOATS,coastBoatPosition} from '../src/coast-boats';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {configureKentingCoast} from '../src/beach-macro';
import {coastBeachX} from '../src/coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from '../src/scenery-cross-section';
configureKentingCoast();
const track=coastWorkerRoad().track;

it('shows successive offshore sails along the beach without putting sails back in the harbour',()=>{
 const bay=COAST_BOATS.filter(b=>b.id.startsWith('bay-sail'));
 const stations=Array.from({length:23},(_,i)=>4850+i*40),tracksByBoat=new Set<string>();
 for(const time of [0,45,90,150,230]){
  let screens=0;
  for(const d of stations){
   const p=track.sample(d);
   const visible=bay.filter(boat=>{
    const delta=coastBoatPosition(boat,time,track.sample).position.sub(p.position);
    const angle=Math.atan2(delta.dot(p.right),delta.dot(p.tangent));
    return angle<0&&angle>-.68&&delta.length()<610&&boat.length/delta.length()>.042;
   });
   if(visible.length)screens++;
   visible.forEach(b=>tracksByBoat.add(b.id));
  }
  // This is an offshore accent, not an unbroken parade of boats.
  expect(screens/stations.length,'expected repeated sails ahead at t='+time+'s').toBeGreaterThanOrEqual(.60);
 }
 expect(tracksByBoat.size).toBeGreaterThanOrEqual(4);
});

it('keeps the expanded fleet safely offshore along the real curved coast for full patrols',()=>{
 expect(COAST_BOATS).toHaveLength(16);
 expect(COAST_BOATS.filter(b=>b.kind==='sail')).toHaveLength(11);
 expect(COAST_BOATS.filter(b=>b.kind==='yacht')).toHaveLength(1);
 expect(COAST_BOATS.filter(b=>b.kind==='fishing')).toHaveLength(4);
 expect(COAST_BOATS.filter(b=>b.kind==='fishing').every(b=>(b.distance>=4350&&b.distance<4950)||b.distance>=8450)).toBe(true);
 expect(COAST_BOATS.filter(b=>b.distance<1800)).toHaveLength(1);
 // The open separation from offshore sail patrols to offshore fishing patrols is intentional.
 expect(COAST_BOATS.some(b=>b.kind==='sail'&&b.distance>=6800&&b.distance<8450)).toBe(false);
 const shore=Array.from({length:Math.ceil(track.length/20)},(_,i)=>{const d=i*20,p=track.sample(d);return {road:p.position,right:p.right.clone().setY(0).normalize(),edge:coastBeachX(COAST_SHORE_OFFSET,d)};});
 for(const boat of COAST_BOATS)for(let t=0;t<=7200;t+=31){
  const p=coastBoatPosition(boat,t,track.sample),next=coastBoatPosition(boat,t+.25,track.sample);
  expect(p.position.y).toBe(COAST_SEA_LEVEL);expect(p.offshore-boat.length/2).toBeGreaterThan(25);
  expect(p.position.distanceTo(next.position)).toBeLessThan(.7);
  // Check the nearest actual road segment, not only the chosen local frame:
  // an offset on the sea side of one bend must not land on a different headland.
  let nearest=shore[0],best=Infinity;
  for(const row of shore){const d=(p.position.x-row.road.x)**2+(p.position.z-row.road.z)**2;if(d<best){best=d;nearest=row;}}
  const lateral=p.position.clone().sub(nearest.road).dot(nearest.right);
  expect(nearest.edge-lateral-boat.length/2).toBeGreaterThan(25);
 }
});

it('reuses two local source models within the expanded fleet geometry budget',()=>{
 let triangles=0;
 for(const file of ['boat-sail-a.glb','flybridge-yacht.glb']){
  const b=readFileSync('public/assets/coast-boats/'+file);expect(b.readUInt32LE(0)).toBe(0x46546c67);
  const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  for(const m of g.meshes)for(const p of m.primitives)triangles+=(g.accessors[p.indices??p.attributes.POSITION].count)/3;
  for(const image of g.images??[])if(image.uri){expect(image.uri).not.toMatch(/https?:/);expect(readFileSync('public/assets/coast-boats/'+image.uri).length).toBeGreaterThan(0);}
 }
 expect(triangles*2).toBeLessThan(15000);
 expect(triangles*7).toBeLessThan(51000);
});
