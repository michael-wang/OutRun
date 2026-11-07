import * as THREE from 'three';
import {coastNatureGround} from './coast-nature';
import {FARM_SCARECROWS,FARM_FLOWER_COLORS,farmFlowerDetail,type FarmPlot} from './coast-farm-layout';
import {riceCanopyGeometry} from './coast-rice-canopy';
import {buildSurfaceLayout,sampleSurfaceData,packSurfaceSamples} from './vendor/three-stylized/surfaceSampler';
import {prepareFlowerInstances,type PreparedFlowerInstances} from './vendor/three-stylized/Wildflowers';
import type {createTrack} from './track';

type Sample=ReturnType<typeof createTrack>['sample'];
type NumericCanopy={
 position:Float32Array;uv:Float32Array;color:Float32Array;normal:Float32Array;
 index:Uint16Array|Uint32Array;
};
/** Worker-owned numeric preparation. No WebGL textures, materials, or DOM. */
export type PreparedFarmPlot={
 id:number;
 ground:Float32Array;
 canopy?:NumericCanopy;
 meadow?:{blades:Float32Array;flowers:Float32Array;flowerInstances?:PreparedFlowerInstances};
};
export function farmPrepTransferables(plot:PreparedFarmPlot):Transferable[]{
 const buffers:ArrayBuffer[]=[plot.ground.buffer as ArrayBuffer];
 if(plot.canopy)for(const a of [plot.canopy.position,plot.canopy.uv,plot.canopy.color,plot.canopy.normal,plot.canopy.index])buffers.push(a.buffer as ArrayBuffer);
 if(plot.meadow){
  for(const a of [plot.meadow.blades,plot.meadow.flowers])buffers.push(a.buffer as ArrayBuffer);
  if(plot.meadow.flowerInstances)for(const a of [
   plot.meadow.flowerInstances.matrices,plot.meadow.flowerInstances.variants,
   plot.meadow.flowerInstances.petalColors,plot.meadow.flowerInstances.foliageColors,
   plot.meadow.flowerInstances.centreColors,
  ])buffers.push(a.buffer as ArrayBuffer);
 }
 return buffers;
}

/** Precompute only data that was previously regenerated in every main-thread
 * createFarmPlot() call. Keep the exact interpolation and deterministic seeds.
 * This is also usable at build time for finite authored levels. */
export function prepareFarmPlot(plot:FarmPlot,sample:Sample):PreparedFarmPlot{
 const chunkStart=Math.floor(plot.start/1000)*1000,chunkEnd=chunkStart+1000;
 const rows=Math.ceil((plot.end-plot.start)/4),ground=new Float32Array((rows+1)*2);
 for(let i=0;i<=rows;i++){
  const d=plot.start+(plot.end-plot.start)*i/rows;
  ground[i*2]=coastNatureGround(sample,d,plot.left,chunkStart,chunkEnd);
  ground[i*2+1]=coastNatureGround(sample,d,plot.right,chunkStart,chunkEnd);
 }
 const position=(d:number,x:number,lift=0)=>{
  const p=sample(d),v=p.position.clone().addScaledVector(p.right,x);
  const f=THREE.MathUtils.clamp((d-plot.start)/(plot.end-plot.start)*rows,0,rows);
  const i=Math.min(rows-1,Math.floor(f)),t=f-i,u=(x-plot.left)/(plot.right-plot.left);
  v.y=THREE.MathUtils.lerp(THREE.MathUtils.lerp(ground[i*2],ground[i*2+1],u),THREE.MathUtils.lerp(ground[(i+1)*2],ground[(i+1)*2+1],u),t)+lift;
  return v;
 };
 const residentScarecrows=FARM_SCARECROWS.filter(s=>s.d>=plot.start&&s.d<plot.end&&s.x>plot.left&&s.x<plot.right);
 const clearPath=(d:number,x:number)=>residentScarecrows.some(s=>Math.abs(d-s.d)<2.2&&Math.abs(x-s.x)<3);
 const result:PreparedFarmPlot={id:plot.id,ground};
 if(plot.kind==='rice'){
  const g=riceCanopyGeometry(plot,position,clearPath);
  result.canopy={
   position:new Float32Array(g.getAttribute('position').array),
   uv:new Float32Array(g.getAttribute('uv').array),
   color:new Float32Array(g.getAttribute('color').array),
   normal:new Float32Array(g.getAttribute('normal').array),
   index:g.getIndex()!.array instanceof Uint32Array?
    new Uint32Array(g.getIndex()!.array):new Uint16Array(g.getIndex()!.array),
  };
  g.dispose();
 }else if(farmFlowerDetail(plot.band)){
  // Far terraces skip layout probes entirely; they retain opaque colour.
  // Same two-column surface/UVs as createFarmPlot's sampling clone.
  // Create it here without materials so coverage probes and sampling run off-thread.
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<=rows;i++){
   const d=plot.start+(plot.end-plot.start)*i/rows;
   for(const x of [plot.left,plot.right]){
    const p=position(d,x,.055);
    vertices.push(p.x,p.y,p.z);
    uv.push((x-plot.left)/(plot.right-plot.left),(d-plot.start)/(plot.end-plot.start));
   }
   if(i<rows){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const surface=new THREE.Mesh(geometry);
  const coverage={sample:({uv}:{uv:THREE.Vector2|null})=>
   uv&&uv.x>.035&&uv.x<.965&&uv.y>.015&&uv.y<.985&&((uv.x*20)%1)>.22
   &&!clearPath(plot.start+uv.y*(plot.end-plot.start),plot.left+uv.x*(plot.right-plot.left))?1:0};
  const budget=farmFlowerDetail(plot.band)!,seed=80483+plot.id;
  const layout=buildSurfaceLayout(surface,coverage);
  const count=layout.coveredArea>0?Math.max(1,Math.floor(layout.coveredArea*budget.bladeDensity)):0;
  const blades=packSurfaceSamples(sampleSurfaceData(surface,count,seed,coverage,layout));
  const flowerCount=Math.min(budget.maxFlowers,Math.round(layout.coveredArea*budget.flowerDensity));
  const samples=packSurfaceSamples(sampleSurfaceData(surface,flowerCount,seed,coverage,layout));
  const flowerInstances=prepareFlowerInstances(samples,seed,FARM_FLOWER_COLORS[plot.band%3]);
  result.meadow={blades,flowers:new Float32Array(),flowerInstances};
  geometry.dispose();
 }
 return result;
}
