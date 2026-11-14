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
 /** Original staged incident cars are shared with physics and traffic AI. */
 stopYaw?:number;stopOffset?:number;incidentId?:'A4'|number;
}
/** Seeded coast hazards can appear in any lane along the full course. */
export const COAST_BREAKDOWN={startClearance:1000,finishClearance:300,maxSites:2} as const;
/** Each incident has one warning approach shared by all of its vehicles. */
export function warningLeaders(rows:readonly Breakdown[]){
 const seen=new Set<Breakdown['incidentId']>();
 return rows.filter(row=>{
  if(row.incidentId===undefined)return true;
  if(seen.has(row.incidentId))return false;
  seen.add(row.incidentId);return true;
 });
}
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
  const i=coast?out.length/2:out.length;
   const lanes=roadLaneCenters(width);
   const stopLane=Math.floor(trafficRandom(seed,i+950)*lanes.length);
   const id=100000+out.length;
   const lead:Breakdown={id,type:i%4,distance:d,speed:0,group:-1,
    stationary:true,stopLane,stopSide:stopLane<lanes.length/2?-1:1};
   if(coast){
    // Stagger both bodies within the validated sight corridor. Keep two
    // untouched lanes together even on a narrow four-lane carriageway.
    if(d+19>=last||lanes.length<4)continue;
    const neighbor=stopLane<lanes.length/2?Math.max(0,stopLane-1):Math.min(lanes.length-1,stopLane+1);
    out.push({...lead,incidentId:id,stopYaw:.12},
     {...lead,incidentId:id,id:id+1,type:2,distance:d+19,stopLane:neighbor,stopYaw:-.15});
    if(i+1>=COAST_BREAKDOWN.maxSites)break;
   }else out.push(lead);
   next=d+(coast?2700+trafficRandom(seed,i+980)*2600:11000+trafficRandom(seed,i+980)*4000);
 }
 return out;
}
export function breakdownAnnotations(sample:Sample,halfAt:(d:number)=>number,recipes:Breakdown[]):SceneAnnotation[]{
 const red=new THREE.MeshBasicMaterial({color:'#ff321b',side:THREE.DoubleSide,toneMapped:false});
 return warningLeaders(recipes).flatMap(h=>[240,120,40].map(lead=>({distance:h.distance-lead,create:()=>{
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
