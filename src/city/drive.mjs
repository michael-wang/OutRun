import {decisions,drawConnections,frontageEdge,junctionFurniture,openMouth,roadsideEdge,streetEdge} from './junctions.mjs';
import {PadMenuNavigation,menuFaceButtons} from '../pad-menu-navigation';
import {sampleFrontages,streetFront,avenueTrees,crossings,signals,streetSigns} from './street-samples.mjs';
import {CameraOrbit} from '../camera-orbit';
import {addCityDepth} from './depth.mjs';
import {createReviewLines} from './review-lines.mjs';
import {addCityInteriors} from './blocks.mjs';
import {composeDistricts,districtAt} from './districts.mjs';
import {finishCityAsphalt,paintAge} from './road-surface.mjs';
import {localKinds,finishWeight,quarterMaterial,leafyFinish} from './quarter.mjs';
import {arcadeStudy,addStreetStudy,addPlaces} from './streets.mjs';
import {layout,finishes,backdrop} from './city-data.mjs';
import {createSteerBar,stepSteerBar,fullLock} from './steer-bar.mjs';
import {length as L,bend,grade,edge,district,districts,turns,closures,zones,laneWidth,trafficX} from './route.mjs';
import * as T from 'three';
import {createCar} from '../car';
import {sceneDisposal} from '../dispose-scene';
import {loadingFinished} from '../loading';
import {takeStageAudio} from '../stage-audio';
import markup from './stage.html?raw';
import styles from './stage.css?inline';
// CC0 asphalt surface: https://polyhaven.com/a/asphalt_04
import asphalt from './asphalt_04.jpg';

export async function enterCity(onExit) {
 const host=document.createElement('section');host.id='city-stage';host.setAttribute('aria-label','城際快線');
 const ui=host.attachShadow({mode:'open'});ui.innerHTML='<style>'+styles+'</style>'+markup;document.body.append(host);
 const events=new AbortController(),scope={signal:events.signal};
 let raf=0,closed=false;const teardown=[];
 function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);events.abort();host.remove();for(const dispose of teardown.reverse())dispose();}
 function leave(){close();onExit();}
 try{
 const primedAudio=takeStageAudio();if(primedAudio)teardown.push(()=>void primedAudio.close().catch(()=>{}));
// Use the accepted default from the local City Expressway trial. Stage selection
// owns navigation, so coastal preview parameters cannot change this race.
const labQuery=new URLSearchParams();
const variant=['A','B','control'].includes(labQuery.get('run'))?labQuery.get('run'):'A';
const modules=['camera','flow','drift','traffic','sound'];
const activeModules=new Set(variant==='control'?(labQuery.get('probe')||'').split(',').filter(k=>modules.includes(k)):modules);
const enabled=k=>activeModules.has(k);
const technical=variant==='B', trialKey=[variant,...activeModules].join('-');
const densityMarks=[],transfers=[],encounters=[];
const orbit=new CameraOrbit(), orbitLook=new T.Vector3();
let orbitNeedsNeutral=true;
let cameraFov=62,transferAge=1,trafficContact=null,nearMix=0,engineBed,windEdge,passTone;

const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));ui.prepend(renderer.domElement);teardown.push(()=>{renderer.dispose();renderer.forceContextLoss();});
const scene=new T.Scene(),camera=new T.PerspectiveCamera(62,1,.3,4000);
teardown.push(()=>sceneDisposal(scene)());
scene.fog=new T.FogExp2(0xd7dfdb,.00132);
const sky=new T.Mesh(new T.SphereGeometry(3600,64,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:"varying vec3 v;\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(123.45,46.71)))*43758.54);}\nfloat n(vec2 p){vec2 a=floor(p),b=fract(p);b=b*b*(3.-2.*b);return mix(mix(hash(a),hash(a+vec2(1,0)),b.x),mix(hash(a+vec2(0,1)),hash(a+1.),b.x),b.y);}\nvoid main(){vec3 ray=normalize(v);float t=ray.y;vec3 c=mix(vec3(.95,.83,.68),vec3(.37,.60,.76),smoothstep(-.03,.62,t));\nvec2 uv=ray.xz/max(.10,t+.11)*vec2(1.1,3.4);float cloud=n(uv)*.47+n(uv*2.04)*.30+n(uv*4.1)*.15+n(uv*8.1)*.08;\nc=mix(c,vec3(.98,.94,.86),.57*smoothstep(.44,.74,cloud)*smoothstep(-.01,.18,t));float g=max(dot(ray,normalize(vec3(-.77,.28,.43))),0.);c+=vec3(.20,.12,.06)*pow(g,8.);gl_FragColor=vec4(c,1.);}"}));scene.add(sky);
scene.add(new T.HemisphereLight(0xe1efff,0x8e9589,1.28));const sun=new T.DirectionalLight(0xffdda2,2.3);sun.position.set(-340,330,-150);scene.add(sun);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:390});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.08;sun.shadow.bias=-.00018;scene.add(sun.target);
const clamp=T.MathUtils.clamp,sm=T.MathUtils.smoothstep,step=2;const points=[];let X=0,Z=0,H=.12;
for(let d=-160;d<L+380;d+=step){points.push([X,Z,H]);H+=step*bend(d);X+=Math.sin(H)*step;Z+=Math.cos(H)*step;}
function pose(d){const f=clamp((d+160)/step,0,points.length-1.001),i=Math.floor(f);return points[i].map((v,k)=>T.MathUtils.lerp(v,points[i+1][k],f-i));}
function pos(d,x,y){return physicalPos(d,x*1.59,y);}
function physicalPos(d,x,y){let [a,b,h]=pose(d);return [a+x*Math.cos(h),y,b-x*Math.sin(h)];}
const mats={};function material(name,c,flat=false){return mats[name]??=new T.MeshStandardMaterial({color:c,roughness:.96,flatShading:flat,side:T.DoubleSide});}
function geometry(vertices,colors=null){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;}
const roadUV=[];
const grid=new Map();function tri(k,col,a,b,c){let g=grid.get(k);if(!g){g=[[],[]];grid.set(k,g);}g[0].push(...a,...b,...c);let color=new T.Color(col);for(let i=0;i<3;i++)g[1].push(color.r,color.g,color.b);}
function quad(k,c,a,b,v,w){tri(k,c,a,v,b);tri(k,c,b,v,w);}
for(let d=-120;d<L+232;d+=4){
 function strip(x0,x1,y,color,key,paintExposure){
 const far=d+4;const p=(at,x)=>physicalPos(at,x,grade(at)+y);
 const a=x0(d),b=x1(d),c=x0(far),e=x1(far);
 quad(key,color,p(d,a),p(far,c),p(d,b),p(far,e));
 if(key==='road'){
   // Positive Z marks asphalt; paint stores its weathering as a negative value.
   const start=paintExposure===undefined?1:-paintAge(d)*paintExposure;
   const end=paintExposure===undefined?1:-paintAge(far)*paintExposure;
   roadUV.push(a,d,start,-1,b,d,start,1,c,far,end,-1,c,far,end,-1,b,d,start,1,e,far,end,1);
 }
 }
 const landWidth=z=>Math.min(150-134*smoothBank(z),150-129*sm(z,5515,5630)*(1-sm(z,5890,6065)));function smoothBank(z){return sm(z,4330,4440)*(1-sm(z,5590,5710));}
 strip(z=>-landWidth(z),z=>landWidth(z),-.17,0x8d9494,'base');strip(z=>-edge(z,-1),z=>edge(z,1),0,0x565857,'road');
 for(const sign of [-1,1]){
 const side=z=>sign*(edge(z,sign)-.22);
 if(!openMouth(d+2,sign)||d%12===0)strip(z=>side(z)-.062,z=>side(z)+.062,.033,0xe4dba8,'road',.75);
 if(d%16===0)for(const x of (sign>0?[0,laneWidth,2*laneWidth]:[-laneWidth,-2*laneWidth])){
 if(Math.abs(x)+.65<Math.min(edge(d,sign),edge(d+4,sign)))strip(()=>x-.076,()=>x+.076,.035,0xe6e3d7,'road',1);}
 }
}
// Two pavement arrows show which adjacent lane continues before each closure.
for(const [a,b,side,delta] of zones){const drop=delta<0?a:b-100,outer=side*laneWidth*(delta<0?1.5:2.5);
 for(const lead of [135,62]){
 const at=drop-lead,w=-side;const pts=[[0,-3.2],[.32,-3.2],[.32,-.85],[1.28,1.26],[1.70,.95],[1.42,3.20],[.19,1.88],[.64,1.67],[-.16,-.75],[-.16,-3.2]];
 const shape=pts.map(([x,z])=>new T.Vector2(x*w,z));
 for(const f of T.ShapeUtils.triangulateShape(shape,[])){const p=f.map(i=>{const q=shape[i];return physicalPos(at+q.y,outer+q.x,grade(at+q.y)+.048);});
 tri('road',0xe4d7b4,...p);for(const i of f)roadUV.push(outer+shape[i].x,at+shape[i].y,-paintAge(at+shape[i].y)*.48,0);}
 }}
drawConnections({quad,tri,roadUV,physicalPos});
const tileMaps={road:await new T.TextureLoader().loadAsync(asphalt)};
tileMaps.road.wrapS=tileMaps.road.wrapT=T.RepeatWrapping;tileMaps.road.colorSpace=T.SRGBColorSpace;tileMaps.road.anisotropy=8;
for(const [k,[v,c]] of grid){const m=material(k,0xffffff,true);m.vertexColors=true;if(k==="road")finishCityAsphalt(m,tileMaps.road,zones,laneWidth);const geo=geometry(v,c);if(k==='road')geo.setAttribute('roadCoord',new T.Float32BufferAttribute(roadUV,4));let strip=new T.Mesh(geo,m);strip.receiveShadow=true;scene.add(strip);}

// All geometry is in the same road frame as collision. Keep the centreline clear.
const cube=new T.BoxGeometry(1,1,1), cityChunks=[], batches=new Map(), unit=new T.Object3D();
const palette={plinth:0x626b71,curb:0xc1c6bf,walk:0x9fa6a3,post:0x535f64,trim:0xc6c8be,
 canopy:0x85938f,metal:0x41505a,guide:0xe4ae55,roadPaint:0xe6e4d5,water:0x64848b,green:0x768877};

function box(d,x,base,w,h,len,kind,tint=palette[kind],pitch=0,roll=0){
 const amount=finishWeight(d);if(amount>0&&localKinds.has(kind))kind='quarter-'+kind;
 const key=Math.floor(d/160)+'/'+kind;
 if(!batches.has(key))batches.set(key,{at:d,kind,items:[]});
 unit.position.fromArray(physicalPos(d,x,base+h/2));unit.rotation.set(pitch,pose(d)[2],roll,"YXZ");unit.scale.set(w,h,len);unit.updateMatrix();
 batches.get(key).items.push([unit.matrix.clone(),new T.Color(tint),amount]);
}
function link(a,b,w,h,kind,d,tint,levelAcross=false){
 const amount=finishWeight(d);if(amount>0&&localKinds.has(kind))kind='quarter-'+kind;
 const key=Math.floor(d/160)+'/'+kind;if(!batches.has(key))batches.set(key,{at:d,kind,items:[]});
 const v=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(v);unit.position.copy(v.lerp(end,.5));if(levelAcross){
  // A wide roof panel keeps its transverse eave level even when this road
  // points back towards -Z. A shortest-arc rotation can roll that axis.
  unit.rotation.set(-Math.atan2(dir.y,Math.hypot(dir.x,dir.z)),Math.atan2(dir.x,dir.z),0,'YXZ');
 }else unit.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir.clone().normalize());unit.scale.set(w,h,dir.length());unit.updateMatrix();batches.get(key).items.push([unit.matrix.clone(),new T.Color(tint),amount]);
}
const block=(parent,w,h,d,color,x,y,z)=>{const m=new T.Mesh(cube,material('m'+color,color));m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;};
function railside(group,d,x){group.position.fromArray(pos(d,x,grade(d)));group.rotation.y=pose(d)[2];scene.add(group);}
let seed=78217;function next(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const fronts=[0xa8afaf,0xb4b0aa,0x9da7a8,0xb7bbb6,0x96a3a8];
const shade=()=>fronts[Math.floor(next()*fronts.length)];
const faces=new Map();
function facade(kind){
 if(faces.has(kind))return faces.get(kind);
 if(kind.startsWith('quarter-')){const part=kind.slice(8),m=quarterMaterial(facade(part),part);faces.set(kind,m);return m;}
 const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.9});
 if(['arcade','tower','loft','sampleLoft'].includes(kind)){
 mat.onBeforeCompile=sh=>{
 sh.vertexShader='varying vec2 elevationUV;varying float verticalFace;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 metres=position*vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz)); elevationUV=vec2(abs(normal.z)>.5?metres.x:metres.z,metres.y+length(instanceMatrix[1].xyz)*.5);verticalFace=1.-abs(normal.y);');
 sh.fragmentShader='varying vec2 elevationUV;varying float verticalFace;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(verticalFace>.5){vec2 f=fract(elevationUV/vec2(${(kind==='loft'||kind==='sampleLoft')?'4.3,4.7':kind==='tower'?'3.1,3.8':'3.6,3.4'}));vec2 a=fwidth(elevationUV)*.16;
 float windowBand=smoothstep(.12,.15+a.x,f.x)*(1.-smoothstep(.87-a.x,.91,f.x))*smoothstep(.23,.26+a.y,f.y)*(1.-smoothstep(.85-a.y,.88,f.y));
 diffuseColor.rgb*=mix(vec3(1.),vec3(.40,.51,.56),windowBand*${kind==='tower'?'.98':'.87'});diffuseColor.rgb*=.90+.10*smoothstep(.02,.07+a.y,f.y);}`);
  if(kind==='sampleLoft')sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(verticalFace>.5){
   vec2 uv=elevationUV;vec2 grid=abs(fract(uv/vec2(.30,.16))-.5);
   vec2 aa=max(fwidth(uv/vec2(.30,.16)),.001);
   float mortar=max(smoothstep(.45-aa.x*.3,.49,grid.x),smoothstep(.43-aa.y*.3,.49,grid.y));
   float close=1.-smoothstep(.10,.49,max(aa.x,aa.y));
   diffuseColor.rgb*=.87+.13*smoothstep(0.,2.3,uv.y);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.73,close*mortar*.70);
 }`); };mat.customProgramCacheKey=()=>kind;}
 if(kind==='shopGlaze'){mat.roughness=.35;mat.metalness=.18;}
 faces.set(kind,mat);return mat;
}
for(let d=-20;d<L+36;d+=4){
 for(const side of [-1,1]){const w=roadsideEdge(d,side),y=grade(d);
 box(d,side*(w+.14),y-.04,.29,.34,4.10,'curb');box(d,side*(w+2.15),y-.08,4.15,.32,4.17,'walk');
 if(w<8.65)box(d,side*(w+.27),y+.22,.45,.49,4.06,'plinth');
 if(w<8.65&&d%12===0)box(d,side*(w+.27),y+.70,.48,.10,1.35,'guide');
 }}
// A repeating urban unit is a block with two ends, buildings, a setback and an intersection.
function reserved(d,side,pad=0){return [[1050,1420,0],[4300,5740,0],[305,375,-1],[2725,2810,1],[6820,6900,-1],[9050,9120,1],[10420,10500,-1],[1110,2180,0],[3610,3950,1],[5660,6580,0],[7480,8540,0],[10650,11180,-1]].some(([a,b,s])=>(!s||side===s)&&d>=a-pad&&d<=b+pad);}

// The elevated metro shadows the entry to the reversing bends. Its supports remain outside the curb.
for(let d=2160;d<=4320;d+=18){
 const x=-edge(d,-1)-2.9,y=grade(d);
 const pier=-roadsideEdge(d,-1)-2.9;
 box(d,pier,y-.22,1.38,7.65,2.1,'curb');
 if(x-pier>.1)box(d,(x+pier)/2,y+6.93,x-pier+1.2,.64,1.65,'metal');box(d,x+2.7,y+7.35,9.0,1.15,18.5,'plinth');
 box(d,x+6.95,y+8.37,.38,.67,18.6,'metal');
}
// Low riverfront and two portal pylons create a contrasting long sightline.
// A river runs across the bridge in a fixed world frame; banks do not turn with the deck.
const nearEnd=physicalPos(4380,0,0),farEnd=physicalPos(5650,0,0);
const riverAngle=Math.atan2(farEnd[0]-nearEnd[0],farEnd[2]-nearEnd[2]);
const alongX=Math.sin(riverAngle),alongZ=Math.cos(riverAngle);
const span=Math.hypot(farEnd[0]-nearEnd[0],farEnd[2]-nearEnd[2]);
function riverside(u,v,y){return [nearEnd[0]+alongX*v+alongZ*u,y,nearEnd[2]+alongZ*v-alongX*u];}
function bank(u,far){return (far?span:0)+Math.sin(u/310)*49+Math.sin(u/125+1)*15+(far?10:-10);}
function riversheet(vertices,color){const geo=geometry(vertices);const m=new T.Mesh(geo,material('river-'+color,color));m.receiveShadow=true;scene.add(m);}
const sheets=[[],[],[],[],[],[],[]];const surface=(set,a,b,c,e)=>set.push(...a,...b,...c,...c,...b,...e);
for(let u=-2000;u<2000;u+=20){const v=u+20;
 surface(sheets[0],riverside(u,bank(u,false),1),riverside(v,bank(v,false),1),riverside(u,bank(u,true),1),riverside(v,bank(v,true),1));
 for(const far of [false,true]){
 const side=far?1:-1,height=far?5.5:4.3,p=(w,offset,y)=>riverside(w,bank(w,far)+side*offset,y);
 surface(sheets[1],p(u,0,.95),p(v,0,.95),p(u,7,height),p(v,7,height));
 surface(sheets[2],p(u,7,height),p(v,7,height),p(u,16,height+.04),p(v,16,height+.04));
 surface(sheets[3],p(u,16,height),p(v,16,height),p(u,490,height),p(v,490,height));
 }
}
riversheet(sheets[0],0x397e91);
const riffles=[];
for(let n=0;n<1800;n++){
 const u=Math.sin(n*197.19)*1050,v=span*(.5+.49*Math.sin(n*51.93));
 const len=3.2+5*(.5+.5*Math.cos(n*41.1)),w=.13+.22*(.5+.5*Math.sin(n*81.5));
 surface(riffles,riverside(u-len,v,1.035),riverside(u,v+w,1.035),riverside(u,v-w,1.035),riverside(u+len,v,1.035));
}
riversheet(riffles,0x87abb0);riversheet(sheets[1],0x9e9c86);riversheet(sheets[2],0xd0c6ad);riversheet(sheets[3],0x819185);
function waterfrontBlock(u,v,y,w,h,len,col){const obj=new T.Mesh(cube,material('quay-'+col,col));obj.position.fromArray(riverside(u,v,y+h/2));obj.scale.set(w,h,len);obj.rotation.y=riverAngle;scene.add(obj);}
for(const far of [false,true]){const sg=far?1:-1;for(let i=-8;i<=8;i++){
 const u=i*86+(i%2)*11;if(Math.abs(u)<235)continue;
 const boundary=bank(u,far),y=far?5.5:4.3;
 const p=backdrop(5000+i*43,sg,80,i%3===0?'tower':'commerce'),mat=finishes[p.material],v=boundary+sg*(70+p.setback);
 waterfrontBlock(u,v,y,p.width,p.storey*2,p.depth+4,mat.base);
 waterfrontBlock(u,v+sg*2,y+p.storey*2,p.width*.78,p.storey*(p.levels-2),p.depth,mat.wall);
 if(p.roof==='lantern')waterfrontBlock(u+1,v,y+p.storey*p.levels,p.width*.49,2.5,p.depth*.5,mat.trim);
 }}
// Quays, a pair of lifting frames, and a terminal roof mark the far bank above the waterline.
for(const u of [235,380,-270]){
 const v=bank(u,true)+25,y=5.5;
 waterfrontBlock(u,v,y,47,3.0,14,0x948c7c);
 for(const w of [-12,12]){waterfrontBlock(u+w,v,y+3,2.4,19,2.4,0x9c856c);waterfrontBlock(u+w,v-8,y+20,2.2,2.2,19,0x9c856c);}
 waterfrontBlock(u,v,y+23,29,2.4,3,0xa9967d);
 waterfrontBlock(u+37,bank(u+37,true)+49,y,40,7,19,0x8e9b95);
}
// Only navigation aids and working craft occupy the channel.
for(const [u,v] of [[-220,span*.55],[245,span*.65],[325,span*.25]]){
 waterfrontBlock(u,v,1.05,28,1.5,6.5,0x54676d);waterfrontBlock(u-6,v,2.55,6,3.2,4.8,0xccccc1);
 for(let j=0;j<3;j++)waterfrontBlock(u+2+j*5,v,2.55,4.5,1.75,4.5,0x828b83);
}
for(let at=4390;at<5680;at+=12){const y=grade(at);
 for(const s of [-1,1]){box(at,s*(streetEdge(at,s)+.65),y,.23,.52,12.2,'curb');box(at,s*(streetEdge(at,s)+.72),y+.87,.15,.16,12.25,'metal');box(at,s*(streetEdge(at,s)+.72),y+.42,.14,.48,.18,'post');}
 if((at-4390)%96===0)box(at,0,.8,4,Math.max(.5,y-1),5,'plinth');
}

for(const at of [4790,5200]){
 for(const side of [-1,1]){
 const x=side*(edge(at,side)+4),top=grade(at)+38;
 box(at,x,grade(at)-6,2.9,44,4,'trim');
 for(const delta of [-69,-46,-23,23,46,69])link(physicalPos(at,x,top-2),physicalPos(at+delta,side*(edge(at+delta,side)+1.55),grade(at+delta)+1.2),.20,.20,'metal',at,0x627076);
 }box(at,(edge(at,1)-edge(at,-1))/2,grade(at)+33,edge(at,1)+edge(at,-1)+10,.95,3.5,'trim');
}
// Station train shed and cross-street footbridges give direction before the final chicanes.
for(let d=6540;d<6670;d+=22){const y=grade(d);for(const side of [-1,1])box(d,side*(edge(d,side)+1.5),y,.5,8.5,.7,'metal');
 box(d,0,y+8.36,23,.48,.72,'metal');box(d,-8.7,y+8.77,7.2,.36,22.4,'canopy');}
for(const at of []){const y=grade(at);box(at,0,y+8.4,36,2.2,4.5,'canopy');box(at,0,y+9.8,36,.55,4.6,'trim');}
// Station square opens on the outside of the last sweep. The stepped clock tower
// gives the player a single distant finish target above the lower street frontage.
for(const side of [-1,1])for(let at=6690;at<7135;at+=32){
 const y=grade(at);box(at,side*14,y+.12,.38,7.4,.38,'metal');box(at,side*13.1,y+7.32,2.2,.18,.28,'guide');
}
const towerAt=7036,towerY=grade(towerAt);
box(towerAt,-24,towerY,10,44,11,'loft',0x9ca59e);box(towerAt,-24,towerY+43.7,7.3,8,8,'trim');
box(towerAt,-24,towerY+51.6,3.8,4,4.3,'metal');box(towerAt,-24,towerY+55.5,.36,7,.36,'metal');
const dial=document.createElement('canvas');dial.width=dial.height=192;const ink=dial.getContext('2d');
ink.fillStyle='#c6c8b8';ink.fillRect(0,0,192,192);ink.translate(96,96);ink.strokeStyle='#3a4848';ink.lineWidth=5;
ink.beginPath();ink.arc(0,0,84,0,Math.PI*2);ink.stroke();
for(let i=0;i<12;i++){ink.save();ink.rotate(i*Math.PI/6);ink.fillStyle='#404c4a';ink.fillRect(-2,-77,4,11);ink.restore();}
ink.beginPath();ink.moveTo(-39,-22);ink.lineTo(0,0);ink.lineTo(37,-45);ink.stroke();
const dt=new T.CanvasTexture(dial);dt.colorSpace=T.SRGBColorSpace;const face=new T.Mesh(new T.PlaneGeometry(6.45,6.45),new T.MeshBasicMaterial({map:dt,side:T.DoubleSide}));
face.position.fromArray(physicalPos(towerAt-4.12,-24,towerY+47.6));face.rotation.y=pose(towerAt)[2]+Math.PI;scene.add(face);
// Keep the four districts legible as silhouettes even without finished materials.
const olive=0x86958b,steel=0x566c71;
const shapes=new Map();
function shape(geom,mat,d,x,y,w,h,len,angle=0){
 const key=geom.uuid+mat.uuid+'-'+Math.floor(d/220);if(!shapes.has(key))shapes.set(key,{geom,mat,at:d,items:[]});
 unit.position.fromArray(physicalPos(d,x,y));unit.rotation.set(0,pose(d)[2]+angle,0);unit.scale.set(w,h,len);unit.updateMatrix();shapes.get(key).items.push(unit.matrix.clone());
}
const round=new T.CylinderGeometry(.5,.5,1,18),crown=new T.IcosahedronGeometry(1,1);
const bark=material('civic-bark',0x706e62),greens=[olive,0x778b82,0x92a294].map((c,i)=>material('civic-leaf'+i,c,true));
const leafSets=[greens,...[.33,.67,1].map(weight=>greens.map(m=>leafyFinish(m,weight)))];
function tree(d,x,h,crownScale=1){
 const leaves=leafSets[Math.round(3*finishWeight(d))];
 const y=grade(d)+.16;shape(round,bark,d,x,y+h*.39,.46,h*.78,.46);
 for(let j=0;j<3;j++){const u=Math.sin(d*1.3+j*2.1);
 shape(crown,leaves[j],d+Math.cos(j*2.1+d)*h*.13,x+u*h*.16,y+h*(.69+j*.09),h*(.29+.025*j)*crownScale,h*.23,h*.31*crownScale,j+d*.03);}
}
function label(d,x,y,w,h,text,bg='#495b61',fg='#f0e9d5'){
 const c=document.createElement('canvas');c.width=640;c.height=150;const a=c.getContext('2d');a.fillStyle=bg;a.fillRect(0,0,640,150);
 a.fillStyle=fg;a.textAlign='center';a.textBaseline='middle';a.font='bold 75px system-ui';a.fillText(text,320,72,601);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));o.rotation.y=pose(d)[2]+Math.PI;o.position.fromArray(physicalPos(d,x,y));scene.add(o);cityChunks.push({at:d,mesh:o});
}
for(const {from,to,side,spacing,height,offset,crown} of avenueTrees){
 for(let d=from;d<to;d+=spacing+next()*7){const off=streetEdge(d,side)+offset+next()*1.7;tree(d,side*off,height+next()*3,crown);}
}
for(const {at,side,offset,height,arm,style} of signals){
 const x=side*(edge(at,side)+offset),y=grade(at),sx=x-side*arm;
 box(at,x,y,.19,height,.19,'post');box(at,x-side*arm*.5,y+height-.14,arm,.15,.18,'metal');
 const horizontal=style==='horizontal';
 box(at,sx,y+height-.86,horizontal?1.5:.52,horizontal?.56:1.34,.39,'metal',0x374444);
 for(let i=0;i<3;i++)box(at-.21,sx+(horizontal?(i-1)*.42:0),y+height-.76+(horizontal?.08:i*.39),.25,.23,.065,'trim',i===0?0x71c9a0:0x43514c);
}
for(const {at,side,offset,height,width,text,color} of streetSigns){
 const x=side*(edge(at,side)+offset),y=grade(at);
 box(at,x,y,.16,height,.16,'post');label(at-.13,x,y+height-.25,width,.83,text,color);
}
// Transit pull-outs live behind the kerb, with a bench, shelter glazing, stop flag and route disc.
for(const [at,side] of [[340,-1],[1172,1],[2770,1],[3700,1],[5765,1],[6860,-1]]){
 const y=grade(at),x=side*(streetEdge(at,side)+3.1);
 box(at,x,y+.18,3.9,.18,14,'curb');box(at,x,y+3.10,4.55,.28,14.6,'canopy',0x64838a);
 for(const z of [-5.8,0,5.8])box(at+z,x+side*1.3,y+.3,.16,2.8,.24,'metal');
 box(at,x+side*1.55,y+.85,.18,1.72,10.8,'trim',0xa4b5b5);
 box(at,x,y+.74,1,.23,6.8,'metal');for(const z of [-2.7,2.7])box(at+z,x,y+.22,.26,.55,.33,'metal');
 box(at-7.8,x-side*1.0,y+.2,.21,4.45,.24,'metal');
 label(at-7.95,x-side*1.0,y+4.14,2.7,1.30,'BUS','#42686e');
 label(at-7.96,x-side*1.0,y+2.62,1.75,1.54,'02','#68797d');

}
// The civic lawn opens on both sides. A low amphitheatre and oval pavilion replace the street wall.
for(let d=1200;d<2150;d+=30){for(const side of [-1,1])box(d,side*((streetEdge(d,side)+edge(d,side))*.5+22),grade(d)+.02,Math.max(8,38-streetEdge(d,side)+edge(d,side)),.18,31,'green',0x97a293);}
for(const at of [1400,1660,1910]){const y=grade(at);for(let row=0;row<5;row++)box(at,-(23+row*2.2),y+.1,2.4,.4+row*.52,45+row*2.5,'trim');}
for(const at of [1435,1840]){const y=grade(at);shape(round,material('pavilion',0xc1c7c0),at,41,y+3.5,16,7,24);shape(round,material('pavilion-rim',steel),at,41,y+7.3,24,.6,32);}
// The mall's plinth, rounded atrium, setback upper floors and projecting entrance form one landmark.
for(const [at,side] of [[5820,-1],[6100,1],[6380,-1]]){
 const y=grade(at),x=side*(edge(at,side)+29);
 box(at,x,y,27,13,82,'arcade',0xb7b6a6);box(at+8,x+side*5,y+12.8,20,9,59,'loft',0xbac2bc);
 shape(round,material('atrium',0x81999e),at-30,x-side*5,y+9,16,18,21);
 for(const elev of [4,9,14,18])shape(round,material('atrium-band',0xd1cebd),at-30,x-side*5,y+elev,16.6,.5,21.6);
 box(at-9,x-side*12,y+5.0,10,.64,40,'canopy');label(at-42.6,x,y+14.8,17,3.65,'百貨  /  DEPT.','#475b64');
 for(let z=-22;z<=30;z+=8){box(at+z,x-side*13.4,y+.35,1.2,14.4,1.08,'trim');}
 box(at+5,x+side*3,y+21.6,18,.36,47,'trim');
 for(let k=0;k<5;k++)box(at-20+k*9,side*(edge(at,side)+6.2),y+.2,2,.68,3.3,'trim');
}
// Pedestrian bridges have a visible open truss and stairs descending parallel to the sidewalk.
for(const {at,clearance,offset,depth,bays} of crossings){
 const y=grade(at),left=-edge(at,-1)-offset,right=edge(at,1)+offset,mid=(right+left)/2,w=right-left;
 box(at,mid,y+clearance,w+.6,.5,depth,'plinth');
 for(const side of [-1,1]){
 const x=side<0?left:right;
 box(at,x,y+.12,.67,clearance-.07,depth-.8,'post');
 for(let i=0;i<19;i++)box(at+2.7+i*.64,x,y+.15,2.4,(clearance-.05)*(1-i/19),.70,'trim');
 }
 for(const dz of [-depth*.46,depth*.46]){
 box(at+dz,mid,y+clearance+2.2,w,.22,.22,'metal');
 for(let i=0;i<bays;i++){
 const a=left+i*w/bays,b=a+w/bays;
 link(physicalPos(at+dz,a,y+clearance+.51+(i%2)*1.68),physicalPos(at+dz,b,y+clearance+.51+((i+1)%2)*1.68),.17,.17,'metal',at,steel);
 }}
}

// The wayfinding tower sits within the bus concourse and rises above its low roofs.
{const at=1212,x=48,y=grade(at);
 box(at,x,y,4.8,15,4.8,'plinth',0x738b89);
 box(at,x,y+15,6.5,4.4,6.5,'canopy',0x538283);
 label(at-3.32,x,y+17.2,5.8,3.5,'02','#4d7478');
 for(const z of [1187,1220,1253]){
  const cx=edge(z,1)+34;
  box(z-4.5,cx,grade(z)+6.54,16,.42,9.45,'canopy',0xb5aca0,-Math.atan2(2.7,9));
  box(z+4.5,cx,grade(z)+6.54,16,.42,9.45,'canopy',0xcac3af,Math.atan2(2.7,9));
 }}
// Bus 02 forecourt opens to a covered interchange, followed by a public lawn.
for(let at=1075;at<=1390;at+=10){const y=grade(at),w=streetEdge(at,1);
 box(at,w+23,y+.04,42,.17,10.1,'walk',0xb4afa1);
 box(at,w+12.8,y+.22,2.4,.08,10.1,'trim',0xd5c6a6);
 if((at-1075)%30===0){box(at,w+7.2,y+.3,2.2,.45,8.5,'green',0x7f907d);tree(at+2,w+7.5,6+(at%3));}
}
for(const [at,off,modules] of [[1168,39,4],[1228,43,5],[1300,51,4]]){
 const y=grade(at),xc=edge(at,1)+off;
 box(at,xc+6,y+.16,10,5.6,modules*7.5,'loft',0xa5aca0);
 for(let i=0;i<modules;i++){
  const z=at+(i-(modules-1)/2)*7.5;
  box(z,xc-3,y+.14,.34,5.0,.40,'metal');box(z,xc+3,y+.14,.34,5.8,.40,'metal');
  box(z,xc-1,y+5.60,12.12,.33,6.97,'canopy',0xb2bbb2,0,Math.atan2(1.65,12));
  box(z,xc,y+.51,2.4,.36,3.8,'trim');
 }}
label(1154,edge(1154,1)+37,grade(1154)+4.35,9,1.7,'轉乘  /  TRANSIT');


junctionFurniture({box,link,label,physicalPos});

// Distances and widths are in road metres. Ground ribbons follow the local grade
// and the road normal at both ends, so the path can run straight through a tight curve.
function ribbon(name,a,b,inner,outer,lift,color){
 const vv=[],weights=[];for(let z=a;z<b;z+=4){const e=Math.min(b,z+4);
  const p=(at,fn)=>physicalPos(at,fn(at),grade(at)+lift);
  const A=p(z,inner),B=p(e,inner),C=p(z,outer),D=p(e,outer);
  vv.push(...A,...B,...C,...C,...B,...D);weights.push(...[z,e,z,z,e,e].map(finishWeight));
 }
 const geom=geometry(vv),base=material('park-'+name,color),paint=weights.some(x=>x>0);
 if(paint)geom.setAttribute('stationFade',new T.Float32BufferAttribute(weights,1));
 const mesh=new T.Mesh(geom,paint?quarterMaterial(base,name==='lawn'?'lawn':'path',true):base);mesh.receiveShadow=true;scene.add(mesh);
}
function windingPath(name,a,b,center,width,lift,color){
 ribbon(name,a,b,d=>center(d)-width/2,d=>center(d)+width/2,lift,color);
}
function grove(at,side,offset,heights){
 for(let i=0;i<heights.length;i++){const z=at+i*4.8+(i%2)*2,x=side*(offset+Math.sin(i*2.2)*4.5+i%3*3);
 tree(z,x,heights[i]);}
}
function shelter(at,x,bays){
 const y=grade(at);
 for(let j=0;j<bays;j++){const z=at+(j-(bays-1)/2)*6.8;
 for(const side of [-1,1])box(z,x+side*3.55,y+.22,.28,4.1,.34,'metal');
 link(physicalPos(z,x-4.8,y+4.65),physicalPos(z,x+4.8,y+3.85),6.67,.34,'canopy',z,0xb7bab1,true);
 box(z,x+1.6,y+.53,1,.30,4.4,'trim');
 }}
function promenadeLight(at,x,h){
 const y=grade(at);box(at,x,y+.1,.19,h,.19,'post');box(at,x+.62,y+h,1.4,.22,.34,'trim');
}
function lawnGate(at,side,title){
 const x=side*(edge(at,side)+8.5),y=grade(at);
 box(at,x,y+.2,1,4.1,.85,'metal');box(at,x+side*4,y+.2,.53,4.05,.65,'metal');
 box(at,x+side*2,y+3.9,5.1,.62,1.4,'trim');label(at-.48,x+side*2,y+3.15,4.5,1.12,title,'#50615d');
}
const civicPath=d=>-23-5*Math.sin((d-1330)/72);
ribbon('lawn',1275,2070,d=>-edge(d,-1)-4.0,d=>-87,.295,0x94a392);
windingPath('civic-walk',1278,2068,civicPath,3.9,.32,0xc2bbab);
windingPath('civic-secondary',1325,1960,d=>-52-9*Math.sin((d-1450)/110),3.0,.33,0xaeb3a5);
for(const at of [1365,1455,1620,1830]){
 windingPath('civic-cross',at,at+27,d=>-edge(d,-1)-5-(d-at)*1.57,3.4,.35,0xc3bcad);
 lawnGate(at,-1,'市民公園');
}
for(const [z,x,hs] of [[1335,37,[7,11,8]],[1400,45,[9,7,13,8]],[1484,30,[6,10,8]],[1560,69,[14,10,12,8]],[1670,34,[9,7,11]],[1815,56,[9,13,8]]])grove(z,-1,x,hs);
for(let z=1325;z<1930;z+=27){const x=civicPath(z)-2.55;promenadeLight(z,x,3.45);if(z%2){box(z+3,x-1,grade(z)+.62,1,.22,3,'trim');}}
for(const [at,x] of [[1460,-36],[1690,-41],[1850,-39]]){
 shelter(at,x,3);const y=grade(at);
 for(let i=0;i<5;i++)box(at+13+i*1.15,x-4,y+.32,19,.30+i*.28,1.27,'trim');
}
for(const [at,x] of [[1496,-64],[1658,-61]]){const y=grade(at);
 box(at,x,y+.33,22,.2,45,'green',0x81958b);
 for(const off of [-10.5,10.5])box(at,x+off,y+.54,.18,.04,43,'roadPaint');
 for(const z of [-21,0,21])box(at+z,x,y+.54,21,.04,.18,'roadPaint');
 for(const z of [-18,18]){const arm=z>0?-1:1;box(at+z,x,y+.54,.24,3.6,.24,'metal');box(at+z+arm*.6,x,y+3.52,1.95,.95,.18,'trim');}
}

// Promenade starts at the landward abutment, crosses the last pier plaza and
// follows the dry levee to a boating club. Its upper planting frames the mall corner.
const quayPath=d=>roadsideEdge(d,1)+10.5+3.4*Math.sin((d-5710)/57);
ribbon('floodplain',5685,6230,d=>streetEdge(d,1)+4,d=>edge(d,1)+67,.27,0x8d9b8d);
windingPath('upper-quay',5686,6230,quayPath,5.0,.33,0xc2bcac);
windingPath('lower-quay',5710,6165,d=>edge(d,1)+38+6*Math.sin((d-5730)/75),3.5,.34,0xaab0a1);
for(const z of [5740,5845,5930,6060]){
 windingPath('quay-cross',z,z+27,d=>quayPath(d)+(d-z)*1.09,3.8,.36,0xc2bcac);
}
for(let z=5700;z<6170;z+=5){const x=quayPath(z)+3.0,y=grade(z);
 if((z-5700)%95<68){box(z,x,y+.29,.28,.50,5.08,'trim');if((z-5700)%10===0)box(z,x,y+.76,.14,.48,.16,'metal');
 link(physicalPos(z-2.5,quayPath(z-2.5)+3,grade(z-2.5)+1.16),physicalPos(z+2.5,quayPath(z+2.5)+3,grade(z+2.5)+1.16),.12,.12,'metal',z);}
}
for(let z=5713;z<6200;z+=32)promenadeLight(z,quayPath(z)-3.0,4.2);
for(const [z,off] of [[5755,37],[5815,47],[5882,29],[5990,46],[6125,39]])grove(z,1,off,[10,7,12,8]);
for(const at of [5780,5976]){shelter(at,quayPath(at)+12,4);}
lawnGate(5908,1,'河濱步道');
{const at=5952,x=45,y=grade(at);
 box(at,x,y+.25,14,4.7,26,'loft',0xaab3a8);box(at,x,y+4.85,19,.52,31,'canopy');
 label(at-13.2,x,y+3.57,10,1.5,'艇庫  /  ROWING','#526763');
 for(let j=0;j<3;j++){const z=at-14+j*5;
  for(const off of [-4.0,4])box(z+off,x-9,y+.32,.32,2.7,.38,'metal');
  for(const h of [1.1,2.15]){shape(crown,material('dry-shell',0xbcc0ae),z,x-9,y+h,.70,.36,5.8,.02);}
 }}

// A parcel yields a shaded passage at street level, upper floors and a separate roof.
function buildParcel(p){
 const {at,side,width:w,depth,levels,storey,arcade,bays,balconies,roof,corner,index}=p;
 const street= p.offset===undefined?edge(at,side)+p.setback:p.offset;
 const y=grade(at),f=finishes[p.material],ground=storey+.65,front=street+arcade;
 const cx=(x)=>side*x,mid=front+depth*.5,upper=y+ground;
 box(at,cx(mid),y-.15,depth,ground+.15,w-.12,'plinth',f.base);
 box(at,cx(street+arcade*.48),upper-.32,arcade+1,.46,w-.06,'trim',f.trim);
 for(let i=0;i<=bays;i++){const z=at-w*.5+.29+(w-.58)*i/bays;
  box(z,cx(street+.2),y+.1,.38,ground-.28,.43,'post',f.trim);
  if(i<bays){const door=z+w/(2*bays);box(door,cx(front-.10),y+.25,.22,ground*.75,w/bays-.63,'metal',f.base);}
 }
 const tower=p.family==='tower', stepped=tower||p.family==='commerce'||corner;
 const tier=stepped?Math.max(2,Math.ceil(levels*.46)):levels;
 const face=street+.64,shift=stepped?Math.min(3.5,depth*.19):0;
 const study=at>=arcadeStudy.start&&at<=arcadeStudy.end;
 const palette=districtAt(at).wall;
 const wall=study?new T.Color(f.wall).lerp(new T.Color(palette[(index+(side>0?1:0))%palette.length]),finishWeight(at)*(p.offset===undefined?1:.35)):f.wall;
 const mass=(z,base,fac,dep,h,width)=>box(z,cx(fac+dep*.5),base,dep,h,width,tower?'tower':study?'sampleLoft':'loft',wall);
 if(study&&p.offset===undefined&&(at<2200||p.family!=='tower'&&index%3!==1))addStreetStudy(p,{box,grade,edge});
 mass(at,upper,face,depth,(tier-1)*storey,w-.16);
 if(levels>tier)mass(at+.45,upper+(tier-1)*storey,face+shift,depth-shift*.3,(levels-tier)*storey,w*(tower?.74:.88));
 for(let i=1;i<levels;i++){
  const set=i>=tier?shift:0, ww=i>=tier?w*(tower?.74:.88):w;
  if(balconies&&i%balconies===0){const h=upper+(i-1)*storey;
   box(at,cx(face+set-.53),h+.16,1.64,.25,ww-.7,'trim',f.trim);
   box(at,cx(face+set-1.24),h+.45,.17,.67,ww-.67,'plinth',f.base);
  }
 }
 const h=upper+(levels-1)*storey,x0=face+(levels>tier?shift:0),rw=levels>tier?w*.74:w;
 if(roof==='gable'||roof==='saw'){
  const count=roof==='saw'?2:1,part=depth/count;
  for(let j=0;j<count;j++){
   const u=x0+j*part;
   link(physicalPos(at,cx(u),h+.12),physicalPos(at,cx(u+part*.54),h+1.9),rw-.40,.35,'canopy',at,f.base,true);
   link(physicalPos(at,cx(u+part*.54),h+1.9),physicalPos(at,cx(u+part),h+.14),rw-.40,.35,'canopy',at,f.base,true);}
 }else if(roof==='steps'){
  for(let j=0;j<3;j++)box(at,cx(x0+.54),h+j*.38,1.05,.4,rw*(1-j*.20),'trim',f.trim);
 }else{box(at+rw*.06,cx(x0+depth*.56),h,depth*.50,roof==='lantern'?3.5:1.8,rw*.53,'plinth',f.base);}
 if(index%3===0&&p.offset===undefined){box(at-w*.32,cx(street+.18),y+ground+.4,.96,2.5,.38,'metal',f.base);}
}
for(const original of sampleFrontages(layout())){
 // Fit the entire frontage, including both corners, to the outside pavement.
 let shift=0;
 for(let d=original.at-original.width/2-2;d<=original.at+original.width/2+3;d+=2)
   shift=Math.max(shift,frontageEdge(d,original.side)-edge(original.at,original.side));
 const parcel=shift>.05?{...original,setback:original.setback+shift}:original;
 if(parcel.style)streetFront(parcel,{box,link,grade,edge,physicalPos,label});
 else buildParcel(parcel);
}
for(const [at,side,off,kind] of [[1195,-1,48,'row'],[1300,-1,62,'commerce'],[1400,-1,82,'row'],[1270,1,100,'commerce'],[1525,1,120,'row'],[1820,1,103,'commerce'],[1560,-1,111,'commerce'],[1710,-1,120,'tower'],[1855,-1,115,'row'],[5860,1,104,'commerce'],[5950,1,118,'row'],[6085,1,97,'commerce']])buildParcel(backdrop(at,side,off,kind));


// Raised grass terraces catch the light at chase-camera height. Open edges show where
// the lawn ends and the promenade begins even when the high-speed view compresses depth.
function planter(at,x,depth,length,h){
 const y=grade(at);box(at,x,y+.19,depth,h,length,'trim',0xafb2a3);
 box(at,x,y+.19+h,depth-.47,.075,length-.45,'green',0x7f927e);
}
function walker(at,x,height,turn=0){
 const y=grade(at)+.38,mat=material('pedestrian-proxy',0x65746f);
 shape(crown,mat,at,x,y+height*.86,height*.13,height*.13,height*.13);
 shape(crown,material('ped-coat',0x899085),at,x,y+height*.57,height*.18,height*.28,height*.15,turn);
 const z=Math.cos(turn)*.13,sx=Math.sin(turn)*.13;
 for(const side of [-1,1])link(physicalPos(at+side*z,x+side*sx,y+height*.45),physicalPos(at+side*z*2,x+side*(sx+.10),y+.04),.13,.15,'post',at);
}
for(const [at,x,dep,len] of [[1439,-18,4,9],[1452,-22,5,13],[1478,-25,7,15],[1510,-28,5,16],[1565,-22,6,12],[1629,-24,6,14]]){
 planter(at,x,dep,len,.56);grove(at-1, -1,Math.abs(x),[7.1,5.7]);}
for(const [at,x] of [[1448,-16],[1450,-16.9],[1471,-17.3],[1526,-18.7],[5907,19],[5910,18.2],[5943,18],[5994,19.2]])walker(at,x,1.8+(at%3)*.05,at);
// A low bandstand opens toward the grass; its asymmetric upturned roof is visible over the lawn.
{const at=1470,x=-32,y=grade(at);box(at,x,y+.25,16,1.28,20,'walk');
 for(const off of [-7,7]){box(at+off,x-5,y+1.5,.4,8.5,.45,'metal');box(at+off,x+5,y+1.5,.4,4.5,.45,'metal');}
 for(let j=0;j<4;j++){const z=at-7.5+j*5;
 box(z,x-.5,y+8.20,17.75,.60,5.15,'canopy',0x969c8a,0,-Math.atan2(5,17));}
 for(let i=0;i<4;i++)box(at+i*1.1-13,x+4,y+.27,9,.26+i*.22,1.12,'trim');
}
// Reading terrace on the opposite edge of the civic lawn, kept low and open to the avenue.
{const at=1487,x=42,y=grade(at);
 for(let i=0;i<5;i++)box(at,x-10+i*1.3,y+.26,1.45,.45+i*.45,28-i,'trim');
 box(at,x+5,y+1.7,12.5,4.0,23,'loft');box(at,x+3,y+5.6,19,.56,26,'canopy');}
for(const [at,side,xx] of [[5905,-1,25],[5960,-1,30],[6010,-1,24]]){
 const x=side*xx;
 for(let k=0;k<4;k++)box(at,x+side*k*1.15,grade(at)+.10,1.25,.32+k*.27,21-k,'trim');
 planter(at+13,x-5,6,11,.42);grove(at+11,side,xx+5,[6.4,8,5]);
}
for(const at of [5920,5928,5967]){
 const x=quayPath(at)+5.4,y=grade(at);
 for(const h of [.85,1.68]){shape(crown,material('shell-light',0xd4d3bd),at,x,y+h,.79,.36,6.8); }
 for(const dz of [-3.1,3.1])box(at+dz,x,y+.26,2.05,1.03,.39,'post');
}

addPlaces({box,grade,physicalPos,link,label,edge,walker,windingPath});
addCityDepth({scene,cityChunks,pose,grade,physicalPos,edge,bank,riverside,nearEnd,alongX,alongZ});
addCityInteriors({scene,cityChunks,pose,physicalPos,grade,edge});
composeDistricts({T,box,grade,edge,grove,physicalPos,pose,scene,cityChunks});
for(const {geom,mat,at,items} of shapes.values()){const o=new T.InstancedMesh(geom,mat,items.length);items.forEach((m,i)=>o.setMatrixAt(i,m));o.castShadow=o.receiveShadow=true;o.computeBoundingSphere();scene.add(o);cityChunks.push({at,mesh:o});}


for(const {at,kind,items} of batches.values()){
 const decorated=kind.startsWith('quarter-'),baseKind=decorated?kind.slice(8):kind;
 const geo=decorated?cube.clone():cube;
 if(decorated)geo.setAttribute('lotFade',new T.InstancedBufferAttribute(Float32Array.from(items,item=>item[2]),1));
 const mesh=new T.InstancedMesh(geo,facade(kind),items.length);items.forEach(([matrix,col],i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,col);});
 mesh.receiveShadow=true;mesh.castShadow=!['walk','water','curb'].includes(baseKind);mesh.computeBoundingSphere();scene.add(mesh);cityChunks.push({at,mesh});
}
function visibleCity(d){
 const rearRange=370+790*(1-Math.cos(orbit.angle))*.5;
 for(const {at,mesh} of cityChunks)mesh.visible=at>d-rearRange&&at<d+1160;
}


const envFaces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,256);
 if(i===2){g.addColorStop(0,'#d5e6f4');g.addColorStop(1,'#accbdc');}else if(i===3){g.addColorStop(0,'#50534d');g.addColorStop(1,'#424842');}else{g.addColorStop(0,'#99bcdc');g.addColorStop(.45,'#ece5cf');g.addColorStop(.56,'#777d63');g.addColorStop(1,'#484c4c');}
 ctx.fillStyle=g;ctx.fillRect(0,0,256,256);if(i===1){ctx.fillStyle='#fff2cc';ctx.fillRect(60,78,63,22);}return c;});
const cubeSky=new T.CubeTexture(envFaces);cubeSky.colorSpace=T.SRGBColorSpace;cubeSky.needsUpdate=true;const pm=new T.PMREMGenerator(renderer);const env=pm.fromCubemap(cubeSky);teardown.push(()=>env.dispose());scene.environment=env.texture;scene.environmentIntensity=.60;pm.dispose();cubeSky.dispose();
const car=createCar(true,'driving',true);teardown.push(()=>car.userData.motion.dispose());scene.add(car);car.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const keys=new Set();let phase='ready',d=0,speed=0,x=0,vel=0,startTime=0,elapsed=0;
const $=id=>ui.getElementById(id);
 if(matchMedia("(pointer:coarse)").matches)$('copy').textContent="建議橫握；點全螢幕後開始。左手按住再左右滑動，方向格即時反映滑移幅度；達 144 km/h 後滑到底即起甩。右手油門與煞車。";
 $('city-exit').onclick=leave;
function addLabAudio(context,wind){
 if(!enabled('sound'))return;
 const body=context.createOscillator();body.type='triangle';engineBed=context.createGain();engineBed.gain.value=.06;
 body.connect(engineBed).connect(volume);body.start();engineBed.osc=body;
 const edge=context.createBiquadFilter();edge.type='highpass';edge.frequency.value=760;windEdge=context.createGain();windEdge.gain.value=0;wind.connect(edge).connect(windEdge).connect(volume);
 passTone=context.createOscillator();passTone.type='triangle';passTone.level=context.createGain();passTone.level.gain.value=0;passTone.connect(passTone.level).connect(volume);passTone.start();
}
function labMix(v,gas,brake){
 if(!engineBed)return;
 const t=ac.currentTime,gear=[0,16,28,40,54,66,80].findLastIndex(x=>v>=x);
 const freq=47+v*1.3-gear*8;
 engineBed.osc.frequency.setTargetAtTime(freq,t,.036);engineBed.gain.setTargetAtTime(.038+.22*gas,t,.05);
 windEdge.gain.setTargetAtTime(sm(v,28,77)*.68,t,.10);passTone.frequency.setTargetAtTime(99+nearMix*55,t,.07);passTone.level.gain.setTargetAtTime(nearMix*.17,t,.045);
}

teardown.push(()=>tileMaps.road.dispose());
let ac,engine,filter,windGain,volume;function soundStart(){try{if(!ac){ac=primedAudio??new AudioContext();if(!primedAudio)teardown.push(()=>void ac.close().catch(()=>{}));volume=ac.createGain();volume.gain.value=.20;volume.connect(ac.destination);if(window.teaRecordAudio){window.teaAudio=ac.createMediaStreamDestination();volume.connect(window.teaAudio);}engine=ac.createOscillator();engine.type='sawtooth';filter=ac.createBiquadFilter();filter.type='lowpass';filter.Q.value=.5;const level=ac.createGain();level.gain.value=.12;engine.connect(filter).connect(level).connect(volume);engine.start();
 const buffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),samples=buffer.getChannelData(0);let n=0;for(let i=0;i<samples.length;i++){n=.96*n+.04*(Math.random()*2-1);samples[i]=n;}const wind=ac.createBufferSource();wind.buffer=buffer;wind.loop=true;windGain=ac.createGain();wind.connect(windGain).connect(volume);wind.start();noiseBuffer=buffer;const tire=ac.createBiquadFilter();tire.type='bandpass';tire.frequency.value=1580;tire.Q.value=2;squeal=ac.createGain();squeal.gain.value=0;addLabAudio(ac,wind);wind.connect(tire).connect(squeal).connect(volume);}
 ac.resume();}catch{}}
const corners=turns.map(([centre,len,peak,r])=>({at:centre,side:Math.sign(peak),entry:centre-len/2}));
function roadsidePanel(at,x,label,chevron){
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=112;
 const ctx=canvas.getContext('2d');ctx.fillStyle=chevron?'#ebc052':'#223831';ctx.fillRect(0,0,192,112);
 ctx.strokeStyle=chevron?'#261f18':'#f3dbaf';ctx.lineWidth=5;ctx.strokeRect(5,5,182,102);
 ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 68px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';if(chevron){
  ctx.save();ctx.translate(96,56);ctx.scale(label==='←'?-1:1,1);
  for(const at of [-46,14]){ctx.beginPath();ctx.moveTo(at-22,-37);ctx.lineTo(at+6,-37);ctx.lineTo(at+35,0);ctx.lineTo(at+6,37);ctx.lineTo(at-22,37);ctx.lineTo(at+7,0);ctx.closePath();ctx.fill();}ctx.restore();
 }else ctx.fillText(label,96,53);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
 const g=new T.Group();const panel=new T.Mesh(new T.PlaneGeometry(2.15,1.25),new T.MeshBasicMaterial({map:tex}));panel.rotation.y=Math.PI;panel.position.set(0,1.85,-.14);g.add(panel);
 block(g,.12,2.2,.12,0x676860,0,1.1,0);railside(g,at,x);
}
for(const c of corners){
 roadsidePanel(c.entry-95,-c.side*(streetEdge(c.entry-95,-c.side)+1.65)/1.59,'100 m',false);
 for(const delta of [-32,0,34])roadsidePanel(c.at+delta,-c.side*(streetEdge(c.at+delta,-c.side)+1.65)/1.59,c.side>0?'←':'→',true);
}
for(const {start,side,gain,from,title} of decisions){
 for(const advance of [142,58])laneBoard(start-advance,side,gain,from,advance,title);
}
function laneBoard(at,side,change,lanes,advance,title){
 const c=document.createElement('canvas');c.width=640;c.height=284;const g=c.getContext('2d');
 g.fillStyle='#164d48';g.fillRect(0,0,640,284);g.strokeStyle='#dce8db';g.lineWidth=6;g.strokeRect(6,6,628,272);
 const mainX=side>0?466:166,branchX=640-mainX;
 g.textAlign='center';g.fillStyle='#fff8d9';g.font='bold 52px system-ui';g.fillText('↑ 主線',mainX,75);
 g.font='bold 39px system-ui';g.fillText(lanes+' → '+(lanes+change)+' 車道',mainX,147);
 g.fillStyle='#f5cd80';g.font='bold 48px system-ui';g.fillText(title,branchX,75,285);
 const symbol=change<0?(side>0?'↖':'↗'):(side>0?'↗':'↖');
 g.font='bold 41px system-ui';g.fillText(symbol+(change<0?' 分出':' 匯入'),branchX,148);
 g.fillStyle='#f9f5da';g.font='bold 43px system-ui';g.fillText(advance+' m',mainX,239);g.font='bold 35px system-ui';g.fillText('一般道路',branchX,239);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const group=new T.Group(),large=advance===142,w=large?6.4:4.55,h=w*284/640;
 const offset=streetEdge(at,side)+1.45,faceAt=large?edge(at,side)-1.50:offset+.8;
 const height=large?7.30:4.45,arm=side*(faceAt-offset);
 const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));panel.rotation.y=Math.PI;panel.position.set(arm,height,-.12);group.add(panel);
 block(group,.20,height+.10,.23,0x677876,0,height*.5,0);
 block(group,Math.abs(arm)+.25,.20,.25,0x677876,arm*.5,height,.14);
 railside(group,at,side*offset/1.59);
}
const railSpans=[{side:-1},{side:1}];
const railOffset=(span,at)=>(edge(at,span.side)+.12)/1.59;
let coupling=0,slip=0,driftDir=0,driftAge=0,driftStartSpeed=0,driftPeak=0,driftOver=false,driftEnds=[],hits=[],contact=null,rearmAt=0,impact=0,feedbackUntil=0;
let squeal,noiseBuffer;
function endSlide(result){
 if(driftDir)driftEnds.push({d,peak:driftPeak,result,entry:driftStartSpeed,exit:speed});
 driftDir=0;driftAge=0;if(result==='contact')coupling=0;
}
function driveFeedback(text,now){$('feedback').textContent=text;feedbackUntil=now+900;}
function hitSound(force){
 if(!ac||!noiseBuffer)return;
 const src=ac.createBufferSource(),bp=ac.createBiquadFilter(),gain=ac.createGain(),t=ac.currentTime;
 src.buffer=noiseBuffer;bp.type='bandpass';bp.frequency.value=force>.45?620:1850;bp.Q.value=.8;
 gain.gain.setValueAtTime(.30+force*.8,t);gain.gain.exponentialRampToValueAtTime(.002,t+.12+force*.17);
 src.connect(bp).connect(gain).connect(volume);src.onended=()=>{src.disconnect();bp.disconnect();gain.disconnect();};src.start();src.stop(t+.35);
}
function strikeRail(span,at,h,now){
 const side=span.side;
 const reach=1.0+1.42*Math.abs(Math.sin(slip+headingError));
 const limit=1.59*railOffset(span,at)-reach-.07;
 if(side*x<limit){if(contact===span&&side*x<limit-.48)contact=null;return;}
 const approach=Math.max(0,side*vel-1.59*speed*(railOffset(span,at+.2)-railOffset(span,at-.2))/.4);
 if(contact!==span&&now>=rearmAt){
  const before=speed,closing=approach+.24*speed*Math.abs(Math.sin(slip));
  const loss=Math.min(speed*.66,1.2+speed*.035+closing*(.82+1.65*sm(closing,1.7,6.5)));
  speed=Math.max(0,speed-loss);const force=clamp((loss-2)/15,.04,1);
  driveRecovery=.24+1.65*force;impact=force;hitSound(force);driveFeedback(loss>9?'撞擊':'擦撞',now);
  hits.push({d:at,before,after:speed,normalSpeed:closing,force});rearmAt=now+650;
  endSlide('contact');slip*=.45;
 }
 contact=span;x=side*limit;
 if(headingError*side>0)headingError=-side*Math.min(.13,.12*Math.abs(headingError)+.025);
}

// Fixed-distance reference run, sampled once. Its pace never responds to the player.
function makePacer(paintColor){const rival=createCar(true,'driving',true);teardown.push(()=>rival.userData.motion.dispose());
const ghostAlpha={value:1};const ghostPaint=new Map();rival.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;
 const paint=m=>{if(ghostPaint.has(m))return ghostPaint.get(m).paint;const c=m.clone();const prepare=m.onBeforeCompile.bind(m);
 c.onBeforeCompile=(shader,renderer)=>{prepare(shader,renderer);shader.uniforms.ghostFade=ghostAlpha;shader.fragmentShader='uniform float ghostFade;\n'+shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nif(ghostFade<.999 && fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))>ghostFade)discard;');};
 c.customProgramCacheKey=()=>m.customProgramCacheKey()+'-pace-dither';
 if(m.color?.r>m.color?.g*2.3&&m.color?.r>m.color?.b*2.3&&!m.emissive?.r)c.color.setHex(paintColor);
 ghostPaint.set(m,{paint:c,opacity:m.opacity,depth:m.depthWrite,transparent:m.transparent});return c;};
 o.material=Array.isArray(o.material)?o.material.map(paint):paint(o.material);});
scene.add(rival);return {rival,ghostAlpha};}
const {rival,ghostAlpha}=makePacer(enabled('traffic')?0x3495a3:0xf3b92d);const leader=enabled('traffic')?makePacer(0xf3b92d):null;

// Deterministic overtakes: one lane occupied at a time near each encounter.
const pack=enabled('traffic')?[[360,38,.8,0x9f695a],[735,36,-3.6,0xb9a372],[1340,38,3.4,0x547b81],[1980,41,-3.6,0xab746b],[2770,38,.7,0x698091],[3610,40,3.5,0xaca07c],[4600,39,-3.4,0x83907b],[5460,35,.8,0xb0a477]].map(([lead,pace,lane,color],i)=>{
 const g=new T.Group();const van=i%2===1;
 block(g,1.92,.65,4.25,color,0,.71,0);block(g,1.65,van?1.12:.68,van?2.95:2.04,0x43575d,0,1.27,-.16);
 block(g,1.64,.12,van?2.90:1.73,color,0,van?1.85:1.62,-.18);
 for(const x of [-.73,.73]){block(g,.36,.18,.075,0xe14c36,x,.70,-2.15);for(const z of [-1.25,1.22])block(g,.28,.54,.67,0x282a28,x*1.24,.35,z);}
 const opacity={value:1},paints=new Map();
 g.traverse(o=>{if(!o.isMesh)return;const base=o.material;if(!paints.has(base)){const mat=base.clone();
 mat.onBeforeCompile=shader=>{shader.uniforms.nearFade=opacity;shader.fragmentShader='uniform float nearFade;\n'+shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nif(nearFade<.999 && fract(dot(gl_FragCoord.xy,vec2(.75487766,.56984029)))>nearFade)discard;');};
 mat.customProgramCacheKey=()=>'city-occlusion';paints.set(base,mat);}o.material=paints.get(base);});
 scene.add(g);return {lead,pace,lane,g,opacity,slot:[1,-2,3,-1,1,2,-3,1][i]};
}):[];
function trafficStep(at,now){
 nearMix=0;
 for(const [i,t] of pack.entries()){
  const forward=t.lead+t.pace*at,gap=forward-d;t.lane=trafficX(forward,t.slot);const side=t.lane-x;
 // Only fade the traffic silhouette in the chase corridor. Its collision remains active.
 const longitudinal=sm(gap,-17,-11)*(1-sm(gap,.65,5.6));
 t.opacity.value=1-longitudinal*(1-sm(Math.abs(side),3.75,5.4));
  t.g.visible=t.opacity.value>.012&&gap>-18&&gap<610&&forward<L+60;if(t.g.visible){t.g.position.fromArray(physicalPos(forward,t.lane,grade(forward)));t.g.rotation.set(-Math.atan(grade(forward+1)-grade(forward)),pose(forward)[2],0,'YXZ');}
  if(phase!=='drive')continue;
  nearMix=Math.max(nearMix,Math.exp(-Math.abs(gap)/12)*Math.max(0,1-Math.abs(side)/11));
  if(gap<0&&!encounters.includes(i))encounters.push(i);
  if(trafficContact===i&&(Math.abs(gap)>8||Math.abs(side)>2.8))trafficContact=null;
  if(Math.abs(gap)<4.2&&Math.abs(side)<1.87&&trafficContact!==i&&now>rearmAt){
   const before=speed,closing=Math.max(0,speed-t.pace),loss=Math.min(before*.42,2+.55*closing+.36*Math.abs(vel));
   speed-=loss;impact=clamp(loss/20,.10,1);trafficContact=i;rearmAt=now+750;driveRecovery=impact;hitSound(impact);driveFeedback('擦撞車流',now);
   hits.push({d,before,after:speed,normalSpeed:closing,traffic:i,force:impact});endSlide('contact');
   // Separate to the passing side so contact never traps the player behind a car.
   x=t.lane+(x>=t.lane?1:-1)*1.90;
  }
 }
}

const paceSamples=[{s:20,t:0}];
for(let s=20,t=0,v=49;s<L+190;){let wanted=69;for(let ahead=0;ahead<=96;ahead+=12)wanted=Math.min(wanted,Math.sqrt(15.8/Math.max(.00012,Math.abs(bend(s+ahead)))+2*17*ahead));v+=clamp(wanted-v,-18,5)*.025;s+=v*.025;t+=.025;paceSamples.push({s,t});}
function referenceAt(t){const idx=Math.min(paceSamples.length-2,Math.floor(Math.max(0,t)/.025));return T.MathUtils.lerp(paceSamples[idx].s,paceSamples[idx+1].s,clamp(t/.025-idx,0,1));}
const ghostFinish=paceSamples.find(p=>p.s>=L).t;
let previousRivalS=20;function showRival(t){
 const s=referenceAt(t),lane=trafficX(s,-1)+.60*Math.sin(s/89);
 rival.userData.motion.advance(Math.max(0,s-previousRivalS),0,.016);previousRivalS=s;rival.userData.brakeLights.set(s>350&&s<460);rival.position.fromArray(physicalPos(s,lane,grade(s)+.05));rival.rotation.set(-Math.atan(grade(s+1)-grade(s)),pose(s)[2],0,'YXZ');
 // The pacing car is a non-contact target; leave the road readable while passing through it.
 const ahead=s-d;
 const opacity=sm(ahead,-.8,5.0)*(.22+.78*sm(Math.abs(lane-x)+.65*Math.abs(ahead),1.5,5));
 rival.visible=opacity>.015;
 ghostAlpha.value=opacity;
 let gap=s-d;let rank=d>=s?1:2;
 if(leader){
 const lead=s+148,leadLane=trafficX(lead,2)+.22*Math.sin(lead/141),delta=lead-d;
 leader.rival.position.fromArray(physicalPos(lead,leadLane,grade(lead)+.05));leader.rival.rotation.set(-Math.atan(grade(lead+1)-grade(lead)),pose(lead)[2],0,'YXZ');
 leader.rival.visible=delta>-.8&&delta<470;leader.ghostAlpha.value=sm(delta,-.8,5)*(.22+.78*sm(Math.abs(leadLane-x)+.65*Math.abs(delta),1.5,5));leader.rival.userData.brakeLights.set(lead>2880&&lead<3000);
 if(delta>0)rank++;if(gap<=0)gap=delta;
 }
 $('rival').textContent='P'+rank+' / '+(leader?3:2)+'　'+(gap>=0?'追距 ':'領先 ')+Math.abs(gap).toFixed(0)+' m';

}

// Open timing gates give the exit a target without blocking the view into the next bend.
function timingGate(at,sector){
 const group=new T.Group();for(const x of [-edge(at,-1)-1.45,edge(at,1)+1.45]){block(group,.22,5.4,.26,0x3b5557,x,2.7,0);block(group,.32,.55,.33,0xe9a236,x,1.15,0);}
 block(group,edge(at,-1)+edge(at,1)+3.1,.18,.26,0x405457,(edge(at,1)-edge(at,-1))/2,5.4,0);
 const plate=document.createElement('canvas');plate.width=640;plate.height=96;const ctx=plate.getContext('2d');
 ctx.fillStyle='#1a343c';ctx.fillRect(0,0,640,96);ctx.fillStyle='#ffca6a';ctx.fillRect(0,0,18,96);ctx.font='bold 63px system-ui';ctx.fillText(sector===3?'FINISH':'SPLIT   '+sector,95,70);
 const map=new T.CanvasTexture(plate);map.colorSpace=T.SRGBColorSpace;
 const p=new T.Mesh(new T.PlaneGeometry(6.0,.9),new T.MeshBasicMaterial({map}));p.rotation.y=Math.PI;p.position.set(0,5.3,-.20);group.add(p);
 group.position.fromArray(physicalPos(at,0,grade(at)));group.rotation.y=pose(at)[2];scene.add(group);
}
timingGate(2320,1);timingGate(5280,2);timingGate(L,3);
// Real rear-axle contacts leave a short pair of rubber trails on the pavement.
const rubberPositions=new Float32Array(1200*18),rubberGeo=new T.BufferGeometry();
const rubberAttr=new T.BufferAttribute(rubberPositions,3).setUsage(T.DynamicDrawUsage);rubberGeo.setAttribute('position',rubberAttr);rubberGeo.setDrawRange(0,0);
const rubber=new T.Mesh(rubberGeo,new T.MeshBasicMaterial({color:0x201e20,side:T.DoubleSide,transparent:true,opacity:.45,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
rubber.frustumCulled=false;scene.add(rubber);let rubberCount=0,tirePair=null;
function rubberAt(){
 if(phase!=='drive'||Math.abs(slip)<.21||Math.abs(x)>8.6){tirePair=null;return;}
 const yaw=headingError*.84+slip,cs=Math.cos(yaw),sn=Math.sin(yaw);
 const tracks=[-.81,.81].map(w=>[-.09,.09].map(edge=>{
  const along=d-1.24*cs-(w+edge)*sn,offset=x-1.24*sn+(w+edge)*cs;return physicalPos(along,offset,grade(along)+.060);}));
 if(tirePair){for(let i=0;i<2;i++){const [a,b]=tirePair[i],[c,e]=tracks[i];rubberPositions.set([...a,...c,...b,...b,...c,...e],(rubberCount%1200)*18);rubberCount++;}
 rubberGeo.setDrawRange(0,Math.min(1200,rubberCount)*6);rubberAttr.needsUpdate=true;}
 tirePair=tracks;
}
const splitMarks=[2320,5280,L],recordKey='city-gray-5-'+trialKey;
let best=null;
try{const saved=JSON.parse(localStorage.getItem(recordKey));if(Array.isArray(saved)&&saved.length===3&&saved.every((v,i)=>Number.isFinite(v)&&v>0&&(!i||v>saved[i-1])))best=saved;}catch{}
let splits=[],splitUntil=0,steering=0,headingError=0,edgeTime=0,previousStart=false,driveRecovery=0;
function start(){
 orbit.reset();
 transfers.length=0;encounters.length=0;trafficContact=null;nearMix=0;transferAge=1;coupling=0;slip=0;driftDir=0;driftAge=0;driftEnds=[];hits=[];contact=null;rearmAt=0;impact=0;feedbackUntil=0;$('feedback').textContent='';
 rubberCount=0;tirePair=null;rubberGeo.setDrawRange(0,0);driveRecovery=0;soundStart();Object.assign(wheelBar,createSteerBar());driftLatch=0;d=entry;x=laneWidth*.5;vel=0;speed=49;steering=0;headingError=0;edgeTime=0;
 if(volume)volume.gain.setTargetAtTime(.20,ac.currentTime,.04);phase='drive';elapsed=0;splits=splitMarks.filter(n=>n<entry).map(()=>0);splitUntil=0;window.teaFrames.length=0;startTime=performance.now();
 $('panel').hidden=true;$('split').textContent='';$('best').textContent=best?'個人最佳 '+best[2].toFixed(2)+' s':'';
}
function passSplit(now){
 const i=splits.length;if(i>=splitMarks.length||d<splitMarks[i])return;
 splits.push(elapsed);
 const delta=best?elapsed-best[i]:null;
 const diff=delta===null?'':('　'+(delta>=0?'+':'−')+Math.abs(delta).toFixed(2)+' s');
 $('split').textContent='S'+(i+1)+'　'+elapsed.toFixed(2)+' s'+diff;splitUntil=now+2300;
 if(i!==2)return;
 phase='finish';d=L;const faster=!best||elapsed<best[2];if(faster&&!entry){best=splits.slice();try{localStorage.setItem(recordKey,JSON.stringify(best));}catch{}}
 $('panel').hidden=false;selectPanel($('go'),true);$('title').textContent=faster&&!entry?'個人最佳':'抵達中央車站';$('copy').textContent='本趟 '+elapsed.toFixed(2)+' s'+(best?'　·　最佳 '+best[2].toFixed(2)+' s':'');
 $('best').textContent='';$('go').textContent='再跑一趟　↵';
}
$('title').textContent='城際快線｜城市大道';$('go').onclick=start;
for(const btn of ui.querySelectorAll('[data-key]')){btn.onpointerdown=e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(btn.dataset.key);};btn.onlostpointercapture=()=>keys.delete(btn.dataset.key);}
window.teaFrames=[];
const meterCells=Array.from(ui.querySelectorAll('#steerMeter i'));
let previousButtons=[],inputFocused=false,lastOption=-Infinity,pauseAt=0,menuChoice=0,confirming=false;
const wheelBar=createSteerBar();
let driftLatch=0,snapshotBusy=false,shotRequested=false;
const reviewQuery=new URLSearchParams(location.search);
const previewAt=import.meta.env.DEV?Number(reviewQuery.get('cityView')):0;
const entry=Number.isFinite(previewAt)?clamp(previewAt,0,L-100):0;
d=entry;
const layerSwitch=$('cityLayers'),layerKey=$('layerKey');let removeLines;
function showLayers(on){
 if(removeLines){removeLines();removeLines=undefined;}
 if(on)removeLines=createReviewLines(scene);
 layerSwitch.setAttribute('aria-pressed',String(on));layerKey.hidden=!on;
 if(phase==='paused')renderer.render(scene,camera);
}
const snapshotButton=$('citySnapshot');
snapshotButton.addEventListener('click',()=>{shotRequested=true;},scope);
snapshotButton.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space')e.stopPropagation();},scope);
layerSwitch.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter')e.stopPropagation();},scope);
layerSwitch.addEventListener('click',()=>showLayers(!removeLines),scope);
window.addEventListener('keydown',e=>{if(e.code==='F6'){e.preventDefault();if(!e.repeat)showLayers(!removeLines);}},scope);
teardown.push(()=>{removeLines?.();});
if(reviewQuery.get('layers')==='1')showLayers(true);
const pauseMenu=$('pauseMenu'),menuButtons=[...pauseMenu.querySelectorAll('button')];
const panelButtons=[...$('panel').querySelectorAll('button')],menuNav=new PadMenuNavigation();
let panelChoice=$('go');
function selectPanel(button,focus=false){
 panelChoice=button;
 for(const b of panelButtons)b.classList.toggle('city-selected',b===button);
 if(focus)button.focus({preventScroll:true});
}
function movePanel(delta){
 const available=panelButtons.filter(b=>b.getClientRects().length&&!b.disabled);
 selectPanel(available[(available.indexOf(panelChoice)+delta+available.length)%available.length],true);
}
for(const b of panelButtons)b.addEventListener('focus',()=>selectPanel(b),scope);
selectPanel(panelChoice,document.hasFocus());
function drawMenu(){
 $('pauseTitle').textContent=confirming?'放棄這一趟？':'已暫停';
 menuButtons[0].textContent=confirming?'返回暫停選單':'繼續行駛';
 menuButtons[1].textContent=confirming?'確認重新開始':'重新開始…';
 menuButtons[2].disabled=confirming;
 menuButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===menuChoice)));
 menuButtons[menuChoice].focus({preventScroll:true});
}
function moveMenu(delta){const size=confirming?2:3;menuChoice=(menuChoice+delta+size)%size;drawMenu();}
function pauseRace(now){if(phase!=='drive')return;phase='paused';pauseAt=now;orbitNeedsNeutral=true;menuChoice=0;confirming=false;pauseMenu.hidden=false;keys.clear();drawMenu();if(volume)volume.gain.setTargetAtTime(0,ac.currentTime,.025);}
function resumeRace(now){
 if(phase!=='paused')return;
 startTime=now-1000*elapsed;
 const delay=now-pauseAt;rearmAt+=delay;feedbackUntil+=delay;splitUntil+=delay;
 pauseMenu.hidden=true;phase='drive';last=now;keys.clear();if(volume)volume.gain.setTargetAtTime(.2,ac.currentTime,.04);
}
function choose(i){
 if(phase!=='paused')return;
 if(!confirming&&i===2)return leave();
 if(!confirming&&i===0)return resumeRace(performance.now());
 if(confirming&&i===1){pauseMenu.hidden=true;return start();}
 confirming=!confirming;menuChoice=0;drawMenu();
}
menuButtons.forEach((b,i)=>b.onclick=()=>choose(i));
window.addEventListener("keydown",e=>{
 if(e.composedPath()[0]?.id==='citySnapshot'||e.composedPath()[0]?.id==='cityLayers')return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='Escape'&&(phase==='finish'||phase==='ready')){leave();return;}
 if(e.code==='Escape'){if(phase==='paused')resumeRace(performance.now());else pauseRace(performance.now());return;}
 if(e.code==='F8'){e.preventDefault();shotRequested=true;return;}
 if(phase==='paused'){if(['ArrowUp','ArrowDown'].includes(e.key)){moveMenu(e.key==='ArrowUp'?-1:1);}if(e.key==='Enter'){e.preventDefault();choose(menuChoice);}return;}
 if(phase==='ready'||phase==='finish'){
  if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();movePanel(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();panelChoice.click();return;}
 }
 keys.add(e.key);
},scope);window.addEventListener("keyup",e=>keys.delete(e.key),scope);window.addEventListener("blur",()=>keys.clear(),scope);
function controls(pad,now){
 const buttons=Array.from(pad?.buttons||[],b=>!!b?.pressed||b?.value>.5),edge=i=>buttons[i]&&!previousButtons[i];
 const ax=Number.isFinite(pad?.axes[0])?pad.axes[0]:0,ay=Number.isFinite(pad?.axes[1])?pad.axes[1]:0;
 const identity=pad?pad.index+':'+pad.id:null,focused=document.hasFocus()&&!document.hidden;
 const capture=()=>menuNav.capture(ax,ay,buttons);
 if(!focused||!inputFocused||identity!==menuPadIdentity){
  inputFocused=focused;menuPadIdentity=identity;orbitNeedsNeutral=true;previousButtons=buttons;capture();return;
 }
 const face=pad&&menuFaceButtons(pad),confirm=face&&edge(face.confirm),back=face&&edge(face.back);
 const direction=phase==='drive'?null:menuNav.poll(ax,ay,buttons,now);
 const delta=direction==='up'||direction==='left'?-1:direction?1:0;
 if(phase==='drive'||delta)capture();
 if(edge(9)&&now-lastOption>320){
  capture();lastOption=now;if(phase==='paused')resumeRace(now);else if(phase==='drive')pauseRace(now);
 }else if(face&&edge(10)){shotRequested=true;}
 else if(phase==='paused'){
  if(delta)moveMenu(delta);
  if(confirm)choose(menuChoice);
  else if(back){if(confirming){confirming=false;menuChoice=0;drawMenu();}else resumeRace(now);}
 }else if(edge(11)&&phase==='drive'){orbit.reset();}
 else if(phase==='ready'||phase==='finish'){
  if(delta)movePanel(delta);
  if(back)leave();else if(confirm)panelChoice.click();
 }
 previousButtons=buttons;
}
function snapshot(){
 if(snapshotBusy)return;snapshotBusy=true;
 const src=renderer.domElement,c=document.createElement('canvas');c.width=src.width;c.height=src.height;
 const g=c.getContext('2d');g.drawImage(src,0,0);g.scale(c.width/innerWidth,c.height/innerHeight);
 const overlay=phase==='paused'?pauseMenu:phase==='drive'?null:$('panel');
 if(overlay){const r=overlay.getBoundingClientRect();g.fillStyle='#182a32ef';g.fillRect(r.x,r.y,r.width,r.height);}
 const ids=['#hud small','#beat','#rival','#split','#feedback','#best','#info'];
 const elems=ids.map(s=>ui.querySelector(s));
 if(overlay)elems.push(...overlay.querySelectorAll('h1,h2,button,p,a'));
 for(const el of elems){if(!el||!el.offsetWidth||!el.textContent.trim())continue;
  const r=el.getBoundingClientRect(),css=getComputedStyle(el);g.fillStyle=css.color;g.font=css.fontWeight+' '+css.fontSize+' '+css.fontFamily;g.textBaseline='middle';g.textAlign=css.textAlign==='right'?'right':'left';
  g.shadowColor='#172127';g.shadowBlur=2;g.fillText(el.innerText.replace(/\n/g,' '),g.textAlign==='right'?r.right:r.left,r.top+r.height/2,r.width);
 }
 const gauge=$('steerMeter').getBoundingClientRect();
 g.fillStyle='#18262ad9';g.fillRect(gauge.x,gauge.y,gauge.width,gauge.height);
 for(const cell of meterCells){const b=cell.getBoundingClientRect();g.fillStyle=cell.classList.contains('on')?'#f4bc71':'#798681';g.fillRect(b.x,b.y,b.width,b.height);}
 const dot=$('steerPin').getBoundingClientRect();g.fillStyle='#fff1d3';g.fillRect(dot.x,dot.y,dot.width,dot.height);
 c.toBlob(blob=>{snapshotBusy=false;const note=$('shotNote');
 if(blob?.size){const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='city-v5-'+Math.round(d)+'m-'+Date.now()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);note.textContent='快照 PNG 已匯出';}else note.textContent='快照失敗';
 note.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>note.hidden=true,1600);
 },'image/png');
}

let touchAxis=0,touchWheelId=null,touchOrigin=0,touchTravel=54,phoneToastTimer;
const phoneControls=$('phoneControls'),touchWheel=$('phoneSteer');
const PAD_DRIFT_START=27,PHONE_DRIFT_START=40,PHONE_DRIFT_STOP=33;
const phoneCoarse=matchMedia('(pointer:coarse)');
function clearPhoneWheel(){const id=touchWheelId;touchWheelId=null;touchAxis=0;touchWheel.style.setProperty('--x',0);if(id!==null&&touchWheel.hasPointerCapture(id))touchWheel.releasePointerCapture(id);}
function phoneAxis(e){
 const delta=e.clientX-touchOrigin, abs=Math.abs(delta);
 const unit=clamp((abs-4)/(touchTravel-4),0,1);
 touchAxis=Math.sign(delta)*unit;
 touchWheel.style.setProperty('--x',touchAxis);
}
touchWheel.onpointerdown=e=>{if(phase!=='drive'||touchWheelId!==null)return;e.preventDefault();touchWheelId=e.pointerId;touchOrigin=e.clientX;touchTravel=clamp(touchWheel.getBoundingClientRect().width*.34,46,62);touchWheel.setPointerCapture(e.pointerId);phoneAxis(e);};
touchWheel.onpointermove=e=>{if(e.pointerId===touchWheelId)phoneAxis(e);};
touchWheel.onlostpointercapture=e=>{if(e.pointerId===touchWheelId)clearPhoneWheel();};
function clearPhoneInput(){clearPhoneWheel();keys.clear();}
$('phonePause').onclick=()=>{clearPhoneInput();pauseRace(performance.now());};
window.addEventListener('blur',clearPhoneInput,scope);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearPhoneInput();pauseRace(performance.now());}},scope);
const fullButtons=[$('phoneFullReady'),$('phoneFullRun')],phoneFullNote=$('phoneFullNote');
function reflectFull(){const active=!!document.fullscreenElement;fullButtons.forEach(b=>{b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'離開全螢幕':'全螢幕');});fullButtons[0].textContent=active?'離開全螢幕':'全螢幕';}
function fullToast(text){phoneFullNote.textContent=text;phoneFullNote.hidden=false;clearTimeout(phoneToastTimer);phoneToastTimer=setTimeout(()=>phoneFullNote.hidden=true,4000);}
async function toggleFull(){
 clearPhoneInput();
 try{if(document.fullscreenElement){await document.exitFullscreen();return;}
  if(!document.documentElement.requestFullscreen)throw new Error('unsupported');
  await document.documentElement.requestFullscreen();
  try{await screen.orientation?.lock?.('landscape');}catch{}
 }catch{fullToast('這個瀏覽器無法進入全螢幕，請用 Chrome 開啟。');}
}
for(const button of fullButtons)button.onclick=toggleFull;
document.addEventListener('fullscreenchange',()=>{clearPhoneInput();reflectFull();},scope);reflectFull();
let preferredPad=null, menuPadIdentity;
function drivingPad(){const pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected!==false);
 const pushed=pads.find(p=>[0,1,2,6,7,9,11,12,13,14,15].some(i=>p.buttons[i]?.pressed||p.buttons[i]?.value>.12)||Math.abs(p.axes[0]||0)>.16||Math.abs(p.axes[1]||0)>.55||Math.abs(p.axes[2]||0)>.55||p.buttons[10]?.pressed);
 preferredPad=pushed||pads.find(p=>p.index===preferredPad?.index)||pads.find(p=>p.mapping==='standard')||pads[0];return preferredPad;
}
previousButtons=Array.from(drivingPad()?.buttons??[],button=>!!button.pressed);
 window.addEventListener('outrun:back-attempt',()=>{if(phase==='drive')pauseRace(performance.now());else if(phase!=='paused')leave();},scope);
 let last=performance.now();function frame(now){
 if(import.meta.env.DEV&&phase==='drive')window.teaFrames.push([d,now-last]);const dt=Math.min(.085,(now-last)/1000);last=now;
 const pad=drivingPad(),wasPaused=phase==='paused';controls(pad,now);
 if(closed)return;
 if(phase==='paused'||wasPaused){phoneControls.hidden=true;if(shotRequested){shotRequested=false;renderer.render(scene,camera);snapshot();}if(!closed)raf=requestAnimationFrame(frame);return;}
 const gas=keys.has('ArrowUp')||keys.has('w')?1:pad?.buttons[7]?.value??0,brake=keys.has('ArrowDown')||keys.has('s')?1:pad?.buttons[6]?.value??0;
 phoneControls.hidden=phase!=='drive'; const axis=touchWheelId===null?(pad?.axes[0]??0):touchAxis;
 const digital=(keys.has('ArrowLeft')||pad?.buttons[14]?.pressed?1:0)-(keys.has('ArrowRight')||pad?.buttons[15]?.pressed?1:0);
 const touchSteering=touchWheelId!==null&&!digital; const raw=digital||-axis, target=stepSteerBar(wheelBar,phase==='drive'?raw:0); const input=target;
 const dir=Math.sign(raw),lock=Math.abs(raw);
 $('steerMeter').dataset.side=dir>0?'left':dir<0?'right':'center';
 $('steerMeter').style.setProperty('--pointer',String(-input));
 for(const cell of meterCells){const lit=Number(cell.dataset.step)*dir>0&&Math.abs(Number(cell.dataset.step))<=wheelBar.level;if(cell.classList.contains('on')!==lit)cell.classList.toggle('on',lit);}
 if(lock<.34)driftLatch=0;
 const touchDriver=touchSteering||(phoneCoarse.matches&&!pad&&!digital);
 if(touchDriver&&driftDir&&speed<PHONE_DRIFT_STOP)endSlide('caught');
 const ready=phase==='drive'&&enabled('drift')&&lock>=fullLock&&dir!==driftLatch&&speed>=(touchDriver?PHONE_DRIFT_START:PAD_DRIFT_START);
 if(ready&&dir!==driftDir){
  const reversing=driftDir!==0;
  if(reversing){endSlide('transfer');transfers.push({d,speed});}
  driftLatch=dir;driftDir=dir;transferAge=reversing?0:1;driftAge=0;
  driftPeak=Math.abs(slip);driftOver=false;driftStartSpeed=speed;
 }
 if(now>feedbackUntil)$('feedback').textContent=driftDir?(driftOver?'甩尾過度':'甩尾　'+Math.round(Math.abs(slip)*180/Math.PI)+'°'):'';
 impact*=Math.exp(-dt*9);
 if(phase==='drive'){
  const steps=Math.max(1,Math.ceil(dt/.018)),h=dt/steps;
  for(let n=0;n<steps;n++){
   const k=bend(d),slope=grade(d+1)-grade(d),gravel=sm(Math.abs(x)-edge(d,Math.sign(x)||1),-.80,.85);
   // Retain the accepted slide and keyboard mapping. Bring forward small analogue inputs
   // progressively with speed, with full steering authority unchanged at both locks.
   const mapped=input;
   // Fast lane placement on open straights; fade out before either axle loads in a bend.
   const roadLoad=Math.max(Math.abs(k),Math.abs(bend(d+speed*.22))*.82);
   coupling=clamp(coupling+(driftDir?h/.16:-h/.22),0,1);
   const rearWeight=sm(coupling,0,1);
   const freeGrip=enabled('drift') ? (1-rearWeight)* (1-sm(roadLoad,.00115,.00335))*sm(speed,16,42)*(1-gravel):0;
   const centre=1-sm(Math.abs(mapped),.045,.19);
   const returning=Math.sign(mapped)!==Math.sign(steering)||Math.abs(mapped)<.025;
   steering+=(mapped-steering)*(1-Math.exp(-h*(returning?24:12)));
   driveRecovery=Math.max(0,driveRecovery-h);
   const traction=1-.82*sm(driveRecovery,0,1.4);
   const accel=traction*gas*(17.8-.12*speed)*(1-.57*gravel)-brake*21.8-1.45-.00095*speed*speed-9.81*slope;
   speed=clamp(speed+h*(accel-gravel*(1.9+.64*Math.max(0,speed-29))),0,77.8);
   // Front grip peaks while coasting. Heavy braking and power both trade away lateral grip.
   const grip=(19.7-3.8*gas-5.4*brake)*(1-.32*gravel);
   let yawRate=steering*Math.min(.74,grip/Math.max(4,speed))*sm(speed,0,4);
   if(driftDir){
    driftAge+=h;transferAge+=h;
    const into=steering*driftDir, lock=sm(into,.78,1)*sm(driftAge,.75,1.7);
    // Rear slip builds under power and steering lock. Unwind the wheel to settle it.
    const technicalSlide=enabled('drift')&&technical;
    const target=Math.max(.22*(1-sm(transferAge,.17,.55)),.024*gas+((technicalSlide?.35:.27)+(technicalSlide?.27:.46)*gas)*Math.max(0,into)+(technicalSlide?.30:.40)*lock-(technicalSlide?.86:.65)*Math.max(-into,0));
    // Integrate the signed angle. Countersteering can cross zero without flipping the rear axle.
    const rate=(into<0?6.8:enabled('drift')?(technical?4.4:3.9):3.7)*sm(driftAge,0,.11);
    slip=T.MathUtils.lerp(slip,driftDir*target,1-Math.exp(-h*rate));
    const magnitude=Math.abs(slip);
    driftPeak=Math.max(driftPeak,magnitude);if(magnitude>.88&&!driftOver){driftOver=true;driveFeedback('甩尾過度',now);}
    const loss=driftOver?10+speed*.045:.45+1.75*magnitude*magnitude;
    speed=Math.max(0,speed-h*loss);

    if((driftAge>.24&&transferAge>.64&&magnitude<.095)||speed<16)endSlide(driftOver?'overrotated':'caught');
   }else slip*=Math.exp(-h*(6.8+1.2*(1-rearWeight)));
   if(rearWeight>0){
    const magnitude=Math.abs(slip), rearForce=sm(magnitude,.06,.50)*((enabled('drift')?(technical?32.5:26.7):26)+26*magnitude)*(driftOver?.42:1)*(1-.34*gravel);
    const slideYaw=(steering*grip*(1-.58*sm(magnitude,.06,.5))+Math.sign(slip)*rearForce)/Math.max(8,speed);
    yawRate=T.MathUtils.lerp(yawRate,slideYaw,rearWeight);
   }

   const advance=speed*Math.cos(headingError)/Math.sqrt(1+slope*slope)/Math.max(.85,1-k*x);
   // The previous yaw budget fell inversely with speed, then the road-frame damper
   // took almost a second to catch the car after release. Increase front turn-in
   // on straights and damp only the residual heading harder when the driver centres.
   const turnIn=1+freeGrip*2.70;
   const align=1.08+freeGrip*(1.20+7.0*centre);
   headingError=clamp(headingError+h*(yawRate*turnIn-k*advance-headingError*align),-.61,.61);
   vel=speed*Math.sin(headingError);x+=vel*h;
   const span=railSpans[x<0?0:1];strikeRail(span,d,h,now);
   // Riding the concrete through an overloaded bend scrubs the outer tyres.
   if(contact===span && span.side*x>edge(d,span.side)-1.6){
    const scrub=Math.max(0,Math.abs(k)*speed*speed-grip);
    speed=Math.max(0,speed-h*(1.3+.78*scrub));
   }
   x=clamp(x,-edge(d,-1),edge(d,1));
   d+=advance*h;if(gravel>.55)edgeTime+=h;
  }
  elapsed=(now-startTime)/1000;passSplit(now);if(now>splitUntil)$('split').textContent='';
 }
 car.userData.motion.advance(phase==='drive'?speed*dt:0,vel*.04,dt);car.userData.brakeLights.set(keys.has('ArrowDown')||!!pad?.buttons[6]?.pressed);trafficStep(elapsed,now);showRival(elapsed);rubberAt();car.position.fromArray(physicalPos(d,x,grade(d)+.05));car.rotation.set(-Math.atan((grade(d+1)-grade(d))),pose(d)[2]+headingError*.84+slip,steering*-.023+impact*.035,'YXZ');
 if(enabled('camera')){
 const driftAmount=sm(Math.abs(slip),.06,.75),fast=sm(speed,44,77);
 const distance=(technical?7.48:6.57)+driftAmount*(technical?.65:.58);
 const eyeHeight=(technical?2.88:2.39)+driftAmount*(technical?.45:.22);
 const ahead=(technical?42:34)+fast*6,aimSide=x*(technical?.65:.75)+headingError*5+(technical?2.3:1.1)*Math.sin(slip);
 const fov=(technical?55:53)+fast*(technical?3:4)+driftAmount*1.8;
 cameraFov+=(fov-cameraFov)*(1-Math.exp(-dt*3.5));if(Math.abs(camera.fov-cameraFov)>.012){camera.fov=cameraFov;camera.updateProjectionMatrix();}
 camera.position.fromArray(physicalPos(d-distance,x*.95-Math.sin(slip)*.42,grade(d-distance)+eyeHeight+impact*.09));
 orbitLook.fromArray(physicalPos(d+ahead,aimSide,grade(d+ahead)+1.18));
 }else{const eye=new T.Vector3(...physicalPos(d-8.65,x*.89,grade(d-8.65)+3.08+impact*.13));camera.position.copy(eye);orbitLook.fromArray(physicalPos(d+33,x*.53+headingError*10,grade(d+33)+1.55));}
 const lookAxis=pad?.axes[2]??0,canLook=phase==='drive'&&!document.hidden&&document.hasFocus();
 if(!canLook)orbitNeedsNeutral=true;else if(Math.abs(lookAxis)<=.18)orbitNeedsNeutral=false;
 orbit.advance(lookAxis,dt,canLook&&!orbitNeedsNeutral);
 orbit.apply({eye:camera.position,look:orbitLook},car.position);camera.lookAt(orbitLook);
 const aim=new T.Vector3(...pos(d+38,0,grade(d)));sun.target.position.copy(aim);sun.position.copy(aim).add(new T.Vector3(-100,138,-73));sky.position.copy(camera.position);visibleCity(d);$('beat').textContent=district(d)[1];$('info').textContent=Math.round(speed*3.6)+' km/h　 ·　'+(d/1000).toFixed(2)+' km　 ·　'+elapsed.toFixed(2)+' s';
 if(ac){labMix(speed,gas,brake);squeal.gain.setTargetAtTime(phase==='drive'?Math.abs(slip)*2.7:0,ac.currentTime,.055);const rpm=phase==='drive'?52+speed*.82+(speed%16)*1.4+8*gas:30;engine.frequency.setTargetAtTime(rpm,ac.currentTime,.09);filter.frequency.setTargetAtTime(170+speed*4,ac.currentTime,.1);windGain.gain.setTargetAtTime(.1+speed*.017,ac.currentTime,.2);}renderer.render(scene,camera);if(shotRequested){shotRequested=false;snapshot();}if(!closed)raf=requestAnimationFrame(frame);}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener("resize",resize,scope);resize();if(import.meta.env.DEV)window.cityDrive=()=>({orbit:orbit.angle,variant,bar:{...wheelBar},modules:[...activeModules],flowCount:densityMarks.filter(s=>s>=425&&s<=680).length,traffic:pack.map(t=>({d:t.lead+elapsed*t.pace,x:t.lane,visible:t.g.visible,opacity:t.opacity.value})),passes:[...encounters],transfers:[...transfers],fov:camera.fov,nearMix,audioNodes:!!engineBed,phase,d,speed,x,vel,elapsed,edgeTime,splits:[...splits],best,leaderDistance:referenceAt(elapsed)+(leader?148:0),ghostDistance:referenceAt(elapsed),ghostFinish,curvature:bend(d),steering,slip,driftDir,driftEnds:[...driftEnds],hits:[...hits],impact});if(!closed)raf=requestAnimationFrame(frame);

 teardown.push(()=>{delete window.cityDrive;delete window.teaFrames;delete window.teaAudio;clearTimeout(phoneToastTimer);});
 loadingFinished();
 }catch(error){close();throw error;}
}
