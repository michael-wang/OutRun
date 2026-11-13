import * as THREE from 'three';
/** Optional injection: the particle renderer never imports coastal content. */
export type WindSampler=(x:number,z:number,time:number)=>{x:number;z:number};
export interface TireContact {name:string;gap:number|null;surface:number[]|null;normal?:number[];onRoad?:boolean}
const PARTICLES=192,SEGMENTS=768,LIFE=1.35,MARK_LIFE=18;
const CORNERS=[0,1,2,2,1,3],SMOKE_ATTRIBUTES=['center','size','alpha','age','variation','tone','trailSpan'],WHEEL_NAMES=['rear-wheel--1','rear-wheel-1','front-wheel--1','front-wheel-1'];
/** Two fixed buffers, shared across streamed chunks; contacts come from the existing wheel rays. */
export class TireEffects {
 private smokeGeo=new THREE.InstancedBufferGeometry();private markGeo=new THREE.BufferGeometry();
 private ages:Float32Array;private smokePos:Float32Array;private sizes:Float32Array;private opacity:Float32Array;private variation:Float32Array;private tones:Float32Array;
 // Separate per-frame contacts from the distance-spaced skid trail anchors.
 private velocity:Float32Array;private smokePrevious=Array.from({length:4},()=>new THREE.Vector3());
 private born:Float64Array;private strength:Float32Array;
 private trailSpan:Float32Array;private trailDelta=new THREE.Vector3();
 private trailRoot=[new THREE.Vector3(),new THREE.Vector3()];
 private trailLinked=[false,false];private trailTip=[-1,-1];
 private markPos:Float32Array;private colors:Float32Array;private markBorn:Float64Array;private markStrength:Float32Array;
 private wind?:WindSampler;
 // Stable emitter identity: rivals should not all create identical plumes.
 private emitterSeed=0;private emitterTone=0;
 private smoke:THREE.Mesh;private marks:THREE.Mesh;private particle=0;private segment=0;private lastTime=0;private emission=0;private slipTime=0;
 private previous=Array.from({length:4},()=>new THREE.Vector3());private previousNormal=Array.from({length:4},()=>new THREE.Vector3(0,1,0));private linked=[false,false,false,false];private emitted=[0,0,0,0];
 private point=new THREE.Vector3();private normal=new THREE.Vector3();private side=new THREE.Vector3();private oldSide=new THREE.Vector3();private delta=new THREE.Vector3();private vertices=Array.from({length:4},()=>new THREE.Vector3());
 constructor(scene:THREE.Scene,private mode:'smoke'|'dust'='smoke',private shared?:TireEffects){
  this.wind=shared?.wind;
  const particles=shared?48:PARTICLES,segments=shared?96:SEGMENTS;
  this.ages=new Float32Array(particles);
  this.smokePos=new Float32Array(particles*3);
  this.sizes=new Float32Array(particles);
  this.opacity=new Float32Array(particles);
  this.variation=new Float32Array(particles);
  this.tones=new Float32Array(particles);
  this.velocity=new Float32Array(particles*3);
  this.trailSpan=new Float32Array(particles*3);
  this.born=new Float64Array(particles).fill(-100);
  this.strength=new Float32Array(particles);
  this.markPos=new Float32Array(segments*18);
  this.colors=new Float32Array(segments*24);
  this.markBorn=new Float64Array(segments).fill(-100);
  this.markStrength=new Float32Array(segments);
  // Shared quad pair for radial puffs and soft, wheel-aligned drift trails.
  const corners=[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1],vertices:number[]=[],layers:number[]=[];
  for(let layer=0;layer<2;layer++)for(let i=0;i<6;i++){vertices.push(corners[i*2],corners[i*2+1],0);layers.push(layer);}
  this.smokeGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));this.smokeGeo.setAttribute('layer',new THREE.Float32BufferAttribute(layers,1));this.smokeGeo.instanceCount=particles;
  for(const [name,data,width] of [['center',this.smokePos,3],['size',this.sizes,1],['alpha',this.opacity,1],['age',this.ages,1],['variation',this.variation,1],['tone',this.tones,1]] as const)this.smokeGeo.setAttribute(name,new THREE.InstancedBufferAttribute(data,width).setUsage(THREE.DynamicDrawUsage));
  this.smokeGeo.setAttribute('trailSpan',new THREE.InstancedBufferAttribute(this.trailSpan,3).setUsage(THREE.DynamicDrawUsage));
  this.smoke=new THREE.Mesh(this.smokeGeo,shared?.smoke.material??new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{puffRadius:{value:mode==='dust'?1.20:.88},tint:{value:mode==='dust'?new THREE.Vector3(.8,.53,.22):new THREE.Vector3(.81,.80,.80)}},vertexShader:`uniform float puffRadius;attribute vec3 center;attribute float size;attribute float alpha;attribute float age;attribute float layer;attribute float variation;attribute float tone;attribute vec3 trailSpan;varying float trail;varying vec2 smokeUV;varying float opacity;varying float vNoise;varying float vTone;
  void main(){
   float haze=layer;
   // Unequal particle size and turbulent phase; no periodic line of identical discs.
   float radius=(.31+(puffRadius-.31)*smoothstep(.06,.55,age))*size*(1.+haze*.11);
   vec3 origin=center+vec3(0.,radius*.35+haze*max(0.,age-.3)*.23,0.);
   vec4 p=modelViewMatrix*vec4(origin,1.);
   float theta=variation*6.283185+age*.8;
   vec2 offset=vec2(position.x*cos(theta)-position.y*sin(theta),position.x*sin(theta)+position.y*cos(theta));
   p.xy+=offset*radius;
   trail=step(.000001,dot(trailSpan,trailSpan));
   if(trail>.5){
    // Each quad spans two successive positions of ONE tire. Project the
    // actual endpoints so a receding trail keeps its perspective and depth.
    vec4 mid=modelViewMatrix*vec4(center,1.);
    vec3 halfSpan=mat3(modelViewMatrix)*trailSpan*.5;
    vec2 axis=halfSpan.xy-mid.xy*halfSpan.z/min(-.01,mid.z);
    vec2 along=axis/max(.0001,length(axis));
    vec2 across=vec2(-along.y,along.x);
    float width=(.23+.65*smoothstep(0.,1.,age))*(1.+haze*.38);
    p=mid+vec4(position.x*halfSpan*1.15,0.);
    p.xy+=along*position.x*width*.8+across*position.y*width;
    p.y+=width*.64+age*.23;
    offset=position.xy;
   }
   gl_Position=projectionMatrix*p;smokeUV=offset;vNoise=variation;vTone=tone;
   opacity=alpha*mix(1.,.33*smoothstep(.08,.5,age),haze);
  }`,fragmentShader:`uniform vec3 tint;varying float trail;varying vec2 smokeUV;varying float opacity;varying float vNoise;varying float vTone;void main(){
   if(trail>.5){
    float edge=abs(smokeUV.y)+.09*sin(smokeUV.x*4.+vNoise*10.)+.045*sin(smokeUV.x*11.-vNoise*6.);
    float plume=(1.-smoothstep(.18,1.,edge))*(1.-smoothstep(.80,1.,abs(smokeUV.x)));
    float a=plume*opacity;
    if(a<.003)discard;
    gl_FragColor=vec4(mix(tint,vec3(.99,.98,.96),.83)+vTone*.055,a);
    return;
   }
   float angle=atan(smokeUV.y,smokeUV.x);
   // A softly scalloped body and denser core read as individual puffs,
   // unlike a wide uniform translucent disc.
   float scallop=.83+.13*sin(angle*3.0+vNoise*6.28318)+.10*cos(angle*5.0-vNoise*9.1);
   float radius=length(smokeUV)/max(.62,scallop);
   float core=1.-smoothstep(.25,.73,radius);
   float rim=1.-smoothstep(.56,1.03,radius);
   float a=(core*.70+rim*.32)*opacity*.80;if(a<.003)discard;
   // Small per-emitter warm/cool grey variations: still rubber smoke,
   // never car-paint colours or a second smoke material.
   vec3 warmCool=mix(vec3(.93,.99,1.07),vec3(1.08,.98,.90),clamp(.5+vTone,0.,1.));
   vec3 color=clamp(tint*warmCool*(1.08+vTone*.42)+vec3(.07)*core,0.,1.);
   gl_FragColor=vec4(color,a);
  }`}));
  this.markGeo.setAttribute('position',new THREE.BufferAttribute(this.markPos,3).setUsage(THREE.DynamicDrawUsage));this.markGeo.setAttribute('color',new THREE.BufferAttribute(this.colors,4).setUsage(THREE.DynamicDrawUsage));
  this.marks=new THREE.Mesh(this.markGeo,shared?.marks.material??new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  this.smoke.name=mode==='dust'?'tire-dust':'tire-smoke';this.marks.name=mode==='dust'?'dust-unused-marks':'tire-marks';this.smoke.frustumCulled=this.marks.frustumCulled=false;this.smoke.renderOrder=3;this.marks.renderOrder=1;scene.add(this.marks,this.smoke);this.clear();
 }
 /** Emitter identity is deterministic across restarts, and changes only art. */
 setEmitterSeed(seed:number){
  this.emitterSeed=Number.isFinite(seed)?seed|0:0;
  this.emitterTone=Math.sin(this.emitterSeed*2.17+.7)*.33;
 }
 /** Wind only acts on airborne particles, never on skid-mark geometry. */
 setWind(sampler?:WindSampler){this.wind=sampler;}
 /** Smoke follows the current biome. Only the sunset coast uses the
  * approved warm-grey palette; terrain dust has its own separate palette. */
 setSceneSmoke(weights:readonly number[],sunsetCoast=false){
  if(this.mode!=='smoke')return;
  const coast=sunsetCoast?[.51,.48,.48]:[.81,.80,.80];
  const canyon=[.70,.64,.59],city=[.70,.72,.75];
  const w=[Math.max(0,weights[0]??0),Math.max(0,weights[1]??0),Math.max(0,weights[2]??0)];
  const total=Math.max(.0001,w[0]+w[1]+w[2]);
  const tint=(this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3;
  tint.set(
   (coast[0]*w[0]+canyon[0]*w[1]+city[0]*w[2])/total,
   (coast[1]*w[0]+canyon[1]*w[1]+city[1]*w[2])/total,
   (coast[2]*w[0]+canyon[2]*w[1]+city[2]*w[2])/total,
  );
 }
 setDuskSmoke(enabled:boolean){this.setSceneSmoke([1,0,0],enabled);}

 /** Terrain-matched dust tint. White coastal sand must not emit canyon-brown puffs. */
 setDustTint(weights:readonly number[]){
  if(this.mode!=='dust')return;
  const w0=weights[0]??0,w1=weights[1]??0,w2=weights[2]??0,total=Math.max(.00001,w0+w1+w2);
  const tint=(this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3;
  tint.set((.95*w0+.80*w1+.86*w2)/total,(.95*w0+.53*w1+.84*w2)/total,(.92*w0+.22*w1+.79*w2)/total);
 }
 clear(time=0){this.trailLinked.fill(false);this.trailTip.fill(-1);this.trailSpan.fill(0);this.born.fill(-100);this.markBorn.fill(-100);this.opacity.fill(0);this.colors.fill(0);this.linked.fill(false);this.emitted.fill(0);this.particle=this.segment=0;this.emission=this.slipTime=0;this.lastTime=time;this.smoke.visible=this.marks.visible=false;}
 update(time:number,speed:number,skidIntensity:number,contacts:TireContact[],scale:number,rearSlip=0,driftTrail=0){
  const dt=Math.max(0,Math.min(.1,time-this.lastTime));if(time<this.lastTime)this.clear(time);this.lastTime=time;
  const dust=this.mode==='dust',active=dust?speed>3&&contacts.some(c=>c.onRoad===false&&!!c.surface):skidIntensity>0||rearSlip>0;
  if(!active||driftTrail<=0)this.trailLinked.fill(false);
  if(!active&&!this.smoke.visible&&!this.marks.visible){this.linked.fill(false);this.slipTime=this.emission=0;return;}
  // Standing launches previously layered ~60 fully overlapping rear-wheel
  // puffs each second into a flat grey rectangle. Keep a few soft curls.
  const launch=!dust&&speed<7&&rearSlip>.1;
  const interval=launch?.069+(Math.abs(this.emitterSeed)%5)*.008:.016;
  this.slipTime=active?this.slipTime+dt:0;this.emission+=active?dt:0;
  const emit=active&&this.emission>=interval;if(emit)this.emission=0;
  for(let wheel=0;wheel<4;wheel++){
   const amount=THREE.MathUtils.clamp(dust?speed/45:Math.max(skidIntensity,wheel<2?rearSlip:0),0,1);
   const c=contacts.find(c=>c.name===WHEEL_NAMES[wheel]);
   if(!active||amount===0||!c?.surface||(dust?c.onRoad!==false:!c.onRoad)||c.gap===null||Math.abs(c.gap)>.12){this.linked[wheel]=false;if(wheel<2)this.trailLinked[wheel]=false;continue;}
   this.point.fromArray(c.surface);if(c.normal)this.normal.fromArray(c.normal);else this.normal.set(0,1,0);if(this.normal.y<0)this.normal.negate();this.point.addScaledVector(this.normal,.014);
   this.delta.subVectors(this.point,this.previous[wheel]);const distance=this.delta.length();
    if(driftTrail>0&&wheel<2){
     this.emitTrail(wheel,time,driftTrail);
    }else if(emit){
     // Fill the travelled segment, not just the latest wheel position: compact puffs still overlap at arcade speeds.
     const travel=this.point.distanceTo(this.smokePrevious[wheel]),samples=this.linked[wheel]&&travel<12?Math.min(5,Math.max(1,Math.ceil(travel/.82))):1;
     this.delta.subVectors(this.point,this.smokePrevious[wheel]);this.delta.addScaledVector(this.normal,-this.delta.dot(this.normal));const carry=this.linked[wheel]&&dt>0&&travel<12?.25/dt:0;
     for(let n=1;n<=samples;n++){this.emitted[wheel]++;const i=this.particle++%this.born.length,f=n/samples;for(let axis=0;axis<3;axis++){this.smokePos[i*3+axis]=this.point.getComponent(axis)-(samples>1?this.delta.getComponent(axis)*(1-f):0);this.velocity[i*3+axis]=this.delta.getComponent(axis)*carry;}const random=((Math.imul(this.emitted[wheel],1664525)+Math.imul(wheel+1+this.emitterSeed*19,1013904223))>>>0)/4294967296;
      this.trailSpan.fill(0,i*3,i*3+3);this.variation[i]=random;
      this.tones[i]=this.mode==='dust'?0:this.emitterTone+(random-.5)*.19;
      // Tiny deterministic offsets break the uniform pellet-chain silhouette.
      this.smokePos[i*3]+=(random-.5)*.22;
      this.smokePos[i*3+2]+=(Math.sin(random*17.7+this.emitterSeed*.7)-.5)*.18;
      // Initial local curl varies per plume; one shared wind sample still
      // drives the broad world-space drift (never per-particle wind queries).
      this.velocity[i*3]+=(random-.5)*2.6+
       Math.sin(this.emitterSeed*1.43+wheel*.73)*1.05;
      this.velocity[i*3+2]+=Math.sin(random*13.7+this.emitterSeed*.51)*.95+
       Math.cos(this.emitterSeed*1.91+wheel*.61)*.85;
      this.born[i]=time-dt*(1-f)+(random-.5)*dt*.2;
      this.strength[i]=(.30+.58*amount)*(launch?.78:1)*
       (.84+.26*random);}
     this.delta.subVectors(this.point,this.previous[wheel]);
    }
   if(!dust&&this.linked[wheel]&&distance>.35&&distance<12){
    this.side.crossVectors(this.delta,this.normal).normalize().multiplyScalar(.23);this.oldSide.crossVectors(this.delta,this.previousNormal[wheel]).normalize().multiplyScalar(.23);
    const v=this.vertices;v[0].copy(this.previous[wheel]).add(this.oldSide);v[1].copy(this.previous[wheel]).sub(this.oldSide);v[2].copy(this.point).add(this.side);v[3].copy(this.point).sub(this.side);
    const index=this.segment++%this.markBorn.length;for(let j=0;j<6;j++)v[CORNERS[j]].toArray(this.markPos,index*18+j*3);this.markBorn[index]=time;this.markStrength[index]=Math.sqrt(amount);
   }
   this.smokePrevious[wheel].copy(this.point);if(!this.linked[wheel]||distance>.35){this.previous[wheel].copy(this.point);this.previousNormal[wheel].copy(this.normal);}this.linked[wheel]=true;
  }
  // One sample for this emitter, regardless of its fixed particle capacity.
  const anchor=contacts.find(c=>c.surface)?.surface;
  const breeze=this.wind?.(anchor?.[0]??this.smokePrevious[0].x,
   anchor?.[2]??this.smokePrevious[0].z,time);
  // One small, persistent vortex per emitter (not a new weather field).
  // Same prevailing wind, different near-wheel cloud directions.
  const curlX=dust?0:Math.sin(time*2.3+this.emitterSeed*1.73)*1.25;
  const curlZ=dust?0:Math.cos(time*1.9+this.emitterSeed*2.19)*1.15;
  let smokeCount=0,markCount=0;
  for(let i=0;i<this.born.length;i++){
   const age=time-this.born[i],isTrail=this.trailSpan[i*3]!==0||this.trailSpan[i*3+2]!==0;
   const life=isTrail?1.15:LIFE,alive=age>=0&&age<life;
   this.ages[i]=Math.max(0,age);
   this.opacity[i]=alive?(isTrail?1:.72)*this.strength[i]*Math.pow(1-age/life,1.15):0;
   this.sizes[i]=alive?(.86+age*.50)*(.70+.58*this.variation[i]):0;
   if(!alive)continue;
   smokeCount++;
   if(age>0){
    const airborne=Math.min(1,age/.48),response=.55+.88*this.variation[i];
    const vortex=(1-airborne*.55)*(.65+.6*this.variation[i]);
    this.smokePos[i*3]+=(this.velocity[i*3]+(breeze?.x??0)*airborne*response+curlX*vortex)*dt;
    this.smokePos[i*3+2]+=(this.velocity[i*3+2]+(breeze?.z??0)*airborne*response+curlZ*vortex)*dt;
    this.smokePos[i*3+1]+=this.velocity[i*3+1]*dt;
   }
   const drag=Math.exp(-dt*1.5);
   this.velocity[i*3]*=drag;this.velocity[i*3+2]*=drag;this.velocity[i*3+1]*=drag;
   this.smokePos[i*3+1]+=dt*Math.max(0,age-.18)*(dust?.23:.50);
  }
  for(let i=0;i<this.markBorn.length;i++){const age=time-this.markBorn[i],alpha=age>=0&&age<MARK_LIFE?.92*this.markStrength[i]*Math.min(1,(MARK_LIFE-age)/4):0;if(alpha>0)markCount++;for(let j=0;j<6;j++){const o=i*24+j*4;this.colors[o]=.018;this.colors[o+1]=.018;this.colors[o+2]=.018;this.colors[o+3]=alpha;}}
  this.smoke.visible=smokeCount>0;this.marks.visible=markCount>0;void scale;
  for(const key of SMOKE_ATTRIBUTES)this.smokeGeo.attributes[key].needsUpdate=true;this.markGeo.attributes.position.needsUpdate=true;this.markGeo.attributes.color.needsUpdate=true;
 }
 // Keep an unfinished segment attached to the wheel between emission stations.
 // At race speeds the 48-slot pool covers roughly 100m of twin trails.
 private emitTrail(wheel:number,time:number,intensity:number){
  const root=this.trailRoot[wheel];
  if(!this.trailLinked[wheel]||root.distanceToSquared(this.point)>18*18){
   root.copy(this.point);this.trailTip[wheel]=-1;this.trailLinked[wheel]=true;return;
  }
  const span=this.trailDelta.subVectors(this.point,root),length=span.length();
  if(length<.01)return;
  let i=this.trailTip[wheel];
  if(i<0){i=this.particle++%this.born.length;this.trailTip[wheel]=i;}
  span.toArray(this.trailSpan,i*3);
  this.side.copy(root).addScaledVector(span,.5).toArray(this.smokePos,i*3);
  this.velocity.fill(0,i*3,i*3+3);
  this.born[i]=time;this.strength[i]=Math.min(1,intensity)*.96;
  this.variation[i]=.5+.5*Math.sin(i*2.41+this.emitterSeed);this.tones[i]=this.emitterTone;
  if(length>=4.5){root.copy(this.point);this.trailTip[wheel]=-1;this.emitted[wheel]++;}
 }
 inspect(){return {emittedByWheel:[...this.emitted],particles:this.opacity.filter(a=>a>0).length,segments:this.markBorn.filter(t=>this.lastTime-t<MARK_LIFE).length,particleCapacity:this.born.length,segmentCapacity:this.markBorn.length,geometries:2,smokeRadius:(this.smoke.material as THREE.ShaderMaterial).uniforms.puffRadius.value,emitterTone:this.emitterTone,tint:((this.smoke.material as THREE.ShaderMaterial).uniforms.tint.value as THREE.Vector3).toArray()};}
 dispose(){this.smoke.removeFromParent();this.marks.removeFromParent();this.smokeGeo.dispose();this.markGeo.dispose();if(this.shared)return;(this.smoke.material as THREE.Material).dispose();(this.marks.material as THREE.Material).dispose();}
}
