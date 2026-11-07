import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {farmClearing} from './coast-farm-layout';
import {COAST_VILLAGE_SITES,COAST_TOWN_SIDE_STREETS} from './coast-village-layout';

/** Cheap grassy-ground detail for otherwise empty inland plains.
 * One indexed, opaque vertex-colour mesh per scenery chunk, baked on the
 * scenery Worker. ~1–2k triangles/km, zero texture fetches, no draw per tuft,
 * no per-frame wind/CPU updates, and NO dynamic/static shadow-map submission.
 *
 * Coordinates use a global 12m grid: no seams or procedural pop at chunks.
 * Never touch farmland, house yards, side streets, the road or the canal.
 */
export function buildCoastMeadow(
 sample:ReturnType<typeof createTrack>['sample'],start:number,end:number,
):THREE.BufferGeometry|null{
 const pos:number[]=[],colors:number[]=[],indices:number[]=[];
 const green=['#4a683b','#6a8144','#78894c','#405d38','#8d8b4b'];
 const palette=green.map(color=>new THREE.Color(color));
 const random=(seed:number)=>{const q=Math.sin(seed*127.1+804)*43758.5453;return q-Math.floor(q);};
 function tri(points:[number,number,number][],color:THREE.Color){
  const base=pos.length/3;
  for(const xyz of points){pos.push(...xyz);colors.push(color.r,color.g,color.b);}
  indices.push(base,base+1,base+2);
 }
 for(let i=Math.ceil(start/12);i*12<Math.min(end,10000);i++){
  const d=i*12;
  const frame=sample(d);
  for(let k=0;k<3;k++){
   const seed=i*17+k*229,x=[18+random(seed+1)*16,45+random(seed+2)*28,85+random(seed+3)*46][k];
   if(farmClearing(d,x))continue;
   if(COAST_TOWN_SIDE_STREETS.some(r=>Math.abs(r.d-d)<r.width*.5+7&&x<r.length+7))continue;
   if(COAST_VILLAGE_SITES.some(h=>Math.abs(h.d-d)<11&&Math.abs(h.x-x)<13))continue;
   const p=frame.position.clone().addScaledVector(frame.right,x);
   p.y=coastBeachHeight(x,frame.position.y,frame.right.y,d);
   const color=palette[Math.floor(random(seed+4)*palette.length)];
   const tangent=frame.tangent,side=frame.right;
   const centre=p.clone().add(new THREE.Vector3(0,.04,0));
   const halfWidth=.65+random(seed+5)*1.15;
   const dx=side.clone().multiplyScalar(halfWidth),dz=tangent.clone().multiplyScalar(.6+random(seed+6)*1.3);
   // Blended undergrowth patch: subtle, broad colour variation rather than
   // artificial evenly spaced individual crop-like stems.
   tri([centre.clone().add(dx).toArray() as [number,number,number],
        centre.clone().add(dz).toArray() as [number,number,number],
        centre.clone().sub(dx).toArray() as [number,number,number]],color);
   tri([centre.clone().add(dx).toArray() as [number,number,number],
        centre.clone().sub(dx).toArray() as [number,number,number],
        centre.clone().sub(dz).toArray() as [number,number,number]],color);
   const bladeColor=color.clone().lerp(new THREE.Color('#ac9a57'),.22);
   // Two crossed asymmetric vertical blades, BOTH sides indexed. No alpha.
   for(let j=0;j<2;j++){
    const axis=j?side:tangent;
    const width=.24+random(seed+9+j)*.28;
    const h=.24+random(seed+13+j)*.33;
    const root=centre.clone().addScaledVector(side,(random(seed+j+12)-.5)*.5);
    const a=root.clone().addScaledVector(axis,-width),
     b=root.clone().addScaledVector(axis,width),
     top=root.clone().addScaledVector(axis,(random(seed+j+33)-.5)*.3).add(new THREE.Vector3(0,h,0));
    const front=[a.toArray(),top.toArray(),b.toArray()] as [number,number,number][];
    tri(front,bladeColor);
    tri([front[2],front[1],front[0]],bladeColor);
   }
  }
 }
 if(!indices.length)return null;
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 g.name='coast-sparse-meadow';g.userData.noShadowGround=true;
 return g;
}
