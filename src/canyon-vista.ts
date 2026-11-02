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
 const track=createPilotTrack(stage),sample=track.sample;
 let best:undefined|CanyonVista,bestScore=-Infinity;
 for(let center=scene.start+300;center<=scene.end-350;center+=35){
  for(let lead=215;lead<=365;lead+=30){
   const focus=center+lead;
   if(focus>scene.end-125)continue;
   let riverHits=0,rimHits=0,score=0;
   const frustum=canyonVistaProjection(stage,scene,center,focus,1705/863,sample);
   for(const delta of [-70,0,70]){
    const from=center+delta;
    const p=delta===0?frustum:canyonVistaProjection(stage,scene,from,focus,1705/863,sample);
    if(p.riverVisible)riverHits++;
    if(p.rimVisible)rimHits++;
    score+=p.riverVisible?60:0;
    score+=p.rimVisible?23:0;
    if(p.riverVisible)score+=Math.max(0,1-Math.abs(p.riverX+.25)) * 5;
    if(p.rimVisible)score+=Math.max(0,1-Math.abs(p.rimX+.25)) * 3;
   }
   // A curved approach naturally sweeps the canyon into view; the river
   // should enter before the viewer reaches the bend's exit.
   score+=Math.min(7,Math.abs(pilotSample(stage,center).demand)*7);
   if(score<=bestScore)continue;
   bestScore=score;
   best=Object.freeze({approachDistance:Math.round(center-175),
    revealDistance:Math.round(center),focusDistance:Math.round(focus),
    riverInFrameSamples:riverHits,rimInFrameSamples:rimHits,
    riverScreenX:frustum.riverX,riverScreenY:frustum.riverY,
    rimScreenX:frustum.rimX,rimScreenY:frustum.rimY,
    // Only after this check may QA claim the forward view actually frames it.
    sightlineConfirmed:riverHits>=2&&rimHits>=2,
   });
  }
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
