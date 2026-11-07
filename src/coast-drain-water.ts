import * as THREE from 'three';
import {COAST_SKY_GLSL,COAST_SUN} from './coast-dusk';
import {buildCoastCanalReflectionTexture,COAST_CANAL_REFLECT_LENGTH} from './coast-canal-reflections';

/** Reverse flow: increasing time moves crests toward decreasing road metres. */
export const COAST_DRAIN_FLOW_METRES_PER_SECOND=4.8;
export type CoastFlowClock={value:number};
export type CoastCanalFftUniforms={uSlope0:THREE.IUniform;uSlope1:THREE.IUniform;uSlope2:THREE.IUniform;uSlope3:THREE.IUniform};

/** Share the existing Ultra-Water ocean FFT, not a second renderer.
 * Same live ocean slope maps and dusk-sky reflections, with a subtle
 * non-periodic upstream current. The former high-frequency sine, bright
 * cyan specular ribbon and bank foam made repeating water-cell patterns.
 * A 7.5m worker-grid cannot resolve sub-metre vertex crests; we keep its
 * geometry still and move the small wave detail into fragment normals.
 * If Ultra-Water has not loaded, irregular analytic eddies remain visible. */
export function makeCoastDrainWaterMaterial(
 clock:CoastFlowClock,
 fft:CoastCanalFftUniforms={uSlope0:{value:null},uSlope1:{value:null},uSlope2:{value:null},uSlope3:{value:null}},
 fftEnabled:THREE.IUniform={value:0},
){
 const m=new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,fog:true,depthWrite:true,toneMapped:true});
 const reflectedProps=buildCoastCanalReflectionTexture();
 m.userData.coastCanalReflectionTexture=reflectedProps;
 m.name='coast-ocean-reflected-canal';
 m.customProgramCacheKey=()=> 'coast-reflective-canal-ocean-fft-r7-local-reflections';
 m.onBeforeCompile=shader=>{
  shader.uniforms.uCoastFlowTime=clock;
  shader.uniforms.uCoastSun={value:COAST_SUN};
  shader.uniforms.uCoastFftEnabled=fftEnabled;
  shader.uniforms.uCoastReflectedProps={value:reflectedProps};
  for(const key of ['uSlope0','uSlope1','uSlope2','uSlope3'] as const)
   shader.uniforms['uCoast'+key.slice(1)]=fft[key];
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
varying vec2 vCoastFlowUV;
varying vec3 vCoastWaterWorld;
uniform float uCoastFlowTime;`).replace('#include <begin_vertex>',`#include <begin_vertex>
vCoastFlowUV=uv;
// Worker grid is 7.5m apart: avoid undersampled centimetre waves.
 // Use actual FFT normals in the fragment shader instead of jagged mesh sine.
vec4 canalWorld=vec4(transformed,1.0);
#ifdef USE_INSTANCING
canalWorld=instanceMatrix*canalWorld;
#endif
vCoastWaterWorld=(modelMatrix*canalWorld).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 vCoastFlowUV;
varying vec3 vCoastWaterWorld;
uniform float uCoastFlowTime;
uniform float uCoastFftEnabled;
uniform sampler2D uCoastSlope0;
uniform sampler2D uCoastSlope1;
uniform sampler2D uCoastSlope2;
uniform sampler2D uCoastSlope3;
uniform vec3 uCoastSun;
uniform sampler2D uCoastReflectedProps;
${COAST_SKY_GLSL}`).replace('#include <color_fragment>',`#include <color_fragment>
float f=vCoastFlowUV.y + uCoastFlowTime*${COAST_DRAIN_FLOW_METRES_PER_SECOND.toFixed(1)};
// Reuse the ocean's LIVE four-cascade FFT slope maps and dusk sky.
vec2 worldXZ=vCoastWaterWorld.xz;
vec2 fftSlope=vec2(0.0);
if(uCoastFftEnabled>.5){
 fftSlope=texture2D(uCoastSlope0,worldXZ/600.0).xy*.04
  +texture2D(uCoastSlope1,worldXZ/85.0).xy*.13
  +texture2D(uCoastSlope2,worldXZ/12.0).xy*.38
  +texture2D(uCoastSlope3,worldXZ/2.1).xy*.17;
}
// f is absolute route metres plus upstream current: irregular smooth noise
// replaces two fixed-frequency repeating sine waves and round tiled ripples.
float current1=skyNoise(vec2(f*.11,vCoastFlowUV.x*1.73+2.1));
float current2=skyNoise(vec2(f*.21+13.4,vCoastFlowUV.x*2.07+7.6));
vec2 eddy=(vec2(current1,current2)-.5)*.055;
vec3 normal=normalize(vec3(-fftSlope.x-eddy.x,1.0,-fftSlope.y-eddy.y));
vec3 viewDir=normalize(cameraPosition-vCoastWaterWorld);
vec3 sun=normalize(uCoastSun);
vec3 reflected=reflect(-viewDir,normal);
float nv=clamp(dot(normal,viewDir),0.0,1.0);
float fresnel=.025+.975*pow(1.0-nv,5.0);
float bank=min(vCoastFlowUV.x,1.0-vCoastFlowUV.x);
vec3 deep=vec3(.016,.067,.079);
vec3 shallow=vec3(.068,.123,.108);
vec3 body=mix(deep,shallow,.58+.15*current1);
body*=1.0-.08*(1.0-smoothstep(0.0,.10,bank));
// The sky is reflected exactly like the acclaimed ocean: no cyan glint tiles.
vec3 sky=coastSky(reflected,sun);
vec3 color=mix(body,sky,clamp(.44+fresnel*.45,0.0,.89));
vec3 halfway=normalize(viewDir+sun);
float sunGlitter=pow(max(dot(normal,halfway),0.0),95.0)
 *(0.3+max(dot(normal,sun),0.0));
color+=vec3(1.0,.63,.27)*sunGlitter*1.8;
// Soft, local silhouettes only where genuine roadside fixtures exist.
// FFT and irregular current disrupt the outline and keep the ocean's
// reflection as the main character, not a new tiled procedural pattern.
// Real reflected poles stretch behind the fixture and should be legible
// from the chase camera, even within a narrow 1.7m channel. Genuine ocean
// FFT slopes and advected noise distort the silhouette, without adding SSR.
float featureWarp=clamp(fftSlope.y*1.20+eddy.y*9.0,-4.0,4.0);
float acrossShift=(vCoastFlowUV.x-.60)*1.35;
float featureAt=clamp((vCoastFlowUV.y+featureWarp+acrossShift)/${COAST_CANAL_REFLECT_LENGTH.toFixed(1)},0.0,1.0);
vec2 sceneReflect=texture2D(uCoastReflectedProps,vec2(featureAt,.5)).rg;
float bankView=.30+.70*smoothstep(.08,.93,vCoastFlowUV.x);
float waviness=.72+.28*skyNoise(vec2(vCoastFlowUV.y*.38+uCoastFlowTime*.25,vCoastFlowUV.x*8.5));
float reflectedPole=sceneReflect.r*(.48+.09*current1)*bankView*waviness;
float reflectedBridge=sceneReflect.g*(.33+.08*current2)*(.72+.28*bankView)*waviness;
float localReflection=clamp(reflectedPole+reflectedBridge,0.0,.60);
color=mix(color,vec3(.045,.057,.060),localReflection);
// Subtle golden lamp reflection, locked to the original authored poles.
float lampGlint=pow(sceneReflect.r,6.0)*(.07+.025*current2)*bankView;
color+=vec3(.80,.47,.22)*lampGlint;
// No oversized foam stripes, repeated caustic circles or luminous cyan ribbon.
diffuseColor.rgb=color;`);
 };
 return m;
}
