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

/** Silver side-part with a fixed undercut and individually swept ends. */
export function createDriverHair():WindGroom{
 const group=new THREE.Group();group.name='driver-layered-short-hair';
 const dark=new THREE.Color('#737880'),light=new THREE.Color('#d4d4d2');
 const rings=[
  {y:-.155,x:.104,z:.126},
  {y:-.109,x:.127,z:.140},
  {y:-.029,x:.132,z:.138},
  {y:.038,x:.139,z:.138},
  {y:.094,x:.123,z:.114},
  {y:.133,x:.090,z:.071},
  {y:.150,x:.060,z:.041},
  {y:.153,x:.002,z:.002},
 ] as const;
 const sides=18,position:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let r=0;r<rings.length;r++)for(let i=0;i<sides;i++){
  const angle=2*Math.PI*i/sides,ring=rings[r];
  const side=Math.sin(angle),back=Math.cos(angle);
  position.push(side*ring.x+Math.min(.024,.007*r),ring.y+.003*Math.sin(angle*4),back*ring.z);
  const tone=.16+.19*r/3+.08*Math.sin(angle*3.2+i*.27);
  const c=dark.clone().lerp(light,Math.max(.04,tone));
  colors.push(c.r,c.g,c.b);
 }
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
  const a=r*sides+i,b=r*sides+(i+1)%sides,c=a+sides,d=b+sides;
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const undercut=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.88,metalness:0,side:THREE.DoubleSide,
 }));
 undercut.name='driver-tapered-nape';undercut.castShadow=true;group.add(undercut);
 // Same layer technique as the accepted female bob, but cropped at the ears:
 // narrow distinct locks swept slightly to the man's right, with staggered
 // tip heights and directional low-contrast vertex highlights.
 const strands:Strand[]=[];
 const shapes:number[][]=[[],[],[],[]];
 for(let i=0;i<26;i++){
  const angle=(i+.35)*Math.PI*2/26;
  const sx=Math.sin(angle),sz=Math.cos(angle);
  const rear=Math.max(0,-sz),temple=Math.abs(sx);
  const fall=.190+rear*.076+(i%4)*.012+temple*.010;
  const rows:Row[]=[];
  for(let j=0;j<=5;j++){
   const t=j/5,arc=t*Math.PI*.64;
   const spread=Math.sin(arc),sweep=angle+.56*(1-t);
   rows.push({
    x:Math.sin(sweep)*(.064+.104*spread)+.025*(1-t)+.011*Math.sin(t*2.8+angle)*t,
    y:.155-fall*t*t+.006*Math.sin(i*.81+t*4.4),
    z:Math.cos(sweep)*(.045+.112*spread)-.019*t+.005*Math.sin(i*.65+t*5),
    sweep,width:(.024+(i%3)*.003)*(1-.93*t*t),
    shade:.79+.13*Math.sin(i*2.12)+.12*t,
   });
   const flex=t*t*(.68+.32*rear),wave=angle*2.7-t*2.4;
   // Each ridged row has three vertices. The parting is pinned while
   // the tips lift and separate at different phases around the head.
   for(let v=0;v<3;v++){
    shapes[0].push(sx*.023*flex,.066*flex,-.10*flex);
    shapes[1].push(.072*flex,0,0);
    for(let k=0;k<2;k++){
     const ripple=flex*Math.sin(wave+k*Math.PI/2);
     shapes[2+k].push(.023*ripple,.024*ripple,-.012*ripple);
    }
   }
  }
  strands.push({rows});
 }
 const layers=strandMesh(strands,'#8e939a','#f7f6ef','driver-side-part-layered-strands');
 setWindShapes(layers.geometry,shapes);layers.updateMorphTargets();
 layers.material.roughness=.82;
 group.add(layers);
 return {root:group,sync(wind,sway,tipSway,phase){
  const weights=layers.morphTargetInfluences!;
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
