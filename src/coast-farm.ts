import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Grass} from './vendor/three-stylized/Grass';
import {acquireSharedFlowerMask,releaseSharedFlowerMask} from './vendor/three-stylized/flowerShapes';
import {grassWindVertexTransform,grassWindVertexUniforms} from './vendor/three-stylized/shaders';
import {seededRandom} from './vendor/three-stylized/utils';
import {coastNatureGround} from './coast-nature';
import {riceCanopyGeometry} from './coast-rice-canopy';
import type {PreparedFarmPlot} from './coast-farm-prep';
import {farmWarmupRepresentatives} from './farm-warmup-plan';
import {FARM_SCARECROWS,type FarmPlot} from './coast-farm-layout';
import type {createTrack} from './track';

type Sample=ReturnType<typeof createTrack>['sample'];
const bytes=new Map<string,Promise<ArrayBuffer>>();
const wind={strength:.12,speed:.65,frequency:.13,turbulence:.18,lean:.025,direction:65};
const riceWind={...wind,strength:.26,speed:.52,frequency:.085,turbulence:.32,lean:.045};
// Same world-space waves as three-stylized, plus a broad, slower gust envelope.
// Both the instanced heads and the persistent canopy sample this field.
const riceWaves=/* glsl */ `
 float riceWave(vec2 p) {
  vec2 crossWind=vec2(-uWindDirection.y,uWindDirection.x);
  return sin(dot(p,uWindDirection)*uWindFrequency+uTime*uWindSpeed)*.62
   + sin(dot(p,crossWind)*uWindFrequency*1.7+uTime*uWindSpeed*.73)*.20
   + sin(dot(p,uWindDirection)*.027-uTime*.23)*.18;
 }
`;
const flowerColors=['#ecc341','#e679a7','#a382d8'];
const up=new THREE.Vector3(0,1,0);
/** Replays reuse downloads, but own and dispose their GPU resources. */
export async function loadCoastFarm(){
 const geometries=await Promise.all(['rice-near','scarecrow'].map(async name=>{
  let request=bytes.get(name);if(!request){request=fetch(`${import.meta.env.BASE_URL}assets/coast-farm/${name}.glb`).then(r=>{if(!r.ok)throw Error(`Farm model ${name}: ${r.status}`);return r.arrayBuffer();});bytes.set(name,request);request.catch(()=>bytes.delete(name));}
  const {scene}=await new GLTFLoader().parseAsync((await request).slice(0),'');scene.updateMatrixWorld(true);
  const parts:THREE.BufferGeometry[]=[];
  scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
   const source=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=source.getAttribute('position'),n=source.getAttribute('normal'),c=source.getAttribute('color'),uv=source.getAttribute('uv'),positions=[],normals=[],colors=[],uvs=[];
   const sourceMaterial=o.material as THREE.MeshStandardMaterial,color=sourceMaterial.color.clone();
   // Pale timber keeps the existing outstretched arms legible against gold rice.
   if(name==='scarecrow'&&sourceMaterial.name==='timber')color.set('#c6aa6a');
   if(name==='scarecrow'&&sourceMaterial.name==='thatch')color.set('#e8ca81');
   if(name==='scarecrow'&&sourceMaterial.name==='red')color.set('#bb5146');
   for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c?c.getX(i):color.r,c?c.getY(i):color.g,c?c.getZ(i):color.b);uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.applyMatrix4(o.matrixWorld);parts.push(g);
   o.geometry.dispose();if(source!==o.geometry)source.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();
  });const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());return merged;
 }));
 const time={value:0},materials=new Map<string,THREE.Material>();
 const texture=fieldTexture(),canopyTexture=riceSeaTexture();
 // Stage-local pin for the single shared flower mask. Build it once during
 // resource preparation, before distant field constructors run during driving.
 const flowerMask=acquireSharedFlowerMask();
 let stageDisposed=false;
 function material(kind:string,color:string,near=0,far=0){
  const key=`${kind}:${color}:${near}:${far}`;let m=materials.get(key) as THREE.MeshStandardMaterial|undefined;
  if(!m){m=new THREE.MeshStandardMaterial({color,vertexColors:kind==='crop'||kind==='scarecrow'||kind==='canopy',roughness:1,side:THREE.DoubleSide,...(kind==='ground'?{map:texture,emissive:color,emissiveIntensity:.17}:kind==='canopy'?{map:canopyTexture}:{})});
   if(kind==='crop'||kind==='canopy'){
    m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,{uTime:time,uWindStrength:{value:riceWind.strength},uWindSpeed:{value:riceWind.speed},uWindFrequency:{value:riceWind.frequency},uWindTurbulence:{value:riceWind.turbulence},uWindLean:{value:riceWind.lean},uWindDirection:{value:new THREE.Vector2(Math.cos(wind.direction*Math.PI/180),Math.sin(wind.direction*Math.PI/180))}});
     const crop=kind==='crop';
     shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nvarying float vRiceWave;\n${grassWindVertexUniforms}\n${riceWaves}\n${crop?grassWindVertexTransform:''}`).replace('#include <begin_vertex>',`#include <begin_vertex>
      vec2 riceWorld=(modelMatrix * ${crop?'instanceMatrix * ':''}vec4(${crop?'0.0,0.0,0.0':'position'},1.0)).xz;
      vRiceWave=riceWave(riceWorld);
      ${crop?'transformed=deformGrassBlade(transformed); transformed.y-= (.07+.07*vRiceWave)*uv.y*uv.y;':'transformed.y-=vRiceWave*.12;'}
     `);
     shader.fragmentShader='varying float vRiceWave;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= .94 + .10*vRiceWave;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .24;');
     if(crop)distanceShader(shader,near,far,false);
    };m.customProgramCacheKey=()=>`farm-${kind}-waves-v2-${near}-${far}`;
   }materials.set(key,m);
  }return m;
 }
 return {geometries,time,material,dispose(){if(stageDisposed)return;stageDisposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();canopyTexture.dispose();releaseSharedFlowerMask(flowerMask);}};
}
export type FarmAssets=Awaited<ReturnType<typeof loadCoastFarm>>;

/** A small repeating row texture preserves field structure beyond plant LOD. */
function fieldTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!,rand=seededRandom(80483);
 ctx.fillStyle='#e2d5a9';ctx.fillRect(0,0,128,128);
 for(let x=0;x<128;x+=16){ctx.fillStyle='#b7b488';ctx.fillRect(x,0,3,128);}
 for(let i=0;i<1800;i++){ctx.fillStyle=rand()>.5?'#eee5bf':'#bfc191';ctx.fillRect(rand()*128,rand()*128,1,2);}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=1;return t;
}

/** Low-cost seamless golden-grain texture: dozens of rice heads per square metre,
 * generated once on the main thread, then mipped for stable oblique coastal views. */
function riceSeaTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d')!,rand=seededRandom(20261104);
 ctx.fillStyle='#f3dfaa';ctx.fillRect(0,0,256,256);
 // Broad, low-contrast cultivated rows remain visible when distant mip levels
 // average the individual grains away.
 for(let x=0;x<256;x+=16){
  ctx.fillStyle='rgba(123,101,44,.12)';ctx.fillRect(x,0,4,256);
  ctx.fillStyle='rgba(255,251,207,.10)';ctx.fillRect(x+6,0,6,256);
 }
 // Short leaning heads and stalks; avoid high-contrast noise and alpha overdraw.
 for(let i=0;i<4400;i++){
  const x=Math.floor(rand()*256),y=Math.floor(rand()*256),w=1+Math.floor(rand()*3),h=3+Math.floor(rand()*9);
  const shade=rand();
  ctx.fillStyle=shade<.3?'#cead62':shade<.72?'#f7e4ad':'#fff0c0';
  ctx.fillRect(x,y,w,h);
  if(y+h>256)ctx.fillRect(x,y-256,w,h);
  if(shade>.82){ctx.fillStyle='#ddc478';ctx.fillRect((x+2)%256,(y+2)%256,1,Math.max(2,h-3));}
 }
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;
 t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=2;return t;
}

// Use the existing opaque/alpha-tested passes. No blending layers or shadows.
function distanceShader(shader:{vertexShader:string;fragmentShader:string;uniforms:any},near:number,far:number,custom:boolean){
 const declarations='varying float vFarmDistance;';
 shader.vertexShader=declarations+'\n'+shader.vertexShader;
 shader.fragmentShader=declarations+'\n'+shader.fragmentShader;
 const calc='vFarmDistance = length((modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xz - cameraPosition.xz);';
 shader.vertexShader=shader.vertexShader.replace(custom?'gl_Position =':'#include <project_vertex>',custom?calc+'\ngl_Position =':calc+'\n#include <project_vertex>');
 const fade=`float farmFade = 1.0-smoothstep(${(far*.72).toFixed(1)},${far.toFixed(1)},vFarmDistance);${near?`farmFade *= smoothstep(${near.toFixed(1)},${(near+35).toFixed(1)},vFarmDistance);`:''}
 if(fract(52.9829189 * fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))) > farmFade) discard;`;
 shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\n'+fade);
 if(custom){
  Object.assign(shader.uniforms,THREE.UniformsUtils.clone(THREE.UniformsLib.fog));
  shader.vertexShader='#include <fog_pars_vertex>\n#include <clipping_planes_pars_vertex>\n'+shader.vertexShader;
  shader.fragmentShader='#include <fog_pars_fragment>\n#include <clipping_planes_pars_fragment>\n'+shader.fragmentShader;
  shader.vertexShader=shader.vertexShader.replace('gl_Position =','vec4 mvPosition = viewMatrix * worldPosition;\n#include <fog_vertex>\n#include <clipping_planes_vertex>\ngl_Position =');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\n#include <clipping_planes_fragment>').replace('#include <colorspace_fragment>','#include <colorspace_fragment>\n#include <fog_fragment>');
 }
}

export function createFarmPlot(plot:FarmPlot,sample:Sample,assets:FarmAssets,prepared?:PreparedFarmPlot){
 if(prepared&&prepared.id!==plot.id)throw new Error('Prepared farm plot id mismatch');
 const group=new THREE.Group();group.name=`coast-farm-${plot.id}`;
 const ownedGeometry:THREE.BufferGeometry[]=[],instances:THREE.InstancedMesh[]=[];
 const chunkStart=Math.floor(plot.start/1000)*1000,chunkEnd=chunkStart+1000;
  // Sample the original terrain once per row, not again for every crop instance.
 const rows=Math.ceil((plot.end-plot.start)/4);
 const ground=Array.from({length:rows+1},(_,i)=>{
  if(prepared){if(prepared.ground.length!==(rows+1)*2)throw new Error('Bad prepared farm ground row count');return [prepared.ground[i*2],prepared.ground[i*2+1]];}
  const d=plot.start+(plot.end-plot.start)*i/rows;
  return [coastNatureGround(sample,d,plot.left,chunkStart,chunkEnd),coastNatureGround(sample,d,plot.right,chunkStart,chunkEnd)];
 });
 const position=(d:number,x:number,lift=0)=>{const p=sample(d),v=p.position.clone().addScaledVector(p.right,x),f=THREE.MathUtils.clamp((d-plot.start)/(plot.end-plot.start)*rows,0,rows),i=Math.min(rows-1,Math.floor(f)),t=f-i,u=(x-plot.left)/(plot.right-plot.left);v.y=THREE.MathUtils.lerp(THREE.MathUtils.lerp(ground[i][0],ground[i][1],u),THREE.MathUtils.lerp(ground[i+1][0],ground[i+1][1],u),t)+lift;return v;};
 function ribbon(left:number,right:number,start:number,end:number,lift:number,mat:THREE.Material){
  const vertices=[],uv=[],indices=[],rows=Math.ceil((end-start)/4);
  for(let i=0;i<=rows;i++){const d=start+(end-start)*i/rows;for(const x of [left,right]){const p=position(d,x,lift);vertices.push(p.x,p.y,p.z);uv.push((x-left)/8,(d-start)/8);}if(i<rows){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();ownedGeometry.push(g);const m=new THREE.Mesh(g,mat);group.add(m);return m;
 }
 const isRice=plot.kind==='rice';
 const groundColor=plot.kind==='rice'?'#d3b450':flowerColors[plot.band%3];
 const surface=ribbon(plot.left,plot.right,plot.start,plot.end,.055,assets.material('ground',groundColor));
 // Keep the exact sampled terrain, including road bend and mild grade. No new terrain generator.
 // The hybrid rice sea is a single animated canopy plus roadside rice heads.
 // Do not allocate an extra terrain mesh/grass system when it cannot be seen.
 const sampling=isRice?null:surface.clone(false);
 if(sampling){sampling.geometry=surface.geometry.clone();ownedGeometry.push(sampling.geometry);
  const suv=sampling.geometry.getAttribute('uv');for(let i=0;i<suv.count;i++)suv.setXY(i,suv.getX(i)*8/(plot.right-plot.left),suv.getY(i)*8/(plot.end-plot.start));}
 const residentScarecrows=FARM_SCARECROWS.filter(s=>s.d>=plot.start&&s.d<plot.end&&s.x>plot.left&&s.x<plot.right);
 const clearPath=(d:number,x:number)=>residentScarecrows.some(s=>Math.abs(d-s.d)<2.2&&Math.abs(x-s.x)<3);
 const density=[1,.55,.28,.10,.07][plot.band];
 const coverage={sample:({uv}:{uv:THREE.Vector2|null})=>uv&&uv.x>(plot.kind==='rice'?.015:.035)&&uv.x<(plot.kind==='rice'?.985:.965)&&uv.y>.015&&uv.y<.985&&(plot.kind==='rice'||((uv.x*20)%1)>.22)&&!clearPath(plot.start+uv.y*(plot.end-plot.start),plot.left+uv.x*(plot.right-plot.left))?1:0};
 const meadow=isRice?null:new Grass({surface:sampling!,coverage,terrain:{seed:80483+plot.id},grass:{density:(plot.kind==='rice'?.24:.18)*density,seed:80483+plot.id,shadow:false,blade:{segments:1,minHeight:plot.kind==='rice'?.9:.3,maxHeight:plot.kind==='rice'?1.15:.48,minWidth:.07,maxWidth:.13,lean:.08},colors:{bottom:plot.kind==='rice'?'#7d8330':'#48723e',top:plot.kind==='rice'?'#e5c65b':'#708e49'},brightness:1,lighting:{intensity:.85,backlightStrength:.25},wind:plot.kind==='rice'?riceWind:wind},wildflowers:{enabled:plot.kind==='flowers'&&plot.band<3,density:1.1*density,maxCount:plot.band===0?2300:plot.band===1?1500:800,seed:80483+plot.id}},prepared?.meadow);
 if(meadow){
 // Grass facade borrows the external surface. Its visual clone is redundant with
 // our always-visible far ground, so remove only that clone, never the source.
 for(const child of [...meadow.children])if(child instanceof THREE.Mesh)meadow.remove(child);
 meadow.traverse(o=>{if(o instanceof THREE.InstancedMesh){instances.push(o);o.frustumCulled=true;o.computeBoundingSphere();o.boundingSphere!.radius+=1.5;const m=o.material as THREE.ShaderMaterial;distanceShader(m,0,plot.kind==='rice'?260:240,true);m.fog=true;m.clipping=true;m.transparent=false;m.needsUpdate=true;}});
 if(meadow.wildflowers){
  const flowers=meadow.wildflowers.flowers,g=flowers.geometry,color=new THREE.Color(flowerColors[plot.band%3]).multiplyScalar(.58),attr=g.getAttribute('aPetalColor');
  for(let i=0;i<attr.count;i++)attr.setXYZ(i,color.r,color.g,color.b);attr.needsUpdate=true;
  for(const name of ['aFoliageColor','aCentreColor']){const a=g.getAttribute(name);for(let i=0;i<a.count;i++)a.setXYZ(i,a.getX(i)*.65,a.getY(i)*.65,a.getZ(i)*.65);a.needsUpdate=true;}
  // Cultivated flowers are taller than the upstream wildflower meadow; use its
  // original flower masks and GPU wind, with one coherent palette per band.
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  for(let i=0;i<flowers.count;i++){flowers.getMatrixAt(i,m);m.decompose(p,q,s);s.multiplyScalar(1.7);m.compose(p,q,s);flowers.setMatrixAt(i,m);}flowers.instanceMatrix.needsUpdate=true;flowers.computeBoundingSphere();flowers.boundingSphere!.radius+=2;
 }
 group.add(meadow);
 }
 // Golden rice heads are the downloaded model, not widened yellow grass blades.
 const crops:THREE.InstancedMesh[]=[];
 if(isRice&&plot.band===0){
  const rand=seededRandom(7300+plot.id),matrices:THREE.Matrix4[]=[],dummy=new THREE.Object3D();
  for(let d=plot.start+1.6;d<plot.end-1.4;d+=3.5)for(let x=plot.left+1.4;x<plot.right-1.2;x+=2.9){
   const at=d+(rand()-.5)*.8,lateral=x+(rand()-.5)*.5;
   if(clearPath(at,lateral))continue;
   dummy.position.copy(position(at,lateral,.04));dummy.rotation.set(0,rand()*Math.PI*2,0);
   const scale=.94+rand()*.14;dummy.scale.set(scale*1.08,scale,scale*1.08);
   dummy.updateMatrix();matrices.push(dummy.matrix.clone());
  }
  const mesh=new THREE.InstancedMesh(assets.geometries[0],assets.material('crop','#fff2bf',0,135),matrices.length);
  mesh.userData.farmLod=0;matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
  mesh.computeBoundingSphere();mesh.boundingSphere!.radius+=1;group.add(mesh);instances.push(mesh);crops.push(mesh);
 }
 const bund=assets.material('path','#a99363');
 ribbon(plot.left-.65,plot.left,plot.start,plot.end,.16,bund);
 ribbon(plot.left,plot.right,plot.end,plot.end+1.3,.14,bund);
 // Narrow matte irrigation channel: one shallow strip, no extra water simulation.
 if(plot.band===0){ribbon(17.6,18.7,plot.start,plot.end,.065,assets.material('canal','#608c82'));ribbon(19,19.7,plot.start,plot.end,.14,bund);}
 const scarecrows:number[]=[];
 for(const {d,x} of residentScarecrows){
  const scare=new THREE.InstancedMesh(assets.geometries[1],assets.material('scarecrow','#fff1d4'),1),dummy=new THREE.Object3D();dummy.position.copy(position(d,x,.08));dummy.scale.set(1.4,1.18,1.18);
  const road=sample(d-25),towards=road.position.clone().sub(dummy.position);dummy.quaternion.setFromAxisAngle(up,Math.atan2(towards.x,towards.z));dummy.updateMatrix();scare.setMatrixAt(0,dummy.matrix);scare.name='farm-scarecrow';group.add(scare);instances.push(scare);scarecrows.push(d);
  ribbon(x-3,x+3,d-1.8,d+1.8,.09,bund);
 }
 // Ground, paths and matte channels share one draw per plot. Retain each field's
 // own bounds instead of merging the entire kilometre into an uncullable mesh.
 const surfaces=group.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&!(o instanceof THREE.InstancedMesh));
 const parts=surfaces.map(m=>{const g=m.geometry.clone(),colors=[],c=(m.material as THREE.MeshStandardMaterial).color;for(let i=0;i<g.getAttribute('position').count;i++)colors.push(c.r,c.g,c.b);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return g;});
 const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());ownedGeometry.push(merged);surfaces.forEach(m=>group.remove(m));
 const fieldMaterial=assets.material('ground','#ffffff');fieldMaterial.vertexColors=true;fieldMaterial.emissive.set(0x000000);
 // The distant crop canopy retains its golden/flower palette after individual
 // plants fade. Tint the ambient contribution by the same field/row colours.
 fieldMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .28;');};
 fieldMaterial.customProgramCacheKey=()=> 'farm-canopy-ground-v1';group.add(new THREE.Mesh(merged,fieldMaterial));
 // All five terraces retain a crop-height silhouette after individual heads fade.
 // One opaque draw per plot, never stacked transparent cards. Leave the existing
 // scarecrow access patch open, so its post and outstretched arms stay readable.
 let canopyTriangles=0;
 if(plot.kind==='rice'){
  const geometry=prepared?.canopy?(()=>{
    const p=prepared.canopy!,g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(p.position,3));
    g.setAttribute('uv',new THREE.BufferAttribute(p.uv,2));
    g.setAttribute('color',new THREE.BufferAttribute(p.color,3));
    g.setAttribute('normal',new THREE.BufferAttribute(p.normal,3));
    g.setIndex(new THREE.BufferAttribute(p.index,1));
    g.computeBoundingSphere();g.boundingSphere!.radius+=.2;return g;
   })():riceCanopyGeometry(plot,position,clearPath);
   ownedGeometry.push(geometry);canopyTriangles=geometry.index!.count/3;
  const canopy=new THREE.Mesh(geometry,assets.material('canopy','#ffffff'));canopy.name='rice-canopy';canopy.userData.riceSeaCanopy=true;group.add(canopy);
 }
 const update=(distance:number,time:number)=>{
  const gap=Math.max(plot.start-distance,0,distance-plot.end);if(meadow){meadow.visible=gap<265;if(meadow.visible)meadow.update(time);}
  crops.forEach(m=>m.visible=gap<105);
 };
 if(import.meta.env.DEV)group.traverse(o=>{if(o instanceof THREE.Mesh)o.onAfterRender=()=>{o.userData.farmSubmitted=performance.now();};});
 return {group,plot,update,stats:()=>{let submittedDraws=0,submittedInstances=0;group.traverse(o=>{if(o instanceof THREE.Mesh&&performance.now()-(o.userData.farmSubmitted??-Infinity)<100){submittedDraws++;if(o instanceof THREE.InstancedMesh)submittedInstances+=o.count;}});return {id:plot.id,kind:plot.kind,blades:meadow?.bladeCount??0,flowers:meadow?.wildflowerCount??0,crops:crops.map(m=>m.count),scarecrows,canopyTriangles,draws:instances.length+1+(canopyTriangles?1:0),submittedDraws,submittedInstances};},dispose(){meadow?.dispose();instances.forEach(m=>m.dispose());ownedGeometry.forEach(g=>g.dispose());group.removeFromParent();}};
}
export type FarmPatch=ReturnType<typeof createFarmPlot>;

/** Same tiny real-framebuffer upload technique as chapter preparation. Warm
 * distant farm materials too: their first visible draw must not compile at speed. */
export async function warmFarmMeshes(renderer:THREE.WebGLRenderer,camera:THREE.Camera,scene:THREE.Scene,patches:FarmPatch[],alive:()=>boolean,onProgress?:(progress:{done:number;total:number;compileWallMs:number;uploadSubmitMs:number;maxObjectSubmitMs:number})=>void){
 const staging=new THREE.Scene();staging.fog=scene.fog;staging.environment=scene.environment;
 scene.traverse(o=>{if(o instanceof THREE.Light)staging.add(o.clone());});
 const allObjects:THREE.Mesh[]=[];for(const patch of patches)patch.group.traverse(o=>{if(o instanceof THREE.Mesh)allObjects.push(o);});
 // The hybrid renderer uses shared farm shaders. Prewarm one representative
 // for each material/object variant rather than submitting every distant Mesh
 // to WebGL before it enters the view. Remaining meshes are streamed normally.
 const objects=farmWarmupRepresentatives(allObjects);
 const compiled=new Set<THREE.Material>();
 let done=0,compileWallMs=0,uploadSubmitMs=0,maxObjectSubmitMs=0;
 onProgress?.({done,total:objects.length,compileWallMs,uploadSubmitMs,maxObjectSubmitMs});
 for(const object of objects){
  await new Promise<void>(r=>requestAnimationFrame(()=>r()));if(!alive())break;
  const parent=object.parent!,visible=object.visible,cull=object.frustumCulled,materials=Array.isArray(object.material)?object.material:[object.material];
  if(materials.some(m=>!compiled.has(m))){const compileStart=onProgress?performance.now():0;await renderer.compileAsync(object,camera,scene);if(onProgress)compileWallMs+=performance.now()-compileStart;materials.forEach(m=>compiled.add(m));if(!alive())break;}
  const viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),test=renderer.getScissorTest(),auto=renderer.autoClear,writes=materials.map(m=>[m.colorWrite,m.depthWrite]);
  const submitStart=onProgress?performance.now():0;
  try{
   staging.add(object);object.visible=true;object.frustumCulled=false;materials.forEach(m=>{m.colorWrite=false;m.depthWrite=false;});renderer.autoClear=false;
   renderer.setViewport(0,0,2,2);renderer.setScissor(0,0,2,2);renderer.setScissorTest(true);renderer.render(staging,camera);
  }finally{
   parent.add(object);object.visible=visible;object.frustumCulled=cull;materials.forEach((m,i)=>{[m.colorWrite,m.depthWrite]=writes[i];});renderer.autoClear=auto;renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);
  }
  if(onProgress){
   const submitMs=performance.now()-submitStart;
   uploadSubmitMs+=submitMs;maxObjectSubmitMs=Math.max(maxObjectSubmitMs,submitMs);
   done++;onProgress({done,total:objects.length,compileWallMs,uploadSubmitMs,maxObjectSubmitMs});
  }
 }
 staging.clear();
}
