import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';
import {COAST_STATIC_SHADOW_LAYER,COAST_DYNAMIC_SHADOW_LAYER,coastShadowLightEnabled} from './coast-shadow-layers';

/** Geometry-accurate live shadows by the car plus region-cached static shadows. */
export const COAST_NEAR_SHADOW={left:-220,right:220,top:110,bottom:-110,near:1,far:1300} as const;
export const COAST_FAR_SHADOW={left:-1400,right:1400,top:400,bottom:-400,near:1,far:4200} as const;
export const COAST_SHADOW_LOOKAHEAD_M=680;
export const COAST_STATIC_SHADOW_STEP_M=240;
type Sample=(d:number)=>{position:THREE.Vector3};

export function configureCoastShadowLights(near:THREE.DirectionalLight,far:THREE.DirectionalLight,mobile:boolean){
 const setup=(light:THREE.DirectionalLight,bounds:typeof COAST_NEAR_SHADOW|typeof COAST_FAR_SHADOW,size:number,bias:number,layer:number)=>{
  light.castShadow=true;light.shadow.mapSize.set(size,size);
  Object.assign(light.shadow.camera,bounds);light.shadow.camera.updateProjectionMatrix();
  light.shadow.camera.layers.set(layer);
  light.shadow.bias=bias;light.shadow.normalBias=.04;
 };
 // Only moving vehicles use the live depth pass. The far texture is cached.
 setup(near,COAST_NEAR_SHADOW,mobile?2048:3072,-.00008,COAST_DYNAMIC_SHADOW_LAYER);
 setup(far,COAST_FAR_SHADOW,mobile?3072:4096,-.00002,COAST_STATIC_SHADOW_LAYER);
 far.shadow.autoUpdate=false;
 far.shadow.needsUpdate=true;
 near.castShadow=coastShadowLightEnabled('dynamic');
 far.castShadow=coastShadowLightEnabled('static');
}

/** Diagnostic/reference geometry; driving uses CoastShadowCache below. */
export function updateCoastShadowLights(
 near:THREE.DirectionalLight,far:THREE.DirectionalLight,
 carPosition:THREE.Vector3,sample:Sample,distance:number,routeLength:number,
){
 near.target.position.copy(carPosition);
 near.position.copy(carPosition).addScaledVector(COAST_SUN,500);
 const ahead=Math.max(0,Math.min(routeLength,Math.max(0,distance)+COAST_SHADOW_LOOKAHEAD_M));
 far.target.position.copy(carPosition).lerp(sample(ahead).position,.90);
 far.position.copy(far.target.position).addScaledVector(COAST_SUN,1500);
}

/** On-demand static depth bake tied to the road streamer. While the player
 * stays inside a 240m road cell, fixed tree/house/lamp shadow geometry is
 * never re-rendered. New scenery chunk commits invalidate the cached depth.
 * The independent dynamic light still draws genuine car/truck silhouettes.
 *
 * This is a rolling cached shadow map, not a permanent offline lightmap.
 */
export class CoastShadowCache {
 private previousCell=-1;
 private previousSceneRevision=-1;
 private requests=0;
 private lastAtM=0;
 constructor(readonly near:THREE.DirectionalLight,readonly far:THREE.DirectionalLight,
  private readonly sample:Sample,private readonly routeLength:number){}
 update(carPosition:THREE.Vector3,distanceM:number,revision:number){
  this.near.target.position.copy(carPosition);
  this.near.position.copy(carPosition).addScaledVector(COAST_SUN,500);
  const distance=Math.max(0,Math.min(this.routeLength,distanceM));
  const cell=Math.floor(distance/COAST_STATIC_SHADOW_STEP_M);
  if(cell===this.previousCell&&revision===this.previousSceneRevision)return false;
  const anchor=Math.min(this.routeLength,cell*COAST_STATIC_SHADOW_STEP_M);
  const home=this.sample(anchor).position;
  const ahead=this.sample(Math.min(this.routeLength,anchor+COAST_SHADOW_LOOKAHEAD_M)).position;
  this.far.target.position.copy(home).lerp(ahead,.90);
  this.far.position.copy(this.far.target.position).addScaledVector(COAST_SUN,1500);
  this.far.shadow.needsUpdate=true;
  this.previousCell=cell;this.previousSceneRevision=revision;
  this.lastAtM=anchor;this.requests++;
  return true;
 }
 /** Shadow group toggles must invalidate the cached static depth, even inside
  * the same 240m cell with an unchanged scene revision. */
 invalidate(){this.previousCell=-1;this.previousSceneRevision=-1;this.far.shadow.needsUpdate=true;}
 refreshLightCasting(){
  this.near.castShadow=coastShadowLightEnabled('dynamic');
  this.far.castShadow=coastShadowLightEnabled('static');
 }
 get stats(){return {policy:'geometry-dynamic/static-region-cache',
  nearMapSize:this.near.shadow.mapSize.x,farMapSize:this.far.shadow.mapSize.x,
  staticRefreshRequests:this.requests,staticRefreshStepM:COAST_STATIC_SHADOW_STEP_M,
  lastStaticAnchorM:this.lastAtM,sceneRevision:this.previousSceneRevision,
  farAutoUpdate:this.far.shadow.autoUpdate};}
}
