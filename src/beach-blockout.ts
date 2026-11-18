import {beachLife,beachMacro,beachVista,beachFlow,beachPlan,macroScenicDistance,macroLighthouseX,macroLighthouseStation,macroLighthouseScale} from './beach-macro';
import {addBeachFestival,addLighthouseBeacon,addBeachGulls} from './beach-festival';
import {beachKitPose,beachSwimSites} from './beach-zone-layout';
import {addBeachShoreActivity} from './beach-shore-activity';
import * as THREE from 'three';
import {coastBeachX} from './coast-layout';
import {coastBeachHeight,COAST_SEA_LEVEL} from './scenery-cross-section';
import type {createTrack} from './track';
import {makeBather} from './beach-people';
import {KENTING_ANCHOR} from './beach-blockout-config';

/** Local beach activity plus missing-asset fallbacks. All members use site-relative stations. */
export function addBeachBlockout(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],anchor=KENTING_ANCHOR,lighthouseReady=false,readyProps:ReadonlySet<string>=new Set()){
 const root=new THREE.Group();root.name='kenting-beach-blockout';scene.add(root);
 const colors=[0xf2e6cd,0xe98465,0x5fa1bd,0x806753,0xe7b991,0x66775a,0x35cddd,0xffdf65];
 const mats=colors.map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 const box=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,8,6);
 function mesh(g:THREE.BufferGeometry,m:number,parent:THREE.Object3D,x:number,y:number,z:number,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,mats[m]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
 function at(offset:number,x:number,water=false,override?:number){const d=override??macroScenicDistance(anchor+offset,anchor),p=sample(d),g=new THREE.Group();g.position.copy(p.position).addScaledVector(p.right,x);g.position.y=water?COAST_SEA_LEVEL:coastBeachHeight(x,p.position.y,p.right.y,d);g.rotation.y=-p.roadHeading;root.add(g);return g;}
 function umbrella(g:THREE.Group,x:number,z:number,c:number){mesh(box,3,g,x,1.1,z,.08,2.2,.08);mesh(new THREE.ConeGeometry(1.5,.55,10),c,g,x,2.3,z);}
 let parasol=0;
 if(beachPlan())for(let i=0;i<12;i++){const id='kenting-beach-parasol-'+i,pose=beachKitPose(id,anchor)!;if(readyProps.has(id))continue;const g=at(0,pose.lateral,false,pose.station);umbrella(g,0,0,i%3);mesh(box,0,g,0,.25,1,1.6,.3,.7);}
 else for(const [offset,x] of [[-120,-23],[10,-30],[110,-26]]){if(beachMacro()==='b'&&offset===110)continue;const g=at(offset,x,false,beachFlow()&&offset===110?5780:undefined);for(let i=0;i<4;i++){if(readyProps.has('kenting-beach-parasol-'+parasol++))continue;umbrella(g,(i%2)*4,(i>>1)*5,i%3);mesh(box,0,g,(i%2)*4,.25,(i>>1)*5+1,1.6,.3,.7);}}
 // Open rental and lookout masses: no opaque facade across the hero corridor.
 if(!readyProps.has('kenting-beach-rental'))for(const [offset,x,height,width] of [[-100,-18,2.8,5]]){const pose=beachPlan()?beachKitPose('kenting-beach-rental',anchor):undefined,g=at(offset,pose?.lateral??x,false,pose?.station);for(const a of [-1,1])for(const b of [-1,1])mesh(box,3,g,a*(width/2-.15),height/2,b*1.3,.15,height,.15);mesh(box,0,g,0,height,0,width,.2,3);}
 // Raised open lookout with a contrasting flag and attendant; no opaque facade.
 const guardPose=beachPlan()?beachKitPose('kenting-beach-lifeguard',anchor):undefined;
 const lookout=at(65,guardPose?.lateral??-24,false,guardPose?.station);lookout.name='lifeguard-proxy';
 if(!readyProps.has('kenting-beach-lifeguard')){
 for(const x of [-1.6,1.6])for(const z of [-1.4,1.4])mesh(box,3,lookout,x,2.2,z,.18,4.4,.18);
 mesh(box,0,lookout,0,2.2,0,3.8,.18,3.4);mesh(new THREE.ConeGeometry(3,.8,4),1,lookout,0,4.6,0);
 mesh(box,3,lookout,2,3,0,.09,6,.09);mesh(box,1,lookout,2.6,5.7,0,1.2,.65,.05);
 mesh(box,1,lookout,0,2.9,0,.55,1.1,.35);mesh(ball,4,lookout,0,3.65,0,.24,.28,.24);
 for(let i=0;i<7;i++)mesh(box,0,lookout,0,i*.3,-2.8+i*.15,2,.12,.35);
 }
 // Steps follow the existing sampled ground. Guardrail remains intact: access not approved yet.
 if(!beachPlan())for(let i=0;i<12;i++){const x=-12-i*1.4,g=at(-60,x);mesh(box,0,g,0,.08,0,3,.16,1.5);}
 const shoreActivity=beachPlan()?addBeachShoreActivity(root,sample,anchor,mats):undefined;
 const festival=beachLife()?addBeachFestival(root,sample,anchor):undefined;
 const beachGulls=beachLife()?addBeachGulls(root,sample,anchor):undefined;
 const sea=COAST_SEA_LEVEL;
 // Four small irregular pockets extend the water activity along the existing sandy shore.
 // Keep the last pocket before the lighthouse foundation and reef transition.
 const swims=beachPlan()?beachSwimSites(anchor):Array.from({length:12},(_,i)=>({station:macroScenicDistance(anchor+[-50,8,69,128][Math.floor(i/3)]+(i%3)*3,anchor),offshore:1.1+(i%2)*1.5,pocket:Math.floor(i/3),pose:(['raised','ring','swim'] as const)[i%3]}));
 for(const swim of swims){const {station:d,pocket}=swim,x=coastBeachX(-26,d)-swim.offshore,g=at(0,x,true,d);g.name='swimmer-proxy';
  g.add(makeBather(swim.pose,mats[4],mats[pocket%2?7:6],mats[0]));
  // Bounded readability exaggeration, still immersed; do not turn bathers into giants.
  g.scale.setScalar(1.35);
  g.userData={waterLevel:sea,torsoBottom:sea-.3*1.35,headTop:sea+.83*1.35,station:d,lateral:x,scale:1.35,pocket};
 }
 const tower=at(195,macroLighthouseX(),beachMacro()==='none');tower.name='lighthouse-proxy';
 if(beachVista()){const d=macroLighthouseStation(),p=sample(d);tower.position.copy(p.position).addScaledVector(p.right,macroLighthouseX());tower.position.y=coastBeachHeight(macroLighthouseX(),p.position.y,p.right.y,d);tower.rotation.y=-p.roadHeading;tower.scale.setScalar(macroLighthouseScale());}
 if(!lighthouseReady){
 // Explicit foundation mass rooted below water, not a replacement opaque sand plane.
 mesh(new THREE.ConeGeometry(12,8,12),5,tower,0,0,0,1,.7,1);
 mesh(new THREE.CylinderGeometry(1.5,2.3,12,16),0,tower,0,8,0);
 mesh(new THREE.CylinderGeometry(3,3,.5,16),0,tower,0,14,0);
 mesh(new THREE.CylinderGeometry(1.5,1.5,2,12),2,tower,0,15.2,0);
 mesh(new THREE.ConeGeometry(2,.8,12),0,tower,0,16.6,0);
 mesh(box,0,tower,5,3,0,6,2,4);
 }
 // Separate low-poly gulls; each has its own orbit/wing phase rather than a rigid carousel.
 const beacon=beachLife()?addLighthouseBeacon(tower):undefined;
 const gullWhite=mats[0].clone();gullWhite.side=THREE.DoubleSide;
 const gulls=Array.from({length:5},(_,i)=>{
  const bird=new THREE.Group();tower.add(bird);
  mesh(ball,0,bird,0,0,0,.13,.14,.38);
  mesh(ball,0,bird,0,.09,.32,.13,.13,.15);
  const wings=[-1,1].map(side=>{
   const pivot=new THREE.Group();bird.add(pivot);
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(side*.65,-.25);shape.lineTo(side*1.05,-.55);shape.lineTo(side*.65,-.43);shape.lineTo(side*.18,-.08);shape.closePath();
   const wing=new THREE.Mesh(new THREE.ShapeGeometry(shape),gullWhite);wing.rotation.x=-Math.PI/2;pivot.add(wing);return pivot;
  });return {bird,wings,i};
 });
 root.userData={anchor,beachGulls:beachGulls?.userData,festival:festival?.userData,beacon:beacon?.userData,scope:'reversible beach activity with authored assets; shore follows shared site adapter',swimmers:swims.length,lighthouseReady,shoreActivity:shoreActivity?.userData,
 update:(time:number)=>{beachGulls?.userData.update(time);beacon?.userData.update(time);festival?.userData.update(time);for(const {bird,wings,i} of gulls){const a=time*(.17+i*.017)+i*1.6,r=5+i*.8;bird.position.set(Math.cos(a)*r,18+i*.6+Math.sin(a*2)*.3,Math.sin(a)*r);bird.rotation.y=-a;wings.forEach((w,j)=>w.rotation.z=(j?1:-1)*(.14+Math.sin(time*2.7+i)*.19));}}
 };
 root.userData.update(0);
 return root;
}
