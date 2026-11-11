import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {type StageStaticContent,type PrefabCatalog,validateStageStaticContent} from './stage-data';

type RoadPose={position:THREE.Vector3;right:THREE.Vector3;roadHeading:number};
export type RoadSampler=(roadDistance:number)=>RoadPose;
export interface PlacedStaticProp{
 id:string;prefab:string;model:string;position:[number,number,number];yaw:number;meshes:number;
}

/** Shared transform contract for all data-authored rigid static GLB props. */
export function staticPropPose(
 road:RoadPose,lateral:number,yaw:number,height:number,
){
 return {
  position:road.position.clone().addScaledVector(road.right,lateral).setY(height),
  yaw:-road.roadHeading+Math.PI+yaw,
 };
}

/** One GLB is loaded once per asset and cloned for all placements. The group's
 * resources belong to the stage and are disposed by the existing scene lifecycle.
 * Optional art failures are reported, never allowed to block driving. */
export async function mountStageStaticProps(
 scene:THREE.Scene,
 sample:RoadSampler,
 stage:StageStaticContent,
 catalog:PrefabCatalog,
 groundHeight:(item:StageStaticContent['staticProps'][number],road:RoadPose)=>number,
 signal?:AbortSignal,
):Promise<PlacedStaticProp[]>{
 validateStageStaticContent(stage,catalog);
 const loader=new GLTFLoader(),loaded=new Map<string,THREE.Group>();
 const placed:PlacedStaticProp[]=[];
 const group=new THREE.Group();
 group.name='authored-static-props';
 scene.add(group);
 for(const item of stage.staticProps){
  if(signal?.aborted)break;
  const prefab=catalog.prefabs[item.prefab];
  try {
   let model=loaded.get(prefab.model);
   if(!model){
    const file=await loader.loadAsync(import.meta.env.BASE_URL+prefab.model);
    model=file.scene;
    loaded.set(prefab.model,model);
   }
   if(signal?.aborted)break;
   const root=model.clone(true);
   const road=sample(item.roadDistance),pose=staticPropPose(
    road,item.lateral,item.yaw,groundHeight(item,road)+item.heightOffset);
   root.name='authored-prop:'+item.id;
   root.position.copy(pose.position);
   root.rotation.y=pose.yaw;
   root.scale.setScalar(item.scale);
   let meshes=0;
   root.traverse(o=>{
    if(o instanceof THREE.Mesh){
     o.castShadow=prefab.castShadow;
     o.receiveShadow=prefab.receiveShadow;
     meshes++;
    }
   });
   group.add(root);
   placed.push({id:item.id,prefab:item.prefab,model:prefab.model,
    position:pose.position.toArray() as [number,number,number],yaw:pose.yaw,meshes});
  }catch(error){
   console.warn('Optional authored stage prop unavailable: '+item.id,error);
  }
 }
 return placed;
}
