import * as T from 'three';

type P=[number,number,number];
type Section=[P,number,number];
export const beachPoses=['stand','chat','stride','deck-sit','sand-sit','lookout','build','pat','wade','tread','float','crawl'] as const;
export type BeachPose=typeof beachPoses[number];
const palettes=[
 {shirt:0xc65e45,trim:0xffdf9a,shorts:0x3d5056,skin:0xc48b68,hair:0x473329},
 {shirt:0x4c8580,trim:0xeedbac,shorts:0x946b54,skin:0xdba47e,hair:0x332e2b},
 {shirt:0xdfb45d,trim:0x7b5143,shorts:0x735d79,skin:0xad7354,hair:0x49392e},
];
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,side:T.DoubleSide});
material.name='Beach cotton, skin and sand';
const V=(p:P)=>new T.Vector3(...p);
const plus=(p:P,x:number,y:number,z:number):P=>[p[0]+x,p[1]+y,p[2]+z];
/** Indexed cross-sections with explicit joint centres, expressed in local metres.
 * Bake colour at construction so every silhouette shares the same opaque shader. */
class Form{
 positions:number[]=[];colors:number[]=[];indices:number[]=[];
 vertex(p:P,c:T.Color){this.positions.push(...p);this.colors.push(c.r,c.g,c.b);return this.positions.length/3-1;}
 tube(rows:Section[],tint:number,n=6,vertical=false,caps=3){
  const color=new T.Color(tint),start=this.positions.length/3;
  for(let j=0;j<rows.length;j++){
   const [p,w,d]=rows[j],axis=vertical?new T.Vector3(0,1,0):
    V(rows[Math.min(j+1,rows.length-1)][0]).sub(V(rows[Math.max(0,j-1)][0])).normalize();
   const sx=Math.abs(axis.x)>.9?new T.Vector3(0,0,1):new T.Vector3(1,0,0);
   sx.addScaledVector(axis,-sx.dot(axis)).normalize();const sz=sx.clone().cross(axis);
   for(let k=0;k<n;k++){
    const a=k*2*Math.PI/n,v=V(p).addScaledVector(sx,w*Math.cos(a)).addScaledVector(sz,d*Math.sin(a));
    this.vertex(v.toArray(),color);
    if(j){const lo=start+(j-1)*n+k,side=start+(j-1)*n+(k+1)%n;
     this.indices.push(lo,lo+n,side+n,lo,side+n,side);}
   }
  }
  for(let k=1;k<n-1;k++){const top=start+(rows.length-1)*n;if(caps&1)this.indices.push(start,start+k,start+k+1);if(caps&2)this.indices.push(top,top+k+1,top+k);}
 }
 quad(color:number,a:P,b:P,c:P,d:P){
  const tint=new T.Color(color),i=this.vertex(a,tint);this.vertex(b,tint);this.vertex(c,tint);this.vertex(d,tint);
  this.indices.push(i,i+1,i+2,i,i+2,i+3);
 }
 box(p:P,sz:P,c:number){
  const [x,y,z]=p,[w,h,d]=sz.map(v=>v/2);
  this.quad(c,[x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]);
  this.quad(c,[x+w,y-h,z-d],[x-w,y-h,z-d],[x-w,y+h,z-d],[x+w,y+h,z-d]);
  this.quad(c,[x+w,y-h,z+d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x+w,y+h,z+d]);
  this.quad(c,[x-w,y-h,z-d],[x-w,y-h,z+d],[x-w,y+h,z+d],[x-w,y+h,z-d]);
  this.quad(c,[x-w,y+h,z+d],[x+w,y+h,z+d],[x+w,y+h,z-d],[x-w,y+h,z-d]);
 }
 mesh(name:string){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.setIndex(this.indices);
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();const m=new T.Mesh(g,material);m.name=name;return m;
 }
}
function figure(pose:BeachPose,variant:number){
 const b=new Form(),p=palettes[variant%palettes.length],guard=pose==='lookout';
 const deck=pose==='deck-sit'||guard,floor=pose==='sand-sit',kneel=pose==='build'||pose==='pat';
 const wet=['wade','tread','float','crawl'].includes(pose),crawl=pose==='crawl',tread=pose==='tread'||pose==='float';
 const hip:P=crawl?[0,-.13,-.32]:[0,deck?.54:floor?.21:kneel?.43:tread?-.41:.87,kneel?-.07:0];
 const shoulder:P=crawl?[0,.07,.26]:plus(hip,0,kneel?.43:.54,kneel?.24:deck?-.065:floor?-.085:.015);
 const waist=V(hip).lerp(V(shoulder),.35).toArray();
 const wrap=!wet&&variant===1&&['stand','stride','chat'].includes(pose);
 const shirt=guard?0xe04f35:wet?0xcea27c:p.shirt;
 b.tube([[plus(hip,0,wrap?-.26:-.055,0),wrap?.22:.186,wrap?.143:.124],[waist,.16,.115],[shoulder,.231,.119],
  [plus(shoulder,0,crawl?.035:.055,.022),.105,.087]],wet?p.skin:shirt,8);
 if(!wet){
  const y=guard?.29:.12,base=plus(hip,0,y,kneel?.07:0);
  b.tube([[base,.181,.126],[plus(base,0,guard?.115:.045,.014),guard?.21:.179,.135]],guard?0xf9cb43:p.trim,6,true,0);
 }
 const head=crawl?plus(shoulder,.03,.07,.20):plus(shoulder,0,.233,kneel?.12:.012);
 b.tube([[plus(head,0,-.14,0),.079,.075],[plus(head,0,-.095,.012),.112,.096],
  [head,.133,.117],[plus(head,0,.09,-.01),.118,.108]],p.skin,8,true,1);
 b.tube([[plus(head,0,.026,-.022),.138,.119],[plus(head,0,.105,-.018),.129,.118],
  [plus(head,0,.158,-.020),.071,.072]],wet?(variant%2?p.trim:p.shirt):p.hair,8,true,2);
 // Brim shelters the lifeguard's checking hand; simple nose gives profiles a facing direction.
 b.tube([[plus(head,0,-.025,.095),.031,.034],[plus(head,0,-.008,.134),.021,.021]],p.skin,4,false,2);
 if(guard||(!wet&&variant===2&&!kneel)){
  b.tube([[plus(head,0,.073,.028),.18,.179],[plus(head,0,.096,.033),.176,.174]],guard?0xf5cf58:p.trim,8,true);
  b.tube([[plus(head,0,.09,-.016),.130,.13],[plus(head,0,.176,-.011),.093,.095]],guard?0xf5cf58:p.trim,8,true);
 }
 for(const side of [-1,1]){
  const h=plus(hip,side*.099,0,0);
  let knee:P=[side*.115,.46,side*.025+.025],heel:P=[side*.136,.075,-side*.047];
  if(pose==='stride'){knee=[side*.10,.47,.07+side*.23];heel=[side*.125,side>0?.064:.15,side*.31];}
  if(deck){knee=[side*.14,.49,.40];heel=[side*.15,.078,.43+side*.035];}
  if(floor){knee=[side*.28,.23,.26];heel=[-side*.05,.077,.40+side*.04];}
  if(kneel){knee=[side*.162,side>0?.115:.30,.19+side*.035];heel=[side*.17,.083,side>0?-.25:.25];}
  if(tread){knee=[side*.15,-.65,.15+side*.15];heel=[side*.12,-.90,-side*.11];}
  if(crawl){knee=[side*.10,-.19,-.65];heel=[side*.12,-.13+side*.10,-1.0];}
  const thigh=V(h).lerp(V(knee),.62).toArray();
  b.tube([[h,.116,.12],[thigh,.098,.091]],guard?0xbd3931:p.shorts,5,false,2);
  b.tube([[thigh,.088,.085],[knee,.069,.070],[V(knee).lerp(V(heel),.35).toArray(),.082,.072],[heel,.044,.046]],p.skin,4,false,2);
  if(!wet)b.tube([[plus(heel,0,-.025,-.045),.073,.045],[plus(heel,0,-.026,.135),.063,.034]],p.shorts,4);
  const arm=plus(shoulder,side*.191,-.026,0);
  let elbow=plus(arm,side*.073,-.241,pose==='stride'?-side*.12:.003),hand=plus(elbow,side*.013,-.226,pose==='stride'?-side*.13:.070);
  if(deck||floor){elbow=plus(arm,side*.077,-.22,.079);hand=plus(elbow,-side*.03,-.14,.15);}
  if(pose==='chat'&&side>0){elbow=plus(arm,.09,-.20,.04);hand=plus(elbow,.04,.13,.17);}
  if(guard&&side<0){elbow=plus(arm,-.18,.05,.13);hand=plus(head,-.081,.07,.12);}
  if(kneel){elbow=plus(arm,side*.07,-.17,.13);hand=plus(elbow,-side*.045,pose==='build'?-.17:-.07,.21);}
  if(pose==='wade'||pose==='tread'){elbow=plus(arm,side*.21,side<0?.20:-.06,.07);hand=plus(elbow,side*.10,side<0?.23:.12,.13);}
  if(pose==='float'){elbow=plus(arm,side*.23,-.23,.09);hand=plus(elbow,side*.02,-.035,.18);}
  if(crawl){elbow=plus(arm,side*.18,side>0?.28:-.07,side>0?-.07:.20);hand=plus(elbow,side*.04,side>0?-.13:-.04,.26);}
  const sleeve=V(arm).lerp(V(elbow),.47).toArray();
  if(!wet)b.tube([[arm,.105,.098],[sleeve,.089,.085]],shirt,5,false,2);
  b.tube([[wet?arm:sleeve,.074,.072],[elbow,.062,.062],[hand,.050,.047],
   [plus(hand,side*.012,-.036,.029),.041,.040]],p.skin,4,false,2);
 }
 if(pose==='float'){
  const n=14;
  for(let i=0;i<n;i++){const row=(j:number,k:number):P=>{const a=j*2*Math.PI/n,h=k*2*Math.PI/5,r=.46+.13*Math.cos(h);return [r*Math.cos(a),.025+.13*Math.sin(h),r*Math.sin(a)];};
   for(let k=0;k<5;k++)b.quad(i%7<2?0xffddab:p.shirt,row(i,k),row(i,k+1),row(i+1,k+1),row(i+1,k));}
 }
 if(guard)b.tube([[[-.225,.80,.16],.078,.08],[[.25,1.01,.19],.077,.08]],0xffc34a,6);
 return b.mesh(pose+'-'+variant);
}
export const supportProps=['sand-keep','reed-mat','short-ripple'] as const;
export type SupportProp=typeof supportProps[number];
function prop(id:SupportProp){
 const b=new Form();
 if(id==='reed-mat'){
  for(let i=0;i<7;i++)b.box([0,.052,-.55+i*.183],[1.1,.075,.157],i%3?0xc9ac81:0xbfa079);
  for(const x of [-.44,.44])b.box([x,.092,0],[.035,.027,1.29],0x806a52);
 }else if(id==='short-ripple'){
  for(const [r,start,arc] of [[.72,.2,1.88],[.93,3.4,1.35]])for(let j=0;j<7;j++){
   const p=(t:number,o:number):P=>{const a=start+arc*t;return [Math.cos(a)*(r+o),0,Math.sin(a)*(r+o)*.71];};
   b.quad(0xada58a,p(j/7,0),p(j/7,.026),p((j+1)/7,.026),p((j+1)/7,0));
  }
 }else{
  const sand=0xc89c6e,lit=0xdfbd86;
  b.tube([[[0,-.12,0],1.18,.87],[[.03,.19,-.03],.97,.66],[[.05,.32,.01],.73,.48]],sand,10,true);
  b.box([0,.36,.02],[1.08,.27,.65],sand);
  for(const [x,z,h,r] of [[-.54,-.17,.81,.23],[.48,.20,.70,.25],[.02,-.28,.95,.22]]){
   b.tube([[[x,.20,z],r*1.35,r*1.33],[[x,h-.12,z],r,r],[[x,h,z],r*1.12,r*1.12]],lit,8,true);
   for(let k=0;k<4;k++){const a=k*Math.PI/2;b.box([x+r*.81*Math.cos(a),h+.05,z+r*.81*Math.sin(a)],[.12,.12,.12],lit);}
  }
  b.quad(0x917051,[-.13,.23,.355],[.15,.23,.355],[.11,.47,.355],[-.09,.47,.355]);
  b.tube([[[.82,.03,-.51],.124,.124],[[.82,.24,-.51],.158,.158]],0xb76a4c,8,true);
 }
 return b.mesh(id);
}
const cache=new Map<string,T.Mesh>();
export function beachSupport(id:BeachPose|SupportProp,variant=0){
 const isPose=(beachPoses as readonly string[]).includes(id);
 const v=isPose?(variant%3+3)%3:0,key=id+'-'+v;
 let mesh=cache.get(key);
 if(!mesh){mesh=isPose?figure(id as BeachPose,v):prop(id as SupportProp);cache.set(key,mesh);}
 return mesh.clone();
}
