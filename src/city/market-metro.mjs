import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {grade,smooth} from './route.mjs';
import {roadsideEdge,streetEdge} from './junctions.mjs';

// Footprint of a single urban shuttle, in road stations and transverse metres.
const first=2480,last=3010,platform=2762;
const setback=d=>20+35*(1-smooth(d,2508,2616))+45*smooth(d,2882,2983);
export function metroFront(d){
 if(d<first-17||d>last+17)return 0;
 return setback(d)+(d>2700&&d<2790?11:7);
}
export function addMarketMetro({scene,cityChunks,physicalPos,box,link,label}){
 const curve=d=>new T.Vector3(...physicalPos(d,-setback(d),grade(d)+7.45));
 const samples=[];let total=0;
 for(let d=first;d<=last;d++){
  const p=curve(d);if(samples.length)total+=p.distanceTo(samples.at(-1).p);samples.push({p,s:total});
 }
 const metric=d=>samples[d-first].s,stop=metric(platform);
 const clamp=T.MathUtils.clamp;
 function frame(s){
  s=clamp(s,0,total);let i=0,j=samples.length-1;
  while(i<j-1){const mid=(i+j)>>1;if(samples[mid].s<=s)i=mid;else j=mid;}
  const a=samples[i],b=samples[i+1],u=(s-a.s)/(b.s-a.s);
  const p=a.p.clone().lerp(b.p,u),dir=b.p.clone().sub(a.p).normalize();
  const before=samples[Math.max(0,i-3)].p,after=samples[Math.min(samples.length-1,i+4)].p;
  const tangent=after.clone().sub(before).normalize();
  const prior=curve(first+i-3).sub(curve(first+i-7)).normalize(),next=curve(first+i+7).sub(curve(first+i+3)).normalize();
  const curvature=Math.atan2(next.x*prior.z-prior.x*next.z,next.dot(prior))/10;
  const cant=clamp(curvature*6,-.066,.066)*smooth(Math.abs(s-stop),16,40);
  const side=new T.Vector3(tangent.z,0,-tangent.x).normalize().applyAxisAngle(tangent,cant);
  const up=tangent.clone().cross(side).normalize();
  return {p,side,up,dir,at:first+i+u};
 }
 const pt=(f,x,y)=>f.p.clone().addScaledVector(f.side,x).addScaledVector(f.up,y);
 let xyz=[],colors=[];
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.74,side:T.DoubleSide});
 function quad(a,b,c,d,color){
  const ink=new T.Color(color);
  for(const p of [a,b,c,a,c,d]){xyz.push(p.x,p.y,p.z);colors.push(ink.r,ink.g,ink.b);}
 }
 function band(a,b,x1,x2,y1,y2,color){quad(pt(a,x1,y1),pt(b,x1,y1),pt(b,x2,y2),pt(a,x2,y2),color);}
 function flush(at){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,mat);mesh.name='city-interior-metro-guide-'+at;scene.add(mesh);cityChunks.push({at,mesh});xyz=[];colors=[];
 }
 for(let d=first;d<last;d+=2){
  const a=frame(metric(d)),b=frame(metric(d+2));
  band(a,b,-2,2,-.25,-.25,0x919e99);band(a,b,-1.65,1.65,-1.02,-1.02,0x8b9795);
  for(const side of [-1,1]){
   band(a,b,side*2,side*1.65,-.25,-1.02,0xb6b9ac);
   band(a,b,side*1.97,side*1.97,-.26,.14,0xb0b4a6);
   band(a,b,side*.77-.066,side*.77+.066,0,0,0xcaccbf);band(a,b,side*.77,side*.77,0,-.25,0x47565a);
  }
  // Rail covers and the approach curves physically conceal both reversing berths.
  if(d<first+50||d>=last-50){
   for(const x of [-3.25,3.25])band(a,b,x,x,-.31,4.9,0x797f77);
   band(a,b,-3.25,3.25,4.9,4.9,0x9ca69b);
   if(d===first||d===last-2){const f=d===first?a:b;quad(pt(f,-3.25,-.35),pt(f,3.25,-.35),pt(f,3.25,4.9),pt(f,-3.25,4.9),0x777d74);}
  }
  if(d>=platform-20&&d<platform+20){
   band(a,b,-5.9,-1.53,.96,.96,0xbfb398);band(a,b,-1.76,-1.53,.982,.982,0xf3c25c);
   band(a,b,-1.53,-1.53,.96,.24,0x798783);
  }
  if((d-first)%100===98||d===last-2)flush(d-38);
 }
 for(let d=first+8;d<last;d+=24){
  // The side street beside the inlet needs an uninterrupted opening.
  if(d>2770&&d<2815)continue;
  const f=frame(metric(d)),x=-setback(d);let pier=x;
  if(-x<streetEdge(d,-1)+2) pier=-roadsideEdge(d,-1)-1.35;
  const top=pt(f,0,-.96),foot=new T.Vector3(...physicalPos(d,pier,grade(d)-.08));
  link(foot.toArray(),[foot.x,top.y-.25,foot.z],1.06,1.25,'post',d,0x9ea79e,true);
  link([foot.x,top.y-.44,foot.z],[top.x+.02,top.y-.04,top.z],1.4,.72,'trim',d,0x798c88,true);
 }
 const stationX=-setback(platform)-4.45;
 for(const dz of [-15,-5,5,15]){
  const d=platform+dz,y=grade(d);
  box(d,stationX-1.1,y+8.37,.24,3.35,.24,'metal',0x396662);
  box(d,stationX,y+11.53,4.85,.32,10.05,'canopy',0x638c87,0,-.07);
 }
 const stairAt=platform-20;
 for(let i=0;i<35;i++){const d=stairAt-i*.41;
  box(d,stationX,grade(d)+.18,2.05,8.15*(1-i/35),.43,'trim',0xb2aa93);
 }
 label(platform-16.5,stationX,grade(platform)+10.61,5.65,1.3,'市場站  MARKET','#2d6662');

 const pieces=[],bodyMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.17});
 function add(x,y,z,w,h,l,color){
  const g=new T.BoxGeometry(w,h,l).toNonIndexed();g.translate(x,y,z);g.deleteAttribute('uv');
  const c=new T.Color(color),n=g.attributes.position.count,arr=new Float32Array(n*3);
  for(let i=0;i<n;i++)c.toArray(arr,i*3);g.setAttribute('color',new T.BufferAttribute(arr,3));pieces.push(g);
 }
 add(0,1.32,0,2.52,1.44,10.84,0xf1e4c2);add(0,2.52,0,2.45,.97,10.51,0x397b77);add(0,3.09,0,2.3,.17,10.25,0xc2c9ba);
 add(0,.49,0,1.84,.48,8.8,0x48555a);
 for(const z of [-3.55,3.55])add(0,.25,z,1.67,.42,1.11,0x3f494c);
 for(const side of [-1,1]){
  add(side*1.265,1.12,0,.06,.32,10.65,0xce8050);
  for(const z of [-4.35,-3.12,-.7,.7,3.12,4.35])add(side*1.24,2.45,z,.075,.92,1.09,0x273e47);
  for(const z of [-2.02,2.02]){add(side*1.284,1.69,z,.05,1.91,.94,0x3f7677);add(side*1.319,2.14,z,.028,.48,.73,0x263d46);}
  add(0,2.41,side*5.29,2.21,1.02,.13,0x294651);add(0,2.98,side*5.24,1.45,.24,.13,0xeec875);add(0,1.03,side*5.43,1.24,.15,.08,0xf5d49b);
 }
 const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());
 const cars=[0,1].map(()=>{const mesh=new T.Mesh(geometry,bodyMat);scene.add(mesh);mesh.name='market metro carriage';return mesh;});
 const joint=new T.Mesh(new T.BoxGeometry(1.84,1.92,.86),new T.MeshStandardMaterial({color:0x4a5655}));scene.add(joint);
 const west=metric(first+23),east=metric(last-23),run=18,dwell=2.1,reverse=5,half=run*2+dwell+reverse;
 function leg(t){const n=clamp(t/run,0,1);return n*n*(3-2*n);}
 function progress(clock){
  let t=((clock-22.1+2*half)%(2*half)+2*half)%(2*half);const outbound=t<half;if(!outbound)t-=half;
  const a=outbound?west:east,b=outbound?east:west;
  if(t<run)return T.MathUtils.lerp(a,stop,leg(t));
  if(t<run+dwell)return stop;
  return T.MathUtils.lerp(stop,b,leg(t-run-dwell));
 }
 // Both carriages pivot about one shared coupler. Find the outer end of the
 // fixed-length body by chord length, so bending track cannot open a coupler gap.
 function outer(s,sign,p){let reach=11.22;for(let i=0;i<2;i++)reach+=11.22-frame(s+reach*sign).p.distanceTo(p);return frame(s+sign*reach);}
 function update(d,elapsed,entry){
  const visible=d>first-1150&&d<last+1150;cars.forEach(car=>car.visible=visible);joint.visible=visible;if(!visible)return;
  const clock=elapsed+entry/62.8, s=progress(clock),hinge=frame(s);
  const basis=new T.Matrix4();
  for(let i=0;i<2;i++){
   const sign=i===0?1:-1,tip=outer(s,sign,hinge.p),fwd=tip.p.clone().sub(hinge.p).normalize().multiplyScalar(sign);
   const side=hinge.up.clone().cross(fwd).normalize(),up=fwd.clone().cross(side);
   cars[i].position.copy(tip.p).lerp(hinge.p,.5);cars[i].quaternion.setFromRotationMatrix(basis.makeBasis(side,up,fwd));
  }
  joint.position.copy(pt(hinge,0,1.64));joint.quaternion.setFromRotationMatrix(basis.makeBasis(hinge.side,hinge.up,hinge.side.clone().cross(hinge.up)));
 }
 return {update,frame,metric,progress,stop,first,last,platform,cars,joint};
}
