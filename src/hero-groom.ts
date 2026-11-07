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
export function createBlondeBob():{root:THREE.Group;locks:THREE.Group[]}{
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
 const locks:THREE.Group[]=[];
 for(let i=0;i<5;i++){
  const anchor=new THREE.Group();anchor.name='blonde-hair-lock-'+i;
  anchor.position.set((i-2)*.054,-.025,-.109-(i%2)*.011);
  root.add(anchor);
  const upper:Strand[]=[],lower:Strand[]=[];
  for(let j=0;j<3;j++){
   const rows:Row[]=[];
   for(let step=0;step<=8;step++){
    const t=step/8;
    rows.push({
     x:(j-1)*.014+(i-2)*.006+Math.sin(t*2.2+i*.52)*.014*t,
     y:-.015-.18*t-.024*t*t,
     z:-.012-.085*t+.013*Math.sin(t*Math.PI),
     width:(.023+.004*j)*(1-.80*t),
     shade:.84+.10*Math.sin(i+j)+.13*t,
    });
   }
   upper.push({rows:rows.slice(0,5)});
   lower.push({rows:rows.slice(4).map(row=>({...row,y:row.y+.13}))});
  }
  anchor.add(strandMesh(upper,'#94612a','#f6d788','blonde-wind-ribbons-'+i));
  const tip=new THREE.Group();tip.name='blonde-tip-joint';tip.position.y=-.13;
  tip.add(strandMesh(lower,'#ba8743','#f8dc99','blonde-tip-sheets-'+i));
  anchor.add(tip);
  locks.push(anchor);
 }
 return {root,locks};
}

/** Two ribbon-tail scarf pieces, folded downwind, with no cloth solver or
 * per-frame vertex uploads. Waving changes only parent transforms. */
export function createScarfTails():{root:THREE.Group;tails:THREE.Group[]}{
 const root=new THREE.Group();root.name='driver-silk-scarf';
 const tails:THREE.Group[]=[];
 for(let i=0;i<2;i++){
  const tail=new THREE.Group();tail.name='driver-scarf-tail-'+i;
  tail.position.set(i===0?-.05:.06,0,-.05);
  const rows:Row[]=[];
  for(let step=0;step<=11;step++){
   const t=step/11;
   rows.push({
    x:(i===0?-.038:.038)+Math.sin(t*3.1+i)*.028*t,
    y:-.03-.15*t+Math.sin(t*2.6+i*.6)*.014*t,
    z:-.04-.36*t,
    width:.058*(1-.52*t),
    shade:.82+.12*Math.cos(t*13+i)+.07*t,
   });
  }
  tail.add(strandMesh([{rows}],i===0?'#afc7c4':'#adbbb5','#f0e4d4',
    'wind-scarf-fabric-'+i));
  root.add(tail);tails.push(tail);
 }
 return {root,tails};
}
