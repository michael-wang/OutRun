import {coastBeachX} from '../src/coast-layout';
import {afterAll,describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastBeachHeight,COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from '../src/scenery-cross-section';
import {bakeCoastShore,bakeCoastShoreAsync} from '../src/coast-shore';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';

const track=createPilotTrack(stage),shore=bakeCoastShore(track.sample,track.length);
afterAll(()=>shore.texture.dispose());
function field(x:number,z:number){
 const {data,width,height}=shore.texture.image as {data:Uint16Array;width:number;height:number};
 const u=(x-shore.bounds.x)/shore.bounds.z*width-.5,v=(z-shore.bounds.y)/shore.bounds.w*height-.5;
 const i=Math.floor(u),j=Math.floor(v),tx=u-i,tz=v-j;
 const at=(a:number,b:number)=>THREE.DataUtils.fromHalfFloat(data[(Math.max(0,Math.min(height-1,b))*width+Math.max(0,Math.min(width-1,a)))*4]);
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(i,j),at(i+1,j),tx),THREE.MathUtils.lerp(at(i,j+1),at(i+1,j+1),tx),tz);
}
describe('coastal road stays above a real beach',()=>{
 it('yields during loading without changing the shoreline texture',async()=>{
  const progress:number[]=[];let timerRan=false;
  const timer=setTimeout(()=>{timerRan=true;},0);
  const asyncShore=await bakeCoastShoreAsync(track.sample,track.length,p=>progress.push(p));
  try{
   expect(timerRan).toBe(true);
   expect(progress.length).toBeGreaterThan(1);
   expect(progress.at(-1)).toBe(1);
   expect(progress.every((p,i)=>i===0||p>=progress[i-1])).toBe(true);
   const a=shore.texture.image.data as Uint16Array,b=asyncShore.texture.image.data as Uint16Array;
   expect(b.length).toBe(a.length);
   expect(b.every((v,i)=>v===a[i])).toBe(true);
  }finally{clearTimeout(timer);asyncShore.texture.dispose();}
 },15000);
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
  expect(a.find(m=>m.kind==='asphalt')).toEqual(build(2700,2800,false).find(m=>m.kind==='asphalt'));
  const sandA=a.find(m=>m.kind==='sand')!,sandB=b.find(m=>m.kind==='sand')!,stride=41*6;
  // Every beach strip uses physical metres even while shoulder widths taper.
  for(let i=0;i<7;i++)expect(Array.from(sandA.positions.slice((i+1)*stride-6,(i+1)*stride))).toEqual(Array.from(sandB.positions.slice(i*stride,i*stride+6)));
 });
});
