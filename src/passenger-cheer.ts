import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {handGeometry} from './hero-hands';

export const CLAP_TIMES=[.62,.94] as const;
export const CHEER_END=1.62;
const smooth=THREE.MathUtils.smoothstep;
const up=new THREE.Vector3(0,1,0);

/** One skin-material draw for a complete arm. Three rigid bone weights
 * keep the elbow, wrist and palm connected through the overhead gesture. */
export function passengerArm(side:1|-1,skin:THREE.Material){
 const root=new THREE.Group();root.name='passenger-arm-'+side;
 const bones=[new THREE.Bone(),new THREE.Bone(),new THREE.Bone()];
 const upperLength=.346,foreLength=.359;
 const upper=new THREE.CylinderGeometry(.049,.058,1,7).translate(0,.5,0);
 const shoulder=new THREE.SphereGeometry(1,8,5).scale(.060,.061/upperLength,.064);
 const lower=new THREE.CylinderGeometry(.030,.044,1,7).translate(0,.5,0);
 const elbowCap=new THREE.SphereGeometry(1,6,4).scale(.047,.047/foreLength,.047);
 const parts=[upper,shoulder,lower,elbowCap,handGeometry('lap',side===1?-1:1)];
 parts.forEach((g,i)=>{
  g.deleteAttribute('uv');
  const n=g.getAttribute('position').count,ids=new Uint16Array(n*4),weights=new Float32Array(n*4);
  const bone=[0,0,1,1,2][i];
  for(let j=0;j<n;j++){ids[j*4]=bone;weights[j*4]=1;}
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 });
 const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());
 const arm=new THREE.SkinnedMesh(g,skin);arm.castShadow=true;arm.receiveShadow=true;
 root.add(arm);arm.add(...bones);arm.bind(new THREE.Skeleton(bones));
 bones[2].name='passenger-palm-'+side;
 arm.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.12,.10),.75);
 const bounds=arm.boundingBox=new THREE.Box3(),origin=new THREE.Vector3();
 const elbow=new THREE.Vector3(),wrist=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3();
 const lap=new THREE.Quaternion().setFromEuler(new THREE.Euler(.46,-side*.34,side*.10));
 const palmsIn=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0,0,side),new THREE.Vector3(side,0,0),up));
 let lastTime=NaN;
 const pose=(t:number)=>{
  if(t===lastTime)return;lastTime=t;
  const raise=smooth(t,0,.48)*(1-smooth(t,1.08,CHEER_END));
  const clap=CLAP_TIMES.reduce((peak,at)=>Math.max(peak,1-smooth(Math.abs(t-at),0,.145)),0);
  // Swing forward en route from the lap. Both palms face inward by
  // the time they meet, a little above and in front of her crown.
  const arc=Math.sin(raise*Math.PI);
  wrist.set(side*(-.08+.10*raise-.201*clap),-.358+1.013*raise-.01*clap,.19-.05*raise+.28*arc);
  // Keep the longer limbs the same length on her lap and overhead. The
  // elbows open outward as the wrists clear the head, then relax back down.
  const reach=wrist.length(),along=(reach*reach+upperLength**2-foreLength**2)/(2*reach);
  axis.copy(wrist).divideScalar(reach);
  bend.set(side*(.27+.65*raise),-.55+.39*raise,-.52+.68*raise);
  bend.addScaledVector(axis,-bend.dot(axis)).normalize();
  elbow.copy(axis).multiplyScalar(along).addScaledVector(bend,Math.sqrt(Math.max(0,upperLength**2-along**2)));
  bones[0].scale.y=upperLength;bones[0].quaternion.setFromUnitVectors(up,axis.copy(elbow).normalize());
  bones[1].position.copy(elbow);bones[1].scale.y=foreLength;
  bones[1].quaternion.setFromUnitVectors(up,axis.subVectors(wrist,elbow).normalize());
  bones[2].position.copy(wrist);bones[2].quaternion.slerpQuaternions(lap,palmsIn,raise);
  bounds.set(origin,origin).expandByPoint(elbow).expandByPoint(wrist).expandByScalar(.15);
 };
 pose(-1);
 return {root,pose};
}
