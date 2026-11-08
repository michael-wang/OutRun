import {DoubleSide,MeshBasicMaterial,type Material} from 'three';
import type {FarmAssets} from './coast-farm';

export function vergeBladeMaterial(time:{value:number}){
 const material=new MeshBasicMaterial({vertexColors:true,side:DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.uniforms.vergeTime=time;
  shader.vertexShader='uniform float vergeTime;\n'+shader.vertexShader
   .replace('#include <color_vertex>',`#include <color_vertex>
    float wild=smoothstep(.35,1.,length(instanceMatrix[1].xyz));
    vColor.rgb*=mix(vec3(.34,.43,.29),vec3(.68,.72,.61),wild);`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 root=modelMatrix*instanceMatrix[3];
   float fade=1.-smoothstep(80.,155.,distance(root.xz,cameraPosition.xz));
   float sway=sin(dot(root.xz,vec2(.17,.09))+vergeTime*1.8);
   transformed.x+=sway*.18*transformed.y*length(instanceMatrix[1].xyz);
   transformed*=fade;`);
 };
 return material;
}

/** A single opaque terrain pass. The macro colour and fine relief are stationary.
 * At grazing angles, read the side profile of a tuft along the view ray to retain
 * the thin, lit tips that a top-down colour map filters away. */
export function shadeMeadowGround(material:Material,assets:FarmAssets){
 const previous=material.onBeforeCompile.bind(material),baseKey=material.customProgramCacheKey();
 const varyings='varying vec3 vMeadowWorld; varying vec2 vMeadowCover; varying vec3 vMeadowNormal;\n';
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.uniforms.meadowTile={value:assets.meadowTile};
  shader.uniforms.meadowTime=assets.time;
  shader.vertexShader=varyings+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vMeadowWorld=(modelMatrix*vec4(position,1.)).xyz;
   vMeadowNormal=mat3(modelMatrix)*normal;
   vMeadowCover=uv;`);
  shader.fragmentShader=varyings+'uniform sampler2D meadowTile; uniform float meadowTime;\n'+
   shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vMeadowCover.x>0.001){
    vec2 p=vMeadowWorld.xz;
    vec2 hillside=texture2D(meadowTile,p/147.).rg;
    float hill=hillside.r;
    vec2 stand=texture2D(meadowTile,mat2(.93,.16,-.22,.98)*p/28.7+vec2(.31,-.27)*hill).rg;
    vec3 turf=mix(vec3(.165,.318,.096),vec3(.39,.44,.161),smoothstep(.25,.76,.55*hill+.45*stand.r));
    turf*=.56+.44*stand.r+.47*stand.g+.29*hillside.g;
    float lawn=vMeadowCover.y;
    turf=mix(turf,vec3(.19,.324,.118)*(.72+.36*stand.g+.22*hill),lawn);
    vec3 eye=cameraPosition-vMeadowWorld;
    float nearCover=1.-smoothstep(75.,155.,dot(abs(eye.xz),vec2(.6,.85)));
    if(nearCover>0.){
     // Intersect one irregular stand of grass along the ray. The fractional
     // depth is in metres and the normal accounts for the local ground slope.
     vec2 axis=vec2(.34,.94);
     float depth=dot(p,axis)/2.25+stand.r*1.6+hill;
     float delta=dot(eye.xz,axis);
     float stepToEye=delta>=0.?1.-fract(depth):fract(depth);
     float travel=stepToEye*2.25/max(abs(delta),1.);
     float elevation=max(0.,dot(normalize(vMeadowNormal),eye));
     float height=travel*elevation;
     float seed=fract((floor(depth)+step(0.,delta))*.618034);
     vec2 hit=p+travel*eye.xz;
     float u=dot(hit,vec2(axis.y,-axis.x))/8.2+seed;
     float stature=mix(.47+.41*stand.r,.14+.07*stand.r,lawn);
     float v=(floor(seed*16.)+clamp(height/stature,.018,.982))/16.;
     // Select mips from continuous coordinates, independent of stand boundaries.
     vec2 crossAxis=vec2(axis.y,-axis.x);
     float invDelta=sign(delta)/max(abs(delta),1.);
     vec2 du=(crossAxis-axis*dot(eye.xz,crossAxis)*invDelta)/8.2;
     float dv=-2.25*elevation*invDelta/(stature*16.);
     float tips=textureGrad(meadowTile,vec2(u,v),
      vec2(dot(dFdx(p),du),dFdx(depth)*dv),vec2(dot(dFdy(p),du),dFdy(depth)*dv)).b;
     float rim=(tips-.502)*smoothstep(.0,.13,stepToEye)*(1.-smoothstep(.86,1.,stepToEye));
     turf+=nearCover*(1.-.45*lawn)*(vec3(.036,.047,.016)+vec3(.66,.65,.28)*(max(rim,0.)+.34*min(rim,0.)));
    }
    float breeze=.018*sin(dot(p,vec2(.062,.029))+hill*8.+meadowTime*1.05);
    diffuseColor.rgb=mix(diffuseColor.rgb,turf*(1.+breeze),vMeadowCover.x);
   }`);
 };
 material.customProgramCacheKey=()=>baseKey+'-meadow-lawns';
 material.needsUpdate=true;
}
