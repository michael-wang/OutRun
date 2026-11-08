import * as THREE from 'three';

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
  [-1.48,1.10,.965],[-1.09,1.08,.96],[.66,1.07,.89],
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
   for(const [factor,lift] of rim){
    // Hood crown falls toward the nose; wide rear shoulder has clean
    // negative space between the cabin and the painted rear deck.
    position.push(factor*w,lift>.4?Math.min(h*lift+.002,1.04):lift,z);
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
   if(j===6&&middle>-1.09&&middle<.66)continue;
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


/** The door skin returns over the sill and down inside the open cockpit.
 * +Z runs from the rear shut line to the front hinge below the mirror. */
export function createRoadsterDoor(side:number){
 const positions:number[]=[],indices:number[]=[];
 const stations=[
  // z, inner edge, widest part of the skin, sill height, lower edge
  [-1.015,.79,1.067,.949,.49],[-.96,.785,1.085,.978,.483],
  [-.68,.782,1.094,.982,.475],[-.36,.782,1.094,.982,.472],
  [-.15,.785,1.090,.977,.471],[.27,.789,1.086,.946,.478],
  [.53,.793,1.078,.929,.49],[.59,.799,1.065,.909,.51],
 ];
 const ringSize=8;
 for(const [row,[z,inner,outer,top,bottom]] of stations.entries()){
  // A broad upper ledge under the driver's resting arm rolls into the outer panel.
  const section=[[inner,.70],[inner,top-.035],[inner+.039,top-.004],
   [.895,top],[outer-.052,top-.022],[outer,top-.112],
   [outer-.004,bottom+.066],[outer-.031,bottom]];
  for(const [x,y] of section)positions.push(side*x,y,z);
  if(!row)continue;
  for(let i=0;i<ringSize;i++){
   const a=(row-1)*ringSize+i,b=(row-1)*ringSize+(i+1)%ringSize;
   indices.push(a,a+ringSize,b,b,a+ringSize,b+ringSize);
  }
 }
 const last=(stations.length-1)*ringSize;
 for(let i=1;i<ringSize-1;i++)indices.push(0,i,i+1,last,last+i+1,last+i);
 if(side<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
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
