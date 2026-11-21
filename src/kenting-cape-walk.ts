import * as THREE from 'three';

type Ground=(station:number,lateral:number,lift:number)=>THREE.Vector3;
// Local trail control points, measured from the package anchor. Start on dry
// sand and approach the existing gallery apron from the beach side.
const waypoints=[[1018,-21],[1032,-24],[1052,-23],[1068,-26.5],[1082,-25.2],[1103,-26.7],[1120,-30.7],[1139,-30.1],[1155,-34.7],[1170,-34]];
const center=new THREE.CatmullRomCurve3(waypoints.map(([s,x])=>new THREE.Vector3(s,0,x)));
export function capeWalk(ground:Ground){
 const p:number[]=[],color:number[]=[],indices:number[]=[];
 const grit=new THREE.Color(0xaf997b),sand=new THREE.Color(0xb3a282),stone=new THREE.Color(0x978a76);
 const v=(point:THREE.Vector3,c:THREE.Color,tone:number)=>{p.push(point.x,point.y,point.z);color.push(c.r*tone,c.g*tone,c.b*tone);return p.length/3-1;};
 const quad=(a:number,b:number,c:number,d:number)=>indices.push(a,b,c,a,c,d);
 const sections=170, nodes=Array.from({length:sections+1},(_,i)=>{
  const t=i/sections,pt=center.getPointAt(t),tangent=center.getTangentAt(t);
  const landing=[.025,.35,.62,.80,.98].reduce((n,c)=>Math.max(n,Math.exp(-(((t-c)/.023)**2))),0);
  const half=.77+.16*Math.sin(9*t)+.12*Math.sin(23*t+.4)+.41*landing;
  const points=[-1,-.76,0,.74,1].map((u,j)=>{const offset=u*half*(1+.064*Math.sin(i*.41+j*1.81));return ground(pt.x-offset*tangent.z,pt.z+offset*tangent.x,j===0||j===4?-.047:.054);});
  return {s:pt.x,x:pt.z,y:points[2].y,points,landing};
 });
 for(let i=0;i<nodes.length;i++){
  const row=nodes[i];
  row.points.forEach((pt,j)=>v(pt,i<13?sand:grit,.97+.038*Math.sin(.81*i+j*.9)));
  if(i)for(let j=0;j<4;j++){const k=5*(i-1)+j;quad(k,k+1,k+6,k+5);}
 }
 let risers=0;let maxRiser=0;let flightLength=0;
 for(let i=1;i<sections;i++){
  const a=nodes[i],b=nodes[i+1],rise=b.y-a.y;
  if(rise<.064||a.landing>.59||flightLength>=6){flightLength=0;continue;}
  flightLength++;risers++;maxRiser=Math.max(rise,maxRiser);
  // Faces occupy the walking surface, sharing its crossfall. Both toes
  // intersect the underlying path. The margins stay irregular and buried.
  const face:number[]=[];
  for(const j of [1,3]){
   const foot=a.points[j].clone(),back=b.points[j].clone();
   const top=back.clone();top.y+=.026;const nose=foot.clone();nose.y+=rise+.026;
   const sole=foot.clone();sole.y-=.014;
   face.push(v(sole,stone,.77),v(nose,stone,.91),v(top,stone,.96+.045*Math.sin(i)));
  }
  quad(face[0],face[3],face[4],face[1]);quad(face[1],face[4],face[5],face[2]);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Packed sand trail and embedded stone flights';
 return {mesh,profile:{start:nodes[0].s,end:nodes.at(-1)!.s,risers,maxRiser,points:nodes.map(({s,x,y})=>({s,x,y}))}};
}
