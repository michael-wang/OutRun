import * as THREE from 'three';
import { createCar } from './car';
import { createTrack } from './track';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createWorld() {
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#9bd8ea'); scene.fog=new THREE.Fog('#b7dce5',180,1100);
  scene.add(new THREE.HemisphereLight('#e3f7ff','#a09162',1.65));
  const sun=new THREE.DirectionalLight('#fff0c9',2.8); sun.position.set(-180,280,-100); scene.add(sun);
  sun.castShadow=true; const shadowSize=matchMedia('(pointer:coarse)').matches?512:1024; sun.shadow.mapSize.set(shadowSize,shadowSize); Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:250});
  sun.shadow.bias=-.0004; sun.shadow.normalBias=.035; scene.add(sun.target);
  const {sample,length}=createTrack();
  const mat=(color:string,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
  const asphalt=mat('#4c5657'), sand=mat('#dbca9d'), grass=mat('#8b9c65'), line=mat('#fff5ce'), rail=mat('#d8d8bf');
  function ribbon(offsetA:number,offsetB:number,liftA:number,liftB:number,material:THREE.Material,start=0,end=length,step=2.5) {
    const pos:number[]=[],uv:number[]=[],idx:number[]=[]; const n=Math.ceil((end-start)/step);
    for(let i=0;i<=n;i++) { const d=start+(end-start)*i/n,p=sample(d); for(const [o,h] of [[offsetA,liftA],[offsetB,liftB]]) {const v=p.position.clone().addScaledVector(p.right,o); pos.push(v.x,o<=-27 ? (h<-10 ? -4.88 : -5.05) : v.y+h,v.z);uv.push(o/4,d/4);} }
    for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,material); mesh.receiveShadow=true; scene.add(mesh); return mesh;
  }
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=64;
  const grain=grainCanvas.getContext('2d')!; const pixels=grain.createImageData(64,64);
  for(let i=0;i<64*64;i++){const c=225+Math.round((Math.sin(i*37.17)*437.1%1)*18);pixels.data.set([c,c,c,255],i*4);}grain.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(grainCanvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;asphalt.map=texture;
  ribbon(-27,-11,-9,-.1,sand,0,length,10); ribbon(-11,13,-.1,-.1,sand);
  ribbon(13,75,-.12,-3,grass,0,length,10); ribbon(75,160,-3,-14,grass,0,length,10);
  ribbon(-7,7,0,0,asphalt).name='driving-surface'; ribbon(-6.65,-6.49,.025,.025,line); ribbon(6.49,6.65,.025,.025,line);
  const dashes:THREE.BufferGeometry[]=[];
  for(let d=0;d<length;d+=17){const dash=ribbon(-.075,.075,.03,.03,line,d,Math.min(d+7,length),7);scene.remove(dash);dashes.push(dash.geometry);}
  const markings=new THREE.Mesh(mergeGeometries(dashes)!,line);markings.receiveShadow=true;scene.add(markings);dashes.forEach(g=>g.dispose());
  ribbon(-9.8,-9.6,.65,.65,rail); ribbon(-9.8,-9.6,1.12,1.12,rail);
  // Efficient instances keep close roadside objects plentiful on mobile.
  const dummy=new THREE.Object3D();
  function instances(geo:THREE.BufferGeometry,material:THREE.Material,poses:{p:THREE.Vector3;s?:THREE.Vector3;r?:THREE.Euler}[]) {
    const mesh=new THREE.InstancedMesh(geo,material,poses.length);mesh.castShadow=true;mesh.receiveShadow=true;
    poses.forEach((v,i)=>{dummy.position.copy(v.p);dummy.scale.copy(v.s??new THREE.Vector3(1,1,1));dummy.rotation.copy(v.r??new THREE.Euler());dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}); scene.add(mesh); return mesh;
  }
  const posts=[];for(let d=0;d<length;d+=12){const p=sample(d);posts.push({p:p.position.addScaledVector(p.right,-9.7).add(new THREE.Vector3(0,.58,0))});}
  instances(new THREE.BoxGeometry(.15,1.2,.15),rail,posts);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(18000,18000),new THREE.MeshStandardMaterial({color:'#087eaa',metalness:.22,roughness:.42}));sea.rotation.x=-Math.PI/2;sea.position.y=-5;scene.add(sea);
  // Thin pale surf lines make the shore readable without textures or external assets.
  ribbon(-29,-27,-10.9,-10.9,new THREE.MeshBasicMaterial({color:'#b8e2da',transparent:true,opacity:.72}),0,length,10);
  const trunks: {p:THREE.Vector3;s:THREE.Vector3;r:THREE.Euler}[]=[], leaves:typeof trunks=[];
  const rand=(i:number)=>{const x=Math.sin(i*127.1+43.7)*43758.5453;return x-Math.floor(x);};
  for(let d=12,i=0;d<length;d+=48,i++) {
    const p=sample(d), offset=14+rand(i)*9, height=7+rand(i+50)*4;
    const base=p.position.addScaledVector(p.right,offset); base.y-=.4;
    trunks.push({p:base.clone().add(new THREE.Vector3(.15,height/2,0)),s:new THREE.Vector3(1,height,1),r:new THREE.Euler(0,0,-.025)});
    for(let j=0;j<7;j++) {const angle=j*Math.PI*2/7+rand(i),dir=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));leaves.push({p:base.clone().addScaledVector(dir,1.8).add(new THREE.Vector3(0,height,0)),s:new THREE.Vector3(.78,.25,3.5),r:new THREE.Euler(.17,angle,0)});}
  }
  instances(new THREE.CylinderGeometry(.18,.29,1,7),mat('#aa8a62'),trunks);
  instances(new THREE.SphereGeometry(1,7,4),mat('#26744c'),leaves);
  const shrubs=[];for(let d=10,i=0;d<length;d+=20,i++){const p=sample(d),s=1+rand(i)*2;shrubs.push({p:p.position.addScaledVector(p.right,11+rand(i+10)*12).add(new THREE.Vector3(0,.5,0)),s:new THREE.Vector3(s,s*.7,s),r:new THREE.Euler(0,rand(i)*6,0)});}
  instances(new THREE.IcosahedronGeometry(1,1),mat('#567a4a'),shrubs);
  // Warm eroded ridges on the inland side. Sea remains visible beyond the outside rail.
  const rocks=[],ledges=[];for(let d=0,i=0;d<length;d+=65,i++){const p=sample(d),base=p.position.addScaledVector(p.right,52+rand(i)*40).add(new THREE.Vector3(0,-6,0));const yaw=rand(i)*6;
    rocks.push({p:base,s:new THREE.Vector3(27+rand(i)*20,14+rand(i+7)*24,29+rand(i+9)*24),r:new THREE.Euler(0,yaw,0)});
    ledges.push({p:base.clone().add(new THREE.Vector3(0,6,0)),s:new THREE.Vector3(22+rand(i)*15,8+rand(i+7)*13,24+rand(i+9)*18),r:new THREE.Euler(0,yaw+.2,.05)});}
  instances(new THREE.IcosahedronGeometry(1,1),mat('#b9ae89'),rocks);
  instances(new THREE.IcosahedronGeometry(1,1),mat('#c8bd97'),ledges);
  // A connected, low distant ridge instead of isolated giant boulders on the horizon.
  const ridge:number[]=[],ridgeIndex:number[]=[],ridgeColors:number[]=[];
  const ridgeColor=new THREE.Color();
  for(let i=0;i<=192;i++){const angle=i/192*Math.PI*2;const crest=65+35*Math.sin(angle*7)+28*Math.sin(angle*13+.7)+15*Math.cos(angle*23);
    for(let j=0;j<4;j++){const radius=1550+j*230;const height=j===0?-7:j===1?crest:j===2?crest*.65:-10;ridge.push(400+Math.cos(angle)*radius,height,500+Math.sin(angle)*radius);ridgeColor.set(j===1?'#81a8ac':j===0?'#9fc4c6':'#92b7bb');ridgeColors.push(ridgeColor.r,ridgeColor.g,ridgeColor.b);}
    if(i<192)for(let j=0;j<3;j++){const a=i*4+j;ridgeIndex.push(a,a+1,a+4,a+1,a+5,a+4);}}
  const ridgeGeo=new THREE.BufferGeometry();ridgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(ridge,3));ridgeGeo.setAttribute('color',new THREE.Float32BufferAttribute(ridgeColors,3));ridgeGeo.setIndex(ridgeIndex);ridgeGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(ridgeGeo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide})));
  const clouds=[];for(let i=0;i<24;i++){const angle=i*2.4;for(let j=0;j<4;j++)clouds.push({p:new THREE.Vector3(400+Math.cos(angle)*1700+j*50,280+rand(i)*170,500+Math.sin(angle)*1700),s:new THREE.Vector3(70,18+rand(j+i)*15,35),r:new THREE.Euler()});}
  instances(new THREE.SphereGeometry(1,10,6),new THREE.MeshBasicMaterial({color:'#f5f7e9',fog:false}),clouds);
  // Small clusters of pastel coastal villas, shutters and terracotta roof caps.
  const walls=[mat('#f0dfb7'),mat('#e6b49c'),mat('#e8e8d4')],roof=mat('#bd7d59'),shutter=mat('#537e7b');
  for(let i=0;i<30;i++) {
    const d=320+i*91,p=sample(d),group=new THREE.Group();group.position.copy(p.position).addScaledVector(p.right,28+rand(i)*12);group.position.y-=1.8;group.rotation.y=Math.atan2(p.tangent.x,p.tangent.z);
    const w=6+rand(i)*5,h=5+rand(i+2)*5,depth=6+rand(i+3)*4;
    const block=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),walls[i%3]);block.position.y=h/2;block.castShadow=true;block.receiveShadow=true;group.add(block);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+.7,.35,depth+.7),roof);cap.position.y=h+.15;group.add(cap);
    for(const x of [-w*.27,w*.27])for(const y of [h*.32,h*.73]){const window=new THREE.Mesh(new THREE.BoxGeometry(.9,1.3,.08),shutter);window.position.set(x,y,-depth/2-.05);group.add(window);}
    scene.add(group);
  }
  const car=createCar();scene.add(car);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const context=shadowCanvas.getContext('2d')!;
  const gradient=context.createRadialGradient(32,32,7,32,32,31);gradient.addColorStop(0,'rgba(18,33,30,.65)');gradient.addColorStop(.55,'rgba(18,33,30,.3)');gradient.addColorStop(1,'rgba(18,33,30,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.1,5.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;car.add(shadow);
  return {scene,sample,length,car,update:(_time:number,_speed:number,_slip:number)=>{sun.target.position.copy(car.position);sun.position.copy(car.position).add(new THREE.Vector3(-60,95,-45));}};
}
