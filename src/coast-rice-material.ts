import type {MeshStandardMaterial} from 'three';
import {COAST_SUN} from './coast-dusk';
import {RICE_ROW_PITCH,RICE_HILL_PITCH,RICE_FIRST_HILL} from './coast-rice-layout';

type RiceShader=Parameters<MeshStandardMaterial['onBeforeCompile']>[0];

// Advect the whole gust pattern in metres, so adjacent terraces and both
// representations see the same wind even when a new plot streams in.
const windField=/* glsl */`
 uniform float riceTime;
 uniform vec3 riceSun;
 varying float vEarLight;
 const vec2 windDir=vec2(.9998,.02);
 float riceLean(vec2 p) {
  float along=dot(p,windDir)-riceTime*9.5;
  float across=dot(p,vec2(-windDir.y,windDir.x));
  // Long crests travel across the carriageway. The chase camera can track
  // them across several planted rows while moving quickly along the coast.
  float swirl=sin(across*.025+along*.027)+.55*sin(across*.052-along*.038);
  float front=sin(along*.172+1.5*swirl);
  float ripple=sin(along*.32+.023*across-.9*swirl);
  return .31+.52*front+.18*ripple;
 }
`;

const plantingGrid=/* glsl */`
 vec2 hillCell(vec2 metres) {
  return (metres-${RICE_FIRST_HILL})/vec2(${RICE_ROW_PITCH},${RICE_HILL_PITCH});
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
   vEarLight=smoothstep(.00,.60,facing)*smoothstep(-.09,.20,clearance);
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
 shader.fragmentShader='varying float vEarLight;\n'+(crop?'':plantingGrid)+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
   ${crop?'':`vec2 metres=vMapUv*4.;
    vec2 cell=hillCell(metres),delta=abs(fract(cell+.5)-.5);
    vec2 footprint=fwidth(cell);
    vec2 resolved=1.-smoothstep(vec2(.12),vec2(.52),footprint);
    float furrow=smoothstep(.30,.48,delta.x)*resolved.x+.42*smoothstep(.32,.49,delta.y)*resolved.y;
    float close=1.-smoothstep(65.,130.,length(vViewPosition));
    float cover=vColor.a-(1.-smoothstep(2.6,7.,metres.x))*close-furrow*.83;
    if(cover+.30*sampledDiffuseColor.g<.39) discard;
    diffuseColor.rgb*=1.-.23*furrow;
    // A bowed stand exposes more husks to the low sun above the green leaves.
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.59,.32),vEarLight*.48);`}
   diffuseColor.rgb*=mix(vec3(.65,.76,.68),vec3(1.04,1.05,.96),vEarLight);
  `)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=diffuseColor.rgb*(vec3(.16,.19,.16)+vEarLight*vec3(.29,.25,.17));
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
