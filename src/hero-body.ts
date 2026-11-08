import * as THREE from 'three';

const cabinRear=-1.09,cabinFront=.66;
const cabinSteps=Math.ceil((cabinFront-cabinRear)/.12);

// The painted lip and leather return meet at this edge, in car coordinates.
function doorEdge(z:number){
 const t=THREE.MathUtils.clamp((z-cabinRear)/(cabinFront-cabinRear),0,1);
 return {x:.905+.013*t,y:.971-.038*t+.030*Math.sin(Math.PI*t)};
}

/** Sculpted, smoothly shaded GT spider exterior. Local +Z points toward the
 * nose. Geometry is baked ONCE, with no per-frame vertices or skinning.
 *
 * The 14-point U-shaped section has a narrow roof aperture along the cabin:
 * a dark seat well is visible from the chase camera, rather than a closed box.
 * End dimensions intentionally respect the already-accepted <2.7m x <5m
 * player collision/physics envelope and existing wheelbase.
 */
export function createSpiderShell():THREE.BufferGeometry{
 const profiles=[
  [-2.34,.80,.76],[-2.23,.96,.86],[-1.93,1.07,.93],
  [-1.48,1.10,.965],[cabinRear,1.08,.96],[cabinFront,1.07,.89],
  [1.05,1.06,.86],[1.58,1.00,.79],[2.31,.72,.61],
 ] as const;
 const rim:readonly (readonly [number,number])[]=[
  [-.69,.33],[-.96,.44],[-1,.59],[-.985,.75],[-.90,.88],
  [-.76,.99],[-.52,1.015],[.52,1.015],[.76,.99],
  [.90,.88],[.985,.75],[1,.59],[.96,.44],[.69,.33],
 ];
 const position:number[]=[],index:number[]=[];
 const side=rim.length;
 const catmull=(p0:number,p1:number,p2:number,p3:number,t:number)=>{
  const a=2*p1,b=-p0+p2,c=2*p0-5*p1+4*p2-p3,d=-p0+3*p1-3*p2+p3;
  return .5*(a+b*t+c*t*t+d*t*t*t);
 };
 const rows:{z:number}[]=[];
 for(let i=0;i<profiles.length-1;i++){
  const p0=profiles[Math.max(0,i-1)],p1=profiles[i],
   p2=profiles[i+1],p3=profiles[Math.min(profiles.length-1,i+2)];
  const steps=Math.max(2,Math.ceil((p2[0]-p1[0])/.12));
  for(let k=0;k<steps;k++){
   const t=k/steps;
   const z=THREE.MathUtils.lerp(p1[0],p2[0],t),
    w=catmull(p0[1],p1[1],p2[1],p3[1],t),
    h=catmull(p0[2],p1[2],p2[2],p3[2],t);
   rows.push({z});
   const edge=doorEdge(z);
   // Ease the narrow door shoulders into the closed rear deck and scuttle.
   const cabin=THREE.MathUtils.smoothstep(z,cabinRear-.22,cabinRear)*
    (1-THREE.MathUtils.smoothstep(z,cabinFront,cabinFront+.17));
   for(const [factor,lift] of rim){
    // Hood crown falls toward the nose; wide rear shoulder has clean
    // negative space between the cabin and the painted rear deck.
    let x=Math.abs(factor)*w,y=lift>.4?Math.min(h*lift+.002,1.04):lift;
    if(cabin&&lift>=.88){
     // Across the crown: inside edge, resting surface, outer rolled shoulder.
     const inner=lift>1,outer=lift===.88;
     x=THREE.MathUtils.lerp(x,inner?edge.x:outer?w*.988:edge.x+.052,cabin);
     y=THREE.MathUtils.lerp(y,edge.y+(inner?-.004:outer?-.050:0),cabin);
    }
    position.push(Math.sign(factor)*x,y,z);
   }
  }
 }
 const last=profiles[profiles.length-1];rows.push({z:last[0]});
 for(const [factor,lift] of rim)position.push(factor*last[1],lift>.4?Math.min(last[2]*lift+.002,1.04):lift,last[0]);
 for(let row=0;row<rows.length-1;row++){
  const middle=(rows[row].z+rows[row+1].z)*.5;
  for(let j=0;j<side;j++){
   // Roofless opening across the full cockpit. Not merely a decorative
   // gap in one 12cm segment of the centre deck.
   if(j===6&&middle>cabinRear&&middle<cabinFront)continue;
   const a=row*side+j,b=row*side+(j+1)%side,c=b+side,d=a+side;
   index.push(a,c,b,a,d,c);
  }
 }
 // End caps are shallow because the bumpers and diffuser are separate.
 for(let j=1;j<side-1;j++){
  index.push(0,j,j+1);
  const end=(rows.length-1)*side;index.push(end,end+j+1,end+j);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geometry.setIndex(index);
 geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 geometry.name='hero-spider-contoured-body';
 return geometry;
}


/** Cabin-facing trim, stitched to the shell's sill samples at the same Zs. */
export function createDoorLiner(side:number){
 const p:number[]=[],indices:number[]=[];
 for(let row=0;row<=cabinSteps;row++){
  const z=THREE.MathUtils.lerp(cabinRear,cabinFront,row/cabinSteps),edge=doorEdge(z);
  p.push(side*edge.x,edge.y-.004,z,side*(edge.x-.008),edge.y-.026,z,
   side*(edge.x-.009),.66,z,side*edge.x,.49,z);
  for(let col=0;row>0&&col<3;col++){
   const a=(row-1)*4+col;
   indices.push(a,a+1,a+4,a+1,a+5,a+4);
  }
 }
 // Close the footwell below the dash and behind the seat. The rear deck
 // and scuttle have no thickness of their own when viewed from inside.
 for(const z of [cabinRear,cabinFront]){
  const base=p.length/3,edge=doorEdge(z);
  p.push(0,.49,z,side*edge.x,.49,z,side*edge.x,edge.y-.004,z,0,edge.y-.004,z);
  if(z===cabinRear)indices.push(base,base+1,base+2,base,base+2,base+3);
  else indices.push(base,base+2,base+1,base,base+3,base+2);
 }
 if(side<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Rolled wheel opening. The inboard flange meets the body while the lip
 * clears the tyre at the top and leaves the wheel face visible from the side. */
export function createWheelBrow(side:number){
 const p:number[]=[],indices:number[]=[];
 for(let i=0;i<=20;i++){
  const a=Math.PI*i/20,up=Math.sin(a),along=Math.cos(a);
  for(const [x,r] of [[.69,.47],[.908,.504],[1.125,.519],[1.199,.50],[1.20,.482]]){
   const blend=THREE.MathUtils.smoothstep(x,.69,.908);
   p.push(side*x,r*up-(1-blend)*.22,r*along);
  }
  for(let j=0;i&&j<4;j++){
   const n=(i-1)*5+j;indices.push(n,n+1,n+5,n+1,n+6,n+5);
  }
 }
 if(side<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Slim aerodynamic GT mirror shell, model-space along the car's +Z axis.
 * At ~25cm across and 10cm tall this reads as a proper wing mirror rather
 * than the original cartoon lollipop; the dark glass inlay is batched in
 * the existing car materials.
 */
export function createGTWingMirrorHousing():THREE.BufferGeometry{
 const rings=[
  {z:-.071,w:.082,h:.030},
  {z:-.028,w:.118,h:.049},
  {z:.033,w:.116,h:.045},
  {z:.078,w:.048,h:.022},
 ] as const;
 const pos:number[]=[],indices:number[]=[];
 const sides=12;
 for(const ring of rings)for(let i=0;i<sides;i++){
  const angle=i*Math.PI*2/sides;
  pos.push(Math.sin(angle)*ring.w,Math.cos(angle)*ring.h,ring.z);
 }
 for(let k=0;k<rings.length-1;k++)for(let i=0;i<sides;i++){
  const a=k*sides+i,b=k*sides+(i+1)%sides,c=a+sides,d=b+sides;
  indices.push(a,c,b,b,c,d);
 }
 for(let i=1;i<sides-1;i++){
  indices.push(0,i+1,i);
  const n=(rings.length-1)*sides;
  indices.push(n,n+i,n+i+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingBox();
 geo.name='gt-wing-mirror-shell';
 return geo;
}

/** Twin speedster fairings faired into the rear deck, in the shell's paint. */
export function createRearTonneau():THREE.BufferGeometry{
 const position:number[]=[],index:number[]=[];
 const widths=[-.86,-.71,-.61,-.51,-.41,-.31,-.21,-.11,0,.11,.21,.31,.41,.51,.61,.71,.86];
 // From tail to seat: deck height, fairing height and half-width.
 const spans=[
  [-1.89,.936,.010,.13],[-1.70,.954,.060,.19],[-1.49,.965,.117,.24],
  [-1.29,.971,.164,.28],[-1.13,.973,.183,.30],[-1.045,.965,.163,.30],
  [-.995,.943,.091,.28],[-.98,.921,.012,.26],
 ];
 for(const [z,deck,height,radius] of spans)for(const x of widths){
  const u=Math.min(1,Math.abs(Math.abs(x)-.41)/radius);
  position.push(x,deck+height*(1-u*u)**2,z);
 }
 for(let row=0;row<spans.length-1;row++)for(let col=0;col<widths.length-1;col++){
  const a=row*widths.length+col,b=a+widths.length;
  index.push(a,b,a+1,a+1,b,b+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 geometry.name='hero-painted-rear-tonneau';
 return geometry;
}
