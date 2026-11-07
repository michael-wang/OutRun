import * as THREE from 'three';

type Row={x:number;y:number;z:number;width:number;shade:number};
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
    pos.push(r.x+side*r.width,r.y+(side===0?.006:0),r.z+(side===0?-.003:0));
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

/** Layered youthful Asian side-part, optimised for the rear chase camera.
 * A short tapered undercut fills the nape; 28 directional hair ribbons sit
 * OUTSIDE it at different lengths. Unlike the old continuous spherical dome,
 * the silhouette has separated ends, a side-swept crown and a natural nape.
 * Both are opaque static meshes: no new per-frame animation or texture loads.
 */
export function createDriverHair():THREE.Group{
 const group=new THREE.Group();group.name='driver-layered-short-hair';
 const dark=new THREE.Color('#192029'),light=new THREE.Color('#49515a');
 const rings=[
  {y:-.120,x:.082,z:.083},
  {y:-.078,x:.104,z:.116},
  {y:-.029,x:.132,z:.138},
  {y:.038,x:.139,z:.138},
 ] as const;
 const sides=18,position:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let r=0;r<rings.length;r++)for(let i=0;i<sides;i++){
  const angle=2*Math.PI*i/sides,ring=rings[r];
  const side=Math.sin(angle),back=Math.cos(angle);
  // Taper close to the neck. Keep the undercut almost black, not a glossy
  // helmet, and let the layered ribbons build the visible upper volume.
  position.push(side*ring.x+.007*r,ring.y+.003*Math.sin(angle*4),back*ring.z);
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
 for(let i=0;i<28;i++){
  const angle=(i+.35)*Math.PI*2/28;
  const sx=Math.sin(angle),sz=Math.cos(angle);
  const rear=Math.max(0,-sz),temple=Math.abs(sx);
  const fall=.101+rear*.056+(i%4)*.010+temple*.006;
  const rows:Row[]=[];
  for(let j=0;j<=6;j++){
   const t=j/6;
   rows.push({
    x:sx*(.068+.096*t)+.025*(1-t)+.015*Math.sin(t*2.8+angle)*t,
    y:.150-fall*t+.006*Math.sin(i*.81+t*4.4),
    z:sz*(.045+.105*t)-.019*t+.005*Math.sin(i*.65+t*5),
    width:(.024+(i%3)*.003)*(1-.71*t),
    shade:.79+.13*Math.sin(i*2.12)+.12*t,
   });
  }
  strands.push({rows});
 }
 const layers=strandMesh(strands,'#19232d','#56616a','driver-side-part-layered-strands');
 layers.material.roughness=.82;
 group.add(layers);
 return group;
}

/** Short layered blonde bob. Static crown is a single batched opaque mesh;
 * 5 small, double-jointed edge groups flutter independently with speed.
 * Hair is made of tapered shaded ribbons, not bulky spheres or particles. */
export function createBlondeBob():{root:THREE.Group;locks:THREE.Group[];sync:()=>void}{
 const root=new THREE.Group();root.name='layered-blonde-bob';
 const crown:Strand[]=[];
 for(let i=0;i<26;i++){
  const theta=i/26*Math.PI*2;
  const x=Math.cos(theta)*.111,z=Math.sin(theta)*.102;
  const length=.12+.105*Math.max(0,-Math.sin(theta))+.015*(i%3);
  const rows:Row[]=[];
  for(let step=0;step<=7;step++){
   const t=step/7;
   rows.push({
    x:x*(.66+.50*t)+Math.sin(t*Math.PI)*.008*Math.sin(theta),
    y:.145-length*t,
    z:z*(.67+.49*t)-.040*t,
    width:(.023+(i%4)*.003)*(1-.73*t),
    shade:.78+.14*Math.sin(i*5.15)+.13*t,
   });
  }
  crown.push({rows});
 }
 root.add(strandMesh(crown,'#9b672c','#f3ce78','blonde-layered-crown'));
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
    x:(j-1)*.014+Math.sin(t*2.2+1.04)*.014*t,
    y:-.015-.18*t-.024*t*t,
    z:-.012-.085*t+.013*Math.sin(t*Math.PI),
    width:(.023+.004*j)*(1-.80*t),
    shade:.84+.10*Math.sin(2+j)+.13*t,
   });
  }
  upper.push({rows:rows.slice(0,5)});
  lower.push({rows:rows.slice(4).map(row=>({...row,y:row.y+.13}))});
 }
 const rootCard=strandMesh(upper,'#94612a','#f6d788','blonde-wind-root-prototype');
 const tipCard=strandMesh(lower,'#ba8743','#f8dc99','blonde-wind-tip-prototype');
 const primary=new THREE.InstancedMesh(rootCard.geometry,rootCard.material,5);
 const secondary=new THREE.InstancedMesh(tipCard.geometry,tipCard.material,5);
 primary.name='blonde-wind-locks-batched';
 secondary.name='blonde-wind-tips-batched';
 primary.castShadow=secondary.castShadow=true;
 primary.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 secondary.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 root.add(primary,secondary);
 for(let i=0;i<5;i++){
  const anchor=new THREE.Group();anchor.name='blonde-hair-lock-'+i;
  anchor.position.set((i-2)*.054,-.025,-.109-(i%2)*.011);
  anchor.scale.setScalar(1+(i%3)*.042);
  root.add(anchor);
  const tip=new THREE.Group();tip.name='blonde-tip-joint';tip.position.y=-.13;
  anchor.add(tip);locks.push(anchor);
 }
 const matrix=new THREE.Matrix4();
 const sync=()=>{
  for(let i=0;i<locks.length;i++){
   const anchor=locks[i],tip=anchor.children[0];
   anchor.updateMatrix();tip.updateMatrix();
   primary.setMatrixAt(i,anchor.matrix);
   matrix.multiplyMatrices(anchor.matrix,tip.matrix);
   secondary.setMatrixAt(i,matrix);
  }
  primary.instanceMatrix.needsUpdate=true;
  secondary.instanceMatrix.needsUpdate=true;
 };
 sync();
 return {root,locks,sync};
}
