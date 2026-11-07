import * as THREE from 'three';
import type {FarmAssets} from './coast-farm';
import {MOBILE_MEADOW_COVER} from './coast-performance';

// The same advected field moves the geometry and the light on the terrain.
// The expensive combination of wind scales lives in the tile, as on the sea.
const meadowWindGLSL=`
 uniform sampler2D meadowTile;
 uniform float meadowTime;
 vec4 meadowField(vec2 p){
  vec2 field=vec2(p.x+.24*p.y,p.y-.19*p.x)-meadowTime*vec2(8.6,2.1);
  return texture2D(meadowTile,field/vec2(112.,86.));
 }
`;
function windUniforms(assets:FarmAssets){
 return {meadowTile:{value:assets.meadowTile},meadowTime:assets.time};
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
  shader.fragmentShader=varyings+meadowWindGLSL+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vMeadowCover>.001){
    vec4 field=meadowField(vMeadowWorld);
    vec2 gust=field.rg*2.-1.;
    vec2 pile=texture2D(meadowTile,vMeadowWorld/4.6+gust*.038).ba;
    float light=smoothstep(-.52,.64,gust.x+.24*gust.y);
    vec3 turf=mix(vec3(.15,.24,.076),vec3(.34,.38,.16),.13+.74*light);
    // The same combed marks at metre scale break up the distant hillside.
    turf*=.58+.54*pile.x+.19*pile.y+.16*field.b;
    diffuseColor.rgb=mix(diffuseColor.rgb,turf,vMeadowCover);
   }`);
 };
 material.customProgramCacheKey=()=>baseKey+'-meadow';
 material.needsUpdate=true;
}

export function meadowBladeMaterial(assets:FarmAssets,layer:'cover'|'detail',mobile:boolean){
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,vertexColors:true});
 const fade=layer==='detail'?'78.,150.':mobile?`${MOBILE_MEADOW_COVER.fadeStart}.,${MOBILE_MEADOW_COVER.fadeEnd}.`:'650.,980.';
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,windUniforms(assets));
  shader.vertexShader=meadowWindGLSL+shader.vertexShader.replace('#include <project_vertex>',`
   vec4 patchCenter=modelMatrix*instanceMatrix[3];
   float range=length(cameraPosition.xz-patchCenter.xz);
   transformed.xz-=normal.xz*smoothstep(${fade},range);
   vec4 blade=modelMatrix*(instanceMatrix*vec4(transformed,1.));
   float tip=uv.y,light=.94;
   if(tip>0.){
    vec2 gust=meadowField(blade.xz).rg*2.-1.;
    float flex=tip*tip*length(instanceMatrix[1].xyz);
    blade.xyz+=vec3(.17+.59*gust.x,-.12*abs(gust.x),.35*gust.y)*flex;
    light+=.24*gust.x;
   }
   vColor*=mix(.66,.97,tip)*light*(1.-.28*smoothstep(90.,280.,range));
   vec4 mvPosition=viewMatrix*blade;
   gl_Position=projectionMatrix*mvPosition;
  `);
 };
 material.customProgramCacheKey=()=>`meadow-blades-${fade}`;
 return material;
}
