import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Section=[x:number,y:number,z:number,width:number,depth:number];
/** Wrist at the origin, fingers forward. Each digit has its own knuckle,
 * tapered tip and curl; all five share the palm's mesh and material. */
export function handGeometry(pose:'grip'|'door'|'lap',side:1|-1){
 const position:number[]=[],index:number[]=[];
 function sweep(rows:Section[],sides:number){
  const base=position.length/3;
  for(let i=0;i<rows.length;i++){
   const [x,y,z,w,h]=rows[i],a=rows[Math.max(0,i-1)],b=rows[Math.min(rows.length-1,i+1)];
   const dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dy,dz)||1;
   for(let k=0;k<sides;k++){
    const angle=k*2*Math.PI/sides,thickness=h*Math.sin(angle);
    position.push(side*(x+w*Math.cos(angle)),y+thickness*dz/length,z-thickness*dy/length);
    const here=base+i*sides+k,next=base+i*sides+(k+1)%sides;
    if(i>0)index.push(here-sides,next-sides,here,next-sides,next,here);
   }
  }
  const end=base+(rows.length-1)*sides;
  // The starting ring is buried in the wrist or palm.
  for(let k=1;k<sides-1;k++)index.push(end,end+k,end+k+1);
 }
 const gripping=pose==='grip',rise=gripping?.022:0;
 sweep([[0,0,-.014,.026,.016],[0,.004,.020,.040,.020],
  [0,rise,.064,.046,.019],[0,rise,.077,.041,.013]],8);
 for(let i=0;i<4;i++){
  const x=.033-i*.022,w=.0105-i*.0006;
  const reach=[.063,.069,.061,.049][i];
  const knuckle:Section=[x,rise,.065,w,w];
  if(gripping){
   sweep([knuckle,[x,.023,.095,w,w],[x,.011,.111,w*.9,w*.9],
    [x,-.012,.110,w*.8,w*.8],[x,-.021,.098,w*.5,w*.5]],5);
  }else{
   const drop=pose==='door'?.050+i*.005:.018+i*.002;
   sweep([knuckle,[x*1.05,-.004,.083,w,w],
    [x*1.15,-drop*.40,.068+reach*.70,w*.87,w*.87],
    [x*1.18,-drop,.068+reach,w*.55,w*.55]],5);
  }
 }
 sweep(gripping?[[.029,0,.018,.014,.012],[.048,-.007,.044,.013,.012],
  [.049,-.023,.069,.012,.011],[.034,-.021,.091,.009,.009]]:
  [[.027,0,.015,.015,.013],[.046,-.006,.033,.014,.012],
   [.059,-.011,.049,.012,.010],[.063,-.017,.068,.008,.008]],5);
 if(side<0)for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 g.setIndex(index);g.computeVertexNormals();return g;
}

const rimRadius=.17;
export function createCockpitWheel(){
 const parts:THREE.BufferGeometry[]=[];
 function part(g:THREE.BufferGeometry,hex:string){
  const color=new THREE.Color(hex),rgb=[];
  for(let i=0;i<g.getAttribute('position').count;i++)rgb.push(color.r,color.g,color.b);
  g.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));parts.push(g);
 }
 part(new THREE.TorusGeometry(rimRadius,.020,7,28),'#323337');
 for(const angle of [-.10,Math.PI+.10,-Math.PI/2]){
  const spoke=new THREE.BoxGeometry(.151,.018,.012);
  spoke.translate(.087,0,0).rotateZ(angle);part(spoke,'#b3a899');
 }
 const hub=new THREE.CylinderGeometry(.037,.037,.033,10);
 hub.rotateX(Math.PI/2);part(hub,'#5e5550');
 const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());
 const wheel=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.54,metalness:.18}));
 wheel.name='left-hand-drive-steering-wheel';wheel.position.set(.41,1.065,.075);
 wheel.rotation.x=.34;wheel.castShadow=true;return wheel;
}

const up=new THREE.Vector3(0,1,0);
function align(link:THREE.Mesh,from:THREE.Vector3,to:THREE.Vector3,axis:THREE.Vector3){
 axis.subVectors(to,from);const length=axis.length();
 link.position.copy(from);link.quaternion.setFromUnitVectors(up,axis.divideScalar(length));link.scale.y=length;
}

/** Work in the car frame. Body lean moves the shoulders, while the two
 * contact points belong to the steering wheel and the door respectively. */
export function createDriverArms(car:THREE.Group,body:THREE.Group,wheel:THREE.Mesh,skin:THREE.Material,suit:THREE.Material){
 const rig=new THREE.Group();car.add(rig);
 const arm=(material:THREE.Material,top:number,bottom:number):THREE.Mesh=>{
  const g=new THREE.CylinderGeometry(top,bottom,1,8);g.translate(0,.5,0);
  const link=new THREE.Mesh(g,material);link.castShadow=true;rig.add(link);return link;
 };
 const rightSleeve=arm(suit,.051,.065),leftSleeve=arm(suit,.054,.065);
 const forearm=arm(skin,.033,.046);forearm.name='driver-right-forearm';
 const hand=new THREE.Mesh(handGeometry('grip',1),skin);
 hand.name='driver-right-hand-steering';hand.castShadow=true;
 // At two o'clock seen by the driver (+X is screen left). The knuckles
 // wrap around the rim from its near face, with the thumb on the inside.
 hand.rotation.z=Math.PI/3;
 hand.position.set(-Math.sin(hand.rotation.z)*(rimRadius+.003),Math.cos(hand.rotation.z)*(rimRadius+.003),-.089);
 wheel.add(hand);

 const doorElbow=new THREE.Vector3(.875,1.004,-.37),doorWrist=new THREE.Vector3(.965,1.011,-.17);
 const axis=new THREE.Vector3(),rest=arm(skin,.034,.046);
 align(rest,doorElbow,doorWrist,axis);rest.updateMatrix();
 const fore=rest.geometry;fore.applyMatrix4(rest.matrix);fore.deleteAttribute('uv');
 const fingers=handGeometry('door',-1);
 fingers.rotateY(1.06).translate(doorWrist.x,doorWrist.y,doorWrist.z);
 rest.geometry=mergeGeometries([fore,fingers])!;fore.dispose();fingers.dispose();
 rest.position.set(0,0,0);rest.quaternion.identity();rest.scale.setScalar(1);
 rest.name='driver-left-arm-resting-on-door';

 const shoulder=new THREE.Vector3(),wrist=new THREE.Vector3(),elbow=new THREE.Vector3();
 const direction=new THREE.Vector3(),bend=new THREE.Vector3();
 const upper=.278,lower=.265;
 const pose=(steer:number)=>{
  // Positive local Z takes the top of the wheel to the driver's right.
  wheel.rotation.z=steer*.98;wheel.updateMatrix();body.updateMatrix();
  shoulder.set(.20,.373,.01).applyMatrix4(body.matrix);
  align(leftSleeve,shoulder,doorElbow,axis);
  shoulder.set(-.20,.373,.01).applyMatrix4(body.matrix);
  wrist.copy(hand.position).applyMatrix4(wheel.matrix);
  direction.subVectors(wrist,shoulder);const d=direction.length();direction.divideScalar(d);
  // Two-link reach, elbow biased down and out from the ribcage.
  const along=Math.min(upper,(d*d+upper*upper-lower*lower)/(2*d));
  bend.set(-.48,-1,-.12);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  elbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along)));
  align(rightSleeve,shoulder,elbow,axis);align(forearm,elbow,wrist,axis);
 };
 pose(0);return pose;
}
