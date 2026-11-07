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

/** Mature swept cut, not a spherical bowl. Graduated temples, side part and
 * swept strands are one opaque, double-sided draw with shaded vertex colours. */
export function createDriverHair():THREE.Group{
 const group=new THREE.Group();group.name='tailored-driver-hair';
 const strands:Strand[]=[];
 for(let i=0;i<23;i++){
  const theta=i/23*Math.PI*2;
  const x=Math.cos(theta)*.105,z=Math.sin(theta)*.095;
  const rows:Row[]=[];
  for(let step=0;step<=5;step++){
   const t=step/5;
   rows.push({
    x:x*(.62+.45*t)+.038*t,
    y:.144-(.08+.03*Math.max(0,-Math.sin(theta)))*t-.012*t*t,
    z:z*(.57+.54*t)-.065*t,
    width:(.023+(i%3)*.003)*(1-.72*t),
    shade:.80+.17*Math.sin(i*6.2+.7)+.05*t,
   });
  }
  strands.push({rows});
 }
 group.add(strandMesh(strands,'#11171c','#35393c','driver-swept-hair-sheets'));
 // The sides taper close to the temple, instead of a full hemispheric cap.
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

/** Two ribbon-tail scarf pieces, folded downwind, with no cloth solver or
 * per-frame vertex uploads. Waving changes only parent transforms. */
export function createScarfTails():{root:THREE.Group;tails:THREE.Group[]}{
 const root=new THREE.Group();root.name='driver-silk-scarf';
 const tails:THREE.Group[]=[];
 // Satin champagne is deliberately legible against a navy suit and the red
 // rear deck. Two substantial fabric tails sweep BACK over the rear haunch;
 // their arched silhouette is visible above the deck even in rear chase.
 for(let i=0;i<2;i++){
  const tail=new THREE.Group();tail.name='driver-scarf-tail-'+i;
  tail.position.set(i===0?-.068:.065,0,-.045);
  const rows:Row[]=[];
  for(let step=0;step<=17;step++){
   const t=step/17;
   const windLift=.06+Math.sin(t*Math.PI)*.18-t*.06;
   rows.push({
    x:(i===0?-.017:.023)+(i===0?-.125:.095)*t
      +Math.sin(t*4.6+i*1.7)*.035*t,
    y:windLift+.025*Math.sin(t*7.4+i),
    z:-.045-(i===0?.89:1.04)*t,
    width:(i===0?.090:.073)*(1-.61*t),
    shade:.83+.13*Math.cos(t*13+i)+.09*t,
   });
  }
  // The near end folds over the collar. Its pieces live in the SAME draw
  // as the long tail; no isolated fabric nodes or new cloth simulation.
  const pleat:Row[]=[
   {x:-.06,y:.005,z:.040,width:.055,shade:.87},
   {x:-.06,y:.025,z:-.015,width:.070,shade:1},
   {x:-.055,y:.075,z:-.09,width:.043,shade:1.03},
  ];
  const fabric=strandMesh(i===0?[{rows},{rows:pleat}]:[{rows}],
    i===0?'#bd873f':'#d9a259','#ffe5ab','wind-scarf-fabric-'+i);
  tail.add(fabric);
  root.add(tail);tails.push(tail);
 }
 return {root,tails};
}

/** Tailored low-crown flat cap, not bowl-cut hair. The fitted fabric crown,
 * folded rear band and forward bill share ONE vertex-coloured mesh/draw.
 * Its brim projects toward the car's +Z nose, while the taper/side seams
 * are visible from the rear chase camera.
 */
export function createFlatCap():THREE.Group{
 const group=new THREE.Group();group.name='driver-tailored-flat-cap';
 const positions:number[]=[],indices:number[]=[],colors:number[]=[];
 const color=(hex:string)=>new THREE.Color(hex);
 const crown=color('#40484b'),upper=color('#77766f'),band=color('#22282d'),bill=color('#343c41');
 const sides=20;
 const rings=[
  {y:-.056,rx:.133,rz:.116,shade:band},
  {y:-.038,rx:.147,rz:.128,shade:band},
  {y:.009,rx:.153,rz:.132,shade:crown},
  {y:.052,rx:.143,rz:.128,shade:crown},
  {y:.079,rx:.114,rz:.110,shade:upper},
 ];
 const push=(x:number,y:number,z:number,col:THREE.Color)=>{
  positions.push(x,y,z);colors.push(col.r,col.g,col.b);
 };
 for(const [r,ring] of rings.entries())for(let j=0;j<sides;j++){
  const a=j*Math.PI*2/sides;
  const subtleSeam=(j%5===0?.965:1);
  push(Math.sin(a)*ring.rx,ring.y+Math.cos(a*4)*.004,
       Math.cos(a)*ring.rz*subtleSeam,ring.shade);
 }
 for(let r=0;r<rings.length-1;r++)for(let j=0;j<sides;j++){
  const a=r*sides+j,b=r*sides+(j+1)%sides,c=a+sides,d=b+sides;
  indices.push(a,b,c,b,d,c);
 }
 const peak=positions.length/3;push(0,.095,-.018,upper);
 const top=(rings.length-1)*sides;
 for(let j=0;j<sides;j++)indices.push(top+j,top+(j+1)%sides,peak);
 // Slightly downturned fitted bill, with an under-surface dark edge.
 // These points form one continuous forward-pointing silhouette.
 const billStart=positions.length/3;
 for(const [z,w,y] of [[.096,.140,-.038],[.192,.133,-.048],[.267,.105,-.059]] as const)
  for(const x of [-1,0,1])push(x*w,y+(x===0?.004:0),z,bill);
 for(let row=0;row<2;row++)for(let k=0;k<2;k++){
  const a=billStart+row*3+k,b=a+3;
  indices.push(a,a+1,b,a+1,b+1,b);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const cap=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide,
 }));
 cap.name='driver-flat-cap-mesh';cap.castShadow=true;cap.receiveShadow=false;
 group.add(cap);
 return group;
}
