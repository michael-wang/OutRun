import * as T from 'three';

// Shared city foliage. Opaque lobes, forked trunks and a mipmapped leaf pattern
// survive oblique, high-speed views without alpha sorting or camera-facing cards.
export function createParkTrees(scene, cityChunks, physicalPos) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const g = canvas.getContext('2d');
  let seed = 74329;
  const noise = () => ((seed = Math.imul(seed, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
  g.fillStyle = '#bbc3a7';
  g.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 670; i++) {
    const value = Math.round(145 + noise() * 95);
    g.fillStyle = 'rgb(' + value + ',' + Math.min(255,value+7) + ',' + (value-19) + ')';
    const x = noise()*96, y = noise()*96, angle = noise()*3, length = 1.8+noise()*4;
    for(const dx of [0,x<8?96:-96]) for(const dy of [0,y<8?96:-96]){
      g.beginPath(); g.ellipse(x+dx,y+dy,length,.7+length*.28,angle,0,Math.PI*2); g.fill();
    }
  }
  const map = new T.CanvasTexture(canvas);
  map.wrapS=map.wrapT=T.RepeatWrapping; map.repeat.set(3,2); map.colorSpace=T.SRGBColorSpace;
  const crown = new T.SphereGeometry(1,10,5);
  const positions=crown.attributes.position, colors=[];
  const shadow=new T.Color(0x849377), tip=new T.Color(0xe7ebbd);
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const edge=1+.117*Math.sin(6*x+3*y+2*z)+.095*Math.cos(5*z-3*x+4*y)+.052*Math.sin(13*x+5*z);
    positions.setXYZ(i,x*edge+.12*y,y*(edge*.47+.53)+.08*Math.sin(5*x-4*z),z*edge);
    const tone=shadow.clone().lerp(tip,T.MathUtils.clamp(.47+.42*y+.12*Math.sin(7*x+5*z),0,1));colors.push(tone.r,tone.g,tone.b);
  }
  crown.setAttribute('color',new T.Float32BufferAttribute(colors,3));crown.computeVertexNormals();
  const leaf=new T.MeshLambertMaterial({map,vertexColors:true}), wood=new T.MeshLambertMaterial({color:0x796952});
  // Small, opaque-tested leaf sprays break the smooth outline of the shared
  // crown without multiplying its solid geometry or its shadow passes.
  const stamp=document.createElement('canvas');stamp.width=stamp.height=64;
  const brush=stamp.getContext('2d');
  for(let j=0;j<32;j++){const angle=noise()*Math.PI*2,r=Math.sqrt(noise());
    const x=32+Math.cos(angle)*r*23,y=32+Math.sin(angle)*r*17;
    brush.fillStyle=['#5d744c','#758959','#879760','#687e54'][j%4];
    brush.beginPath();brush.ellipse(x,y,4+noise()*3,2.2+noise()*1.6,angle*.58,0,Math.PI*2);brush.fill();
  }
  const sprayMap=new T.CanvasTexture(stamp);sprayMap.colorSpace=T.SRGBColorSpace;
  const sprayMaterial=new T.MeshLambertMaterial({map:sprayMap,alphaTest:.46,side:T.DoubleSide});
  const spray=new T.PlaneGeometry(1,1);const normals=spray.attributes.normal;
  for(let i=0;i<normals.count;i++)normals.setXYZ(i,0,1,0);
  const trunk=new T.CylinderGeometry(.64,1,1,6),unit=new T.Object3D(),up=new T.Vector3(0,1,0);
  const cells=new Map(),palette=[0x8ca96e,0x96aa6b,0x829e76,0x9daa75];
  function plantWorld(d,position,h,width=1){
    const origin=new T.Vector3(...position),key=Math.floor(d/190);
    const cell=cells.get(key)||{wood:[],crowns:[],tones:[],sprays:[]};cells.set(key,cell);
    const phase=position[0]*.193+position[2]*.117, broad=(.86+.17*Math.cos(phase*2.3))*width;
    const tilt=new T.Vector3(.055*h*Math.sin(phase),0,.039*h*Math.cos(phase));
    function branch(a,b,w){
      const v=b.clone().sub(a);unit.position.copy(a).lerp(b,.5);
      unit.quaternion.setFromUnitVectors(up,v.clone().normalize());unit.scale.set(w,v.length(),w);
      unit.updateMatrix();cell.wood.push(unit.matrix.clone());
    }
    const fork=origin.clone().addScaledVector(up,h*.43).add(tilt);branch(origin,fork,h*.028);
    for(let i=0;i<5;i++){
      const angle=phase+2.4*i, central=i===4;
      const radius=h*broad*(central?.04:.20+.06*Math.cos(i+phase));
      const center=origin.clone().add(tilt).add(new T.Vector3(Math.cos(angle)*radius,h*(central?.85:.66+.085*Math.sin(angle*1.7)),Math.sin(angle)*radius));
      if(!central)branch(fork,center,h*.011);
      unit.position.copy(center);unit.rotation.set(.13*Math.sin(angle),angle,.12*Math.cos(angle));
      const size=(central?.30:.31+.035*Math.sin(i+phase))*h;
      unit.scale.set(size*broad,size*(.69+.13*Math.cos(angle)),size*broad*(.82+.12*Math.sin(angle)));
      unit.updateMatrix();cell.crowns.push(unit.matrix.clone());
      if(!central){for(const fan of [-.68,.63]){
        const a=angle+fan;
        unit.position.copy(center).add(new T.Vector3(Math.cos(a)*size*broad*.83,size*(fan<0?.19:-.20),Math.sin(a)*size*broad*.83));
        unit.rotation.set(-.29,Math.PI/2-a,.19*fan);unit.scale.set(size*.98,size*.79,1);
        unit.updateMatrix();cell.sprays.push(unit.matrix.clone());
      }}
      cell.tones.push(new T.Color(palette[(Math.floor(Math.abs(phase)*.7)+(central?1:i%2))%palette.length]));
    }
  }
  function plant(d,x,y,h,width=1){plantWorld(d,physicalPos(d,x,y),h,width);}
  function finish(){for(const [key,cell] of cells){
    for(const [geom,material,matrices,tones] of [[trunk,wood,cell.wood,null],[crown,leaf,cell.crowns,cell.tones],[spray,sprayMaterial,cell.sprays,null]]){
      const mesh=new T.InstancedMesh(geom,material,matrices.length);
      matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);if(tones)mesh.setColorAt(i,tones[i]);});
      mesh.computeBoundingSphere();mesh.name=geom===spray?'city leaf sprays':tones?'city tree crowns':'city tree branches';
      mesh.castShadow=Boolean(tones);mesh.receiveShadow=true;scene.add(mesh);cityChunks.push({at:key*190+95,mesh});
    }
  }}
  return {plant,plantWorld,finish};
}
