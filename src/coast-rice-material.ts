import type {DataTexture,MeshStandardMaterial} from 'three';
import {farmWindGLSL} from './coast-farm-wind';
import {COAST_SUN} from './coast-dusk';
import {RICE_ROW_PITCH,RICE_HILL_PITCH,RICE_FIRST_HILL} from './coast-rice-layout';

type RiceShader=Parameters<MeshStandardMaterial['onBeforeCompile']>[0];

const plantingGrid=/* glsl */`
 vec2 hillCell(vec2 metres) {
  return (metres-${RICE_FIRST_HILL})/vec2(${RICE_ROW_PITCH},${RICE_HILL_PITCH});
 }
`;

export function shadeRipeRice(shader:RiceShader,time:{value:number},wind:DataTexture,crop:boolean){
 Object.assign(shader.uniforms,{farmTime:time,farmWind:{value:wind},riceSun:{value:COAST_SUN}});
 shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nuniform vec3 riceSun; varying float vEarLight;\n${farmWindGLSL}`)
  .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   ${crop?`mat4 riceBasis=modelMatrix*instanceMatrix;
    vec2 riceWorld=(riceBasis*vec4(position,1.)).xz;`
    :`vec2 riceWorld=(modelMatrix*vec4(position,1.)).xz;`}
   vec2 gust=farmGust(riceWorld),windDir=normalize(vec2(1.,gust.y));
   vec2 localWind=${crop?'vec2(dot(normalize(riceBasis[0].xz),windDir),dot(normalize(riceBasis[2].xz),windDir))':'windDir'};
   float lean=clamp(.29+gust.x,-.76,1.04);
   float h=${crop?'max(position.y,0.)':'mix(.14,.83,smoothstep(.04,.22,color.a))'};
   float angle=lean*${crop?'h/1.30':'1.'};
   float bend=sin(angle), upright=cos(angle);
   // Straw retains diffuse skylight even when a gust turns it away from the sun.
   float facing=dot(normalize(vec3(windDir.x*bend,upright,windDir.y*bend)),riceSun);
   vEarLight=smoothstep(-.24,.77,facing);
   ${crop?`float alongNormal=dot(objectNormal.xz,localWind);
    objectNormal.y=(objectNormal.y-alongNormal*bend)/upright;`
    :`objectNormal.xz+=localWind*bend*sign(objectNormal.y)*.37;`}
  `)
  .replace('#include <begin_vertex>',`#include <begin_vertex>
   ${crop?`// Integrating the tangent anchors roots and preserves stem length.
    float arc=abs(angle)<.001?1.:bend/angle;
    transformed.xz+=localWind*h*tan(.5*angle)*arc;
    transformed.y+=h*(arc-1.);`
    :`transformed.xz+=localWind*h*bend;
    transformed.y+=h*(upright-1.);`}
  `);
 shader.fragmentShader='varying float vEarLight;\n'+(crop?'':plantingGrid)+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
   ${crop?'':`vec2 metres=vMapUv*4.;
    vec2 cell=hillCell(metres),delta=abs(fract(cell+.5)-.5);
    vec2 footprint=fwidth(cell);
    vec2 resolved=1.-smoothstep(vec2(.12),vec2(.52),footprint);
    float furrow=smoothstep(.30,.48,delta.x)*resolved.x+.42*smoothstep(.32,.49,delta.y)*resolved.y;
    float close=1.-smoothstep(65.,130.,length(vViewPosition));
    float cover=mix(smoothstep(.04,.24,vColor.a),smoothstep(.46,.96,vColor.a),close)-furrow*.74;
    if(cover+.30*sampledDiffuseColor.g<.39) discard;
    diffuseColor.rgb*=1.-.15*furrow;
    // A bowed stand exposes more husks to the low sun above the green leaves.
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.59,.32),.10+vEarLight*.16);`}
   diffuseColor.rgb*=mix(vec3(.90,.89,.83),vec3(1.03,1.01,.95),vEarLight);
  `)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=diffuseColor.rgb*(vec3(.30,.28,.22)+vEarLight*vec3(.12,.11,.08));
  `);
}

/** Shallow flooded soil in the existing merged field draw. Only the planted
 * bed reflects the dusk sky; bunds and the scarecrow walkway stay dry. */
export function shadePaddyWater(shader:RiceShader,time:{value:number}){
 Object.assign(shader.uniforms,{riceTime:time,riceSun:{value:COAST_SUN}});
 const varyings='varying vec2 vPaddyAcross; varying vec3 vPaddyWorld;\n';
 shader.vertexShader='attribute vec2 paddyAcross;\n'+varyings+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vPaddyAcross=paddyAcross;vPaddyWorld=(modelMatrix*vec4(position,1.)).xyz;
 `);
 shader.fragmentShader=varyings+'uniform float riceTime; uniform vec3 riceSun;\n'+plantingGrid+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
  if(dot(vPaddyAcross,vPaddyAcross)>.5){
   vec2 p=vPaddyWorld.xz;
   vec3 n=normalize(vec3(.018*sin(p.x*1.7+p.y*.43-riceTime*1.9),1.,.012*sin(p.y*1.1-riceTime)));
   vec3 viewDir=normalize(cameraPosition-vPaddyWorld),ray=reflect(-viewDir,n);
   float grazing=pow(1.-clamp(dot(n,viewDir),0.,1.),4.);
   float sunward=max(0.,dot(ray,riceSun));
   vec3 horizon=mix(vec3(.12,.16,.16),vec3(.54,.32,.21),pow(sunward,5.));
   vec3 sky=mix(horizon,vec3(.20,.29,.38),smoothstep(.03,.58,ray.y));
   vec2 metres=vMapUv*8.,cell=hillCell(metres),delta=fract(cell+.5)-.5;
   float filterWidth=max(fwidth(cell.x),fwidth(cell.y));
   float roots=(1.-smoothstep(.09,.38,length(delta)))*(1.-smoothstep(.12,.52,filterWidth));
   // Intersect the reflected ray with the lower foliage of the planting grid.
   vec2 along=vec2(vPaddyAcross.y,-vPaddyAcross.x);
   vec2 hit=metres+vec2(dot(ray.xz,vPaddyAcross),dot(ray.xz,along))*.40/max(ray.y,.09);
   vec2 clump=fract(hillCell(hit)+.5)-.5;
   float foliage=(1.-smoothstep(.12,.46,length(clump)))*smoothstep(.45,1.,min(hit.x,hit.y));
   foliage=mix(foliage,.35,smoothstep(.14,.50,filterWidth));
   sky=mix(sky,vec3(.045,.089,.048),foliage*.82);
   outgoingLight=mix(vec3(.053,.082,.064),sky,.18+.67*grazing)*(1.-.45*roots)
    +vec3(.22,.14,.07)*pow(sunward,160.)*grazing;
  }
  #include <opaque_fragment>
 `);
}
