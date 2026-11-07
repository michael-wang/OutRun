import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';
import {coastShadowLength,coastShadowOffset,COAST_SHADOW_YAW,makeCoastShadowMaterial} from './coast-sun-shadow';
export {coastShadowLength,coastShadowOffset} from './coast-sun-shadow';
import {COAST_BEACHES,COAST_ROCKS,coastRockX,coastBarrierStyle,coastBarrierStoneAt,coastBarrierRockAt,coastBarrierClearance,COAST_LAMPS} from './coast-layout';
import {COAST_DRAIN_X,COAST_UTILITY_POLES,coastDrainAt} from './coast-roadside-layout';
import {COAST_VILLAGE_SITES,COAST_REST_SPOTS} from './coast-village-layout';
import {FARM_HOMES} from './coast-farm-layout';
import {coastBeachHeight,COAST_SEA_LEVEL} from './scenery-cross-section';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3;tangent?:THREE.Vector3};
type Kind='umbrella'|'visitor'|'bench'|'home'|'shop'|'rock'|'concrete'|'rail'|'rail-beam'|'lamp';
export type CoastShadowAnchor={d:number;x:number;width:number;length:number;kind?:Kind};
const rawRandom=(n:number)=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
const away=new THREE.Vector3(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
const across=new THREE.Vector3(-away.z,0,away.x);

/** Share the actual scene seed, beach pocket spacing and authored prop coordinates.
 * No independently randomized umbrella placements or shadows on the wrong beach.
 * Clearance can still omit some authored objects: the overlay intentionally stays soft.
 */
export function coastBeachShadowAnchors(seed=0):CoastShadowAnchor[]{
 const rnd=(n:number)=>rawRandom(n+seed),anchors:CoastShadowAnchor[]=[];
 for(const site of COAST_REST_SPOTS){
  anchors.push({d:site.d,x:site.x,width:2.8,length:coastShadowLength(1.12),kind:'bench'});
  if(site.children)for(let j=0;j<2;j++)anchors.push({d:site.d+(j?5:-5),x:site.x-4-j,width:.85,length:coastShadowLength(.98),kind:'visitor'});
 }
 for(const site of COAST_VILLAGE_SITES){
  anchors.push({d:site.d,x:site.x,width:site.kind==='home'?9:4.5,
   length:coastShadowLength(site.kind==='home'?7.5:4.05),kind:site.kind==='home'?'home':'shop'});
  if(site.kind!=='home'){
   const count=site.key%4===0?1:2+site.key%2;
   for(let j=0;j<count;j++)anchors.push({
    d:site.d-5+rnd(site.key*17+j)*10,x:16.4+rnd(site.key*7+j)*3.6,
    width:.9,length:coastShadowLength(1.7),kind:'visitor',
   });
  }
 }
 for(const site of FARM_HOMES)anchors.push({d:site.d,x:site.x,width:10,length:coastShadowLength(7.5),kind:'home'});
 for(const bay of COAST_BEACHES){
  const half=Math.min(370,bay.radius*.7),count=Math.floor(half*2/33)+1;
  for(let j=0;j<count;j++){
   // scenery.ts uses the unseeded rand() for beach umbrella locations.
   // Only its village people use seeded random(); keep shadow anchors aligned.
   const d=bay.distance-half+j*33+rawRandom(j+bay.distance)*15;
   const x=-19-rawRandom(j*11+bay.distance)*17;
   if(COAST_REST_SPOTS.some(s=>Math.abs(s.d-d)<11&&Math.abs(s.x-x)<7))continue;
   anchors.push({d,x,width:4.2,length:coastShadowLength(3.5),kind:'umbrella'});
   anchors.push({d:d+5,x:x-1,width:.85,length:coastShadowLength(1.7),kind:'visitor'});
   if(j%3===0)anchors.push({d:d+8,x:x-3,width:.85,length:5.5,kind:'visitor'});
  }
  anchors.push({d:bay.distance-55,x:-16.8,width:4.5,length:coastShadowLength(3.9),kind:'shop'});
 }
 // Offshore rock occlusion is performed in the existing Ultra-Water shader;
 // these optional footprints only show where rock surfaces touch dry ground.
 for(const rock of COAST_ROCKS)
  anchors.push({d:rock.d,x:coastRockX(rock),width:rock.r*1.4,length:coastShadowLength(rock.r*.82),kind:'rock'});
 return anchors;
}

/** Match coast-resort.ts's real 12m cadence. Each rail section has THREE
 * posts at -5/0/+5m plus continuous horizontal bars, not one central shadow.
 * All elements still share the existing single static draw batch. */
export function coastBarrierShadowAnchors(length:number,halfAt:(d:number)=>number):CoastShadowAnchor[]{
 const anchors:CoastShadowAnchor[]=[];
 for(let d=0;d<length;d+=12){
  for(const side of [-1,1] as const){
   const style=coastBarrierStyle(d,side);if(style==='opening'||style==='none'||style==='rock')continue;
   if(style==='block'){
    const stone=coastBarrierStoneAt(d,side);
    const x=side*(halfAt(stone.d)+coastBarrierClearance(stone.d,side));
    anchors.push({d:stone.d,x,width:1.25,length:coastShadowLength(stone.height),kind:'concrete'});
   }else{
    const x=side*(halfAt(d)+coastBarrierClearance(d,side));
    // Broad soft beam silhouette runs along the actual roadway tangent.
    anchors.push({d,x,width:10.8,length:coastShadowLength(.70),kind:'rail-beam'});
    for(const offset of [-5,0,5]){
     const postD=d+offset;if(postD<0||postD>=length)continue;
     anchors.push({d:postD,x:side*(halfAt(postD)+coastBarrierClearance(postD,side)),
      width:.60,length:coastShadowLength(.72),kind:'rail'});
    }
   }
  }
 }
 // Inside the Taiwan roadside pockets, lamps now grow from actual
 // concrete utility poles. Do not leave ghost shadows from the old
 // stand-alone 64m lamp grid at the previous shoulder location.
 for(let d=0;d<length;d+=33){
  if(coastBarrierStyle(d,-1)!=='rock')continue;
  const b=coastBarrierRockAt(d);
  anchors.push({d:b.d,x:-(halfAt(b.d)+b.offset),width:b.width*1.1,
   length:coastShadowLength(b.height*.8),kind:'rock'});
 }
 for(const d of COAST_LAMPS)if(d<length&&!coastDrainAt(d))
  anchors.push({d,x:14,width:.55,length:coastShadowLength(11.5),kind:'lamp'});
 for(const pole of COAST_UTILITY_POLES)if(pole.d<length&&pole.lamp)
  anchors.push({d:pole.d,x:pole.x,width:.7,length:coastShadowLength(pole.height),kind:'lamp'});
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
  // Posts are only 0.72m tall: four ground samples suffice. Longer beach
  // shadows retain six terrain-conforming rows. No new draw calls or passes.
  const rows=a.kind==='rail'||a.kind==='rail-beam'?4:6,cols=4,first=positions.length/3,indexStart=indices.length;
  const span=Math.max(2,a.length),w=Math.max(.2,a.width);
  const weight=a.kind==='rail'?.80:a.kind==='rail-beam'?.24:a.kind==='concrete'?.85:a.kind==='visitor'?.73:
   a.kind==='lamp'?.60:a.kind==='rock'?.94:.90;
  for(let row=0;row<=rows;row++){
   const t=row/rows;
   const travel=away.clone().multiplyScalar(span*t);
   for(let col=0;col<cols;col++){
    const u=col/(cols-1)*2-1;
    const delta=travel.clone().addScaledVector(a.kind==='rail-beam'?fwd:across,u*w*.5);
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
    const tip=1-THREE.MathUtils.smoothstep(t,.72,1.0);
    const wet=ground>=COAST_SEA_LEVEL+.015?1:0;
    // The remaining opening-road rectangles were projected decals from
    // rocks, lamps, umbrellas and visitors, not the live 3D depth shadows.
    // Keep synthetic ground overlays off ALL paved lanes/shoulders except
    // tiny authentic concrete/rail contacts; real shadow maps remain.
    const pavedCorridor=Math.abs(nx)<=Math.max(halfAt(nd)+.18,COAST_DRAIN_X.outerRoad+.06);
    const barrier=a.kind==='concrete'||a.kind==='rail'||a.kind==='rail-beam';
    const visibleOnRoad=pavedCorridor&&!barrier?0:1;
    alpha.push(weight*lateral*tip*wet*(.63+.37*(1-t))*visibleOnRoad);
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

export class CoastDuskShadows {
 readonly beach:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
 readonly player:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
 readonly anchorCount:number;
 readonly barriers:number;
 readonly props:number;
 private readonly playerGeometry=new THREE.PlaneGeometry(1,1);
 // Black ink never brightens the near-black coastal asphalt.
 private readonly playerMaterial=makeCoastShadowMaterial(.78);
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
 private readonly angle=COAST_SHADOW_YAW;
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
  const length=coastShadowLength(1.55);
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
  this.playerGeometry.dispose();this.playerMaterial.map?.dispose();this.playerMaterial.dispose();
 }
}
