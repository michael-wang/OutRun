import * as T from 'three';

const colors={mid:0x51ff80,far:0x409dff};
// The geometry is already batched in world coordinates. Measure each authored
// group in its own street heading; never use the bounds of a whole city chunk.
export function createReviewLines(scene) {
 const drawables=[];
 scene.traverse(mesh=>{
  const groups=mesh.userData.reviewGroups;
  if(!groups)return;
  const pos=mesh.geometry.attributes.position, corners=new T.Vector3();
  const lines={mid:[],far:[]};
  for(const {first,last,yaw,layer} of groups){
   const c=Math.cos(yaw),s=Math.sin(yaw),bounds=new T.Box3();
   for(let i=first;i<last;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    bounds.expandByPoint(corners.set(c*x-s*z,pos.getY(i),s*x+c*z));
   }
   if(bounds.isEmpty())continue;
   const vertices=Array.from({length:8},(_,i)=>{
    const x=(i&1?bounds.max:bounds.min).x,y=(i&2?bounds.max:bounds.min).y,z=(i&4?bounds.max:bounds.min).z;
    return [c*x+s*z,y,-s*x+c*z];
   });
   for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))lines[layer].push(...vertices[i],...vertices[i|bit]);
  }
  for(const layer of ['mid','far']){
   if(!lines[layer].length)continue;
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(lines[layer],3));
   const mat=new T.LineBasicMaterial({color:colors[layer],toneMapped:false,depthWrite:false,fog:false});
   const line=new T.LineSegments(g,mat);line.name='review-'+layer;line.renderOrder=2;
   drawables.push({mesh,line});
  }
 });
 for(const {mesh,line}of drawables)mesh.add(line);
 return ()=>{for(const {mesh,line}of drawables){mesh.remove(line);line.geometry.dispose();line.material.dispose();}};
}
