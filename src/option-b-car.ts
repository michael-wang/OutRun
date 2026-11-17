import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {createWheelBrow} from './hero-body';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const OPTION_B_URL = '/__local/option-b.glb';
export type OptionBStatus = {state:'default'|'loading'|'ready'|'fallback';message:string;triangles?:number};
/** Validates the local recipe output before atomically hiding any default body. */
export function attachOptionB(car:THREE.Group,asset:THREE.Group){
 const body=asset.getObjectByName('option-b-body');
 if(!(body instanceof THREE.Mesh))throw Error('Missing Option B body');
 const bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3());
 let triangles=0;
 asset.traverse(o=>{if(o instanceof THREE.Mesh){
  const positions=o.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)if(!Number.isFinite(positions.getX(i)+positions.getY(i)+positions.getZ(i)))throw Error('Invalid vertex');
  triangles+=(o.geometry.index?.count??positions.count)/3;
 }});
 if(size.z<4||size.z>5.5||size.x<1.5||size.x>2.7||size.y>2||triangles>60000)throw Error('Unexpected Option B dimensions/budget');
 const shell=car.getObjectByName('hero-classic-body-shell') as THREE.Mesh;
 if(!shell)throw Error('Default car unavailable');
 const hidden=car.children.filter(o=>o===shell||o.name==='riviera-rear-trim'||o.name==='hero-classic-tail-lamps'||
  (o instanceof THREE.Mesh&&o.material===car.userData.optionBLights.front)||
  (o instanceof THREE.Mesh&&car.userData.optionBBodyMaterials.includes(o.material)));
 const oldMaterial=body.material;
 body.material=shell.material; // Existing color picker remains authoritative.
 for(const material of Array.isArray(oldMaterial)?oldMaterial:[oldMaterial])material.dispose();
 asset.name='option-b-local';
 const arches:THREE.BufferGeometry[]=[];
 for(const side of [-1,1])for(const z of [-1.45,1.38]){
  arches.push(createWheelBrow(side).scale(1,1.18,1.08).translate(0,.46,z));
 }
 const archGeometry=mergeGeometries(arches)!;arches.forEach(g=>g.dispose());
 const arch=new THREE.Mesh(archGeometry,shell.material);arch.name='option-b-wheel-arches';asset.add(arch);
 asset.updateMatrixWorld(true);
 for(const side of [-1,1])for(const front of [true,false]){
  const direction=new THREE.Vector3(0,0,front?-1:1);
  const ray=new THREE.Raycaster(new THREE.Vector3(side*.65,front?.70:.85,front?3:-3),direction);
  const hit=ray.intersectObject(body,false)[0];
  if(!hit)continue;
  const normal=hit.face!.normal.clone().transformDirection(body.matrixWorld);
  if(normal.dot(direction)>0)normal.negate();
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.34,.052,.03),car.userData.optionBLights[front?'front':'rear']);
  lamp.position.copy(hit.point).addScaledVector(normal,.018);
  lamp.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
  lamp.name=front?'option-b-headlight':'option-b-running-brake-lamp';asset.add(lamp);
 }
 car.userData.optionBSeatMaterial.color.set('#ad7042');
 asset.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;markCoastShadowCaster(o,'dynamic','player');}});
 car.add(asset);
 hidden.forEach(o=>o.visible=false);
 return triangles+4*160+4*12;
}

function disposeAsset(asset:THREE.Group){
 const materials=new Set<THREE.Material>();
 asset.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 materials.forEach(m=>m.dispose());
}

/** Local R&D only: never requested by the default path or production build. */
export async function loadOptionB(car:THREE.Group,signal:AbortSignal):Promise<OptionBStatus>{
 const status:OptionBStatus={state:'loading',message:'Loading local Option B…'};
 car.userData.optionB=status;
 const controller=new AbortController(),abort=()=>controller.abort();
 signal.addEventListener('abort',abort,{once:true});
 if(signal.aborted)abort();
 const timeout=setTimeout(abort,8000);
 let asset:THREE.Group|undefined;
 try{
  const response=await fetch(OPTION_B_URL,{signal:controller.signal});
  if(!response.ok)throw Error('Local asset unavailable');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>8*1024*1024)throw Error('Local asset exceeds budget');
  // Only self-contained GLB from our local recipe; no external resources.
  const view=new DataView(bytes);
  if(view.byteLength<20||view.getUint32(0,true)!==0x46546c67)throw Error('Not a GLB');
  const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,view.getUint32(12,true))));
  if([...json.buffers??[],...json.images??[]].some(v=>v.uri))throw Error('External GLB resources unsupported');
  asset=(await new GLTFLoader().parseAsync(bytes,'')).scene;
  if(controller.signal.aborted)throw Error('Load cancelled');
  status.triangles=attachOptionB(car,asset);asset=undefined;
  status.state='ready';status.message='Option B · local prototype';
 }catch{
  if(asset)disposeAsset(asset);
  status.state='fallback';status.message='Option B unavailable · original car active';
 }finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
 return status;
}
