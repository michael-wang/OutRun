import * as THREE from 'three';
export const HEROINE_ACTIONS=['shoutRight','kissRight','shoutLeft','kissLeft','victory'] as const;
export type HeroineAction=typeof HEROINE_ACTIONS[number];
export type HeroineClip=HeroineAction|'wave'|'applause';
/** Plays the single character's Blender-authored clips; no independent physics. */
export function createHeroinePerformance(root:THREE.Group,clips:THREE.AnimationClip[],meshes:THREE.SkinnedMesh[]){
 const mixer=new THREE.AnimationMixer(root),actions=new Map(clips.map(c=>[c.name,mixer.clipAction(c)]));
 const head=root.getObjectByName('head')!;
 const index=meshes[0].skeleton.bones.indexOf(head as THREE.Bone),inverseBind=meshes[0].skeleton.boneInverses[index];
 const transform=new THREE.Matrix4(),pivot=new THREE.Matrix4().makeTranslation(0,1.30,-.46);
 const parentInverse=new THREE.Matrix4(),q=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),rootQ=new THREE.Quaternion(),inverseQ=new THREE.Quaternion();
 const animatedHead=head.quaternion.clone();
 function evaluate(dt:number){head.quaternion.copy(animatedHead);mixer.update(dt);animatedHead.copy(head.quaternion);}
 let name:HeroineClip|undefined,elapsed=0,active:THREE.AnimationAction|undefined;
 function reset(){head.quaternion.copy(animatedHead);mixer.stopAllAction();animatedHead.copy(head.quaternion);name=undefined;elapsed=0;active=actions.get('wave')!;active.reset().play();active.paused=true;active.time=0;evaluate(0);}
 function start(action:HeroineClip){if(name&&action!=='victory')return false;const next=actions.get(action);if(!next)return false;head.quaternion.copy(animatedHead);mixer.stopAllAction();animatedHead.copy(head.quaternion);active=next.reset().setLoop(THREE.LoopOnce,1);active.clampWhenFinished=true;active.play();name=action;elapsed=0;evaluate(0);return true;}
 reset();
 return {start,reset,get active(){return name;},
  advance(dt:number){if(!Number.isFinite(dt)||dt<=0)return;if(dt>.25){reset();return;}evaluate(dt);if(name){elapsed+=dt;if(elapsed>=active!.getClip().duration)reset();}},
  preview(action:HeroineClip,time:number){reset();start(action);active!.paused=true;active!.time=Math.max(0,Math.min(time,active!.getClip().duration));evaluate(0);},
  syncHead(presentation:THREE.Group,offset:THREE.Euler){
   // Re-evaluate held tracks before adding the existing small steering/look pose.
   evaluate(0);root.updateWorldMatrix(true,true);
   root.getWorldQuaternion(rootQ);head.parent!.getWorldQuaternion(parentQ);
   q.setFromEuler(offset).premultiply(rootQ).multiply(inverseQ.copy(rootQ).invert());
   q.premultiply(inverseQ.copy(parentQ).invert()).multiply(parentQ);head.quaternion.premultiply(q);
   root.updateWorldMatrix(true,true);presentation.parent!.updateWorldMatrix(true,false);
   parentInverse.copy(presentation.parent!.matrixWorld).invert();
   transform.copy(parentInverse).multiply(head.matrixWorld).multiply(inverseBind).multiply(pivot);
   transform.decompose(presentation.position,presentation.quaternion,presentation.scale);
  },
  dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);},
 };
}
