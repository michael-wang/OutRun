import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {coastBeachX} from './coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from './scenery-cross-section';
import type {CoastBoatShadow} from './coast-boat-shadow';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};
export type Boat={id:string;kind:'sail'|'yacht'|'fishing';distance:number;offshore:number;travel:number;sway:number;speed:number;phase:number;length:number;draft:number};
/** Sea has a distinct chapter arc: an unobstructed opener, visitor sailing
 * beside town, then more frequent working fishing boats after 7km. Boat
 * paths use the same curved coast frame and small patrol radii as before. */
export const COAST_BOATS:readonly Boat[]=[
 ['opening-distant-sail','sail',1290,210,16],
 ['beach-yacht','yacht',2070,130,18],['beach-sail','sail',2740,175,16],
 ['beach-yacht-east','yacht',3190,145,18],
 ['town-sail-one','sail',3560,112,17],['town-sail-two','sail',4010,168,16],
 ['town-yacht','yacht',4470,170,18],['town-sail-three','sail',5110,122,16],
 ['town-sail-four','sail',5780,175,16],['town-yacht-two','yacht',6430,158,19],
 ['fishing-one','fishing',7100,122,16],['bay-sail-west','sail',7710,160,16],
 ['bay-sail-east','sail',7950,125,15],['fishing-four','fishing',8400,185,17],
 ['fishing-five','fishing',9000,150,16],['fishing-six','fishing',9640,120,16],
].map((row,i)=>{const [id,kind,distance,offshore,length]=row as [string,Boat['kind'],number,number,number];return {
 id,kind,distance,offshore,length,travel:65+i%3*15,
 sway:(kind==='sail'?38:kind==='fishing'?14:18)+i%3*6,
 speed:kind==='sail'?.8:kind==='fishing'?.55:1.2,
 phase:1.1+i*.31,draft:length*(kind==='sail'?.15:kind==='fishing'?.09:.075),
};});

// Read-only use of the existing FFT textures, with the ocean adapter's same
// camera-dependent mip selection and bounded displacement. No CPU readback.
const waterVertex=/* glsl */`
uniform sampler2D uDisp0; uniform sampler2D uDisp1; uniform sampler2D uDisp2;
uniform float uResolution; uniform float uSpacing;
vec3 boatWater(vec2 xz){
 float ring=length(xz-cameraPosition.xz),spacing=max(.35,ring*uSpacing),maxLod=log2(uResolution);
 vec3 d=textureLod(uDisp0,xz/600.0,clamp(log2(max(1.0,spacing*uResolution/600.0)),0.0,maxLod)).xyz
       +textureLod(uDisp1,xz/85.0,clamp(log2(max(1.0,spacing*uResolution/85.0)),0.0,maxLod)).xyz
       +textureLod(uDisp2,xz/12.0,clamp(log2(max(1.0,spacing*uResolution/12.0)),0.0,maxLod)).xyz;
 d.y=d.y/(1.0+abs(d.y)/.9);d.xz=d.xz/(1.0+length(d.xz)/1.2);
 return d*(1.0-smoothstep(1300.0,2300.0,ring));
}`;

/** Small closed patrols expressed in the same curved road/shore frame as the beach.
 * Never wrap/teleport, respawn with chunks, or follow the player's camera. */
export function coastBoatPosition(boat:Boat,time:number,sample:Sample){
 const phase=boat.phase+time*boat.speed/boat.travel,distance=boat.distance+boat.travel*Math.sin(phase);
 const offshore=boat.offshore+boat.sway*Math.cos(phase),lateral=coastBeachX(COAST_SHORE_OFFSET,distance)-offshore;
 const road=sample(distance),out=road.right.clone().setY(0).normalize();
 return {distance,offshore,position:road.position.clone().addScaledVector(out,lateral).setY(COAST_SEA_LEVEL)};
}

/** A recognizable working fishing craft, not a luxury yacht painted grey.
 * A compact low-poly hull, sheltered wheelhouse, outriggers, crates and mast.
 * One shared source geometry set is cloned for the six fishing boats.
 */
function fishingBoatSource(){
 const root=new THREE.Group();root.name='fishing-boat';
 const hull=new THREE.MeshStandardMaterial({color:'#446d75',roughness:.88});
 const trim=new THREE.MeshStandardMaterial({color:'#b47c4e',roughness:.90});
 const cabin=new THREE.MeshStandardMaterial({color:'#e0d1ae',roughness:.9});
 const glass=new THREE.MeshStandardMaterial({color:'#5c8792',roughness:.55});
 const metal=new THREE.MeshStandardMaterial({color:'#666e70',roughness:.80});
 const rope=new THREE.MeshStandardMaterial({color:'#bc9e77',roughness:1});
 function box(w:number,h:number,l:number,x:number,y:number,z:number,m:THREE.Material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m);
  mesh.position.set(x,y,z);root.add(mesh);return mesh;
 }
 function pole(r:number,h:number,x:number,y:number,z:number,m:THREE.Material,angle=0){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,6),m);
  mesh.position.set(x,y,z);mesh.rotation.z=angle;root.add(mesh);
 }
 box(3.8,1.05,8.5,0,.66,0,hull);
 // Narrow bows and stern caps with no translucent or custom shader passes.
 const bow=new THREE.Mesh(new THREE.ConeGeometry(1.9,2.5,4),hull);
 bow.rotation.x=Math.PI/2;bow.position.set(0,.66,5.0);root.add(bow);
 box(3.9,.16,8.4,0,1.25,0,trim);
 box(2.5,2.2,2.65,0,2.4,-.9,cabin);
 box(2.62,.2,2.84,0,3.55,-.9,trim);
 box(2.57,.87,.08,0,2.75,.49,glass);
 for(const side of [-1,1]){
  box(.08,.78,1.1,side*1.31,2.72,-.9,glass);
  pole(.065,3.0,side*1.55,3.52,-1.6,metal,side*.35);
  box(.25,.2,1.6,side*2.1,3.5,-1.6,metal);
  box(.62,.58,.68,side*.95,1.65,-3.0,rope);
 }
 pole(.09,3.5,0,4.62,-1.35,metal);
 box(2.6,.18,1.0,0,1.55,-3.45,rope);
 for(const z of [-3.1,-2.25])box(.8,.45,.75,0,1.78,z,trim);
 // Merge the complete hull/deck/rigging by the six shared paint materials.
 // Six fishing vessels must not become hundreds of tiny WebGL draw calls.
 const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
 for(const child of root.children){
  if(!(child instanceof THREE.Mesh))continue;
  child.updateMatrix();
  const geometry=child.geometry.clone().applyMatrix4(child.matrix);
  const arr=buckets.get(child.material as THREE.Material)??[];
  arr.push(geometry);buckets.set(child.material as THREE.Material,arr);
  child.geometry.dispose();
 }
 const batched=new THREE.Group();batched.name='fishing-boat';
 for(const [material,geometries] of buckets){
  const geometry=mergeGeometries(geometries);
  if(!geometry)throw Error('Cannot batch coastal fishing craft');
  geometries.forEach(g=>g.dispose());
  batched.add(new THREE.Mesh(geometry,material));
 }
 return batched;
}

const files={sail:'boat-sail-a.glb',yacht:'flybridge-yacht.glb'};
// Keep bytes, not live GPU resources: a replay gets clean scene-owned materials,
// while sceneDisposal can retire the previous chapter without invalidating a cache.
const bytes=new Map<string,Promise<ArrayBuffer>>();
const boatAssetDirectory=import.meta.env.BASE_URL+'assets/coast-boats/';
function modelBytes(file:string){
 let pending=bytes.get(file);if(!pending){pending=fetch(boatAssetDirectory+file).then(r=>{if(!r.ok)throw Error('Boat asset '+file+': '+r.status);return r.arrayBuffer();}).catch(e=>{bytes.delete(file);throw e;});bytes.set(file,pending);}return pending;
}

export async function addCoastBoats(scene:THREE.Scene,sample:Sample,water?:Readonly<Record<string,THREE.IUniform>>,shadow?:CoastBoatShadow){
 const loader=new GLTFLoader(),models=await Promise.all([files.sail,files.yacht].map(async file=>loader.parseAsync(await modelBytes(file),boatAssetDirectory)));
 const fishingSource=fishingBoatSource();
 // Match the coast's matte toy-like finish without adding lights or shadows.
 const materials=new Set<THREE.MeshStandardMaterial>();
 for(const source of [...models.map(g=>g.scene),fishingSource])source.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial)materials.add(m);});
 materials.forEach(m=>{m.roughness=Math.max(.7,m.roughness);m.metalness=Math.min(.15,m.metalness);m.emissive.set(0);m.emissiveIntensity=0;if(m.name==='colormap')m.side=THREE.DoubleSide;});
 const root=new THREE.Group();root.name='coast-boats';
 const vessels=COAST_BOATS.map(spec=>{
  const source=spec.kind==='fishing'?fishingSource:models[spec.kind==='sail'?0:1].scene,model=source.clone(true);
  const sail=model.getObjectByName('sail');if(sail)sail.rotation.y=.6;
  const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),scale=spec.length/(bounds.max.z-bounds.min.z);
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale-spec.draft,-center.z*scale);
  const anchor={value:new THREE.Vector3()},forward={value:new THREE.Vector2()},shared=new Map<THREE.Material,THREE.Material>();
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;
   o.material=(Array.isArray(o.material)?o.material:[o.material]).map(source=>{let m=shared.get(source);if(!m){m=source.clone() as THREE.Material;if(water){m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,water,{uBoatAnchor:anchor});shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nuniform vec3 uBoatAnchor;\n${waterVertex}`).replace('#include <project_vertex>',`vec4 mvPosition = modelViewMatrix * vec4(transformed,1.0);\nmvPosition.xyz += mat3(viewMatrix) * boatWater(uBoatAnchor.xz);\ngl_Position = projectionMatrix * mvPosition;`);};m.customProgramCacheKey=()=> 'coast-boat-fft-v1';}shared.set(source,m);}return m;});
   if(o.material.length===1)o.material=o.material[0];
  }});
  const group=new THREE.Group();group.name=spec.id;group.add(model);root.add(group);
  shadow?.add(group,m=>{
   if(!water)return;
   m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,water,{uBoatAnchor:anchor,uBoatViewerPosition:shadow.viewer});
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nuniform vec3 uBoatAnchor;uniform vec3 uBoatViewerPosition;\n${waterVertex.replaceAll('cameraPosition','uBoatViewerPosition')}`)
     .replace('#include <project_vertex>',`vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);mvPosition.xyz+=mat3(viewMatrix)*boatWater(uBoatAnchor.xz);gl_Position=projectionMatrix*mvPosition;`);
   };m.customProgramCacheKey=()=> 'coast-boat-shadow-fft-v1';
  });
  const contact=boatContact(spec,anchor,forward,water);root.add(contact);
  const reflection=boatReflection(model,anchor,water);root.add(reflection);
  return {spec,group,contact,reflection,anchor,forward};
 });
 // Clones own only their inexpensive materials. Geometry and palette are shared.
 materials.forEach(m=>m.dispose());
 scene.add(root);
 function update(time:number,camera?:THREE.Camera){
  for(const {spec,group,contact,reflection,anchor,forward} of vessels){
   const at=coastBoatPosition(spec,time,sample),next=coastBoatPosition(spec,time+.25,sample),v=next.position.sub(at.position);
   group.position.copy(at.position);group.position.y+=.025*Math.sin(time*.68+spec.phase);
   const yaw=Math.atan2(v.x,v.z);group.rotation.set(.005*Math.sin(time*.47+spec.phase*2),yaw,.009*Math.sin(time*.57+spec.phase),'YXZ');
   anchor.value.copy(at.position);forward.value.set(Math.sin(yaw),Math.cos(yaw));contact.position.copy(at.position);
   reflection.position.copy(group.position);reflection.rotation.copy(group.rotation);
   if(camera){const d=camera.position.distanceTo(group.position);reflection.visible=d<750;contact.visible=d<1100;}
  }
 }
 update(0);
 return {root,update,inspect:(time:number)=>vessels.map(({spec,group})=>({...spec,...coastBoatPosition(spec,time,sample),position:group.position.toArray(),rotation:group.rotation.toArray()}))};
}

/** Reuse source triangles as a faded, wave-broken mirror projected onto the
 * water plane. No reflection camera, render target or full-scene reflection. */
function boatReflection(model:THREE.Object3D,anchor:THREE.IUniform<THREE.Vector3>,water?:Readonly<Record<string,THREE.IUniform>>){
 const root=new THREE.Group(),copy=model.clone(true);root.add(copy);root.name='boat-reflection';
 const materials=new Map<THREE.Material,THREE.Material>();
 copy.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.frustumCulled=false;o.renderOrder=2;
  o.material=(Array.isArray(o.material)?o.material:[o.material]).map((source:THREE.MeshStandardMaterial)=>{let m=materials.get(source);if(!m){const reflection=new THREE.MeshBasicMaterial({map:source.map,color:source.color.clone().multiplyScalar(.65),transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide});
   reflection.onBeforeCompile=shader=>{Object.assign(shader.uniforms,water,{uBoatAnchor:anchor});shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nuniform vec3 uBoatAnchor;varying float vReflectHeight;varying vec2 vReflectXZ;${water?waterVertex:'vec3 boatWater(vec2 xz){return vec3(0.0);}'}\n`).replace('#include <project_vertex>',`
    vec3 w=(modelMatrix*vec4(transformed,1.0)).xyz;vReflectHeight=w.y-(${COAST_SEA_LEVEL.toFixed(1)});
    w.y=2.0*${COAST_SEA_LEVEL.toFixed(1)}-w.y;
    float t=(${COAST_SEA_LEVEL.toFixed(1)}-cameraPosition.y)/min(-.01,w.y-cameraPosition.y);
    w=mix(cameraPosition,w,t);vReflectXZ=w.xz;w+=boatWater(w.xz);w.y+=.075;
    vec4 mvPosition=viewMatrix*vec4(w,1.0);gl_Position=projectionMatrix*mvPosition;
   `);shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vReflectHeight;varying vec2 vReflectXZ;uniform vec3 uBoatAnchor;').replace('#include <alphatest_fragment>',`if(vReflectHeight<0.0)discard;diffuseColor.a*=exp(-vReflectHeight*.085)*(.6+.4*sin(vReflectXZ.x*2.8+vReflectXZ.y*1.6))*(1.0-smoothstep(400.0,700.0,length(cameraPosition.xz-uBoatAnchor.xz)));\n#include <alphatest_fragment>`);};
   reflection.customProgramCacheKey=()=> 'coast-boat-reflection-v1';materials.set(source,reflection);m=reflection;}return m;});if(o.material.length===1)o.material=o.material[0];
 });return root;
}

/** Small wave-conforming hull contact and broken stern wake. Directional
 * silhouettes are received by the water from the separate floater depth map. */
function boatContact(spec:Boat,anchor:THREE.IUniform<THREE.Vector3>,forward:THREE.IUniform<THREE.Vector2>,water?:Readonly<Record<string,THREE.IUniform>>){
 const g=new THREE.PlaneGeometry(spec.length*3,spec.length*3,8,8);g.rotateX(-Math.PI/2);
 const m=new THREE.ShaderMaterial({uniforms:{...water,uBoatAnchor:anchor,uForward:forward,uLength:{value:spec.length},...THREE.UniformsUtils.clone(THREE.UniformsLib.fog)},transparent:true,depthWrite:false,fog:true,clipping:true,
 vertexShader:`#include <fog_pars_vertex>\n#include <clipping_planes_pars_vertex>\n${water?waterVertex:'vec3 boatWater(vec2 xz){return vec3(0.0);}'}\nvarying vec2 vPlan;void main(){vec4 w=modelMatrix*vec4(position,1.0);vPlan=w.xz;w.xyz+=boatWater(w.xz);w.y+=.055;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n#include <clipping_planes_vertex>\n}`,
 fragmentShader:`#include <fog_pars_fragment>\n#include <clipping_planes_pars_fragment>\nuniform vec3 uBoatAnchor;uniform vec2 uForward;uniform float uLength;varying vec2 vPlan;
 void main(){\n#include <clipping_planes_fragment>\nvec2 p=(vPlan-uBoatAnchor.xz)/uLength;float along=dot(p,uForward),across=dot(p,vec2(uForward.y,-uForward.x));
 float contact=exp(-pow(across/.23,2.0)-pow(along/.48,4.0))*.32;
 float aft=-along;float wake=smoothstep(.25,.5,aft)*(1.0-smoothstep(.65,1.4,aft))*exp(-pow((abs(across)-aft*.22)*42.0,2.0))*.27;
 wake*=.55+.45*sin(aft*95.0+across*36.0);float alpha=contact+wake;if(alpha<.008)discard;
 gl_FragColor=vec4(mix(vec3(.035,.065,.07),vec3(.82,.63,.35),wake/max(alpha,.001)),min(alpha,.4));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}`});
 const mesh=new THREE.Mesh(g,m);mesh.name='boat-water-contact';mesh.renderOrder=2;return mesh;
}
