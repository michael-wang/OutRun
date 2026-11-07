import * as THREE from 'three';
import {RICE_ROW_PITCH,RICE_HILL_PITCH} from '../src/coast-rice-layout.ts';

/** Bend the four ears of the CC0 source plant around their own culms. Retain the
 * position and proportions of each kernel so the gaps survive at grazing angles. */
export function bakeRipeRice(parts) {
 const boxes=parts.map(p=>p.box);
 const center=b=>b.getCenter(new THREE.Vector3());
 const ears=boxes.filter(b=>b.min.y<.1).map(b=>({base:center(b),grains:[]}));
 for(const box of boxes.filter(b=>b.min.y>=.1)){
  const origin=center(box);
  const distance=ear=>(origin.x-ear.base.x)**2+(origin.z-ear.base.z)**2;
  const ear=ears.reduce((best,next)=>distance(next)<distance(best)?next:best);
  ear.grains.push({origin,size:box.getSize(new THREE.Vector3())});
 }
 const positions=[],colors=[],indices=[];
 function vertex(p,color) {
  positions.push(...p.toArray());colors.push(color.r,color.g,color.b);
  return positions.length/3-1;
 }
 for(let hill=0;hill<6;hill++){
  const yaw=hill*2.39996;
  const hillRoot=new THREE.Vector3((hill%2-.5)*RICE_ROW_PITCH,0,(Math.floor(hill/2)-1)*RICE_HILL_PITCH);
  for(const [i,{base,grains}] of ears.entries()){
   const dir=yaw+i*2.39996;
   const forward=new THREE.Vector3(Math.cos(dir),0,Math.sin(dir));
   const side=new THREE.Vector3(-forward.z,0,forward.x);
   const root=hillRoot.clone().add(new THREE.Vector3(base.x,0,base.z).applyAxisAngle(new THREE.Vector3(0,1,0),yaw));
   const neck=.91+.065*Math.sin(hill*3+i),stem=new THREE.Color('#587744'),neckColor=new THREE.Color('#aaac69');
   function spine(t) {
    const angle=2.82*t;
    return root.clone().addScaledVector(forward,.13+.38*(1-Math.cos(angle))).setY(neck+.36*Math.sin(angle));
   }
   // A slender triangular culm curves through the entire panicle.
   let last=[];
   for(const [j,p] of [root,spine(0),spine(.25),spine(.5),spine(.75),spine(1)].entries()){
    const ring=[],r=j<2?.022:.009;
    for(let k=0;k<3;k++){
     const a=k*2*Math.PI/3;
     ring.push(vertex(p.clone().add(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)),j<2?stem:neckColor));
    }
    if(j)for(let k=0;k<3;k++){const l=(k+1)%3;indices.push(last[k],ring[k],last[l],last[l],ring[k],ring[l]);}
    last=ring;
   }
   // One ridged, tapering flag leaf springs out below each loaded head.
   const olive=new THREE.Color('#527a48'),ridge=new THREE.Color('#91a668');
   const collar=root.clone().lerp(spine(0),.36), blade=collar.clone().addScaledVector(forward,-.18);
   blade.y+=.37;
   const tip=collar.clone().addScaledVector(forward,-.38);tip.y+=.56;
   const a=vertex(collar,olive),b=vertex(blade.clone().addScaledVector(side,.046),olive);
   const c=vertex(blade.clone().addScaledVector(forward,.024),ridge);
   const d=vertex(blade.clone().addScaledVector(side,-.046),olive),e=vertex(tip,ridge);
   indices.push(a,c,b,a,d,c,b,c,e,c,d,e);
   for(const {origin,size} of grains){
    const t=(origin.y-.54)/.27,p=spine(t);
    p.addScaledVector(side,(origin.x-base.x)*1.85);
    const angle=t*2.82;
    const axis=forward.clone().multiplyScalar(Math.sin(angle)).setY(Math.cos(angle));
    const radial=forward.clone().multiplyScalar(Math.cos(angle)).setY(-Math.sin(angle));
    const husk=new THREE.Color().lerpColors(new THREE.Color('#cda660'),new THREE.Color('#f3db96'),.50+.28*Math.sin(t*9+i+hill));
    const ends=[-1,1].map(sign=>vertex(p.clone().addScaledVector(axis,sign*size.y*.86),husk));
    const ring=[];
    for(let k=0;k<4;k++){
     const angle=k*Math.PI/2;
     ring.push(vertex(p.clone().addScaledVector(radial,Math.cos(angle)*size.z*.68).addScaledVector(side,Math.sin(angle)*size.x*.80),husk));
    }
    for(let k=0;k<4;k++){const l=(k+1)%4;indices.push(ends[0],ring[k],ring[l],ends[1],ring[l],ring[k]);}
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();
 return g;
}
