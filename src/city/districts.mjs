// Street finishes are in track metres. The bridge gets a cooler deck surface;
// its long views and water keep their original geometry and lighting.
export const districts = [
 {from:0,to:180,wall:[0xc7bda5,0xadbbad,0xb7bac0],accent:0x526c6b,wear:.7},
 {from:180,to:1620,wall:[0xc8a589,0xc0b49a,0xa6b9ad,0xc1b2a3,0xb1bec2],accent:0x386764,wear:1},
 {from:1620,to:2220,wall:[0xc6c0ae,0x9cab92,0xb9b1a1],accent:0x5d7158,wear:.8},
 {from:2220,to:4310,wall:[0x9db4ab,0xc7b894,0xb69883,0xa0aeb5],accent:0x406b67,wear:.84},
 {from:4310,to:5675,wall:[0x93a7a7],accent:0x58787c,wear:.38},
 {from:5675,to:6510,wall:[0xd6c5b2,0xc3b4ad,0xabbdba],accent:0x86434b,wear:.94},
 {from:6510,to:7500,wall:[0xbdac95,0xc6b7a4,0xa6b3b3,0xb99277],accent:0x375966,wear:.85}
];
export const districtAt=d=>districts.find(p=>d<p.to)||districts.at(-1);

const campaigns={
 fruit:{title:'日青果行',english:'CITRUS  /  06',paper:'#efc27c',ink:'#254e43',accent:'#c56d34'},
 mall:{title:'汐光百貨',english:'GALLERIA  /  EAST',paper:'#e9d9bf',ink:'#653346',accent:'#a87884'},
 quay:{title:'沿河生活',english:'QUAY  /  WEEKEND',paper:'#d3d5b4',ink:'#335862',accent:'#79a5a0'},
 rail:{title:'中央驛',english:'CITY TERMINAL',paper:'#ded1af',ink:'#294955',accent:'#997653'}
};
export function composeDistricts({T,box,grade,edge,grove,physicalPos,pose,scene,cityChunks}){
 const faces=new Map();
 function face(id){
  if(faces.has(id))return faces.get(id);
  const art=campaigns[id],c=document.createElement('canvas');c.width=768;c.height=300;const g=c.getContext('2d');
  g.fillStyle=art.paper;g.fillRect(0,0,768,300);
  g.fillStyle=art.ink;g.fillRect(0,234,768,66);
  g.fillStyle=art.accent;
  if(id==='fruit'){for(const [x,y,r] of [[612,88,82],[716,200,95]]){g.beginPath();g.arc(x,y,r,0,2*Math.PI);g.fill();g.strokeStyle=art.paper;g.lineWidth=5;for(let a=.4;a<6.6;a+=1.04){g.beginPath();g.moveTo(x,y);g.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));g.stroke();}}}
  else if(id==='rail'){for(let i=0;i<5;i++){g.fillRect(536+i*47,0,14,231);g.fillRect(519,25+i*39,249,5);}}
  else {for(let i=0;i<4;i++){g.strokeStyle=art.accent;g.lineWidth=15;g.beginPath();g.arc(759,225,42+i*47,Math.PI,1.5*Math.PI);g.stroke();}}
  g.fillStyle=art.ink;g.font='bold 93px "Microsoft JhengHei",sans-serif';g.fillText(art.title,32,175,470);
  g.fillStyle=art.paper;g.font='bold 33px system-ui';g.fillText(art.english,35,279);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map:tex,roughness:.72,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.15});
  faces.set(id,mat);return mat;
 }
 function poster(d,x,bottom,w,h,id){
  const y=grade(d);box(d,x,y+bottom,w+.22,h+.22,.32,'metal',0x454e4e);
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),face(id));mesh.rotation.y=pose(d)[2]+Math.PI;
  mesh.position.fromArray(physicalPos(d-.19,x,y+bottom+h*.5+.1));scene.add(mesh);cityChunks.push({at:d,mesh});
  for(const side of [-1,1])box(d+.12,x+side*w*.35,y+.22,.26,bottom,.32,'metal',0x454e4e);
 }
 poster(1180,edge(1180,1)+7,1.1,3.9,2.15,'quay');
 poster(3699,edge(3699,1)+6.4,1.55,5.1,2.75,'fruit');
 poster(3755,edge(3755,1)+24,5.45,9.8,3.8,'fruit');
 for(const z of [3643,3660,3780,3799]){
  const x=edge(z,1)+15,y=grade(z);
  box(z,x+2,y+.15,7,1.06,11,'plinth',0xaeb1a3);
  for(let n=0;n<3;n++){box(z+n*1.8-2,x+1,y+1.21,1.7,.96+n%2*.6,1.62,'trim',0xbca17c);
   box(z+n*1.8-2,x+.12,y+1.48,.08,.12,1.55,'metal',0x6f715d);}
 }
 // The park stays open on the waterside. Terraces and a glazed conservatory
 // turn the landward end toward the mall, rather than a flat empty horizon.
 for(const [d,x,len] of [[6022,41,28],[6156,43,42],[6247,38,32],[6306,45,34]]){
  const y=grade(d);
  for(let j=0;j<3;j++)box(d,x+j*2.6,y+.2,3.2,.55+j*.53,len-2*j,'trim',0xafa89a);
  grove(d-7,1,x+5,[6.8,9.4,7.1]);
 }
 for(const [d,x,w] of [[6238,53,15],[6260,53,15],[6282,52,15]]){
  const y=grade(d);box(d,x,y+.2,w,6.3,21.6,'plinth',0x699594);
  for(let k=-9;k<=9;k+=3)box(d+k,x-w*.5-.1,y+.22,.28,6.15,.31,'trim',0xe0cfab);
  for(const side of [-1,1])box(d,x+side*w*.26,y+7.15,w*.54,.28,21.7,'canopy',0xbabfb0,0,-side*.23);
 }
 // Low concourse buildings finish the shopping district beyond the square.
 // Their galleries read as a side street while the upper sky stays visible.
 for(const [d,x,w,len,h] of [[6254,-40,15,22,7],[6293,-44,16,24,9.6],[6326,-38,14,18,6.3]]){
  const y=grade(d);
  box(d,x,y+.1,w,h,len,'plinth',0xc7b5a0);
  box(d+2,x-1,y+h-.12,w-.8,2.6,len*.68,'loft',0xad9b91);
  box(d,x+w*.48+1,y+3.65,3.8,.38,len+1.1,'canopy',0xaa7767);
  for(const z of [-.34,0,.34]){
   box(d+z*len,x+w*.5+.05,y+.24,.24,2.95,len*.27,'metal',0x516c71);
   box(d+z*len,x+w*.5+2.8,y+.16,.29,3.55,.30,'trim',0xc5b088);
  }
 }
 const kiosk=5944,kx=-edge(kiosk,-1)-12,ky=grade(kiosk);
 box(kiosk,kx,ky+.2,5.7,3.7,8.2,'plinth',0xc1ad97);
 box(kiosk,kx+2.95,ky+1.1,.18,1.85,6.9,'metal',0x48656b);
 box(kiosk,kx+.25,ky+3.82,7.1,.48,10.6,'canopy',0x845c63);
 poster(5936,kx,1.1,4.4,2.6,'mall');
 poster(5786,-edge(5786,-1)-7,2,6.8,3.25,'mall');poster(6094,-edge(6094,-1)-8.6,3.5,8.4,4.05,'mall');
 poster(6398,-edge(6398,-1)-7.3,1.25,4.2,2.5,'quay');
 // End the perspective beyond the racing/timing line. Low wings frame a
 // recessed, clerestoried train hall. The usable roadway stays clear to finish.
 for(const [d,x,w,len,h] of [[7179,-39,28,35,16],[7190,39,26,36,19],[7222,0,72,27,14]]){
  const y=grade(d);box(d,x,y-.1,w,h,len,'plinth',0x9b8f80);
  box(d,x,y+h-.5,w+2,.85,len+2,'trim',0xd4c5a8);
  for(let j=-w/2+3;j<w/2-1;j+=5.8){
   box(d-len*.5-.26,x+j,y+1.0,4.8,h-3.6,.45,'metal',0x536c70);
   box(d-len*.5-.52,x+j,y+h*.49,4.9,.38,.44,'trim',0xc3b08e);
  }
  if(x===0){box(d+2,x,y+h,w*.73,4.85,18,'loft',0x99aaa5);box(d+2,x,y+h+4.6,w*.76,.65,20,'canopy',0x526662);}
 }
 poster(7016,-edge(7016,-1)-10,2.0,5.4,2.7,'rail');
}
