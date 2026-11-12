import * as THREE from 'three';
import type {createTrack} from './track';
import type {SceneAnnotation} from './streamed-scene';
import {trafficRandom} from './traffic-lanes';
import {roadLaneCenters} from './traffic-flow';
import {breakdownLaneLateral} from './race-traffic-world';
type Sample=ReturnType<typeof createTrack>['sample'];
export interface Breakdown{
 id:number;type:number;distance:number;speed:number;group:number;
 stationary:true;stopSide:number;stopLane:number;
}
/** Seeded coast hazards can appear in any lane along the full course. */
export const COAST_BREAKDOWN={startClearance:1000,finishClearance:300,maxCount:2} as const;
export function breakdownLayout(
 sample:Sample,halfAt:(d:number)=>number,length:number,seed:number,coast=false,
 minimumDistance=coast?COAST_BREAKDOWN.startClearance:1800,
):Breakdown[]{
 const out:Breakdown[]=[];
 let next=coast
   ?Math.max(COAST_BREAKDOWN.startClearance,minimumDistance)+trafficRandom(seed,901)*1100
   :Math.max(1800,minimumDistance)+trafficRandom(seed,901)*450;
  const last=length-(coast?COAST_BREAKDOWN.finishClearance:900);
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
   const lanes=roadLaneCenters(width);
   const stopLane=Math.floor(trafficRandom(seed,i+950)*lanes.length);
   out.push({id:100000+i,type:i%4,distance:d,speed:0,group:-1,
    stationary:true,stopLane,stopSide:stopLane<lanes.length/2?-1:1});
   if(coast&&out.length>=COAST_BREAKDOWN.maxCount)break;
   next=d+(coast?2700+trafficRandom(seed,i+980)*2600:11000+trafficRandom(seed,i+980)*4000);
 }
 return out;
}
export function breakdownAnnotations(sample:Sample,halfAt:(d:number)=>number,recipes:Breakdown[]):SceneAnnotation[]{
 const red=new THREE.MeshBasicMaterial({color:'#ff321b',side:THREE.DoubleSide,toneMapped:false});
 return recipes.flatMap(h=>[240,120,40].map(lead=>({distance:h.distance-lead,create:()=>{
  const p=sample(h.distance-lead),mesh=new THREE.Mesh(warningTriangleGeometry(),red);
  mesh.name='breakdown-warning-triangle';
  mesh.position.copy(p.position).addScaledVector(p.right,breakdownLaneLateral(h.stopLane,h.stopSide,halfAt(h.distance)));
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
