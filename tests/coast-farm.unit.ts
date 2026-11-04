import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {coastNatureGround} from '../src/coast-nature';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {FARM_PLOTS,FARM_SCARECROWS,farmPlotsInChunk} from '../src/coast-farm-layout';
const track=createPilotTrack(COAST_ULTRA_STAGE);
it('owns every field exactly once, outside housing, wholly inside a streamed chunk and on the coastal plain',()=>{
 const ids=Array.from({length:11},(_,i)=>farmPlotsInChunk(i*1000,(i+1)*1000)).flat().map(p=>p.id);
 expect(new Set(ids).size).toBe(FARM_PLOTS.length);expect(ids.length).toBe(FARM_PLOTS.length);
 for(const p of FARM_PLOTS){
  expect(Math.floor(p.start/1000)).toBe(Math.floor((p.end+1.3)/1000));expect(p.right).toBeLessThan(88);
  expect(COAST_DISTRICTS.some(z=>p.start<z.end&&p.end>z.start)).toBe(false);
  for(let d=p.start;d<=p.end;d+=4){const start=Math.floor(d/1000)*1000,y=coastNatureGround(track.sample,d,p.left,start,start+1000),across=coastNatureGround(track.sample,d,p.right,start,start+1000),forward=coastNatureGround(track.sample,d+1,p.left,start,start+1000);
   expect(Math.abs(across-y)/(p.right-p.left)).toBeLessThan(.035);expect(Math.abs(forward-y)).toBeLessThan(.035);
  }
 }
 expect(FARM_SCARECROWS.length).toBeGreaterThanOrEqual(3);
 expect(FARM_SCARECROWS.every(d=>FARM_PLOTS.some(p=>p.kind==='rice'&&d>=p.start&&d<p.end))).toBe(true);
});
it('ships the requested scarecrow and two small derived rice LODs, without runtime external URLs',()=>{
 const glb=(name:string)=>{const b=readFileSync(`public/assets/coast-farm/${name}.glb`);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());};
 const triangles=(g:any)=>g.meshes.flatMap((m:any)=>m.primitives).reduce((n:number,p:any)=>n+g.accessors[p.indices??p.attributes.POSITION].count/3,0);
 expect(triangles(glb('rice-near'))).toBeLessThanOrEqual(200);expect(triangles(glb('rice-mid'))).toBeLessThanOrEqual(60);expect(triangles(glb('scarecrow'))).toBe(430);
 for(const name of ['rice-near','rice-mid','scarecrow']){const g=glb(name);expect(g.buffers.every((b:any)=>!b.uri)).toBe(true);expect(g.images??[]).toHaveLength(0);}
});
