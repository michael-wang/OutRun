import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {COAST_BOATS,coastBoatPosition} from '../src/coast-boats';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastBeachX} from '../src/coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from '../src/scenery-cross-section';
const track=createPilotTrack(COAST_ULTRA_STAGE);

it('keeps exactly four vessels safely offshore along the real curved coast for full patrols',()=>{
 expect(COAST_BOATS.filter(b=>b.kind==='sail')).toHaveLength(2);expect(COAST_BOATS.filter(b=>b.kind==='yacht')).toHaveLength(2);
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

it('ships original local GLB models within the four-boat geometry budget',()=>{
 let triangles=0;
 for(const file of ['boat-sail-a.glb','flybridge-yacht.glb']){
  const b=readFileSync('public/assets/coast-boats/'+file);expect(b.readUInt32LE(0)).toBe(0x46546c67);
  const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  for(const m of g.meshes)for(const p of m.primitives)triangles+=(g.accessors[p.indices??p.attributes.POSITION].count)/3;
  for(const image of g.images??[])if(image.uri){expect(image.uri).not.toMatch(/https?:/);expect(readFileSync('public/assets/coast-boats/'+image.uri).length).toBeGreaterThan(0);}
 }
 expect(triangles*2).toBeLessThan(15000);
});
