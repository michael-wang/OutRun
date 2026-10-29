import * as THREE from 'three';
export interface TireContact {name:string;gap:number|null;surface:number[]|null;normal?:number[];onRoad?:boolean}
const PARTICLES=48,SEGMENTS=384,LIFE=.95,MARK_LIFE=7;
const CORNERS=[0,1,2,2,1,3],SMOKE_ATTRIBUTES=['position','size','alpha'],REAR_NAMES=['rear-wheel--1','rear-wheel-1'];
/** Two fixed buffers, shared across streamed chunks; contacts come from the existing wheel rays. */
export class TireEffects {
 private smokeGeo=new THREE.BufferGeometry();private markGeo=new THREE.BufferGeometry();
 private smokePos=new Float32Array(PARTICLES*3);private sizes=new Float32Array(PARTICLES);private opacity=new Float32Array(PARTICLES);
 private velocity=new Float32Array(PARTICLES*3);
 private born=new Float64Array(PARTICLES).fill(-100);private strength=new Float32Array(PARTICLES);
 private markPos=new Float32Array(SEGMENTS*18);private colors=new Float32Array(SEGMENTS*24);private markBorn=new Float64Array(SEGMENTS).fill(-100);
 private smoke:THREE.Points;private marks:THREE.Mesh;private particle=0;private segment=0;private lastTime=0;private emission=0;private slipTime=0;
 private previous=[new THREE.Vector3(),new THREE.Vector3()];private previousNormal=[new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,0)];private linked=[false,false];
 private point=new THREE.Vector3();private normal=new THREE.Vector3();private side=new THREE.Vector3();private oldSide=new THREE.Vector3();private delta=new THREE.Vector3();private vertices=Array.from({length:4},()=>new THREE.Vector3());
 constructor(scene:THREE.Scene){
  this.smokeGeo.setAttribute('position',new THREE.BufferAttribute(this.smokePos,3).setUsage(THREE.DynamicDrawUsage));this.smokeGeo.setAttribute('size',new THREE.BufferAttribute(this.sizes,1).setUsage(THREE.DynamicDrawUsage));this.smokeGeo.setAttribute('alpha',new THREE.BufferAttribute(this.opacity,1).setUsage(THREE.DynamicDrawUsage));
  this.smoke=new THREE.Points(this.smokeGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{scale:{value:200}},vertexShader:`attribute float size;attribute float alpha;uniform float scale;varying float opacity;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*scale/max(1.,-p.z),1.,64.);opacity=alpha;}`,fragmentShader:`varying float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.15,1.,r))*opacity;if(a<.005)discard;gl_FragColor=vec4(.76,.75,.71,a);}`}));
  this.markGeo.setAttribute('position',new THREE.BufferAttribute(this.markPos,3).setUsage(THREE.DynamicDrawUsage));this.markGeo.setAttribute('color',new THREE.BufferAttribute(this.colors,4).setUsage(THREE.DynamicDrawUsage));
  this.marks=new THREE.Mesh(this.markGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  this.smoke.name='tire-smoke';this.marks.name='tire-marks';this.smoke.frustumCulled=this.marks.frustumCulled=false;this.smoke.renderOrder=3;this.marks.renderOrder=1;scene.add(this.marks,this.smoke);this.clear();
 }
 clear(time=0){this.born.fill(-100);this.markBorn.fill(-100);this.opacity.fill(0);this.colors.fill(0);this.linked.fill(false);this.particle=this.segment=0;this.emission=this.slipTime=0;this.lastTime=time;this.smoke.visible=this.marks.visible=false;}
 update(time:number,speed:number,slip:number,drifting:boolean,contacts:TireContact[],scale:number){
  const dt=Math.max(0,Math.min(.1,time-this.lastTime));if(time<this.lastTime)this.clear(time);this.lastTime=time;
  const active=drifting&&slip>.5&&speed>12,amount=THREE.MathUtils.clamp((slip-.4)/.6,0,1)*Math.min(1,speed/45);
  if(!active&&!this.smoke.visible&&!this.marks.visible){this.linked.fill(false);this.slipTime=this.emission=0;return;}
  this.slipTime=active?this.slipTime+dt:0;this.emission+=active?dt:0;const emit=active&&this.emission>=.02;if(emit)this.emission=0;
  for(let wheel=0;wheel<2;wheel++){
   const c=contacts.find(c=>c.name===REAR_NAMES[wheel]);
   if(!active||!c?.surface||!c.onRoad||c.gap===null||Math.abs(c.gap)>.12){this.linked[wheel]=false;continue;}
   this.point.fromArray(c.surface);if(c.normal)this.normal.fromArray(c.normal);else this.normal.set(0,1,0);if(this.normal.y<0)this.normal.negate();this.point.addScaledVector(this.normal,.014);
   this.delta.subVectors(this.point,this.previous[wheel]);const distance=this.delta.length();
   if(emit){const i=this.particle++%PARTICLES;this.smokePos[i*3]=this.point.x;this.smokePos[i*3+1]=this.point.y+.08;this.smokePos[i*3+2]=this.point.z;this.born[i]=time;this.strength[i]=amount;const carry=this.linked[wheel]&&dt>0&&distance<4?.5/dt:0;this.velocity[i*3]=this.delta.x*carry;this.velocity[i*3+2]=this.delta.z*carry;}
   if(this.slipTime>.12&&this.linked[wheel]&&distance>.35&&distance<4){
    this.side.crossVectors(this.delta,this.normal).normalize().multiplyScalar(.16);this.oldSide.crossVectors(this.delta,this.previousNormal[wheel]).normalize().multiplyScalar(.145);
    const v=this.vertices;v[0].copy(this.previous[wheel]).add(this.oldSide);v[1].copy(this.previous[wheel]).sub(this.oldSide);v[2].copy(this.point).add(this.side);v[3].copy(this.point).sub(this.side);
    const index=this.segment++%SEGMENTS;for(let j=0;j<6;j++)v[CORNERS[j]].toArray(this.markPos,index*18+j*3);this.markBorn[index]=time;
   }
   if(!this.linked[wheel]||distance>.35){this.previous[wheel].copy(this.point);this.previousNormal[wheel].copy(this.normal);}this.linked[wheel]=true;
  }
  let smokeCount=0,markCount=0;
  for(let i=0;i<PARTICLES;i++){const age=time-this.born[i],alive=age>=0&&age<LIFE;this.opacity[i]=alive?.4*this.strength[i]*(1-age/LIFE):0;this.sizes[i]=alive?.9+age*1.3:0;if(alive){smokeCount++;if(age>0){this.smokePos[i*3]+=this.velocity[i*3]*dt;this.smokePos[i*3+2]+=this.velocity[i*3+2]*dt;}const drag=Math.exp(-dt*3);this.velocity[i*3]*=drag;this.velocity[i*3+2]*=drag;this.smokePos[i*3+1]+=dt*.5;}}
  for(let i=0;i<SEGMENTS;i++){const age=time-this.markBorn[i],alpha=age>=0&&age<MARK_LIFE?.65*Math.min(1,(MARK_LIFE-age)/2):0;if(alpha>0)markCount++;for(let j=0;j<6;j++){const o=i*24+j*4;this.colors[o]=.065;this.colors[o+1]=.06;this.colors[o+2]=.055;this.colors[o+3]=alpha;}}
  this.smoke.visible=smokeCount>0;this.marks.visible=markCount>0;(this.smoke.material as THREE.ShaderMaterial).uniforms.scale.value=scale;
  for(const key of SMOKE_ATTRIBUTES)this.smokeGeo.attributes[key].needsUpdate=true;this.markGeo.attributes.position.needsUpdate=true;this.markGeo.attributes.color.needsUpdate=true;
 }
 inspect(){return {particles:this.opacity.filter(a=>a>0).length,segments:this.markBorn.filter(t=>this.lastTime-t<MARK_LIFE).length,particleCapacity:PARTICLES,segmentCapacity:SEGMENTS,geometries:2};}
 dispose(){this.smoke.removeFromParent();this.marks.removeFromParent();this.smokeGeo.dispose();this.markGeo.dispose();(this.smoke.material as THREE.Material).dispose();(this.marks.material as THREE.Material).dispose();}
}
