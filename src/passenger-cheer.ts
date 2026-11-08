import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {passengerYoke} from './hero-tailoring';
import {handGeometry} from './hero-hands';

export const CLAP_TIMES=[.62,.94] as const;
export const CHEER_END=1.62;
export type Cheer='applause'|'wave';
const smooth=THREE.MathUtils.smoothstep;
const up=new THREE.Vector3(0,1,0);

const upperLength=.346,foreLength=.359;
const shoulderX=.20,shoulderY=1.173,shoulderZ=-.47;

/** The two halves meet on the sagittal plane. Each shoulder opening shares
 * its perimeter vertices with the arm, so lifting the arm cannot open a seam. */
function shoulderAndArm(side:1|-1){
 const p:number[]=[],index:number[]=[],ids:number[]=[],weights:number[]=[];
 const vertex=(x:number,y:number,z:number,bone:number,other=bone,mix=0)=>{
  p.push(x,y,z);ids.push(bone,other,0,0);weights.push(1-mix,mix,0,0);
  return p.length/3-1;
 };
 const columns=9;
 passengerYoke.forEach(([y,w,d,z],row)=>{
  for(let i=0;i<columns;i++){
   const a=i*Math.PI/(columns-1);
   vertex(side*(w*Math.sin(a)-shoulderX),y-shoulderY,z+d*Math.cos(a)-shoulderZ,3);
   if(!row||!i||(row>=2&&row<=3&&i>=3&&i<=6))continue;
   const n=row*columns+i;
   index.push(n-columns-1,n-columns,n-1,n-columns,n,n-1);
  }
 });
 // Traverse the opening from front to back under the arm, then return over the shoulder.
 const at=(row:number,column:number)=>row*columns+column;
 const rim=[...[2,3,4,5,6].map(i=>at(1,i)),at(2,6),
  ...[6,5,4,3,2].map(i=>at(3,i)),at(2,2)];
 const angles=rim.map(n=>Math.atan2((p[3*n+2]+.015)/.095,(p[3*n+1]-.001)/.060));
 let previous=rim;
 // A rounded deltoid blends from the fixed clavicle into the upper arm.
 // The elbow rings share both joint influences; the hand uses the existing IK.
 for(const [x,yr,zr,bone,other,mix] of [
  [.011,.061,.066,3,0,.42],[.044,.058,.059,3,0,.83],[.091,.050,.052,0,0,0],
  [.185,.045,.047,0,0,0],[upperLength-.038,.040,.042,0,1,.12],
  [upperLength,.042,.043,0,1,.5],[upperLength+.032,.039,.042,0,1,.88],
  [upperLength+.095,.041,.043,1,1,0],[upperLength+.21,.035,.036,1,1,0],
  [upperLength+foreLength,.024,.025,1,1,0]]){
  const ring=angles.map(a=>vertex(side*x,yr*Math.cos(a),zr*Math.sin(a),bone,other,mix));
  for(let i=0;i<ring.length;i++){
   const j=(i+1)%ring.length;index.push(previous[i],previous[j],ring[i],previous[j],ring[j],ring[i]);
  }
  previous=ring;
 }
 if(side<0)for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 g.setIndex(index);g.computeVertexNormals();
 const normal=g.getAttribute('normal'),v=new THREE.Vector3();
 for(let row=0;row<passengerYoke.length;row++)for(const i of [0,columns-1]){
  const n=row*columns+i;v.fromBufferAttribute(normal,n);v.x=0;v.normalize();
  normal.setXYZ(n,0,v.y,v.z);
 }
 return g;
}

export function passengerArm(side:1|-1,skin:THREE.Material){
 const root=new THREE.Group();root.name='passenger-arm-'+side;
 const bones=Array.from({length:4},()=>new THREE.Bone());
 const flesh=shoulderAndArm(side),hand=handGeometry('lap',side===1?-1:1);
 const ids=new Uint16Array(hand.attributes.position.count*4),weights=new Float32Array(ids.length);
 for(let i=0;i<ids.length;i+=4){ids[i]=2;weights[i]=1;}
 hand.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 hand.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const g=mergeGeometries([flesh,hand])!;flesh.dispose();hand.dispose();
 const arm=new THREE.SkinnedMesh(g,skin);arm.castShadow=true;arm.receiveShadow=true;
 bones[1].position.x=side*upperLength;
 root.add(arm);arm.add(...bones);arm.bind(new THREE.Skeleton(bones));
 const xAxis=new THREE.Vector3(),yAxis=new THREE.Vector3(),zAxis=new THREE.Vector3(),basis=new THREE.Matrix4();
 function orient(bone:THREE.Bone,direction:THREE.Vector3){
  xAxis.copy(direction).normalize().multiplyScalar(side);
  yAxis.set(0,0,1).cross(xAxis).normalize();
  zAxis.crossVectors(xAxis,yAxis);
  bone.quaternion.setFromRotationMatrix(basis.makeBasis(xAxis,yAxis,zAxis));
 }
 bones[2].name='passenger-palm-'+side;
 arm.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.12,.10),.75);
 const bounds=arm.boundingBox=new THREE.Box3(),origin=new THREE.Vector3();
 const yokeBounds=new THREE.Box3();
 for(const [y,width,depth,z] of passengerYoke){
  yokeBounds.expandByPoint(new THREE.Vector3(-side*shoulderX,y-shoulderY,z-depth-shoulderZ));
  yokeBounds.expandByPoint(new THREE.Vector3(side*(width-shoulderX),y-shoulderY,z+depth-shoulderZ));
 }
 const elbow=new THREE.Vector3(),wrist=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3();
 const lap=new THREE.Quaternion().setFromEuler(new THREE.Euler(.46,-side*.34,side*.10));
 const palmsIn=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0,0,side),new THREE.Vector3(side,0,0),up));
 let lastTime=NaN,lastGesture:Cheer|undefined;
 const wavePalm=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,.12));
 const roll=new THREE.Quaternion(),forward=new THREE.Vector3(0,0,1);
 const pose=(t:number,cheer:Cheer)=>{
  // The inboard hand stays on her lap throughout the one-handed wave.
  if(cheer==='wave'&&side===1)t=-1;
  if(t<0)cheer='applause'; // Both gestures share the same neutral lap pose.
  if(t===lastTime&&cheer===lastGesture)return;lastTime=t;lastGesture=cheer;
  const raise=smooth(t,0,.48)*(1-smooth(t,1.08,CHEER_END));
  // Swing forward en route from the lap. Both palms face inward by
  // the time they meet, a little above and in front of her crown.
  const arc=Math.sin(raise*Math.PI);
  if(cheer==='wave'){
   const sweep=Math.sin(4*Math.PI*smooth(t,.36,1.19))*raise;
   wrist.set(.08-.28*raise+.10*sweep,-.358+.967*raise,.19-.12*raise+.22*arc);
   bones[2].quaternion.slerpQuaternions(lap,wavePalm,raise)
    .premultiply(roll.setFromAxisAngle(forward,-.44*sweep));
  }else{
   const clap=CLAP_TIMES.reduce((peak,at)=>Math.max(peak,1-smooth(Math.abs(t-at),0,.145)),0);
   wrist.set(side*(-.08+.10*raise-.201*clap),-.358+1.013*raise-.01*clap,.19-.05*raise+.28*arc);
   bones[2].quaternion.slerpQuaternions(lap,palmsIn,raise);
  }
  // Keep the longer limbs the same length on her lap and overhead. The
  // elbows open outward as the wrists clear the head, then relax back down.
  const reach=wrist.length(),along=(reach*reach+upperLength**2-foreLength**2)/(2*reach);
  axis.copy(wrist).divideScalar(reach);
  bend.set(side*(.27+.65*raise),-.55+.39*raise,-.52+.68*raise);
  bend.addScaledVector(axis,-bend.dot(axis)).normalize();
  elbow.copy(axis).multiplyScalar(along).addScaledVector(bend,Math.sqrt(Math.max(0,upperLength**2-along**2)));
  orient(bones[0],elbow);
  bones[1].position.copy(elbow);
  orient(bones[1],axis.subVectors(wrist,elbow));
  bones[2].position.copy(wrist);
  bounds.set(origin,origin).expandByPoint(elbow).expandByPoint(wrist).expandByScalar(.15).union(yokeBounds);
 };
 pose(-1,'applause');
 root.position.set(side*shoulderX,shoulderY,shoulderZ);
 return {root,pose};
}
