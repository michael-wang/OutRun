import {COAST_SUN,COAST_SKY_GLSL,COAST_SHADOW_STRETCH} from './coast-dusk';
import {COAST_EFFECTS,oceanVisualSettings,coastShadowSettings,type OceanStageEffects} from './content/coast-effects';
import {COAST_ROCKS,coastRockX} from './coast-layout';
import * as THREE from 'three';
import {loadCoastShore,type unpackCoastShore} from './coast-shore-asset';
import {COAST_SEA_LEVEL} from './scenery-cross-section';
import {OceanCadence} from './coast-performance';
import {CoastBoatShadow,BOAT_SHADOW_GLSL} from './coast-boat-shadow';
// MIT-licensed upstream simulation, with configurable FFT size for mobile.
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

const shoreGLSL=/* glsl */`
uniform sampler2D uShore;
uniform vec4 uShoreBounds;
uniform float uTime;
vec4 shoreAt(vec2 xz){return texture(uShore,(xz-uShoreBounds.xy)/uShoreBounds.zw);}
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.0),f.x),f.y);
}
float shorePhase(float d,vec2 xz){return d*.46+uTime*1.4+noise2(xz*.035)*1.7+sin(xz.x*.018+xz.y*.012)*.5;}
float shoreWave(float d,vec2 xz){
 float p=shorePhase(d,xz);
 return (sin(p)+.3*sin(2.0*p-.6))*.32*exp(-max(0.0,d)/38.0)*smoothstep(-2.0,2.0,d);
}
`;
const vertex=/* glsl */`
${shoreGLSL}
uniform sampler2D uDisp0;
uniform sampler2D uDisp1;
uniform sampler2D uDisp2;
uniform float uSpacing;
uniform float uResolution;
out vec3 vWorld;
out float vChurn;
out float vDistance;

void main(){
 vec3 world=(modelMatrix*vec4(position,1.0)).xyz;
 float ring=max(length(position.xz),1.0);
 float spacing=max(0.35,ring*uSpacing);
 float maxLod=log2(uResolution);
 float l0=clamp(log2(max(1.0,spacing*uResolution/600.0)),0.0,maxLod);
 float l1=clamp(log2(max(1.0,spacing*uResolution/85.0)),0.0,maxLod);
 float l2=clamp(log2(max(1.0,spacing*uResolution/12.0)),0.0,maxLod);
 vec4 d0=textureLod(uDisp0,world.xz/600.0,l0);
 vec4 d1=textureLod(uDisp1,world.xz/85.0,l1);
 vec4 d2=textureLod(uDisp2,world.xz/12.0,l2);
 float fade=1.0-smoothstep(1300.0,2300.0,ring);
 vec4 shore=shoreAt(world.xz);
 float nearshore=smoothstep(0.0,55.0,shore.x);
 vec3 disp=d0.xyz+d1.xyz+d2.xyz;
 // Keep deep-water FFT energy offshore. Bounded waves cannot reach the road.
 disp.y=disp.y/(1.0+abs(disp.y)/.9);
 disp.xz=disp.xz/(1.0+length(disp.xz)/1.2);
 world+=disp*fade*nearshore;
 world.y+=shoreWave(shore.x,world.xz);
 vWorld=world;
 vChurn=min(d0.w,min(d1.w,d2.w));
 vDistance=ring;
 gl_Position=projectionMatrix*viewMatrix*vec4(world,1.0);
}`;

const fragment=/* glsl */`
precision highp float;
${COAST_SKY_GLSL}
${shoreGLSL}
${BOAT_SHADOW_GLSL}
uniform sampler2D uSlope0;
uniform sampler2D uSlope1;
uniform sampler2D uSlope2;
uniform sampler2D uSlope3;
uniform vec3 uSun;
uniform vec4 uRocks[10];
uniform float uRockShadowStrength;
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
 vec4 shore=shoreAt(vWorld.xz);
 // Actual coast mask: water never renders through dry sand, asphalt or inland.
 if(shore.x< -1.5||vWorld.y<shore.y+.015)discard;
 float nearshore=smoothstep(0.0,55.0,shore.x);
 float depth=max(0.0,vWorld.y-shore.y);
 // FFT slopes from the original four independent wavelength cascades.
 vec2 slope=
   texture(uSlope0,vWorld.xz/600.0).xy+
   texture(uSlope1,vWorld.xz/85.0).xy+
   texture(uSlope2,vWorld.xz/12.0).xy+
   texture(uSlope3,vWorld.xz/2.1).xy*.24;
 slope*=mix(.12,1.0,nearshore);
 slope+=shore.zw*(cos(shorePhase(shore.x,vWorld.xz))+.6*cos(2.0*shorePhase(shore.x,vWorld.xz)-.6))*.15*exp(-max(0.0,shore.x)/38.0);
 vec3 normal=normalize(vec3(-slope.x,1.0,-slope.y));
 vec3 viewDir=normalize(cameraPosition-vWorld);
 vec3 sunDir=normalize(uSun);
 vec3 reflected=reflect(-viewDir,normal);
 float nv=clamp(dot(normal,viewDir),0.0,1.0);
 float fresnel=.025+.975*pow(1.0-nv,5.0);
 // Ocean-body absorption and an open-sky reflection (no costly scene mirror).
 vec3 deep=vec3(.012,.055,.075);
 vec3 shallow=vec3(.035,.22,.22);
 vec3 shallows=mix(vec3(.28,.25,.16),shallow,smoothstep(0.0,3.8,depth));
 // Analytic shallow-water light pattern (not a refraction/depth render pass).
 if(depth<5.0){
  vec2 p=vWorld.xz*1.35+vec2(sin(uTime*.31),cos(uTime*.27))*.27;
  p+=vec2(noise2(p*.48+uTime*.12),noise2(p*.51-uTime*.1))*.65;
  float light=pow(1.0-abs(sin(p.x+sin(p.y*1.1)) * sin(p.y+sin(p.x*.9))),16.0);
  shallows+=vec3(.12,.19,.12)*light*(1.0-smoothstep(1.0,5.0,depth))*smoothstep(.05,.4,depth);
 }
 vec3 body=mix(shallows,deep,smoothstep(3.0,12.0,depth));
 vec3 sky=coastSky(reflected,sunDir);
 float sunVisibility=boatSunShadow(vWorld);
 vec3 color=mix(body,sky,clamp(.35+fresnel*.60,0.0,1.0));
 color*=mix(.53,1.0,sunVisibility);
 vec3 halfVec=normalize(viewDir+sunDir);
 float sunGlitter=pow(max(dot(normal,halfVec),0.0),95.0)*(.3+max(dot(normal,sunDir),0.0));
 float spark=hash12(floor(vWorld.xz*2.4+uTime*.13));
 sunGlitter*=.65+.7*spark;
 color+=vec3(1.0,.63,.27)*sunGlitter*3.8*sunVisibility;
 float foam=(1.0-smoothstep(.48,.93,vChurn))*.4*nearshore;
 foam*=.82+.18*hash12(floor(vWorld.xz*.9+uTime*.4));
 // Breaking crests advance toward the beach, losing energy on the wet sand.
 float phase=shorePhase(shore.x,vWorld.xz);
 float breakup=noise2(vWorld.xz*.65+vec2(uTime*.14,-uTime*.19));
 float crest=smoothstep(.35,.93,sin(phase)+breakup*.35);
 float trail=smoothstep(-.45,.8,sin(phase-.65))*.28;
 float lace=smoothstep(.22,.72,noise2(vWorld.xz*3.2+uTime*.23));
 float surf=(crest+trail)*(1.0-smoothstep(15.0,42.0,shore.x));
 foam=max(foam,surf*(.4+.6*lace)*(.55+.45*breakup));
 foam=max(foam,(1.0-smoothstep(.03,.34,depth))*(.45+.5*lace));
 // Rock silhouettes shade nearby water in the same shader loop as surf foam.
 // No secondary reflection or GPU render target.
 float rockShadow=0.0;
 // The shared foam loop still runs when the separate rock-shade math is off.
 for(int i=0;i<10;i++){
  vec2 delta=vWorld.xz-uRocks[i].xy;
  float r=uRocks[i].z,dist=length(delta);
  if(dist<r*.52)discard;
  // Match the dry-sand ribbon's rock-height / sunset-elevation projection.
  // Keep this in the existing 10-rock water loop; no extra shadow pass.
  if(uRockShadowStrength>0.5){
   float projectedLength=min(76.0,r*.82*length(uSun.xz)/max(.02,uSun.y)*${COAST_SHADOW_STRETCH.toFixed(2)});
   if(dist<projectedLength+r*1.45){
    vec2 sunsetAway=-normalize(uSun.xz);
   float along=dot(delta,sunsetAway);
   float across=dot(delta,vec2(-sunsetAway.y,sunsetAway.x));
   float contact=(1.0-smoothstep(r*.48,r*1.45,dist))*.64;
   float tail=smoothstep(-r*.30,r*.35,along)
     *(1.0-smoothstep(projectedLength*.72,projectedLength,along))
     *exp(-pow(across/(r*.84+.45),2.0));
   rockShadow=max(rockShadow,max(contact,tail));
   }
  }
  float wash=exp(-pow((dist-r*.85)/1.5,2.0));
  float pulse=.35+.65*pow(.5+.5*sin(uTime*1.4+uRocks[i].w),3.0);
  foam=max(foam,wash*pulse*(.6+.4*lace));
 }
 color=mix(color,vec3(.64,.64,.57),clamp(foam,0.0,.94));
 color*=1.0-uRockShadowStrength*rockShadow*.80;
 // The parent game uses a bright coastal horizon; blend distant water into it.
 float fog=1.0-exp(-vDistance*.00038);
 color=mix(color,vec3(.52,.38,.36),clamp(fog,0.0,.94));
 outColor=vec4(color,1.0);
}`;

export class UltraCoastOcean {
 readonly mesh:THREE.Mesh;
 private readonly sim:any;
 private readonly uniforms:Record<string,THREE.IUniform>;
 private readonly cadence=new OceanCadence(30);
 private updates=0;
 private readonly mobile:boolean;
 private readonly renderer:THREE.WebGLRenderer;
 readonly boatShadow:CoastBoatShadow;

 static async create(renderer:THREE.WebGLRenderer,scene:THREE.Scene,coast:{sample:(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};length:number},onProgress:(p:number)=>void,settings:OceanStageEffects=COAST_EFFECTS.ocean){
  const shore=await loadCoastShore(onProgress);
  try{return new UltraCoastOcean(renderer,scene,coast,shore,COAST_SEA_LEVEL,settings);}
  catch(error){shore.texture.dispose();throw error;}
 }
 private constructor(renderer:THREE.WebGLRenderer,scene:THREE.Scene,coast:{sample:(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};length:number},shore:ReturnType<typeof unpackCoastShore>,level=COAST_SEA_LEVEL,settings:OceanStageEffects=COAST_EFFECTS.ocean){
  if(!renderer.capabilities.isWebGL2)throw new Error('Ultra-Water experiment requires WebGL2');
  this.renderer=renderer;
  this.mobile=matchMedia('(pointer: coarse)').matches;
  this.boatShadow=new CoastBoatShadow(renderer,this.mobile?512:1024);
  // The old ?sunshadow option was overwritten by main.ts at startup.
  this.boatShadow.enabled=coastShadowSettings(COAST_EFFECTS.shadows,this.mobile).boatDepth;
  const visual=oceanVisualSettings(settings,this.mobile);
  const oceanParams=defaultOceanParams();
  oceanParams.windSpeed=visual.windSpeed;
  oceanParams.waveScale=visual.waveScale;
  oceanParams.swellScale=visual.swellScale;
  this.sim=new OceanSim(renderer,oceanParams,{resolution:visual.resolution,anisotropy:this.mobile?1:renderer.capabilities.getMaxAnisotropy()});
  const rockPositions=COAST_ROCKS.map(r=>{
   const p=coast.sample(r.d),v=p.position.clone().addScaledVector(p.right,coastRockX(r));
   return new THREE.Vector4(v.x,v.z,r.r,r.d*.017);
  });
  this.uniforms={
   ...this.boatShadow.uniforms,
   uDisp0:{value:null},uDisp1:{value:null},uDisp2:{value:null},
   uSlope0:{value:null},uSlope1:{value:null},uSlope2:{value:null},uSlope3:{value:null},
   uSpacing:{value:2*Math.PI/(this.mobile?128:192)},
   uResolution:{value:this.sim.resolution},
   uSun:{value:COAST_SUN.clone()},
   uRockShadowStrength:{value:this.boatShadow.enabled?1:0},
   uTime:{value:0},uRocks:{value:rockPositions},
   uShore:{value:shore.texture},uShoreBounds:{value:shore.bounds},
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
  // A single small point batch for local spray; illustrative wave impacts, no fluid solver.
  const sprayPositions:number[]=[],seeds:number[]=[];
  for(const [i,r] of rockPositions.entries())for(let j=0;j<32;j++){
   sprayPositions.push(r.x,level+.12,r.y);seeds.push((j+.5)/32,r.z,r.w,i*.73+j*2.39996);
  }
  const sprayGeometry=new THREE.BufferGeometry();
  sprayGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sprayPositions,3));
  sprayGeometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,4));
  const sprayMaterial=new THREE.ShaderMaterial({
   uniforms:{uTime:this.uniforms.uTime},transparent:true,depthWrite:false,
   vertexShader:`
    uniform float uTime;attribute vec4 seed;varying float alpha;
    void main(){
     float cycle=fract((uTime*1.4+seed.z)/6.28318+seed.x*.17);
     float t=clamp(cycle/.33,0.0,1.0),angle=seed.w;
     vec3 p=position;
     p.xz+=vec2(cos(angle),sin(angle))*(seed.y*.86+t*1.6);
     p.y+=sin(t*3.14159)*(1.4+seed.x*1.8);
     vec4 mv=modelViewMatrix*vec4(p,1.0);
     gl_Position=projectionMatrix*mv;
     gl_PointSize=clamp(190.0/(-mv.z),1.0,9.0);
     alpha=sin(t*3.14159)*.65*(1.0-smoothstep(150.0,450.0,-mv.z));
    }`,
   fragmentShader:`varying float alpha;void main(){float a=alpha*(1.0-smoothstep(.12,.5,length(gl_PointCoord-.5)));gl_FragColor=vec4(.88,.96,.96,a);}`,
  });
  const spray=new THREE.Points(sprayGeometry,sprayMaterial);spray.name='coast-rock-spray';spray.frustumCulled=false;scene.add(spray);
 }
 dispose(){
  this.boatShadow.dispose();
  // Release the upstream simulator's owned targets/materials; its fullscreen
  // triangle is shared and must remain alive for a later replay.
  for(const rt of [this.sim.h0RT,this.sim.ping,this.sim.pong,...this.sim.out.flat()])rt.dispose();
  for(const m of [this.sim.initMat,this.sim.evolveMat,this.sim.fftMat,this.sim.assembleMat])m.dispose();
 }
 setRockSunShadows(enabled:boolean){this.uniforms.uRockShadowStrength.value=enabled?1:0;}
 get stats(){return {resolution:this.sim.resolution,simulationHz:this.mobile?30:'display',updates:this.updates,boatShadow:this.boatShadow.stats,rockSunShadows:this.uniforms.uRockShadowStrength.value>.5};}
 /** Read-only bindings for decorative hulls/contact patches; simulation stays here. */
 get boatSurfaceUniforms():Readonly<Record<string,THREE.IUniform>>{return this.uniforms;}
 update(camera:THREE.Camera,dt:number){
  this.mesh.position.x=camera.position.x;
  this.mesh.position.z=camera.position.z;
  const delta=Math.max(0,Math.min(dt,.08));
  // A 120Hz phone must not double FFT workload. Advance by actual elapsed time.
  const step=this.mobile?this.cadence.step(delta):delta;
  if(step!==null){
   this.sim.update(step);this.updates++;
  }
  for(let i=0;i<3;i++)this.uniforms['uDisp'+i].value=this.sim.displacement[i];
  for(let i=0;i<4;i++)this.uniforms['uSlope'+i].value=this.sim.slope[i];
  this.uniforms.uTime.value=this.sim.time;
  // The FFT writes multiple offscreen targets; gameplay must render to the canvas.
  this.renderer.setRenderTarget(null);
 }
}
