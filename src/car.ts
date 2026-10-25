import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Original roofless coastal roadster. +Z nose; unchanged wheelbase and ground contact. */
export function createCar() {
  const car=new THREE.Group();car.name='coastal-roadster';
  const material=(color:string,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const paint=material('#ed5438',.3,.38), dark=material('#182c35'), silver=material('#d3e4de',.24,.8);
  const tire=material('#192124',.95), leather=material('#d6a467',.8), seam=material('#805c3b',.8);
  const glass=new THREE.MeshStandardMaterial({color:'#a6d7df',transparent:true,opacity:.32,roughness:.12,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Group=car){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function oval(sx:number,sy:number,sz:number,m:THREE.Material,x:number,y:number,z:number,parent=car){const o=mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
  function bar(a:number[],b:number[],r:number,m:THREE.Material,parent=car){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  // Continuous shoulder/body surfaces, with an actual aperture between the rear deck and dash.
  const stations=[[-2.35,.91,.69],[-2.08,1.08,.85],[-1.35,1.13,.96],[-1.1,1.12,.95],[.65,1.07,.88],[1.55,1.04,.73],[2.3,.83,.53]];
  const verts:number[]=[],indices:number[]=[];
  for(const [z,w,h] of stations)for(const [x,y] of [[-w*.83,.3],[-w,.48],[-w,h*.89],[-w*.72,h],[w*.72,h],[w,h*.89],[w,.48],[w*.83,.3]])verts.push(x,y,z);
  for(let s=0;s<stations.length-1;s++)for(let j=0;j<8;j++){if(s===3&&j===3)continue;const a=s*8+j,b=s*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c);}
  for(let j=1;j<7;j++){indices.push(0,j,j+1);const a=(stations.length-1)*8;indices.push(a,a+j+1,a+j);}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));body.setIndex(indices);body.computeVertexNormals();mesh(body,paint);
  box(1.5,.1,1.72,dark,0,.51,-.22); // recessed cockpit floor, not a roof
  for(const side of [-1,1]){
    box(.075,.34,1.72,leather,side*.77,.72,-.22);
    bar([side*.8,.95,-1.08],[side*.77,.89,.65],.035,silver);
    oval(.34,.12,.4,leather,side*.41,.65,-.37);
    const seat=box(.61,.52,.17,leather,side*.41,.88,-.87);seat.rotation.x=-.12;
    oval(.21,.14,.1,leather,side*.41,1.16,-.9);
    for(const x of [-.17,.17])bar([side*.41+x,.7,-.975],[side*.41+x,1.08,-.92],.014,seam);
    // Two compact roll hoops behind the seats, leaving the cockpit visibly open.
    for(const x of [-.22,.22])bar([side*.41+x,.95,-1.08],[side*.41+x,1.22,-1.08],.035,silver);
    bar([side*.41-.22,1.22,-1.08],[side*.41+.22,1.22,-1.08],.035,silver);
    box(.26,.13,.28,paint,side*1.18,1.01,.4);
    box(.19,.085,.025,silver,side*1.18,1.02,.25);
    for(const z of [-1.45,1.38]){
      const brow=mesh(new THREE.TorusGeometry(.49,.065,6,18,Math.PI),paint,side*1.055,.46,z);brow.rotation.y=Math.PI/2;
      const wheel=mesh(new THREE.CylinderGeometry(.46,.46,.27,24),tire,side*1.055,.46,z);wheel.rotation.z=Math.PI/2;
      const rim=mesh(new THREE.CylinderGeometry(.3,.3,.282,16),silver,side*1.065,.46,z);rim.rotation.z=Math.PI/2;
      const hub=mesh(new THREE.CylinderGeometry(.12,.12,.29,12),dark,side*1.07,.46,z);hub.rotation.z=Math.PI/2;
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;bar([side*1.21,.46+Math.cos(a)*.14,z+Math.sin(a)*.14],[side*1.21,.46+Math.cos(a)*.27,z+Math.sin(a)*.27],.024,dark);}
    }
    box(.1,.12,3.7,dark,side*1.04,.36,-.1);
  }
  box(.16,.21,1.14,dark,0,.65,-.1);box(.11,.025,.25,silver,0,.77,-.12);
  box(1.48,.15,.26,dark,0,.86,.53);
  // Transparent swept windscreen, no rear glazing or opaque cabin/roof.
  const screen=new THREE.BufferGeometry();screen.setAttribute('position',new THREE.Float32BufferAttribute([-.78,.9,.78,.78,.9,.78,-.68,1.43,.43,.68,1.43,.43],3));screen.setIndex([0,1,2,2,1,3]);screen.computeVertexNormals();mesh(screen,glass);
  for(const side of [-1,1])bar([side*.78,.9,.78],[side*.68,1.43,.43],.035,silver);
  bar([-.68,1.43,.43],[.68,1.43,.43],.03,silver);
  bar([-.78,.9,.78],[.78,.9,.78],.03,dark);
  const wheel=mesh(new THREE.TorusGeometry(.17,.025,6,16),dark,-.41,1.01,.26);wheel.rotation.x=-.45;
  bar([-.41,.9,.45],[-.41,1.01,.26],.035,dark);
  // Original, intentionally simple travelers: teal-shirted driver and cream-shirted passenger.
  for(const [side,name,shirtColor,hairColor,skinColor] of [[-1,'driver','#197b80','#242b30','#c98c60'],[1,'passenger','#fff0d1','#623627','#edb88c']] as const){
    const person=new THREE.Group();person.name=name;car.add(person);const x=side*.41;
    const shirt=material(shirtColor,.85),hair=material(hairColor,.9),skin=material(skinColor,.85);
    oval(.225,.29,.16,shirt,x,1.03,-.48,person);
    oval(.13,.075,.12,skin,x,1.3,-.46,person);
    oval(.17,.21,.17,skin,x,1.47,-.45,person);
    oval(.178,.135,.18,hair,x,1.57,-.48,person);
    // Tiny sunglasses and nose read as faces in the inspection view, without texture assets.
    for(const eye of [-1,1])oval(.057,.035,.025,dark,x+eye*.075,1.49,-.287,person);
    bar([x-.07,1.49,-.28],[x+.07,1.49,-.28],.012,dark,person);
    oval(.035,.05,.045,skin,x,1.44,-.28,person);
    if(side===1){oval(.13,.19,.1,hair,x,1.43,-.6,person);oval(.075,.18,.065,hair,x+.08,1.28,-.65,person);}
    for(const arm of [-1,1]){
      const shoulder=[x+arm*.19,1.16,-.45],elbow=[x+arm*.24,.99,-.17],hand=side===-1?[x+arm*.13,1.04,.23]:[x+arm*.13,.8,-.1];
      bar(shoulder,elbow,.065,shirt,person);bar(elbow,hand,.048,skin,person);oval(.055,.055,.055,skin,...hand as [number,number,number],person);
    }
    batch(person);
  }
  box(1.74,.12,.12,dark,0,.34,2.34);box(1.92,.17,.13,dark,0,.36,-2.29);
  const rear=material('#b51e22',.3);rear.emissive.set('#d62717');rear.emissiveIntensity=.55;
  const lamp=material('#fff2cf',.3);lamp.emissive.set('#fff3bf');lamp.emissiveIntensity=.6;
  for(const side of [-1,1]){
    box(.74,.14,.065,dark,side*.55,.7,-2.34);box(.63,.075,.07,rear,side*.55,.71,-2.38);
    box(.58,.085,.06,lamp,side*.55,.57,2.3);
    const exhaust=mesh(new THREE.CylinderGeometry(.075,.075,.18,12),silver,side*.63,.29,-2.38);exhaust.rotation.x=Math.PI/2;
  }
  box(.36,.13,.025,leather,0,.47,-2.37);
  for(let i=0;i<4;i++)box(.78,.025,.045,dark,0,.92-i*.025,-1.4-i*.13);
  box(1.87,.06,.15,paint,0,.91,-2.02);
  batch(car);return car;
}

/** Static material batches keep the more detailed cockpit cheap to draw. */
function batch(group:THREE.Group){
  const byMaterial=new Map<THREE.Material,THREE.BufferGeometry[]>();
  for(const child of [...group.children]){
    if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.transparent)continue;
    child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
    for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);
    g.applyMatrix4(child.matrix);const list=byMaterial.get(child.material)??[];list.push(g);byMaterial.set(child.material,list);group.remove(child);child.geometry.dispose();
  }
  for(const [material,geometries] of byMaterial){const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!g)throw new Error('Car geometry batch failed');const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
}
