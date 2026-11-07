import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {riceCanopyGeometry} from '../src/coast-rice-canopy';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastNatureGround} from '../src/coast-nature';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {FARM_PLOTS,FARM_SCARECROWS,FARM_ZONES,FARM_HOMES,RICE_YARDS,ricePlotEdges,farmPlotsInChunk} from '../src/coast-farm-layout';
import {ruralShowcaseReplacesFarmHome} from '../src/coast-rural-layout';
const track=createPilotTrack(COAST_ULTRA_STAGE);
it('owns every field exactly once, outside housing, wholly inside a streamed chunk and on the coastal plain',()=>{
 const ids=Array.from({length:11},(_,i)=>farmPlotsInChunk(i*1000,(i+1)*1000)).flat().map(p=>p.id);
 expect(new Set(ids).size).toBe(FARM_PLOTS.length);expect(ids.length).toBe(FARM_PLOTS.length);
 for(const p of FARM_PLOTS){
  expect(Math.floor(p.start/1000)).toBe(Math.floor((p.end+1.3)/1000));expect(p.right).toBeLessThan(260);
  expect(COAST_DISTRICTS.some(z=>p.start<z.end&&p.end>z.start)).toBe(false);
  for(let d=p.start;d<=p.end;d+=4){const start=Math.floor(d/1000)*1000,y=coastNatureGround(track.sample,d,p.left,start,start+1000),across=coastNatureGround(track.sample,d,p.right,start,start+1000),forward=coastNatureGround(track.sample,d+1,p.left,start,start+1000);
   expect(Math.abs(across-y)/(p.right-p.left)).toBeLessThan(.035);expect(Math.abs(forward-y)).toBeLessThan(.035);
  }
 }
 expect(FARM_SCARECROWS.length).toBeGreaterThanOrEqual(3);
 for(const s of FARM_SCARECROWS){const plot=FARM_PLOTS.find(p=>s.d>=p.start&&s.d<p.end&&s.x>p.left&&s.x<p.right)!;expect(plot).toBeDefined();expect(Math.abs(s.x-(plot.left+plot.right)/2)).toBeLessThan(1);expect(s.d-plot.start).toBeGreaterThan(40);expect(plot.end-s.d).toBeGreaterThan(40);expect(s.x-plot.left).toBeGreaterThan(10);}
 for(const z of FARM_ZONES)for(const kind of ['rice','flowers'] as const)expect(FARM_SCARECROWS.some(s=>s.d>=z[kind][0]&&s.d<z[kind][1])).toBe(true);
 expect(FARM_ZONES).toHaveLength(5);expect(Math.max(...FARM_PLOTS.map(p=>p.right))).toBeGreaterThan(240);
});
it('places farmhouse yards beside every farming zone without covering crops or district buildings',()=>{
 expect(FARM_HOMES).toHaveLength(12);
 for(const z of FARM_ZONES)expect(FARM_HOMES.some(h=>h.d>=z.start&&h.d<z.end)).toBe(true);
 for(const h of FARM_HOMES){
  expect(FARM_PLOTS.some(p=>h.d+12>p.start&&h.d-12<p.end&&h.x+10>p.left&&h.x-10<p.right)).toBe(false);
  expect(COAST_DISTRICTS.some(z=>h.d+12>z.start&&h.d-12<z.end)).toBe(false);
  const start=Math.floor(h.d/1000)*1000;expect(h.d-12).toBeGreaterThan(start);expect(h.d+12).toBeLessThan(start+1000);
  if(ruralShowcaseReplacesFarmHome(h.d))continue; // authored houses replace these yards beside the newly carved creek
  const heights=[-8,8].flatMap(x=>[-10,10].map(d=>coastNatureGround(track.sample,h.d+d,h.x+x,start,start+1000)));
  expect(Math.max(...heights)-Math.min(...heights),`yard at ${h.d}, ${h.x}`).toBeLessThan(.32);
 }
});
it('ships the requested scarecrow and two small derived rice LODs, without runtime external URLs',()=>{
 const glb=(name:string)=>{const b=readFileSync(`public/assets/coast-farm/${name}.glb`);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());};
 const triangles=(g:any)=>g.meshes.flatMap((m:any)=>m.primitives).reduce((n:number,p:any)=>n+g.accessors[p.indices??p.attributes.POSITION].count/3,0);
 // Near uses individual grains on six plants. Mid keeps its simplified envelope.
 const near=glb('rice-near').meshes[0].primitives;
 expect(near).toHaveLength(1);expect(near[0].indices).toBeDefined();
 expect(triangles(glb('rice-near'))).toBeLessThanOrEqual(2400);expect(triangles(glb('rice-mid'))).toBeLessThanOrEqual(90);expect(triangles(glb('scarecrow'))).toBe(430);
 for(const name of ['rice-near','rice-mid']){const g=glb(name),a=g.accessors[g.meshes[0].primitives[0].attributes.POSITION];expect(a.max[0]-a.min[0]).toBeGreaterThan(2.5);expect(a.max[2]-a.min[2]).toBeGreaterThan(1.7);expect(a.max[1]-a.min[1]).toBeGreaterThan(1.2);expect(a.max[1]).toBeLessThan(1.5);}
 for(const name of ['rice-near','rice-mid','scarecrow']){const g=glb(name);expect(g.buffers.every((b:any)=>!b.uri)).toBe(true);expect(g.images??[]).toHaveLength(0);}
});
it('keeps an opaque crop-height canopy across each rice plot while preserving scarecrow clearings',()=>{
 for(const plot of FARM_PLOTS.filter(p=>p.kind==='rice')){
  const residents=FARM_SCARECROWS.filter(s=>s.d>plot.start&&s.d<plot.end&&s.x>plot.left&&s.x<plot.right);
  const clear=(d:number,x:number)=>residents.some(s=>Math.abs(d-s.d)<2.2&&Math.abs(x-s.x)<3);
  const g=riceCanopyGeometry(plot,(d,x,lift)=>new Vector3(x,7+x*.008+lift,d),clear),p=g.getAttribute('position'),ix=g.index!;
  let area=0;const a=new Vector3(),b=new Vector3(),c=new Vector3();
  const cover=g.getAttribute('color');expect(cover.itemSize).toBe(4);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),z=p.getZ(i),height=p.getY(i)-7-x*.008;
   const edges=ricePlotEdges(plot,z);
   // World positions are Float32; longitudinal rounding at 9km can move
   // the evaluated slanted edge by a fraction of a millimetre.
   const margin=Math.abs(x-edges.left)<.001||Math.abs(x-edges.right)<.001||z===plot.start||z===plot.end;
   expect(height).toBeGreaterThan(margin?.06:.75);expect(height).toBeLessThan(margin?.37:.92);
   expect(cover.getW(i)<1).toBe(margin);
  }
  for(let i=0;i<ix.count;i+=3){a.fromBufferAttribute(p,ix.getX(i));b.fromBufferAttribute(p,ix.getX(i+1));c.fromBufferAttribute(p,ix.getX(i+2));area+=Math.abs((b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z))/2;}
  const rows=p.count/(Math.ceil((plot.right-plot.left)/2)+1)-1,step=(plot.end-plot.start)/rows;
  let footprint=0;
  for(let row=0;row<=rows;row++){
   const {left,right}=ricePlotEdges(plot,plot.start+step*row);
   footprint+=(right-left)*step*(row===0||row===rows?.5:1);
  }
  expect(area/footprint).toBeGreaterThan(.98);expect(area/footprint).toBeLessThan(1.001);
  expect(ix.count/3).toBeLessThan(2400);
  // The crop-top surface must not cover the scarecrow's central footpath.
  for(const s of residents){let covers=false;for(let i=0;i<ix.count;i+=3){a.fromBufferAttribute(p,ix.getX(i));b.fromBufferAttribute(p,ix.getX(i+1));c.fromBufferAttribute(p,ix.getX(i+2));if(Math.min(a.x,b.x,c.x)<s.x&&Math.max(a.x,b.x,c.x)>s.x&&Math.min(a.z,b.z,c.z)<s.d&&Math.max(a.z,b.z,c.z)>s.d)covers=true;}expect(covers).toBe(false);}
  g.dispose();
 }
});

it('keeps the first paddy below the road, with level benches rising toward the hills',()=>{
 for(const zone of FARM_ZONES){
  const d=zone.rice[0]+54,start=Math.floor(d/1000)*1000,road=track.sample(d).position.y;
  let previous=-Infinity;
  for(const plot of FARM_PLOTS.filter(p=>p.kind==='rice'&&d>=p.start&&d<=p.end)){
   const {left,right}=ricePlotEdges(plot,d);
   const bed=(x:number)=>coastNatureGround(track.sample,d,x,start,start+1000)+.055;
   const h=bed((left+right)/2);
   if(plot.band===0)expect(h).toBeLessThan(road-.65);
   expect(h-previous).toBeGreaterThan(.55);
   expect(Math.abs(bed(left+3)-bed(right-3))).toBeLessThan(.16);
   previous=h;
  }
 }
 for(const yard of RICE_YARDS){
  const p=FARM_PLOTS.find(p=>p.yard===yard)!;
  for(const d of [yard.d-4,yard.d,yard.d+4])expect(ricePlotEdges(p,d).right+1.4).toBeLessThan(yard.x-4);
 }
});
