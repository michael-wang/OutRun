import * as T from 'three';

// All parcels are measured in metres in the same world frame as the carriageway.
// The riverfront follows the actual bank, independently of the viaduct alignment.
export function addCityDepth({scene,cityChunks,pose,grade,physicalPos,edge,bank,riverside,nearEnd,alongX,alongZ}){
 const road=[];
 for(let d=0;d<=7110;d+=10){const [x,z]=pose(d);road.push([x,z,Math.max(edge(d,1),edge(d,-1))]);}
 const cube=new T.BoxGeometry().toNonIndexed(),leaf=new T.IcosahedronGeometry(1,0);
 const mat=new T.MeshLambertMaterial({vertexColors:true}),part=new T.Object3D(),p=new T.Vector3(),ink=new T.Color();
 let vertices=[],colors=[],groups=[];
 function solid(geom,x,y,z,yaw,w,h,l,color){
  part.position.set(x,y,z);part.rotation.y=yaw;part.scale.set(w,h,l);part.updateMatrix();ink.setHex(color);
  const points=geom.attributes.position;
  for(let i=0;i<points.count;i++){p.fromBufferAttribute(points,i).applyMatrix4(part.matrix);vertices.push(p.x,p.y,p.z);colors.push(ink.r,ink.g,ink.b);}
 }
 function parcel(origin,yaw,width,length,layer,build){
  const [x,y,z]=origin,r=Math.hypot(width,length)*.5+1,c=Math.cos(yaw),s=Math.sin(yaw);
  for(const [rx,rz,half] of road)if((x-rx)**2+(z-rz)**2<(r+half+4)**2)return;
  const dx=x-nearEnd[0],dz=z-nearEnd[2],u=dx*alongZ-dz*alongX,v=dx*alongX+dz*alongZ;
  if(Math.abs(u)<2000+r&&v>bank(u,false)-r*1.4&&v<bank(u,true)+r*1.4)return;
  const first=vertices.length/3;
  function box(a,b,bottom,w,h,l,col){solid(cube,x+c*a+s*b,y+bottom+h/2,z-s*a+c*b,yaw,w,h,l,col);}
  function tree(a,b,h){box(a,b,0,.55,h*.67,.55,0x73685a);solid(leaf,x+c*a+s*b,y+h*.72,z-s*a+c*b,yaw,h*.41,h*.35,h*.46,0x718575);}
  build(box,tree);groups.push({layer,first,last:vertices.length/3,yaw});return true;
 }
 function flush(id,at){
  if(!vertices.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,mat);mesh.name='city-interior-depth-'+id;mesh.userData.reviewGroups=groups;scene.add(mesh);
  if(at!=null)cityChunks.push({at,mesh});vertices=[];colors=[];groups=[];
 }
 function site(at,offset,w,l,build){parcel(physicalPos(at,offset,grade(at)-.1),pose(at)[2],w,l,'mid',build);}
 function school(box){
  box(0,0,-1,34,1.2,62,0x899884);box(6,0,0,16,13.5,55,0xb9ae94);box(5,0,13.4,19,.65,57,0xe0d1b4);
  for(const y of [2.4,6.2,10]){box(-2.2,0,y,.45,2.0,52,0x586e72);box(-3,0,y+2.05,2,.35,54,0xd0c2a6);}
  // The playing fields and road are on the east side of this wing.
  for(const y of [2.5,6.6,10.5]){box(14.1,0,y,.40,1.6,51,0x677d7a);box(14.7,0,y+1.7,1.7,.3,53,0xd2c2a2);}
  box(-6,21,0,15,8,12,0xad9278);
 }
 function court(box,tree){
  box(0,0,-1,32,1.22,55,0xa69b81);box(0,0,.22,21,.15,38,0xb58263);
  for(const x of [-8.3,8.3])box(x,0,.38,.24,.035,32,0xe0d6b0);
  for(const z of [-16,0,16])box(0,z,.38,16.8,.035,.23,0xe0d6b0);
  for(const z of [-18,18]){box(0,z,.38,.24,4,.24,0x726f68);box(0,z,3.55,2,1.1,.18,0xe1d8c2);}
  for(const z of [-20,-7,13])tree(13,z,7.3);
  for(const z of [-21,21]){box(-12,z,0,.28,8,.28,0x757e79);box(-12,z,7.7,1.8,.55,.45,0xdad4bd);}
  box(-12,-4,.3,1,3.2,.55,0x908673);box(-12,-4,3.45,.65,2.3,5.4,0x415d59);
 }
 function hall(box){
  box(0,0,-1,34,1.25,48,0xa9a694);box(0,-2,0,27,9.5,37,0xb5a994);
  box(-1,-2,9.4,31,.75,42,0x899b96);box(1,0,10.1,14,2.7,25,0xa5b9aa);
  for(const z of [-14,-5,4,13]){box(-13.6,z,1.2,.55,4.2,5.5,0x5b6c69);box(-15,z,5.5,4,.32,6.7,0xd6bc94);}
 }
 function flats(box){
  box(0,0,-1,33,1.2,46,0x99998d);box(-3,-1,0,20,17,36,0xa99d8b);box(3,-9,.1,18,22,17,0xb6bab0);
  for(const y of [4,8.1,12.2])box(-3,-1,y,20.7,.5,36.8,0xc3c0ab);
  box(2,-9,22,10,2,9,0x899696);
 }
 // The park's playing fields are intentionally open at the roadside. Courts,
 // teaching wings and the hall supply a landward boundary and a second row.
 for(const at of [1545,1718,1890,2005]){site(at,-57,32,55,court);site(at+41,-98,36,64,school);}
 site(1820,-74,36,50,hall);flush('campus',1780);
 for(const at of [2480,2570,2660,2745,2840,3000,3350,3490,3725,3910]){
  site(at,52,36,50,hall);site(at+26,103,36,50,at%3?hall:flats);
  if(at===2840)flush('market-west',2630);
 }
 // A covered produce court gives the rear market street a recognizable use.
 site(3450,75,30,50,(box,tree)=>{
  box(0,0,0,29,.55,48,0xb6aa92);
  for(const z of [-15,0,15]){
   for(const x of [-9,9])box(x,z,.55,.55,6,.55,0x736959);
   box(0,z,6.4,22,.48,12,0xb1896a);box(0,z,.6,6,1.55,6.2,0x8a805f);
  }
  tree(13,19,7);
 });
 flush('market-east',3510);
 for(const at of [435,655,895])site(at,-82,36,50,flats);flush('central',720);
 // Two streets inland and a lower boat-service terrace leave the river open.
 const riverYaw=Math.atan2(alongX,alongZ);
 // Exposed earth slopes connect the elevated landing to the actual quay.
 // Keep the open water surface free all the way to the existing bank.
 const smooth=T.MathUtils.smoothstep;
 const shoulderWidth=d=>Math.min(150-134*smooth(d,4330,4440)*(1-smooth(d,5590,5710)),150-129*smooth(d,5515,5630)*(1-smooth(d,5890,6065)));
 function landingPoint(d,side,k){
  const w=shoulderWidth(d),spread=38*smooth(d,5650,5740)*(1-smooth(d,5920,6065));
  return physicalPos(d,side*(w+k*spread),T.MathUtils.lerp(grade(d)-.17,5.52,k));
 }
 for(const side of [-1,1])for(let d=5650;d<6065;d+=5){
  const a=landingPoint(d,side,0),b=landingPoint(d+5,side,0),c=landingPoint(d,side,1),e=landingPoint(d+5,side,1);
  const onLand=q=>{const x=q[0]-nearEnd[0],z=q[2]-nearEnd[2];return x*alongX+z*alongZ>=bank(x*alongZ-z*alongX,true);};
  if(![a,b,c,e].every(onLand))continue;ink.setHex(0x939e82);
  for(const q of side===1?[a,b,c,c,b,e]:[a,c,b,c,e,b]){vertices.push(...q);colors.push(ink.r,ink.g,ink.b);}
 }
 flush('landing-grade',5840);
 for(const far of [false,true]){
  const sign=far?1:-1,ground=far?5.5:4.3;
  for(let i=-8;i<=8;i++){const u=i*56+11*Math.sin(i*4.8);
   if(Math.abs(u)>65){
    parcel(riverside(u,bank(u,far)+sign*39,ground),riverYaw,52,25,'mid',(box,tree)=>{
     box(0,0,-.18,52,.44,24,0x98a58a);box(0,sign*-8,.27,52,.18,3.2,0xc4b795);
     for(let j=-1;j<=1;j++)tree(j*16,sign*(1.8+2*Math.cos(i+j)),5.5+2*Math.sin(i+j)**2);
    });
   }
   for(let row=0;row<2;row++){
    const off=(row?172:74)+13*Math.sin(i*5+row);
    parcel(riverside(u+(row?23:0),bank(u,far)+sign*off,ground),riverYaw,38,52,'mid',row?flats:hall);
   }
  }
  // A rowing club and boathouse turn the near end of each bank into an address.
  // Use the bank's own elevation and frame so both banks remain dry and level.
  for(const u of (far?[-143,103]:[-117,152])){
   const off=far?114:118;
   parcel(riverside(u,bank(u,far)+sign*off,ground),riverYaw,42,30,'mid',(box,tree)=>{
    box(0,0,-.14,41,.5,29,0xb69f82);box(2,3,.36,33,6.35,15,0x94a6a0);
    box(1,2,6.7,37,.54,18,0xd2c9ad);
    for(const a of [-10,-2,6,14]){
     box(a,-4.65,.55,5.35,4.13,.55,0x4f6a6c);box(a,-7.5,4.94,6.7,.39,7,0xa8a995);
    }
    for(const a of [-15,13])tree(a,12,6.4);
   });
  }
  flush(far?'landing':'embankment',null);
 }
 for(const at of [5800,5980,6210,6450,6720,6930]){site(at,-85,36,50,flats);site(at+50,at===5980?184:110,36,50,hall);if(at===6210)flush('quay-streets',6100);}
 site(6685,66,34,50,(box,tree)=>{
  box(0,0,0,33,.42,48,0xa6a890);
  for(const x of [-9,9]){box(x,0,.42,3,.22,45,0xc4b49c);for(const z of [-15,0,15])tree(x+3,z,7.4);}
  box(0,1,.45,7,.55,25,0x8e9d8c);
 });
 flush('terminus',6740);
 // A shared city beyond the track. One deterministic world grid is visible from
 // multiple districts and from the reverse view; it never follows the camera.
 function noise(i,j,k){const n=Math.sin(i*127.1+j*311.7+k*41.7)*43758.5453;return n-Math.floor(n);}
 for(let band=-1;band<=3;band++){
 for(let i=Math.max(-7,band*8);i<=Math.min(29,band*8+7);i++)for(let j=-7;j<=18;j++){
  const x=i*178+noise(i,j,1)*78,z=j*173+noise(i,j,2)*72;
  const dist=Math.sqrt(road.reduce((m,[rx,rz])=>Math.min(m,(x-rx)**2+(z-rz)**2),Infinity));
  if(dist<325||dist>1100||noise(i,j,3)<.28)continue;
  const yaw=(noise(i,j,4)-.5)*.7,deep=dist>620,base=deep?0x708499:0x8d9c9f;
  parcel([x,2,z],yaw,100,87,'far',box=>{
   box(0,0,-8,98,11,85,deep?0x829099:0x999f94);
   for(let t=0;t<3;t++){
    const a=[-29,1,30][t],b=(t%2?1:-1)*16,w=16+noise(i,j,10+t)*11,l=24+noise(i,j,18+t)*12;
    const district=.48+.52*(.5+.5*Math.sin(x/355+Math.sin(z/235)))*(.5+.5*Math.cos(z/465-x/700));
    const h=district*((deep?42:28)+noise(i,j,24+t)**2*(deep?112:78));
    box(a,b,3,w,h,l,base);if(t!==2)box(a+1,b,h+3,w*.76,4+h*.12,l*.73,deep?0x77889a:0xa4adab);
    if(t===1&&noise(i,j,35)>.55)box(a,b,h*1.12+7,4,8,5,0x778792);
   }
  });
 }
 flush('skyline-'+band,null);
 }
 cube.dispose();leaf.dispose();
}
