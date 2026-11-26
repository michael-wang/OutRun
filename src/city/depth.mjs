import * as T from 'three';
import neighbourhoodURL from './assets/neighbourhood.png?url';
import {backdrop} from './city-data.mjs';
import {parkOccupies} from './ballpark.mjs';

// All parcels are measured in metres in the same world frame as the carriageway.
// The riverfront follows the actual bank, independently of the viaduct alignment.
export function addCityDepth({scene,cityChunks,pose,grade,physicalPos,edge,bank,riverside,nearEnd,alongX,alongZ,parkTrees}){
 const finish=physicalPos(5650,0,0),span=(finish[0]-nearEnd[0])*alongX+(finish[2]-nearEnd[2])*alongZ;
 const road=[];
 for(let d=0;d<=7110;d+=10){const [x,z]=pose(d);road.push([x,z,Math.max(edge(d,1),edge(d,-1))]);}
 const cube=new T.BoxGeometry().toNonIndexed();
 const atlas=new T.TextureLoader().load(neighbourhoodURL);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=2;
 const mat=new T.MeshLambertMaterial({map:atlas,vertexColors:true}),part=new T.Object3D(),p=new T.Vector3(),ink=new T.Color();
 let vertices=[],colors=[],uv=[],groups=[];
 function solid(geom,x,y,z,yaw,w,h,l,color,tile){
  part.position.set(x,y,z);part.rotation.y=yaw;part.scale.set(w,h,l);part.updateMatrix();ink.setHex(color);
  const points=geom.attributes.position,normal=geom.attributes.normal,tex=geom.attributes.uv;
  for(let i=0;i<points.count;i++){p.fromBufferAttribute(points,i).applyMatrix4(part.matrix);vertices.push(p.x,p.y,p.z);colors.push(ink.r,ink.g,ink.b);
   if(tile!==undefined&&Math.abs(normal.getY(i))<.4){
    const u=tex.getX(i),v=tex.getY(i);uv.push((tile%4+.012+u*.976)/4,(7-(tile>>2)+.012+v*.976)/8);
   }else uv.push(.99,.005);
  }
 }
 // Keep facade values distinguishable against the landward ridge. The normal race fog is untouched.
 const skylineMaterial=mat.clone();
 skylineMaterial.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
   float haze=min(.80,1.-exp(-.00000091*vFogDepth*vFogDepth));
   gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*vec3(.94,.96,.965),haze);
   #endif`);
 };
 skylineMaterial.customProgramCacheKey=()=>'city-horizon-atmosphere-1';
 function parcel(origin,yaw,width,length,layer,build){
  const [x,y,z]=origin,r=Math.hypot(width,length)*.5+1,c=Math.cos(yaw),s=Math.sin(yaw);
  for(const [rx,rz,half] of road)if((x-rx)**2+(z-rz)**2<(r+half+4)**2)return;
  const dx=x-nearEnd[0],dz=z-nearEnd[2],u=dx*alongZ-dz*alongX,v=dx*alongX+dz*alongZ;
  if(Math.abs(u)<2000+r&&v>bank(u,false)-r*1.4&&v<bank(u,true)+r*1.4)return;
  if(parkOccupies(u,v-span,r))return;
  const first=vertices.length/3;
  function box(a,b,bottom,w,h,l,col,skin){
   const tile=skin??(h>5.9&&Math.min(w,l)>7?16+(Math.abs(Math.round(w*2+l))%4):undefined);
   const tiers=tile===undefined?1:Math.max(1,Math.round(h/22));
   for(let j=0;j<tiers;j++)solid(cube,x+c*a+s*b,y+bottom+(j+.5)*h/tiers,z-s*a+c*b,yaw,w,h/tiers,l,col,tile);
  }
  function tree(a,b,h){
   const position=[x+c*a+s*b,y,z-s*a+c*b];let nearest=0,min=Infinity;
   for(let i=0;i<road.length;i++){const dx=road[i][0]-position[0],dz=road[i][1]-position[2],distance=dx*dx+dz*dz;if(distance<min){min=distance;nearest=i;}}
   parkTrees.plantWorld(nearest*10,position,h,.88);
  }
  build(box,tree);groups.push({layer,first,last:vertices.length/3,yaw});return true;
 }
 function flush(id,at){
  if(!vertices.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,id.startsWith('skyline-')?skylineMaterial:mat);mesh.name='city-interior-depth-'+id;mesh.userData.reviewGroups=groups;scene.add(mesh);
  if(at!=null)cityChunks.push({at,mesh});vertices=[];colors=[];uv=[];groups=[];
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
  box(0,0,-1,34,1.25,48,0xa9a694);box(0,-2,0,27,9.5,37,0xe7ddc5,19);
  box(-1,-2,9.4,31,.75,42,0x899b96);box(1,0,10.1,14,2.7,25,0xa5b9aa);
  for(const z of [-14,0,14]){
   box(4,z,10.03,9,1.24,8.2,0x899f98);box(4,z-2.6,11.22,9.6,.33,3.4,0xa0aaa0);
  }
  for(const z of [-14,-5,4,13]){box(-13.6,z,1.2,.55,4.2,5.5,0x5b6c69);box(-15,z,5.5,4,.32,6.7,0xd6bc94);}
 }
 function flats(box){
  box(0,0,-1,33,1.2,46,0x99998d);box(-3,-1,0,20,17,36,0xe3cccc,17);box(3,-9,.1,18,22,17,0xdedfcf,16);
  for(const y of [4,8.1,12.2])box(-3,-1,y,20.7,.5,36.8,0xc3c0ab);
  box(2,-9,22,10,2,9,0x899696);box(11,-9,.2,2.2,23.8,5.1,0xb8a792);
  for(const y of [3.7,7.3,10.9,14.5])for(const z of [-12,4])box(-13.5,z,y,2.5,.84,9.2,0xc3b7a4);
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
 for(const at of [435,655,895])site(at,-82,36,50,flats);
 site(995,104,36,50,hall);flush('central',720);
 // Two streets inland and a lower boat-service terrace leave the river open.
 const riverYaw=Math.atan2(alongX,alongZ);
 // Same bank parcels and footprints as the former quay cubes; two-sided windows and roofs now use the land batch.
 for(const far of [false,true]){const sg=far?1:-1;
  for(let i=-8;i<=8;i++){const u=i*86+(i%2)*11;if(Math.abs(u)<235)continue;
   const ground=far?5.5:4.3,p=backdrop(5000+i*43,sg,80,i%3===0?'tower':'commerce');
   const v=bank(u,far)+sg*(70+p.setback);
   parcel(riverside(u,v,ground),riverYaw,p.width+1,p.depth+6,'mid',box=>{
    const base=p.storey*2,upper=p.storey*(p.levels-2);
    box(0,0,0,p.width,base,p.depth+4,0xc8b8a0,19);
    if(upper>0){box(0,sg*2,base,p.width*.78,upper,p.depth,0xd7cbb8,i%2?16:18);}
    if(p.roof==='lantern')box(1,0,base+upper,p.width*.49,2.5,p.depth*.5,0xbbc4bb);
    box(0,-sg*(p.depth*.5+1.7),base-.80,p.width*.90,.46,2.5,0xa6ad9b);
   });
  }
 }flush('quay-fronts',null);
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
  for(const q of side===1?[a,b,c,c,b,e]:[a,c,b,c,e,b]){vertices.push(...q);colors.push(ink.r,ink.g,ink.b);uv.push(.99,.005);}
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
  const yaw=(noise(i,j,4)-.5)*.7,deep=dist>620;
  parcel([x,2,z],yaw,100,87,'far',box=>{
   box(0,0,-8,98,11,85,deep?0x829099:0x999f94);
   for(let t=0;t<3;t++){
    const a=[-29,1,30][t],b=(t%2?1:-1)*16,w=16+noise(i,j,10+t)*11,l=24+noise(i,j,18+t)*12;
    const district=.48+.52*(.5+.5*Math.sin(x/355+Math.sin(z/235)))*(.5+.5*Math.cos(z/465-x/700));
    const h=district*((deep?42:28)+noise(i,j,24+t)**2*(deep?112:78));
    const family=Math.floor(noise(i,j,32+t)*4);
    const pale=deep?[0xbac3c7,0xc2b8ad,0xb5c6c8,0xb3bcba]:[0xd2c9b6,0xd2bbad,0xc4cfcf,0xc8c8bc];
    box(a,b,3,w,h,l,pale[family],16+family);
    if(family===0){box(a+w*.08,b,h+3,w*.81,4+h*.14,l*.77,pale[0],16);box(a+w*.12,b,h*1.14+7,w*.49,2.2,l*.56,0x829a9c);}
    else if(family===1){box(a+w*.25,b,h*.73+3,w*.42,h*.41,l*.72,0xb1aaa1,17);box(a+w*.25,b,h*1.14+3,w*.45,1.5,l*.75,0xb6beb5);}
    else if(family===2){box(a,b,h+3,w*1.025,1.25,l*1.025,0xa8b6ad);box(a,b,h+4.25,w*.46,h*.17,l*.64,0x98acaf,18);
     if(h>62&&noise(i,j,t+8)>.67)box(a,b,h*1.17+4.25,1.4,8,1.4,0x809699);}
    else{box(a,b,h+3,w*.46,3,l*.55,0xa5aba1);}
   }
  });
 }
 flush('skyline-'+band,null);
 }
 // Two fold lines at the landward edge of the basin provide a horizon behind the urban silhouettes.
 // Keep the low central valley behind the cable-stayed crossing open. Both strips are fixed in world space.
 const limit=Math.max(...road.map(([x,z])=>(x-nearEnd[0])*alongX+(z-nearEnd[2])*alongZ));
 const ridgePositions=[],ridgeColours=[],low=new T.Color(),high=new T.Color();
 for(let tier=1;tier>=0;tier--){
  const points=[];
  for(let u=-4000;u<=4000;u+=48){
   const valley=.16+.84*Math.min(1,Math.abs(u+105)/760);
   const ridge=(45+60*(.5+.5*Math.sin(u/325+tier))+23*Math.cos(u/123+tier*.9)+9*Math.sin(u/54))*valley;
   const v=limit+650+tier*430+Math.sin(u/380+tier)*150;
   points.push([riverside(u,v-65,-25),riverside(u,v,Math.max(3,ridge*(1+tier*.62)))]);
  }
  low.setHex(tier?0xd2dad8:0xc7d2d1);high.setHex(tier?0xc8d1d1:0xb1c0bf);
  for(let n=1;n<points.length;n++)for(const [j,k] of [[n-1,0],[n,0],[n-1,1],[n-1,1],[n,0],[n,1]]){
   ridgePositions.push(...points[j][k]);const c=k?high:low;ridgeColours.push(c.r,c.g,c.b);}
 }
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(ridgePositions,3));rg.setAttribute('color',new T.Float32BufferAttribute(ridgeColours,3));
 const horizon=new T.Mesh(rg,new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}));
 horizon.name='city-basin-ridgeline';scene.add(horizon);
 cube.dispose();
}
