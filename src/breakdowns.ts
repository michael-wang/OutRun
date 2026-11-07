import * as THREE from 'three';
import type {createTrack} from './track';
import type {SceneAnnotation} from './streamed-scene';
import {trafficRandom} from './traffic-lanes';
type Sample=ReturnType<typeof createTrack>['sample'];
export interface Breakdown{
 id:number;type:number;distance:number;speed:number;group:number;
 stationary:true;stopSide:number;
}
/** Just one coastal breakdown, strictly inside the final approach. Last
 * 650m are CLEAN: no stalled vehicle, warning cones or smoke near credits.
 * Non-coastal tracks retain their previous spaced hazard pattern. */
export const COAST_BREAKDOWN={firstBeforeEnd:1450,lastBeforeEnd:650,maxCount:1} as const;
export function breakdownLayout(
 sample:Sample,halfAt:(d:number)=>number,length:number,seed:number,coast=false,
):Breakdown[]{
 const out:Breakdown[]=[];
 let next=coast
  ?Math.max(400,length-COAST_BREAKDOWN.firstBeforeEnd)+trafficRandom(seed,901)*175
  :1800+trafficRandom(seed,901)*450;
 const last=length-(coast?COAST_BREAKDOWN.lastBeforeEnd:900);
 for(let d=Math.ceil(next/25)*25;d<last;d+=25){
  if(d<next)continue;
  const width=halfAt(d),end=sample(d);
  if(width<6.9||Math.abs(end.right.y)>.15)continue;
  let safe=true;
  for(let x=d-400;x<=d+80;x+=20){
   const p=sample(x),grade=p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z);
   if(Math.abs(p.curvature)>.0012||Math.abs(grade)>.16||
      Math.abs(halfAt(x)-width)>.1){safe=false;break;}
  }
  if(!safe)continue;
  const eye=sample(d-400).position.y+5;
  for(let x=d-380;x<d;x+=20)if(sample(x).position.y>
    eye+(end.position.y+1.2-eye)*(x-d+400)/400-.4){safe=false;break;}
  if(!safe)continue;
  const i=out.length;
  out.push({id:100000+i,type:i%4,distance:d,speed:0,group:-1,
   stationary:true,stopSide:trafficRandom(seed,i+950)<.5?-1:1});
  if(coast&&out.length>=COAST_BREAKDOWN.maxCount)break;
  next=d+11000+trafficRandom(seed,i+980)*4000;
 }
 return out;
}
export function breakdownAnnotations(sample:Sample,halfAt:(d:number)=>number,recipes:Breakdown[]):SceneAnnotation[]{
 const red=new THREE.MeshBasicMaterial({color:'#ff321b',side:THREE.DoubleSide,toneMapped:false});
 return recipes.flatMap(h=>[240,120,40].map(lead=>({distance:h.distance-lead,create:()=>{
  const p=sample(h.distance-lead),mesh=new THREE.Mesh(warningTriangleGeometry(),red);
  mesh.name='breakdown-warning-triangle';
  mesh.position.copy(p.position).addScaledVector(p.right,h.stopSide*(halfAt(h.distance)-1.75));
  mesh.position.y+=.06;mesh.rotation.set(0,Math.PI-p.roadHeading,Math.atan(p.right.y),'YXZ');
  return [mesh];
 }})));
}
export function warningTriangleGeometry(){
 const shape=new THREE.Shape();
 shape.moveTo(-1.15,0);shape.lineTo(1.15,0);shape.lineTo(0,1.95);shape.closePath();
 const hole=new THREE.Path();
 hole.moveTo(-.68,.28);hole.lineTo(0,1.43);hole.lineTo(.68,.28);hole.closePath();
 shape.holes.push(hole);return new THREE.ShapeGeometry(shape);
}
