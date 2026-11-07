import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {COAST_TOWN_SIDE_STREETS,TOWN_BACK_LANE} from './coast-town-access';
import {COAST_DISTRICTS} from './coast-layout';
import {COAST_DRAIN_X} from './coast-roadside-layout';

/** A few short, terrain-hugging inhabited town side streets. The village
 * route is unchanged; each street is a visual T-connection on the inland
 * side of the coastal road (the town drain is already covered here).
 *
 * ONE opaque vertex-colour mesh per stream chunk. No street traffic, AI,
 * intersections in the collision model, additional textures or shadow pass.
 */
export function buildCoastTownStreets(
 sample:ReturnType<typeof createTrack>['sample'],start:number,end:number,
):THREE.BufferGeometry|null{
 const position:number[]=[],color:number[]=[],indices:number[]=[];
 const palette=new Map<string,THREE.Color>();
 const tint=(hex:string)=>{let c=palette.get(hex);if(!c){c=new THREE.Color(hex);palette.set(hex,c);}return c;};
 const point=(distance:number,x:number,raise:number):[number,number,number]=>{
  const p=sample(distance),v=p.position.clone().addScaledVector(p.right,x);
  // Match the exact asphalt/capped-drain height on both sides of the town
  // ditch, then blend down to the natural ground beyond the concrete lip.
  const X=COAST_DRAIN_X;
  const asphalt=p.position.y+p.right.y*x+.065;
  const lid=coastBeachHeight(X.leftLip,p.position.y,p.right.y,distance)
   +.055+p.right.y*(x-X.leftLip)+.065;
  const ground=coastBeachHeight(x,p.position.y,p.right.y,distance)+.065;
  if(x<=X.outerRoad)v.y=asphalt+raise;
  else if(x<=X.outerLand)v.y=lid+raise;
  else{
   const t=THREE.MathUtils.smoothstep(x,X.outerLand,23);
   v.y=THREE.MathUtils.lerp(lid,ground,t)+raise;
  }
  return [v.x,v.y,v.z];
 };
 const quad=(d0:number,d1:number,x0:number,x1:number,raise:number,shade:string)=>{
  const c=tint(shade),startIndex=position.length/3;
  for(const p of [point(d0,x0,raise),point(d0,x1,raise),point(d1,x1,raise),point(d1,x0,raise)]){
   position.push(...p);color.push(c.r,c.g,c.b);
  }
  indices.push(startIndex,startIndex+1,startIndex+2,startIndex,startIndex+2,startIndex+3);
 };
 for(const site of COAST_TOWN_SIDE_STREETS){
  if(site.d<start||site.d>=end)continue;
  const half=site.width*.5;
  // From the far edge of the existing asphalt to the homes, not across
  // the playable road. Conform to the same coastal hill surface as houses.
  const segmentX=[9.92,10.12,10.26,12.62,14.75,18,23];
  for(let x=23;x+8<site.length;x+=8)segmentX.push(x+8);
  segmentX.push(site.length);
  for(let i=0;i<segmentX.length-1;i++){
   const x=segmentX[i],finish=segmentX[i+1];
   quad(site.d-half,site.d+half,x,finish,.07,'#45484a');
   // Low curbs frame the lane, but never read as highway guardrails.
   // No curb/raised concrete barrier across the road-to-road opening.
   if(x>=14.75)for(const side of [-1,1])
    quad(site.d+side*half-.16,site.d+side*half+.16,x,finish,.095,'#a6a79b');
  }
  // Thin white stop marking on the T-mouth, not a huge highway zebra.
  quad(site.d-half+.55,site.d+half-.55,10.50,10.78,.083,'#e5e2d4');
  // Short pair of centre dashes gives perspective and human scale.
  for(const x of [31,51])
   quad(site.d-.06,site.d+.06,x,x+2.5,.082,'#d1cabb');
 }
 for(const district of COAST_DISTRICTS){
  if(district.kind!=='homes')continue;
  const from=Math.max(start,district.start+12),to=Math.min(end,district.end-10);
  const half=TOWN_BACK_LANE.width*.5;
  for(let d=from;d<to;d+=8){
   quad(d,Math.min(to,d+8),TOWN_BACK_LANE.x-half,TOWN_BACK_LANE.x+half,.07,'#45484a');
  }
 }
 if(!indices.length)return null;
 const g=new THREE.BufferGeometry();g.name='coast-town-side-streets';
 g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 g.userData.noShadowGround=true;
 return g;
}
