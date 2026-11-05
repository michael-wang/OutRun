import * as THREE from 'three';
import {COAST_LAMPS} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';

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
 // All fixtures and ground pools are fixed, always-on coastal art. No distance gate.
 const poleGeo=new THREE.CylinderGeometry(.055,.085,11.5,8),boxGeo=new THREE.BoxGeometry(1,1,1);
 const poles=new THREE.InstancedMesh(poleGeo,new THREE.MeshStandardMaterial({color:'#454955'}),COAST_LAMPS.length);
 const arms=new THREE.InstancedMesh(boxGeo,new THREE.MeshStandardMaterial({color:'#454955'}),COAST_LAMPS.length);
 const heads=new THREE.InstancedMesh(boxGeo,new THREE.MeshStandardMaterial({color:'#ffe5b6',emissive:'#ffd298',emissiveIntensity:4.0}),COAST_LAMPS.length);
 const dummy=new THREE.Object3D(),positions:number[]=[],uvs:number[]=[],indices:number[]=[],bulbs:number[]=[];
 for(const [index,d] of COAST_LAMPS.entries()){
  const p=sample(d),base=p.position.clone().addScaledVector(p.right,14),ground=coastBeachHeight(14,p.position.y,p.right.y,d);
  const yaw=Math.atan2(p.right.z,-p.right.x);
  dummy.rotation.set(0,yaw,0);dummy.scale.set(1,1,1);dummy.position.set(base.x,ground+5.75,base.z);dummy.updateMatrix();poles.setMatrixAt(index,dummy.matrix);
  const head=p.position.clone().addScaledVector(p.right,12.2);
  dummy.position.set((base.x+head.x)/2,ground+11.5,(base.z+head.z)/2);dummy.scale.set(1.9,.085,.10);dummy.updateMatrix();arms.setMatrixAt(index,dummy.matrix);
  dummy.position.set(head.x,ground+11.43,head.z);dummy.scale.set(.75,.12,.33);dummy.updateMatrix();heads.setMatrixAt(index,dummy.matrix);
  bulbs.push(head.x,ground+11.36,head.z);
  const first=positions.length/3,xs=[-3,0,4,7,7.7,11,15,20,24];
  for(let row=0;row<=16;row++){
   const at=d-18+row*36/16,q=sample(at);
   for(const x of xs){const v=q.position.clone().addScaledVector(q.right,x);v.y=(Math.abs(x)<=7?q.position.y+q.right.y*x:coastBeachHeight(x,q.position.y,q.right.y,at))+.055;positions.push(v.x,v.y,v.z);uvs.push((x-10)/14,(at-d)/18);}
  }
  for(let row=0;row<16;row++)for(let col=0;col<xs.length-1;col++){const a=first+row*xs.length+col,b=a+xs.length;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 for(const mesh of [poles,arms,heads]){mesh.name='coast-permanent-streetlights';mesh.castShadow=true;scene.add(mesh);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 const pool=new THREE.Mesh(geometry,new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  vertexShader:`varying vec2 spot;varying float distanceToEye;void main(){spot=uv;vec4 v=modelViewMatrix*vec4(position,1.0);distanceToEye=-v.z;gl_Position=projectionMatrix*v;}`,
  fragmentShader:`varying vec2 spot;varying float distanceToEye;void main(){float a=exp(-dot(spot,spot)*3.7)*(1.0-smoothstep(.65,1.0,length(spot)))*(1.0-smoothstep(250.0,1450.0,distanceToEye));gl_FragColor=vec4(.95,.57,.22,a*.42);}`,
 }));pool.name='coast-fixed-lamp-pools';scene.add(pool);
 const haloGeometry=new THREE.BufferGeometry();haloGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bulbs,3));
 const halos=new THREE.Points(haloGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`varying float fade;void main(){vec4 v=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*v;gl_PointSize=clamp(320.0/-v.z,3.0,22.0);fade=1.0-smoothstep(250.0,1450.0,-v.z);}`,
  fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5)*2.0;gl_FragColor=vec4(1.0,.73,.38,(1.0-smoothstep(0.0,1.0,r))*fade*.85);}`,
 }));halos.name='coast-permanent-lamp-glow';scene.add(halos);
 return {};
}
