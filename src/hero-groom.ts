import * as THREE from 'three';

type Row={x:number;y:number;z:number;width:number;shade:number;sweep?:number};
type Strand={rows:Row[]};
const strandMesh=(strands:readonly Strand[],base:string,highlight:string,name:string)=>{
 const pos:number[]=[],colors:number[]=[],index:number[]=[];
 const roots=new THREE.Color(base),ends=new THREE.Color(highlight);
 for(const strand of strands){
  const offset=pos.length/3;
  for(let i=0;i<strand.rows.length;i++){
   const r=strand.rows[i],t=i/(strand.rows.length-1);
   const shade=roots.clone().lerp(ends,.20+.64*t).multiplyScalar(r.shade);
   // A subtle central ridge avoids paper-flat hair cards from the chase view.
   for(const side of [-1,0,1]){
    const spread=side*r.width;
    pos.push(r.x+spread*Math.cos(r.sweep??0),r.y+(side===0?.006:0),r.z-spread*Math.sin(r.sweep??0)+(side===0?-.003:0));
    const c=shade.clone().multiplyScalar(side===0?1.1:side===-1?.94:.98);
    colors.push(c.r,c.g,c.b);
   }
  }
  for(let i=0;i<strand.rows.length-1;i++)for(let j=0;j<2;j++){
   const a=offset+i*3+j,b=a+3;index.push(a,b,a+1,a+1,b,b+1);
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
function blondeCrown(){
 const segments=64,rings=7;
 const root=new THREE.Color('#966237'),gold=new THREE.Color('#ffdb90');
 const color=root.clone(),positions=[.034,.213,-.012],colors=[root.r,root.g,root.b],indices:number[]=[];
 // Relative shapes for back-sweep, lateral load and two phases of a ripple.
 // All share the rest mesh, including a pinned scalp and front hairline.
 const shapes=Array.from({length:4},()=>[0,0,0]);
 for(let row=1;row<=rings;row++)for(let i=0;i<segments;i++){
  const t=row/rings,angle=i*Math.PI*2/segments;
  // The fringe clears the brows. Side waves roll down around the cheeks
  // and deepen toward the nape where the moving sections emerge.
  const fringe=THREE.MathUtils.smoothstep(Math.cos(angle),.20,.86);
  const hem=2.34-1.16*fringe+.09*Math.sin(5*angle+.6)+.045*Math.cos(9*angle);
  const arc=t*hem,sweep=angle+.74*(1-t)+.23*Math.sin(arc*2+.5*Math.sin(angle));
  const wave=.5+.5*Math.cos(9*angle+1.1*Math.sin(3*angle)+.65*t);
  const streak=.5+.5*Math.cos(19*angle+.9*Math.sin(5*angle)+1.1*t);
  const ends=THREE.MathUtils.smoothstep(arc,1.35,2.34);
  const spread=(Math.sin(arc)+.22*ends)*(1+.065*wave);
  positions.push(
   .034*(1-t)*(1-t)+.176*spread*Math.sin(sweep),
   .213*Math.cos(arc)+.014*wave*Math.sin(arc)-ends*(.028+.023*wave),
   -.012-.018*t+.164*spread*Math.cos(sweep),
  );
  const flex=THREE.MathUtils.smoothstep(arc,.88,2.45)*(1-.78*fringe);
  const bend=flex*flex,phase=angle*3+arc*2;
  shapes[0].push(.015*Math.sin(sweep)*bend,.085*bend,-.152*bend);
  shapes[1].push(.108*bend,.018*Math.sin(sweep)*bend,0);
  for(let k=0;k<2;k++){
   const ripple=bend*Math.sin(phase+k*Math.PI/2);
   shapes[2+k].push(.035*ripple,.024*ripple,-.021*ripple);
  }
  color.copy(root).lerp(gold,.12+.36*wave+.32*streak+.16*Math.sin(arc));
  colors.push(color.r,color.g,color.b);
  const here=1+(row-1)*segments+i,next=1+(row-1)*segments+(i+1)%segments;
  if(row===1)indices.push(0,here,next);
  else indices.push(here-segments,here,next-segments,next-segments,here,next);
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
export function createBlondeBob(){
 const root=new THREE.Group();root.name='layered-blonde-bob';
 const crown=blondeCrown();root.add(crown);
 // Instanced dual-joint locks: FIVE independently moving clusters,
 // but only TWO hair draws (root & tip), not ten separate mesh draws.
 // Root cards share the same shaped strips; matrices vary per lock.
 const locks:THREE.Group[]=[];
 const upper:Strand[]=[],lower:Strand[]=[];
 for(let j=0;j<3;j++){
  const rows:Row[]=[];
  for(let step=0;step<=8;step++){
   const t=step/8;
   rows.push({
    x:(j-1)*.014+.030*Math.sin(t*4.1+j*.55)*t,
    y:-.015-.22*t-.029*t*t,
    z:-.012-.085*t+.013*Math.sin(t*Math.PI),
    width:(.023+.004*j)*(1-.80*t),
    shade:.84+.10*Math.sin(2+j)+.13*t,
   });
  }
  upper.push({rows:rows.slice(0,6)});
  lower.push({rows:rows.slice(4).map(row=>({...row,y:row.y+.132,z:row.z+.042}))});
 }
 const rootCard=strandMesh(upper,'#94612a','#f6d788','blonde-wind-root-prototype');
 const tipCard=strandMesh(lower,'#ba8743','#f8dc99','blonde-wind-tip-prototype');
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
  anchor.position.set(side*.134,-.025+.012*Math.sin(i*2.1),-.137+.045*side*side);
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
