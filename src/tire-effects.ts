import * as THREE from 'three';
export interface TireContact {name:string;gap:number|null;surface:number[]|null;normal?:number[];onRoad?:boolean}
const PARTICLES=192,SEGMENTS=768,LIFE=1.35,MARK_LIFE=18;
const CORNERS=[0,1,2,2,1,3],SMOKE_ATTRIBUTES=['center','size','alpha','age','variation'],WHEEL_NAMES=['rear-wheel--1','rear-wheel-1','front-wheel--1','front-wheel-1'];
/** Two fixed buffers, shared across streamed chunks; contacts come from the existing wheel rays. */
export class TireEffects {
 private smokeGeo=new THREE.InstancedBufferGeometry();private markGeo=new THREE.BufferGeometry();
 private ages=new Float32Array(PARTICLES);private smokePos=new Float32Array(PARTICLES*3);private sizes=new Float32Array(PARTICLES);private opacity=new Float32Array(PARTICLES);private variation=new Float32Array(PARTICLES);
 // Separate per-frame contacts from the distance-spaced skid trail anchors.
 private velocity=new Float32Array(PARTICLES*3);private smokePrevious=Array.from({length:4},()=>new THREE.Vector3());
 private born=new Float64Array(PARTICLES).fill(-100);private strength=new Float32Array(PARTICLES);
 private markPos=new Float32Array(SEGMENTS*18);private colors=new Float32Array(SEGMENTS*24);private markBorn=new Float64Array(SEGMENTS).fill(-100);private markStrength=new Float32Array(SEGMENTS);
 private smoke:THREE.Mesh;private marks:THREE.Mesh;private particle=0;private segment=0;private lastTime=0;private emission=0;private slipTime=0;
 private previous=Array.from({length:4},()=>new THREE.Vector3());private previousNormal=Array.from({length:4},()=>new THREE.Vector3(0,1,0));private linked=[false,false,false,false];private emitted=[0,0,0,0];
 private point=new THREE.Vector3();private normal=new THREE.Vector3();private side=new THREE.Vector3();private oldSide=new THREE.Vector3();private delta=new THREE.Vector3();private vertices=Array.from({length:4},()=>new THREE.Vector3());
 constructor(scene:THREE.Scene,private mode:'smoke'|'dust'='smoke'){
  // Camera-facing radial puffs. No world-space stretch: every corner has the same view depth.
  const corners=[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1],vertices:number[]=[],layers:number[]=[];
  for(let layer=0;layer<2;layer++)for(let i=0;i<6;i++){vertices.push(corners[i*2],corners[i*2+1],0);layers.push(layer);}
  this.smokeGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));this.smokeGeo.setAttribute('layer',new THREE.Float32BufferAttribute(layers,1));this.smokeGeo.instanceCount=PARTICLES;
  for(const [name,data,width] of [['center',this.smokePos,3],['size',this.sizes,1],['alpha',this.opacity,1],['age',this.ages,1],['variation',this.variation,1]] as const)this.smokeGeo.setAttribute(name,new THREE.InstancedBufferAttribute(data,width).setUsage(THREE.DynamicDrawUsage));
  this.smoke=new THREE.Mesh(this.smokeGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{puffRadius:{value:mode==='dust'?1.20:.88},tint:{value:mode==='dust'?new THREE.Vector3(.8,.53,.22):new THREE.Vector3(.81,.80,.80)}},vertexShader:`uniform float puffRadius;attribute vec3 center;attribute float size;attribute float alpha;attribute float age;attribute float layer;attribute float variation;varying vec2 smokeUV;varying float opacity;varying float vNoise;
  void main(){
   float haze=layer;
   // Unequal particle size and turbulent phase; no periodic line of identical discs.
   float radius=(.31+(puffRadius-.31)*smoothstep(.06,.55,age))*size*(1.+haze*.11);
   vec3 origin=center+vec3(0.,radius*.35+haze*max(0.,age-.3)*.23,0.);
   vec4 p=modelViewMatrix*vec4(origin,1.);
   float theta=variation*6.283185+age*.8;
   vec2 offset=vec2(position.x*cos(theta)-position.y*sin(theta),position.x*sin(theta)+position.y*cos(theta));
   p.xy+=offset*radius;
   gl_Position=projectionMatrix*p;smokeUV=offset;vNoise=variation;
   opacity=alpha*mix(1.,.33*smoothstep(.08,.5,age),haze);
  }`,fragmentShader:`uniform vec3 tint;varying vec2 smokeUV;varying float opacity;varying float vNoise;void main(){
   float angle=atan(smokeUV.y,smokeUV.x);
   float irregular=.84+.1*sin(angle*3.0+vNoise*6.28318)+.09*cos(angle*5.0-vNoise*9.1);
   float radius=length(smokeUV)/max(.65,irregular);
   float edge=1.-smoothstep(.14,.98,radius);
   float a=edge*edge*opacity*.52;if(a<.003)discard;
   gl_FragColor=vec4(tint,a);
  }`}));
  this.markGeo.setAttribute('position',new THREE.BufferAttribute(this.markPos,3).setUsage(THREE.DynamicDrawUsage));this.markGeo.setAttribute('color',new THREE.BufferAttribute(this.colors,4).setUsage(THREE.DynamicDrawUsage));
  this.marks=new THREE.Mesh(this.markGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  this.smoke.name=mode==='dust'?'tire-dust':'tire-smoke';this.marks.name=mode==='dust'?'dust-unused-marks':'tire-marks';this.smoke.frustumCulled=this.marks.frustumCulled=false;this.smoke.renderOrder=3;this.marks.renderOrder=1;scene.add(this.marks,this.smoke);this.clear();
 }
 /** A subdued smoke color at sunset; leaves off-road dust and daytime smoke alone. */
 setDuskSmoke(enabled:boolean){
  if(this.mode!=='smoke')return;
  const tint=(this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3;
  tint.set(enabled ? .51 : .81, enabled ? .48 : .80, enabled ? .48 : .80);
 }
 /** Terrain-matched dust tint. White coastal sand must not emit canyon-brown puffs. */
 setDustTint(weights:readonly number[]){
  if(this.mode!=='dust')return;
  const w0=weights[0]??0,w1=weights[1]??0,w2=weights[2]??0,total=Math.max(.00001,w0+w1+w2);
  const tint=(this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3;
  tint.set((.95*w0+.80*w1+.86*w2)/total,(.95*w0+.53*w1+.84*w2)/total,(.92*w0+.22*w1+.79*w2)/total);
 }
 clear(time=0){this.born.fill(-100);this.markBorn.fill(-100);this.opacity.fill(0);this.colors.fill(0);this.linked.fill(false);this.emitted.fill(0);this.particle=this.segment=0;this.emission=this.slipTime=0;this.lastTime=time;this.smoke.visible=this.marks.visible=false;}
 update(time:number,speed:number,skidIntensity:number,contacts:TireContact[],scale:number){
  const dt=Math.max(0,Math.min(.1,time-this.lastTime));if(time<this.lastTime)this.clear(time);this.lastTime=time;
  const dust=this.mode==='dust',active=dust?speed>3&&contacts.some(c=>c.onRoad===false&&!!c.surface):skidIntensity>0,amount=THREE.MathUtils.clamp(dust?speed/45:skidIntensity,0,1);
  if(!active&&!this.smoke.visible&&!this.marks.visible){this.linked.fill(false);this.slipTime=this.emission=0;return;}
  this.slipTime=active?this.slipTime+dt:0;this.emission+=active?dt:0;const emit=active&&this.emission>=.016;if(emit)this.emission=0;
  for(let wheel=0;wheel<4;wheel++){
   const c=contacts.find(c=>c.name===WHEEL_NAMES[wheel]);
   if(!active||!c?.surface||(dust?c.onRoad!==false:!c.onRoad)||c.gap===null||Math.abs(c.gap)>.12){this.linked[wheel]=false;continue;}
   this.point.fromArray(c.surface);if(c.normal)this.normal.fromArray(c.normal);else this.normal.set(0,1,0);if(this.normal.y<0)this.normal.negate();this.point.addScaledVector(this.normal,.014);
   this.delta.subVectors(this.point,this.previous[wheel]);const distance=this.delta.length();
    if(emit){
     // Fill the travelled segment, not just the latest wheel position: compact puffs still overlap at arcade speeds.
     const travel=this.point.distanceTo(this.smokePrevious[wheel]),samples=this.linked[wheel]&&travel<12?Math.min(5,Math.max(1,Math.ceil(travel/.82))):1;
     this.delta.subVectors(this.point,this.smokePrevious[wheel]);this.delta.addScaledVector(this.normal,-this.delta.dot(this.normal));const carry=this.linked[wheel]&&dt>0&&travel<12?.25/dt:0;
     for(let n=1;n<=samples;n++){this.emitted[wheel]++;const i=this.particle++%PARTICLES,f=n/samples;for(let axis=0;axis<3;axis++){this.smokePos[i*3+axis]=this.point.getComponent(axis)-(samples>1?this.delta.getComponent(axis)*(1-f):0);this.velocity[i*3+axis]=this.delta.getComponent(axis)*carry;}const random=((Math.imul(this.emitted[wheel],1664525)+Math.imul(wheel+1,1013904223))>>>0)/4294967296;
      this.variation[i]=random;
      // Tiny deterministic offsets break the uniform pellet-chain silhouette.
      this.smokePos[i*3]+=(random-.5)*.22;
      this.smokePos[i*3+2]+=(Math.sin(random*17.7)-.5)*.18;
      this.born[i]=time-dt*(1-f)+(random-.5)*dt*.2;
      this.strength[i]=.30+.58*amount;}
     this.delta.subVectors(this.point,this.previous[wheel]);
    }
   if(!dust&&this.linked[wheel]&&distance>.35&&distance<12){
    this.side.crossVectors(this.delta,this.normal).normalize().multiplyScalar(.23);this.oldSide.crossVectors(this.delta,this.previousNormal[wheel]).normalize().multiplyScalar(.23);
    const v=this.vertices;v[0].copy(this.previous[wheel]).add(this.oldSide);v[1].copy(this.previous[wheel]).sub(this.oldSide);v[2].copy(this.point).add(this.side);v[3].copy(this.point).sub(this.side);
    const index=this.segment++%SEGMENTS;for(let j=0;j<6;j++)v[CORNERS[j]].toArray(this.markPos,index*18+j*3);this.markBorn[index]=time;this.markStrength[index]=Math.sqrt(amount);
   }
   this.smokePrevious[wheel].copy(this.point);if(!this.linked[wheel]||distance>.35){this.previous[wheel].copy(this.point);this.previousNormal[wheel].copy(this.normal);}this.linked[wheel]=true;
  }
  let smokeCount=0,markCount=0;
  for(let i=0;i<PARTICLES;i++){const age=time-this.born[i],alive=age>=0&&age<LIFE;this.ages[i]=Math.max(0,age);this.opacity[i]=alive?.72*this.strength[i]*Math.pow(1-age/LIFE,1.15):0;this.sizes[i]=alive?(.88+age*.45)*(.75+.45*this.variation[i]):0;if(alive){smokeCount++;if(age>0){this.smokePos[i*3]+=this.velocity[i*3]*dt;this.smokePos[i*3+2]+=this.velocity[i*3+2]*dt;this.smokePos[i*3+1]+=this.velocity[i*3+1]*dt;}const drag=Math.exp(-dt*1.5);this.velocity[i*3]*=drag;this.velocity[i*3+2]*=drag;this.velocity[i*3+1]*=drag;this.smokePos[i*3+1]+=dt*Math.max(0,age-.4)*.23;}}
  for(let i=0;i<SEGMENTS;i++){const age=time-this.markBorn[i],alpha=age>=0&&age<MARK_LIFE?.92*this.markStrength[i]*Math.min(1,(MARK_LIFE-age)/4):0;if(alpha>0)markCount++;for(let j=0;j<6;j++){const o=i*24+j*4;this.colors[o]=.018;this.colors[o+1]=.018;this.colors[o+2]=.018;this.colors[o+3]=alpha;}}
  this.smoke.visible=smokeCount>0;this.marks.visible=markCount>0;void scale;
  for(const key of SMOKE_ATTRIBUTES)this.smokeGeo.attributes[key].needsUpdate=true;this.markGeo.attributes.position.needsUpdate=true;this.markGeo.attributes.color.needsUpdate=true;
 }
 inspect(){return {emittedByWheel:[...this.emitted],particles:this.opacity.filter(a=>a>0).length,segments:this.markBorn.filter(t=>this.lastTime-t<MARK_LIFE).length,particleCapacity:PARTICLES,segmentCapacity:SEGMENTS,geometries:2,smokeRadius:(this.smoke.material as THREE.ShaderMaterial).uniforms.puffRadius.value,tint:((this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3).toArray()};}
 dispose(){this.smoke.removeFromParent();this.marks.removeFromParent();this.smokeGeo.dispose();this.markGeo.dispose();(this.smoke.material as THREE.Material).dispose();(this.marks.material as THREE.Material).dispose();}
}
