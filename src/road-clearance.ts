import type {Vector3} from 'three';

/** Broad-phase grid over the original 25 m clearance segments. The final
 * distance predicate is unchanged, including width at the segment start. */
export class RoadClearance {
 private cells=new Map<string,number[]>();
 private widths:number[]=[];
 private maxWidth=0;
 readonly stats={queries:0,checks:0,rejected:0};
 constructor(private points:Vector3[],halfAt:(d:number)=>number,private openRoad=false,private cellSize=200){
  for(let i=0;i<points.length-(openRoad?1:0);i++){
   const a=points[i],b=points[(i+1)%points.length],width=halfAt(i*25);
   this.widths[i]=width;this.maxWidth=Math.max(this.maxWidth,width);
   for(let x=Math.floor(Math.min(a.x,b.x)/cellSize);x<=Math.floor(Math.max(a.x,b.x)/cellSize);x++)
    for(let z=Math.floor(Math.min(a.z,b.z)/cellSize);z<=Math.floor(Math.max(a.z,b.z)/cellSize);z++){
     const key=`${x},${z}`,cell=this.cells.get(key)??[];cell.push(i);this.cells.set(key,cell);
    }
  }
 }
 clear(base:Pick<Vector3,'x'|'z'>,radius:number){
  this.stats.queries++;
  const reach=radius+this.maxWidth+5,visited=new Set<number>();
  for(let x=Math.floor((base.x-reach)/this.cellSize);x<=Math.floor((base.x+reach)/this.cellSize);x++)
   for(let z=Math.floor((base.z-reach)/this.cellSize);z<=Math.floor((base.z+reach)/this.cellSize);z++)
    for(const i of this.cells.get(`${x},${z}`)??[]){
     if(visited.has(i))continue;visited.add(i);this.stats.checks++;
     const a=this.points[i],b=this.points[(i+1)%this.points.length],dx=b.x-a.x,dz=b.z-a.z;
     const t=Math.max(0,Math.min(1,((base.x-a.x)*dx+(base.z-a.z)*dz)/(dx*dx+dz*dz)));
     if(!(Math.hypot(a.x+t*dx-base.x,a.z+t*dz-base.z)>radius+this.widths[i]+5)){this.stats.rejected++;return false;}
    }
  return true;
 }
}
