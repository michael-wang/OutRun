import * as THREE from 'three';

/** R3 small-canal animated water, inspired by the coastal dusk light but
 * intentionally NOT a second FFT ocean. One opaque standard MeshBasicMaterial
 * and one shared clock uniform for all 1km Worker-streamed strips.
 *
 * Patterns travel from larger road-distance towards smaller road-distance:
 * phase = absoluteDistance + speed * t. The static terrain and road are
 * unaffected, and no geometry upload occurs on a running frame.
 */
export const COAST_DRAIN_FLOW_METRES_PER_SECOND=4.8;
export type CoastFlowClock={value:number};

export function makeCoastDrainWaterMaterial(clock:CoastFlowClock){
 const m=new THREE.MeshBasicMaterial({
  color:'#79b8b0',
  side:THREE.DoubleSide,
  fog:true,
  depthWrite:true,
  toneMapped:true,
 });
 m.name='coast-rural-flowing-drain-water';
 m.customProgramCacheKey=()=> 'coast-flowing-water-r3';
 m.onBeforeCompile=shader=>{
  shader.uniforms.uCoastFlowTime=clock;
  shader.vertexShader=shader.vertexShader.replace(
   '#include <common>',
   '#include <common>\nvarying vec2 vCoastFlowUV;',
  ).replace(
   '#include <begin_vertex>',
   '#include <begin_vertex>\nvCoastFlowUV = uv;',
  );
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <common>',
   '#include <common>\nvarying vec2 vCoastFlowUV;\nuniform float uCoastFlowTime;',
  ).replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   // Absolute route-coordinate stays seamless across all Worker chunks.
   // Constant phase propagates toward negative road-distance as time grows.
   float f = vCoastFlowUV.y + uCoastFlowTime * ${COAST_DRAIN_FLOW_METRES_PER_SECOND.toFixed(1)};
   float bank = vCoastFlowUV.x;
   float primary = sin(f * 1.74 + sin(f * .13 + bank * 3.7) * 1.30 + bank * 5.6);
   float secondary = sin(f * 2.73 + bank * 13.1 - sin(f * .24) * .83);
   float thin = pow(max(0.0,primary*.74+secondary*.26),9.0);
   float small = .5+.5*sin(f*.68+bank*7.7);
   // Low-contrast moving ripples, tinted by dusk; never a bright white
   // geometry stripe or a flat blue enamel trough.
   vec3 shade = mix(vec3(.20,.41,.40),vec3(.29,.50,.47),small);
   shade += vec3(.24,.18,.11)*thin*(.45+.55*small);
   float edge = smoothstep(.0,.12,bank)*(1.0-smoothstep(.88,1.0,bank));
   diffuseColor.rgb *= shade*(.82+.18*edge);
   `,
  );
 };
 return m;
}
