import * as THREE from 'three';
import {RICE_ROW_PITCH,RICE_HILL_PITCH} from '../src/coast-rice-layout.ts';

/** Grow branched, grain-laden panicles from the four culms of the CC0 plant.
 * Retain each source kernel's proportions and ordering up the rachis. */
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
   const phase=hill*3.6+i*2.13;
   const neck=.91+.076*Math.sin(phase),reach=.34+.065*Math.cos(phase*1.6);
   const stem=new THREE.Color('#587744'),neckColor=new THREE.Color('#aaac69');
   function spine(t) {
    const angle=(2.85+.26*Math.sin(phase))*t;
    return root.clone().addScaledVector(forward,.13+reach*(1-Math.cos(angle)))
     .addScaledVector(side,.068*Math.sin(t*Math.PI)*Math.cos(phase))
     .setY(neck+.36*Math.sin(angle));
   }
   // A slender triangular culm curves through the entire panicle.
   let last=[];
   for(const [j,p] of [root,spine(0),spine(.34),spine(.67),spine(1)].entries()){
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
   grains.sort((a,b)=>a.origin.y-b.origin.y);
   for(let j=0;j<grains.length;j+=2){
    const t=THREE.MathUtils.clamp((grains[j].origin.y-.54)/.27,0,1);
    const basePoint=spine(t),azimuth=phase+j*1.20;
    const twig=forward.clone().multiplyScalar(.075+.040*Math.cos(azimuth))
     .addScaledVector(side,.15*Math.sin(azimuth)).setY(-.05-.065*t);
    const end=vertex(basePoint.clone().add(twig),neckColor);
    const u=new THREE.Vector3().crossVectors(twig,side).normalize();
    const v=new THREE.Vector3().crossVectors(twig,u).normalize();
    const twigRing=[];
    for(let k=0;k<3;k++){
     const a=k*2*Math.PI/3;
     twigRing.push(vertex(basePoint.clone().addScaledVector(u,.011*Math.cos(a)).addScaledVector(v,.011*Math.sin(a)),neckColor));
    }
    for(let k=0;k<3;k++)indices.push(twigRing[k],twigRing[(k+1)%3],end);
    for(const [n,{size}] of grains.slice(j,j+2).entries()){
     const axis=twig.clone().normalize().addScaledVector(side,n?.35:-.35);
     axis.y-=.55+.28*t;axis.normalize();
     // Hang each kernel by its upper tip on a separate section of the branch.
     const half=size.y*.96;
     const p=basePoint.clone().addScaledVector(twig,n?1:.52).addScaledVector(axis,half);
     const radial=new THREE.Vector3().crossVectors(axis,side).normalize();
     const lateral=new THREE.Vector3().crossVectors(radial,axis);
     const husk=new THREE.Color().lerpColors(new THREE.Color('#cda660'),new THREE.Color('#f3db96'),.54+.25*Math.sin(t*9+i+hill+n));
     const ends=[-1,1].map(sign=>vertex(p.clone().addScaledVector(axis,sign*half),husk));
     const ring=[],sides=n?4:3;
     for(let k=0;k<sides;k++){
      const a=k*2*Math.PI/sides;
      ring.push(vertex(p.clone().addScaledVector(radial,Math.cos(a)*size.z*.84).addScaledVector(lateral,Math.sin(a)*size.x*.90),husk));
     }
     for(let k=0;k<sides;k++){const l=(k+1)%sides;indices.push(ends[0],ring[k],ring[l],ends[1],ring[l],ring[k]);}
    }
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();
 return g;
}
