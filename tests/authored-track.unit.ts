import {expect,it} from 'vitest';
import {coastAuthoredRoad,type AuthoredRoad} from '../src/content/authored-road';
import {authoredRoadCourse,createAuthoredCoastTrack} from '../src/content/authored-track';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';

const identity={id:COAST_RUNTIME_IDENTITY.id,name:COAST_STAGE.manifest.name,sceneryAct:0};
it('P0: course spans cover the whole road without gaps or overlapping segments',()=>{
 const parts=authoredRoadCourse(coastAuthoredRoad,identity);
 expect(parts[0].start).toBe(0);
 expect(parts.at(-1)!.end).toBe(coastAuthoredRoad.startDistance+coastAuthoredRoad.length+600);
 for(let i=1;i<parts.length;i++)expect(parts[i].start).toBe(parts[i-1].end);
 for(const part of parts)expect(part.length).toBeGreaterThan(0);
 const turns=parts.filter(p=>p.targetRequiredSteering!==0);
 expect(turns).toHaveLength(coastAuthoredRoad.turns.length);
 expect(turns.map(p=>p.label)).toEqual(coastAuthoredRoad.turns.map(t=>t.label));
});

it('P0: track heading, elevation, curve and bank remain finite and continuous',()=>{
 const track=createAuthoredCoastTrack(coastAuthoredRoad,identity);
 const points=new Set([0,350,1085,3150,6800,10350,10950]);
 for(let d=0;d<=track.length;d+=29)points.add(d);
 for(const segment of [...coastAuthoredRoad.turns,...coastAuthoredRoad.elevations])
  for(const edge of [segment.start,segment.end])
   for(const n of [-.001,0,.001])points.add(edge+n);
 for(const d of [...points].sort((a,b)=>a-b)){
  const pose=track.sample(d),q=track.sample(Math.min(track.length,d+.001));
  expect(pose.position.toArray().every(Number.isFinite)).toBe(true);
  expect(pose.tangent.toArray().every(Number.isFinite)).toBe(true);
  expect(pose.right.toArray().every(Number.isFinite)).toBe(true);
  expect(pose.position.distanceTo(q.position),`continuity at ${d}`).toBeLessThan(.1);
  expect(Math.abs(pose.right.y),`bank at ${d}`).toBeLessThan(.4);
 }
});

it('P0: the active Worker and renderer share exact authored poses',()=>{
 const track=createAuthoredCoastTrack(coastAuthoredRoad,identity);
 const worker=coastWorkerRoad();
 for(let d=0;d<=track.length;d+=113){
  const a=track.sample(d),b=worker.track.sample(d);
  expect(a.position.distanceTo(b.position),`position ${d}`).toBeLessThan(1e-8);
  expect(a.right.y).toBe(b.right.y);
  expect(a.curvature).toBe(b.curvature);
  expect(a.challenge).toEqual(b.challenge);
 }
});

it('P0: edits to the JSON road can add stronger sweeps without code changes',()=>{
 const edited=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 edited.turns[0].steer=-.72;
 edited.elevations[0].rise=2.5;
 for(let i=1;i<edited.elevations.length;i++)edited.elevations[i].base=edited.elevations[i-1].base+edited.elevations[i-1].rise;
 const revised=createAuthoredCoastTrack(edited,identity),baseline=createAuthoredCoastTrack(coastAuthoredRoad,identity);
 const mid=(edited.turns[0].start+edited.turns[0].end)/2;
 expect(revised.sample(mid).curvature).not.toBeCloseTo(baseline.sample(mid).curvature,8);
 expect(revised.sample(5000).position.y).not.toBeCloseTo(baseline.sample(5000).position.y,8);
});
