import * as T from 'three';
import turfURL from './assets/ballpark.webp?url';

// Fixed far-bank parcel in the same river frame as the quay. A metre of grass
// stays a metre even where the viaduct turns away from the shore.
const homeU=-47,homeV=42,forwardU=-.72,forwardV=Math.sqrt(1-forwardU*forwardU);
const polar=(a,r)=>[Math.sin(a)*r,Math.cos(a)*r];
function bankCoords(x,z){return [homeU+forwardV*x+forwardU*z,homeV-forwardU*x+forwardV*z];}
const arc=Array.from({length:33},(_,i)=>polar((i/32-.5)*Math.PI*.54,80));
const outline=[[-8,-7],[0,-11],[8,-7],...arc.slice().reverse()];
// Reserve the playing fan and foul territory in the bank frame. Replace only
// colliding lower-bank parcels (not the entire waterfront planting belt).
export function parkOccupies(u,v,r){
 const du=u-homeU,dv=v-homeV,x=du*forwardV-dv*forwardU,z=du*forwardU+dv*forwardV;
 const t=Math.min(80,Math.max(0,z));
 return z+r>=-13 && z-r<=86 && Math.abs(x)<Math.min(t*.99+14,64)+r && Math.hypot(x,z)<90+r;
}

export function addBallpark({scene,cityChunks,riverside,span}){
 const level=12.5;
 const point=(x,y,z)=>{const [u,v]=bankCoords(x,z);return new T.Vector3(...riverside(u,span+v,level+y));};
 const coords=[],uv=[];
 for(let i=0;i<outline.length;i++){
  let points=[[0,11],outline[i],outline[(i+1)%outline.length]];
  const [a,b,c]=points.map(([x,z])=>point(x,0,z));if(b.sub(a).cross(c.sub(a)).y<0)points=[points[0],points[2],points[1]];
  for(const [x,z] of points){coords.push(...point(x,0,z).toArray());uv.push((x+64)/128,(z+12)/96);}
 }
 const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(coords,3));ground.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ground.computeVertexNormals();
 const texture=new T.TextureLoader().load(turfURL);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 const field=new T.Mesh(ground,new T.MeshLambertMaterial({map:texture}));field.name='city-ballpark-turf';
 field.receiveShadow=true;scene.add(field);cityChunks.push({at:5660,mesh:field});
 const pos=[],color=[],tint=new T.Color();
 function quad(a,b,c,d,col){tint.setHex(col);for(const p of [a,b,c,a,c,d]){pos.push(...point(...p).toArray());color.push(tint.r,tint.g,tint.b);}}
 function cuboid(x,y,z,w,h,l,col,angle=0){
  const s=Math.sin(angle),c=Math.cos(angle),p=(a,b,t)=>[x+c*a+s*t,y+b,z-s*a+c*t],a=-w/2,b=w/2,e=-l/2,f=l/2;
  for(const face of [[[a,0,e],[a,h,e],[b,h,e],[b,0,e]],[[a,0,f],[b,0,f],[b,h,f],[a,h,f]],[[a,0,e],[a,0,f],[a,h,f],[a,h,e]],[[b,0,e],[b,h,e],[b,h,f],[b,0,f]],[[a,h,e],[a,h,f],[b,h,f],[b,h,e]]])quad(...face.map(v=>p(...v)),col);
 }
 // A flood-protected upper terrace connects to the city grade at the landing.
 // A planted outer batter descends to the existing 5.5 m public riverwalk.
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length];
  // Where the dock service street skirts first base, the planted bank
  // becomes a compact stepped retaining edge inside the ballpark lot.
  const ledge=(p,w,y)=>{if(p[0]>0&&p[1]<58)w*=.23;const dx=p[0],dz=p[1]-29,l=Math.hypot(dx,dz);return [p[0]+w*dx/l,y,p[1]+w*dz/l];};
  for(const [u,v,lo,hi,col] of [[0,1.8,0,-.03,0xa69f82],[1.8,4,-.03,-2.72,0x889567],[4,5,-2.72,-2.84,0xa4a181],[5,10,-2.84,5.48-level,0x778761]]){
   const retaining=a[0]>0&&b[0]>0&&a[1]<58&&b[1]<58;
   quad(ledge(a,u,lo),ledge(b,u,lo),ledge(b,v,hi),ledge(a,v,hi),retaining&&hi<-.5?(v===10?0x939186:0xa49d8c):col);
  }
 }
 const teal=0x266357,silver=0xc4cbc5,cream=0xe3cfa5;
 for(let i=1;i<arc.length;i++){const a=arc[i-1],b=arc[i];
  quad([a[0],0,a[1]],[b[0],0,b[1]],[b[0],1.48,b[1]],[a[0],1.48,a[1]],teal);
  if(i%4===0)cuboid(b[0],0,b[1],.18,1.75,.18,silver);}
 for(const s of [-1,1]){const [x,z]=polar(s*Math.PI/4,79.6);cuboid(x,0,z,.28,9,.28,0xeac140);}
 // One cantilevered spectator bank on the far foul side. The side facing
 // the approach is deliberately open so the players and diamond stay visible.
 const along=Math.PI/4;
 for(let row=0;row<5;row++){
  const x=37+row*.80,z=24-row*.80;
  cuboid(x,5.48-level,z,1.6,level-5.48+1+row*.55,24,0x988e7f,along);
  cuboid(x,.95+row*.55,z,1.57,.21,23,0x528589,along);
 }
 {const x=17,z=5;
  cuboid(x,5.48-level,z,3.6,level-5.48+.30,13,0xa9a69a,Math.PI/4);
  for(const dz of [-4.2,4.2])cuboid(x+dz*.707,.25,z+dz*.707,.24,2.1,.24,teal);
  cuboid(x,.98,z,1,.24,11,cream,Math.PI/4);cuboid(x,2.42,z,3.7,.28,13.5,teal,Math.PI/4);
 }
 // Stairs on the third-base side connect the higher field to the quay walk.
 for(let i=0;i<40;i++){
  const bottom=5.50-level,top=-(level-5.52)*i/40;
  cuboid(-20.1-i*.32,bottom,9,.34,top-bottom+.08,2.5,0xbcb49d);
 }
 // Backstop posts and cables are seen edge-on at speed; no opaque screen across the infield.
 for(const [x,z] of [[-9,-4],[-5,-8],[0,-10],[5,-8],[9,-4]])cuboid(x,0,z,.16,5.9,.16,silver);
 for(const h of [1.2,5.55])for(const [a,b] of [[[-9,-4],[-5,-8]],[[-5,-8],[0,-10]],[[0,-10],[5,-8]],[[5,-8],[9,-4]]]){
  cuboid((a[0]+b[0])/2,h,(a[1]+b[1])/2,.08,.09,Math.hypot(a[0]-b[0],a[1]-b[1]),silver,Math.atan2(b[0]-a[0],b[1]-a[1]));
 }
 for(const [x,z] of [[-47,34],[48,44],[12,83]]){
  cuboid(x,5.48-level,z,1.08,level-5.48+.26,1.08,0x9d9b88);cuboid(x,.26,z,.49,15.74,.49,0x8f9285);cuboid(x,15.6,z,4.6,1.55,.64,0x4e605f);
  for(const k of [-1,0,1])cuboid(x+k*1.40,15.8,z-.36,1.04,.73,.20,0xdadac4);
 }
 // Centre-field scoreboard faces the batter. A second enamel nameplate on the
 // road-facing foul-side gate identifies the venue before the diamond opens up.
 const scoreboard=[-9,76.8];for(const x of [-15,-3])cuboid(x,0,76.8,.72,8.1,.72,teal);
 cuboid(-9,6.20,76.8,20.8,7.25,.78,teal);
 for(const x of [22,30]){
  cuboid(x,5.48-level,10.5,.77,level-5.48+.15,.77,0x9e9b8b);
  cuboid(x,.15,10.5,.28,4.05,.28,teal);
 }
 cuboid(26,3.10,10.5,9,2.35,.45,teal);
 // The club's stitched enamel baseball is a civic entrance finial, grounded
 // on its own brick gatepier. The field itself remains fully open to the road.
 const crestX=31.1,crestZ=10.50;
 cuboid(crestX,5.48-level,crestZ,1.6,level-5.48+4.82,1.7,0x9e684d);
 cuboid(crestX,4.82,crestZ,2.1,.27,2.10,cream);
 const skin=(lat,lon,r=1.75)=>[crestX+r*Math.cos(lat)*Math.cos(lon),6.63+r*Math.sin(lat),crestZ+r*Math.cos(lat)*Math.sin(lon)];
 for(let lat=0;lat<10;lat++)for(let lon=0;lon<20;lon++){
  const lo=Math.PI*(lat/10-.5),hi=lo+Math.PI/10,a=lon*Math.PI/10,b=a+Math.PI/10;
  quad(skin(lo,a),skin(lo,b),skin(hi,b),skin(hi,a),0xe9dbbe);
 }
 for(const shift of [0,Math.PI]){
  const seam=lat=>shift+.67*Math.cos(lat*2.0)+.27;
  for(let k=0;k<30;k++){const a=(k/30-.5)*Math.PI,b=a+Math.PI/30;
   quad(skin(a,seam(a)-.045,1.79),skin(a,seam(a)+.045,1.79),skin(b,seam(b)+.045,1.79),skin(b,seam(b)-.045,1.79),0x995147);
   if(k%2===0)quad(skin(a+.03,seam(a)-.10,1.80),skin(a+.056,seam(a)-.10,1.80),skin(a+.10,seam(a)+.10,1.80),skin(a+.075,seam(a)+.10,1.80),0x955449);
  }
 }
 for(let k=0;k<5;k++)for(const j of [0,2,4,6]){
  const x=36.8+k*.81+(j-3)*.75,z=24-k*.8+(j-3)*.75,y=1.4+k*.51;
  cuboid(x,y,z,.49,.56,.36,(k+j)%3===0?0xa64e33:0xc6b987);cuboid(x,y+.55,z,.33,.33,.30,0xb88769);
 }

 // Chalk and regulation-size raised bags catch a grazing sun above the grass.
 for(const [x,z] of [[-19.40,19.40],[19.40,19.40],[0,38.8]])cuboid(x,.018,z,.46,.10,.46,0xfff4df,Math.PI*.25);
 for(let i=0;i<20;i++){
  const a=i*Math.PI/10,b=a+Math.PI/10;
  const at=(ang,r,y)=>[Math.cos(ang)*r,y,18.44+Math.sin(ang)*r];
  quad(at(a,2.55,.018),at(b,2.55,.018),at(b,.91,.25),at(a,.91,.25),0xb9734d);
  quad(at(a,.91,.25),at(b,.91,.25),[0,.25,18.44],[0,.25,18.44],0xc17a53);
 }
 cuboid(0,.25,18.44,.64,.075,.20,0xf9f2db);
 function athlete(x,z,fielding,bat=false){
  const shirt=fielding?0xe1dac0:0xa94735;
  const base=Math.abs(z-18.44)<.01&&x===0?.25:0;
  const body=(u,y,v,w,h,d,ink)=>cuboid(u,y+base,v,w,h,d,ink);
  body(x-.18,.01,z-.04,.25,.15,.41,0x4a4945);body(x+.18,.01,z+.10,.25,.15,.41,0x4a4945);
  body(x-.18,.10,z,.23,.78,.30,0x4a5358);body(x+.18,.10,z+.12,.23,.78,.30,0x4a5358);
  body(x,.79,z,.81,.69,.43,shirt);body(x,1.47,z,.39,.39,.35,0xba8265);
  body(x,1.80,z-.04,.52,.12,.50,fielding?teal:0x934234);
  body(x+.46,1.03,z+.16,.24,.37,.31,0x805538);
  if(bat)body(x+.55,1.22,z,.09,1.05,.09,cream);
  else body(x-.45,1.10,z+.09,.24,.25,.35,0x8e6649);
 }
 for(const [x,z] of [[0,18.44],[-18,20],[18,21],[7,40],[-25,54],[20,62]])athlete(x,z,true);
 athlete(1.25,.0,false,true);
 const kit=new T.BufferGeometry();kit.setAttribute('position',new T.Float32BufferAttribute(pos,3));kit.setAttribute('color',new T.Float32BufferAttribute(color,3));kit.computeVertexNormals();
 const work=new T.Mesh(kit,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));work.name='city-ballpark-stands';scene.add(work);cityChunks.push({at:5660,mesh:work});
 const sign=document.createElement('canvas');sign.width=512;sign.height=224;const g=sign.getContext('2d');
 g.fillStyle='#1c4245';g.fillRect(0,0,512,224);g.fillStyle='#eee0ad';g.font='bold 45px sans-serif';g.fillText('河岸棒球場',24,57);
 g.font='bold 22px monospace';g.fillText('RIVER FIELD     1  2  3  4  R',23,99);g.fillText('CITY           0  1  0  1  2',23,142);g.fillText('RIVERSIDE      0  0  1  0  1',23,181);
 const map=new T.CanvasTexture(sign);map.colorSpace=T.SRGBColorSpace;
 function placard(x,y,z,w,h,tex,name){
  const board=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshLambertMaterial({map:tex,side:T.DoubleSide}));
  board.position.copy(point(x,y,z));board.lookAt(point(x,y,z-2));board.name=name;
  scene.add(board);cityChunks.push({at:5660,mesh:board});
 }
 placard(scoreboard[0],9.82,scoreboard[1]-.42,20.35,6.88,map,'city-ballpark-score');
 const gate=document.createElement('canvas');gate.width=512;gate.height=128;const t=gate.getContext('2d');
 t.fillStyle='#285e52';t.fillRect(0,0,512,128);t.fillStyle='#f4e7bf';t.font='bold 57px sans-serif';t.fillText('河岸棒球場',19,67);
 t.font='bold 23px sans-serif';t.fillText('R I V E R S I D E    B A L L P A R K',20,104);
 t.fillStyle='#e2dcc7';t.beginPath();t.arc(440,57,36,0,Math.PI*2);t.fill();t.strokeStyle='#a75642';t.lineWidth=4;
 for(const side of [-1,1]){t.beginPath();t.moveTo(440+side*16,26);t.quadraticCurveTo(440+side*3,57,440+side*16,88);t.stroke();}
 const crest=new T.CanvasTexture(gate);crest.colorSpace=T.SRGBColorSpace;
 placard(26,4.28,10.24,8.8,2.2,crest,'city-ballpark-gate');

}
