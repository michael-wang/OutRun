import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const TIRE_RADIUS=.46;
/** Pure presentation; longitudinal travel is already multiplied by the accepted world pace. */
export function wheelRoll(angle:number,worldTravel:number){return angle+worldTravel/TIRE_RADIUS;}
export function createRoadWheel(side:number,front:boolean){
 const pivot=new THREE.Group();pivot.name=front?`front-wheel-${side}`:`rear-wheel-${side}`;
 const rotor=new THREE.Group();rotor.name='rolling-axle';pivot.add(rotor);
 const tire=new THREE.Mesh(new THREE.CylinderGeometry(TIRE_RADIUS,TIRE_RADIUS,.27,32),new THREE.MeshStandardMaterial({color:'#192124',roughness:.9}));tire.rotation.z=Math.PI/2;rotor.add(tire);
 const rim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.282,24),new THREE.MeshStandardMaterial({color:'#c9dad4',metalness:.75,roughness:.3}));rim.rotation.z=Math.PI/2;rotor.add(rim);
 const parts:THREE.BufferGeometry[]=[];
 for(let i=0;i<5;i++){
  const a=i*2*Math.PI/5,g=new THREE.BoxGeometry(.015,.17,.045);g.translate(side*.15,.21,0);g.rotateX(a);parts.push(g);
 }
 const hub=new THREE.CylinderGeometry(.115,.115,.3,12);hub.rotateZ(Math.PI/2);parts.push(hub);
 const spokesGeometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());
 const spokes=new THREE.Mesh(spokesGeometry,new THREE.MeshStandardMaterial({color:'#182c35',roughness:.5,transparent:true}));rotor.add(spokes);
 // A single asymmetric rim mark breaks the five-fold spoke symmetry at high RPM.
 const marker=new THREE.Mesh(new THREE.BoxGeometry(.018,.085,.04),new THREE.MeshStandardMaterial({color:'#ffe3a0',roughness:.55,transparent:true}));marker.position.set(side*.16,.34,.045);rotor.add(marker);
 // Three soft streak layers provide a stylized blurred-spoke representation.
 const blurMaterial=new THREE.MeshBasicMaterial({color:'#14252c',transparent:true,opacity:0,depthWrite:false});
 const ghosts=Array.from({length:3},()=>{const m=new THREE.Mesh(spokesGeometry,blurMaterial);pivot.add(m);return m;});
 rotor.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
 let angle=0,steer=0,previousRendered=0,travel=0,pendingTime=0,blurAngle=0,blurAmount=0;
 return {pivot,advance:(ds:number,applied:number,dt:number)=>{
  pendingTime+=dt;travel+=ds;angle=wheelRoll(angle,ds);steer+=((front?-THREE.MathUtils.clamp(applied,-1,1)*.3:0)-steer)*(1-Math.exp(-dt/ .07));
 },render:()=>{
  rotor.rotation.x=angle%(2*Math.PI);pivot.rotation.y=steer;
  const swept=angle-previousRendered,rate=Math.abs(swept)/Math.max(pendingTime,1e-6),blur=THREE.MathUtils.clamp((rate-35)/70,0,1);
  // At high RPM, crisp repeated spokes can alias to stillness. Keep the actual
  // axle physical, but show a band-limited, smeared rotational highlight instead.
  blurAngle+=Math.sign(swept)*Math.min(Math.abs(swept),pendingTime*14);blurAmount=blur;
  spokes.visible=marker.visible=blur<.99;
  spokes.material.opacity=1-blur;marker.material.opacity=1-blur;blurMaterial.opacity=blur*.6;
  ghosts.forEach((m,i)=>{m.visible=blur>.05;m.rotation.x=(blurAngle-i*.19)%(2*Math.PI);});previousRendered=angle;pendingTime=0;
 },reset:()=>{angle=steer=previousRendered=travel=pendingTime=blurAngle=blurAmount=0;rotor.rotation.x=pivot.rotation.y=0;ghosts.forEach(m=>m.visible=false);},inspect:()=>({front,side,angle,steer,travel,blurAngle,blurAmount,radius:TIRE_RADIUS,center:pivot.position.toArray()})};
}
