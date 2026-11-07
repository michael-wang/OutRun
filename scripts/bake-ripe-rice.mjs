import * as THREE from 'three';

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
  const yaw=hill*2.39996, radius=hill===0?0:1.08;
  const hillRoot=new THREE.Vector3(Math.cos(yaw)*radius,0,Math.sin(yaw)*radius);
  for(const [i,{base,grains}] of ears.entries()){
   const dir=yaw+i*2.39996;
   const forward=new THREE.Vector3(Math.cos(dir),0,Math.sin(dir));
   const side=new THREE.Vector3(-forward.z,0,forward.x);
   const root=hillRoot.clone().add(new THREE.Vector3(base.x,0,base.z).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).multiplyScalar(1.5));
   const neck=1.02+.08*Math.sin(hill*3+i), straw=new THREE.Color('#b8a34d');
   function spine(t) {
    const angle=2.82*t;
    return root.clone().addScaledVector(forward,.13+.28*(1-Math.cos(angle))).setY(neck+.28*Math.sin(angle));
   }
   // A slender triangular culm curves through the entire panicle.
   let last=[];
   for(const [j,p] of [root,spine(0),spine(.25),spine(.5),spine(.75),spine(1)].entries()){
    const ring=[],r=j<2?.014:.009;
    for(let k=0;k<3;k++){
     const a=k*2*Math.PI/3;
     ring.push(vertex(p.clone().add(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)),straw));
    }
    if(j)for(let k=0;k<3;k++){const l=(k+1)%3;indices.push(last[k],ring[k],last[l],last[l],ring[k],ring[l]);}
    last=ring;
   }
   // One ridged, tapering flag leaf springs out below each loaded head.
   const olive=new THREE.Color('#939746'),ridge=new THREE.Color('#c7b95f');
   const collar=root.clone().lerp(spine(0),.61), blade=collar.clone().addScaledVector(forward,-.23);
   blade.y+=.36;
   const tip=collar.clone().addScaledVector(forward,-.45);tip.y+=.43;
   const a=vertex(collar,olive),b=vertex(blade.clone().addScaledVector(side,.027),olive);
   const c=vertex(blade.clone().addScaledVector(forward,.024),ridge);
   const d=vertex(blade.clone().addScaledVector(side,-.027),olive),e=vertex(tip,ridge);
   indices.push(a,c,b,a,d,c,b,c,e,c,d,e);
   for(const {origin,size} of grains){
    const t=(origin.y-.54)/.27,p=spine(t);
    p.addScaledVector(side,(origin.x-base.x)*1.45);
    const angle=t*2.82;
    const axis=forward.clone().multiplyScalar(Math.sin(angle)).setY(Math.cos(angle));
    const radial=forward.clone().multiplyScalar(Math.cos(angle)).setY(-Math.sin(angle));
    const husk=new THREE.Color().lerpColors(new THREE.Color('#c58b39'),new THREE.Color('#f1cf79'),.38+.32*Math.sin(t*9+i+hill));
    const ends=[-1,1].map(sign=>vertex(p.clone().addScaledVector(axis,sign*size.y*.63),husk));
    const ring=[];
    for(let k=0;k<4;k++){
     const angle=k*Math.PI/2;
     ring.push(vertex(p.clone().addScaledVector(radial,Math.cos(angle)*size.z*.42).addScaledVector(side,Math.sin(angle)*size.x*.52),husk));
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
