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

/** Thick, naturally side-parted short black hair of a young adult man.
 * From a rear chase camera the nape must remain DARK and full; a few hair
 * cards alone made the driver look bald. Two opaque meshes (volume + layers),
 * no per-frame mesh edits, no alpha sorting or texture download.
 */
export function createDriverHair():THREE.Group{
 const root=new THREE.Group();root.name='driver-natural-short-hair';
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const base=new THREE.Color('#1b252e'),light=new THREE.Color('#46505a');
 const sections=[
  {y:-.081,rx:.119,rz:.122},
  {y:-.053,rx:.151,rz:.146},
  {y:-.013,rx:.164,rz:.157},
  {y:.051,rx:.162,rz:.151},
  {y:.110,rx:.139,rz:.129},
  {y:.159,rx:.064,rz:.064},
 ] as const;
 const sides=28;
 for(const [k,ring] of sections.entries())for(let i=0;i<sides;i++){
  const angle=i*2*Math.PI/sides,side=Math.sin(angle),front=Math.cos(angle);
  // Low, natural tapered nape, slightly higher parted hairline in front.
  const y=ring.y+(k<2?Math.max(0,front)*.022:0)+Math.sin(i*5.7+k*.9)*.003;
  positions.push(side*ring.rx+.018*(k/sections.length),y,front*ring.rz);
  const variation=.26+.40*k/(sections.length-1)+.12*Math.sin(angle*3.2+.8);
  const color=base.clone().lerp(light,Math.max(.08,Math.min(.85,variation)));
  colors.push(color.r,color.g,color.b);
 }
 for(let k=0;k<sections.length-1;k++)for(let i=0;i<sides;i++){
  const a=k*sides+i,b=k*sides+(i+1)%sides,c=a+sides,d=b+sides;
  indices.push(a,c,b,b,c,d);
 }
 const tip=positions.length/3;
 positions.push(.018,.176,-.016);
 const peak=light.clone().multiplyScalar(1.04);colors.push(peak.r,peak.g,peak.b);
 const top=(sections.length-1)*sides;
 for(let i=0;i<sides;i++)indices.push(top+i,tip,top+(i+1)%sides);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const matte=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
 const scalp=new THREE.Mesh(geo,matte);
 scalp.name='driver-short-hair-volume';scalp.castShadow=true;root.add(scalp);
 // A modest swept fringe and individually shaded locks break the helmet
 // silhouette. These cards all share ONE opaque material/draw.
 const layers:Strand[]=[];
 for(let i=0;i<22;i++){
  const angle=(i+.4)*2*Math.PI/22;
  const sx=Math.sin(angle)*.09,sz=Math.cos(angle)*.085;
  const rows:Row[]=[];
  for(let j=0;j<=6;j++){
   const t=j/6;
   rows.push({
    x:sx*(.63+.55*t)+.039*t,
    y:.148-.088*t+.006*Math.cos(i*1.9),
    z:sz*(.6+.56*t)-.024*t,
    width:(.018+(i%3)*.002)*(1-.66*t),
    shade:.75+.17*Math.sin(i*2.6)+.10*t,
   });
  }
  layers.push({rows});
 }
 root.add(strandMesh(layers,'#1b242d','#4b5053','driver-short-hair-layered-strands'));
 return root;
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

/** One understated scarf tail, draped from the OUTSIDE shoulder and drawn
 * back over the deck. Previous two bright symmetrical streamers looked like
 * a life jacket. One narrow satin strip plus a tiny separate neck collar.
 */
export function createScarfTail():{root:THREE.Group;tail:THREE.Group}{
 const root=new THREE.Group();root.name='driver-silk-scarf';
 const tail=new THREE.Group();tail.name='driver-scarf-tail-0';
 tail.position.set(.025,.006,-.028);
 const rows:Row[]=[];
 for(let i=0;i<=18;i++){
  const t=i/18;
  rows.push({
   x:.013+.151*t+.021*t*Math.sin(t*4.2),
   y:.027+.13*Math.sin(Math.PI*t)-.040*t,
   z:-.025-.82*t,
   width:(.048-.021*t)*(1-.13*Math.sin(t*3.1)),
   shade:.79+.10*t+.07*Math.cos(t*18),
  });
 }
 tail.add(strandMesh([{rows}],'#b6aa9d','#e9ddd0','wind-scarf-fabric-0'));
 root.add(tail);
 return {root,tail};
}
