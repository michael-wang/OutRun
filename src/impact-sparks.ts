import * as THREE from 'three';
/** Fixed pool, a single draw, and a short burst window owned by the contact episode. */
export class ImpactSparks {
 private positions=new Float32Array(96*3);private alpha=new Float32Array(96);private velocity=new Float32Array(96*3);private born=new Float64Array(96).fill(-100);
 private geometry=new THREE.BufferGeometry();private mesh:THREE.Points;private cursor=0;private time=0;private emission=0;
 constructor(scene:THREE.Scene){
  this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));this.geometry.setAttribute('alpha',new THREE.BufferAttribute(this.alpha,1).setUsage(THREE.DynamicDrawUsage));
  this.mesh=new THREE.Points(this.geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute float alpha;varying float fade;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(180./max(1.,-p.z),3.,18.);fade=alpha;}`,fragmentShader:`varying float fade;void main(){float r=length((gl_PointCoord-.5)*2.);vec2 q=gl_PointCoord-.5;float streak=length(vec2(q.x+q.y,(q.y-q.x)*4.));float a=(1.-smoothstep(.12,.6,streak))*fade;if(a<.01)discard;gl_FragColor=vec4(1.,mix(.4,.95,1.-r),.12,a);}`}));this.mesh.name='rail-sparks';this.mesh.frustumCulled=false;scene.add(this.mesh);
 }
 clear(){this.born.fill(-100);this.alpha.fill(0);this.cursor=this.time=this.emission=0;this.mesh.visible=false;}
 update(time:number,origin:THREE.Vector3,right:THREE.Vector3,tangent:THREE.Vector3,strength:number){
  const dt=Math.max(0,Math.min(.1,time-this.time));this.time=time;this.emission+=dt;
  if(strength>0&&this.emission>=.012){this.emission=0;for(let n=0;n<4+Math.round(8*strength);n++){const i=this.cursor++%96,a=(i*2.399),v=2+(i%7)*.8;origin.toArray(this.positions,i*3);this.velocity[i*3]=-right.x*v-tangent.x*(3+i%5);this.velocity[i*3+1]=1.5+Math.sin(a)*2.5;this.velocity[i*3+2]=-right.z*v-tangent.z*(3+i%5);this.born[i]=time;}}
  let count=0;for(let i=0;i<96;i++){const age=time-this.born[i];this.alpha[i]=age<.55?1-age/.55:0;if(this.alpha[i]<=0)continue;count++;for(let k=0;k<3;k++)this.positions[i*3+k]+=this.velocity[i*3+k]*dt;this.velocity[i*3+1]-=9*dt;}
  this.mesh.visible=count>0;this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.alpha.needsUpdate=true;
 }
 inspect(){return {particles:this.alpha.filter(a=>a>0).length,capacity:96};}
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();(this.mesh.material as THREE.Material).dispose();}
}
