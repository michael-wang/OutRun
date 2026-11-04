import * as THREE from 'three';
import type {createWorld} from './world';
import {createFixedRoad} from './fixed-road';
import {asphaltTexture} from './asphalt-texture';
import {COAST_SKY_GLSL,COAST_SUN} from './coast-dusk';
import {CANYON_DAWN_SUN} from './canyon-dawn';

type World=ReturnType<typeof createWorld>;
type Sample=World['sample'];
export const LINK_HALF=672,LINK_EASE=240;
export const LINK_CYCLE=1536,LINK_LOAD_START=260;
const UP=new THREE.Vector3(0,1,0),smooth=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
export type JourneyMood='coast'|'city'|'canyon';
export const MOODS={
 coast:{sun:COAST_SUN,hemi:'#aab1da',ground:'#66534b',ambient:1.25,light:'#ffc080',power:1.8,fog:'#a8796e',near:250,far:1450},
 city:{sun:new THREE.Vector3(-60,95,-45).normalize(),hemi:'#e3f7ff',ground:'#a09162',ambient:1.65,light:'#fff0c9',power:2.8,fog:'#c4dce0',near:180,far:1100},
 canyon:{sun:CANYON_DAWN_SUN,hemi:'#c2d7ed',ground:'#9a7765',ambient:1.45,light:'#ffe0ad',power:2.3,fog:'#c7b6ae',near:450,far:2600},
};

/** Extend only the new highway, matching the native endpoint's grade, bank and
 * curvature before easing to a level straight. Original scenic roads stay intact. */
export function highwayExtension(native:Sample,at:number,sign:1|-1){
 const p=native(at),grade=p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),bank=-Math.atan(p.right.y);
 const frames:number[][]=[[at,...p.position.toArray(),p.roadHeading,bank]];
 let pos=p.position.clone(),heading=p.roadHeading;
 for(let u=4;u<=2016;u+=4){
  const mid=u-2,w=1-smooth(mid/LINK_EASE),turn=p.curvature*w*4*sign;
  pos.add(new THREE.Vector3(-Math.sin(heading+turn/2),grade*w,Math.cos(heading+turn/2)).multiplyScalar(4*sign));heading+=turn;
  frames.push([at+u*sign,...pos.toArray(),heading,bank*(1-smooth(u/LINK_EASE))]);
 }
 if(sign<0)frames.reverse();
 return createFixedRoad(frames,'擋土牆連接道').sample;
}

/** An endlessly repeatable S-bend with 480m straight approaches at both ends.
 * Logical distance never wraps; only three copies of the geometry are recycled. */
export function endlessHighway(native:Sample,end:number){
 const prefix=highwayExtension(native,end,1),start=end+LINK_HALF,anchor=prefix(start);
 const frames:number[][]=[[start,...anchor.position.toArray(),anchor.roadHeading,0]];
 const heading=(u:number)=>{const t=Math.max(0,Math.min(1,(u-480)/(LINK_CYCLE-960)));return anchor.roadHeading+.06*Math.sin(2*Math.PI*t)*Math.sin(Math.PI*t)**2;};
 const p=anchor.position.clone();
 for(let u=4;u<=LINK_CYCLE;u+=4){const h=heading(u-2);p.add(new THREE.Vector3(-Math.sin(h),0,Math.cos(h)).multiplyScalar(4));frames.push([start+u,...p.toArray(),heading(u),0]);}
 const cycle=createFixedRoad(frames,'連接高速公路'),stride=p.clone().sub(anchor.position);
 const sample:Sample=d=>{
  if(d<start)return prefix(d);
  const lap=Math.floor((d-start)/LINK_CYCLE),pose=cycle.sample(start+(d-start)%LINK_CYCLE);
  pose.position.addScaledVector(stride,lap);return pose;
 };
 return {sample,stride,start,exitAfter:(d:number)=>start+Math.max(0,Math.ceil((d+400-start)/LINK_CYCLE))*LINK_CYCLE};
}

/** Bounded recycled highway with congruent straight sections for scene rebasing. */
export function attachJourneyLink(world:World,start:number,end:number,mood:JourneyMood,incoming:boolean,outgoing:boolean){
 const native=world.sample,nativeHalf=world.halfAt,nativeUpdate=world.update,nativeBounds=world.boundaries;
 const entry=highwayExtension(native,start,-1),endless=endlessHighway(native,end),exit=endless.sample;
 const sample:Sample=d=>incoming&&d<start?entry(d):outgoing&&d>end?exit(d):native(d);
 const half=(d:number)=>d<start&&incoming?THREE.MathUtils.lerp(nativeHalf(start),7,smooth((start-d)/LINK_EASE)):d>end&&outgoing?THREE.MathUtils.lerp(nativeHalf(end),7,smooth((d-end)/LINK_EASE)):nativeHalf(d);
 const group=new THREE.Group();group.name='journey-highway';world.scene.add(group);
 const roadMaterial=new THREE.MeshStandardMaterial({color:'#4c5657',roughness:1,map:asphaltTexture()});
 const wallMaterial=new THREE.MeshStandardMaterial({color:'#888d88',roughness:1,side:THREE.DoubleSide});
 const vergeMaterial=new THREE.MeshStandardMaterial({color:'#83906a',roughness:1,side:THREE.DoubleSide});
 const lampMaterial=new THREE.MeshStandardMaterial({color:'#fff0cb',emissive:'#ffdf9e',emissiveIntensity:1.6});
 const stripeMaterial=new THREE.MeshStandardMaterial({color:'#e3dfcd',roughness:1,side:THREE.DoubleSide});
 const jointMaterial=new THREE.MeshStandardMaterial({color:'#666a68',roughness:1,side:THREE.DoubleSide});
 const contacts:THREE.Mesh[]=[];
 let batches=new Map<THREE.Material,{positions:number[];uvs:number[];indices:number[]}>();
 const tiles:THREE.Group[]=[];
 function flush(target:THREE.Group){
  for(const [material,{positions,uvs,indices}] of batches){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
   const mesh=new THREE.Mesh(geometry,material);mesh.name=material===roadMaterial?'driving-surface':'highway-detail';mesh.receiveShadow=true;target.add(mesh);if(material===roadMaterial)contacts.push(mesh);
  }
  batches=new Map();
 }
 const batch=(material:THREE.Material)=>{let b=batches.get(material);if(!b){b={positions:[],uvs:[],indices:[]};batches.set(material,b);}return b;};
 function ribbon(a:number,b:number,left:(d:number)=>number,right:(d:number)=>number,lo:(d:number)=>number,hi:(d:number)=>number,material:THREE.Material,name='highway-wall'){
  const {positions,uvs,indices}=batch(material),base=positions.length/3,count=Math.ceil((b-a)/8);
  for(let i=0;i<=count;i++){const d=a+(b-a)*i/count,p=sample(d);for(const [x,y] of [[left(d),lo(d)],[right(d),hi(d)]]){const v=p.position.clone().addScaledVector(p.right,x);v.y+=y;positions.push(...v.toArray());uvs.push(x/4,(d-(d<=start?start:end))/4);}if(i<count){const k=base+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}

 }
 for(const [sign,lo,hi] of [[-1,-2016,0],[1,0,LINK_HALF],[1,LINK_HALF,LINK_HALF+LINK_CYCLE]] as const){
  if(sign<0&&!incoming||sign>0&&!outgoing)continue;
  const looping=lo===LINK_HALF,target=looping?new THREE.Group():group;
  const at=sign<0?start:end,a=at+lo,b=at+hi;
  ribbon(a,b,d=>-half(d)-1,d=>half(d)+1,()=>0,()=>0,roadMaterial,'driving-surface');
  for(const lane of [-1,-.5,0,.5,1]){
   if(Math.abs(lane)===1)ribbon(a,b,d=>half(d)*lane-.08,d=>half(d)*lane+.08,()=>.025,()=>.025,stripeMaterial,'lane-markings');
   else for(let q=lo;q<hi;q+=48){const d0=at+q,d1=Math.min(at+hi,at+q+22);ribbon(d0,d1,d=>half(d)*lane-.07,d=>half(d)*lane+.07,()=>.025,()=>.025,stripeMaterial,'lane-markings');}
  }
  // Raise walls before the native seam; lower them gradually on emergence.
  const wa=sign<0?a:lo===0?end-120:a,wb=sign<0?start+120:b;
  const height=(d:number)=>6.5*smooth((sign*(d-at)+120)/140);
  for(const side of [-1,1]){
   const edge=(d:number)=>side*(half(d)+4.8),top=(d:number)=>edge(d)+side*height(d)*.4;
   ribbon(wa,wb,edge,top,()=>-.4,height,wallMaterial);
   ribbon(wa,wb,d=>side*(half(d)+1),d=>top(d),()=>-.12,()=>-.12,vergeMaterial);
   ribbon(wa,wb,d=>side*(half(d)+1.1),d=>side*(half(d)+1.1),()=>.65,()=>.95,stripeMaterial);
   ribbon(wa,wb,top,d=>top(d)+side*.18,height,height,stripeMaterial);
   for(let q=Math.ceil((wa-at)/24)*24;q<wb-at;q+=24){const d=at+q;ribbon(d,d+.10,edge,top,()=>0,height,jointMaterial);}
   for(let q=Math.ceil((wa-at)/96)*96;q<wb-at;q+=96){
    const d=at+q,p=sample(d),x=side*(half(d)+3),base=p.position.clone().addScaledVector(p.right,x);
    for(const [offset,size,mat] of [[new THREE.Vector3(0,4.2,0),new THREE.Vector3(.11,8.4,.11),jointMaterial],[p.right.clone().multiplyScalar(-side*.6).add(new THREE.Vector3(0,8.4,0)),new THREE.Vector3(1.3,.10,.10),jointMaterial],[p.right.clone().multiplyScalar(-side*1.2).add(new THREE.Vector3(0,8.35,0)),new THREE.Vector3(.5,.10,.22),lampMaterial]] as const){
     const geo=new THREE.BoxGeometry(size.x,size.y,size.z);geo.rotateY(-p.roadHeading);geo.translate(...base.clone().add(offset).toArray());const b=batch(mat),first=b.positions.length/3;b.positions.push(...geo.attributes.position.array);b.uvs.push(...geo.attributes.uv.array);for(const i of geo.index!.array)b.indices.push(first+i);geo.dispose();
    }
   }
  }
  flush(target);
  if(looping){
   for(let i=0;i<3;i++){const tile=i===0?target:target.clone();tile.name='highway-recycled-tile';group.add(tile);tiles.push(tile);if(i>0)tile.traverse(o=>{if(o instanceof THREE.Mesh&&o.material===roadMaterial)contacts.push(o);});}
  }
 }
 let placedLap=-1,activeRoads:THREE.Mesh[]=[];
 const activeContacts=()=>activeRoads;
 const placeTiles=(d:number)=>{
  const lap=Math.max(0,Math.floor((d-end-LINK_HALF)/LINK_CYCLE));if(lap===placedLap)return;placedLap=lap;
  tiles.forEach((tile,i)=>{const index=lap+i-1;tile.visible=index>=0;tile.position.copy(endless.stride).multiplyScalar(index);tile.updateWorldMatrix(true,true);});
  activeRoads=contacts.filter(m=>m.parent?.visible);
 };
 placeTiles(start);
 const planes=[new THREE.Plane(),new THREE.Plane()];planes.forEach(p=>p.constant=1e9);
 const seen=new Set<THREE.Material>();
 const clip=(o:THREE.Object3D)=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){for(const m of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(m)){seen.add(m);if(!(m instanceof THREE.ShaderMaterial)){m.clippingPlanes=planes;m.clipShadows=true;m.userData.journeyBaseOpacity??=m.opacity;m.alphaHash=true;m.needsUpdate=true;}}}};
 for(const o of world.scene.children)if(o!==group&&o!==world.car)o.traverse(clip);
 world.streamer?.setClippingPlanes(planes);
 const nativeSkies=['coast-dusk-sky','canyon-dawn-sky'].map(n=>world.scene.getObjectByName(n)).filter(Boolean) as THREE.Object3D[];nativeSkies.forEach(s=>s.visible=false);
 const environmentRoots=world.scene.children.filter(o=>o!==group&&o!==world.car&&!nativeSkies.includes(o)&&!(o instanceof THREE.Light)&&o.type!=='Object3D').map(root=>({root,visible:root.visible}));
 const u={haze:{value:0},fogColor:{value:new THREE.Color(MOODS[mood].fog)},sun:{value:MOODS[mood].sun.clone()},blend:{value:0},from:{value:['coast','city','canyon'].indexOf(mood)},to:{value:['coast','city','canyon'].indexOf(mood)}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:u,
  vertexShader:'varying vec3 ray;void main(){ray=position;vec4 p=projectionMatrix*viewMatrix*vec4(position*5000.0+cameraPosition,1.0);gl_Position=p.xyww;}',
  fragmentShader:`varying vec3 ray;uniform vec3 sun;uniform float blend;uniform float haze;uniform vec3 fogColor;uniform int from;uniform int to;${COAST_SKY_GLSL}
  vec3 skyFor(int kind,vec3 r){if(kind==0)return coastSky(r,sun);float s=max(0.0,dot(r,sun));if(kind==1)return vec3(.65882,.85098,.90980)+vec3(1.,.91,.72)*smoothstep(.9998,.99996,s);float y=max(0.,r.y);return mix(vec3(.80,.67,.60),vec3(.27,.48,.69),smoothstep(0.,.65,y))+vec3(.19,.10,.035)*pow(s,24.)+vec3(1.,.85,.62)*smoothstep(.9998,.99996,s);}
  void main(){vec3 r=normalize(ray);gl_FragColor=vec4(fogColor,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec3 mist=gl_FragColor.rgb;gl_FragColor=vec4(mix(mix(skyFor(from,r),skyFor(to,r),blend),mist,haze*(1.-smoothstep(.02,.16,r.y))),1.);}`,
 }));sky.name='journey-sky';sky.frustumCulled=false;sky.renderOrder=-10;world.scene.add(sky);
 let target:JourneyMood=mood,targetSun=MOODS[mood].sun.clone();
 const hemi=world.scene.children.find(o=>o instanceof THREE.HemisphereLight) as THREE.HemisphereLight,sun=world.scene.children.find(o=>o instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
 world.sample=sample;world.halfAt=half;
 world.boundaries=d=>d<start&&incoming||d>end&&outgoing?{left:-half(d)-1.1,right:half(d)+1.1}:nativeBounds?.(d)??{};
 if(outgoing)world.length=end+2016;
 const clamped=(d:number)=>Math.max(start,Math.min(end,d));
 if(world.streamer){const stream=world.streamer,ready=stream.roadReady.bind(stream),safe=stream.canDrive.bind(stream),update=stream.update.bind(stream),raycast=stream.raycastContacts.bind(stream);
  stream.update=d=>update(clamped(d));
  stream.roadReady=d=>d<start&&incoming||d>end&&outgoing?true:ready(d);
  stream.canDrive=(d,v,dt)=>d<start-100&&incoming||d>end+100&&outgoing?true:safe(clamped(d),v,dt);
  stream.raycastContacts=(ray,d)=>d<start&&incoming||d>end&&outgoing?ray.intersectObjects(activeContacts()):raycast(ray,d);
 }
 world.update=(t,v,s,d=0)=>{
  placeTiles(d);
  nativeUpdate(t,v,s,clamped(d));
  const environmentOpacity=Math.min(incoming?smooth((d-start+440)/220):1,outgoing?1-smooth((d-end)/220):1);
  for(const m of seen)if(!(m instanceof THREE.ShaderMaterial))m.opacity=m.userData.journeyBaseOpacity*environmentOpacity;
  world.streamer?.setEnvironmentOpacity(environmentOpacity);for(const {root,visible} of environmentRoots)root.visible=visible&&environmentOpacity>.001;
  for(const [i,on,at,sign] of [[0,incoming,start,1],[1,outgoing,end,-1]] as const){const p=native(at),n=p.tangent.clone().setY(0).normalize().multiplyScalar(sign);planes[i].normal.copy(n);planes[i].constant=on&&Math.abs(d-at)<1000||on&&(i===0?d<at:d>at)?-n.dot(p.position):1e9;}
  const f=outgoing?smooth((d-end-40)/440):0,A=MOODS[mood],B=MOODS[target];
  u.from.value=['coast','city','canyon'].indexOf(mood);u.to.value=['coast','city','canyon'].indexOf(target);u.blend.value=f;u.sun.value.copy(A.sun).lerp(targetSun,f).normalize();
  hemi.color.set(A.hemi).lerp(new THREE.Color(B.hemi),f);hemi.groundColor.set(A.ground).lerp(new THREE.Color(B.ground),f);hemi.intensity=THREE.MathUtils.lerp(A.ambient,B.ambient,f);
  sun.color.set(A.light).lerp(new THREE.Color(B.light),f);sun.intensity=THREE.MathUtils.lerp(A.power,B.power,f);sun.target.position.copy(world.car.position);sun.position.copy(world.car.position).addScaledVector(u.sun.value,120);
  const enclosure=Math.max(incoming?smooth((start-d)/180):0,outgoing?smooth((d-end)/180):0);
  world.scene.fog!.color.set(A.fog).lerp(new THREE.Color(B.fog),f);u.fogColor.value.copy(world.scene.fog!.color);u.haze.value=enclosure;(world.scene.fog as THREE.Fog).near=THREE.MathUtils.lerp(A.near,90,enclosure);(world.scene.fog as THREE.Fog).far=THREE.MathUtils.lerp(A.far,390,enclosure);
 };
 return {group,sample,entry,exit,start,end,get contacts(){return activeContacts();},planes,
  exitAfter:endless.exitAfter,
  setDestination(next:JourneyMood,nextHeading:number){target=next;const delta=nextHeading-exit(end+LINK_HALF).roadHeading;targetSun=MOODS[next].sun.clone().applyAxisAngle(UP,delta);},
  inHighway:(d:number)=>incoming&&d<start||outgoing&&d>end,
 };
}
