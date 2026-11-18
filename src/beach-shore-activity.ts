import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {BEACH_ZONES} from './beach-zone-layout';
import {coastBeachX} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';
import {makeBather} from './beach-people';
import type {createTrack} from './track';

/** Macro circulation/visitors only. Existing reusable figures, simple massing, shared draws. */
export function addBeachShoreActivity(parent:THREE.Group,sample:ReturnType<typeof createTrack>['sample'],anchor:number,mats:THREE.Material[]){
 const root=new THREE.Group();root.name='beach-shore-activity';parent.add(root);
 const box=new THREE.BoxGeometry(1,1,1),visitors:{station:number;lateral:number;ground:number;feet:number}[]=[];
 const ground=(d:number,x:number)=>{const p=sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 function at(d:number,x:number){const p=sample(d),g=new THREE.Group();g.position.copy(p.position).addScaledVector(p.right,x);g.position.y=ground(d,x);g.rotation.y=-p.roadHeading;root.add(g);return g;}
 function part(g:THREE.Group,m:number,x:number,y:number,z:number,sx:number,sy:number,sz:number){const o=new THREE.Mesh(box,mats[m]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;}
 const entry=anchor+BEACH_ZONES.entryForwardM;
 // Continuous pedestrian strip entirely outside the race barrier; no opening in collision.
 for(let d=entry-65;d<=entry+85;d+=3){const g=at(d,-14.7);part(g,0,0,.09,0,2.8,.18,3.08);}
 // Down-beach steps fit the actual shore slope. Side rails follow the same samples.
 for(let i=0;i<16;i++){const x=-16-i*1.6,g=at(entry,x);part(g,0,0,.1,0,1.68,.2,3.5);
  for(const z of [-1.85,1.85]){part(g,3,0,.56,z,.09,1.12,.09);const rail=part(g,3,-.8,1.1,z,1.7,.08,.08);rail.rotation.z=Math.atan2(ground(entry,x-1.6)-ground(entry,x),-1.6);}}
 // Low entrance arch and pennants identify access without a wall across the sea vista.
 const gate=at(entry,-16);for(const z of [-2.2,2.2]){part(gate,3,0,1.35,z,.16,2.7,.16);part(gate,1,0,2.15,z,.12,.8,.6);}part(gate,0,0,2.65,0,.2,.2,4.6);
 for(let i=0;i<3;i++){const d=entry-24+i*9,x=-18.5,g=at(d,x),human=makeBather('stand',mats[4],mats[i%2?1:2],mats[0]);human.position.y=.95;g.add(human);visitors.push({station:d,lateral:x,ground:g.position.y,feet:g.position.y+.01});}
 for(const [index,zone] of BEACH_ZONES.zones.entries()){
  const centre=anchor+zone.forwardM;
  for(let i=0;i<5;i++){const d=centre-8+i*9,x=zone.rightM-6-(i%2)*9,g=at(d,x),human=makeBather('stand',mats[4],mats[(i+index)%2?1:2],mats[0]);human.position.y=.95;human.rotation.y=i*.7;g.add(human);visitors.push({station:d,lateral:x,ground:g.position.y,feet:g.position.y+.01});}
  // Two small shore flags frame the bathing pocket; water remains unobstructed.
  for(const delta of [24,65]){const d=centre+delta,x=coastBeachX(-26,d)+5,g=at(d,x);part(g,3,0,1.1,0,.06,2.2,.06);part(g,7,.32,1.85,0,.65,.4,.035);}
 }
 const guard=at(anchor+BEACH_ZONES.lifeguardForwardM,-30),person=makeBather('stand',mats[4],mats[1],mats[0]);person.position.y=3.35;guard.add(person);
 root.updateMatrixWorld(true);
 const grouped=new Map<THREE.Material,THREE.BufferGeometry[]>();root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const m=o.material as THREE.Material;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=grouped.get(m)??[];list.push(g);grouped.set(m,list);});
 root.clear();for(const [m,parts] of grouped){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(geometry){const o=new THREE.Mesh(geometry,m);o.receiveShadow=true;root.add(o);}}
 root.userData={entry,visitors,draws:root.children.length,access:'sea-side pedestrian strip and shore stairs, outside continuous race guardrail'};
 return root;
}
