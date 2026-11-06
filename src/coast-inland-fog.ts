import * as THREE from 'three';

/** The coast's warm sunset fog should barely tint the inland grass hills.
 * Normal scene fog is a dusty pink (#a8796e); at long range it previously
 * replaced the grass color entirely, leaving an implausibly bright pink ridge.
 * Keep other scenery and the sky's atmospheric treatment unchanged.
 */
export const COAST_GRASS_FOG_STRENGTH = 0.10;

export function softenCoastInlandFog(material:THREE.MeshStandardMaterial){
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`
#ifdef USE_FOG
 #ifdef FOG_EXP2
  float coastGrassFogFactor = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
 #else
  float coastGrassFogFactor = smoothstep(fogNear,fogFar,vFogDepth);
 #endif
 // Keep only 10% of the scene's warm fog on grass and inland foothills.
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,coastGrassFogFactor*${COAST_GRASS_FOG_STRENGTH.toFixed(2)});
#endif
`);
 };
 material.customProgramCacheKey=()=> 'coast-grass-reduced-warm-fog-v1';
}
