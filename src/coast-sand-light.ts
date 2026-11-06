import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';

/** Coastal-only sunset response on the EXISTING sand/shore material.
 * The sea's FFT and wet-surface appearance cannot be transplanted to terrain:
 * this keeps the PBR sand receiver and adds a small, view-dependent wet sheen.
 * The UV's X coordinate is the authored beach cross-section (-26m shore).
 * No additional meshes, shadow maps, water samplers or render targets.
 */
export function addCoastSandLight(material:THREE.MeshStandardMaterial){
 material.onBeforeCompile=shader=>{
  shader.uniforms.uCoastSandSun={value:COAST_SUN.clone()};
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>',`#include <common>
varying vec3 vCoastSandWorld;
varying float vCoastSandProfileX;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
vCoastSandWorld=(modelMatrix*vec4(position,1.0)).xyz;
vCoastSandProfileX=uv.x;`);
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>',`#include <common>
uniform vec3 uCoastSandSun;
varying vec3 vCoastSandWorld;
varying float vCoastSandProfileX;`)
   .replace('#include <color_fragment>',`#include <color_fragment>
// Dry sand gets its tonal grain baked into vertex colors; only the
// narrow wet shoreline evaluates the glancing sunset reflection.
float coastWetSand=0.0;
if(vCoastSandProfileX>-27.0 && vCoastSandProfileX<-10.8){
 coastWetSand=smoothstep(-27.0,-22.5,vCoastSandProfileX)
   *(1.0-smoothstep(-18.5,-10.8,vCoastSandProfileX));
 vec3 toEye=normalize(cameraPosition-vCoastSandWorld);
 vec3 eveningReflection=reflect(-uCoastSandSun,vec3(0.0,1.0,0.0));
 float sunGlance=pow(max(dot(toEye,eveningReflection),0.0),13.0);
 float ripple=sin(vCoastSandWorld.x*.33+vCoastSandWorld.z*.49);
 diffuseColor.rgb*=(1.0-.13*coastWetSand);
 diffuseColor.rgb+=vec3(.30,.17,.065)*coastWetSand*sunGlance*(.8+.2*ripple);
}`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
// Wet shoreline reflects sunlight more tightly than the dry beach.
roughnessFactor=mix(roughnessFactor,.62,coastWetSand*.62);`);
 };
 material.customProgramCacheKey=()=> 'coast-sand-sunset-r91-v1';
}
