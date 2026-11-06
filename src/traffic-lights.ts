import * as THREE from 'three';

/** Dusk visibility only: two lens batches plus one soft halo draw, no dynamic lights. */
export class TrafficLights {
 private lenses:THREE.InstancedMesh[];
 private halo:THREE.Points;
 private pose=new THREE.Object3D();
 private positions:THREE.BufferAttribute;
 private count=0;
 constructor(scene:THREE.Scene,capacity:number){
  this.lenses=['#fff3d1','#ff3026'].map((color,i)=>{
   const m=new THREE.InstancedMesh(new THREE.BoxGeometry(.48,.22,.08),new THREE.MeshBasicMaterial({color,toneMapped:false}),capacity*2);
   m.name=i?'traffic-tail-lights':'traffic-head-lights';m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m;
  });
  const g=new THREE.BufferGeometry();this.positions=new THREE.BufferAttribute(new Float32Array(capacity*4*3),3).setUsage(THREE.DynamicDrawUsage);g.setAttribute('position',this.positions);
  const colors=new Float32Array(capacity*4*3);
  for(let i=0;i<capacity*4;i++)new THREE.Color(i%4<2?'#fff2c7':'#ff2615').toArray(colors,i*3);
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setDrawRange(0,0);
  this.halo=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   // Headlight/tail-light halo shader does not use Three's standard fog;
   // fade its *alpha* into the coastal dusk or it pops up as glowing pixels
   // well before the (now fogged) vehicle model can actually be seen.
   vertexShader:`varying vec3 tint;varying float vLampFade;void main(){tint=color;vec4 world=modelMatrix*vec4(position,1.0);vLampFade=1.0-smoothstep(950.0,1400.0,distance(world.xyz,cameraPosition));vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(300.0/max(1.0,-p.z),2.0,14.0);}`,
   fragmentShader:`varying vec3 tint;varying float vLampFade;void main(){float r=length(gl_PointCoord-.5)*2.0;gl_FragColor=vec4(tint,pow(max(0.0,1.0-r),2.0)*.65*vLampFade);}`,
  }));this.halo.name='traffic-running-light-halos';this.halo.frustumCulled=false;scene.add(this.halo);
 }
 begin(){this.count=0;}
 add(matrix:THREE.Matrix4,width:number,length:number){
  for(let end=0;end<2;end++)for(let side=0;side<2;side++){
   this.pose.position.set((side*2-1)*(width/2-.3),end?.70:.78,(end?-1:1)*(length/2+.09));
   this.pose.rotation.set(0,0,0);this.pose.updateMatrix();this.pose.matrix.premultiply(matrix);
   this.lenses[end].setMatrixAt(this.count*2+side,this.pose.matrix);
   this.positions.setXYZ(this.count*4+end*2+side,this.pose.matrix.elements[12],this.pose.matrix.elements[13],this.pose.matrix.elements[14]);
  }
  this.count++;
 }
 finish(){for(const m of this.lenses){m.count=this.count*2;m.instanceMatrix.needsUpdate=true;}this.halo.geometry.setDrawRange(0,this.count*4);this.positions.needsUpdate=true;}
 reset(){this.begin();this.finish();}
 dispose(){for(const m of [...this.lenses,this.halo]){m.removeFromParent();m.geometry.dispose();(m.material as THREE.Material).dispose();}this.lenses.forEach(m=>m.dispose());}
}
