import {floatGLSL} from './coast-water-surface';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {createTrack} from './track';
import {BEACH2,beach2Shore} from './beach2-profile';
import {coastBeachHeight} from './scenery-cross-section';
import {beachSurfacePaint,parasolGround,coral,cream,teal} from './beach2-phase-b-art';
import {capeWalk} from './kenting-cape-walk';
import {addLighthouseBeacon} from './lighthouse-beacon';
import {beachSupport,type BeachPose,type SupportProp} from './assets/kenting-support';
import {kentingHero} from './assets/kenting-hero-kit';
import {kentingReef} from './assets/kenting-reef';
import {BEACH2_VERGE_PATCHES,BEACH2_ACTIVITY,BEACH2_COVE_PARTIES,BEACH2_VILLAGE,BEACH2_SWIM_PODS,BEACH2_SAND_PLAY,BEACH2_CAPE_LEDGES,BEACH2_CAPE_PLANTS} from './beach2-composition-layout';
/** Composition with reusable primitives only. Dry activity, water activity and
 * deliberate empty intervals are site-relative; all feet use the shared shore. */
export function addBeach2Macro(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],waterUniforms?:Readonly<Record<string,THREE.IUniform>>){
 const root=new THREE.Group();root.name='kenting-beach2-composition';scene.add(root);
 const mats=[cream,coral,teal,0x514537,0xd4a17e,0xe8ba65,0x284c58,0xb6b994].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
 const glow=mats.length;
 mats.push(new THREE.MeshStandardMaterial({color:0xfdbe73,emissive:0xea7429,emissiveIntensity:1.05,roughness:.85}),
  new THREE.MeshStandardMaterial({color:0x657345,roughness:1}));
 const box=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,8,6),cylinder=new THREE.CylinderGeometry(1,1,1,8);
 const placements:Record<string,unknown>[]=[];
 function place(s:number,x:number,kind:string,water=false){const station=BEACH2.core+s,p=sample(station);if(!water&&x<0&&kind!=='beach2-lighthouse'){while(x<-14&&coastBeachHeight(x,p.position.y,p.right.y,station)<-4.45)x+=.25;}const g=new THREE.Group();g.position.copy(p.position).addScaledVector(p.right,x);const ground=coastBeachHeight(x,p.position.y,p.right.y,station);g.position.y=water?-5:ground;g.rotation.y=-p.roadHeading;g.name=kind;g.userData={station,lateral:x,ground,water,depth:-5-ground,kind};placements.push(g.userData);root.add(g);return g;}
 function part(g:THREE.Object3D,geo:THREE.BufferGeometry,m:number,x:number,y:number,z:number,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geo,mats[m]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;}
 const instances=new Map<THREE.BufferGeometry,{model:THREE.Mesh;buoyant:boolean;nodes:THREE.Object3D[]}>();
 const poses:Record<string,number>={};
 function support(parent:THREE.Object3D,id:BeachPose|SupportProp,variant=0){
  const model=beachSupport(id,variant),node=new THREE.Object3D();parent.add(node);
  let batch=instances.get(model.geometry);
  if(!batch){batch={model,buoyant:id==='crawl'||id==='float'||id==='tread'||id==='short-ripple',nodes:[]};instances.set(model.geometry,batch);}
  batch.nodes.push(node);poses[id]=(poses[id]??0)+1;return node;
 }
 function person(s:number,x:number,i:number,seated=false){
  const g=place(s,x,seated?'seated':'dry-person');
  const pose=seated?'sand-sit':i%4===0?'stride':i%3===1?'chat':'stand';
  g.rotateY(i*1.47);support(g,pose,i).scale.setScalar(.93+(Math.abs(i)%4)*.035);return g;
 }
 const shadeSites:{station:number;lateral:number;radius:number}[]=[];
 function parasol(s:number,x:number,c:number){
  const g=place(s,x,'parasol'),wide=s<455;
  const shade=kentingHero(wide?(s<183&&c===1?'parasol-sage':s<183&&c===2?'parasol-mango':'parasol-coral'):'parasol-sage');
  const size=wide&&s<183?[1.04,.88,.96][c]:1;
  shade.scale.set((wide?1:.75)*size,(wide?1:.87)*(s<183?[1.02,.87,.96][c]:1),(wide?1:.75)*size);shade.rotation.y=c*.27;g.add(shade);
  shadeSites.push({station:g.userData.station,lateral:g.userData.lateral,radius:(wide?3.2:2.35)*size});
 }
 // Both the chair and the rig face +Z. The track sampler's right vector
 // points inland here; derive yaw from a point across the local waterline.
 function chair(s:number,x:number,variant:number,occupied:boolean){
  const g=place(s,x,'seat'),d=g.userData.station,frame=sample(d);
  const turn=Math.sin(variant*2.42)*.30;
  const targetD=d+Math.sin(variant*.83)*6,shoreFrame=sample(targetD);
  const target=shoreFrame.position.clone().addScaledVector(shoreFrame.right,beach2Shore(targetD)-10);
  const dir=target.sub(g.position);g.rotation.y=Math.atan2(dir.x,dir.z)+turn;g.add(kentingHero('sling-chair'));
  const facing=new THREE.Vector3(Math.sin(g.rotation.y),0,Math.cos(g.rotation.y));
  g.userData.seaward=facing.dot(frame.right)*-1;g.userData.occupied=occupied;g.userData.yaw=g.rotation.y;
  if(occupied)support(g,'deck-sit',variant).position.set(0,-.032,-.015);
 }
 // Three cross-shore depths where sand is wide, small social circles rather
 // than one line of people. Reusable primitive figures remain human scale.
 const pockets=BEACH2_ACTIVITY;
 for(const [index,p] of pockets.entries())for(let i=0;i<p.n;i++){
  const k=p.s<100?index:index-3;
  const tight=p.s<455;const d=p.s+(tight?[-3,2.5,8.2]:[-7,9,25])[i],x=p.x+(tight?[1,-1.2,1.8]:[2,-5,4])[i];parasol(d,x,(k+i)%3);
  const seatId=3*k+i,along=1.1*Math.sin(seatId*2.12+.4),across=1.26+.36*Math.cos(seatId*1.37);
  chair(d+along,x+across,seatId,seatId%4!==2);
  if(i===0&&k%3===0)chair(d+along+1.52,x+across-.68,seatId+7,false);
  const circle=[[3,2],[-2,-3],[6,-1],[-5,4]];
  for(const[j,[ds,dx]]of circle.entries()){
   if(j===3||k>6&&j===1)continue;
   if(i===2&&j===3)continue;
   const g=person(d+ds,x+dx,k*5+i+j,j===2&&(i+k)%2===0);
   g.rotation.y=-sample(BEACH2.core+d+ds).roadHeading+Math.atan2(dx,-ds);
  }
 }
 // Uneven pairs and trios connect pockets without a promenade fence.
 for(const [i,d]of [90,163,248,281,335,387,468,490,553,570,688,710,778,802,868,895,925].entries()){
  const x=[-18,-28,-21,-35,-24][i%5];for(let j=0;j<(i%3===0?3:2);j++){
   const g=person(d+j*1.9,x+j*(i%2?1.4:-1.8),i+j,j===2);
   g.rotation.y=-sample(BEACH2.core+d+j*1.9).roadHeading+(i%2?.25:Math.PI+.25);
  }
 }
 // A few central play / picnic groups exploit the newly reclaimed sand.
 for(const [k,[d,x]]of [[282,-42],[365,-60],[430,-39],[596,-49]].entries()){
  const mat=place(d,x,'picnic-mat');part(mat,box,k%2?2:1,0,.045,0,3.4,.09,2.3);
  for(const[j,[ds,dx]]of [[0,-2],[2,1],[-2,1],[4,-3]].entries()){
   const g=person(d+ds,x+dx,20+k+j,j<2);g.rotation.y=-sample(BEACH2.core+d+ds).roadHeading+Math.atan2(dx,-ds);
  }
  const b=place(d+5,x-2,'play-ball');part(b,ball,5,0,.22,0,.22,.22,.22);
 }
 function rental(s:number,x:number,color:number){const g=place(s,x,'rental-hub');g.rotateY(-1.18);
  part(g,box,3,0,.65,0,5,1.3,2.5);part(g,box,0,0,2,-1.1,5,1.2,.13);part(g,box,color,0,3,0,6,.25,4);
  for(const a of [-2.7,2.7])part(g,box,3,a,1.5,1.3,.13,3,.13);
  for(let i=0;i<4;i++){const b=part(g,ball,i%2?1:2,3.5+i*.55,1.25,-.4,.23,1.3,.1);b.rotation.z=.15;}
  for(const [i,[ds,dx]]of [[0,0],[-5,4],[6,-3],[3,6],[9,1],[-2,-4]].entries())person(s+ds,x+dx,i,i===4);
 }
 // Simple seaward counters; distinct wares and roof profiles group with the existing activity pockets.
 for(const [k,[s,x]] of [[-97,-23],[35,-27],[265,-31],[535,-29]].entries()){
  const g=place(s,x,'beach-vendor');g.rotateY(-1.16+k*.13);
  part(g,box,3,0,.62,0,2.9,1.2,1.45);part(g,box,0,0,1.26,0,3.2,.15,1.75);
  for(const a of [-1.32,1.32])part(g,cylinder,3,a,1.45,-.52,.07,2.9,.07);
  const roof=part(g,box,[2,0,1,5][k],0,2.87,-.05,3.55,.20,2.12);roof.rotation.x=-.09;
  if(k===0||k===2){
   part(g,cylinder,3,-.5,1.46,.15,.59,.28,.46);
   for(const j of [-1,0,1])part(g,ball,glow,-.5+j*.21,1.62,.16+j*.09,.13,.085+j*j*.05,.13);
   part(g,box,3,-.50,1.68,.15,1.13,.045,.09);
  }else{
   for(const j of [-1,0,1])part(g,ball,k===1?5:2,j*.53,1.50,.17,.19,k===1?.18:.32,.18);
  }
  support(g,'stand',k).position.set(.58,0,-1.1);
 }
 rental(157,-22,5);rental(398,-24,2);
 // Real dry-ground connection from shoulder to the entry cluster.
 for(let i=0;i<7;i++){const g=place(140,-12-i*1.2,'entry-step');support(g,'reed-mat').scale.set(1.08,1,2.71);}
 for(const [s,x]of [[300,-24],[650,-21],[745,-18]]){
  const g=place(s,x,'lifeguard');g.rotateY(-1.18);g.add(kentingHero('rescue-platform'));
  if(s>=650)for(let j=0;j<6;j++){
   const step=place(s-5+j*.4,x+2+j*1.18,'cove-entry');part(step,box,7,0,.10,0,1.2,.18,2.8);
  }
  const lookout=new THREE.Group();lookout.position.set(1.06,2.90,-.78);lookout.rotation.y=.48;g.add(lookout);
  part(lookout,box,3,0,.23,0,.45,.46,.40);support(lookout,'lookout',0);
  // A small lookout pair, facing the surf with offset foot ends.
  chair(s+5.3,x-1.05,Math.floor(s/7),true);
  chair(s+6.8,x+.37,Math.floor(s/7)+3,false);
 }
 for(const site of BEACH2_SAND_PLAY){
  const g=place(site.s,site.x,'sand-building');g.rotateY(site.yaw);support(g,'sand-keep');
  const scoop=support(g,'build',1);scoop.position.set(-1.19,0,-.17);scoop.rotation.y=1.34;
  const pat=support(g,'pat',0);pat.position.set(1.17,0,.27);pat.rotation.y=-1.54;
 }
 // Ground the waders on the seabed. Buoyant pose templates use waterline Y=0.
 const waterActors:{station:number;lateral:number;depth:number;water:number;pose:BeachPose;pod:boolean;bounds:THREE.Box3}[]=[];
 function swimmer(s:number,x:number,requested:'raised'|'ring'|'swim',i:number,k:number,pod:boolean,facing?:number){
  const g=place(s,x,pod?'swim-pod-'+requested:'swimmer-proxy',true);g.rotateY(facing??(i*.70-k*.54));
  const depth=Number(g.userData.depth);
  const pose:BeachPose=requested==='swim'?'crawl':requested==='ring'?'float':depth<=1.27?'wade':'tread';
  // Reuse the active wader and ring geometry batches in this cove.
  const variant=facing===undefined?k+i:pose==='wade'?0:k%2;
  const node=support(g,pose,variant);if(pose==='wade')node.position.y=-depth;
  if(facing!==undefined&&pose==='float')node.position.y=.035;
  if(facing===undefined&&(i===0||pose==='crawl'&&i%2===0)){
   const glint=support(g,'short-ripple');glint.position.set(.04,.046,pose==='crawl'?-.57:.04);
  }
  node.updateWorldMatrix(true,false);
  const geom=beachSupport(pose,variant).geometry;
  waterActors.push({station:BEACH2.core+s,lateral:x,water:g.position.y,depth,pose,pod,
   bounds:geom.boundingBox!.clone().applyMatrix4(node.matrixWorld)});
 }
 for(const [k,pod] of BEACH2_SWIM_PODS.entries())for(const [i,[ds,offset,pose]] of pod.members.entries()){
  const s=pod.s+ds;swimmer(s,beach2Shore(BEACH2.core+s)-offset,pose,i,k,true);
 }
 const waterGroups=[{s:300,n:4},{s:475,n:5},{s:745,n:7},{s:875,n:4}];
 for(const[k,p]of waterGroups.entries())for(let i=0;i<p.n;i++){
  const s=p.s+[0,5,8,15,22,26,31][i];
  swimmer(s,beach2Shore(BEACH2.core+s)-5.8-(i%3)*1.7,(['raised','ring','swim'] as const)[(i+k)%3],i,k,false);
 }
 // Six former tower swimmers use the existing wading and ring batches.
 // The other two keep their animated stroke in coast-swimmers.
 if(waterUniforms)for(const [k,party] of BEACH2_COVE_PARTIES.entries()){
  for(const [i,[s,offshore,activity,facing]] of party.entries()){
   if(activity==='stroke')continue;
   swimmer(s,beach2Shore(BEACH2.core+s)-offshore,activity==='ring'?'ring':'raised',i,k,true,facing);
  }
 }
 // Road-facing local façades share templates across both village groups.
 for(const [i,b]of BEACH2_VILLAGE.entries()){
  const g=place(b.s,b.x,b.kind==='stay'?'guesthouse':b.kind==='guest'?'quiet-guesthouse':b.kind==='stall'?'roadside-stall':'roadside-shop');g.rotateY(Math.PI+b.yaw);
  if(b.kind==='stall'){
   part(g,box,3,0,.7,0,4,1.4,6);part(g,box,0,-2.3,1.2,0,.8,.18,6.3);
   for(const a of [-2,2])for(const z of [-2.8,2.8])part(g,cylinder,3,a,1.8,z,.08,3.6,.08);
   for(let j=0;j<6;j++)part(g,box,j%2?2:0,0,3.7,-2.5+j,5,.2,1);
   for(let j=0;j<4;j++)part(g,cylinder,5,-2.2,1.5,-1.6+j,.16,.55,.16);
  }else{
   const id=b.kind==='shop'?(i===0?'veranda-shop':'awning-shop'):(i===1?'balcony-inn':'terrace-inn');
   g.add(kentingHero(id));
   // Accent only a few of the existing glass bays and light the shaded porch.
   part(g,box,glow,-1.99,1.76,3.4,.065,1.06,1.30);
   const lantern=part(g,ball,glow,-4.79,2.22,-3.68,.25,.34,.25);
   part(g,cylinder,3,lantern.position.x,2.58,-3.68,.11,.30,.11);
  }
  part(g,box,7,-1,-.04,0,14,.3,16);
  // Two customers and shaded seat give scale; no detailed signage or props.
  person(b.s-6,b.x-7,40+i);person(b.s-3,b.x-8,50+i,true);
 }
 root.add(beachSurfacePaint(sample),parasolGround(sample,shadeSites));
 const surface=(s:number,x:number,lift:number)=>{
  const d=BEACH2.core+s,p=sample(d),v=p.position.clone().addScaledVector(p.right,x);
  v.y=coastBeachHeight(x,p.position.y,p.right.y,d)+lift;return v;
 };
 // Bury the broad faces into small drifts. Long gaps retain walking access.
 const cobble=new THREE.IcosahedronGeometry(1,0),blade=new THREE.ConeGeometry(1,1,3);
 // Match the indexed boxes already in the opaque gravel material batch.
 cobble.setIndex(Array.from({length:cobble.getAttribute('position').count},(_,i)=>i));
 for(const [i,[s,x,length]] of BEACH2_VERGE_PATCHES.entries()){
  for(let j=0;j<3+i%3;j++){
   const phase=i*2.37+j*1.61;
   const lateral=x+1.28*Math.sin(phase);
   const g=place(s+length*(j/4-.48),lateral,'strand-margin');
   const r=part(g,cobble,7,0,-.045,0,.53+.22*Math.cos(phase),.22+.08*Math.sin(phase),.71+.25*Math.sin(i+j));
   r.rotation.y=phase;
   if((i+j)%3!==0)for(let k=0;k<3;k++){
    const tuft=part(g,blade,glow+1,.22+k*.13,.12,.25*Math.sin(k+phase),.13,.37+.09*Math.cos(phase+k),.10);
    tuft.rotation.z=(k-1)*.35;tuft.rotation.y=phase+k;
   }
  }
 }
 for(const ledge of BEACH2_CAPE_LEDGES)root.add(kentingReef(ledge,surface));
 for(const [s,x,size,angle] of BEACH2_CAPE_PLANTS){
  const plant=place(s,x,'coastal-pandanus');plant.rotateY(angle);
  const crown=kentingHero('coastal-pandanus');crown.scale.setScalar(size);plant.add(crown);
 }
 // Low vegetation follows the same absolute-height field as the Worker grass.
 for(const [i,[s,x]] of [[-375,38],[-319,56],[-269,33],[-226,43],[-169,49],[-120,31]].entries()){
  for(let j=0;j<3;j++){const g=place(s+j*4.6,x+Math.sin(i+j)*3.3,'foothill-scrub');
   part(g,ball,glow+1,0,.49,0,1.55+j*.35,.85+j*.12,1.48);}
 }
 // The walk rises with the cape. Each tread overlaps the next riser and enters
 // the ground on both sides. The top opens onto the visitor landing.
 const walk=capeWalk(surface);
 root.add(walk.mesh);
 for(const [i,t] of [.28,.61,.90,.95,1].entries()){
  const point=walk.profile.points[Math.round(t*(walk.profile.points.length-1))];
  const g=place(point.s,point.x+(i%2?-1.3:1.2),'tower-visitor');support(g,i%2?'chat':'stride',i).rotation.y=1.17*i;
 }
 const tower=place(BEACH2.tower,-35,'beach2-lighthouse');tower.add(kentingHero('gallery-lighthouse'));
 // Static primitive batching avoids turning composition into hundreds of draws.
 root.updateMatrixWorld(true);const buckets=new Map<string,{mat:THREE.Material;parts:THREE.BufferGeometry[]}>();for(const g of [...root.children]){g.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),key=o.material.uuid+Object.keys(geo.attributes).sort().join();let b=buckets.get(key);if(!b){b={mat:o.material,parts:[]};buckets.set(key,b);}b.parts.push(geo);});root.remove(g);}for(const b of buckets.values()){const geo=mergeGeometries(b.parts,false);if(geo)root.add(new THREE.Mesh(geo,b.mat));b.parts.forEach(g=>g.dispose());}
 cobble.dispose();blade.dispose();
 const actors=new THREE.Group();actors.name='instanced-beach-activity';
 let waterMaterial:THREE.Material|undefined;
 for(const {model,nodes,buoyant} of instances.values()){
  const mesh=new THREE.InstancedMesh(model.geometry,model.material,nodes.length);mesh.name=model.name;
  if(waterUniforms&&buoyant&&!Array.isArray(model.material)){
   if(!waterMaterial){
    waterMaterial=model.material.clone();
    waterMaterial.onBeforeCompile=shader=>{
     Object.assign(shader.uniforms,waterUniforms);
     shader.vertexShader=floatGLSL+'\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vec2 anchor=(modelMatrix*instanceMatrix[3]).xz;
      mvPosition.xyz+=mat3(viewMatrix)*floatDelta(anchor);
      gl_Position=projectionMatrix*mvPosition;`);
    };
   }
   mesh.material=waterMaterial;
  }
  nodes.forEach((node,i)=>mesh.setMatrixAt(i,node.matrixWorld));
  mesh.computeBoundingSphere();actors.add(mesh);
 }
 root.add(actors);
 const beaconMount=new THREE.Group();beaconMount.position.copy(tower.position);beaconMount.rotation.copy(tower.rotation);root.add(beaconMount);
 const beacon=addLighthouseBeacon(beaconMount);beacon.position.y=28.66;beacon.scale.set(1.45,1.12,1.45);
 root.userData={scope:'Beach arrival, hillside and lighthouse walk.',beacon:beacon.userData,update:beacon.userData.update,walk:walk.profile,poses,anchor:BEACH2.core,tower:{...tower.userData,world:tower.position.clone()},waterActors,swimmers:waterActors.filter(a=>!a.pod),shoreActivity:{placements,pockets,waterGroups,quietFrom:BEACH2.core+950,village:BEACH2_VILLAGE,clearIntervals:[[5800,5990]]}};
 return root;
}
