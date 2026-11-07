import * as THREE from 'three';
import {farmWindGLSL} from './coast-farm-wind';
import type {FarmAssets} from './coast-farm';

function windUniforms(assets:FarmAssets){
 return {farmWind:{value:assets.farmWind},farmTime:assets.time};
}

/** Carry the blade-scale wind into the middle distance on the original terrain.
 * Its mask, baked in UV.x, fades into yards, bare verge and upper hills. */
export function shadeMeadowGround(material:THREE.Material,assets:FarmAssets){
 const previous=material.onBeforeCompile.bind(material),baseKey=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);Object.assign(shader.uniforms,windUniforms(assets));
  const varyings='varying vec2 vMeadowWorld; varying float vMeadowCover;\n';
  shader.vertexShader=varyings+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vMeadowWorld=(modelMatrix*vec4(position,1.)).xz;vMeadowCover=uv.x;`);
  shader.fragmentShader=varyings+farmWindGLSL+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vMeadowCover>.001){
    vec2 gust=farmGust(vMeadowWorld);
    float stand=windNoise(vMeadowWorld/12.).r;
    float nap=windNoise(vMeadowWorld*vec2(1.4,2.6)+gust*.25).g;
    float light=smoothstep(-.62,.76,gust.x+.23*stand);
    vec3 turf=mix(vec3(.16,.245,.080),vec3(.32,.34,.145),light*.75+.125);
    turf*=1.+.15*stand+.07*nap*(1.-smoothstep(95.,225.,length(vViewPosition)));
    diffuseColor.rgb=mix(diffuseColor.rgb,turf,vMeadowCover);
   }`);
 };
 material.customProgramCacheKey=()=>baseKey+'-meadow';
 material.needsUpdate=true;
}

export function meadowBladeMaterial(assets:FarmAssets){
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,vertexColors:true});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,windUniforms(assets));
  shader.vertexShader=farmWindGLSL+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   mat4 basis=modelMatrix*instanceMatrix;
   vec2 root=(basis*vec4(position.x,0.,position.z,1.)).xz;
   vec2 gust=farmGust(root);
   float tip=uv.y,flex=tip*tip*length(basis[1].xyz);
   vec3 push=vec3(.16+.48*gust.x,-.10*abs(gust.x),.22*gust.y)*flex;
   transformed+=vec3(dot(basis[0].xyz,push)/dot(basis[0].xyz,basis[0].xyz),
    dot(basis[1].xyz,push)/dot(basis[1].xyz,basis[1].xyz),dot(basis[2].xyz,push)/dot(basis[2].xyz,basis[2].xyz));
   // Let the distant turf take over before the 100 m batch is culled.
   transformed.y*=1.-smoothstep(105.,188.,length(cameraPosition.xz-root));
   vColor*=mix(.61,.92,tip)*(.92+.23*gust.x);
  `);
 };
 return material;
}
