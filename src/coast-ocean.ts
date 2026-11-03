import * as THREE from 'three';
// The upstream, MIT-licensed simulation is intentionally left untouched.
// @ts-ignore - vendored upstream JavaScript has no TypeScript declarations.
import {OceanSim, defaultOceanParams} from './ultra-water/water/OceanSim.js';

/** Ultra-Water FFT + small coast-only shading adapter. No secondary render pipeline,
 * depth buffer resolves, underwater, caustics, physics or post-processing. */
function polarGrid(segments:number){
 const radii:number[]=[];
 for(let r=.06;r<1;r*=1.23)radii.push(r);
 const q=1+2*Math.PI/segments;
 for(let r=1;r<2400;r*=q)radii.push(r);
 radii.push(6500);
 const vertices=new Float32Array((1+radii.length*segments)*3);
 let v=3;
 for(const radius of radii)for(let a=0;a<segments;a++){
  const angle=2*Math.PI*a/segments;
  vertices[v++]=Math.cos(angle)*radius;
  vertices[v++]=0;
  vertices[v++]=Math.sin(angle)*radius;
 }
 const indices:number[]=[];
 for(let a=0;a<segments;a++)indices.push(0,1+(a+1)%segments,1+a);
 for(let ring=0;ring<radii.length-1;ring++){
  const first=1+ring*segments,next=first+segments;
  for(let a=0;a<segments;a++){
   const b=(a+1)%segments;
   indices.push(first+a,first+b,next+a,first+b,next+b,next+a);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(vertices,3));
 g.setIndex(new THREE.BufferAttribute(new Uint32Array(indices),1));
 return g;
}

const vertex=/* glsl */`
uniform sampler2D uDisp0;
uniform sampler2D uDisp1;
uniform sampler2D uDisp2;
uniform float uSpacing;
out vec3 vWorld;
out float vChurn;
out float vDistance;

void main(){
 vec3 world=(modelMatrix*vec4(position,1.0)).xyz;
 float ring=max(length(position.xz),1.0);
 float spacing=max(0.35,ring*uSpacing);
 float l0=clamp(log2(max(1.0,spacing*256.0/600.0)),0.0,8.0);
 float l1=clamp(log2(max(1.0,spacing*256.0/85.0)),0.0,8.0);
 float l2=clamp(log2(max(1.0,spacing*256.0/12.0)),0.0,8.0);
 vec4 d0=textureLod(uDisp0,world.xz/600.0,l0);
 vec4 d1=textureLod(uDisp1,world.xz/85.0,l1);
 vec4 d2=textureLod(uDisp2,world.xz/12.0,l2);
 float fade=1.0-smoothstep(1300.0,2300.0,ring);
 world+=vec3(d0.xyz+d1.xyz+d2.xyz)*fade;
 vWorld=world;
 vChurn=min(d0.w,min(d1.w,d2.w));
 vDistance=ring;
 gl_Position=projectionMatrix*viewMatrix*vec4(world,1.0);
}`;

const fragment=/* glsl */`
precision highp float;
uniform sampler2D uSlope0;
uniform sampler2D uSlope1;
uniform sampler2D uSlope2;
uniform sampler2D uSlope3;
uniform vec3 uSun;
uniform float uTime;
in vec3 vWorld;
in float vChurn;
in float vDistance;
out vec4 outColor;

float hash12(vec2 p){
 vec3 q=fract(vec3(p.xyx)*0.1031);
 q+=dot(q,q.yzx+33.33);
 return fract((q.x+q.y)*q.z);
}

void main(){
 // FFT slopes from the original four independent wavelength cascades.
 vec2 slope=
   texture(uSlope0,vWorld.xz/600.0).xy+
   texture(uSlope1,vWorld.xz/85.0).xy+
   texture(uSlope2,vWorld.xz/12.0).xy+
   texture(uSlope3,vWorld.xz/2.1).xy*.24;
 vec3 normal=normalize(vec3(-slope.x,1.0,-slope.y));
 vec3 viewDir=normalize(cameraPosition-vWorld);
 vec3 sunDir=normalize(uSun);
 vec3 reflected=reflect(-viewDir,normal);
 float nv=clamp(dot(normal,viewDir),0.0,1.0);
 float fresnel=.025+.975*pow(1.0-nv,5.0);
 // Ocean-body absorption and an open-sky reflection (no costly scene mirror).
 vec3 deep=vec3(.009,.125,.20);
 vec3 shallow=vec3(.012,.29,.38);
 vec3 body=mix(deep,shallow,clamp(normal.y*.78+.1,0.0,1.0));
 vec3 sky=mix(vec3(.52,.77,.88),vec3(.08,.35,.62),clamp(reflected.y*.6+.25,0.0,1.0));
 vec3 color=mix(body,sky,clamp(.20+fresnel*.75,0.0,1.0));
 vec3 halfVec=normalize(viewDir+sunDir);
 float sunGlitter=pow(max(dot(normal,halfVec),0.0),180.0)*max(dot(normal,sunDir),0.0);
 float spark=hash12(floor(vWorld.xz*2.4+uTime*.13));
 sunGlitter*=.65+.7*spark;
 color+=vec3(1.0,.82,.53)*sunGlitter*2.8;
 float foam=(1.0-smoothstep(.48,.93,vChurn))*.67;
 foam*=.82+.18*hash12(floor(vWorld.xz*.9+uTime*.4));
 color=mix(color,vec3(.75,.91,.92),clamp(foam,0.0,.75));
 // The parent game uses a bright coastal horizon; blend distant water into it.
 float fog=1.0-exp(-vDistance*.00038);
 color=mix(color,vec3(.62,.79,.88),clamp(fog,0.0,.94));
 outColor=vec4(color,1.0);
}`;

export class UltraCoastOcean {
 readonly mesh:THREE.Mesh;
 private readonly sim:any;
 private readonly uniforms:Record<string,THREE.IUniform>;
 private pending=0;
 private frames=0;
 private readonly mobile:boolean;
 private readonly renderer:THREE.WebGLRenderer;

 constructor(renderer:THREE.WebGLRenderer,scene:THREE.Scene,level=-5){
  if(!renderer.capabilities.isWebGL2)throw new Error('Ultra-Water experiment requires WebGL2');
  this.renderer=renderer;
  this.mobile=matchMedia('(pointer: coarse)').matches;
  const oceanParams=defaultOceanParams();
  oceanParams.windSpeed=8.5;
  oceanParams.waveScale=.85;
  oceanParams.swellScale=.7;
  this.sim=new OceanSim(renderer,oceanParams);
  this.uniforms={
   uDisp0:{value:null},uDisp1:{value:null},uDisp2:{value:null},
   uSlope0:{value:null},uSlope1:{value:null},uSlope2:{value:null},uSlope3:{value:null},
   uSpacing:{value:2*Math.PI/(this.mobile?128:192)},
   uSun:{value:new THREE.Vector3(.35,.84,-.4).normalize()},
   uTime:{value:0},
  };
  const material=new THREE.ShaderMaterial({
   uniforms:this.uniforms,vertexShader:vertex,fragmentShader:fragment,
   glslVersion:THREE.GLSL3,side:THREE.DoubleSide,depthTest:true,depthWrite:true,
  });
  this.mesh=new THREE.Mesh(polarGrid(this.mobile?128:192),material);
  this.mesh.name='ultra-water-fft-coast';
  this.mesh.position.y=level;
  this.mesh.frustumCulled=false;
  this.mesh.renderOrder=1;
  scene.add(this.mesh);
 }
 update(camera:THREE.Camera,dt:number){
  this.mesh.position.x=camera.position.x;
  this.mesh.position.z=camera.position.z;
  this.pending+=Math.max(0,Math.min(dt,.08));
  // FFT updates at 30Hz on touch screens; full frame rate on desktop.
  if(!this.mobile||(++this.frames%2===0)){
   this.sim.update(Math.max(.001,this.pending));
   this.pending=0;
  }
  for(let i=0;i<3;i++)this.uniforms['uDisp'+i].value=this.sim.displacement[i];
  for(let i=0;i<4;i++)this.uniforms['uSlope'+i].value=this.sim.slope[i];
  this.uniforms.uTime.value=this.sim.time;
  // The FFT writes multiple offscreen targets; gameplay must render to the canvas.
  this.renderer.setRenderTarget(null);
 }
}
