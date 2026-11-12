import {coastBeachX} from '../src/coast-layout';
import {afterAll,describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastBeachHeight,COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from '../src/scenery-cross-section';
import {bakeCoastShore} from '../src/coast-shore';
import {packCoastShore,unpackCoastShore} from '../src/coast-shore-asset';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';

const runtime=coastWorkerRoad(),track=runtime.track,stage=runtime.stage,shore=bakeCoastShore(track.sample,track.length);
afterAll(()=>shore.texture.dispose());
function field(x:number,z:number,channel=0){
 const {data,width,height}=shore.texture.image as {data:Uint16Array;width:number;height:number};
 const u=(x-shore.bounds.x)/shore.bounds.z*width-.5,v=(z-shore.bounds.y)/shore.bounds.w*height-.5;
 const i=Math.floor(u),j=Math.floor(v),tx=u-i,tz=v-j;
 const at=(a:number,b:number)=>THREE.DataUtils.fromHalfFloat(data[(Math.max(0,Math.min(height-1,b))*width+Math.max(0,Math.min(width-1,a)))*4+channel]);
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(i,j),at(i+1,j),tx),THREE.MathUtils.lerp(at(i,j+1),at(i+1,j+1),tx),tz);
}
describe('coastal road stays above a real beach',()=>{
 it('rounds the fishing point, reverses toward the sunset and straightens before the finish',()=>{
  const heading=(d:number)=>track.sample(d).roadHeading;
  expect(heading(8950)-heading(9600)).toBeGreaterThan(.30);
  expect(heading(10250)-heading(9600)).toBeGreaterThan(.30);
  expect(Math.abs(heading(10350)-heading(8950))).toBeLessThan(.035);
  for(let d=10250;d<=10350;d+=10)expect(Math.abs(track.sample(d).curvature)).toBeLessThan(1e-6);
 });
 it('varies the waterline on each long straight and turns the baked surf with the sand points',()=>{
  for(const [start,end] of [[1000,2100],[2750,3150],[3800,4900],[5550,5850],[6500,7350],[8000,8300]]){
   const offsets=[];
   for(let d=start;d<=end;d+=10)offsets.push(coastBeachX(COAST_SHORE_OFFSET,d));
   expect(Math.max(...offsets)-Math.min(...offsets)).toBeGreaterThan(25);
  }
  const edge=(d:number)=>{const p=track.sample(d);return p.position.clone().addScaledVector(p.right,coastBeachX(COAST_SHORE_OFFSET,d));};
  for(const d of [1180,1380,6650,6880,9260,9690,9920]){
   const p=edge(d),t=edge(d+2).sub(edge(d-2)).setY(0).normalize();
   const outward=new THREE.Vector3(field(p.x,p.z,2),0,field(p.x,p.z,3));
   expect(Math.abs(field(p.x,p.z))).toBeLessThan(.75);
   expect(Math.abs(outward.dot(t))).toBeLessThan(.04);
   expect(outward.dot(track.sample(d).right)).toBeLessThan(-.85);
  }
 });
 it('loads the precomputed mask losslessly and rejects stale or truncated data',()=>{
  const packed=packCoastShore(shore),loaded=unpackCoastShore(packed);
  try{
   const a=shore.texture.image.data as Uint16Array,b=loaded.texture.image.data as Uint16Array;
   expect(b.length).toBe(a.length);
   expect(b.every((v,i)=>v===a[i])).toBe(true);
   expect(loaded.bounds.toArray()).toEqual(shore.bounds.toArray());
   expect(()=>unpackCoastShore(packed.subarray(0,packed.length-1))).toThrow('Invalid coast mask data');
   const stale=packed.slice(),keyOffset=new TextDecoder().decode(stale.subarray(0,256)).indexOf('"key":"')+7;
   stale[keyOffset]^=1;
   expect(()=>unpackCoastShore(stale)).toThrow('Coast mask is out of date');
  }finally{loaded.texture.dispose();}
 });
 it('keeps dry sand beside the complete road and a continuous sand-to-seabed slope',()=>{
  for(let d=350;d<=350+stage.length;d+=10){
   const p=track.sample(d);
   // Dry shoulder stays >1m above mean sea even on the banked bends;
   // nearshore waves stay below 0.42m and are clipped at the wet-sand line.
   expect(coastBeachHeight(-11,p.position.y,p.right.y,d)).toBeGreaterThan(COAST_SEA_LEVEL+1);
   expect(coastBeachHeight(coastBeachX(COAST_SHORE_OFFSET,d),p.position.y,p.right.y,d)).toBeCloseTo(COAST_SEA_LEVEL,8);
   for(const station of [-100,-46,-26,-18,-11,-7,13]){const x=coastBeachX(station,d);
    expect(Math.abs(coastBeachHeight(x-.0001,p.position.y,p.right.y,d)-coastBeachHeight(x+.0001,p.position.y,p.right.y,d))).toBeLessThan(.001);
   }
  }
 });
 it('excludes every lane and the inland terrain from water on bends as well as straights',()=>{
  for(let d=350;d<=350+stage.length;d+=10){
   const p=track.sample(d);
   for(const x of [-7,0,7,30,80]){
    const v=p.position.clone().addScaledVector(p.right,x);
    expect(field(v.x,v.z)).toBeLessThan(-15);
   }
   const sea=p.position.clone().addScaledVector(p.right,coastBeachX(-45,d));
   expect(field(sea.x,sea.z)).toBeGreaterThan(10);
  }
 });
 it('leaves the asphalt geometry unchanged and joins beach chunks without a height seam',()=>{
  const build=(a:number,b:number,coast:boolean)=>prepareRoadChunk(track.sample,()=>7,()=>[1,0,0],a,b,track.length,false,true,[],d=>shoulderProfile(d,stage.seed),undefined,true,undefined,coast?stage.scenerySections:undefined);
  const a=build(2700,2800,true),b=build(2800,2900,true);
  const coastPaved=a.find(m=>m.kind==='asphalt')!,original=build(2700,2800,false).find(m=>m.kind==='asphalt')!;
  // Main *drivable* asphalt and raycast geometry remain byte-equivalent;
  // the coast deliberately adds a new narrow asphalt apron where tan
  // shoulders have been replaced with an adjacent U channel.
  // New apron is baked first; original five-lane surface remains the
  // final asphalt ribbon in the material-merged geometry.
  const vertexOffset=(coastPaved.positions.length-original.positions.length)/3;
  const indexOffset=coastPaved.indices.length-original.indices.length;
  expect(Array.from(coastPaved.positions.slice(vertexOffset*3)))
   .toEqual(Array.from(original.positions));
  expect(Array.from(coastPaved.indices.slice(indexOffset),i=>i-vertexOffset))
   .toEqual(Array.from(original.indices));
  expect(coastPaved.positions.length).toBeGreaterThan(original.positions.length);
  const sandA=a.find(m=>m.kind==='sand')!,sandB=b.find(m=>m.kind==='sand')!,stride=41*6;
  // Every beach strip uses physical metres even while shoulder widths taper.
  for(let i=0;i<7;i++)expect(Array.from(sandA.positions.slice((i+1)*stride-6,(i+1)*stride))).toEqual(Array.from(sandB.positions.slice(i*stride,i*stride+6)));
 });
});
