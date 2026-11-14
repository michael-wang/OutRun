import * as THREE from 'three';
import {VRMSpringBoneManager,VRMSpringBoneJoint,VRMSpringBoneCollider,VRMSpringBoneColliderShapeSphere} from '@pixiv/three-vrm-springbone';
import type {WindGroom} from './hero-groom';
import {cabinWind,experimentalHairWind,type CabinWindInput} from './cabin-wind';

/** Existing Spring solver; R6g distinguishes wrapping primary locks and feathers. */
export function springBlonde(root:THREE.Group):WindGroom{
 const layered=root.getObjectByName('R6g_blonde_rig');
 const expanded=root.getObjectByName('R6f_blonde_rig');
 const chainCount=layered?18:expanded?16:6,depthCount=expanded?4:3;
 const slots:number[]=(layered??expanded)?.userData.windSlots??Array.from({length:6},(_,i)=>i);
 const manager=new VRMSpringBoneManager(),joints:VRMSpringBoneJoint[]=[];
 const neck=new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeSphere({radius:.052,offset:new THREE.Vector3(0,-.12,.012)}));
 root.add(neck);
 const colliders=[neck];
 if(expanded||layered){const head=new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeSphere({radius:.12,offset:new THREE.Vector3(0,.015,0)}));root.add(head);colliders.push(head);}
 for(let chain=0;chain<chainCount;chain++)for(let depth=0;depth<depthCount;depth++){
  const bone=root.getObjectByName(`lock-${chain}-${depth}`)!,child=root.getObjectByName(`lock-${chain}-${depth+1}`)!;
  const joint=new VRMSpringBoneJoint(bone,child,{
   stiffness:layered?(chain<8?[8,5,2.8]:[5.2,2.8,1.5])[depth]*(.94+.12*Math.sin(chain*1.7)**2):expanded?[3.4,2.2,1.4,.9][depth]*(.85+.30*Math.sin(chain*1.7)**2):[4.2,2.3,1.35][depth]*(.96+.015*chain),
   dragForce:layered?(chain<8?[.48,.36,.28]:[.37,.27,.20])[depth]:expanded?[.32,.24,.18,.14][depth]*(.90+.13*Math.cos(chain*.9)**2):[.40,.29,.24][depth],
   gravityPower:0,gravityDir:new THREE.Vector3(),hitRadius:.003,
  },[{colliders}]);manager.addJoint(joint);joints.push(joint);
 }
 const force=new THREE.Vector3(),orientation=new THREE.Quaternion(),air={x:0,y:0,z:0,exposure:0};
 const rest=joints.map(j=>j.bone.quaternion.clone());
 const filtered=joints.map(()=>new THREE.Vector3()),target={x:0,y:0,z:0};
 let center:THREE.Object3D|undefined,initialized=false,accumulator=0,clock=0,load=0;
 let lastSpeed=0,brakeWake=0,preset:CabinWindInput['preset']='baseline';
 // Character presentation at fixed 60 Hz, independent of the car's 120 Hz ticks.
 // Updating the same small skin twice per display frame wastes mobile CPU.
 const h=1/60;
 function init(){
  center=root;while(center.parent&&center.name!=='coastal-roadster')center=center.parent;
  root.updateWorldMatrix(true,true);joints.forEach(j=>j.center=center!);
  manager.setInitState();manager.reset();initialized=true;
 }
 function reset(){accumulator=clock=load=lastSpeed=brakeWake=0;filtered.forEach(f=>f.set(0,0,0));if(initialized){root.updateWorldMatrix(true,true);manager.reset();}}
 return {root,sync(_wind,sway){load=sway;},reset,
  step(dt:number,input?:CabinWindInput){
   if(!Number.isFinite(dt)||dt<=0)return;
   if(!initialized)init();
   if(dt>.1){reset();return;} // stream stalls / debugger: never catch up unboundedly
   accumulator+=dt;
   if(accumulator+1e-9<h)return;
   const flow=cabinWind(input??{airX:0,airZ:0,velocityX:0,velocityZ:0,yaw:0,time:clock},air);
   preset=input?.preset??'baseline';
   const speed=input?Math.hypot(input.velocityX,input.velocityZ):0;
   root.updateWorldMatrix(true,true);center!.getWorldQuaternion(orientation);
   // At most six bounded steps after a delay, normally one.
   for(let steps=0;accumulator+1e-9>=h&&steps<6;steps++){
    accumulator-=h;clock+=h;
    brakeWake=Math.max(brakeWake*Math.exp(-h/.38),Math.min(1,Math.max(0,(lastSpeed-speed)/(h*38))));lastSpeed=speed;
    const gust=Math.min(1,Math.hypot(flow.x,flow.z)/24);
    for(let i=0;i<joints.length;i++){
     const j=joints[i];
     const chain=Math.floor(i/depthCount),depth=i%depthCount,phase=clock*(6.7+chain*.29)-chain*.83-depth*.62;
     force.set(flow.x*.030+load*(.26+.05*depth)+gust*.065*Math.sin(phase),
      flow.y*.024+gust*.025*Math.sin(phase*.79),flow.z*.028*(.78+.12*depth)+gust*.055*Math.cos(phase*.91));
     if(preset==='baseline')force.clampLength(0,1.3);
     else{
      // Sample the SAME wild field at each lock's exposure/phase. R6f's four
      // joints use mid/mid/tip/tip bands, rather than freezing upper sections.
      experimentalHairWind(preset,flow,speed,clock,slots[chain],expanded?(depth<2?1:2):depth,load,brakeWake,target);
      const lag=.018+chain*.007+depth*.016,blend=1-Math.exp(-h/lag),f=filtered[i];
      f.x+=(target.x-f.x)*blend;f.y+=(target.y-f.y)*blend;f.z+=(target.z-f.z)*blend;
      force.copy(f).clampLength(0,depth===0?(expanded?1.4:.85):preset==='wild'?3.2:2.1);
     }
     // Same cabin field, explicit layer exposure: stable broad forms carry the
     // silhouette, short exterior feathers carry most of the flutter.
     if(layered)force.multiplyScalar((chain<8?[.18,.45,.72]:[.46,.86,1.05])[depth]);
     force.applyQuaternion(orientation);
     j.settings.gravityPower=force.length();j.settings.gravityDir.copy(force).normalize();
    }
    manager.update(h);
   }
  },inspect:()=>({kind:'spring',preset,chains:chainCount,depth:depthCount,joints:joints.length,air:{...air},brakeWake,angles:joints.map((j,i)=>j.bone.quaternion.angleTo(rest[i]))})};
}
