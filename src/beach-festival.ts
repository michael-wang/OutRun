import * as THREE from 'three';
import {beachCrowdStyle} from './beach-macro';
import {makeBather} from './beach-people';
import {BEACH_ZONES} from './beach-zone-layout';
import {coastBeachX} from './coast-layout';
import {coastBeachHeight,COAST_SEA_LEVEL} from './scenery-cross-section';
import type {createTrack} from './track';

const random=(n:number)=>{const v=Math.sin(n*91.73+17.2)*43758.5453;return v-Math.floor(v);};
type Person={station:number;lateral:number;y:number;scale:number;yaw:number;pose:'stand'|'raised'|'ring'|'swim';water:boolean;ground:number};
const cloth=[0xf66f51,0x22b9cf,0xffda61,0x5264be,0xf1e9d7,0xdf71a1];
/** Reusable poses instanced into site-relative groups; no skeletons or per-person draw calls. */
export function addBeachFestival(parent:THREE.Group,sample:ReturnType<typeof createTrack>['sample'],anchor:number){
 const root=new THREE.Group();root.name='beach-festival';parent.add(root);
 const config=BEACH_ZONES.lively,balanced=beachCrowdStyle()==='balanced',people:Person[]=[],parasolSites:{station:number;lateral:number}[]=[];
 const height=(d:number,x:number)=>{const p=sample(d);return coastBeachHeight(x,p.position.y,p.right.y,d);};
 for(const [z,zone] of BEACH_ZONES.zones.entries()){
  const centre=anchor+zone.forwardM,composition=config.balanced.zones[z];
  const clear=(d:number,x:number)=>balanced&&(
   Math.abs(d-anchor-BEACH_ZONES.entryForwardM)<config.balanced.clearanceM||
   (Math.abs(d-anchor-BEACH_ZONES.lifeguardForwardM)<config.balanced.clearanceM&&x>-48)||
   (Math.abs(d-anchor-BEACH_ZONES.rentalForwardM)<12&&x>-40));
  for(let i=0;i<(balanced?composition.shore:config.shorePerZone);i++){
   const key=z*(balanced?307:123)+i,d=centre+(balanced?composition.shoreOffset:0)+(random(key)-.5)*(balanced?composition.span:config.alongHalfSpanM)*2;
   const waterline=coastBeachX(-26,d),x=balanced?(-27-random(key+513)*Math.max(3,-waterline-35)):(-18-random(key+513)*Math.max(3,-waterline-24)),g=height(d,x),scale=.95+random(key+72)*.23;
   if(g<=COAST_SEA_LEVEL+.3||clear(d,x))continue;
   people.push({station:d,lateral:x,y:g+.94*scale,scale,yaw:random(key+91)*Math.PI*2,pose:i%7===0?'raised':i%11===0?'ring':'stand',water:false,ground:g});
  }
  for(let i=0;i<(balanced?composition.water:config.swimmersPerZone);i++){
   const key=z*97+i,d=centre+(random(key+200)-.5)*170,x=coastBeachX(-26,d)-5-random(key+671)*12,g=height(d,x);
   if(g>COAST_SEA_LEVEL-.5)continue; // Never disguise a dry-ground figure as a swimmer.
   people.push({station:d,lateral:x,y:COAST_SEA_LEVEL,scale:1.15+random(key)*.15,yaw:random(key+80)*Math.PI*2,pose:(['ring','raised','swim'] as const)[i%3],water:true,ground:g});
  }
  for(let i=0;i<(balanced?composition.parasols:config.parasolsPerZone);i++){
   const station=balanced?centre+composition.shoreOffset-50+Math.floor(i/3)*34+random(i+z*47)*14:centre-90+(i%10)*20+random(i+z*47)*5,
    lateral=balanced?-31-(i%3)*11-random(i+32)*5:-23-Math.floor(i/10)*10;
   if(!clear(station,lateral)&&height(station,lateral)>COAST_SEA_LEVEL+.4)parasolSites.push({station,lateral});
  }
 }
 const materials=Array.from({length:3},()=>new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}));
 const matrix=new THREE.Matrix4(),object=new THREE.Object3D(),color=new THREE.Color();
 for(const pose of ['stand','raised','ring','swim'] as const){
  const rows=people.filter(p=>p.pose===pose);if(!rows.length)continue;
  const template=makeBather(pose,materials[0],materials[1],materials[2],true);template.updateMatrixWorld(true);
  for(const [part,child] of template.children.entries()){
   const mesh=child as THREE.Mesh,instances=new THREE.InstancedMesh(mesh.geometry,mesh.material,rows.length);instances.name='festival-'+pose+'-'+part;
   rows.forEach((r,i)=>{const road=sample(r.station);object.position.copy(road.position).addScaledVector(road.right,r.lateral);object.position.y=r.y;object.rotation.set(0,r.yaw,0);object.scale.setScalar(r.scale);object.updateMatrix();matrix.multiplyMatrices(object.matrix,mesh.matrixWorld);instances.setMatrixAt(i,matrix);
    color.setHex(part===0?[0xe4b18a,0xc68660,0xf0c9a3][i%3]:part===1?cloth[i%cloth.length]:[0x573e2a,0xe9d5a5,0x332b29][i%3]);instances.setColorAt(i,color);});
   instances.receiveShadow=true;instances.computeBoundingSphere();root.add(instances);
  }
 }
 // Repeated canopies form readable colour clusters, with breathing gaps and a clear entry.
 const canopy=new THREE.ConeGeometry(2.1,.7,12),pole=new THREE.CylinderGeometry(.055,.065,2.7,6);
 for(const [geo,y] of [[canopy,2.8],[pole,1.35]] as const){const mesh=new THREE.InstancedMesh(geo,materials[1],parasolSites.length);mesh.name='festival-parasols';
  parasolSites.forEach((r,i)=>{const p=sample(r.station);object.position.copy(p.position).addScaledVector(p.right,r.lateral);object.position.y=height(r.station,r.lateral)+y;object.rotation.set(0,i*.47,0);object.scale.setScalar(1);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);mesh.setColorAt(i,color.setHex(y>2?cloth[i%cloth.length]:0xd8c4a0));});mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);}
 root.userData={style:beachCrowdStyle(),shore:people.filter(p=>!p.water).length,water:people.filter(p=>p.water).length,parasols:parasolSites.length,draws:root.children.length,people,update:(_time:number)=>{}};
 return root;
}

/** Two rotating emissive lamp heads and inexpensive translucent light volumes. No shadow pass. */
export function addLighthouseBeacon(tower:THREE.Group){
 const rotor=new THREE.Group();rotor.name='rotating-lighthouse-beacon';rotor.position.y=15.1;tower.add(rotor);
 const glow=new THREE.MeshBasicMaterial({color:0xffefb5,toneMapped:false});
 const haze=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  vertexShader:'varying float fade;void main(){fade=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying float fade;void main(){gl_FragColor=vec4(1.0,.82,.48,.06*fade*fade);}' });
 for(const side of [-1,1]){
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),glow);lens.scale.set(1,1,.55);lens.position.z=side*1.6;rotor.add(lens);
  const beam=new THREE.Mesh(new THREE.ConeGeometry(3.8,44,16,1,true),haze);beam.rotation.x=-side*Math.PI/2;beam.position.z=side*23.6;rotor.add(beam);
 }
 rotor.userData={angle:0,periodSeconds:12,method:'rotating emissive heads plus translucent light volumes, not a dynamic shadow-casting sun',update:(time:number)=>{rotor.rotation.y=(time*Math.PI/6)%(Math.PI*2);rotor.userData.angle=rotor.rotation.y;}};
 return rotor;
}
