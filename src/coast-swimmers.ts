import {beach2,BEACH2} from './beach2-profile';
import {BEACH2_COVE_PARTIES} from './beach2-composition-layout';
import {floatGLSL} from './coast-water-surface';
import * as THREE from 'three';
import {COAST_MARKET_BEACHES,coastBeachX} from './coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET} from './scenery-cross-section';

type BeachSample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3};

/** Each swim area has one culled draw. Body parts and marker buoys share a
 * low-poly sphere. The whole stroke follows the same breaker as the water. */
export function addCoastSwimmers(scene:THREE.Scene,sample:BeachSample,
 uniforms:Record<string,THREE.IUniform>){
 const material=new THREE.ShaderMaterial({
  uniforms,vertexShader:`
   ${floatGLSL}
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
    origin+=floatDelta(origin.xz);
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
 type Lane={station:number;offshore:number;phase:number;lift:number};
 function addArea(strokes:Lane[],markers:number[],name:string){
  const geometry=new THREE.SphereGeometry(1,8,6);
  const lanes:number[]=[],pieces:number[]=[];
  const count=strokes.length*5+markers.length,mesh=new THREE.InstancedMesh(geometry,material,count);
  const matrix=new THREE.Matrix4(),color=new THREE.Color();
  function part(d:number,offshore:number,phase:number,type:number,height:number,
   width:number,rise:number,length:number,paint:string){
   const frame=sample(d),p=frame.position.clone().addScaledVector(frame.right,coastBeachX(COAST_SHORE_OFFSET,d)-offshore);
   matrix.makeScale(width,rise,length).setPosition(p.x,COAST_SEA_LEVEL+height,p.z);
   mesh.setMatrixAt(pieces.length,matrix);mesh.setColorAt(pieces.length,color.set(paint));
   pieces.push(type);lanes.push(-frame.right.z,frame.right.x,phase);
  }
  for(const [i,{station:d,offshore,phase,lift}] of strokes.entries()){
   const skin=i%2?'#b97953':'#e1ab83',cap=i%2?'#ffd643':'#ee723e';
   part(d,offshore,phase,0,.09+lift,.28,.19,.63,i%3?'#26959d':'#c94c47');
   part(d,offshore,phase,1,.19+lift,.18,.20,.22,skin);
   part(d,offshore,phase,2,.32+lift,.19,.12,.21,cap);
   for(const arm of [3,4])part(d,offshore,phase,arm,.17+lift,.085,.09,.29,skin);
  }
  for(const [i,d] of markers.entries())part(d,23,i,5,.24,.46,.52,.46,'#ff823c');
  geometry.setAttribute('lane',new THREE.InstancedBufferAttribute(new Float32Array(lanes),3));
  geometry.setAttribute('piece',new THREE.InstancedBufferAttribute(new Float32Array(pieces),1));
  mesh.computeBoundingSphere();mesh.boundingSphere!.radius+=6;
  mesh.name=name;scene.add(mesh);
 }
 for(const centre of COAST_MARKET_BEACHES){
  const markers=Array.from({length:5},(_,i)=>centre-125+i*32);
  if(beach2()&&centre===BEACH2.core+BEACH2.tower){
   // Beach 2 has no marked swim lane at the cape after the swimmers move to the cove.
   const strokes:Lane[]=[];
   for(const party of BEACH2_COVE_PARTIES)for(const [s,offshore,activity] of party){
    if(activity==='stroke')strokes.push({station:BEACH2.core+s,offshore,phase:1.1+strokes.length*2.4,lift:.075});
   }
   addArea(strokes,[],'cove-crawl-lanes');
  }else{
   const strokes=Array.from({length:8},(_,i)=>({station:centre-110+i*13,offshore:8+(i%3)*3,phase:i*2.4,lift:0}));
   addArea(strokes,markers,'coast-swim-area');
  }
 }
}
