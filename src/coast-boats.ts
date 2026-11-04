import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {coastBeachX} from './coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from './scenery-cross-section';

type Sample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};
export const COAST_BOATS=[
 {id:'white-sail',kind:'sail',distance:1850,offshore:125,travel:70,sway:38,speed:.85,phase:1.25,length:18,draft:1.5},
 {id:'white-yacht',kind:'yacht',distance:2370,offshore:65,travel:80,sway:22,speed:1.25,phase:1.4,length:20,draft:1.05},
 {id:'distant-sail',kind:'sail',distance:6020,offshore:245,travel:110,sway:42,speed:.65,phase:1.9,length:14,draft:1.16},
 {id:'distant-yacht',kind:'yacht',distance:8640,offshore:185,travel:90,sway:35,speed:1.05,phase:1.2,length:18,draft:.94},
] as const;
type Boat=typeof COAST_BOATS[number];

/** Small closed patrols expressed in the same curved road/shore frame as the beach.
 * Never wrap/teleport, respawn with chunks, or follow the player's camera. */
export function coastBoatPosition(boat:Boat,time:number,sample:Sample){
 const phase=boat.phase+time*boat.speed/boat.travel,distance=boat.distance+boat.travel*Math.sin(phase);
 const offshore=boat.offshore+boat.sway*Math.cos(phase),lateral=coastBeachX(COAST_SHORE_OFFSET,distance)-offshore;
 const road=sample(distance),out=road.right.clone().setY(0).normalize();
 return {distance,offshore,position:road.position.clone().addScaledVector(out,lateral).setY(COAST_SEA_LEVEL)};
}

const files={sail:'boat-sail-a.glb',yacht:'flybridge-yacht.glb'};
// Keep bytes, not live GPU resources: a replay gets clean scene-owned materials,
// while sceneDisposal can retire the previous chapter without invalidating a cache.
const bytes=new Map<string,Promise<ArrayBuffer>>();
function modelBytes(file:string){
 let pending=bytes.get(file);if(!pending){pending=fetch('/assets/coast-boats/'+file).then(r=>{if(!r.ok)throw Error('Boat asset '+file+': '+r.status);return r.arrayBuffer();}).catch(e=>{bytes.delete(file);throw e;});bytes.set(file,pending);}return pending;
}

export async function addCoastBoats(scene:THREE.Scene,sample:Sample){
 const loader=new GLTFLoader(),models=await Promise.all([files.sail,files.yacht].map(async file=>loader.parseAsync(await modelBytes(file),'/assets/coast-boats/')));
 // Match the coast's matte toy-like finish without adding lights or shadows.
 const materials=new Set<THREE.MeshStandardMaterial>();
 models.forEach(g=>g.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial)materials.add(m);}));
 materials.forEach(m=>{m.roughness=Math.max(.7,m.roughness);m.metalness=Math.min(.15,m.metalness);if(m.name==='ivory'||m.name==='colormap'){m.emissive.set('#d9d4c4');m.emissiveIntensity=.10;}});
 const root=new THREE.Group();root.name='coast-boats';
 const vessels=COAST_BOATS.map(spec=>{
  const source=models[spec.kind==='sail'?0:1].scene,model=source.clone(true);
  const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),scale=spec.length/(bounds.max.z-bounds.min.z);
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale-spec.draft,-center.z*scale);
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;}});
  const group=new THREE.Group();group.name=spec.id;group.add(model);root.add(group);
  return {spec,group};
 });
 scene.add(root);
 function update(time:number){
  for(const {spec,group} of vessels){
   const at=coastBoatPosition(spec,time,sample),next=coastBoatPosition(spec,time+.25,sample),v=next.position.sub(at.position);
   group.position.copy(at.position);group.position.y+=.12*Math.sin(time*.68+spec.phase)+.035*Math.sin(time*1.13+spec.phase*3);
   group.rotation.set(.009*Math.sin(time*.47+spec.phase*2),Math.atan2(v.x,v.z),.018*Math.sin(time*.57+spec.phase),'YXZ');
  }
 }
 update(0);
 return {root,update,inspect:(time:number)=>vessels.map(({spec,group})=>({...spec,...coastBoatPosition(spec,time,sample),position:group.position.toArray(),rotation:group.rotation.toArray()}))};
}
