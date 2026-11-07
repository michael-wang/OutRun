import * as THREE from 'three';
import {coastShadowTechniqueEnabled} from './coast-shadow-techniques';

/** Coast road shading gate: these strange dark slabs came from the ACTIVE
 * 3D static directional shadow cache, not CoastDuskShadows decals (which
 * aren't constructed when geometry shadows are enabled). That 2800m-wide,
 * 240m-step low-sun depth map cannot represent subtle road-height changes
 * cleanly and its distant casters create square flickering marks.
 *
 * On asphalt/markings: retain near dynamic car/truck shadow details inside
 * ~200m and bypass ONLY the second far/static light shadow sample. Both
 * lights still illuminate asphalt; static shadows continue fully on land,
 * buildings and other scene receivers. Zero new draw calls/depth passes.
 *
 * Coast World inserts near sun before far sun. This explicit two-light
 * contract is regression tested; changing their order requires updating
 * this specialised road receiver.
 */
export const COAST_ROAD_DYNAMIC_SHADOW_FULL_M=80;
export const COAST_ROAD_DYNAMIC_SHADOW_END_M=200;
/** The diagnostic shadow switches can disable the near light, changing
 * renderer light ordering. Do not accidentally sample the distant static
 * light after it becomes the first shadow-caster. */
const dynamicDepthAllowed={value:coastShadowTechniqueEnabled('dynamicMap')};
export function setCoastRoadDynamicShadowEnabled(enabled:boolean){dynamicDepthAllowed.value=enabled;}
export function coastRoadDynamicShadowEnabled(){return dynamicDepthAllowed.value;}

export function coastRoadLightingChunk(chunk:string){
 const expression=/directLight\.color\s*\*=\s*\(\s*directLight\.visible\s*&&\s*receiveShadow\s*\)\s*\?\s*(getShadow\(\s*directionalShadowMap\[\s*i\s*\],[^;]*\))\s*:\s*1\.0\s*;/;
 if(!expression.test(chunk))throw Error('Three.js directional shadow lighting chunk changed');
 return chunk.replace(expression,(_full,shadowCall:string)=>
  `directLight.color *= (directLight.visible && receiveShadow && uCoastRoadDynamicShadowEnabled && (UNROLLED_LOOP_INDEX == 0)) ?
   mix(1.0, ${shadowCall},
    1.0 - smoothstep(${COAST_ROAD_DYNAMIC_SHADOW_FULL_M.toFixed(1)},
                   ${COAST_ROAD_DYNAMIC_SHADOW_END_M.toFixed(1)},length(vViewPosition))) : 1.0;`);
}

export function constrainCoastRoadShadowReceiver(material:THREE.MeshStandardMaterial){
 const original=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  original.call(material,shader,renderer);
  shader.uniforms.uCoastRoadDynamicShadowEnabled=dynamicDepthAllowed;
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nuniform bool uCoastRoadDynamicShadowEnabled;');
  const include='#include <lights_fragment_begin>';
  if(!shader.fragmentShader.includes(include))
   throw Error('Three.js standard road lighting include missing');
  shader.fragmentShader=shader.fragmentShader.replace(
   include,coastRoadLightingChunk(THREE.ShaderChunk.lights_fragment_begin));
 };
 material.customProgramCacheKey=()=> 'coast-road-dynamic-shadow-only-v1';
}
