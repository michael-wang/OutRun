import * as THREE from 'three';
import sites from '../content/stages/coast/gull-sites.json';
import layout from '../content/stages/coast/scenic-layout.json';
import {gullAsset} from './assets/coast-gull';
import type {createTrack} from './track';
type Sample=ReturnType<typeof createTrack>['sample'];
const tau=2*Math.PI;
function seeded(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

/** One draw for the visible site. Wings deform in local space before banking.
 * Distant sites keep no per-frame vertex or matrix work. */
export function addCoastGullFlights(parent:THREE.Object3D,sample:Sample,tower:{station:number;position:THREE.Vector3}){
 const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
 const vertex=new THREE.Vector3(),rotation=new THREE.Euler(0,0,0,'YXZ');
 const zones=sites.map(site=>{
  const anchor=site.anchor==='lighthouse'?tower.station:layout.heroAnchors.find(a=>a.id===site.anchor)!.roadDistance;
  const station=anchor+site.offset,frame=sample(station);
  const center=site.anchor==='lighthouse'?tower.position.clone():frame.position.clone().addScaledVector(frame.right,site.lateral);
  if(site.anchor!=='lighthouse')center.y=-5;
  center.y+=site.altitude;
  const random=seeded(site.seed),birds=Array.from({length:site.count},(_,i)=>({
   phase:(i+.82*random())*tau/site.count,orient:random()*tau,
   radius:site.radius*(.80+random()*.74),aspect:.56+.41*random(),omega:(.18+.15*random())*(i===3?-1:1),
   height:(random()-.4)*5,scale:.87+.21*random(),gust:random()*tau,cadence:.42+.18*random(),
   xyz:new THREE.Vector3(),bank:0,flap:0
  }));
  const source=gullAsset.positions,xyz=new Float32Array(source.length*birds.length),rgb=new Float32Array(xyz.length);
  birds.forEach((_,i)=>rgb.set(gullAsset.colors,i*source.length));
  const geometry=new THREE.BufferGeometry(),attribute=new THREE.BufferAttribute(xyz,3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position',attribute);geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3));
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),site.radius*2.2+9);
  const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(center);mesh.name=site.id+' gulls';mesh.visible=false;parent.add(mesh);
  return {site,station,mesh,birds,attribute};
 });
 const update=(time:number,distance:number)=>{
  for(const {site,station,mesh,birds,attribute} of zones){
   mesh.visible=Math.abs(distance-station)<site.range;if(!mesh.visible)continue;
   let index=0;
   for(const b of birds){
    const a=time*b.omega+b.phase,twice=2*a+b.gust;
    const x=b.radius*(Math.cos(a)+.13*Math.cos(twice)),z=b.radius*b.aspect*Math.sin(a);
    const dx=b.radius*(-Math.sin(a)-.26*Math.sin(twice))*b.omega,dz=b.radius*b.aspect*Math.cos(a)*b.omega;
    const co=Math.cos(b.orient),si=Math.sin(b.orient);
    const height=b.height+1.35*Math.sin(a+b.gust)+.56*Math.sin(time*.38+b.phase);
    b.xyz.set(co*x-si*z,height,si*x+co*z);
    const dy=1.35*Math.cos(a+b.gust)*b.omega+.213*Math.cos(time*.38+b.phase);
    b.bank=Math.sign(b.omega)*(.23+.12*Math.cos(twice));
    rotation.set(-Math.atan2(dy,Math.hypot(dx,dz)),Math.atan2(co*dx-si*dz,si*dx+co*dz),b.bank);
    const burst=THREE.MathUtils.smoothstep(Math.cos(time*b.cadence+b.gust),.65,.96);
    b.flap=burst*.42*Math.sin(time*(7.3+b.cadence*2)+b.phase);
    const vertices=gullAsset.positions;
    for(let j=0;j<vertices.length;j+=3){
     const xx=vertices[j],w=THREE.MathUtils.smoothstep(Math.abs(xx),.13,.98);
     vertex.set(xx,vertices[j+1]+w*b.flap,vertices[j+2]).multiplyScalar(b.scale).applyEuler(rotation).add(b.xyz);
     attribute.setXYZ(index++,vertex.x,vertex.y,vertex.z);
    }
   }
   attribute.needsUpdate=true;
  }
 };
 const inspect=()=>zones.map(({site,station,mesh,birds})=>({id:site.id,station,active:mesh.visible,count:birds.length,center:mesh.position.toArray(),triangles:mesh.geometry.getAttribute('position').count/3,birds:mesh.visible?birds.map(b=>({position:b.xyz.clone().add(mesh.position).toArray(),bank:b.bank,flap:b.flap})):[]}));
 return {update,inspect};
}
