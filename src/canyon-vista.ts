import * as THREE from 'three';
import {chaseComposition,chaseTargets} from './chase';
import {createPilotTrack,pilotSample,type PilotCandidate} from './pilot-composer';
import {roadOffset,shoulderProfile} from './road-profile';
import {canyonGroundY,type CanyonVista,type GrandCanyonScene} from './grand-canyon-scene';

const round=(n:number)=>Math.round(n*1000)/1000;
export interface CanyonVistaProjection {readonly riverX:number;readonly riverY:number;readonly rimX:number;readonly rimY:number;readonly riverVisible:boolean;readonly rimVisible:boolean}
const valid=(p:THREE.Vector3)=>Number.isFinite(p.x+p.y+p.z)&&p.z>-1&&p.z<1;
/** The same fixed chase composition used in actual play. This tests the
 * player's forward framing, NOT a free-look QA camera or invented camera tilt.
 * The camera-frustum test does not claim depth-tested terrain visibility. */
export function canyonVistaProjection(
 stage:PilotCandidate,scene:GrandCanyonScene,
 from:number,targetDistance:number,aspect=1705/863,
 sample=createPilotTrack(stage).sample,
):CanyonVistaProjection{
 const here=sample(from),there=sample(targetDistance);
 const camera=new THREE.PerspectiveCamera(chaseComposition(aspect).fov,aspect,1,2200);
 const grade=here.tangent.y/Math.hypot(here.tangent.x,here.tangent.z);
 const view=chaseTargets(here.position,here.roadHeading,aspect,grade);
 camera.position.copy(view.eye);camera.lookAt(view.look);camera.updateMatrixWorld(true);
 const half=pilotSample(stage,targetDistance).halfWidth;
 const shoulders=shoulderProfile(targetDistance,(stage as PilotCandidate&{seed:number}).seed);
 const at=(raw:number,y:number)=>{
  const v=there.position.clone().addScaledVector(there.right,roadOffset(raw,half,shoulders));
  v.y=y;return v.project(camera);
 };
 const river=at(-112,scene.riverY+1.5);
 // Aim at a recognisable near-far escarpment, not at a featureless skyline.
 const rimY=canyonGroundY(scene,targetDistance,-170,there.position.y,there.position.y-8)+13;
 const rim=at(-170,rimY);
 const inFrame=(p:THREE.Vector3)=>valid(p)&&p.x>-.82&&p.x<.72&&p.y>-.86&&p.y<.78;
 return Object.freeze({riverX:round(river.x),riverY:round(river.y),
  rimX:round(rim.x),rimY:round(rim.y),riverVisible:inFrame(river),
  rimVisible:inFrame(rim)});
}
/** Runs once at seed planning. Scores three travel positions against one
 * fixed river / canyon-rim vista so the showcase survives motion. */
export function planCanyonVista(stage:PilotCandidate,scene:GrandCanyonScene):CanyonVista{
 const track=createPilotTrack(stage),cached=new Map<number,ReturnType<typeof track.sample>>();
 const sample=(d:number)=>{
  const key=Math.round(d*1000);
  const found=cached.get(key);if(found)return found;
  const frame=track.sample(d);cached.set(key,frame);return frame;
 };
 const rough:{center:number;focus:number;score:number}[]=[];
 // Pass 1: only ~20 frustum probes per seed, not hundreds.
 for(let center=scene.start+290;center<=scene.end-345;center+=75){
  for(const lead of [240,320,385]){
   const focus=center+lead;
   if(focus>scene.end-105)continue;
   const p=canyonVistaProjection(stage,scene,center,focus,1705/863,sample);
   const score=(p.riverVisible?100:0)+(p.rimVisible?36:0)
    -(Math.abs(p.riverX+.22)+Math.abs(p.rimX+.22))*4
    +Math.min(5,Math.abs(pilotSample(stage,center).demand)*5);
   rough.push({center,focus,score});
  }
 }
 rough.sort((a,b)=>b.score-a.score||a.center-b.center);
 let best:undefined|CanyonVista,bestScore=-Infinity;
 // Pass 2: validate a fixed world-space focal point from three
 // successive natural driving positions. A limited finalist set keeps
 // start-up fast, while a genuine reveal must survive forward motion.
 for(const candidate of rough.slice(0,5)){
  let riverHits=0,rimHits=0,score=candidate.score;
  const frustum=canyonVistaProjection(stage,scene,candidate.center,candidate.focus,1705/863,sample);
  for(const delta of [-80,0,80]){
   const p=delta===0?frustum:canyonVistaProjection(
    stage,scene,candidate.center+delta,candidate.focus,1705/863,sample);
   if(p.riverVisible)riverHits++;
   if(p.rimVisible)rimHits++;
  }
  score+=riverHits*38+rimHits*21;
  if(score<=bestScore)continue;
  bestScore=score;
  best=Object.freeze({approachDistance:Math.round(candidate.center-170),
   revealDistance:Math.round(candidate.center),focusDistance:Math.round(candidate.focus),
   riverInFrameSamples:riverHits,rimInFrameSamples:rimHits,
   riverScreenX:frustum.riverX,riverScreenY:frustum.riverY,
   rimScreenX:frustum.rimX,rimScreenY:frustum.rimY,
   sightlineConfirmed:riverHits>=2&&rimHits>=2,
  });
 }
 if(!best)throw new Error('No safe canyon vista candidates for '+scene.seed);
 return best;
}
/** An intentionally empty left-foreground window during the reveal.
 * Remove random trees and isolated towers in this span; terrain and safety
 * rails remain, so we do not create invisible collision walls. */
export function canyonVistaClearance(scene:GrandCanyonScene,d:number,raw:number){
 const vista=scene.vista;
 return !!vista&&raw< -16&&d>=vista.revealDistance-110&&
  d<=vista.focusDistance+55;
}
