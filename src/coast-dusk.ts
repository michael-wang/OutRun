import * as THREE from 'three';
import {COAST_LAMP_HEAD,COAST_UTILITY_POLES} from './coast-roadside-layout';
import {coastBeachHeight} from './scenery-cross-section';

import {COAST_LAMP_RANGE,registerCoastLamps} from './coast-lamp-lighting';

export const COAST_SUN=new THREE.Vector3(.66,.085,.75).normalize();
// Shared low-sun shadow projection scale for shoreline geometry and ocean rocks.
export const COAST_SHADOW_STRETCH=.70;
/** Shared sky radiance for the coast dome and its water reflection. */
export const COAST_SKY_GLSL=/* glsl */`
float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(skyHash(i),skyHash(i+vec2(1,0)),f.x),mix(skyHash(i+vec2(0,1)),skyHash(i+1.0),f.x),f.y);}
vec3 coastSky(vec3 ray,vec3 sun){
 float y=max(0.0,ray.y),toward=pow(max(dot(normalize(vec3(ray.x,0,ray.z)),normalize(vec3(sun.x,0,sun.z))),0.0),5.0);
 vec3 horizon=mix(vec3(.52,.38,.43),vec3(.98,.57,.27),toward);
 vec3 sky=mix(horizon,vec3(.19,.22,.34),smoothstep(0.0,.78,y));
 sky+=vec3(.32,.13,.035)*pow(max(dot(ray,sun),0.0),55.0);
 vec2 p=vec2(atan(ray.z,ray.x)*3.5,y*24.0);
 float cloud=skyNoise(p)*.62+skyNoise(p*2.1)*.26+skyNoise(p*4.3)*.12;
 float band=smoothstep(.49,.69,cloud)*smoothstep(.025,.12,y)*(1.0-smoothstep(.6,.85,y));
 sky=mix(sky,mix(vec3(.34,.29,.36),vec3(.90,.55,.33),toward*.8+(1.0-y)*.2),band*.74);
 float disc=smoothstep(.99994,.999985,dot(ray,sun));
 return sky+vec3(1.0,.78,.44)*disc;
}`;

export function addCoastDusk(scene:THREE.Scene,sample:(d:number)=>{position:THREE.Vector3;right:THREE.Vector3}){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sun:{value:COAST_SUN}},
  vertexShader:`varying vec3 ray;void main(){ray=position;vec4 p=projectionMatrix*viewMatrix*vec4(position*5000.0+cameraPosition,1.0);gl_Position=p.xyww;}`,
  fragmentShader:`varying vec3 ray;uniform vec3 sun;${COAST_SKY_GLSL}void main(){gl_FragColor=vec4(coastSky(normalize(ray),sun),1.0);}`,
 }));
 sky.name='coast-dusk-sky';sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
 // The emissive head itself belongs to streamed pole geometry. Cache its real
 // position once. The player's car uses the closest physical fixture.
 const poleBases=typeof matchMedia!=='undefined'&&!matchMedia('(pointer:coarse)').matches
  ?new Map<THREE.Vector3,THREE.Vector4>():undefined;
 const fixtures=COAST_UTILITY_POLES.filter(p=>p.lamp).map(p=>{
  const frame=sample(p.d),head=frame.position.clone().addScaledVector(frame.right,p.x-COAST_LAMP_HEAD.reach);
  head.y=coastBeachHeight(p.x,frame.position.y,frame.right.y,p.d)+p.height-COAST_LAMP_HEAD.drop;
  if(poleBases){
   const base=frame.position.clone().addScaledVector(frame.right,p.x);
   poleBases.set(head,new THREE.Vector4(base.x,head.y-p.height+COAST_LAMP_HEAD.drop,base.z,Number(!!p.transformer)));
  }
  return {d:p.d,head};
 });
 const light=new THREE.PointLight(0xffdaa3,220,COAST_LAMP_RANGE);
 light.name='coast-utility-light';scene.add(light);
 const release=registerCoastLamps(scene,fixtures.map(f=>f.head),poleBases);
 const bulbs=fixtures.flatMap(p=>p.head.toArray());
 const haloGeometry=new THREE.BufferGeometry();haloGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bulbs,3));
 const halos=new THREE.Points(haloGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`varying float fade;void main(){vec4 v=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*v;gl_PointSize=clamp(320.0/-v.z,3.0,22.0);fade=1.0-smoothstep(250.0,1450.0,-v.z);}`,
  fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5)*2.0;gl_FragColor=vec4(1.0,.73,.38,(1.0-smoothstep(0.0,1.0,r))*fade*.85);}`,
 }));halos.name='coast-permanent-lamp-glow';scene.add(halos);
 halos.material.addEventListener('dispose',release);
 let next=0;
 function update(distance:number){
  while(next+1<fixtures.length&&distance>(fixtures[next].d+fixtures[next+1].d)*.5)next++;
  while(next>0&&distance<(fixtures[next-1].d+fixtures[next].d)*.5)next--;
  light.position.copy(fixtures[next].head);
 }
 update(0);
 return {update};
}
