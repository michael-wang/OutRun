import * as THREE from 'three';
import type {createTrack} from './track';
import {chaseComposition,chaseTargets} from './chase';
import {CANYON_ARCH} from './scenery';

type Sample=ReturnType<typeof createTrack>['sample'];
/** QA only: the arch must be in the *actual chase camera*, not just "140m ahead".
 * A ridge or hairpin can hide a fixed-distance landmark even when its model exists. */
export function canyonArchProjection(sample:Sample,at:number,from:number,aspect=1705/863){
 const here=sample(from),there=sample(at);
 const camera=new THREE.PerspectiveCamera(chaseComposition(aspect).fov,aspect,1,2200);
 const grade=here.tangent.y/Math.hypot(here.tangent.x,here.tangent.z);
 const view=chaseTargets(here.position,here.roadHeading,aspect,grade);
 camera.position.copy(view.eye);camera.lookAt(view.look);camera.updateMatrixWorld(true);
 const target=there.position.clone().addScaledVector(there.right,CANYON_ARCH.offset);
 target.y=there.position.y+CANYON_ARCH.springHeight+CANYON_ARCH.rise*.35;
 return target.project(camera);
}

export function canyonArchInspectionDistance(sample:Sample,site:number,aspect=1705/863){
 let chosen=Math.max(350,site-210),best=-Infinity;
 // A few route samples once at QA setup, never in the driving/render loop.
 // New R1 switchbacks can hide landmarks behind an earlier bend. Search a
 // wider, still strictly forward-only observation window at QA setup time.
 for(let ahead=80;ahead<=720;ahead+=10){
  const from=Math.max(350,site-ahead);
  if(from>=site-40)continue;
  const p=canyonArchProjection(sample,site,from,aspect);
  if(!Number.isFinite(p.x+p.y+p.z)||p.z>=1||p.z<=-1)continue;
  const x=Math.abs(p.x),y=Math.abs(p.y);
  const within=x<.86&&y<.86;
  const overflow=Math.max(0,x-.86)+Math.max(0,y-.86);
  const score=(within?100:0)-overflow*125-x*7-y*5-Math.abs(ahead-210)*.035;
  if(score>best){best=score;chosen=from;}
 }
 return chosen;
}
