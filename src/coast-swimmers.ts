import * as THREE from 'three';
import {COAST_MARKET_BEACHES,coastBeachX} from './coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from './scenery-cross-section';

type BeachSample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};

/** Each swim area has one culled draw. Body parts and marker buoys share a
 * low-poly sphere. The whole stroke follows the same breaker as the water. */
export function addCoastSwimmers(scene:THREE.Scene,sample:BeachSample,
 uniforms:Record<string,THREE.IUniform>,shoreGLSL:string){
 const material=new THREE.ShaderMaterial({
  uniforms,vertexShader:`
   ${shoreGLSL}
   attribute vec3 lane;
   attribute float piece;
   varying vec3 tint;
   void main(){
    vec2 along=lane.xy,across=vec2(-along.y,along.x);
    float lap=uTime*.14+lane.z,stroke=uTime*3.4+lane.z;
    vec2 direction=normalize(along*cos(lap)*4.5-across*sin(lap)*1.4);
    vec2 side=vec2(-direction.y,direction.x);
    vec3 origin=instanceMatrix[3].xyz;
    if(piece<4.5)origin.xz+=along*sin(lap)*4.5+across*cos(lap)*1.4;
    vec3 local=mat3(instanceMatrix)*position;
    if(piece==1.0||piece==2.0)local.z+=.61;
    if(piece==3.0||piece==4.0){
     float arm=stroke+(piece==4.0?3.14159:0.0);
     local.x+=(piece==4.0?.32:-.32);
     local.y+=.32*sin(arm)+local.z*sin(arm);
     local.z=local.z*cos(arm)+.33*cos(arm);
    }
    origin.y+=shoreWave(shoreAt(origin.xz).x,origin.xz);
    vec3 p=origin+vec3(0.0,local.y,0.0);
    p.xz+=local.z*direction+local.x*side;
    tint=instanceColor*(.78+.22*normal.y);
    gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
   }`,
  fragmentShader:`varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`,
 });
 for(const centre of COAST_MARKET_BEACHES){
  const geometry=new THREE.SphereGeometry(1,8,6);
  const lanes:number[]=[],pieces:number[]=[];
  const count=8*5+5,mesh=new THREE.InstancedMesh(geometry,material,count);
  const matrix=new THREE.Matrix4(),color=new THREE.Color();
  function part(d:number,offshore:number,phase:number,type:number,height:number,
   width:number,rise:number,length:number,paint:string){
   const frame=sample(d),p=frame.position.clone().addScaledVector(frame.right,coastBeachX(COAST_SHORE_OFFSET,d)-offshore);
   matrix.makeScale(width,rise,length).setPosition(p.x,COAST_SEA_LEVEL+height,p.z);
   mesh.setMatrixAt(pieces.length,matrix);mesh.setColorAt(pieces.length,color.set(paint));
   pieces.push(type);lanes.push(-frame.right.z,frame.right.x,phase);
  }
  for(let i=0;i<8;i++){
   const d=centre-110+i*13,depth=8+(i%3)*3,phase=i*2.4;
   const skin=i%2?'#b97953':'#e1ab83',cap=i%2?'#ffd643':'#ee723e';
   part(d,depth,phase,0,.09,.28,.19,.63,i%3?'#26959d':'#c94c47');
   part(d,depth,phase,1,.19,.18,.20,.22,skin);
   part(d,depth,phase,2,.32,.19,.12,.21,cap);
   for(const arm of [3,4])part(d,depth,phase,arm,.17,.085,.09,.29,skin);
  }
  for(let i=0;i<5;i++)part(centre-125+i*32,23,i,5,.24,.46,.52,.46,'#ff823c');
  geometry.setAttribute('lane',new THREE.InstancedBufferAttribute(new Float32Array(lanes),3));
  geometry.setAttribute('piece',new THREE.InstancedBufferAttribute(new Float32Array(pieces),1));
  mesh.computeBoundingSphere();mesh.boundingSphere!.radius+=6;
  mesh.name='coast-swim-area';scene.add(mesh);
 }
}
