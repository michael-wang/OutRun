import * as THREE from 'three';

/** Cool morning sky and warm low sun, without changing terrain or chase optics. */
export const CANYON_DAWN_SUN=new THREE.Vector3(-.58,.23,.78).normalize();
export function addCanyonDawn(scene:THREE.Scene){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sun:{value:CANYON_DAWN_SUN}},
  vertexShader:`varying vec3 ray;void main(){ray=position;vec4 p=projectionMatrix*viewMatrix*vec4(position*5000.0+cameraPosition,1.0);gl_Position=p.xyww;}`,
  fragmentShader:`varying vec3 ray;uniform vec3 sun;void main(){vec3 r=normalize(ray);float y=max(0.0,r.y),s=max(0.0,dot(r,sun));vec3 c=mix(vec3(.80,.67,.60),vec3(.27,.48,.69),smoothstep(0.0,.65,y));c+=vec3(.19,.10,.035)*pow(s,24.0);c+=vec3(1.0,.85,.62)*smoothstep(.9998,.99996,s);gl_FragColor=vec4(c,1.0);}`,
 }));sky.name='canyon-dawn-sky';sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
}
