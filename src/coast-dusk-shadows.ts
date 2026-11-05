import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';
import {COAST_BEACHES,COAST_ROCKS,coastRockX,coastBarrierStyle,COAST_LAMPS} from './coast-layout';
import {COAST_VILLAGE_SITES,COAST_REST_SPOTS} from './coast-village-layout';
import {FARM_HOMES} from './coast-farm-layout';
import {coastBeachHeight,COAST_SEA_LEVEL} from './scenery-cross-section';
import {TRIP_BARRIER_INNER_M} from './road-profile';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3;tangent?:THREE.Vector3};
type Kind='umbrella'|'visitor'|'bench'|'home'|'shop'|'rock'|'concrete'|'rail'|'lamp';
export type CoastShadowAnchor={d:number;x:number;width:number;length:number;kind?:Kind};
const rawRandom=(n:number)=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
const away=new THREE.Vector3(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
const across=new THREE.Vector3(-away.z,0,away.x);
export function coastShadowOffset(length:number){return away.clone().multiplyScalar(Math.max(0,length)*.32);}

/** Share the actual scene seed, beach pocket spacing and authored prop coordinates.
 * No independently randomized umbrella placements or shadows on the wrong beach.
 * Clearance can still omit some authored objects: the overlay intentionally stays soft.
 */
export function coastBeachShadowAnchors(seed=0):CoastShadowAnchor[]{
 const rnd=(n:number)=>rawRandom(n+seed),anchors:CoastShadowAnchor[]=[];
 for(const site of COAST_REST_SPOTS){
  anchors.push({d:site.d,x:site.x,width:2.8,length:9,kind:'bench'});
  if(site.children)for(let j=0;j<2;j++)anchors.push({d:site.d+(j?5:-5),x:site.x-4-j,width:.85,length:5.4,kind:'visitor'});
 }
 for(const site of COAST_VILLAGE_SITES){
  anchors.push({d:site.d,x:site.x,width:site.kind==='home'?9:4.5,
   length:site.kind==='home'?24:13,kind:site.kind==='home'?'home':'shop'});
  if(site.kind!=='home'){
   const count=site.key%4===0?1:2+site.key%2;
   for(let j=0;j<count;j++)anchors.push({
    d:site.d-5+rnd(site.key*17+j)*10,x:16.4+rnd(site.key*7+j)*3.6,
    width:.9,length:5.5,kind:'visitor',
   });
  }
 }
 for(const site of FARM_HOMES)anchors.push({d:site.d,x:site.x,width:10,length:22,kind:'home'});
 for(const bay of COAST_BEACHES){
  const half=Math.min(370,bay.radius*.7),count=Math.floor(half*2/33)+1;
  for(let j=0;j<count;j++){
   // scenery.ts uses the unseeded rand() for beach umbrella locations.
   // Only its village people use seeded random(); keep shadow anchors aligned.
   const d=bay.distance-half+j*33+rawRandom(j+bay.distance)*15;
   const x=-19-rawRandom(j*11+bay.distance)*17;
   if(COAST_REST_SPOTS.some(s=>Math.abs(s.d-d)<11&&Math.abs(s.x-x)<7))continue;
   anchors.push({d,x,width:4.2,length:15.5,kind:'umbrella'});
   anchors.push({d:d+5,x:x-1,width:.85,length:5.5,kind:'visitor'});
   if(j%3===0)anchors.push({d:d+8,x:x-3,width:.85,length:5.5,kind:'visitor'});
  }
  anchors.push({d:bay.distance-55,x:-16.8,width:4.5,length:12.5,kind:'shop'});
 }
 // Offshore rock occlusion is performed in the existing Ultra-Water shader;
 // these optional footprints only show where rock surfaces touch dry ground.
 for(const rock of COAST_ROCKS)
  anchors.push({d:rock.d,x:coastRockX(rock),width:rock.r*1.4,length:rock.r*5,kind:'rock'});
 return anchors;
}

/** Exactly match coast-resort.ts's 12 m barrier cadence and physical offset.
 * Include both continuous rails and the low concrete block style. */
export function coastBarrierShadowAnchors(length:number,halfAt:(d:number)=>number):CoastShadowAnchor[]{
 const anchors:CoastShadowAnchor[]=[];
 for(let d=0;d<length;d+=12){
  const style=coastBarrierStyle(d);
  if(style==='opening')continue;
  for(const side of [-1,1] as const){
   const x=side*(halfAt(d)+TRIP_BARRIER_INNER_M+.28);
   anchors.push({d,x,width:style==='block'?1.25:.65,length:style==='block'?6.5:10.5,
    kind:style==='block'?'concrete':'rail'});
  }
 }
 for(const d of COAST_LAMPS)if(d<length)
  anchors.push({d,x:14,width:.55,length:18,kind:'lamp'});
 return anchors;
}

/** A ground-conforming ribbon: the prior horizontal quad disappeared into
 * sloping beach terrain and the old -4.05m cutoff deleted most wet-sand props.
 * One static geometry, one draw regardless of the number of rail/prop footprints.
 */
export function buildCoastGroundShadows(
 sample:Sample,anchors:readonly CoastShadowAnchor[],routeLength:number,
 halfAt:(d:number)=>number=()=>8.75,
){
 const positions:number[]=[],alpha:number[]=[],indices:number[]=[],ranges:{d:number;start:number;count:number}[]=[];
 let accepted=0,rejectedUnderwater=0;
 const samples=(d:number)=>sample(Math.max(0,Math.min(routeLength,d)));
 for(const a of anchors){
  if(a.d<0||a.d>=routeLength)continue;
  const at=samples(a.d),rootGround=coastBeachHeight(a.x,at.position.y,at.right.y,a.d);
  // Draw on actually dry beach; water-side boulders use the water shader instead.
  // Offshore rocks are allowed to project *onto* a dry shore even if their
  // base sits below sea level; underwater ribbon vertices fade to zero while
  // Ultra-Water handles the submerged part.
  if(rootGround<COAST_SEA_LEVEL+.015&&a.kind!=='rock'){rejectedUnderwater++;continue;}
  // scenery.ts omits umbrellas, benches and beach visitors below these
  // height gates; don't leave a free-floating shadow for a missing prop.
  if((a.kind==='umbrella'&&rootGround<-4.05)||
   (a.kind==='bench'&&rootGround< -3.7)||
   (a.kind==='visitor'&&a.x<0&&rootGround<=-4.2))continue;
  const fwd=at.tangent?.clone()??samples(a.d+.5).position.clone().sub(samples(a.d-.5).position);
  fwd.y=0;fwd.normalize();
  const right=at.right.clone().setY(0).normalize();
  // Four samples across preserve a broad soft centre while trimming ~40% of
  // the old vertex/triangle work for the whole 10km scene.
  const rows=6,cols=4,first=positions.length/3,indexStart=indices.length;
  const span=Math.max(2,a.length),w=Math.max(.2,a.width);
  const weight=a.kind==='rail'?.70:a.kind==='concrete'?.85:a.kind==='visitor'?.73:
   a.kind==='lamp'?.60:a.kind==='rock'?.94:.90;
  for(let row=0;row<=rows;row++){
   const t=row/rows;
   const travel=away.clone().multiplyScalar(span*t);
   for(let col=0;col<cols;col++){
    const u=col/(cols-1)*2-1;
    const delta=travel.clone().addScaledVector(across,u*w*.5);
    const nd=Math.max(0,Math.min(routeLength,a.d+delta.dot(fwd)));
    const nx=a.x+delta.dot(right);
    const p=samples(nd);
    const world=p.position.clone().addScaledVector(p.right,nx);
    const asphalt=Math.abs(nx)<=halfAt(nd)+.18;
    const ground=asphalt?p.position.y+p.right.y*nx:
     coastBeachHeight(nx,p.position.y,p.right.y,nd);
    // Stay above the actual ground even when the shadow crosses a beach bank
    // onto the paved shoulder. Underwater segments are received by Ultra-Water.
    world.y=ground+.10;
    positions.push(world.x,world.y,world.z);
    const lateral=1-THREE.MathUtils.smoothstep(Math.abs(u),.48,1.0);
    const tip=1-THREE.MathUtils.smoothstep(t,.52,1.0);
    const wet=ground>=COAST_SEA_LEVEL+.015?1:0;
    alpha.push(weight*lateral*tip*wet*(.63+.37*(1-t)));
   }
   if(row<rows)for(let col=0;col<cols-1;col++){
    const i=first+row*cols+col,j=i+cols;
    indices.push(i,j,i+1,i+1,j,j+1);
   }
  }
  accepted++;
  ranges.push({d:a.d,start:indexStart,count:indices.length-indexStart});
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('shadowAlpha',new THREE.Float32BufferAttribute(alpha,1));
 geometry.setIndex(indices);geometry.computeBoundingSphere();
 return {geometry,accepted,rejectedUnderwater,ranges};
}

function makeContactTexture(){
 const pixels=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const u=(x-31.5)/31.5,v=(y-31.5)/31.5;
  const r=Math.pow(u*u*1.4+v*v*.95,.7),a=Math.pow(Math.max(0,1-Math.min(1,r)),1.45);
  const o=(y*64+x)*4;
  pixels[o]=39;pixels[o+1]=33;pixels[o+2]=31;pixels[o+3]=Math.round(238*a);
 }
 const tex=new THREE.DataTexture(pixels,64,64,THREE.RGBAFormat);
 tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;return tex;
}

export class CoastDuskShadows {
 readonly beach:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
 readonly player:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
 readonly anchorCount:number;
 readonly barriers:number;
 readonly props:number;
 private readonly texture=makeContactTexture();
 private readonly playerGeometry=new THREE.PlaneGeometry(1,1);
 private readonly playerMaterial=new THREE.MeshBasicMaterial({
  map:this.texture,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,
  polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false,side:THREE.DoubleSide,
 });
 private readonly staticMaterial=new THREE.ShaderMaterial({
  uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),uColor:{value:new THREE.Color('#302a28')}},
  fog:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
  vertexShader:`attribute float shadowAlpha;varying float vAlpha;
   #include <fog_pars_vertex>
   void main(){
    vAlpha=shadowAlpha;
    vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,
  fragmentShader:`uniform vec3 uColor;varying float vAlpha;
   #include <fog_pars_fragment>
   void main(){
    if(vAlpha<0.007)discard;
    gl_FragColor=vec4(uColor,vAlpha*.88);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`,
 });
 private readonly angle=Math.atan2(away.x,away.z);
 private readonly ranges:{d:number;start:number;count:number}[];
 private visibleStatic=0;
 constructor(scene:THREE.Scene,sample:Sample,routeLength=10000,halfAt:(d:number)=>number=()=>8.75,seed=0){
  const beach=coastBeachShadowAnchors(seed);
  const barriers=coastBarrierShadowAnchors(routeLength,halfAt);
  const built=buildCoastGroundShadows(sample,[...beach,...barriers].sort((a,b)=>a.d-b.d),routeLength,halfAt);
  this.ranges=built.ranges;
  this.props=beach.length;this.barriers=barriers.length;this.anchorCount=built.accepted;
  this.beach=new THREE.Mesh(built.geometry,this.staticMaterial);
  this.beach.name='coast-dusk-beach-shadows';
  this.beach.frustumCulled=false;this.beach.renderOrder=2;
  this.playerGeometry.rotateX(-Math.PI/2);
  this.player=new THREE.Mesh(this.playerGeometry,this.playerMaterial);
  this.player.name='coast-player-sunset-shadow';
  this.player.renderOrder=2;this.player.frustumCulled=false;
  scene.add(this.beach,this.player);
 }
 update(carPosition:THREE.Vector3,roadHeight:number,distanceM?:number){
  const length=13;
  this.player.position.copy(carPosition).add(coastShadowOffset(length));
  this.player.position.y=roadHeight+.085;
  this.player.rotation.set(0,this.angle,0);
  this.player.scale.set(4,1,length);
  // One draw batch, but only submit shadows within the currently visible
  // ~2.5km coast window. No 10km worth of vertices every frame on Pixel 8.
  if(distanceM!==undefined){
   const lo=distanceM-950,hi=distanceM+1450;
   let left=0,right=this.ranges.length;
   while(left<right){const mid=(left+right)>>>1;if(this.ranges[mid].d<lo)left=mid+1;else right=mid;}
   const from=left;right=this.ranges.length;
   while(left<right){const mid=(left+right)>>>1;if(this.ranges[mid].d<=hi)left=mid+1;else right=mid;}
   this.visibleStatic=left-from;
   this.beach.geometry.setDrawRange(from<this.ranges.length?this.ranges[from].start:0,
    from<left?this.ranges[left-1].start+this.ranges[left-1].count-this.ranges[from].start:0);
  }
 }
 get stats(){return {
  drawBatches:2,beachAnchors:this.anchorCount,propCandidates:this.props,
  barrierCandidates:this.barriers,visibleStatic:this.visibleStatic,shadowTriangles:this.beach.geometry.getIndex()!.count/3,
  playerShadows:1,shadowMaps:0,
 };}
 dispose(){
  this.beach.removeFromParent();this.player.removeFromParent();
  this.beach.geometry.dispose();this.staticMaterial.dispose();
  this.playerGeometry.dispose();this.texture.dispose();this.playerMaterial.dispose();
 }
}
