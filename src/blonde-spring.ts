import * as THREE from 'three';
import {VRMSpringBoneManager,VRMSpringBoneJoint,VRMSpringBoneCollider,VRMSpringBoneColliderShapeSphere} from '@pixiv/three-vrm-springbone';
import type {WindGroom} from './hero-groom';
import {cabinWind,experimentalHairWind,type CabinWindInput} from './cabin-wind';

/** Six short authored chains; GPU skinning, no CPU vertex writes or full VRM. */
export function springBlonde(root:THREE.Group):WindGroom{
 const manager=new VRMSpringBoneManager(),joints:VRMSpringBoneJoint[]=[];
 const neck=new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeSphere({radius:.052,offset:new THREE.Vector3(0,-.12,.012)}));
 root.add(neck);
 for(let chain=0;chain<6;chain++)for(let depth=0;depth<3;depth++){
  const bone=root.getObjectByName(`lock-${chain}-${depth}`)!,child=root.getObjectByName(`lock-${chain}-${depth+1}`)!;
  const joint=new VRMSpringBoneJoint(bone,child,{
   stiffness:[4.2,2.3,1.35][depth]*(.96+.015*chain),dragForce:[.40,.29,.24][depth],
   gravityPower:0,gravityDir:new THREE.Vector3(),hitRadius:.003,
  },[{colliders:[neck]}]);manager.addJoint(joint);joints.push(joint);
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
     const chain=Math.floor(i/3),depth=i%3,phase=clock*(6.7+chain*.29)-chain*.83-depth*.62;
     force.set(flow.x*.030+load*(.26+.05*depth)+gust*.065*Math.sin(phase),
      flow.y*.024+gust*.025*Math.sin(phase*.79),flow.z*.028*(.78+.12*depth)+gust*.055*Math.cos(phase*.91));
     if(preset==='baseline')force.clampLength(0,1.3);
     else{
      experimentalHairWind(preset,flow,speed,clock,chain,depth,load,brakeWake,target);
      const lag=.018+chain*.007+depth*.016,blend=1-Math.exp(-h/lag),f=filtered[i];
      f.x+=(target.x-f.x)*blend;f.y+=(target.y-f.y)*blend;f.z+=(target.z-f.z)*blend;
      force.copy(f).clampLength(0,depth===0?.85:preset==='wild'?3.2:2.1);
     }
     force.applyQuaternion(orientation);
     j.settings.gravityPower=force.length();j.settings.gravityDir.copy(force).normalize();
    }
    manager.update(h);
   }
  },inspect:()=>({kind:'spring',preset,joints:joints.length,air:{...air},brakeWake,angles:joints.map((j,i)=>j.bone.quaternion.angleTo(rest[i]))})};
}
