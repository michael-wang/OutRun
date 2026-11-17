import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {gtWheelVisuals,gtBrakes,modernWindshield,modernLamps,optionBLighting} from './option-b-details';
import {optionBRear} from './option-b-rear';

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
 const hidden=car.children.filter(o=>o===shell||o.name==='original-rear-hardware'||o.name==='riviera-rear-trim'||o.name==='hero-classic-tail-lamps'||
  (o instanceof THREE.Mesh&&o.material===car.userData.optionBLights.front)||
  (o instanceof THREE.Mesh&&car.userData.optionBBodyMaterials.includes(o.material)));
 const oldMaterial=body.material;
 body.material=shell.material; // Existing color picker remains authoritative.
 for(const material of Array.isArray(oldMaterial)?oldMaterial:[oldMaterial])material.dispose();
 asset.name='option-b-local';
 asset.updateMatrixWorld(true);
 asset.add(modernWindshield());
 asset.add(modernLamps(body,car.userData.optionBLights.front,car.userData.optionBLights.rear));
 asset.add(optionBRear(shell.material as THREE.Material,car.userData.optionBLights.rear));
 car.getObjectByName('original-windshield')!.visible=false;
 for(const wheel of car.userData.optionBWheelControllers){
  const side=wheel.inspect().side;wheel.setVisuals(gtWheelVisuals(side));wheel.pivot.add(gtBrakes(side));
 }
 car.userData.brakeLights=optionBLighting(car.userData.optionBLights.front,car.userData.optionBLights.rear,car.userData.optionBDusk);
 car.userData.optionBSeatMaterial.color.set('#ad7042');
 asset.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;markCoastShadowCaster(o,'dynamic','player');}});
 car.add(asset);
 hidden.forEach(o=>o.visible=false);
 let total=0;asset.traverse(o=>{if(o instanceof THREE.Mesh)total+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});
 return total;
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
