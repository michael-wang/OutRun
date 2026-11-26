// Each location is one stationary, vertex-coloured mesh. The bridge span stays clear.
import * as T from 'three';

export function addCityInteriors({scene,cityChunks,pose,physicalPos,grade,edge}){
 const unitBox=new T.BoxGeometry(1,1,1).toNonIndexed();
 const crown=new T.IcosahedronGeometry(1,1);
 const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const transform=new T.Object3D(),point=new T.Vector3(),ink=new T.Color();
 let vertices=[],colors=[];
 function form(geom,d,x,lift,w,h,len,yaw,col){
  transform.position.fromArray(physicalPos(d,x,grade(d)+lift));transform.rotation.y=pose(d)[2]+yaw;
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
 function copse(d,x,n,scale=1){
  for(let i=0;i<n;i++){
   const at=d+i*4.85+2*Math.sin(d+i),dx=x+4.6*Math.sin(i*1.74+d);
   const h=(8+3*Math.sin(d*.3+i*1.97))*scale;
   block(at,dx,0,.48,h*.74,.55,0x766657);
   form(crown,at,dx,h*.70,h*.53,h*.38,h*.61,at,0x637965);
   form(crown,at+1.6,dx-1.8,h*.85,h*.36,h*.34,h*.43,at*.51,0x859773);
  }
 }
 function pavilion(d,x,w,len,h,col){
  const inward=-Math.sign(x);
  block(d,x,0,w,h,len,col);
  block(d,x+inward*(w*.5+.08),.82,.24,h*.66,len*.86,0x50696a);
  block(d,x+inward*1.2,h,w+3,.55,len+2,0xc8bba2);
  for(let j=-1;j<=1;j++)block(d+j*len*.36,x+inward*(w*.5+2.0),.05,.35,h,.35,0xa49c88);
 }
 function terrace(d,x,w,l,h,c){
  block(d,x,0,w,h,l,c);block(d+2,x-1,h,w*.74,h*.33,l*.65,c);
  for(let y=2.2;y<h-.8;y+=3.4)block(d,x,y,w+.18,.32,l+.18,0x859394);
 }
 function flush(at){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.name='city-interior-'+at;scene.add(mesh);cityChunks.push({at,mesh});vertices=[];colors=[];
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
 unitBox.dispose();crown.dispose();
}
