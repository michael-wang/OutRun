import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Rear design interpretation: tapered lenses, recessed brand panel and framed outlets.
 * Shares paint/brake uniforms, so all existing colour and lamp controls still work.
 */
export function optionBRear(paint:THREE.Material,rear:THREE.Material){
 const root=new THREE.Group();root.name='option-b-rear-design';
 const dark=new THREE.MeshStandardMaterial({color:'#151b20',roughness:.48,metalness:.25,side:THREE.DoubleSide});
 const bronze=new THREE.MeshStandardMaterial({color:'#b7946d',roughness:.26,metalness:.8,side:THREE.DoubleSide});
 function surface(name:string,points:number[][],mat:THREE.Material,z:number,depth=.04){
  const shape=new THREE.Shape();
  const ps=points.map(([x,y])=>new THREE.Vector2(x,y));
  for(let i=0;i<ps.length;i++){
   const p=ps[i],a=p.clone().lerp(ps[(i+ps.length-1)%ps.length],.16),b=p.clone().lerp(ps[(i+1)%ps.length],.16);
   if(i===0)shape.moveTo(a.x,a.y);else shape.lineTo(a.x,a.y);
   shape.quadraticCurveTo(p.x,p.y,b.x,b.y);
  }
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth,curveSegments:5,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,steps:1});
  const position=g.getAttribute('position');
  for(let i=0;i<position.count;i++)position.setZ(i,position.getZ(i)+.25*(position.getX(i)/1.05)**2);
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.name=name;m.position.z=z;root.add(m);return m;
 }
 // Smooth shallow continuous rear skin, with lower corners drawn into the diffuser.
 surface('option-b-painted-tail',[[-1.03,.77],[-.93,.91],[0,.94],[.93,.91],[1.03,.77],[.97,.53],[.64,.48],[.48,.65],[-.48,.65],[-.64,.48],[-.97,.53]],paint,-2.405,.14);
 surface('option-b-sculpted-diffuser',[[-1.03,.52],[-.91,.60],[-.55,.57],[-.40,.48],[.40,.48],[.55,.57],[.91,.60],[1.03,.52],[.94,.31],[.48,.25],[-.48,.25],[-.94,.31]],dark,-2.43,.18);
 for(const side of [-1,1]){
  const pts=(p:number[][])=>p.map(([x,y])=>[side*x,y]);
  surface('option-b-tapered-tail-lens',pts([[.16,.825],[.32,.876],[.87,.855],[1.00,.79],[.84,.752],[.31,.776]]),dark,-2.436,.025);
  surface('option-b-tail-led',pts([[.25,.817],[.35,.837],[.86,.821],[.94,.791],[.82,.793],[.35,.801]]),rear,-2.46,.012);
  surface('option-b-exhaust-frame',pts([[.55,.40],[.64,.525],[.94,.515],[.88,.365],[.60,.35]]),bronze,-2.47,.06);
  surface('option-b-exhaust-opening',pts([[.60,.409],[.665,.485],[.89,.48],[.845,.399],[.635,.386]]),dark,-2.492,.012);
 }
 for(const x of [-.32,0,.32]){
  const fin=new THREE.Mesh(new THREE.BoxGeometry(.018,.17,.24),dark);fin.position.set(x,.32,-2.43);root.add(fin);
 }
 surface('option-b-brand-recess',[[-.44,.70],[.44,.70],[.47,.51],[-.47,.51]],dark,-2.445,.025);
 const plate=new THREE.MeshBasicMaterial({color:'#ffffff'});
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const c=canvas.getContext('2d');if(c){
   c.fillStyle='#151b20';c.fillRect(0,0,512,128);c.textAlign='center';c.fillStyle='#e9e3d9';c.font='italic bold 43px Arial';c.fillText('Coastal Highway',256,51);c.fillStyle='#dd8f44';c.font='italic bold 49px Arial';c.fillText('Racing',256,105);
   const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;plate.map=t;
  }
 }
 const label=new THREE.Mesh(new THREE.PlaneGeometry(.79,.17),plate);label.name='option-b-brand-plate';label.rotation.y=Math.PI;label.position.set(0,.602,-2.476);root.add(label);
 // Four static material batches plus the single 512x128 label texture.
 for(const [mat,name] of [[paint,'painted-tail'],[dark,'diffuser-lenses'],[bronze,'exhaust-frames'],[rear,'tail-led']] as const){
  const pieces=root.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.material===mat);
  const geometries=pieces.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrix);});
  const combined=mergeGeometries(geometries)!;geometries.forEach(g=>g.dispose());
  pieces.forEach(o=>{root.remove(o);o.geometry.dispose();});
  const mesh=new THREE.Mesh(combined,mat);mesh.name=`option-b-${name}`;root.add(mesh);
 }
 return root;
}
