import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {COAST_TOWN_SIDE_STREETS} from './coast-village-layout';

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
  v.y=coastBeachHeight(x,p.position.y,p.right.y,distance)+raise;
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
  for(let x=13.5;x<site.length;x+=8){
   const finish=Math.min(site.length,x+8);
   quad(site.d-half,site.d+half,x,finish,.065,'#45484a');
   // Low curbs frame the lane, but never read as highway guardrails.
   for(const side of [-1,1])
    quad(site.d+side*half-.16,site.d+side*half+.16,x,finish,.115,'#a6a79b');
  }
  // Thin white stop marking on the T-mouth, not a huge highway zebra.
  quad(site.d-half+.55,site.d+half-.55,16.0,16.35,.08,'#e5e2d4');
  // Short pair of centre dashes gives perspective and human scale.
  for(const x of [31,51])
   quad(site.d-.06,site.d+.06,x,x+2.5,.082,'#d1cabb');
 }
 if(!indices.length)return null;
 const g=new THREE.BufferGeometry();g.name='coast-town-side-streets';
 g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 g.userData.noShadowGround=true;
 return g;
}
