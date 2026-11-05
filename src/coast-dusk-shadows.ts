import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';
import {COAST_BEACHES,COAST_ROCKS,coastRockX} from './coast-layout';
import {COAST_VILLAGE_SITES,COAST_REST_SPOTS} from './coast-village-layout';
import {FARM_HOMES} from './coast-farm-layout';
import {coastBeachHeight} from './scenery-cross-section';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};
export type CoastShadowAnchor={d:number;x:number;width:number;length:number};
const rand=(n:number)=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
const sunAway=new THREE.Vector3(-COAST_SUN.x,0,-COAST_SUN.z).normalize();
export function coastShadowOffset(length:number){return sunAway.clone().multiplyScalar(Math.max(0,length)*.32);}
export function coastBeachShadowAnchors():CoastShadowAnchor[]{
 const anchors:CoastShadowAnchor[]=[];
 for(const site of COAST_REST_SPOTS)anchors.push({d:site.d,x:site.x,width:3.3,length:7.5});
 for(const site of COAST_VILLAGE_SITES)anchors.push({d:site.d,x:site.x,width:site.kind==='home'?10:5,length:site.kind==='home'?23:12});
 for(const site of FARM_HOMES)anchors.push({d:site.d,x:site.x,width:10,length:20});
 // Use exactly the authored umbrella placement recipe, not a second scene-generation rule.
 for(const bay of COAST_BEACHES){
  const half=Math.min(370,bay.radius*.7),count=Math.floor(half*2/33)+1;
  for(let j=0;j<count;j++){
   const d=bay.distance-half+j*33+rand(j+bay.distance)*15;
   const x=-19-rand(j*11+bay.distance)*17;
   if(COAST_REST_SPOTS.some(s=>Math.abs(s.d-d)<11&&Math.abs(s.x-x)<7))continue;
   anchors.push({d,x,width:3.7,length:12.5});
  }
 }
 for(const rock of COAST_ROCKS)anchors.push({d:rock.d,x:coastRockX(rock),width:rock.r*1.3,length:rock.r*4.5});
 return anchors;
}
function makeOpacityTexture(){
 const pixels=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const u=(x-31.5)/31.5,v=(y-31.5)/31.5;
  const across=u*u*2.9,along=v*v*1.5;
  const a=Math.pow(Math.max(0,1-Math.min(1,(across+along)*.58)),2.2);
  const o=(y*64+x)*4;
  pixels[o]=35;pixels[o+1]=29;pixels[o+2]=31;pixels[o+3]=Math.round(215*a);
 }
 const t=new THREE.DataTexture(pixels,64,64,THREE.RGBAFormat);
 t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
export class CoastDuskShadows {
 readonly beach:THREE.InstancedMesh;
 readonly player:THREE.Mesh;
 readonly anchorCount:number;
 private readonly geometry=new THREE.PlaneGeometry(1,1);
 private readonly texture=makeOpacityTexture();
 private readonly material=new THREE.MeshBasicMaterial({
  map:this.texture,transparent:true,opacity:.66,depthWrite:false,polygonOffset:true,
  polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false,side:THREE.DoubleSide,
 });
 private readonly dummy=new THREE.Object3D();
 private readonly directionAngle=Math.atan2(sunAway.x,sunAway.z);
 constructor(scene:THREE.Scene,sample:Sample){
  this.geometry.rotateX(-Math.PI/2);
  const placements: {p:THREE.Vector3;width:number;length:number}[]=[];
  for(const {d,x,width,length} of coastBeachShadowAnchors()){
   const v=sample(d),base=v.position.clone().addScaledVector(v.right,x);
   const ground=coastBeachHeight(x,v.position.y,v.right.y,d);
   if(ground< -4.05)continue; // no false patches below the water
   base.y=ground+.055;
   placements.push({p:base,width,length});
  }
  this.anchorCount=placements.length;
  this.beach=new THREE.InstancedMesh(this.geometry,this.material,placements.length);
  this.beach.name='coast-dusk-beach-shadows';
  this.beach.frustumCulled=false;this.beach.renderOrder=2;
  placements.forEach(({p,width,length},i)=>{
   this.dummy.position.copy(p).add(coastShadowOffset(length));
   this.dummy.rotation.set(0,this.directionAngle,0);
   this.dummy.scale.set(width,1,length);this.dummy.updateMatrix();
   this.beach.setMatrixAt(i,this.dummy.matrix);
  });
  this.beach.instanceMatrix.needsUpdate=true;
  this.player=new THREE.Mesh(this.geometry,this.material);
  this.player.name='coast-player-sunset-shadow';
  this.player.renderOrder=2;this.player.frustumCulled=false;
  scene.add(this.beach,this.player);
 }
 /** A single moving decal; no mobile shadow-map allocation or per-frame geometry. */
 update(carPosition:THREE.Vector3,roadHeight:number){
  const length=11;
  this.player.position.copy(carPosition).add(coastShadowOffset(length));
  this.player.position.y=roadHeight+.07;
  this.player.rotation.set(0,this.directionAngle,0);
  this.player.scale.set(3.8,1,length);
 }
 get stats(){return {drawBatches:2,beachAnchors:this.anchorCount,playerShadows:1,shadowMaps:0};}
 dispose(){
  this.beach.removeFromParent();this.player.removeFromParent();
  this.geometry.dispose();this.texture.dispose();this.material.dispose();
 }
}
