import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

type Point = [number,number,number];
const linen=0xffe8b7, coral=0xd95138, sea=0x275855, palm=0x795b43, iron=0x414a47;
const plaster=0xf3dfc3, ochre=0xbb815c, glass=0x426468, shade=0x324849;
const limewash=new T.MeshStandardMaterial({vertexColors:true,roughness:.87,emissive:0xc5a58c,emissiveIntensity:.15,side:T.DoubleSide});
limewash.name='Salt-worn lighthouse masonry';
const finish=new T.MeshStandardMaterial({vertexColors:true,roughness:.83,side:T.DoubleSide});
finish.name='Kenting sun-washed finishes';
type Quad=[Point,Point,Point,Point];

/** Offline and runtime use the same local-metre, Y-up templates. */
class Builder{
 private readonly pieces:T.BufferGeometry[]=[];
 add(g:T.BufferGeometry,color:number,p:Point=[0,0,0],rot:Point=[0,0,0],scale:Point=[1,1,1]){
  g.deleteAttribute('uv');
  if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
  const c=new T.Color(color),rgb=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(rgb,3));
  g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));
  this.pieces.push(g);
 }
 box(color:number,p:Point,size:Point,rot:Point=[0,0,0]){this.add(new T.BoxGeometry(...size),color,p,rot);}
 cylinder(color:number,p:Point,top:number,bottom:number,height:number,segments=10){
  this.add(new T.CylinderGeometry(top,bottom,height,segments),color,p);
 }
 rod(color:number,a:Point,b:Point,r:number,segments=5){
  const begin=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(begin);
  const geo=new T.CylinderGeometry(r,r,axis.length(),segments,1,true);
  geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize()));
  this.add(geo,color,begin.lerp(end,.5).toArray());
 }
 quad(color:number,[a,b,c,d]:Quad){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c,...d],3));
  g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();this.add(g,color);
 }
 mesh(name:string){
  const merged=mergeGeometries(this.pieces)!;
  const geometry=mergeVertices(merged,1e-5);merged.dispose();this.pieces.forEach(g=>g.dispose());
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,finish);mesh.name=name;return mesh;
 }
}

function beachShade(b:Builder,accent:number){
 // Repeated stitched gores: cloth bellies below the ribs, then hangs in scallops.
 const panels=10,radius=3.13,rim=3.15;
 const point=(a:number,r:number,y:number):Point=>[Math.cos(a)*r,y,Math.sin(a)*r];
 for(let i=0;i<panels;i++){
  const pitch=Math.PI*2/panels,a=i*pitch,col=i%2?linen:accent;
  const row=(j:number,t:number)=>{
   const mid=Math.sin(Math.PI*j/2),r=radius*t*(1-.027*mid);
   return point(a+j*pitch/2,r,rim+1.13*(1-t*t)-.115*mid*t);
  };
  for(let j=0;j<2;j++){
   for(const [lo,hi] of [[.018,.55],[.55,1]])b.quad(col,[row(j,lo),row(j+1,lo),row(j+1,hi),row(j,hi)]);
   const left=row(j,1),right=row(j+1,1);
   const hem=(p:Point,mid:boolean):Point=>[p[0]*.992,p[1]-(mid?.20:.10),p[2]*.992];
   b.quad(col,[left,right,hem(right,j===0),hem(left,j===1)]);
   const seam=(p:Point):Point=>[p[0],p[1]+.04,p[2]];
   b.quad(linen,[hem(left,j===1),hem(right,j===0),seam(hem(right,j===0)),seam(hem(left,j===1))]);
  }
  const tip=point(a,radius,rim-.04),elbow=point(a,radius*.55,rim+.73);
  b.rod(palm,[0,rim+1.08,0],elbow,.023);b.rod(palm,elbow,tip,.023);b.rod(iron,[0,2.85,0],elbow,.026);
 }
 b.cylinder(palm,[0,2.07,0],.048,.063,4.14);
 b.cylinder(linen,[0,4.30,0],.055,.11,.13);b.cylinder(iron,[0,.07,0],.23,.29,.14);
}
function sling(b:Builder){
 const frame=0xcaab82;
 for(const x of [-.32,.32]){
  b.rod(frame,[x,.04,.51],[x,1.09,-.52],.052);
  b.rod(frame,[x,.04,-.55],[x,.62,.32],.052);
  b.rod(frame,[x,.70,-.21],[x,.70,.28],.034);
 }
 for(let i=0;i<5;i++){
  const x=-.29+i*.116,c=i===1||i===3?0xb56d56:linen;
  b.quad(c,[[x,.56,.39],[x+.116,.56,.39],[x+.116,.45,-.04],[x,.45,-.04]]);
  b.quad(c,[[x,.45,-.04],[x+.116,.45,-.04],[x+.116,1.07,-.46],[x,1.07,-.46]]);
 }
}

function gable(b:Builder,x:number,z:number,w:number,l:number,y:number,rise:number,c:number){
 for(const side of [-1,1]){
  const e=x+side*w/2;
  b.quad(c,[[e,y,z-l/2],[x,y+rise,z-l/2],[x,y+rise,z+l/2],[e,y,z+l/2]]);
  b.box(palm,[e,y-.08,z],[.15,.19,l]);
 }
 for(const end of [-1,1]){
  const zz=z+end*l/2;
  b.quad(ochre,[[x-w/2,y,zz],[x-.06,y+rise,zz],[x+.06,y+rise,zz],[x+w/2,y,zz]]);
 }
 b.rod(c,[x,y+rise,z-l/2],[x,y+rise,z+l/2],.11,8);
}
function coastalHouse(b:Builder,inn:boolean,alternate:boolean){
 const w=inn?7:6.9,l=inn?10:10.8,h=inn?6.55:3.55,x=-w/2;
 const wall=inn?(alternate?0xd2af8e:plaster):(alternate?0xe3b48e:0xeed2a7);
 // Recess the ground floor by 1.5 m behind actual open shopfront bays.
 // Continuous side returns and the upper floor close the envelope.
 const recess=1.5,lower=3.15;
 b.box(wall,[recess/2,lower/2,0],[w-recess,lower,l]);
 for(const z of [-l/2+.12,l/2-.12])b.box(wall,[x+recess/2,lower/2,z],[recess,lower,.24]);
 for(const z of [-l/2+.15,-1.72,1.72,l/2-.15])b.box(wall,[x+.14,lower/2,z],[.28,lower,.31]);
 b.box(wall,[0,(h+lower)/2,0],[w,h-lower,l]);b.box(ochre,[0,.17,0],[w+.18,.34,l+.18]);
 if(inn&&alternate){
  b.box(linen,[0,h+.12,0],[w+.72,.27,l+.8]);b.box(sea,[1.25,h+.63,.95],[3.1,1.01,4.4]);
 }else gable(b,0,0,w+1.08,l+.86,h,inn?1.43:1.2,alternate?0x797c6c:0xa85642);
 // Deep-set bays and timber shutters read at distance from the road (-X).
 for(const z of [-3.4,0,3.4]){
  b.box(shade,[x+recess-.045,1.53,z],[.13,2.56,2.29]);
  b.box(glass,[x+recess-.135,1.7,z],[.10,1.87,1.82]);
  b.box(palm,[x+recess-.21,1.65,z],[.09,2.03,.09]);
  b.box(linen,[x+recess-.22,1.10,z],[.13,.12,1.95]);
  if(inn){
   b.box(glass,[x-.08,4.89,z],[.20,1.74,1.86]);
   for(const side of [-1,1])b.box(sea,[x-.16,4.89,z+side*1.21],[.18,1.87,.49],[0,side*.18,0]);
  }
 }
 // Side windows and casements are visible before the road-facing porch.
 for(const end of [-1,1])for(const xx of [-1.85,1.25]){
  const z=end*(l*.5+.06);
  b.box(palm,[xx,1.95,z],[1.32,1.39,.13]);b.box(glass,[xx,1.95,z+end*.08],[1.08,1.14,.08]);
  if(inn)b.box(glass,[xx,4.83,z],[1.24,1.32,.15]);
 }
 const porch=x-2.2;
 b.box(0xc6ac90,[x-.94,.17,0],[2.72,.34,l+.28]);
 for(const z of [-l/2+.22,0,l/2-.22])b.box(palm,[porch,inn?1.60:1.52,z],[.17,inn?3.08:2.76,.17]);
 if(inn){
  b.box(linen,[x-.98,3.30,0],[2.72,.33,l+.26]);
  for(const y of [3.72,4.20])b.rod(sea,[porch,y,-l/2],[porch,y,l/2],.07);
  for(let z=-l/2;z<=l/2+.01;z+=l/6)b.box(palm,[porch,3.81,z],[.12,1.08,.12]);
 }else{
  const n=8;
  for(let i=0;i<n;i++){
   const z=-l/2+i*l/n,z2=z+l/n,c=i%2?(alternate?0xe4bc88:0x74988a):sea;
   b.quad(c,[[x,3.63,z],[x,3.63,z2],[porch-.55,2.96,z2],[porch-.55,2.96,z]]);
   b.box(c,[porch-.55,2.82,(z+z2)/2],[.095,.31,l/n]);
  }
  b.box(palm,[x-.59,1,-2.72],[1.12,.98,3.38]);b.box(linen,[x-.60,1.54,-2.72],[1.31,.12,3.57]);
 }
}
function rescue(b:Builder){
 for(const x of [-1.15,1.15])for(const z of [-1,1]){
  b.rod(palm,[x*1.18,0,z*1.22],[x,2.82,z],.105,6);b.box(linen,[x,3.88,z],[.13,2.2,.13]);
 }
 for(const z of [-1,1])for(const side of [-1,1])b.rod(ochre,[side*1.35,.18,z*1.2],[-side*1.12,2.73,z],.077);
 b.box(palm,[0,2.79,0],[2.93,.23,2.85]);b.box(linen,[0,2.95,1.44],[2.93,.18,.11]);
 for(const x of [-1.24,1.24])b.rod(linen,[x,3.52,-1],[x,3.52,1.12],.064);
 b.box(coral,[0,3.21,.98],[2.24,.39,.13]);
 b.box(linen,[0,3.21,1.06],[.83,.12,.07]);b.box(linen,[0,3.21,1.07],[.15,.32,.07]);
 // Rescue ring hangs from the seaward gallery rail.
 for(let i=0;i<4;i++)b.add(new T.TorusGeometry(.38,.084,6,6,Math.PI/2),i%2?linen:coral,
  [-1.25,3.24,.08],[0,-Math.PI/2,i*Math.PI/2]);
 gable(b,0,0,3.64,3.38,4.89,.59,coral);
 for(const x of [-.48,.48])b.rod(palm,[x,.05,2.23],[x,2.87,1.24],.074);
 for(let i=1;i<=7;i++){const t=i/8;b.rod(linen,[-.48,t*2.86,2.23-t],[.48,t*2.86,2.23-t],.070);}
 b.rod(iron,[-1,2.8,1],[-1,5.91,1],.055);
 const tail=1.50;
 for(let i=0;i<4;i++){
  const panel=(j:number,top:boolean):Point=>{const t=j/4;return [-1+.13*Math.sin(t*6),5.70-.19*t-(top?0:.69*(1-.55*t)),1+t*tail];};
  b.quad(i===3?0xeb7946:coral,[panel(i,true),panel(i+1,true),panel(i+1,false),panel(i,false)]);
 }
}
function lighthouse(b:Builder){
 const profile=[[0,2.48],[.42,2.5],[.66,2.40],[4,2.22],[17,1.83],[25.75,1.50],[26.00,1.68],[26.38,1.75],[26.68,2.29],[27.00,2.70]];
 const lathe=new T.LatheGeometry(profile.map(([y,r])=>new T.Vector2(r,y)),24);b.add(lathe,0xf6e6d0);
 for(const [y,r] of [[.49,2.46],[26.18,1.82],[27.06,2.93]])b.cylinder(linen,[0,y,0],r,r,.17,24);
 // Gallery posts and rings leave real sky between rails; the lantern has a warm optic behind mullions.
 for(const y of [27.54,28.02]){const rail=new T.TorusGeometry(2.63,.050,5,24);b.add(rail,iron,[0,y,0],[Math.PI/2,0,0]);}
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;b.rod(iron,[2.63*Math.cos(a),27.1,2.63*Math.sin(a)],[2.63*Math.cos(a),28.04,2.63*Math.sin(a)],.045);
 }
 b.cylinder(sea,[0,27.36,0],1.43,1.63,.4,12);
 b.add(new T.SphereGeometry(.71,12,8),0xffcf72,[0,28.66,0],[0,0,0],[1,1.32,1]);
 for(let i=0;i<10;i++){
  const a=i*Math.PI/5,xx=1.42*Math.cos(a),z=1.42*Math.sin(a);
  b.rod(iron,[xx,27.47,z],[xx,29.81,z],.069);
  // Opaque blue-grey rear panes leave the road-facing opening clear of alpha sorting.
  if(i>=2&&i<=4){const end=a+Math.PI/5;
   b.quad(i===3?0x718b8b:0x526c71,[[xx,27.55,z],[xx,29.68,z],[1.42*Math.cos(end),29.68,1.42*Math.sin(end)],[1.42*Math.cos(end),27.55,1.42*Math.sin(end)]]);
  }
  if(i%3===0)b.rod(0x91a8a0,[xx,29.69,z],[1.42*Math.cos(a+.55),28.66,1.42*Math.sin(a+.55)],.031);
 }
 b.cylinder(iron,[0,29.82,0],1.83,1.72,.18,20);b.cylinder(0x6e7d75,[0,30.38,0],.35,1.89,1.06,20);b.cylinder(iron,[0,31.31,0],.045,.18,.78);
 for(const [i,y] of [4,10.65,17.5,23].entries()){
  const a=.65+i*.40,r=2.38-y*.035;
  b.box(ochre,[r*Math.sin(a),y,r*Math.cos(a)],[.64,1.17,.16],[0,a,0]);
  b.box(shade,[(r+.095)*Math.sin(a),y,(r+.095)*Math.cos(a)],[.44,.88,.11],[0,a,0]);
 }
}
function pandanus(b:Builder){
 b.rod(palm,[0,.05,0],[.25,1.65,.16],.116,7);
 for(let i=0;i<4;i++){const a=i*1.57;b.rod(ochre,[.16,1.08,.1],[.60*Math.cos(a),.0,.60*Math.sin(a)],.073);}
 for(const [dx,dy,dz] of [[.69,1.99,-.1],[-.23,2.39,.39]]){
  b.rod(palm,[.18,1.29,.1],[dx,dy,dz],.091);
  for(let i=0;i<13;i++){
   const a=i*2.4,h=.65+.25*Math.sin(i),len=.95+.38*Math.sin(i*3.1),c=[0x778747,0x7d9053,0x536940,0x939954][i%4];
   const loc=(r:number,y:number,side:number):Point=>[dx+Math.cos(a)*r-Math.sin(a)*side,dy+y,dz+Math.sin(a)*r+Math.cos(a)*side];
   b.quad(c,[loc(0,0,0),loc(.49,h,.12),loc(len,h*.27,0),loc(.51,h,-.12)]);
  }
 }
}
export const kentingHeroIds=['parasol-coral','parasol-mango','parasol-sage','sling-chair','veranda-shop','awning-shop','balcony-inn','terrace-inn','rescue-platform','gallery-lighthouse','coastal-pandanus'] as const;
export type KentingHeroId=typeof kentingHeroIds[number];
const templates=new Map<KentingHeroId,T.Mesh>();
export function kentingHero(id:KentingHeroId){
 let asset=templates.get(id);
 if(!asset){const b=new Builder();
  switch(id){
   case 'parasol-coral':case 'parasol-mango':case 'parasol-sage':beachShade(b,id==='parasol-coral'?coral:id==='parasol-mango'?0xe4aa57:0x839786);break;
   case 'sling-chair':sling(b);break;
   case 'veranda-shop':case 'awning-shop':case 'balcony-inn':case 'terrace-inn':coastalHouse(b,id.endsWith('inn'),id==='awning-shop'||id==='terrace-inn');break;
   case 'rescue-platform':rescue(b);break;
   case 'gallery-lighthouse':lighthouse(b);break;
   case 'coastal-pandanus':pandanus(b);break;
  }
  asset=b.mesh(id);if(id==='gallery-lighthouse')asset.material=limewash;templates.set(id,asset);
 }
 return asset.clone();
}
