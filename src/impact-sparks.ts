import * as THREE from 'three';
export type ContactParticles='metal'|'concrete'|'soft';
/** Fixed pool, a single draw, and a short burst window owned by the contact episode. */
export class ImpactSparks {
 private positions=new Float32Array(96*3);private alpha=new Float32Array(96);private velocity=new Float32Array(96*3);private born=new Float64Array(96).fill(-100);
 private geometry=new THREE.BufferGeometry();private mesh:THREE.Points;private materialKind:ContactParticles='metal';private cursor=0;private time=0;private emission=0;private flash?:THREE.Mesh;private flashBorn=-100;private flashStrength=0;
 constructor(scene:THREE.Scene,private vehicle=false){
  this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));this.geometry.setAttribute('alpha',new THREE.BufferAttribute(this.alpha,1).setUsage(THREE.DynamicDrawUsage));
  this.mesh=new THREE.Points(this.geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:!vehicle,uniforms:{boost:{value:vehicle?1.7:1},tint:{value:new THREE.Color(1,.72,.12)}},blending:THREE.AdditiveBlending,vertexShader:`uniform float boost;attribute float alpha;varying float fade;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=boost*clamp(180./max(1.,-p.z),3.,18.);fade=alpha;}`,fragmentShader:`uniform vec3 tint;varying float fade;void main(){float r=length((gl_PointCoord-.5)*2.);vec2 q=gl_PointCoord-.5;float streak=length(vec2(q.x+q.y,(q.y-q.x)*4.));float a=(1.-smoothstep(.12,.6,streak))*fade;if(a<.01)discard;gl_FragColor=vec4(tint*vec3(1.,mix(.75,1.2,1.-r),.93),a);}`}));this.mesh.name=vehicle?'vehicle-sparks':'rail-sparks';if(vehicle)this.mesh.renderOrder=6;this.mesh.frustumCulled=false;scene.add(this.mesh);
  if(vehicle){this.flash=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{alpha:{value:0},size:{value:1}},vertexShader:'uniform float size;varying vec2 uvFlash;void main(){uvFlash=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);p.xy+=position.xy*size;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform float alpha;varying vec2 uvFlash;void main(){float r=length((uvFlash-.5)*2.);float edge=1.-smoothstep(.0,1.,r);gl_FragColor=vec4(1.,mix(.24,.95,edge),.08,edge*edge*alpha);}' }));this.flash.name='vehicle-impact-flash';this.flash.renderOrder=5;this.flash.frustumCulled=false;this.flash.visible=false;scene.add(this.flash);}
 }
 clear(){this.born.fill(-100);this.alpha.fill(0);this.cursor=this.time=this.emission=0;this.mesh.visible=false;this.flashBorn=-100;if(this.flash)this.flash.visible=false;}
 /** One contact burst: subsequent frames only age the particles, never emit at a stale point. */
 burst(time:number,origin:THREE.Vector3,right:THREE.Vector3,tangent:THREE.Vector3,strength:number,kind:ContactParticles='metal'){
  this.materialKind=kind;
  const tint=(this.mesh.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Color;
  tint.set(kind==='metal'?0xffb52c:kind==='concrete'?0x9b9c93:0x7d807a);
  this.flashBorn=time;this.flashStrength=strength;this.flash?.position.copy(origin);
  const nParticles=kind==='metal'?24+Math.round(48*strength):kind==='concrete'?8+Math.round(16*strength):4+Math.round(10*strength);
  for(let n=0;n<nParticles;n++){const i=this.cursor++%96,a=i*2.399,v=(kind==='metal'?3:1.2)+strength*(kind==='metal'?5:2)+(i%5)*.4;origin.toArray(this.positions,i*3);this.velocity[i*3]=right.x*Math.cos(a)*v-tangent.x*(kind==='metal'?2+i%5:.6+i%3);this.velocity[i*3+1]=.5+Math.abs(Math.sin(a))*(kind==='metal'?2+strength*3:.9+strength);this.velocity[i*3+2]=right.z*Math.cos(a)*v-tangent.z*(kind==='metal'?2+i%5:.6+i%3);this.born[i]=time;}
 }
 update(time:number,origin:THREE.Vector3,right:THREE.Vector3,tangent:THREE.Vector3,strength:number){
  const dt=Math.max(0,Math.min(.1,time-this.time));this.time=time;this.emission+=dt;
  if(!this.vehicle&&strength>0&&this.emission>=.012){this.materialKind='metal';(this.mesh.material as THREE.ShaderMaterial).uniforms.tint.value.set(0xffb52c);this.emission=0;for(let n=0;n<4+Math.round(8*strength);n++){const i=this.cursor++%96,a=(i*2.399),v=2+(i%7)*.8;origin.toArray(this.positions,i*3);this.velocity[i*3]=-right.x*v-tangent.x*(3+i%5);this.velocity[i*3+1]=1.5+Math.sin(a)*2.5;this.velocity[i*3+2]=-right.z*v-tangent.z*(3+i%5);this.born[i]=time;}}
  let count=0;for(let i=0;i<96;i++){const age=time-this.born[i];this.alpha[i]=age<.55?1-age/.55:0;if(this.alpha[i]<=0)continue;count++;for(let k=0;k<3;k++)this.positions[i*3+k]+=this.velocity[i*3+k]*dt;this.velocity[i*3+1]-=9*dt;}
  if(this.flash){const age=time-this.flashBorn;this.flash.visible=age>=0&&age<.12;const uniforms=(this.flash.material as THREE.ShaderMaterial).uniforms;uniforms.alpha.value=(.8+.5*this.flashStrength)*Math.max(0,1-age/.12);uniforms.size.value=(1.1+this.flashStrength)*(1+Math.max(0,age)*3);}
  this.mesh.visible=count>0;this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.alpha.needsUpdate=true;
 }
 inspect(){return {particles:this.alpha.filter(a=>a>0).length,capacity:96,flash:this.flash?.visible??false,material:this.materialKind};}
 dispose(){if(this.flash){this.flash.removeFromParent();this.flash.geometry.dispose();(this.flash.material as THREE.Material).dispose();}this.mesh.removeFromParent();this.geometry.dispose();(this.mesh.material as THREE.Material).dispose();}
}
