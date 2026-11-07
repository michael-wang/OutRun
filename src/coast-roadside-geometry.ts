import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {COAST_SIDE_DRAINS,COAST_DRAIN_X,COAST_DRAIN_FREEBOARD,COAST_DRAIN_BRIDGES,coastDrainBridgeAt,coastDrainCovered,coastPoleLinks} from './coast-roadside-layout';

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

/** One continuous paved edge + steep U-channel (x=10–14.75m).
 * The road Worker removes the old sand ribbon on these exact intervals.
 * Asphalt and lane count remain unchanged; wall/cover are purely scenic. */
export function buildCoastRoadsideDrain(sample:Sample,start:number,end:number){
 const batch=new RoadsideBatch(),X=COAST_DRAIN_X;
 for(const site of COAST_SIDE_DRAINS){
  const a=Math.max(start,site.start),b=Math.min(end,site.end);
  if(b<=a)continue;
  // Town covers use shorter precast slabs; countryside open culverts can
  // use longer, geometrically cheaper pieces. No runtime tessellation.
  const segments=Math.ceil((b-a)/(site.kind==='covered'?4.6:8.4));
  // Split precisely at bridge edges: no random partial slab or gap when
  // the 8.4m countryside drainage panels happen to straddle a driveway.
  const cuts=Array.from(new Set([
   ...Array.from({length:segments+1},(_,i)=>a+(b-a)*i/segments),
   ...COAST_DRAIN_BRIDGES.flatMap(bridge=>[bridge.d-bridge.width*.5,bridge.d+bridge.width*.5])
    .filter(d=>d>a&&d<b),
  ])).sort((x,y)=>x-y);
  const coverPoint=(d:number,x:number,raise=0):V=>{
   const p=sample(d),v=p.position.clone().addScaledVector(p.right,x);
   const lip=coastBeachHeight(X.leftLip,p.position.y,p.right.y,d);
   // Flat flush lid instead of a textured polygon following the trough.
   v.y=lip+.055+p.right.y*(x-X.leftLip)+raise;
   return [v.x,v.y,v.z];
  };
  for(let i=0;i<cuts.length-1;i++){
   const from=cuts[i],to=cuts[i+1],mid=(from+to)*.5;
   const bridge=coastDrainBridgeAt(mid);
   const quad=(x0:number,x1:number,above:number,color:string)=>{
    batch.quad(ground(sample,from,x0,above),ground(sample,from,x1,above),
     ground(sample,to,x1,above),ground(sample,to,x0,above),color);
   };
   // Asphalt finishes at 10.12m. There is NO sandy shoulder or outer metal
   // highway rail: the thin roadside curb immediately meets a tall concrete
   // wall and a 1m deep DARK bottom, like actual rural Taiwanese U-gutters.
   quad(X.outerRoad,X.leftLip,.055,'#adaaa0');
   quad(X.leftLip,X.innerLeft,.035,'#a4a399'); // near almost-vertical side
   quad(X.innerLeft,X.innerRight,.075,'#4b514d'); // damp, muddy floor
   quad(X.innerRight,X.rightLip,.035,'#969991'); // far vertical side
   if(bridge){
    // Narrow concrete road-to-field driveway. The water remains present
    // below this shallow bridge, not deleted as if the whole canal were filled.
    batch.quad(coverPoint(from,X.leftLip,.10),coverPoint(from,X.rightLip,.10),
     coverPoint(to,X.rightLip,.10),coverPoint(to,X.leftLip,.10),'#b3b0a3');
    batch.quad(coverPoint(from,X.rightLip,.07),coverPoint(from,X.outerLand,.07),
     coverPoint(to,X.outerLand,.07),coverPoint(to,X.rightLip,.07),'#999a8d');
    // Low, squared end parapets make the crossing legible from a moving car.
    for(const d of [from,to]){
     batch.quad(coverPoint(d,X.leftLip,.12),coverPoint(d,X.rightLip,.12),
      coverPoint(d,X.rightLip,.35),coverPoint(d,X.leftLip,.35),'#8a8d88');
    }
   }else if(coastDrainCovered(mid)){
    // The photographed town drain lid IS the concrete. The previous extra
    // 2.1m grey slab beyond it looked like an unwanted second sidewalk.
    // Restore natural earth/grass immediately outside the right-hand curb.
    quad(X.rightLip,X.outerLand,.038,'#667453');
   }else{
    // Country road: narrow concrete rim leading directly into planted soil.
    quad(X.rightLip,X.rightLip+.27,.055,'#b1ada1');
    quad(X.rightLip+.27,X.outerLand,.045,'#667453');
   }
   if(!coastDrainCovered(mid)){
    // No baked glint ribbon here: its old static pale stripe looked like a
    // floating white object. Water is a separate (one-draw) animated plane
    // with real distance-flow UV and a tiny uniform-time shader.
   }else{
    // Precast concrete lid, flush with road surface and footpath. Full cover
    // gaps are genuinely dark; the townside contains NO barrier or stone.
    batch.quad(coverPoint(from,X.leftLip),coverPoint(from,X.rightLip),
     coverPoint(to,X.rightLip),coverPoint(to,X.leftLip),'#a6a59d');
    // Each panel has a transverse seam, not giant featureless paving slabs.
    const seamEnd=Math.min(to,from+.08);
    batch.quad(coverPoint(from,X.leftLip,.012),coverPoint(from,X.rightLip,.012),
     coverPoint(seamEnd,X.rightLip,.012),coverPoint(seamEnd,X.leftLip,.012),'#5d625f');
    // Occasional narrow rectangular cast-iron inlet with three dark slots.
    if(i%6===2){
     const c=(from+to)*.5;
     const inletX=X.leftLip+.36;
     batch.quad(coverPoint(c-.35,inletX,.02),coverPoint(c-.35,inletX+.75,.02),
      coverPoint(c+.35,inletX+.75,.02),coverPoint(c+.35,inletX,.02),'#515653');
     for(const dx of [.15,.37,.59])
      batch.quad(coverPoint(c-.24,inletX+dx,.028),coverPoint(c-.24,inletX+dx+.055,.028),
       coverPoint(c+.24,inletX+dx+.055,.028),coverPoint(c+.24,inletX+dx,.028),'#aeb4ac');
    }
   }
  }
 }
 return batch.finish('coast-taiwan-roadside-ditch');
}

/** Canal surface over the floor of the open ~1m U drain.
 * The material reuses the existing Ultra-Water FFT slope textures and dusk
 * sky, not a new simulation. Narrow bridges mask water with their slabs.
 * UV.y is ABSOLUTE route distance: streaming 1km chunks join seamlessly.
 * Visual flow uses phase (d + positive time), thus waves travel toward
 * decreasing d, opposite the player's forward direction.
 */
export function buildCoastRoadsideWater(sample:Sample,start:number,end:number){
 const pos:number[]=[],uv:number[]=[],index:number[]=[];
 const X=COAST_DRAIN_X;
 for(const site of COAST_SIDE_DRAINS){
  if(site.kind==='covered')continue;
  const a=Math.max(start,site.start),b=Math.min(end,site.end);
  if(b<=a)continue;
  // Use a stable absolute route grid so water appears continuous at seams.
  const distances=[a];
  for(let d=Math.ceil(a/7.5)*7.5;d<b;d+=7.5)if(d>a+1e-5)distances.push(d);
  distances.push(b);
  const first=pos.length/3;
  for(const d of distances){
   const p=sample(d);
   const lip=(x:number)=>coastBeachHeight(x,p.position.y,p.right.y,d);
   // Extend into both walls: depth testing forms the wet edge and lets
   // the stream emerge naturally from the rising floor at the inlet.
   const waterY=Math.min(lip(X.leftLip),lip(X.rightLip))+.035-COAST_DRAIN_FREEBOARD;
   for(const [side,x] of [[0,X.leftLip],[1,X.rightLip]] as const){
    pos.push(p.position.x+p.right.x*x,waterY,p.position.z+p.right.z*x);
    uv.push(side,d);
   }
  }
  for(let row=0;row<distances.length-1;row++){
   const i=first+row*2;
   index.push(i,i+1,i+2,i+1,i+3,i+2);
  }
 }
 if(!index.length)return null;
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(index);
 g.computeVertexNormals();g.computeBoundingSphere();
 g.name='coast-roadside-flowing-water';
 g.userData.coastDrainWater=true;
 return g;
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
