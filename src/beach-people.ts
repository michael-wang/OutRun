import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Lightweight reusable static poses: metres, waterline at local y=0; no stage coordinates. */
export function makeBather(pose:'raised'|'ring'|'swim'|'stand',skin:THREE.Material,swimwear:THREE.Material,cap:THREE.Material,lowDetail=false){
 const root=new THREE.Group(),sphere=new THREE.SphereGeometry(1,lowDetail?6:10,lowDetail?4:8);
 function oval(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:THREE.Material){const o=new THREE.Mesh(sphere,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);root.add(o);return o;}
 function limb(a:number[],b:number[],r:number){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=new THREE.Mesh(new THREE.CylinderGeometry(r*.78,r,delta.length(),8),skin);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(o);oval(b[0],b[1],b[2],r,r,r,skin);}
 oval(0,.18,0,.23,.39,.15,skin);oval(0,.03,0,.24,.24,.16,swimwear);
 oval(0,.65,.015,.155,.205,.16,skin);oval(0,.795,0,.158,.075,.16,cap);
 limb([-.13,-.08,0],[-.17,-.85,.03],.09);limb([.13,-.08,0],[.17,-.85,-.04],.09);
 if(pose==='stand'){for(const s of [-1,1]){limb([s*.19,.39,0],[s*.30,.08,.04],.065);limb([s*.30,.08,.04],[s*.25,-.20,.1],.05);}}
 else if(pose==='raised'){for(const s of [-1,1]){limb([s*.19,.39,0],[s*.40,.60,.02],.065);limb([s*.40,.60,.02],[s*.50,.92,.02],.05);}}
 else if(pose==='ring'){
  for(const s of [-1,1]){limb([s*.20,.4,0],[s*.43,.14,.18],.065);limb([s*.43,.14,.18],[s*.34,.12,.42],.05);}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.16,8,20),swimwear);ring.rotation.x=Math.PI/2;ring.position.y=.02;root.add(ring);
 }else{
  // Horizontal swimmer: head/shoulders remain above water, hips/legs mostly immersed.
  for(const s of [-1,1]){limb([s*.2,.38,0],[s*.43,.69,.04],.065);limb([s*.43,.69,.04],[s*.35,1.02,.06],.05);}
  root.rotation.x=Math.PI/2-.10;root.position.y=.075;
 }
 // Static poses share just three material draws instead of one draw per limb.
 const originals=[...root.children] as THREE.Mesh[];
 root.clear();
 for(const material of [skin,swimwear,cap]){
  const parts=originals.filter(o=>o.material===material).map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});
  const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  if(geometry)root.add(new THREE.Mesh(geometry,material));
 }
 new Set(originals.map(o=>o.geometry)).forEach(g=>g.dispose());
 root.name='beach-bather-'+pose;return root;
}
