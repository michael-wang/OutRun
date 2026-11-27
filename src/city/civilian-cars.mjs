import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Common passenger-car silhouettes. Service vehicles have distinct physical footprints.
export const cityFleet=['taxi','parcel-van','crossover','dropside','saloon','hatch','parcel-van','saloon'];
export function civilianCar(kind,bodyColour){
 const parts=[],rubber=0x262d30,alloy=0xc2c3b9,glass=0x526c76,trim=0x424d50;
 const paint=kind==='taxi'?0xe5b345:kind==='parcel-van'?0xe6deba:kind==='dropside'?0x4d8b8c:bodyColour;
 function part(geo,colour,x=0,y=0,z=0){
  const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();g.deleteAttribute('uv');
  g.translate(x,y,z);const v=g.attributes.position.count,colors=new Float32Array(v*3),c=new T.Color(colour);
  for(let i=0;i<v;i++)c.toArray(colors,i*3);g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g);
 }
 function box(w,h,l,c,x,y,z){part(new T.BoxGeometry(w,h,l),c,x,y,z);}
 function quad(a,b,c,d,colour){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...d,...b,...c,...d],3));g.computeVertexNormals();part(g,colour);
 }
 function shell(rows,colours){
  // Longitudinal sections: z, lower half-width, sill, shoulder width/height, crown width/height.
  const ring=([z,base,b,shoulder,h,top,y])=>[[-base,b,z],[base,b,z],[shoulder,h,z],[top,y,z],[-top,y,z],[-shoulder,h,z]];
  const a=rows.map(ring);
  for(let j=1;j<a.length;j++)for(let k=0;k<6;k++){const n=(k+1)%6;
   quad(a[j-1][k],a[j-1][n],a[j][n],a[j][k],colours(j-1,k));}
  for(const i of [0,a.length-1]){const r=a[i],col=colours(i?i-1:0,1);
   quad(r[0],r[1],r[2],r[5],col);quad(r[5],r[2],r[3],r[4],col);}
 }
 function tyre(x,z){
  const sign=Math.sign(x),r=.337;const wheel=(radius,depth,colour,dx)=>{
   const g=new T.CylinderGeometry(radius,radius,depth,12);g.rotateZ(Math.PI/2);part(g,colour,x+sign*dx,r,z);};
  wheel(r,.20,rubber,0);wheel(.219,.018,alloy,.105);wheel(.147,.02,0x64727a,.118);
  for(let i=0;i<5;i++){const a=i*Math.PI*.4;box(.022,.04,.04,alloy,x+sign*.132,r+Math.cos(a)*.105,z+Math.sin(a)*.105);}
 }
 const service=kind==='bus'||kind==='ambulance';
 if(service){
  const bus=kind==='bus',w=bus?2.49:2.12,l=bus?10.6:5.76,h=bus?3.06:2.40;
  const white=bus?0xe4dabe:0xf3f1d9,accent=bus?0x267b83:0xe7802c;
  box(w-.10,h-.65,l-.12,white,0,(h+.55)/2,0);
  box(w-.12,.48,l-.07,accent,0,.89,0);box(w-.26,.13,l-.38,0xb5bdba,0,h,0);
  for(const sign of [-1,1]){
   const x=sign*(w/2-.035);
   if(bus){
    box(.055,1.04,l-.58,0x263e48,x,2.04,0);
    for(let j=0;j<7;j++)box(.062,1.09,.093,white,x,2.02,-4.08+j*1.31);
    for(const z of [-1.65,3.72]){box(.067,1.99,.93,trim,x,1.59,z);box(.074,.80,.70,glass,x,2.08,z);}
   }else{
    box(.07,.70,1.35,glass,x,1.85,1.55);
    box(.07,.14,2.35,accent,x,1.46,-.58);
    box(.081,.57,.24,0x277ca0,x,1.90,-.80);box(.081,.20,.64,0x277ca0,x,1.90,-.80);
   }
   for(const z of [-l*.30,l*.30]){const geo=new T.CylinderGeometry(bus?.49:.39,bus?.49:.39,.19,14);geo.rotateZ(Math.PI/2);
    const r=bus?.49:.39;part(geo,rubber,sign*(w/2-.10),r,z);
    box(.021,.32,.32,alloy,sign*(w/2-.001),r,z);}
   box(.32,.19,.07,0xe13732,sign*w*.33,1.07,-l/2+.035);
   box(.31,.15,.07,0xffe3a2,sign*w*.33,1.03,l/2-.035);
  }
  for(const sign of [-1,1])box(w-.30,bus?.94:.72,.068,glass,0,h-.63,sign*(l/2-.035));
  if(bus){
   box(w*.72,.30,.082,0x293435,0,h-.18,-l/2+.041);
   for(let i=0;i<3;i++)box(.20,.095,.089,0xffcf60,-.29+i*.29,h-.18,-l/2+.044);
   box(1.41,.28,2.5,0xb7b9ac,0,h+.16,-.75);
   }else{
   box(1.32,.15,.37,0x326999,0,h+.12,1.36);
   // Rear door crease and blue medical emblem read from the driver's approach.
   const rear=-l/2-.012;
   box(.03,1.32,.046,trim,0,1.38,rear);
   box(.20,.54,.050,0x277ca0,-.47,1.36,rear-.012);
   box(.54,.20,.052,0x277ca0,-.47,1.36,rear-.013);
   box(1.68,.12,.056,0xffb94a,0,.81,rear-.013);
  }
 }else{
 const van=kind==='parcel-van',truck=kind==='dropside',tall=kind==='hatch'||kind==='crossover',notch=kind==='taxi'||kind==='saloon';
 const tail=notch||truck?-2.13:van?-2.08:-1.94,nose=truck?2.09:2.12,belt=van?1.02:truck?.91:tall?.99:.86;
 const rows=[[tail,.77,.40,.84,belt-.15,.77,belt-.05],[tail+.20,.85,.36,.94,belt-.03,.86,belt+.05],
   [-.96,.88,.40,.92,belt,.84,belt+.09],[.80,.88,.40,.93,belt,.85,belt+.07],
   [nose-.38,.83,.40,.88,belt-.05,.77,belt+.01],[nose,.70,.42,.78,belt-.18,.67,belt-.12]];
 shell(rows,(_,k)=>k===0?rubber:paint);
 for(const s of [-1,1]){tyre(s*.837,-1.30);tyre(s*.837,1.27);box(.10,.12,1.85,trim,s*.90,.43,-.04);}
 const rear=van?-1.98:truck?.36:tall?-1.69:-1.14,front=truck?1.96:1.13;
 const cap=van?2.10:truck?1.87:tall?1.68:1.43;
 const foot=belt+.04,roofBack=rear+(van?.07:truck?.08:tall?.27:.56),roofFront=front-(truck?.36:van?.54:.54);
 // Sloped front and rear glazing share the body's section vertices. The pillars are actual painted returns.
 const rr=(z,half,h)=>[z,.80,foot,.83,foot+.06,half,h];
 shell([rr(rear,.77,foot+.14),rr(roofBack,.70,cap-.06),rr(roofBack+.14,.70,cap),
  rr(roofFront-.12,.69,cap),rr(roofFront,.69,cap-.045),rr(front,.78,foot+.13)],
  (j,k)=>k===3?(j===4?glass:j===0&&!van?glass:paint):k===2||k===4?(j===2?(van?paint:glass):j===0&&van?paint:glass):paint);
 for(const s of [-1,1]){
  const sidePanel=(z1,z2,colour)=>quad([s*.838,foot+.085,z1],[s*.838,foot+.085,z2],[s*.711,cap-.092,z2],[s*.711,cap-.092,z1],colour);
  for(const z of [roofBack+.12,roofFront-.10,...(truck||van?[]:[(roofBack+roofFront)/2])])sidePanel(z-.042,z+.042,paint);
  if(van){sidePanel(roofFront-.89,roofFront-.12,glass);sidePanel(roofBack+.22,roofFront-1.03,0xc7ba95);}
  box(.13,.105,.20,paint,s*.92,foot+.17,front-.25);
  box(.04,.046,.18,alloy,s*.934,belt-.10,.22);
  box(.30,.12,.047,0xffdfab,s*.60,belt-.17,nose+.005);
 }
 if(van){
  box(1.61,1.05,.055,paint,0,1.45,tail+.064);
  for(const s of [-1,1]){box(.60,.38,.061,glass,s*.36,1.66,tail+.024);box(.16,.45,.084,0xb53b2c,s*.77,1.12,tail+.008);}
  box(.034,.89,.07,trim,0,1.43,tail+.010);
 }else if(truck){
  const bed=0x859997;box(1.79,.12,2.25,0x656f69,0,.98,-.81);
  box(1.83,.40,.095,bed,0,1.18,-1.97);
  for(const s of [-1,1]){
   box(.08,.42,2.30,bed,s*.88,1.18,-.84);
   for(const z of [-1.87,-.90,.13])box(.096,.46,.06,alloy,s*.89,1.20,z);
  }
  box(1.68,.11,.12,alloy,0,1.78,.28);
 }else if(kind==='taxi'){
  box(.63,.19,.29,0xffecaf,0,cap+.09,.02);box(.44,.075,.018,0x465f62,0,cap+.1,-.137);
 }else if(kind==='crossover'){
  for(const s of [-1,1])box(.07,.085,1.48,trim,s*.57,cap+.025,-.28);
 }
 for(const s of [-1,1]){
  box(van?.19:truck?.30:.44,.13,.055,0xc03232,s*(van?.72:.61),belt-.19,tail-.018);
  box(.12,.06,.06,0xffc77d,s*.72,belt-.14,tail-.021);
 }
 box(1.54,.14,.07,trim,0,.46,tail+.005);box(.45,.135,.06,0xebead7,0,.62,tail-.025);
 box(.66,.11,.05,trim,0,.54,nose+.008);
 }
 const geometry=mergeGeometries(parts);for(const p of parts)p.dispose();
 const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.53,metalness:.12});
 const car=new T.Mesh(geometry,mat);car.name='city-civilian-'+kind;
 const group=new T.Group();group.add(car);
 // A soft contact under the chassis keeps the tyre patches legible in the sun. One small unlit quad per visible car.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');
 const shadow=ctx.createRadialGradient(16,16,5,16,16,16);shadow.addColorStop(0,'rgba(29,34,37,.53)');shadow.addColorStop(.65,'rgba(31,36,38,.37)');shadow.addColorStop(1,'rgba(35,38,38,0)');ctx.fillStyle=shadow;ctx.fillRect(0,0,32,32);
 const decal=new T.Mesh(new T.PlaneGeometry(service?(kind==='bus'?2.7:2.3):2.28,service?(kind==='bus'?10.85:5.9):4.56),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 decal.rotation.x=-Math.PI/2;decal.position.y=.027;group.add(decal);group.userData.bodyType=kind;return group;
}
