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
