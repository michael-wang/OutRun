import {expect,it} from 'vitest';
import {createShoreSegmentIndex,type IndexedShoreEdge} from '../src/coast-shore-index';

/** Independent O(n) reference: prevents a fast but inaccurate coastline mask. */
function brute(edges:readonly IndexedShoreEdge[],x:number,z:number){
 let best=Infinity,idx=-1,fraction=0;
 edges.forEach((e,index)=>{
  const dx=e.bx-e.ax,dz=e.bz-e.az;
  const t=Math.max(e.lo,Math.min(e.hi,((x-e.ax)*dx+(z-e.az)*dz)/(dx*dx+dz*dz)));
  const xx=x-e.ax-dx*t,zz=z-e.az-dz*t,d=xx*xx+zz*zz;
  if(d<best){best=d;idx=index;fraction=t;}
 });
 return {best,idx,fraction};
}
it('R5c: BVH matches exhaustive nearest-segment queries on a long winding route',()=>{
 const segments:IndexedShoreEdge[]=Array.from({length:1500},(_,i)=>{
  const ax=i*13,az=700*Math.sin(i*.016),bx=(i+1)*13,bz=700*Math.sin((i+1)*.016);
  return {ax,az,bx,bz,lo:i===0?-200:0,hi:i===1499?200:1};
 });
 const tree=createShoreSegmentIndex(segments);
 for(let j=0;j<350;j++){
  const x=(j*137.39)%19600-150,z=1950*Math.sin(j*.131);
  const fast=tree.nearest(x,z),exact=brute(segments,x,z);
  expect(fast.distanceSquared).toBeCloseTo(exact.best,6);
  expect(fast.fraction).toBeCloseTo(exact.fraction,6);
  expect(fast.index).toBe(exact.idx);
 }
});
it('R5c: extended shoreline end caps and tight reversing segments stay correct',()=>{
 const data:IndexedShoreEdge[]=[
  {ax:0,az:0,bx:12,bz:0,lo:-200,hi:1},
  {ax:12,az:0,bx:12,bz:20,lo:0,hi:1},
  {ax:12,az:20,bx:0,bz:20,lo:0,hi:200},
 ];
 const tree=createShoreSegmentIndex(data);
 for(const [x,z] of [[-850,3],[0,7],[3,10],[8,20],[17,12],[12,50],[250,170],[12,0]]){
  const fast=tree.nearest(x,z),ref=brute(data,x,z);
  expect(fast.distanceSquared).toBeCloseTo(ref.best,6);
 }
 expect(()=>createShoreSegmentIndex([])).toThrow();
 expect(()=>createShoreSegmentIndex([{ax:0,az:0,bx:0,bz:0,lo:0,hi:1}])).toThrow();
});
