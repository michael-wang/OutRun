// Each location is one stationary, vertex-coloured mesh. The bridge span stays clear.
import * as T from 'three';

export function addCityInteriors({scene,cityChunks,pose,physicalPos,grade,edge,parkTrees}){
 const unitBox=new T.BoxGeometry(1,1,1).toNonIndexed();
 const crown=new T.IcosahedronGeometry(1,1);
 const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const transform=new T.Object3D(),point=new T.Vector3(),ink=new T.Color();
 let vertices=[],colors=[],groups=[],insideGroup=false;
 function reviewGroup(layer,at,build){
  if(insideGroup){build();return;}
  const first=vertices.length/3;insideGroup=true;build();insideGroup=false;
  if(vertices.length/3>first)groups.push({layer,first,last:vertices.length/3,yaw:pose(at)[2]});
 }
 function form(geom,d,x,lift,w,h,len,yaw,col,along=0){
  transform.position.fromArray(physicalPos(d,x,grade(d)+lift));const heading=pose(d)[2];transform.rotation.y=heading+yaw;
  transform.position.x+=Math.sin(heading)*along;transform.position.z+=Math.cos(heading)*along;
  transform.scale.set(w,h,len);transform.updateMatrix();const attr=geom.attributes.position;ink.setHex(col);
  for(let i=0;i<attr.count;i++){point.fromBufferAttribute(attr,i).applyMatrix4(transform.matrix);vertices.push(point.x,point.y,point.z);colors.push(ink.r,ink.g,ink.b);}
 }
 const block=(d,x,b,w,h,l,col,angle=0)=>form(unitBox,d,x,b+h/2,w,h,l,angle,col);
 function strip(a,b,left,right,lift,col){
  ink.setHex(col);
  for(let d=a;d<b;d+=6){const e=Math.min(d+6,b);
   for(const [at,off] of [[d,left],[e,left],[d,right],[d,right],[e,left],[e,right]]){
    vertices.push(...physicalPos(at,off(at),grade(at)+lift(at)));colors.push(ink.r,ink.g,ink.b);
   }
  }
 }
 // Broad crowns merge in small copses; the changing gaps preserve glimpses beyond.
 function copse(d,x,n,scale=1){return reviewGroup(Math.abs(x)>85?'far':'mid',d,()=>plantCopse(d,x,n,scale));}
 function plantCopse(d,x,n,scale,ground=()=>0){
  for(let i=0;i<n;i++){
   const at=d+i*4.85+2*Math.sin(d+i),dx=x+4.6*Math.sin(i*1.74+d);
   const h=(8+3*Math.sin(d*.3+i*1.97))*scale;
   const base=ground(at,dx);
   if(at>=1450&&at<2040){parkTrees.plant(at,dx,grade(at)+base,h);continue;}
   block(at,dx,base,.48,h*.74,.55,0x766657);
   form(crown,at,dx,base+h*.70,h*.53,h*.38,h*.61,at,0x637965);
   form(crown,at+1.6,dx-1.8,base+h*.85,h*.36,h*.34,h*.43,at*.51,0x859773);
  }
 }
 function pavilion(d,x,w,len,h,col){return reviewGroup(Math.abs(x)>65?'far':'mid',d,()=>buildPavilion(d,x,w,len,h,col));}
 function buildPavilion(d,x,w,len,h,col){
  const inward=-Math.sign(x);
  block(d,x,0,w,h,len,col);
  block(d,x+inward*(w*.5+.08),.82,.24,h*.66,len*.86,0x50696a);
  block(d,x+inward*1.2,h,w+3,.55,len+2,0xc8bba2);
  for(let j=-1;j<=1;j++)block(d+j*len*.36,x+inward*(w*.5+2.0),.05,.35,h,.35,0xa49c88);
 }
 function terrace(d,x,w,l,h,c){return reviewGroup('far',d,()=>buildTerrace(d,x,w,l,h,c));}
 function buildTerrace(d,x,w,l,h,c){
  block(d,x,0,w,h,l,c);block(d+2,x-1,h,w*.74,h*.33,l*.65,c);
  for(let y=2.2;y<h-.8;y+=3.4)block(d,x,y,w+.18,.32,l+.18,0x859394);
 }
 function flush(at){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.name='city-interior-'+at;mesh.userData.reviewGroups=groups;groups=[];scene.add(mesh);cityChunks.push({at,mesh});vertices=[];colors=[];
 }
 // Exchange square. Set-back market wings frame a walk crossing the bus concourse.
 strip(995,1280,d=>-edge(d,-1)-5,()=>-76,()=>.16,0xb1a896);
 strip(1020,1250,()=>-29,()=>-31,()=>.22,0xd3c4aa);
 for(const [d,x,w,l,h] of [[1091,-43,18,22,7],[1136,-57,19,38,9],[1198,-68,29,36,11],[1149,58,19,30,7]])pavilion(d,x,w,l,h,0xb79d82);
 for(const [d,x] of [[1075,-25],[1141,-30],[1200,-38],[1110,37]])copse(d,x,3,.83);
 terrace(1216,-106,23,41,27,0xa0aaa9);terrace(1172,92,32,30,19,0xb2a89a);flush(1120);
 // Civic gardens: a planted berm separates the open lawn from the service
 // corridor. Its crest undulates and recedes at the entrances to the park.
 const start=1410,end=1910;
 const ridge=d=>42+6*Math.sin((d-start)/47);
 const top=d=>1+3.7*Math.sin(Math.PI*(d-start)/(end-start))**2+.6*Math.sin(d/32);
 strip(start,end,d=>edge(d,1)+5,d=>ridge(d)-12,()=>.24,0x98a183);
 strip(start,end,d=>ridge(d)-12,d=>ridge(d)-4,()=>.28,0xadb29a);
 // Sloping faces share actual vertices with the crest.
 function slope(a,b,f0,f1,y0,y1,col){ink.setHex(col);for(let d=a;d<b;d+=5){let e=Math.min(d+5,b);for(const [at,off,y] of [[d,f0,y0],[e,f0,y0],[d,f1,y1],[d,f1,y1],[e,f0,y0],[e,f1,y1]]){vertices.push(...physicalPos(at,off(at),grade(at)+y(at)));colors.push(ink.r,ink.g,ink.b);}}}
 slope(start,end,d=>ridge(d)-4,d=>ridge(d)+7,()=>.28,top,0x839470);
 slope(start,end,d=>ridge(d)+7,d=>ridge(d)+24,top,()=>.2,0x71856e);
 for(const [d,x,n,sc] of [[1448,63,6,1.05],[1500,56,5,1.23],[1551,73,7,1.22],[1591,53,8,1.35],[1640,61,8,1.47],[1687,54,7,1.2],[1731,82,9,1.26],[1813,65,6,1.2],[1665,-83,5,1.15],[1770,-85,6,1.25]])copse(d,x,n,sc);
 for(const [d,x,h] of [[1595,118,18],[1650,123,26],[1720,135,17],[1775,139,30],[1817,119,22]])terrace(d,x,31,36,h,0xa0a79e);
 pavilion(1728,-74,15,25,6,0xb29d7c);flush(1640);
 // Landward approach only. The bank pavilion and boat sheds stop before the river.
 for(const side of [-1,1]){
  strip(4095,4355,d=>side*(edge(d,side)+5),d=>side*(69+7*Math.sin(d/40)),()=>.18,0x8a9b80);
  strip(4150,4356,()=>side*29,d=>side*(32+Math.sin(d/29)),()=>.28,0xc2b6a4);
 }
 for(const [d,x,n] of [[4168,49,4],[4244,38,6],[4303,50,5],[4246,-56,6],[4321,-40,4]])copse(d,x,n,.9);
 pavilion(4287,-48,17,36,5.5,0x87999b);pavilion(4338,-74,23,19,7,0x9b9d90);
 pavilion(4314,78,12,25,4.2,0xa19583);flush(4260);
 // A civic garden between the mall and apartments. Low theatre seating faces the lawn.
 strip(6220,6480,d=>edge(d,1)+5,()=>67,()=>.26,0x96a385);
 strip(6245,6460,d=>25+4*Math.sin(d/26),d=>29+4*Math.sin(d/26),()=>.34,0xcbbda5);
 for(let j=0;j<5;j++)block(6345+j*1.25,50,.29,28-j*.7,.36+j*.42,1.4,0xb6ab95);
 pavilion(6382,67,19,35,7.4,0xb99b82);
 for(const [d,x,n] of [[6296,39,4],[6342,78,4],[6386,36,4],[6441,58,6]])copse(d,x,n,.95);
 terrace(6430,121,27,35,19,0xabb2a6);flush(6350);
 // The nursery grounds cover the outside of the civic right-hander; a second
 // landform turns inward around the market approach. Crest and toes are shared
 // across all cross sections so the land reads continuously from either lane.
 function crestHeight(d,a,b,height){
  const fade=Math.min(1,Math.max(0,(d-a)/32),Math.max(0,(b-d)/42));
  const crest=typeof height==='function'?height(d):height;
  return .35+crest*(.86+.14*Math.sin((d-a)/27))*fade;
 }
 function bankGround(a,b,center,width,height){
  return (d,x)=>{
   const t=(x-center(d))/width,h=crestHeight(d,a,b,height);
   if(t<-.22)return T.MathUtils.lerp(.24,h*.81,T.MathUtils.clamp((t+1)/.78,0,1));
   if(t<.16)return T.MathUtils.lerp(h*.81,h,(t+.22)/.38);
   return T.MathUtils.lerp(h,.21,T.MathUtils.clamp((t-.16)/.84,0,1));
  };
 }
 function plantedBank(a,b,center,width,height) {
  const toe=d=>center(d)-width,shoulder=d=>center(d)-width*.22,crest=d=>center(d)+width*.16,back=d=>center(d)+width;
  const elevation=d=>crestHeight(d,a,b,height);
  // An accessible path follows the foot of the hill. A gravel verge and
  // benches give the foreground a readable human scale from the driving lanes.
  const pathEdge=d=>toe(d)-1.8-.9*Math.sin((d-a)/17);
  strip(a,b,d=>pathEdge(d)-1.7,d=>pathEdge(d)+1.7,()=>.29,0xbcb09a);
  strip(a,b,d=>pathEdge(d)+1.7,d=>pathEdge(d)+2.1,()=>.30,0x909474);
  for(const f of [.21,.56,.79]){
   const d=a+(b-a)*f,x=pathEdge(d)+2.9;
   block(d,x,.32,.63,.42,2.8,0x886f55);
   block(d,x+.28,.72,.10,.36,2.8,0xb69470);
  }
  slope(a,b,toe,shoulder,()=>.24,d=>elevation(d)*.81,0x81936b);
  slope(a,b,shoulder,crest,d=>elevation(d)*.81,elevation,0x93a279);
  slope(a,b,crest,back,elevation,()=>.21,0x6b8265);
 }
 function yard(at,x,w,len,h,tint) {
  pavilion(at,x,w,len,h,tint);
  // Raised clerestory above the middle glazing, with two visible roof planes.
  block(at,x+.5,h+.15,w*.5,1.65,len*.78,0x819591);
  block(at,x+.5,h+1.8,w*.58,.36,len*.84,0xd1c3a6);
 }
 const nursery=d=>39+4.6*Math.sin((d-1180)/48)+2.1*Math.sin(d/22);
 // Enclose discrete scenery groups. A single box around curved ground would
 // span the carriageway and suggest that empty space contains an object.
 plantedBank(1170,1480,nursery,16,7.4);
 for(const [at,n,off] of [[1196,4,4],[1240,5,5],[1277,6,3],[1322,4,7],[1369,6,4],[1424,5,7]])
  reviewGroup('mid',at,()=>plantCopse(at,nursery(at)+off,n,1.12,bankGround(1170,1480,nursery,16,7.4)));
 for(const [at,x,w,len,h] of [[1293,76,18,32,11],[1361,89,24,35,8],[1438,105,22,43,13]])
  reviewGroup('far',at,()=>yard(at,x,w,len,h,0xa19b83));
 reviewGroup('far',1330,()=>terrace(1340,146,32,41,21,0xa2aaa1));
 flush(1330);

 // At the opposite end a shallow amphitheatre sits across the viewshed. Its
 // planted back and covered concourse face the park, away from the driving lane.
 const garden=d=>36+3.8*Math.sin((d-1870)/36);
 // The park gate crosses a shallow saddle in the bank. The road apron is
 // 0.424 m above local grade; the saddle stays at 0.35 m through the gate.
 const gateBank=d=>9.8*(1-T.MathUtils.smoothstep(d,1978,2010)*(1-T.MathUtils.smoothstep(d,2058,2090)));
 plantedBank(1818,2210,garden,14,gateBank);
 for(const [at,n] of [[1861,4],[1930,7],[2000,5],[1960,4],[2082,5],[2130,4],[2172,5]])
  reviewGroup('mid',at,()=>plantCopse(at,garden(at)+3,n,1.13,bankGround(1818,2210,garden,14,gateBank)));
 for(const [at,x,w,len,h] of [[1945,70,17,40,11],[2035,68,19,34,13],[2093,66,18,32,16],[2151,62,18,38,12],[2195,65,20,28,15]])
  reviewGroup('far',at,()=>yard(at,x,w,len,h,0xad9c86));
 reviewGroup('mid',2120,()=>{
  for(let i=0;i<6;i++)block(2124,52+i*1.35,.15,1.46,1.05+i*.68,38-i*.9,0xb4ab95);
 });
 flush(2070);

 const cylinder=new T.CylinderGeometry(.5,.5,1,10).toNonIndexed();

 // Cantilevered shelters share the district mesh with their surroundings.
 // Front and back roof edges are four real points, so both fascia and soffit
 // stay continuous even on the sloping, curved approach to the station.
 function roof(at,x,width,length,front,back,color,edgeColor){
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([along,across])=>{
   const station=at+along*length*.5;
   return physicalPos(station,x+across*width*.5,grade(station)+(across<0?front:back));
  });
  const underside=corners.map(([a,y,b])=>[a,y-.37,b]);
  function face(a,b,c,d,tint){
   ink.setHex(tint);
   for(const v of [a,b,c,a,c,d]){vertices.push(...v);colors.push(ink.r,ink.g,ink.b);}
  }
  face(...corners,color);face(...underside,0x6b7264);
  for(let i=0;i<4;i++){const j=(i+1)%4;face(corners[i],corners[j],underside[j],underside[i],edgeColor);}
 }
 // Athletic park: the covered bleachers face the existing school courts.
 // Open ends and unroofed sections give glimpses into the playing grounds.
 for(const [at,modules] of [[1749,4],[1889,3]]){
  reviewGroup('mid',at,()=>{
   for(const dz of [-6,modules*7.2+1]){
    block(at+dz,-40,.35,.39,12,.44,0x667772);
    block(at+dz,-40,12.20,3.25,.72,.50,0x4d6060);
    for(const xx of [-1,0,1])block(at+dz-.27,-40+xx,12.36,.77,.38,.12,0xe5d9a7);
   }
  });
 }

 // Scoreboards face the approach; one high, silhouette-sized board is legible
 // from the road while the lower court remains visible through the stands.
 reviewGroup('mid',1820,()=>{
  const at=1821,x=-26;
  for(const dx of [-3.4,3.4])block(at,x+dx,.35,.33,6.4,.39,0x5c6c63);
  block(at,x,6.27,8.35,3.7,.50,0x354d49);
  block(at-.27,x,8.96,7.95,.62,.10,0xd6b177);
  for(const [dx,score] of [[-2.15,2],[2.0,1]]){
   block(at-.28,x+dx,6.78,.33,1.61,.12,0xe2c896);
   if(score===2)for(const lift of [6.73,7.48,8.17])block(at-.29,x+dx+.38,lift,.91,.18,.12,0xe2c896);
  }
 });
 flush(1830);
 // Cold-store roof monitors and loading doors give the larger wholesale
 // court its own profile as the road leaves the covered street.
 reviewGroup('mid',3640,()=>{
  const x=36;
  for(let i=0;i<5;i++){
   const z=3609+i*9.5;
   block(z,x+2,.14,18.5,8.0,9.48,0xa5afa3);
   block(z,x-7.34,.92,.20,4.7,6.4,0x516966);
   block(z,x-6.9,.3,4.8,.65,9.4,0xb1ac97);
   roof(z,x+1.7,19.6,9.49,8.37,11.9,0xb7c6b8,0x57716f);
   block(z-4.60,x+6.8,8.21,8.2,1.10,.22,0x688688);
   roof(z,x-7.6,5.2,9.39,5.78,6.33,0xc4ac7e,0xa37b51);
  }
  for(const dx of [0,6.8]){
   form(cylinder,3679,x+dx,9.2,6.4,18.0,6.4,0,0xadbaae);
   form(cylinder,3679,x+dx,18.37,6.65,.5,6.65,0,0x677f7b);
  }
 });
 flush(3640);
 // A stepped pocket square on the inside of the mall turn: an open arcade
 // marks the pedestrian route to the station. Keep the opposite ramp visible.
 reviewGroup('mid',6180,()=>{
  const walk=d=>-22.8-2.1*Math.sin((d-6118)/29);
  strip(6098,6245,d=>walk(d)-7,d=>walk(d)+5.4,()=>.39,0xb9a799);
  strip(6098,6245,d=>walk(d)+2.75,d=>walk(d)+3.1,()=>.405,0xd9c9af);
  for(const [at,bays] of [[6125,3],[6179,4],[6222,2]]){
   for(let i=0;i<bays;i++){
    const z=at+i*5.8,x=walk(z);
    block(z-2.4,x-.8,.40,.35,4.8,.35,0x635d59);
    roof(z,x,7.0,5.67,4.7,5.8,0xc2aa99,0x895c54);
    block(z,x-2,.41,2.8,.52,4.7,0xa38b79);
    block(z,x-2,.93,2.5,.47,4.30,0x73806a);
   }
  }
 });

 // Angular bronze ribbon and a low plinth mark the plaza entrance at speed.
 // Successive slates sit on a single footing and stay below the mall roof.
 reviewGroup('mid',6214,()=>{
  const at=6214,x=-17.8;
  block(at,x,.3,3.4,.65,6.7,0xb4a28b);
  for(let i=0;i<9;i++){
   const wave=Math.sin(i*Math.PI/8);
   block(at+i*.62-2.5,x+.64*Math.cos(i*.48),.94,.32,2.15+wave*6.2,.47,
     i%3===0?0xc18957:0x98704e,i*.12-.37);
  }
 });
 flush(6180);

 // Two municipal works frontages stand on the street side of the railway.
 // Reserve the actual track behind them. Their offices step up toward the depot.
 function works(at,x,w,len,h,stone){
  // The whole building belongs to one parcel frame, including glazing on the
  // narrow ends. Re-sampling road yaw per window detaches it on tight bends.
  const fixedBox=(d,x,b,w,h,l,col)=>form(unitBox,at,x,b+h/2,w,h,l,0,col,d-at);
  reviewGroup('mid',at,()=>{
   const face=x+w/2;
   fixedBox(at,x,.10,w,h,len,stone);fixedBox(at,x,h+.1,w+.54,.50,len+.8,0xc2baa7);
   for(let i=0;i<3;i++){
    const d=at+(i-1)*len*.29;
    fixedBox(d,face+.16,.55,.4,3.62,len*.22,0x526967);
    fixedBox(d,face+.9,4.12,2.4,.38,len*.26,0x99aba2);
   }
   // Both returns matter: these broad end elevations face the player in a bend.
   for(const end of [-1,1]){
    const z=at+end*(len/2+.16);
    fixedBox(z,x,.3,w*.8,3.6,.40,0x857c68);
    fixedBox(z+end*.33,x+1,.5,w*.47,2.85,.43,0x607576);
    fixedBox(z+end*.61,x+1,3.35,w*.60,.32,1.9,0x9eaa9d);
    for(let y=6;y<h-1;y+=3.7){
     fixedBox(z,x,y,w*.72,1.6,.43,0x566f74);
     fixedBox(z+end*.15,x,y+1.59,w*.78,.22,.65,0xc5baa3);
    }
   }
   for(let y=6;y<h-1;y+=3.7){
    fixedBox(at,face+.13,y,.32,1.52,len*.84,0x728184);
    for(const k of [-.28,-.09,.10,.29])fixedBox(at+k*len,face+.34,y,.20,1.54,.28,0xb5ad97);
   }
   fixedBox(at-2,x-1.2,h+.52,w*.57,2.46,len*.64,0xa1a799);
  });
 }
 works(2494,-25.8,13,35,12,0xad9f88);
 works(2514,-21.5,9,12,7,0xb6b09b);
 flush(2498);
 works(2944,-23.3,12,29,13,0xb09e88);
 works(2978,-27.4,18,39,18.2,0xa49b88);
 works(3003,-33.5,13,13,11,0xc1b59e);
 strip(2925,3014,()=>-16.8,()=>-21.4,()=>.24,0xb5ac99);
 flush(2971);

 // At the end of the courts, two walks converge beside a neighbourhood club.
 const walk=d=>-24-(d-2025)*.13;
 strip(2025,2149,d=>walk(d)-2.18,d=>walk(d)+2.18,()=>.34,0xcfc0a0);
 for(const [d,x] of [[2040,-29],[2087,-36],[2123,-43]])copse(d,x,3,.82);
 pavilion(2078,-57,13,31,5.7,0xb0a18d);yard(2141,-73,18,30,8.4,0xc2b09a);
 for(const d of [2060,2082,2115])block(d,walk(d)-3,.33,.8,.55,5.2,0xa48369);
 flush(2085);

 // Municipal waterworks establish the transition from warehouses to the bridge.
 // The two low halls lead into the landward levee; the bridge deck stays open.
 yard(4095,67,21,38,8.4,0xa2b0a7);yard(4142,52,16,34,6.9,0xa5a69b);
 for(const at of [4112,4134]){const x=36;
  form(cylinder,at,x,4.9,6.1,9.6,6.1,0,0x859e9c);
  form(cylinder,at,x,9.77,6.45,.34,6.45,0,0xb7b7a6);
 }
 copse(4170,69,3,.89);flush(4132);
 // A covered walk links the plaza to the terminal neighbourhood. Its distinct
 // groups turn within the block; they do not extend the roadside furniture line.
 strip(6435,6568,d=>-29-.11*(d-6435),d=>-33-.11*(d-6435),()=>.38,0xc0ae96);
 for(const [at,x,bays] of [[6450,-33.3,3],[6514,-40.1,4]]){
  for(let i=0;i<bays;i++){const z=at+i*5.5,dx=x-i*.6;
   block(z,dx-2.0,.38,.42,3.8,.40,0x697972);block(z,dx+1.8,.38,.35,3.7,.36,0x697972);
   roof(z,dx,5.6,5.43,4.12,4.58,0xbebbaa,0x788e87);
  }
 }
 copse(6476,-47,3,.86);copse(6557,-48,4,.92);flush(6510);

 // The harbour overlook sits on the dry abutment, before the open bridge span.
 reviewGroup('mid',4351,()=>{
  const x=23.3;
  block(4351,x,-1.42,10,1.87,17.2,0xa6a898);
  block(4352,x,.43,8.8,2.3,13.7,0x879f9a);
  block(4352,x,2.72,8.87,2.45,13.76,0x57787e);
  block(4352,x,5.17,10.1,.48,15,0xc9cab4);
  for(const z of [4347,4352,4357])block(z,x-4.46,2.76,.22,2.43,.30,0xc3c4af);
  block(4355,x+3,5.65,.18,3.12,.19,0x82938d);
 });
 flush(4351);
 // On the descent the river-facing steps and shaded landing mark the return
 // to inhabited ground. Keep the left through view and water between banks.
 reviewGroup('mid',5710,()=>{
  const x=33;
  for(let i=0;i<4;i++)block(5712,x-i*1.3,.25,1.36,.38+i*.26,33-i*.7,0xb8ac96);
  for(const d of [5698,5716,5737]){
   block(d,x-4.3,.3,.42,4.8,.41,0x6a827d);
   block(d,x+1.3,.3,.39,4.5,.41,0x6a827d);
   roof(d,x-1.45,7.4,8.7,5.08,4.57,0xb3beab,0x78908b);
  }
 });
 flush(5713);
 // A clock on the existing arrivals forecourt makes the station readable before
 // the bus bays. The dial is geometry and can be seen against a bright sky.
 reviewGroup('mid',6953,()=>{
  const d=6953,x=-21.3;
  block(d,x,.18,3.8,.6,3.8,0xa59a83);
  block(d,x,.78,.85,7.6,.83,0x607574);
  block(d,x,8.1,3.6,3.62,.88,0x496967);
  block(d-.50,x,8.35,3.11,3.12,.19,0xe6d8af);
  block(d-.63,x-.08,9.78,.20,1.23,.11,0x556663);
  block(d-.66,x+.40,9.60,.99,.18,.12,0x556663);
  block(d,x,11.71,3.87,.23,1.1,0x647e78);
 });
 flush(6953);
 cylinder.dispose();

 unitBox.dispose();crown.dispose();
}
