import coastScene from '../../content/stages/coast/scene.json';
import prefabCatalog from '../../content/prefabs/catalog.json';

/** Small data contract. Authoring tools may replace either JSON or the GLB
 * without editing runtime code. Distances are absolute HUD road metres. */
export interface StaticPlacement {
 id:string;
 prefab:string;
 roadDistance:number;
 lateral:number;
 yaw:number;
 scale:number;
 heightOffset:number;
 replaces?:{source:'coast-rural-house';distance:number};
}
export interface StageStaticContent {
 schemaVersion:1;
 id:string;
 staticProps:StaticPlacement[];
}
export interface StaticPrefab {
 model:string;
 castShadow:boolean;
 receiveShadow:boolean;
}
export interface PrefabCatalog {
 schemaVersion:1;
 prefabs:Record<string,StaticPrefab>;
}
export const coastStaticStage=coastScene as StageStaticContent;
export const staticPrefabCatalog=prefabCatalog as PrefabCatalog;

export function replacesLegacySite(stage:StageStaticContent,source:NonNullable<StaticPlacement['replaces']>['source'],distance:number){
 return stage.staticProps.some(item=>item.replaces?.source===source&&item.replaces.distance===distance);
}

/** Validate content once per stage, not per object/frame. */
export function validateStageStaticContent(stage:StageStaticContent,catalog:PrefabCatalog){
 if(stage.schemaVersion!==1||catalog.schemaVersion!==1||!stage.id)throw Error('Unsupported static scene data');
 const ids=new Set<string>();
 for(const item of stage.staticProps){
  if(!item.id||ids.has(item.id))throw Error('Duplicate or missing static prop ID: '+item.id);
  ids.add(item.id);
  const prefab=catalog.prefabs[item.prefab];
  if(!prefab)throw Error('Unknown static prefab: '+item.prefab);
  if(!/^[a-z0-9][a-z0-9/_-]*\.glb$/i.test(prefab.model)||prefab.model.includes('..'))
   throw Error('Unsafe prefab asset path: '+prefab.model);
  for(const key of ['roadDistance','lateral','yaw','scale','heightOffset'] as const)
   if(!Number.isFinite(item[key]))throw Error(item.id+' invalid '+key);
  if(item.roadDistance<0||item.scale<=0)throw Error(item.id+' invalid road position/scale');
  if(item.replaces&&(!Number.isFinite(item.replaces.distance)||item.replaces.distance<0))
   throw Error(item.id+' invalid replaced source distance');
 }
}
