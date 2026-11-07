import type {MeshStandardMaterial} from 'three';
import {COAST_SUN} from './coast-dusk';

type RiceShader=Parameters<MeshStandardMaterial['onBeforeCompile']>[0];

// Advect the whole gust pattern in metres, so adjacent terraces and both
// representations see the same wind even when a new plot streams in.
const windField=/* glsl */`
 uniform float riceTime;
 uniform vec3 riceSun;
 varying float vEarLight;
 const vec2 windDir=vec2(.92,.392);
 float riceLean(vec2 p) {
  float along=dot(p,windDir)-riceTime*3.4;
  float across=dot(p,vec2(-windDir.y,windDir.x));
  float swirl=sin(across*.096+along*.039)+.55*sin(across*.181-along*.051);
  float front=sin(along*.23+1.9*swirl);
  float ripple=sin(along*.47+.11*across-1.6*swirl);
  return .34+.38*front+.18*ripple+.075*sin(along*.68-.19*across+swirl);
 }
`;

export function shadeRipeRice(shader:RiceShader,time:{value:number},crop:boolean){
 Object.assign(shader.uniforms,{riceTime:time,riceSun:{value:COAST_SUN}});
 shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\n${windField}`)
  .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   ${crop?`mat4 riceBasis=modelMatrix*instanceMatrix;
    vec2 riceWorld=(riceBasis*vec4(position,1.)).xz;
    vec2 localWind=vec2(dot(normalize(riceBasis[0].xz),windDir),dot(normalize(riceBasis[2].xz),windDir));`
    :`vec2 riceWorld=(modelMatrix*vec4(position,1.)).xz;
    vec2 localWind=windDir;`}
   float lean=riceLean(riceWorld);
   float h=${crop?'max(position.y,0.)':'mix(.14,.83,color.a)'};
   float angle=lean*${crop?'h/1.30':'1.'};
   float bend=sin(angle), upright=cos(angle);
   // Light scattered by the hulls varies as their orientation changes. Nearby
   // crowns toward the low sun also screen the light in compressed troughs.
   float facing=dot(normalize(vec3(windDir.x*bend,upright,windDir.y*bend)),riceSun);
   float ahead=riceLean(riceWorld+riceSun.xz*2.0);
   float clearance=.83*(cos(lean)-cos(ahead))+2.0*riceSun.y;
   vEarLight=smoothstep(-.10,.78,facing)*smoothstep(-.09,.20,clearance);
   ${crop?`float alongNormal=dot(objectNormal.xz,localWind);
    objectNormal.y=(objectNormal.y-alongNormal*bend)/upright;`
    :`objectNormal.xz+=localWind*bend*sign(objectNormal.y)*.68;`}
  `)
  .replace('#include <begin_vertex>',`#include <begin_vertex>
   ${crop?`// Integrating the tangent anchors roots and preserves stem length.
    float arc=abs(angle)<.001?1.:bend/angle;
    transformed.xz+=localWind*h*tan(.5*angle)*arc;
    transformed.y+=h*(arc-1.);`
    :`transformed.xz+=localWind*h*bend;
    transformed.y+=h*(upright-1.);`}
  `);
 shader.fragmentShader='varying float vEarLight;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
   ${crop?'':'if (vColor.a+.32*sampledDiffuseColor.g<.43) discard;'}
   diffuseColor.rgb*=mix(vec3(.61,.66,.55),vec3(1.10,1.04,.90),vEarLight);
  `)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=diffuseColor.rgb*(vec3(.15,.14,.10)+vEarLight*vec3(.47,.32,.13));
  `);
}
