import * as T from 'three';
// A cut-out spray of leaves. The same ink stamp forms the near park trees
// viewed from any direction. Crossed sprays are fixed to the branches.
export function createParkTrees(scene,cityChunks,physicalPos){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const g=canvas.getContext('2d');let seed=49277;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
 for(let j=0;j<150;j++){
  const angle=rand()*Math.PI*2,r=Math.sqrt(rand()),x=64+52*Math.cos(angle)*r,y=65+43*Math.sin(angle)*r;
  const green=Math.round(103+54*(1-y/128)+rand()*49);
  g.fillStyle='rgb('+Math.round(green*.76)+','+green+','+Math.round(green*.58)+')';
  for(let i=0;i<3;i++){
   g.beginPath();g.ellipse(x+rand()*10-5,y+rand()*8-4,4+rand()*5,2+rand()*3,rand()*2,0,2*Math.PI);g.fill();
  }
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const leaves=new T.MeshLambertMaterial({map,alphaTest:.47,side:T.DoubleSide});
 const bark=new T.MeshLambertMaterial({color:0x796957});
 const twig=new T.CylinderGeometry(.64,1,1,6),spray=new T.PlaneGeometry(1,1);
 const normals=spray.attributes.normal;for(let i=0;i<normals.count;i++)normals.setXYZ(i,0,1,0);
 const cells=new Map(),unit=new T.Object3D(),up=new T.Vector3(0,1,0);
 function plant(d,x,y,h){
  const key=Math.floor(d/155),cell=cells.get(key)||{trunks:[],canopy:[]};cells.set(key,cell);
  const origin=new T.Vector3(...physicalPos(d,x,y));
  function branch(a,b,w){const v=b.clone().sub(a);unit.position.copy(a).lerp(b,.5);unit.quaternion.setFromUnitVectors(up,v.clone().normalize());unit.scale.set(w,v.length(),w);unit.updateMatrix();cell.trunks.push(unit.matrix.clone());}
  const fork=origin.clone().add(new T.Vector3(.22,h*.43,.24));branch(origin,fork,h*.030);
  const phase=d*.726+x;
  for(let i=0;i<6;i++){
   const az=phase+i*2.4,height=h*(.72+.055*(i%4)),r=h*(.21+.11*(i%3));
   const top=origin.clone().add(new T.Vector3(Math.cos(az)*r,height,Math.sin(az)*r));branch(fork,top,h*.016);
   for(let k=0;k<3;k++){
    unit.position.copy(top);unit.position.y+=h*.04*k;unit.rotation.set(.12+.19*k,az+k*Math.PI/3,-.12+.12*k);
    unit.scale.set(h*(.63+.09*Math.sin(az)),h*.47,1);unit.updateMatrix();cell.canopy.push(unit.matrix.clone());
   }
  }
 }
 function finish(){for(const [cell,parts] of cells){for(const [g,m,arr] of [[twig,bark,parts.trunks],[spray,leaves,parts.canopy]]){
   const mesh=new T.InstancedMesh(g,m,arr.length);arr.forEach((v,i)=>mesh.setMatrixAt(i,v));mesh.computeBoundingSphere();mesh.name='park tree';scene.add(mesh);cityChunks.push({at:cell*155+77,mesh});
  }}}
 return {plant,finish};
}
