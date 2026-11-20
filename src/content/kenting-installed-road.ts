import * as THREE from 'three';
import type {createTrack} from '../track';
import {KENTING_INSTALLATION} from '../kenting-installation';
import {roadJoin} from './beach2-track';

type Track = ReturnType<typeof createTrack>;
type Sample = Track['sample'];
type Pose = ReturnType<Sample>;

const smooth = (t:number) => t*t*t*(10+t*(-15+6*t));

/** Continue the actual end frame through the join. The small station window
 * measures the local station-to-world scale and vertical curvature; heading,
 * plan curvature, grade and bank themselves come directly from the road. */
function portExtension(sample:Sample, station:number, side:-1|1) {
  const anchor=sample(station).position;
  const p=sample(station+side*.0001);
  const before=sample(station-1), after=sample(station+1);
  const grade=(pose:Pose) => pose.tangent.y/Math.hypot(pose.tangent.x,pose.tangent.z);
  const planLength=(a:Pose,b:Pose)=>Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z);
  const v0=planLength(before,p), v1=planLength(p,after), speed=(v0+v1)/2;
  const h=p.roadHeading, forward=new THREE.Vector3(-Math.sin(h),grade(p),Math.cos(h));
  const velocity=forward.clone().multiplyScalar(speed);
  const acceleration=forward.clone().multiplyScalar(v1-v0);
  acceleration.x-=Math.cos(h)*p.curvature*speed*speed;
  acceleration.z-=Math.sin(h)*p.curvature*speed*speed;
  acceleration.y+=(grade(after)-grade(before))*speed/2;
  return {
    position(d:number) {
      const offset=d-station;
      return anchor.clone().addScaledVector(velocity,offset).addScaledVector(acceleration,.5*offset*offset);
    },
    bank:p.right.y,bankRate:(after.right.y-before.right.y)/2
  };
}

function makeJoin(first:Sample,last:Sample,a:number,b:number) {
  const entry=portExtension(first,a,-1),exit=portExtension(last,b,1);
  const curve=roadJoin(entry.position,exit.position,a,b);
  // The shore cross-section reads right.y as a slope. Relax the inherited
  // bank over each approach while preserving first derivatives at both ports.
  const shoulder=Math.min((b-a)/2,100);
  function bankAt(d:number) {
    const inDist=d-a,outDist=b-d;
    if (inDist<shoulder) return (entry.bank+inDist*entry.bankRate)*(1-smooth(inDist/shoulder));
    if (outDist<shoulder) return (exit.bank-outDist*exit.bankRate)*(1-smooth(outDist/shoulder));
    return 0;
  }
  return (d:number,old:Pose):Pose => {
    const position=curve(d);
    const before=curve(d-.1), after=curve(d+.1);
    const velocity=after.clone().sub(before).multiplyScalar(5);
    const acceleration=after.add(before).addScaledVector(position,-2).multiplyScalar(100);
    const horizontal=Math.hypot(velocity.x,velocity.z);
    const roadHeading=Math.atan2(-velocity.x,velocity.z);
    const curvature=(velocity.x*acceleration.z-velocity.z*acceleration.x)/horizontal**3;
    return {...old,position,roadHeading,curvature,tangent:velocity.normalize(),
      right:new THREE.Vector3(-Math.cos(roadHeading),bankAt(d),-Math.sin(roadHeading))};
  };
}

/** A single placed road, never a second road mesh or simulation. Only the
 * protected section receives the rigid transform; the two joins are sampled
 * by the same consumer as the tutorial and the untouched rest of the stage. */
export function installKentingRoad(reference:Track, installation=KENTING_INSTALLATION):Track {
  const {relocated,delta,tutorialExit,roadEntry,roadExit,connectedAt}=installation;
  if (!relocated) return reference;
  const anchor=reference.sample(tutorialExit);
  const bearing=anchor.roadHeading+installation.offsetHeadingDeg*Math.PI/180;
  const translation=new THREE.Vector3(-Math.sin(bearing),0,Math.cos(bearing)).multiplyScalar(delta);
  const installed:Sample=d=>{
    const p=reference.sample(d-delta);
    p.position.add(translation);
    return p;
  };
  const enter=makeJoin(reference.sample,installed,tutorialExit,roadEntry);
  const depart=makeJoin(installed,reference.sample,roadExit,connectedAt);
  return {...reference,sample(d:number){
    if (d<=tutorialExit||d>=connectedAt) return reference.sample(d);
    if (d>=roadEntry&&d<=roadExit) return installed(d);
    const source=reference.sample(d);
    return d<roadEntry?enter(d,source):depart(d,source);
  }};
}
