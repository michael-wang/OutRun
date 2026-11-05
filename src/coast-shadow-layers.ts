import * as THREE from 'three';
// The main camera remains on layer 0. Additional layers select depth casters.
export const COAST_STATIC_SHADOW_LAYER=1;
export const COAST_DYNAMIC_SHADOW_LAYER=2;
export function markCoastShadowCaster<T extends THREE.Object3D>(o:T,kind:'static'|'dynamic'):T{
 o.layers.enable(kind==='static'?COAST_STATIC_SHADOW_LAYER:COAST_DYNAMIC_SHADOW_LAYER);
 if(o instanceof THREE.Mesh)o.castShadow=true;
 return o;
}
