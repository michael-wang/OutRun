import {FARM_PLOTS,type FarmPlot} from './coast-farm-layout';
import {farmGroundLength} from './coast-farm-prep';

// The build emits the table in authored plot order alongside its hashed Worker.
// Keep the master buffer inside the Worker. Each transferable plot owns its rows.
export function readFarmGround(buffer:ArrayBuffer){
 const heights=new Float32Array(buffer),offsets=new Map<number,number>();
 let offset=0;
 for(const plot of FARM_PLOTS){
  offsets.set(plot.id,offset);
  offset+=farmGroundLength(plot);
 }
 if(offset!==heights.length)throw Error('Incomplete coastal farm ground table');
 return (plot:FarmPlot)=>{
  const start=offsets.get(plot.id);
  if(start===undefined)throw Error('Unknown coastal farm plot');
  return heights.slice(start,start+farmGroundLength(plot));
 };
}

export async function loadFarmGround(){
 const response=await fetch(new URL('./generated/coast-farm-ground.bin',import.meta.url));
 if(!response.ok||!response.body)throw Error('Coastal farm ground download failed');
 const decoded=response.body.pipeThrough(new DecompressionStream('gzip'));
 return readFarmGround(await new Response(decoded).arrayBuffer());
}
