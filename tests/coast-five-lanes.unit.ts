import {it,expect} from 'vitest';
import {TrafficLanes,coastalLaneRebase} from '../src/traffic-lanes';
import {prepareRoadChunk} from '../src/road-chunk';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {shoulderProfile} from '../src/road-profile';
import {Vector3} from 'three';

it('paints exactly four internal separators for five equal coastal lanes',()=>{
 const track=coastWorkerRoad().track,d=1200,p=track.sample(d+1);
 const mesh=prepareRoadChunk(track.sample,()=>8.75,()=>[1,0,0],d,d+3,track.length,false,true,[],x=>shoulderProfile(x,804),undefined,true,undefined,coastWorkerRoad().stage.scenerySections).find(m=>m.kind==='line')!;
 // Lane width is measured in plan. right.y carries the rise per horizontal
 // metre. A 3D dot would scale the lateral coordinate by 1 + slope².
 const across=p.right.clone().setY(0).normalize(),separators=[-5.25,-1.75,1.75,5.25];
 const found=new Set<number>();
 for(let i=0;i<mesh.positions.length;i+=3){
  const x=new Vector3().fromArray(mesh.positions,i).sub(p.position).dot(across);
  if(Math.abs(x)>=7)continue;
  const stripe=separators.find(center=>Math.abs(x-center)<.2);
  expect(stripe,`unexpected lane paint at ${x}m`).toBeDefined();
  found.add(stripe!);
 }
 expect([...found].sort((a,b)=>a-b)).toEqual(separators);
});
it('keeps coastal traffic targets on five-lane centers and smoothly rebases the highway taper',()=>{
 for(let seed=0;seed<10;seed++){
  const lanes=new TrafficLanes(seed,true),actors=[{id:0,distance:130,speed:15,lateral:0}];
  for(let t=0;t<8;t+=.1)lanes.update(t,actors,()=>8.75,{distance:0,lateral:7,speed:15},()=>false);
  for(const s of lanes.inspect())expect(Math.abs(s.to/3.5-Math.round(s.to/3.5))).toBeLessThan(.00001);
 }
 for(const x of [-7,-3.5,0,3.5,7]){let value=x;for(let i=1;i<=240;i++){const next=coastalLaneRebase(value,1.75*(i-1)/240,1.75*i/240);expect(Math.abs(next-value)).toBeLessThan(.01);value=next;}expect([-5.25,-1.75,1.75,5.25]).toContain(value===0?0:Math.round(value*100)/100);}
});
