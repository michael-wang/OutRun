import * as THREE from 'three';
import {COAST_SKY_GLSL,COAST_SUN} from './coast-dusk';

/** Reverse flow: increasing time moves crests toward decreasing road metres. */
export const COAST_DRAIN_FLOW_METRES_PER_SECOND=4.8;
export type CoastFlowClock={value:number};
export type CoastCanalFftUniforms={uSlope0:THREE.IUniform;uSlope1:THREE.IUniform;uSlope2:THREE.IUniform;uSlope3:THREE.IUniform};

/** One shared Ultra-Water FFT simulation with the ocean, not a second FFT
 * renderer. The same live slope textures and sunset sky are sampled here,
 * with an independent narrow-channel upstream current over the riverbed.
 * The ripples remain usable without the ocean's FFT textures. */
export function makeCoastDrainWaterMaterial(
 clock:CoastFlowClock,
 fft:CoastCanalFftUniforms={uSlope0:{value:null},uSlope1:{value:null},uSlope2:{value:null},uSlope3:{value:null}},
 fftEnabled:THREE.IUniform={value:0},
){
 const m=new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,fog:true,depthWrite:true,toneMapped:true});
 m.name='coast-ultra-water-fed-canal';
 m.customProgramCacheKey=()=> 'coast-flowing-water-ultra-fft-r4';
 m.onBeforeCompile=shader=>{
  shader.uniforms.uCoastFlowTime=clock;
  shader.uniforms.uCoastSun={value:COAST_SUN};
  shader.uniforms.uCoastFftEnabled=fftEnabled;
  for(const key of ['uSlope0','uSlope1','uSlope2','uSlope3'] as const)
   shader.uniforms['uCoast'+key.slice(1)]=fft[key];
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
varying vec2 vCoastFlowUV;
varying vec3 vCoastWaterWorld;
uniform float uCoastFlowTime;`).replace('#include <begin_vertex>',`#include <begin_vertex>
vCoastFlowUV=uv;
float flowPhase=uv.y+uCoastFlowTime*${COAST_DRAIN_FLOW_METRES_PER_SECOND.toFixed(1)};
transformed.y+=sin(flowPhase*1.58+uv.x*4.4)*.035+sin(flowPhase*2.83-uv.x*9.0)*.014;
vCoastWaterWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`);
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
${COAST_SKY_GLSL}`).replace('#include <color_fragment>',`#include <color_fragment>
float f=vCoastFlowUV.y + uCoastFlowTime*${COAST_DRAIN_FLOW_METRES_PER_SECOND.toFixed(1)};
float bank=vCoastFlowUV.x;
vec2 fftSlope=vec2(0.0);
if(uCoastFftEnabled>.5){
 fftSlope=texture2D(uCoastSlope0,vCoastWaterWorld.xz/600.0).xy*.09
  +texture2D(uCoastSlope1,vCoastWaterWorld.xz/85.0).xy*.20
  +texture2D(uCoastSlope2,vCoastWaterWorld.xz/12.0).xy*.43
  +texture2D(uCoastSlope3,vCoastWaterWorld.xz/2.1).xy*.18;
}
float longWave=sin(f*2.4+bank*8.1+sin(f*.31)*.9);
float littleWave=sin(f*4.35-bank*14.2+sin(f*.72)*.6);
vec2 ripple=vec2(cos(f*2.4+bank*8.1),sin(f*4.35-bank*14.2))*.12;
vec3 normal=normalize(vec3(-fftSlope.x+ripple.x,1.0,-fftSlope.y+ripple.y));
vec3 viewDir=normalize(cameraPosition-vCoastWaterWorld);
vec3 sun=normalize(uCoastSun);
vec3 reflected=reflect(-viewDir,normal);
float fresnel=.035+.965*pow(1.0-clamp(dot(normal,viewDir),0.0,1.0),5.0);
vec3 bed=vec3(.10,.20,.17)+vec3(.04,.06,.04)*(.5+.5*longWave);
vec3 body=mix(bed,vec3(.022,.115,.135),.72);
vec3 sky=coastSky(reflected,sun);
vec3 color=mix(body,sky,clamp(.25+fresnel*.70,0.0,.95));
vec3 halfway=normalize(viewDir+sun);
float glint=pow(max(dot(normal,halfway),0.0),85.0)*(.65+.35*(.5+.5*littleWave));
color+=vec3(1.0,.65,.31)*glint*3.7;
// Low bank eddies, not an opaque glowing cyan stripe.
float bankFoam=1.0-smoothstep(.0,.10,min(bank,1.0-bank));
float fleck=pow(max(0.0,longWave*.7+littleWave*.3),8.0);
diffuseColor.rgb=mix(color,vec3(.56,.61,.52),bankFoam*fleck*.20);`);
 };
 return m;
}
