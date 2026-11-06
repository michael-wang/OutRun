import * as THREE from 'three';
import {coastBeachHeight} from './scenery-cross-section';
import {RURAL_CREEK,type RuralHouseKind} from './coast-rural-layout';
import type {createTrack} from './track';

type V=[number,number,number];
type Sample=ReturnType<typeof createTrack>['sample'];

/** A tiny, Worker-built vertex-colour mesh kit. Each complete house (walls,
 * roofs, windows, balcony) is one instanced template/draw call rather than
 * dozens of individual primitives. No Blender/GLB download or runtime CSG. */
class RuralMesh {
 private positions:number[]=[];
 private normals:number[]=[];
 private colors:number[]=[];
 private indices:number[]=[];
 private palette=new Map<string,THREE.Color>();
 private tint(hex:string){
  let c=this.palette.get(hex);
  if(!c){c=new THREE.Color(hex);this.palette.set(hex,c);}
  return c;
 }
 private triangle(a:V,b:V,c:V,hex:string){
  const normal=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a))
   .cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a))).normalize();
  const tint=this.tint(hex),offset=this.positions.length/3;
  for(const p of [a,b,c]){
   this.positions.push(...p);this.normals.push(normal.x,normal.y,normal.z);
   this.colors.push(tint.r,tint.g,tint.b);
  }
  this.indices.push(offset,offset+1,offset+2);
 }
 quad(a:V,b:V,c:V,d:V,color:string,both=false){
  this.triangle(a,b,c,color);this.triangle(a,c,d,color);
  if(both){this.triangle(c,b,a,color);this.triangle(d,c,a,color);}
 }
 box(x:number,y:number,z:number,sx:number,sy:number,sz:number,col:string){
  const X=sx/2,Y=sy/2,Z=sz/2;
  const v=(i:number,j:number,k:number):V=>[x+i*X,y+j*Y,z+k*Z];
  this.quad(v(-1,-1,1),v(1,-1,1),v(1,1,1),v(-1,1,1),col);
  this.quad(v(1,-1,-1),v(-1,-1,-1),v(-1,1,-1),v(1,1,-1),col);
  this.quad(v(1,-1,1),v(1,-1,-1),v(1,1,-1),v(1,1,1),col);
  this.quad(v(-1,-1,-1),v(-1,-1,1),v(-1,1,1),v(-1,1,-1),col);
  this.quad(v(-1,1,1),v(1,1,1),v(1,1,-1),v(-1,1,-1),col);
  this.quad(v(-1,-1,-1),v(1,-1,-1),v(1,-1,1),v(-1,-1,1),col);
 }
 roof(x:number,base:number,z:number,depth:number,along:number,rise:number,tile:string,axis:'x'|'z'='x'){
  const half=depth/2+.35,long=along/2+.55;
  const t=(cross:number,edge:number,y:number):V=>axis==='x'?
   [x+cross,y,z+edge]:[x+edge,y,z+cross];
  this.quad(t(-half,-long,base),t(0,-long,base+rise),t(0,long,base+rise),t(-half,long,base),tile,true);
  this.quad(t(0,-long,base+rise),t(half,-long,base),t(half,long,base),t(0,long,base+rise),tile,true);
  const cap=tile==='#a54e3f'?'#de9273':'#8e7167';
  if(axis==='x'){
   this.box(x,base+rise,z,.30,.22,along+1.3,cap);
   for(const edge of [-1,1])this.box(x+edge*half,base-.08,z,.23,.26,along+1.3,cap);
  }else{
   this.box(x,base+rise,z,along+1.3,.22,.30,cap);
   for(const edge of [-1,1])this.box(x,base-.08,z+edge*half,along+1.3,.26,.23,cap);
  }
 }
 cylinder(x:number,y:number,z:number,r:number,h:number,col:string){
  const segments=8;
  for(let i=0;i<segments;i++){
   const a=2*Math.PI*i/segments,b=2*Math.PI*(i+1)/segments;
   const p=(t:number,q:number):V=>[x+Math.cos(t)*r,q,z+Math.sin(t)*r];
   this.quad(p(a,y-h/2),p(b,y-h/2),p(b,y+h/2),p(a,y+h/2),col);
   this.triangle([x,y+h/2,z],p(a,y+h/2),p(b,y+h/2),col);
  }
 }
 finish(name:string){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
  geo.setIndex(this.indices);
  geo.name=name;
  geo.computeBoundingSphere();
  return geo;
 }
}
function windowFront(g:RuralMesh,x:number,y:number,z:number,wide=1.15){
 g.box(x,y,z,.09,1.35,wide,'#33424b');
 g.box(x-.065,y,z,.035,1.21,wide-.15,'#93a9a5');
 g.box(x-.095,y,z,.02,1.20,.10,'#d6c6a8');
 g.box(x-.10,y-.69,z,.18,.13,wide+.28,'#d9c5aa');
}
function farmhouse(){
 const g=new RuralMesh();
 g.box(0,.10,0,13,.20,17,'#aa957a'); // yard/raised footing
 g.box(0,2.08,0,8,4,11,'#d6c5a9');
 g.box(-4.11,1.25,0,.12,2.45,1.65,'#694b41');
 windowFront(g,-4.2,2.35,-3.55,1.5);
 windowFront(g,-4.2,2.35,3.55,1.5);
 g.roof(0,4.12,0,8.7,11.4,1.9,'#a54e3f');
 g.box(-5.12,3.05,0,2.0,.23,13,'#9f5d48'); // porch canopy
 for(const z of [-5.7,5.7])g.box(-5.5,1.45,z,.23,2.9,.23,'#8b745c');
 g.cylinder(2.0,4.42,-2.5,.65,.70,'#858c83'); // water tank
 g.box(3.4,1.18,-5.4,2.8,2.3,2.1,'#c3b49b'); // service annex
 g.roof(3.4,2.35,-5.4,2.9,2.1,.65,'#826a62');
 return g.finish('coast-rural-farmhouse');
}
function townhouse(){
 const g=new RuralMesh();
 g.box(0,.08,0,9,.16,11,'#ac997c');
 g.box(0,4.35,0,7.4,8.6,9.4,'#c8b6a7');
 g.box(-3.8,1.35,0,.1,2.65,2.2,'#38454a');
 for(const y of [4.1,6.75]){
  for(const z of [-2.45,2.40])windowFront(g,-3.82,y,z,1.55);
  g.box(-4.10,y-1.0,0,1.75,.19,10,'#e1c9ab');
  g.box(-4.92,y-.55,0,.12,.95,10,'#697879'); // balcony wall
  for(const z of [-4.3,0,4.3])g.box(-4.92,y-.25,z,.14,1.0,.15,'#8a7569');
 }
 g.box(-3.81,1.4,0,.12,2.5,2.15,'#48636a');
 g.box(-4.75,3.02,0,2.2,.16,9.9,'#aa6652');
 for(const z of [-3.9,-2.4,-.9,.6,2.1,3.6])g.box(-4.75,3.04,z,2.2,.06,.66,z<0?'#e0b58b':'#d39776');
 g.box(0,8.85,0,7.9,.45,10,'#62616a');
 g.cylinder(1.25,10.0,-2.2,.84,1.8,'#a7b2af');
 g.box(1.2,10.93,-2.2,1.75,.10,1.75,'#cad2c7');
 return g.finish('coast-rural-townhouse');
}
function courtyard(){
 const g=new RuralMesh();
 g.box(0,.08,0,23,.16,34,'#ac9379');
 // Rear ancestral hall, with two low flanking wings enclosing an open court.
 g.box(6.7,2.15,0,7.2,4.3,27,'#bd8068');
 g.roof(6.7,4.33,0,7.5,28,1.55,'#a54e3f');
 g.box(.3,1.86,-13.25,15.0,3.72,6.4,'#be876c');
 g.box(.3,1.86,13.25,15.0,3.72,6.4,'#be876c');
 g.roof(.3,3.75,-13.25,6.7,15.2,1.10,'#a54e3f','z');
 g.roof(.3,3.75,13.25,6.7,15.2,1.10,'#a54e3f','z');
 // Low brick enclosure facing the passing car; leave a true gate opening.
 for(const z of [-10.0,10.0]){
  g.box(-10.1,1.36,z,.54,2.72,13.8,'#aa6c58');
  g.box(-10.2,2.77,z,.75,.22,14.2,'#db9a7d');
  for(const offset of [-4,0,4])g.box(-10.45,1.66,z+offset,.065,.58,.70,'#e3b69a');
 }
 // Gate house and terracotta roof communicate Taiwanese sanheyuan/siheyuan.
 g.box(-9.9,3.38,0,3.35,1.05,6.6,'#b5795f');
 g.roof(-9.9,3.98,0,4.1,8.2,1.52,'#a54e3f');
 g.box(-11.1,1.16,0,.14,2.32,3.9,'#633d36');
 for(const z of [-3.1,3.1]){
  g.box(-11.25,2.4,z,.12,.78,.65,'#d6a659');
  g.box(-11.32,2.10,z,.18,.22,.70,'#d6a659');
 }
 // Courtyard floor remains lower than the surrounding tiled wings.
 g.box(-1.5,.18,0,10,.14,15,'#c2a78b');
 g.box(2.9,1.22,0,.12,2.45,2.1,'#724e43');
 for(const z of [-9,-5.5,5.5,9])windowFront(g,2.97,2.40,z,1.1);
 for(const z of [-7.5,7.5])g.box(-4.0,.55,z,2.7,.8,1.6,'#739062');
 return g.finish('coast-rural-courtyard');
}
/** Called only for the relevant streamed scenery chunk. */
export function buildCoastRuralHouse(kind:RuralHouseKind){
 return kind==='courtyard'?courtyard():kind==='townhouse'?townhouse():farmhouse();
}

/** Ribbon follows the same terrain cut as the road Worker. A single opaque
 * vertex-colored mesh represents dark water, warm glints and two bank stones.
 * This stays in the existing Worker-scene / instancing pipeline. */
export function buildCoastRuralCreek(sample:Sample){
 const g=new RuralMesh();
 const point=(d:number,x:number,raise=0):V=>{
  const frame=sample(d),v=frame.position.clone().addScaledVector(frame.right,x);
  v.y=coastBeachHeight(x,frame.position.y,frame.right.y,d)+raise;
  return [v.x,v.y,v.z];
 };
 const count=Math.ceil((RURAL_CREEK.end-RURAL_CREEK.start)/3.5);
 for(let i=0;i<count;i++){
  const d0=RURAL_CREEK.start+i*(RURAL_CREEK.end-RURAL_CREEK.start)/count;
  const d1=RURAL_CREEK.start+(i+1)*(RURAL_CREEK.end-RURAL_CREEK.start)/count;
  const shade=i%3===0?'#427d82':'#38686f';
  g.quad(point(d0,23,.09),point(d0,29,.09),point(d1,29,.09),point(d1,23,.09),shade,true);
  // Thin warm reflections travel with the water's curve, not across the road.
  if(i%4===0)g.quad(point(d0,24.2,.105),point(d0,24.55,.105),
   point(d1,24.55,.105),point(d1,24.2,.105),'#b89474',true);
  for(const [a,b] of [[19.8,21.2],[31.5,33]] as const){
   g.quad(point(d0,a,.12),point(d0,b,.12),point(d1,b,.12),point(d1,a,.12),'#898578',true);
  }
 }
 return g.finish('coast-rural-irrigation-canal');
}
