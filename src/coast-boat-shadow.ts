// Adapted from Ultra-Water src/scene/floaterShadow.js (MIT).
// Copyright (c) 2026 Humpalumps. License: ./ultra-water/LICENSE.
import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';

const MAX_WATER_SHADOW_CASTERS=4; // One more near boat/fishing vessel, still a single 10Hz depth pass.

export const BOAT_SHADOW_GLSL=/* glsl */`
uniform highp sampler2DShadow uBoatShadow;
uniform mat4 uBoatShadowMatrix;
uniform float uBoatShadowBias;
float boatSunShadow(vec3 p){
 if(uBoatShadowBias<=0.0)return 1.0;
 vec3 sc=(uBoatShadowMatrix*vec4(p,1.0)).xyz;
 if(any(lessThan(sc,vec3(0.0)))||any(greaterThan(sc,vec3(1.0))))return 1.0;
 float visibility=texture(uBoatShadow,vec3(sc.xy,sc.z-uBoatShadowBias));
 return mix(visibility,1.0,smoothstep(650.0,950.0,length(p.xz-cameraPosition.xz)));
}`;

/** Upstream's separate floater depth pass, bounded to nearby boats. The water
 * receives it; terrain, vegetation and buildings never enter this pass. */
export class CoastBoatShadow {
 enabled=true;
 readonly target:THREE.WebGLRenderTarget;
 readonly scene=new THREE.Scene();
 readonly camera=new THREE.OrthographicCamera();
 readonly viewer={value:new THREE.Vector3()};
 readonly uniforms:{uBoatShadow:THREE.IUniform;uBoatShadowMatrix:THREE.IUniform<THREE.Matrix4>;uBoatShadowBias:THREE.IUniform<number>};
 private casters:{source:THREE.Object3D;copy:THREE.Object3D}[]=[];
 private materials=new Set<THREE.Material>();
 private elapsed=1;
 private lastViewer=new THREE.Vector3(Infinity,Infinity,Infinity);
 private draws=0;private count=0;
 constructor(renderer:THREE.WebGLRenderer,readonly size:number){
  const depth=new THREE.DepthTexture(size,size,THREE.FloatType);
  depth.compareFunction=THREE.LessEqualCompare;
  depth.minFilter=depth.magFilter=THREE.LinearFilter;
  this.target=new THREE.WebGLRenderTarget(size,size,{format:THREE.RedFormat,depthTexture:depth,generateMipmaps:false});
  this.uniforms={uBoatShadow:{value:depth},uBoatShadowMatrix:{value:new THREE.Matrix4()},uBoatShadowBias:{value:0}};
  // Initialize compare mode before the water's first shadow-sampler draw.
  const previous=renderer.getRenderTarget();renderer.setRenderTarget(this.target);renderer.clear(false,true,false);renderer.setRenderTarget(previous);
 }
 add(source:THREE.Object3D,configure:(material:THREE.MeshBasicMaterial)=>void){
  const copy=source.clone(true),material=new THREE.MeshBasicMaterial({colorWrite:false,side:THREE.DoubleSide});
  configure(material);this.materials.add(material);
  copy.traverse(o=>{if(o instanceof THREE.Mesh){o.material=material;o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;}});
  this.casters.push({source,copy});this.scene.add(copy);
 }
 update(renderer:THREE.WebGLRenderer,viewer:THREE.Camera,dt:number){
  if(!this.enabled){this.uniforms.uBoatShadowBias.value=0;return;}
  this.elapsed+=Math.max(0,dt);
  if(this.elapsed<.1&&viewer.position.distanceToSquared(this.lastViewer)<2500&&this.uniforms.uBoatShadowBias.value>0)return;
  this.elapsed=0;this.lastViewer.copy(viewer.position);this.viewer.value.copy(viewer.position);
  const selected=this.casters.filter(c=>c.source.position.distanceToSquared(viewer.position)<1100**2)
   .sort((a,b)=>a.source.position.distanceToSquared(viewer.position)-b.source.position.distanceToSquared(viewer.position)).slice(0,MAX_WATER_SHADOW_CASTERS);
  this.count=selected.length;this.casters.forEach(c=>{c.copy.visible=false;});
  if(!selected.length){this.uniforms.uBoatShadowBias.value=0;return;}
  const bounds=new THREE.Box3();
  for(const c of selected){c.copy.visible=true;c.copy.position.copy(c.source.position);c.copy.quaternion.copy(c.source.quaternion);c.copy.scale.copy(c.source.scale);c.copy.updateMatrixWorld(true);bounds.union(new THREE.Box3().setFromObject(c.copy));}
  bounds.expandByScalar(2);const center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
  const cam=this.camera;cam.position.copy(center).addScaledVector(COAST_SUN,radius+20);cam.lookAt(center);cam.updateMatrixWorld();
  // Fit in sun-camera XY, rather than wasting resolution on a square enclosing
  // kilometres of coastline. Receiver depth extends behind the low evening sun.
  const lightBounds=new THREE.Box3();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])lightBounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse));
  cam.left=lightBounds.min.x;cam.right=lightBounds.max.x;cam.bottom=lightBounds.min.y;cam.top=lightBounds.max.y;cam.near=1;cam.far=radius*2+500;cam.updateProjectionMatrix();
  this.uniforms.uBoatShadowMatrix.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
  this.uniforms.uBoatShadowBias.value=.08/(cam.far-cam.near);
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear;
  try{renderer.setRenderTarget(this.target);renderer.autoClear=false;renderer.clear(false,true,false);renderer.render(this.scene,cam);this.draws++;}
  finally{renderer.autoClear=auto;renderer.setRenderTarget(previous);}
 }
 get stats(){return {enabled:this.enabled,size:this.size,hz:10,maxCasters:MAX_WATER_SHADOW_CASTERS,casters:this.count,updates:this.draws};}
 dispose(){this.target.dispose();this.materials.forEach(m=>m.dispose());this.scene.clear();this.casters=[];}
}
