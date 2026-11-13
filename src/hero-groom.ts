import * as THREE from 'three';
import type {PassengerDetail} from './passenger-face';

type Row={x:number;y:number;z:number;width:number;shade:number;sweep?:number};
type Strand={rows:Row[]};
const strandMesh=(strands:readonly Strand[],base:string,highlight:string,name:string,sides:number)=>{
 const pos:number[]=[],colors:number[]=[],index:number[]=[];
 const roots=new THREE.Color(base),ends=new THREE.Color(highlight);
 for(const strand of strands){
  const offset=pos.length/3;
  for(let i=0;i<strand.rows.length;i++){
   const r=strand.rows[i],t=i/(strand.rows.length-1);
   const shade=roots.clone().lerp(ends,.20+.64*t).multiplyScalar(r.shade);
   // A lenticular cross section gives each wind-driven lock a lit edge
   // and a darker underside, including in profile.
   for(let k=0;k<sides;k++){
    const angle=k*Math.PI*2/sides,spread=Math.cos(angle)*r.width;
    pos.push(r.x+spread*Math.cos(r.sweep??0),r.y,
     r.z-spread*Math.sin(r.sweep??0)+Math.sin(angle)*r.width*.42);
    const light=.85+.15*Math.sin(angle);
    colors.push(shade.r*light,shade.g*light,shade.b*light);
   }
  }
  for(let i=0;i<strand.rows.length-1;i++)for(let k=0;k<8;k++){
   const a=offset+i*sides+k,b=offset+i*sides+(k+1)%sides;
   index.push(a,b,a+sides,b,b+sides,a+sides);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(index);geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.02,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.castShadow=true;
 mesh.receiveShadow=false;
 return mesh;
};

export type WindGroom={
 root:THREE.Group;
 sync:(wind:number,sway:number,tipSway:number,phase:number)=>void;
 locks?:THREE.Group[];
};

/** Close-cut nape and temples below a swept side part. The forelock is
 * sculpted into the crown; only its longer top moves in the slipstream. */
export function createDriverHair():WindGroom{
 const root=new THREE.Group();root.name='driver-layered-short-hair';
 const segments=52,rows=11;
 const p=[-.014,.145,.004],colors:number[]=[],indices:number[]=[];
 const shapes=Array.from({length:4},()=>[0,0,0]);
 const espresso=new THREE.Color('#32231e'),chestnut=new THREE.Color('#876650');
 const stubble=new THREE.Color('#a37c60');
 const color=espresso.clone();colors.push(color.r,color.g,color.b);
 for(let row=1;row<=rows;row++)for(let i=0;i<segments;i++){
  const t=row/rows,a=i*2*Math.PI/segments,front=Math.cos(a);
  const sideburn=Math.exp(-((front-.34)**2)/.025);
  const arc=t*(1.62-.46*front+.095*Math.cos(2*a)+.33*sideburn);
  const sweep=a+.92*(1-t),sx=Math.sin(sweep),cz=Math.cos(sweep);
  const height=Math.cos(arc),radial=Math.sin(arc);
  const crown=THREE.MathUtils.smoothstep(height,.09,.88);
  const ridge=.5+.5*Math.cos(13*a+.65*Math.sin(a*3)+t*1.8);
  const part=Math.exp(-((sx*radial-.40)**2)/.008)*(.45+.55*Math.max(0,cz));
  const lift=crown*(.009*ridge-.010*part+.021*Math.max(0,cz)*radial);
  const hem=THREE.MathUtils.smoothstep(t,.84,1);
  p.push(-.014*crown+sx*radial*(.147+.005*crown+.004*ridge-.003*hem),
   -.048+(.187+lift)*height,.009+cz*radial*(.131+.004*ridge-.003*hem));
  // A graduated clip at the temples and nape lets the darker combed top read in silhouette.
  const taper=THREE.MathUtils.smoothstep(t,.63,1);
  color.copy(espresso).lerp(chestnut,.11+.48*taper+.31*ridge*(1-taper)+crown*(.10-.27*part));
  color.lerp(stubble,.39*hem*(1-THREE.MathUtils.smoothstep(front,0,.8)));
  colors.push(color.r,color.g,color.b);
  const flex=crown*(1-hem)*radial*(.46+.54*Math.max(0,cz));
  shapes[0].push(0,.012*flex,-.029*flex);
  shapes[1].push(.023*flex,0,0);
  for(let k=0;k<2;k++){
   const ripple=flex*Math.sin(2*a+k*Math.PI/2);
   shapes[k+2].push(.004*ripple,.006*ripple,-.004*ripple);
  }
  const here=1+(row-1)*segments+i,next=1+(row-1)*segments+(i+1)%segments;
  if(row===1)indices.push(0,here,next);
  else indices.push(here-segments,here,next-segments,next-segments,here,next);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();setWindShapes(g,shapes);
 const crop=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.74}));
 crop.name='driver-side-part-crop';crop.castShadow=true;root.add(crop);
 return {root,sync(wind,sway,tipSway,phase){
  const weights=crop.morphTargetInfluences!;
  weights[0]=wind;weights[1]=THREE.MathUtils.clamp(.35*sway+.65*tipSway,-1.2,1.2);
  weights[2]=wind*Math.sin(phase+1.3);weights[3]=wind*Math.cos(phase+1.3);
 }};
}

/** A full bob swept from an off-centre part. The rings share a single crown
 * vertex, so the scalp stays covered even when seen directly from above. */
function blondeCrown(detail:PassengerDetail){
 const portrait=detail==='portrait';
 const segments=portrait?80:28,rings=portrait?18:7;
 const root=new THREE.Color('#a06836'),gold=new THREE.Color('#ffdf9a');
 const color=root.clone(),positions=[.031,.202,-.010],colors=[root.r,root.g,root.b],indices:number[]=[];
 // Relative shapes for back-sweep, lateral load and two phases of a ripple.
 // All share the rest mesh, including a pinned scalp and front hairline.
 const shapes=Array.from({length:4},()=>[0,0,0]);
 for(let row=1;row<=rings;row++)for(let i=0;i<segments;i++){
  const t=row/rings,angle=i*Math.PI*2/segments;
  // The fringe clears the brows. Side waves roll down around the cheeks
  // and deepen toward the nape where the moving sections emerge.
  const fringe=THREE.MathUtils.smoothstep(Math.cos(angle),.20,.86);
  const hem=2.34-1.19*fringe+.21*Math.sin(6*angle+.6)*(1-fringe)+.11*Math.sin(2*angle)*fringe;
  const arc=t*hem,sweep=angle+.74*(1-t)+.23*Math.sin(arc*2+.5*Math.sin(angle));
  const wave=.5+.5*Math.cos(9*angle+1.1*Math.sin(3*angle)+.65*t);
  const streak=.5+.5*Math.cos(19*angle+.9*Math.sin(5*angle)+1.1*t);
  const ends=THREE.MathUtils.smoothstep(arc,1.35,2.34);
  const spread=(Math.sin(arc)+.22*ends)*(1+.065*wave);
  positions.push(
   .031*(1-t)*(1-t)+.149*spread*Math.sin(sweep),
   .202*Math.cos(arc)+.014*wave*Math.sin(arc)-ends*(.028+.023*wave),
   -.010-.010*t+.149*spread*Math.cos(sweep),
  );
  const flex=THREE.MathUtils.smoothstep(arc,.88,2.45)*(1-.78*fringe);
  const bend=flex*flex,phase=angle*3+arc*2;
  shapes[0].push(.015*Math.sin(sweep)*bend,.085*bend,-.152*bend);
  shapes[1].push(.108*bend,.018*Math.sin(sweep)*bend,0);
  for(let k=0;k<2;k++){
   const ripple=bend*Math.sin(phase+k*Math.PI/2);
   shapes[2+k].push(.035*ripple,.024*ripple,-.021*ripple);
  }
  color.copy(root).lerp(gold,.20+.37*wave+.15*streak+.18*Math.sin(arc));
  colors.push(color.r,color.g,color.b);
  const here=1+(row-1)*segments+i,next=1+(row-1)*segments+(i+1)%segments;
  if(row===1)indices.push(0,here,next);
  else indices.push(here-segments,here,next-segments,next-segments,here,next);
 }
 // Closed locks emerge from the off-centre part, cross the temples and
 // turn out at their tips. They share the crown draw and its four wind poses.
 type Knot=[number,number,number];
 function lock(path:Knot[],width:number,tint:number){
  const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p)));
  const start=positions.length/3,steps=portrait?22:5,sides=portrait?12:4;
  for(let j=0;j<=steps;j++){
   const t=j/steps,center=curve.getPoint(t),tangent=curve.getTangent(t);
   const normal=new THREE.Vector3(center.x,center.y*.72,center.z+.02).normalize();
   const across=new THREE.Vector3().crossVectors(tangent,normal).normalize();
   normal.crossVectors(across,tangent).normalize();
   const radius=width*(.035+.965*Math.sin(Math.PI*t)**.72);
   for(let k=0;k<sides;k++){
    const angle=k*2*Math.PI/sides,crest=Math.cos(angle);
    const v=center.clone().addScaledVector(across,Math.sin(angle)*radius)
     .addScaledVector(normal,crest*radius*.42);
    positions.push(v.x,v.y,v.z);
    const grain=.5+.5*Math.cos(angle*3+.8*Math.sin(t*4));
    color.copy(root).lerp(gold,.19+.31*crest+.19*grain+.15*t+tint);
    colors.push(color.r,color.g,color.b);
    const flex=t*t*THREE.MathUtils.smoothstep(.10-v.y,0,.22);
    shapes[0].push(0,.038*flex,-.078*flex);
    shapes[1].push(.054*flex,0,0);
    shapes[2].push(0,.012*flex,-.008*flex);shapes[3].push(.010*flex,0,0);
    if(j){
     const here=start+j*sides+k,next=start+j*sides+(k+1)%sides;
     indices.push(here-sides,next-sides,here,next-sides,next,here);
    }
   }
  }
 }
 lock([[.044,.185,.056],[.012,.155,.103],[-.041,.096,.136],[-.091,.066,.140],[-.143,.031,.107]],.041,.05);
 lock([[.024,.199,.043],[-.056,.170,.113],[-.123,.095,.135],[-.156,.019,.092],[-.184,-.035,.045]],.030,0);
 lock([[.043,.18,.057],[.074,.135,.104],[.109,.076,.119],[.132,.018,.101],[.163,-.055,.061]],.039,.07);
 for(const side of [-1,1]){
  lock([[side*.072,.186,.045],[side*.139,.111,.097],[side*.169,.020,.068],
   [side*.157,-.078,.067],[side*.184,-.134,.096]],.035,.02);
  lock([[side*.089,.175,-.025],[side*.169,.089,.020],[side*.183,-.014,-.003],
   [side*.171,-.089,.005],[side*.207,-.132,.026]],.038,-.06);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();
 setWindShapes(g,shapes);
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}));
 mesh.name='blonde-layered-crown';mesh.castShadow=true;return mesh;
}

function setWindShapes(g:THREE.BufferGeometry,shapes:number[][]){
 const rest=g.getAttribute('position'),normals=g.getAttribute('normal');
 const bounds=new THREE.Box3();
 for(let i=0;i<rest.count;i++)for(let axis=0;axis<3;axis++){
  const j=i*3+axis,at=rest.getComponent(i,axis);
  const margin=Math.abs(shapes[1][j])*1.2+Math.hypot(shapes[2][j],shapes[3][j]);
  bounds.min.setComponent(axis,Math.min(bounds.min.getComponent(axis),at+Math.min(0,shapes[0][j])-margin));
  bounds.max.setComponent(axis,Math.max(bounds.max.getComponent(axis),at+Math.max(0,shapes[0][j])+margin));
 }
 g.morphTargetsRelative=true;
 g.boundingBox=bounds;g.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
 g.morphAttributes.position=shapes.map(shape=>new THREE.Float32BufferAttribute(shape,3));
 // Bake each bent shape's lighting normals once. Three applies these same
 // morph weights to the visible and shadow geometry.
 g.morphAttributes.normal=g.morphAttributes.position.map(delta=>{
  const bent=rest.clone();
  for(let i=0;i<bent.count;i++)bent.setXYZ(i,rest.getX(i)+delta.getX(i),rest.getY(i)+delta.getY(i),rest.getZ(i)+delta.getZ(i));
  const pose=new THREE.BufferGeometry();pose.setAttribute('position',bent);pose.setIndex(g.index);pose.computeVertexNormals();
  const n=pose.getAttribute('normal') as THREE.BufferAttribute;
  for(let i=0;i<n.count;i++)n.setXYZ(i,n.getX(i)-normals.getX(i),n.getY(i)-normals.getY(i),n.getZ(i)-normals.getZ(i));
  pose.dispose();return n;
 });
}

/** One opaque crown and five double-jointed windblown ends in two batches. */
export function createBlondeBob(detail:PassengerDetail='driving'){
 const root=new THREE.Group();root.name='layered-blonde-bob';
 const crown=blondeCrown(detail);root.add(crown);
 // Instanced dual-joint locks: FIVE independently moving clusters,
 // but only TWO hair draws (root & tip), not ten separate mesh draws.
 // The articulated ends share opaque lens-shaped cross sections.
 const locks:THREE.Group[]=[];
 const upper:Strand[]=[],lower:Strand[]=[];
 for(let j=0;j<2;j++){
  const rows:Row[]=[];
  for(let step=0;step<=8;step++){
   const t=step/8;
   rows.push({
    x:(j-.5)*.024+.030*Math.sin(t*4.1+j*.55)*t,
    y:-.015-.197*t-.024*t*t,
    z:-.004-.071*t+.028*Math.sin(t*Math.PI),
    width:(.027+.004*j)*(1-.96*t*t),
    shade:.84+.10*Math.sin(2+j)+.13*t,
   });
  }
  upper.push({rows:rows.slice(0,6)});
  lower.push({rows:rows.slice(4).map(row=>({...row,y:row.y+.132,z:row.z+.042}))});
 }
 const rootCard=strandMesh(upper,'#94612a','#f6d788','blonde-wind-root-prototype',detail==='portrait'?8:4);
 const tipCard=strandMesh(lower,'#ba8743','#f8dc99','blonde-wind-tip-prototype',detail==='portrait'?8:4);
 const primary=new THREE.InstancedMesh(rootCard.geometry,rootCard.material,5);
 const secondary=new THREE.InstancedMesh(tipCard.geometry,tipCard.material,5);
 primary.name='blonde-wind-locks-batched';
 secondary.name='blonde-wind-tips-batched';
 primary.castShadow=secondary.castShadow=true;
 // Both instance batches can swing past their resting bounds.
 primary.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,-.1,-.15),.5);
 secondary.boundingSphere=primary.boundingSphere.clone();
 primary.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 secondary.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 root.add(primary,secondary);
 for(let i=0;i<5;i++){
  const anchor=new THREE.Group();anchor.name='blonde-hair-lock-'+i;
  const side=(i-2)/2;
  anchor.position.set(side*.120,-.018+.012*Math.sin(i*2.1),-.123+.049*side*side);
  anchor.rotation.y=-side*.38;
  const length=1+(i%3)*.042;
  anchor.scale.set(length,.84*length,.92*length);
  root.add(anchor);
  const tip=new THREE.Group();tip.name='blonde-tip-joint';tip.position.set(0,-.132,-.042);
  anchor.add(tip);locks.push(anchor);
 }
 const matrix=new THREE.Matrix4();
 const sync=(wind:number,sway:number,tipSway:number,phase:number)=>{
  const weights=crown.morphTargetInfluences!;
  weights[0]=wind*(.93+.07*Math.sin(phase*.71));
  weights[1]=THREE.MathUtils.clamp(sway,-1.2,1.2);
  weights[2]=wind*Math.sin(phase);weights[3]=wind*Math.cos(phase);
  for(let i=0;i<locks.length;i++){
   const anchor=locks[i],tip=anchor.children[0];
   const gust=Math.sin(phase+i*.83),ripple=Math.sin(phase*1.61-i*.79);
   anchor.rotation.x=.018+wind*(.79+.13*gust+.065*ripple);
   anchor.rotation.z=.59*sway+wind*(.14*gust+.045*ripple);
   tip.rotation.x=wind*(.29+.17*Math.sin(phase+i*.83-.95));
   tip.rotation.z=.38*tipSway+wind*(.19*Math.sin(phase+i*.83-1.1)+.065*ripple);
   anchor.updateMatrix();tip.updateMatrix();
   primary.setMatrixAt(i,anchor.matrix);
   matrix.multiplyMatrices(anchor.matrix,tip.matrix);
   secondary.setMatrixAt(i,matrix);
  }
  primary.instanceMatrix.needsUpdate=true;
  secondary.instanceMatrix.needsUpdate=true;
 };
 sync(0,0,0,0);
 return {root,locks,sync};
}
