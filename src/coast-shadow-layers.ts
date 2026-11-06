import * as THREE from 'three';

// Temporary diagnostics, not a public quality setting. Reload resets all ON.
export const COAST_STATIC_SHADOW_LAYER=1;
export const COAST_DYNAMIC_SHADOW_LAYER=2;
export const COAST_SHADOW_GROUPS=[
 {id:'player',label:'主角跑車',kind:'dynamic'},
 {id:'traffic',label:'道路車輛',kind:'dynamic'},
 {id:'hazards',label:'三角錐／警示',kind:'dynamic'},
 {id:'buildings',label:'房屋／店家',kind:'static'},
 {id:'vegetation',label:'樹木／植被',kind:'static'},
 {id:'lamps',label:'路燈',kind:'static'},
 {id:'rocks',label:'岩石（含海面）',kind:'static'},
 {id:'barriers',label:'護欄／石墩',kind:'static'},
 {id:'beach',label:'海灘道具',kind:'static'},
 {id:'other',label:'其他固定物',kind:'static'},
 {id:'boats',label:'海上船影',kind:'water'},
] as const;
export type CoastShadowGroup=typeof COAST_SHADOW_GROUPS[number]['id'];
const enabled=Object.fromEntries(COAST_SHADOW_GROUPS.map(g=>[g.id,true])) as Record<CoastShadowGroup,boolean>;
export function coastShadowGroupEnabled(group:CoastShadowGroup){return enabled[group];}
export function coastShadowGroupSnapshot():Record<CoastShadowGroup,boolean>{return {...enabled};}
export function coastShadowLightEnabled(kind:'static'|'dynamic'){
 return COAST_SHADOW_GROUPS.some(g=>g.kind===kind&&enabled[g.id]);
}
/** Scene objects stay rendered on layer 0; shadow depth passes use 1 or 2. */
export function markCoastShadowCaster<T extends THREE.Object3D>(
 object:T,kind:'static'|'dynamic',group:CoastShadowGroup='other',
):T{
 object.layers.enable(kind==='static'?COAST_STATIC_SHADOW_LAYER:COAST_DYNAMIC_SHADOW_LAYER);
 if(object instanceof THREE.Mesh){
  object.userData.coastShadowGroup=group;
  object.castShadow=enabled[group];
 }
 return object;
}
/** Switch shadow caster participation without changing mesh visibility or
 * shadow receivers. New streamed meshes respect the same group state. */
export function setCoastShadowGroupEnabled(scene:THREE.Scene,group:CoastShadowGroup,value:boolean):boolean{
 if(enabled[group]===value)return false;
 enabled[group]=value;
 if(group!=='boats')scene.traverse(object=>{
  if(object instanceof THREE.Mesh&&object.userData.coastShadowGroup===group)object.castShadow=value;
 });
 return true;
}
