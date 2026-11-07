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
/** A low tin-roofed implement store with an open work bay on the road side. */
export function buildPaddyToolShed(){
 const g=new RuralMesh();
 g.box(0,.015,0,5.6,.32,6.8,'#95876c');
 g.box(.72,1.22,0,2.95,2.25,5.4,'#ac967c');
 g.box(-.79,1.14,.55,.10,2,2.15,'#545b54');
 g.box(-.87,1.14,1.48,.11,2.05,1.6,'#87897b'); // partly open sliding door
 g.roof(0,2.45,0,4.8,5.8,.85,'#647b79');
 for(const z of [-2.55,2.55])g.box(-2.22,1.27,z,.15,2.35,.15,'#806950');
 g.box(-1.46,.85,-1.63,1.2,.12,1.5,'#8f6e50');
 for(const z of [-2.15,-1.12])g.box(-1.87,.49,z,.10,.68,.10,'#715d48');
 g.cylinder(-1.55,.50,2.05,.34,.70,'#657572');
 return g.finish('coast-paddy-tool-shed');
}
function farmhouse(){
 const g=new RuralMesh();
 g.box(0,.10,0,13,.20,17,'#aa957a'); // yard/raised footing
 // 台灣鄉間常見的「紅磚下半截＋洗石子／白灰泥上半截」。
 g.box(0,2.08,0,8,4,11,'#d2c0a3');
 for(const z of [-4.55,4.55])g.box(-4.05,.65,z,.105,1.28,1.85,'#a45e48');
 g.box(-4.12,3.33,0,.10,.40,10.8,'#e1d0b4');
 g.box(-4.11,1.25,0,.12,2.45,1.65,'#694b41');
 for(const z of [-.98,.98])g.box(-4.23,1.8,z,.13,2.65,.16,'#eee0be');
 g.box(-4.23,3.17,0,.18,.20,2.3,'#eadac0');
 windowFront(g,-4.2,2.35,-3.55,1.5);
 windowFront(g,-4.2,2.35,3.55,1.5);
 for(const z of [-3.55,3.55]){
  // 簡化鐵窗／鋁窗框：遠距仍看得出，不做每格獨立 mesh。
  for(const offset of [-.48,.48])g.box(-4.30,2.35,z+offset,.09,1.37,.055,'#65716c');
 }
 g.roof(0,4.12,0,8.7,11.4,1.9,'#a54e3f');
 for(const z of [-4.5,-3,-1.5,0,1.5,3,4.5])
  g.box(-2.1,5.03,z,.045,.035,6.9,'#b46a52');
 g.box(-5.12,3.05,0,2.0,.23,13,'#9f5d48'); // porch canopy
 for(const z of [-5.7,5.7])g.box(-5.5,1.45,z,.23,2.9,.23,'#8b745c');
 g.cylinder(2.0,4.42,-2.5,.65,.70,'#858c83'); // stainless rooftop water tank
 g.box(3.4,1.18,-5.4,2.8,2.3,2.1,'#ad9980'); // farm tool shed
 g.box(1.9,1.10,-5.4,.13,1.8,1.30,'#7a8b85'); // sliding iron door
 g.roof(3.4,2.35,-5.4,2.9,2.1,.65,'#71817a'); // corrugated tin addition
 for(const z of [-6.30,-5.75,-5.20,-4.65])g.box(2.9,2.68,z,.08,.07,2.65,'#95a6a0');
 return g.finish('coast-rural-farmhouse');
}
function townhouse(){
 const g=new RuralMesh();
 g.box(0,.08,0,9,.16,11,'#ac997c');
 // 老透天的洗石子外牆、舊磁磚腰帶及鐵捲門。
 g.box(0,4.35,0,7.4,8.6,9.4,'#c4b3a4');
 g.box(-3.755,4.35,0,.11,.35,9.45,'#9e9d94');
 g.box(-3.77,7.75,0,.11,.22,9.45,'#a89a83');
 for(const z of [-3.9,3.9])g.box(-3.83,4.5,z,.16,8.55,.26,'#ded0bb');
 g.box(-3.8,1.35,0,.1,2.65,2.2,'#77817d');
 for(const y of [.55,1.1,1.65,2.2])g.box(-3.90,y,0,.04,.075,2.2,'#a3aca6');
 for(const y of [4.1,6.75]){
  for(const z of [-2.45,2.40]){
   windowFront(g,-3.82,y,z,1.55);
   for(const offset of [-.5,0,.5])
    g.box(-3.99,y,z+offset,.08,1.36,.055,'#626f70'); // iron window grille
  }
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
 // 四、五十年透天常見的屋頂鐵皮小增建；只占屋頂一角。
 g.box(1.1,9.45,2.15,3.6,1.05,3.6,'#7c8b85');
 g.roof(1.1,10.05,2.15,4.0,3.9,.55,'#718b82');
 for(const z of [.9,1.65,2.4,3.15])g.box(-1.0,9.78,z,.04,.28,.13,'#d1d7c9');
 return g.finish('coast-rural-townhouse');
}
function courtyard(){
 const g=new RuralMesh();
 g.box(0,.08,0,23,.16,34,'#ac9379');
 // Rear ancestral hall, with two low flanking wings enclosing an open court.
 g.box(6.7,2.15,0,7.2,4.3,27,'#bd8068');
 g.box(3.06,.85,0,.13,1.65,27.3,'#995b49'); // brick base course
 g.box(3.00,3.78,0,.12,.30,26.8,'#e8d7bb'); // white lime-wash band
 g.roof(6.7,4.33,0,7.5,28,1.55,'#a54e3f');
 for(const z of [-11,-7,-3,1,5,9])g.box(4.1,5.32,z,.05,.045,3.7,'#c87557');
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
 // 紅門對聯用單色面片就足以讓車速下的視線辨識台灣合院。
 for(const z of [-2.25,2.25]){
  g.box(-11.24,1.56,z,.09,2.35,.28,'#a92928');
  g.box(-11.30,1.55,z,.095,1.87,.09,'#d9af60');
 }
 g.box(-11.33,2.64,0,.12,.27,4.60,'#d7ad61');
 for(const z of [-3.1,3.1]){
  g.box(-11.25,2.4,z,.12,.78,.65,'#d6a659');
  g.box(-11.32,2.10,z,.18,.22,.70,'#d6a659');
 }
 // Courtyard floor remains lower than the surrounding tiled wings.
 g.box(-1.5,.18,0,10,.14,15,'#c2a78b');
 g.box(2.9,1.22,0,.12,2.45,2.1,'#724e43');
 for(const z of [-9,-5.5,5.5,9]){
  windowFront(g,2.97,2.40,z,1.1);
  for(const offset of [-.27,.27])g.box(2.88,2.4,z+offset,.055,1.28,.055,'#6c6b62');
 }
 for(const z of [-7.5,7.5])g.box(-4.0,.55,z,2.7,.8,1.6,'#739062');
 g.box(-2.25,.26,1.0,2.5,.18,4,'#bea38a'); // simple courtyard stone bench
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
