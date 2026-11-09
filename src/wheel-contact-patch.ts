import * as THREE from 'three';
import type {RayRange} from './road-chunk';

/** The same route-space broad phase for both the wheel probes and the full mesh raycaster. */
export function visitContactRows(ranges:RayRange[],distance:number,visit:(start:number,count:number)=>void){
 for(const range of ranges){
  if(distance+12<range.start||distance-12>range.end)continue;
  const rows=range.count/6,step=(range.end-range.start)/rows;
  const first=Math.max(0,Math.floor((distance-12-range.start)/step));
  const last=Math.min(rows,Math.ceil((distance+12-range.start)/step));
  if(last>first)visit(range.offset+first*6,(last-first)*6);
 }
}

class ContactTriangle {
 readonly a=new THREE.Vector3();
 readonly b=new THREE.Vector3();
 readonly c=new THREE.Vector3();
 minX=0;maxX=0;minZ=0;maxZ=0;
 side:THREE.Side=THREE.FrontSide;
 onRoad=false;
}

/** Scratch space shared by the four suspension probes. Refill from the currently attached
 * static ribbons every frame so chunk replacement and exact-distance ties keep mesh order. */
export class WheelContactPatch {
 private readonly triangles:ContactTriangle[]=[];
 private count=0;
 private readonly identity=new THREE.Matrix4();
 private readonly intersection=new THREE.Vector3();
 readonly point=new THREE.Vector3();
 readonly normal=new THREE.Vector3();
 onRoad=false;

 prepare(groups:THREE.Group[],distance:number){
  this.count=0;
  for(const group of groups)for(const object of group.children){
   if(object.userData.artVisualOnly||!object.layers.isEnabled(0))continue;
   const mesh=object as THREE.Mesh,ranges=mesh.userData.rayRanges as RayRange[]|undefined;
   // The fast path is for the worker's indexed, world-coordinate road ribbons only.
   if(!ranges||!mesh.isMesh||mesh.raycast!==THREE.Mesh.prototype.raycast||
    !mesh.matrixWorld.equals(this.identity)||Array.isArray(mesh.material)||mesh.morphTargetInfluences)return false;
   const {index,attributes}=mesh.geometry,positions=attributes.position;
   if(!index||!positions)return false;
   const side=mesh.material.side;
   visitContactRows(ranges,distance,(start,count)=>{
    for(let i=start;i<start+count;i+=3){
     const t=this.triangles[this.count]??(this.triangles[this.count]=new ContactTriangle());
     this.count++;
     t.a.fromBufferAttribute(positions,index.getX(i));
     t.b.fromBufferAttribute(positions,index.getX(i+1));
     t.c.fromBufferAttribute(positions,index.getX(i+2));
     t.minX=Math.min(t.a.x,t.b.x,t.c.x);t.maxX=Math.max(t.a.x,t.b.x,t.c.x);
     t.minZ=Math.min(t.a.z,t.b.z,t.c.z);t.maxZ=Math.max(t.a.z,t.b.z,t.c.z);
     t.side=side;t.onRoad=mesh.name==='driving-surface';
    }
   });
  }
  return true;
 }

 /** Vertical world-space ray. Keep the nearest face, including on layered roads. */
 intersect(ray:THREE.Raycaster){
  const {x,y,z}=ray.ray.origin;
  let best:ContactTriangle|undefined,nearest=Infinity;
  for(let i=0;i<this.count;i++){
   const t=this.triangles[i];
   if(x<t.minX||x>t.maxX||z<t.minZ||z>t.maxZ)continue;
   const hit=t.side===THREE.BackSide?
    ray.ray.intersectTriangle(t.c,t.b,t.a,true,this.intersection):
    ray.ray.intersectTriangle(t.a,t.b,t.c,t.side===THREE.FrontSide,this.intersection);
   if(!hit)continue;
   const distance=y-hit.y;
   if(distance<ray.near||distance>ray.far||distance>=nearest)continue;
   nearest=distance;best=t;this.point.copy(hit);
  }
  if(!best)return false;
  THREE.Triangle.getNormal(best.a,best.b,best.c,this.normal);
  this.onRoad=best.onRoad;
  return true;
 }
}
