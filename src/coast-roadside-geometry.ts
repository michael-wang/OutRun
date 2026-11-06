import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {COAST_SIDE_DRAINS,COAST_DRAIN_X,coastDrainCovered,coastPoleLinks} from './coast-roadside-layout';

type Sample=ReturnType<typeof createTrack>['sample'];
type V=[number,number,number];

/** Everything is baked in the scenery Worker. An entire 1km channel and its
 * grating have one vertex-colour mesh, NOT hundreds of runtime grates.
 * The ground profile uses exactly the same U-section in the road Worker.
 */
class RoadsideBatch {
 positions:number[]=[];colors:number[]=[];indices:number[]=[];
 private palette=new Map<string,THREE.Color>();
 private shade(hex:string){
  let col=this.palette.get(hex);
  if(!col){col=new THREE.Color(hex);this.palette.set(hex,col);}return col;
 }
 quad(a:V,b:V,c:V,d:V,hex:string){
  const idx=this.positions.length/3,col=this.shade(hex);
  // Duplicate the back-face *vertices*, not just indices. Otherwise
  // computeVertexNormals() cancels both sides into a zero-length normal and
  // the shallow concrete channel becomes weirdly flat or dark.
  for(const p of [a,b,c,d,a,d,c,b]){
   this.positions.push(...p);this.colors.push(col.r,col.g,col.b);
  }
  this.indices.push(idx,idx+1,idx+2,idx,idx+2,idx+3,
   idx+4,idx+5,idx+6,idx+4,idx+6,idx+7);
 }
 finish(name:string){
  if(!this.indices.length)return null;
  const geo=new THREE.BufferGeometry();geo.name=name;
  geo.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
  geo.setIndex(this.indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
 }
}
function ground(sample:Sample,d:number,x:number,raise=0):V{
 const p=sample(d),v=p.position.clone().addScaledVector(p.right,x);
 v.y=coastBeachHeight(x,p.position.y,p.right.y,d)+raise;
 return [v.x,v.y,v.z];
}

/** Non-interactive visual U-channel, physically cut into terrain at 14–18m.
 * The playable asphalt and its collision mesh are NOT modified. */
export function buildCoastRoadsideDrain(sample:Sample,start:number,end:number){
 const batch=new RoadsideBatch(),X=COAST_DRAIN_X;
 for(const site of COAST_SIDE_DRAINS){
  const a=Math.max(start,site.start),b=Math.min(end,site.end);
  if(b<=a)continue;
  const segments=Math.ceil((b-a)/4.8);
  for(let i=0;i<segments;i++){
   const from=a+(b-a)*i/segments,to=a+(b-a)*(i+1)/segments,mid=(from+to)*.5;
   const quad=(x0:number,x1:number,above:number,color:string)=>{
    batch.quad(ground(sample,from,x0,above),ground(sample,from,x1,above),
     ground(sample,to,x1,above),ground(sample,to,x0,above),color);
   };
   // Low concrete lips, raw open sidewalls, wet brown/grey bottom. Physical
   // depth comes from coastDrainDepth in the COMMON terrain sampler.
   quad(X.outerRoad,X.leftLip,.06,'#a5a195');
   quad(X.leftLip,X.innerLeft,.045,'#858a81');
   quad(X.innerLeft,X.innerRight,.075,'#4c6564');
   quad(X.innerRight,X.rightLip,.045,'#8d8d80');
   quad(X.rightLip,X.outerLand,.065,'#b0a99b');
   if(site.kind!=='covered'&&i%4===0)quad(15.58,16.18,.09,'#78908c');
   if(coastDrainCovered(mid)){
    // Solid culvert over driveways, mostly-covered village drain. Each
    // panel and slot is baked into the same one-draw channel mesh.
    const plate='#a29f94';
    batch.quad(ground(sample,from,X.leftLip,.11),
     ground(sample,from,X.rightLip,.11),
     ground(sample,to,X.rightLip,.11),
     ground(sample,to,X.leftLip,.11),plate);
    if(i%5===1)quad(15.12,16.83,.145,'#555e60'); // drainage intake slit
   }
  }
 }
 return batch.finish('coast-taiwan-roadside-ditch');
}

/** Catenary-style sag across uneven real pole distances, authored once.
 * Three near-black wires per route span are integrated into ONE mesh/chunk;
 * d subdivisions at chunk boundaries use global t so the sag is seamless.
 */
export function buildCoastUtilityWires(sample:Sample,start:number,end:number){
 const batch=new RoadsideBatch();
 for(const link of coastPoleLinks(start,end)){
  const distance=link.to.d-link.from.d;
  const floor0=ground(sample,link.from.d,link.from.x)[1],floor1=ground(sample,link.to.d,link.to.x)[1];
  const divisions=Math.ceil((link.end-link.start)/11);
  for(const [wire,offset] of [-1.05,0,1.05].entries()){
   const wirePoint=(d:number,raise=0):V=>{
    const t=(d-link.from.d)/distance;
    const x=link.from.x+(link.to.x-link.from.x)*t+offset;
    const p=sample(d),v=p.position.clone().addScaledVector(p.right,x);
    const h=(link.from.height+(link.to.height-link.from.height)*t)-.52+wire*.20;
    const sag=(.28+distance*.007)*(4*t*(1-t));
    v.y=floor0+(floor1-floor0)*t+h-sag+raise;
    return [v.x,v.y,v.z];
   };
   for(let i=0;i<divisions;i++){
    const a=link.start+(link.end-link.start)*i/divisions;
    const b=link.start+(link.end-link.start)*(i+1)/divisions;
    // Small vertical quad; no line-width WebGL compatibility issues on Pixel 8.
    batch.quad(wirePoint(a,-.018),wirePoint(b,-.018),
     wirePoint(b,.018),wirePoint(a,.018),'#42484b');
   }
  }
 }
 return batch.finish('coast-taiwan-utility-wires');
}
