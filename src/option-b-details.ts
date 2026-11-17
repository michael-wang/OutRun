import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoadWheelVisuals} from './wheels';

function merged(parts:THREE.BufferGeometry[]){
 const expanded=parts.map(p=>p.index?p.toNonIndexed():p),g=mergeGeometries(expanded)!;
 new Set([...parts,...expanded]).forEach(p=>p.dispose());return g;
}
function lathe(profile:number[][]){const g=new THREE.LatheGeometry(profile.map(([r,x])=>new THREE.Vector2(r,x)),40);g.rotateZ(Math.PI/2);return g;}
/** Same .46m contact envelope and axle; five open tapered spokes, recessed barrel. */
export function gtWheelVisuals(side:number):RoadWheelVisuals{
 const tire=lathe([[.365,-.14],[.409,-.145],[.447,-.117],[.46,-.08],[.46,.08],[.447,.117],[.409,.145],[.365,.14]]);
 const rim=lathe([[.335,-.145],[.37,-.145],[.379,-.13],[.379,.13],[.37,.145],[.335,.145],[.335,.127],[.356,.115],[.356,-.115],[.335,-.127],[.335,-.145]]);
 const parts:THREE.BufferGeometry[]=[];
 for(let i=0;i<5;i++){
  const shape=new THREE.Shape();shape.moveTo(-.045,.075);shape.lineTo(.045,.075);shape.lineTo(.039,.345);shape.lineTo(-.025,.345);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.006,bevelThickness:.006});
  g.rotateY(side*Math.PI/2);g.translate(side*.12,0,0);g.rotateX(i*2*Math.PI/5);parts.push(g);
 }
 const hub=new THREE.CylinderGeometry(.087,.087,.30,20);hub.rotateZ(Math.PI/2);parts.push(hub);
 return {tire,rim,spokes:merged(parts),color:'#9b7953'};
}

export function gtBrakes(side:number){
 const root=new THREE.Group();root.name='option-b-brake-disc';
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(.285,.285,.018,32),new THREE.MeshStandardMaterial({color:'#42474a',metalness:.68,roughness:.6}));
 disc.rotation.z=Math.PI/2;disc.position.x=side*.095;root.add(disc);
 const caliper=new THREE.Mesh(new THREE.BoxGeometry(.065,.19,.08),new THREE.MeshStandardMaterial({color:'#262a2d',metalness:.4,roughness:.5}));
 caliper.position.set(side*.12,.03,-.245);root.add(caliper);return root;
}

export function modernWindshield(){
 const root=new THREE.Group();root.name='option-b-windshield';
 const frame=new THREE.MeshStandardMaterial({color:'#293239',metalness:.75,roughness:.28});
 const glass=new THREE.MeshPhysicalMaterial({color:'#b5d4d9',transparent:true,opacity:.23,roughness:.12,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
 const positions:number[]=[],indices:number[]=[];const lower:THREE.Vector3[]=[],upper:THREE.Vector3[]=[];
 for(let i=0;i<=12;i++){
  const t=i/12,x=t*2-1;
  const b=new THREE.Vector3(x*.88,.965,.77+.08*(1-x*x)),u=new THREE.Vector3(x*.80,1.385,.23+.05*(1-x*x));
  lower.push(b);upper.push(u);positions.push(...b.toArray(),...u.toArray());
  if(i<12){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 const pane=new THREE.Mesh(g,glass);pane.name='option-b-glass';pane.renderOrder=2;root.add(pane);
 const edges=[lower,upper,[lower[0],upper[0]],[lower[12],upper[12]]];
 const frameGeometry=merged(edges.map((points,i)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),i<2?12:1,i===0?.025:.018,6,false)));
 root.add(new THREE.Mesh(frameGeometry,frame));return root;
}

/** Horizontal signatures conform in depth, never rotate a bar onto a lumpy normal. */
function lampRibbon(body:THREE.Mesh,front:boolean,side:number,height:number,thickness:number){
 const positions:number[]=[],indices:number[]=[];const count=12;
 for(let i=0;i<=count;i++){
  const t=i/count,x=side*(front?.40+.40*t:.19+.65*t);
  const y=height+(front?.07*t:0);
  for(const edge of [-1,1]){
   const yy=y+edge*thickness/2;
   const hit=front?undefined:new THREE.Raycaster(new THREE.Vector3(x,yy,-3),new THREE.Vector3(0,0,1)).intersectObject(body,false)[0];
   // Front fairing measured on the local sculpt; a smooth shallow housing
   // avoids following holes/interior faces at its outer fender junction.
   const z=front?2.21-.12*t-.08*t*t-1.35*(yy-.71):(hit?.point.z??-2.25)-.018;
   positions.push(x,yy,z);
  }
  if(i<count){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function modernLamps(body:THREE.Mesh,front:THREE.MeshStandardMaterial,rear:THREE.MeshStandardMaterial){
 const root=new THREE.Group();root.name='option-b-lamps';
 const housing=new THREE.MeshStandardMaterial({color:'#111b23',metalness:.35,roughness:.28,side:THREE.DoubleSide});
 const dark:THREE.BufferGeometry[]=[],white:THREE.BufferGeometry[]=[],red:THREE.BufferGeometry[]=[];
 front.side=rear.side=THREE.DoubleSide;
 for(const side of [-1,1])for(const isFront of [true]){
  const y=isFront?.705:.825;
  dark.push(lampRibbon(body,isFront,side,y,isFront?.095:.09));
  const g=lampRibbon(body,isFront,side,y,.026);g.translate(0,0,isFront?.005:-.005);(isFront?white:red).push(g);
 }
 for(const [name,parts,mat] of [['housing',dark,housing],['headlights',white,front]] as const){const m=new THREE.Mesh(merged(parts),mat);m.name=`option-b-${name}`;root.add(m);}
 // Reserved local attachment points; no turn-signal mechanic in G2.
 for(const side of [-1,1]){const anchor=new THREE.Object3D();anchor.name=side>0?'indicatorLeft':'indicatorRight';anchor.position.set(side*.9,.82,2);root.add(anchor);}
 return root;
}

export function optionBLighting(front:THREE.MeshStandardMaterial,rear:THREE.MeshStandardMaterial,dusk:boolean){
 let headlightsEnabled=dusk,braking=false;
 const update=()=>{front.emissiveIntensity=headlightsEnabled?2.4:0;front.color.set(headlightsEnabled?'#eff7ff':'#76838c');rear.emissiveIntensity=braking?1.7:headlightsEnabled?.55:0;rear.color.set('#7d111c');};update();
 return {set(value:boolean){braking=value;update();},reset(){braking=false;update();},setHeadlights(value:boolean){headlightsEnabled=value;update();},
  inspect:()=>({headlightsEnabled,tailRunningEnabled:headlightsEnabled,braking,emissiveIntensity:rear.emissiveIntensity,frontEmissiveIntensity:front.emissiveIntensity})};
}
