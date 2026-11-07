import * as THREE from 'three';
export type CoastVolumePart={position:number[];normal:number[];uv:number[];color:number[]};
/** Actual convex 3D canopy lobes, not alpha-tested flat texture cards.
 * 11 softly overlapping irregular icosahedra form a continuous broad crown.
 * Source coordinates are normalized to the existing imported bark geometry;
 * placing/scaling/culling still uses the ONE accepted CommonTree_3 asset.
 * Each authored foliage part is shared and InstancedMesh-batched off-thread.
 */
const canopyLobes:readonly (readonly number[])[]=[
 [0,.76,0,.145,.165,.143],
 [-.115,.73,.025,.110,.132,.117],
 [.111,.70,-.034,.115,.151,.118],
 [.026,.82,.104,.108,.13,.099],
 [-.016,.81,-.106,.116,.143,.12],
 [.105,.86,.042,.095,.118,.095],
 [-.103,.87,-.068,.09,.108,.103],
 [.013,.93,.015,.091,.10,.09],
 [-.16,.65,.02,.077,.087,.081],
 [.145,.63,.061,.079,.087,.076],
 [0,.62,-.122,.089,.084,.083],
 [0,.63,.125,.082,.076,.080],
] as const;
/** Shrubs use the SAME opaque rounded-lobe design language as the trees.
 * The former Bush_Common alpha card looked like a flat green cutout. */
const shrubLobes:readonly (readonly number[])[]=[
 [0,.43,0,.43,.37,.44],
 [-.29,.42,.14,.28,.27,.30],
 [.27,.39,-.14,.31,.29,.31],
 [.07,.67,.12,.28,.27,.29],
 [-.08,.58,-.21,.30,.25,.30],
] as const;
function bakeLobes(lobes:readonly (readonly number[])[],shrub:boolean):CoastVolumePart{
 const position:number[]=[],normal:number[]=[],uv:number[]=[],color:number[]=[];
 const palette=(shrub?['#3e6135','#658145','#789151','#537343']:
  ['#364e32','#577544','#789455','#49683e','#6d8850']).map(c=>new THREE.Color(c));
 const colour=new THREE.Color();
 lobes.forEach((l,i)=>{
  const [x,y,z,sx,sy,sz]=l,geometry=new THREE.IcosahedronGeometry(1,1);
  geometry.scale(sx,sy,sz);geometry.translate(x,y,z);
  const vertices=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
  const root=palette[i%palette.length];
  for(let j=0;j<vertices.count;j++){
   position.push(vertices.getX(j),vertices.getY(j),vertices.getZ(j));
   const ny=normals.getY(j);
   normal.push(normals.getX(j),ny,normals.getZ(j));
   const grad=.76+.16*Math.max(0,ny)+.08*Math.sin((i+1)*1.93+j*.07);
   colour.copy(root).multiplyScalar(grad);
   color.push(colour.r,colour.g,colour.b);
  }
  geometry.dispose();
 });
 return {position,normal,uv,color};
}
let fullTree:CoastVolumePart|undefined,roundBush:CoastVolumePart|undefined;
export const coastTreeVolume=()=>fullTree??=bakeLobes(canopyLobes,false);
export const coastBushVolume=()=>roundBush??=bakeLobes(shrubLobes,true);
