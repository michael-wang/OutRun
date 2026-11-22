/** #75: original coast right-hand ribbons; metres are TRACK, lateral is RAW road offset. */
export const KENTING_TERRAIN_DEMO={start:4550,end:4790,inner:29,outer:104} as const;

export function terrainDemoVisibleIndex(indices:Uint32Array,cuts:readonly {firstIndex:number;lastIndex:number}[]){
 const removed=cuts.reduce((total,c)=>total+c.lastIndex-c.firstIndex,0);
 const visible=new Uint32Array(indices.length-removed);
 let cursor=0,offset=0;
 for(const {firstIndex,lastIndex} of cuts){
  if(firstIndex<cursor||lastIndex<=firstIndex||lastIndex>indices.length)throw Error('Invalid terrain demo cut');
  visible.set(indices.subarray(cursor,firstIndex),offset);
  offset+=firstIndex-cursor;cursor=lastIndex;
 }
 visible.set(indices.subarray(cursor),offset);
 return visible;
}

export function terrainDemoRequested(query:URLSearchParams,dev=import.meta.env.DEV){
 return dev&&query.get('terrainDemo')==='1';
}

export function terrainDemoRibbon(from:number,to:number,a:number,b:number,rows:number){
 const p=KENTING_TERRAIN_DEMO;
 if(a<p.inner||b>p.outer||to<=p.start||from>=p.end||rows<=0)return undefined;
 const rowAt=(d:number)=>(d-from)*rows/(to-from);
 const first=rowAt(Math.max(from,p.start)),last=rowAt(Math.min(to,p.end));
 // Never cut partially covered stock triangles or silently change the footprint.
 if(Math.abs(first-Math.round(first))>1e-7||Math.abs(last-Math.round(last))>1e-7)return undefined;
 const lo=Math.round(first),hi=Math.round(last);
 if(hi<=lo)return undefined;
 const perimeter:number[]=[];
 for(let i=lo;i<=hi;i++){
  if(i===lo||i===hi||a===p.inner)perimeter.push(i*2);
  if(i===lo||i===hi||b===p.outer)perimeter.push(i*2+1);
 }
 return {firstIndex:lo*6,lastIndex:hi*6,perimeter};
}
