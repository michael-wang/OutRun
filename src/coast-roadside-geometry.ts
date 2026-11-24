import * as THREE from 'three';
import type {createTrack} from './track';
import {coastBeachHeight} from './scenery-cross-section';
import {COAST_SIDE_DRAINS,COAST_DRAIN_X,COAST_DRAIN_FREEBOARD,COAST_DRAIN_BRIDGES,coastDrainBridgeAt,coastDrainCovered,coastPoleLinks,COAST_WIRE_ACROSS,COAST_WIRE_TIP_DROP,type CoastUtilityPole} from './coast-roadside-layout';

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
   // A shallow bevel falls away from the asphalt. A raised kerb here masks
   // the entire reduced opening at the low chase-camera angle.
   const edgeY=site.kind==='covered'?.055:.005,lipY=site.kind==='covered'?.035:-.055;
   batch.quad(ground(sample,from,X.outerRoad,edgeY),ground(sample,from,X.leftLip,lipY),
    ground(sample,to,X.leftLip,lipY),ground(sample,to,X.outerRoad,edgeY),'#adaaa0');
   batch.quad(ground(sample,from,X.leftLip,lipY),ground(sample,from,X.innerLeft,.035),
    ground(sample,to,X.innerLeft,.035),ground(sample,to,X.leftLip,lipY),'#a4a399'); // near almost-vertical side
   quad(X.innerLeft,X.innerRight,.075,'#4b514d'); // damp, muddy floor
   quad(X.innerRight,X.rightLip,.035,'#969991'); // far vertical side
   if(bridge){
    // Narrow concrete road-to-field driveway. The water remains present
    // below this shallow bridge, not deleted as if the whole canal were filled.
    batch.quad(coverPoint(from,X.leftLip,.10),coverPoint(from,X.rightLip,.10),
     coverPoint(to,X.rightLip,.10),coverPoint(to,X.leftLip,.10),'#b3b0a3');
    batch.quad(coverPoint(from,X.rightLip,.07),coverPoint(from,X.outerLand,.07),
     coverPoint(to,X.outerLand,.07),coverPoint(to,X.rightLip,.07),'#999a8d');
    // The slab has thickness on the long edges too. The low chase camera
    // can see beneath a paper-thin deck from the side on a narrow channel.
    for(const x of [X.leftLip,X.rightLip])
     batch.quad(coverPoint(from,x,-.22),coverPoint(to,x,-.22),
      coverPoint(to,x,.10),coverPoint(from,x,.10),'#8a8d88');
    // Low, squared end parapets make the crossing legible from a moving car.
    for(const d of [from,to]){
     if(Math.abs(Math.abs(d-bridge.d)-bridge.width*.5)>.001)continue;
     // The end fascia continues below the deck to its concrete soffit.
     batch.quad(coverPoint(d,X.leftLip,-.22),coverPoint(d,X.rightLip,-.22),
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
   if(site.kind==='covered'&&!bridge){
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
/** Exact pole-local tip transformed like scenery.ts (local +X faces the road). */
export function coastWireAttachment(sample:Sample,pole:CoastUtilityPole,across:number):V{
 const p=sample(pole.d),base=ground(sample,pole.d,pole.x);
 return [base[0]+Math.cos(p.roadHeading)*across,base[1]+pole.height-COAST_WIRE_TIP_DROP,base[2]+Math.sin(p.roadHeading)*across];
}
/** One complete physical span, independent of scenery chunk boundaries. */
export function coastWirePoint(sample:Sample,from:CoastUtilityPole,to:CoastUtilityPole,across:number,d:number):V{
 const a=coastWireAttachment(sample,from,across),b=coastWireAttachment(sample,to,across);
 const t=(d-from.d)/(to.d-from.d),sag=(.28+(to.d-from.d)*.007)*4*t*(1-t);
 return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag,a[2]+(b[2]-a[2])*t];
}
/** A straight overhead span may cross the road legitimately. Only reject
 * insufficient vertical road/terrain clearance, never plan overlap alone.
 * Full-span check is independent of the caller's chunk clipping range. */
export function coastWireSpanRenderable(sample:Sample,from:CoastUtilityPole,to:CoastUtilityPole){
 const A=coastWireAttachment(sample,from,0),B=coastWireAttachment(sample,to,0),count=Math.ceil((to.d-from.d)/8);
 for(let i=0;i<=count;i++){
  const u=i/count,d=from.d+(to.d-from.d)*u,P=new THREE.Vector3(A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u-(.28+(to.d-from.d)*.007)*4*u*(1-u),A[2]+(B[2]-A[2])*u);
  let closest=sample(d),station=d,best=Infinity;
  for(let offset=-20;offset<=20;offset+=5){const q=sample(d+offset),dist=Math.hypot(P.x-q.position.x,P.z-q.position.z);if(dist<best){best=dist;closest=q;station=d+offset;}}
  const x=(P.x-closest.position.x)*closest.right.x+(P.z-closest.position.z)*closest.right.z;
  if(Math.abs(x)<=COAST_DRAIN_X.outerRoad+1.05&&P.y-(closest.position.y+closest.right.y*x)<6)return false;
  for(const side of [-1.05,1.05])if(P.y-coastBeachHeight(x+side,closest.position.y,closest.right.y,station)<1)return false;
 }
 return true;
}
export function buildCoastUtilityWires(sample:Sample,start:number,end:number){
 const batch=new RoadsideBatch();
 for(const link of coastPoleLinks(start,end)){
  if(!coastWireSpanRenderable(sample,link.from,link.to))continue;
  // Use the complete-span grid even when clipped: adjacent chunks render the
  // same underlying curve, not separately resampled approximations.
  const count=Math.ceil((link.to.d-link.from.d)/11),step=(link.to.d-link.from.d)/count;
  const cuts=[link.start];for(let i=1;i<count;i++){const d=link.from.d+i*step;if(d>link.start&&d<link.end)cuts.push(d);}cuts.push(link.end);
  for(const across of COAST_WIRE_ACROSS){
   const point=(d:number,raise:number):V=>{const p=coastWirePoint(sample,link.from,link.to,across,d);p[1]+=raise;return p;};
   for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i];batch.quad(point(a,-.018),point(b,-.018),point(b,.018),point(a,.018),'#42484b');}
  }
 }
 return batch.finish('coast-taiwan-utility-wires');
}
