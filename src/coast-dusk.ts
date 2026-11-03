import * as THREE from 'three';
import {COAST_LAMPS} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';

export const COAST_SUN=new THREE.Vector3(.66,.085,.75).normalize();
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
 // Only four nearby lamps illuminate geometry; distant fixtures remain emissive instances.
 const positions=COAST_LAMPS.map(d=>{const p=sample(d),v=p.position.clone().addScaledVector(p.right,10);v.y=coastBeachHeight(14,p.position.y,p.right.y,d)+7.1;return v;});
 const lights=Array.from({length:4},()=>{const light=new THREE.PointLight('#ffc981',115,30,2);scene.add(light);return light;});
 return {update(distance:number){
  const first=Math.floor((distance-COAST_LAMPS[0])/64)-1;
  lights.forEach((light,i)=>{const index=first+i;light.intensity=index>=0&&index<positions.length?115:0;if(light.intensity)light.position.copy(positions[index]);});
 }};
}
