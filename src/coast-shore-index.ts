/** Exact, tiny 2D segment AABB tree for the OFFLINE coastline bake.
 * No renderer, GPU resource, dynamic import or spatial simulation.
 * End caps use the same -200 / +200 extended-segment parameters as R8. */
export interface IndexedShoreEdge{
 ax:number;az:number;bx:number;bz:number;lo:number;hi:number;
}
type EdgeRecord=IndexedShoreEdge&{
 index:number;dx:number;dz:number;inv:number;
 minX:number;maxX:number;minZ:number;maxZ:number;
};
type Node={
 minX:number;maxX:number;minZ:number;maxZ:number;
 left?:Node;right?:Node;edges?:EdgeRecord[];
};
const bound=(box:Pick<Node,'minX'|'maxX'|'minZ'|'maxZ'>,x:number,z:number)=>{
 const dx=Math.max(box.minX-x,0,x-box.maxX),dz=Math.max(box.minZ-z,0,z-box.maxZ);
 return dx*dx+dz*dz;
};
function build(edges:EdgeRecord[]):Node{
 const box:Node={
  minX:Math.min(...edges.map(e=>e.minX)),
  maxX:Math.max(...edges.map(e=>e.maxX)),
  minZ:Math.min(...edges.map(e=>e.minZ)),
  maxZ:Math.max(...edges.map(e=>e.maxZ)),
 };
 if(edges.length<=8){box.edges=edges;return box;}
 const axis=box.maxX-box.minX>box.maxZ-box.minZ?'x':'z';
 edges.sort((a,b)=>axis==='x'
  ?(a.minX+a.maxX)-(b.minX+b.maxX)
  :(a.minZ+a.maxZ)-(b.minZ+b.maxZ));
 const middle=edges.length>>>1;
 box.left=build(edges.slice(0,middle));
 box.right=build(edges.slice(middle));
 return box;
}
export function createShoreSegmentIndex(lines:readonly IndexedShoreEdge[]){
 if(!lines.length)throw Error('Shoreline needs a segment');
 const edges:EdgeRecord[]=lines.map((seg,index)=>{
  const dx=seg.bx-seg.ax,dz=seg.bz-seg.az,denom=dx*dx+dz*dz;
  if(!(denom>1e-10)||!Number.isFinite(denom)||!(seg.lo<=seg.hi))
   throw Error('Invalid shore segment');
  const x0=seg.ax+dx*seg.lo,x1=seg.ax+dx*seg.hi;
  const z0=seg.az+dz*seg.lo,z1=seg.az+dz*seg.hi;
  return {...seg,index,dx,dz,inv:1/denom,
   minX:Math.min(x0,x1),maxX:Math.max(x0,x1),
   minZ:Math.min(z0,z1),maxZ:Math.max(z0,z1)};
 });
 const root=build(edges);
 return {
  nearest(x:number,z:number){
   let best=Infinity,index=0,fraction=0;
   const visit=(node:Node)=>{
    if(bound(node,x,z)>best)return;
    if(node.edges){
     for(const seg of node.edges){
      if(bound(seg,x,z)>best)continue;
      const t=Math.max(seg.lo,Math.min(seg.hi,
       ((x-seg.ax)*seg.dx+(z-seg.az)*seg.dz)*seg.inv));
      const ex=x-seg.ax-seg.dx*t,ez=z-seg.az-seg.dz*t;
      const dist=ex*ex+ez*ez;
      if(dist<best||(dist===best&&seg.index<index)){best=dist;index=seg.index;fraction=t;}
     }
     return;
    }
    const left=node.left!,right=node.right!,a=bound(left,x,z),b=bound(right,x,z);
    if(a<=b){if(a<=best)visit(left);if(b<=best)visit(right);}
    else {if(b<=best)visit(right);if(a<=best)visit(left);}
   };
   visit(root);
   return {index,fraction,distanceSquared:best};
  },
 };
}
