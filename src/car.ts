import * as THREE from 'three';

/** Original hand-shaped touring coupe. Local +Z is the nose; wheels touch y=0. */
export function createCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: '#ed5438', roughness: .28, metalness: .38 });
  const dark = new THREE.MeshStandardMaterial({ color: '#182c35', roughness: .48 });
  const glass = new THREE.MeshStandardMaterial({ color: '#243f51', metalness: .55, roughness: .16 });
  const silver = new THREE.MeshStandardMaterial({ color: '#d3e4de', metalness: .8, roughness: .24 });
  const tire = new THREE.MeshStandardMaterial({ color: '#192124', roughness: .95 });
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, x=0,y=0,z=0) {
    const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; car.add(o); return o;
  }
  function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number) { return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z); }
  // Each station has its own width and shoulder height: a continuous sculpted shell.
  const stations=[[-2.35,.91,.69],[-2.08,1.08,.85],[-1.35,1.13,.96],[.35,1.08,.91],[1.55,1.04,.73],[2.3,.83,.53]];
  const verts:number[]=[]; const indices:number[]=[];
  for(const [z,w,h] of stations) {
    for(const [x,y] of [[-w*.83,.3],[-w,.48],[-w,h*.89],[-w*.72,h],[w*.72,h],[w,h*.89],[w,.48],[w*.83,.3]]) verts.push(x,y,z);
  }
  for(let s=0;s<stations.length-1;s++) for(let j=0;j<8;j++) { const a=s*8+j,b=s*8+(j+1)%8,c=b+8,d=a+8; indices.push(a,c,b,a,d,c); }
  for(let j=1;j<7;j++) { indices.push(0,j,j+1); const a=(stations.length-1)*8; indices.push(a,a+j+1,a+j); }
  const body=new THREE.BufferGeometry(); body.setAttribute('position',new THREE.Float32BufferAttribute(verts,3)); body.setIndex(indices); body.computeVertexNormals(); mesh(body,paint);
  box(1.81,.16,.16,dark,0,.37,2.22); box(1.92,.17,.13,dark,0,.36,-2.29);
  box(.1,.12,3.7,dark,-1.04,.36,-.1); box(.1,.12,3.7,dark,1.04,.36,-.1);
  // Low swept glazing, with a floating ivory roof and thick rear buttresses.
  const cabin=new THREE.BufferGeometry();
  cabin.setAttribute('position',new THREE.Float32BufferAttribute([-.84,.91,-1.08,.84,.91,-1.08,-.69,1.51,-.68,.69,1.51,-.68,-.65,1.48,.12,.65,1.48,.12,-.85,.9,.9,.85,.9,.9],3));
  const cabinIndices=[0,1,3,0,3,2,2,3,5,2,5,4,4,5,7,4,7,6,0,2,4,0,4,6,1,7,5,1,5,3];
  for(let i=0;i<cabinIndices.length;i+=3) [cabinIndices[i+1],cabinIndices[i+2]]=[cabinIndices[i+2],cabinIndices[i+1]];
  cabin.setIndex(cabinIndices); cabin.computeVertexNormals(); mesh(cabin,glass);
  const roof=box(1.42,.075,.87,new THREE.MeshStandardMaterial({color:'#fff1ca',roughness:.4}),0,1.53,-.3); roof.rotation.x=.03;
  for(const side of [-1,1]) {
    const pillar=box(.095,.68,.1,paint,side*.77,1.2,.48); pillar.rotation.x=-.85;
    box(.26,.13,.28,paint,side*1.18,1.01,.4);
    for(const z of [-1.45,1.38]) {
      const wheel=mesh(new THREE.CylinderGeometry(.46,.46,.27,24),tire,side*1.055,.46,z); wheel.rotation.z=Math.PI/2;
      const rim=mesh(new THREE.CylinderGeometry(.29,.29,.282,12),silver,side*1.065,.46,z); rim.rotation.z=Math.PI/2;
      const hub=mesh(new THREE.CylinderGeometry(.12,.12,.29,12),dark,side*1.07,.46,z); hub.rotation.z=Math.PI/2;
    }
    const lamp=new THREE.MeshStandardMaterial({color:'#ffddd1',emissive:'#ff361e',emissiveIntensity:1.4});
    box(.71,.085,.06,lamp,side*.55,.72,-2.36);
    box(.58,.085,.06,new THREE.MeshStandardMaterial({color:'#fff5d4',emissive:'#fff3bf',emissiveIntensity:.6}),side*.55,.57,2.3);
  }
  box(.36,.13,.025,new THREE.MeshStandardMaterial({color:'#eac98b'}),0,.47,-2.37);
  for(let i=0;i<6;i++) box(1.14,.025,.055,dark,0,.93-i*.017,-1.22-i*.13);
  box(1.87,.07,.2,paint,0,.93,-2.02);
  for(const x of [-.63,.63]) { const exhaust=mesh(new THREE.CylinderGeometry(.085,.085,.18,12),silver,x,.29,-2.38); exhaust.rotation.x=Math.PI/2; }
  return car;
}
