// A shared street finish for the arcade, the transit court and the public garden.
// Spatial coordinates use metres and the sun/shadow map stays shared with the race.
import {districtAt} from './districts.mjs';
export const districtFinish={begin:-160,end:7490,fade:65};
export const localKinds=new Set(['walk','plinth','trim','canopy','curb','metal','green']);
export function finishWeight(d){return districtAt(d).wear;}
const declarations=`
varying vec3 quarterMetres;
varying vec3 quarterNormal;
varying float quarterAmount;
float jointLine(float coordinate,float width){
 float aa=max(fwidth(coordinate),.002),u=abs(fract(coordinate+.5)-.5);
 return (1.-smoothstep(width,width+aa,u))*(1.-smoothstep(.20,.48,aa));
}
float noiseCell(vec2 q){
 vec2 p=floor(q),f=fract(q);f=f*f*(3.-2.*f);
 vec4 i=vec4(0.,1.,53.,54.)+p.x+p.y*53.;
 vec4 h=fract(sin(mod(i,813.)*19.123)*4531.73);
 return mix(mix(h.x,h.y,f.x),mix(h.z,h.w,f.x),f.y);
}`;
function finishShader(shader,part){
 const floor=part==='walk'||part==='curb'||part==='path';
 const green=part==='green'||part==='lawn';
 const roof=part==='canopy'||part==='metal';
 const surface=floor?`
 vec2 tiles=q/vec2(.68,.36);tiles.x+=.5*mod(floor(tiles.y),2.);
 float joints=max(jointLine(tiles.x,.013),jointLine(tiles.y,.017));
 vec3 stone=mix(vec3(.86,.80,.72),vec3(1.11,1.02,.88),noiseCell(floor(tiles)*.53));
 vec3 finish=stone*(1.-.40*joints)*(.94+.10*grain);`
 :green?`
 float stripes=.5+.5*sin(dot(q,vec2(.32,.13))+.55*noiseCell(q*.12));
 vec3 finish=mix(vec3(.60,.72,.48),vec3(.89,1.04,.66),.54*stripes+.46*noiseCell(q*.39))*(.96+.07*grain);`
 :roof?`
 float seam=jointLine(q.y/.48,.032);
 vec3 finish=mix(vec3(.68,.82,.83),vec3(.93,.99,.98),noiseCell(q*.12))*(1.-.27*seam);
 finish*=mix(.70,1.,smoothstep(-.85,.32,quarterNormal.y));`
 :`
 vec2 stone=q/vec2(1.15,.48);stone.x+=.5*mod(floor(stone.y),2.);
 vec3 finish=mix(vec3(.90,.83,.73),vec3(1.05,1.01,.92),noiseCell(floor(stone)*.21))*(1.-.22*max(jointLine(stone.x,.008),jointLine(stone.y,.014)));
 finish*=mix(.72,1.,smoothstep(-.80,.33,quarterNormal.y));`;
 shader.fragmentShader=declarations+'\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 q=abs(quarterNormal.y)>.65?quarterMetres.xz:vec2(abs(quarterNormal.x)>.5?quarterMetres.z:quarterMetres.x,quarterMetres.y);
 float grain=noiseCell(q*10.)*(1.-smoothstep(.035,.26,max(fwidth(q.x),fwidth(q.y))));
 ${surface}
 diffuseColor.rgb*=mix(vec3(1.),finish,quarterAmount);`);
}
export function quarterMaterial(base,kind,ground=false){
 const m=base.clone();m.roughness=kind==='canopy'?.64:.94;
 m.onBeforeCompile=sh=>{
  sh.vertexShader=(ground?'attribute float stationFade;':'attribute float lotFade;')+'varying vec3 quarterMetres;varying vec3 quarterNormal;varying float quarterAmount;\n'+sh.vertexShader.replace('#include <begin_vertex>',ground?`#include <begin_vertex>
 quarterMetres=position;quarterNormal=vec3(0,1,0);quarterAmount=stationFade;`:`#include <begin_vertex>
 vec3 dim=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
 quarterMetres=position*dim+vec3(0.,dim.y*.5,0.);quarterNormal=normal;quarterAmount=lotFade;`);
  finishShader(sh,kind);
 };
 m.customProgramCacheKey=()=>kind+(ground?'ground':'lot');return m;
}
