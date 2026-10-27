import * as THREE from 'three';
import { createWorld } from './world';
import { createState, step, updateFootprint, angleDifference, type InputState } from './handling';
import { InputController, readSwapped, saveSwapped } from './input';
import { EngineSound } from './sound';
import {GamepadInput} from './gamepad';
import {RecentDrivingHistory} from './recent-history';
import {advancePowertrain} from './powertrain';
import { Immersive } from './immersive';
import { CHASE, chaseTargets, chaseComposition } from './chase';
import { SpeedAudit } from './speed-audit';
import { DEFAULT_PACE,selectedPace,effectivePace } from './pace';
import {speedometerMarkup,needleAngle} from './speedometer';
import {COURSE,challengeAt,requiredSteering} from './challenges';
import {ACTS,actWeights} from './acts';
import {quantizeSteering} from './steering';
import './style.css';
import {BRICKS,BRICK_START,createBrickTrack,brickCourse,brickWidth} from './bricks';
import {mountBrickLab} from './brick-lab';
import {L2_CANDIDATES,createL2Track,l2Course,l2Sample} from './l2-catalog';
import {mountL2Lab} from './l2-lab';
import {PILOTS,createPilotTrack,pilotCourse,pilotSample,pilotWeights} from './pilot-composer';
import {generateStage} from './stage-one';
import type {FeedbackAnchor} from './l2-feedback';
const labMode=new URLSearchParams(location.search).get('lab')==='bricks';
const l2=new URLSearchParams(location.search).get('lab')==='l2'?(L2_CANDIDATES.find(b=>b.id===new URLSearchParams(location.search).get('l2'))??L2_CANDIDATES[0]):undefined;
const params=new URLSearchParams(location.search);
const stage=params.get('stage')==='1'?generateStage(Number(params.get('seed'))||1):undefined;
const pilot=stage??(params.get('lab')==='pilots'?(PILOTS.find(b=>b.id===params.get('pilot'))??PILOTS[0]):undefined);
const brick=pilot??l2??(labMode?(BRICKS.find(b=>b.id===new URLSearchParams(location.search).get('brick'))??BRICKS[0]):undefined);
function momentFingerprint(value:unknown){let h=2166136261;for(const c of JSON.stringify(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const momentCandidate={...L2_CANDIDATES[0],...(brick??{}),id:brick?.id??'FREE-DRIVE',seed:brick?.seed??0,contentFingerprint:brick?momentFingerprint({brick,handling:'v0.7D.1'}):'00000000',generatorVersion:brick?'brick-moments-v0.7D.2':'free-drive-v0.7D.2'};
let labUI:ReturnType<typeof mountBrickLab>|undefined,l2UI:ReturnType<typeof mountL2Lab>|undefined,brickCompleted=false;

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<header><span class="wordmark">FIRST DRIVE <small>ARCADE VELOCITY / 03</small></span><nav><button id="pause" aria-label="Pause / Menu">Ⅱ Menu</button></nav></header>
<div id="immersive-note" role="status" hidden></div><aside id="speed" aria-label="Speedometer">${speedometerMarkup()}</aside>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>Take the<br>coast road.</h1><p>Steer through the bends. Lift or brake to find your line.</p><button id="drive" class="primary">Play <span>↗</span></button><p class="keys">A / D steer &nbsp; Space accelerate<br>Enter brake &nbsp; P / Esc pause &nbsp; R restart</p><p><a href="/?stage=1">Stage 01: Pacific Getaway ↗</a></p><small>SCENIC JOURNEY · LOCAL PLAYTEST · v0.8</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Play / resume ↗</button><div class="menu-actions"><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button><button id="fullscreen">Fullscreen</button><button id="free-export">Export feedback</button></div></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Controls</h2><label class="setting"><input id="swap" type="checkbox"> Steering on the right</label><p>Accelerator stays above brake on either side.</p><button id="close-settings" class="primary">Done</button></section>
<div id="touch"><div id="steering-strip" class="steering" role="slider" tabindex="0" aria-label="Steering position" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><span class="steer-rail"><i class="steer-center"></i><i class="steer-cursor"></i></span></div><div class="pedals"><button data-control="gas">GAS</button><button data-control="brake">BRAKE</button></div></div>
<div id="rotate"><span>↻</span>Turn toward the horizon<small>Rotate your phone to landscape to drive.</small><button id="rotate-fullscreen">Try fullscreen</button><button id="rotate-pause">Pause / resume</button></div>`;
const $ = (id:string) => document.getElementById(id)!;
for(const [id,key] of Object.entries({drive:'P',resume:'P',restart:'R',sound:'M',settings:'C',fullscreen:'F'})){const node=$(id);node.classList.add('shortcut');node.dataset.shortcut=key;node.setAttribute('aria-keyshortcuts',key);}
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex=-1;renderer.domElement.setAttribute('aria-label','Driving surface');$('view').append(renderer.domElement);
const world=createWorld(brick?{chunked:!!stage,track:pilot?createPilotTrack(pilot):l2?createL2Track(l2):createBrickTrack(brick),theme:brick.sceneryAct,seed:brick.seed,roadWidth:brick.roadWidth,halfAt:d=>pilot?pilotSample(pilot,d).halfWidth:brickWidth(brick,d).halfWidth,weightsAt:pilot?(d=>pilotWeights(pilot,d)):undefined,narrowings:stage?stage.placements.filter(p=>p.channel==='width'&&p.parameters.to<p.parameters.from).map(p=>Math.max(BRICK_START+30,BRICK_START+p.startS-180)):brick.lanes.flatMap((k,i)=>i&&k[1]<brick.lanes[i-1][1]?[Math.max(BRICK_START+30,BRICK_START+brick.lanes[i-1][0]*brick.length/brick.nominalDuration-180)]:[]),course:pilot?pilotCourse(pilot):l2?l2Course(l2):brickCourse(brick),notice:brick.id==='BRK-03'?{distance:BRICK_START+brick.length*5/brick.nominalDuration,text:'LEFT BEND BEYOND'}:undefined}:{}); world.car.rotation.order="YXZ"; const camera=new THREE.PerspectiveCamera(CHASE.fov,innerWidth/innerHeight,.1,2200);
const input=new InputController(document,()=>mode==='playing'&&!settingsOpen); const sound=new EngineSound(); let state=createState();if(brick){state.distance=BRICK_START;state.speed=brick.entrySpeed/3.6;} advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading;
const mobile=()=>matchMedia("(pointer:coarse)").matches;
let inputMode:'keyboard'|'gamepad'|'touch'=mobile()?'touch':'keyboard';
function refreshHints(){
 document.documentElement.dataset.inputMode=inputMode;
 document.querySelectorAll<HTMLElement>('.shortcut').forEach(node=>{
  const key=node.dataset.shortcut;if(!key||node.id==='l2-praise'||node.id==='l2-issue')return;
  const first=Array.from(node.childNodes).find(n=>n.nodeType===Node.TEXT_NODE);if(!first)return;
  const raw=(first.textContent??'').replace(/\[([^\]]+)\]/g,'$1');
  if(inputMode==='keyboard'){const i=raw.toUpperCase().indexOf(key);first.textContent=i<0?`[${key}] ${raw}`:raw.slice(0,i)+`[${raw[i]}]`+raw.slice(i+1);}else first.textContent=raw;
 });
 const praise=document.getElementById('l2-praise'),issue=document.getElementById('l2-issue');
 if(praise)praise.textContent=inputMode==='gamepad'?'L1 讚':inputMode==='keyboard'?'[G]讚':'✨ 讚';
 if(issue)issue.textContent=inputMode==='gamepad'?'□ 問題':inputMode==='keyboard'?'[I]問題':'⚑ 問題';
}
function setInputMode(next:typeof inputMode){if(inputMode!==next){inputMode=next;refreshHints();}}
addEventListener('keydown',e=>{if(!e.isComposing)setInputMode('keyboard');},true);
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setInputMode('touch');else if(e.pointerType==='mouse')setInputMode('keyboard');},true);
let mode:'menu'|'playing'|'paused'='menu'; let settingsOpen=false; let muted=false; let manual=false;
let testControls:InputState|undefined;let hardDetents=false;let lastControls:InputState={gas:false,brake:false,steer:0};let usedExternalControls=false;
const highSpeedPace=import.meta.env.DEV?selectedPace(new URLSearchParams(location.search).get('pace')):DEFAULT_PACE;
let cameraHeading=0; let initialized=false; let elapsed=0; let frames=0;
const history=new RecentDrivingHistory();
let inspectionView:'front'|'side'|'cockpit'|undefined;
const speedAudit=import.meta.env.DEV?new SpeedAudit():undefined;
const immersive=new Immersive($('app'),()=>{
  $('fullscreen').textContent=immersive.active?'Exit fullscreen':immersive.installed?'PWA fullscreen':'Fullscreen';
  $('immersive-note').textContent=immersive.message;
  $('immersive-note').hidden=!immersive.message;
});
let swapped=readSwapped();
function applyLayout(){ $('touch').classList.toggle('swapped',swapped); ($('swap') as HTMLInputElement).checked=swapped; }
applyLayout();
function ui(){ labUI?.update(mode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(mode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);$('menu').hidden=!!brick||mode!=='menu'||settingsOpen; $('paused').hidden=!!brick||mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',mode==='playing'&&!settingsOpen); $('pause').textContent=mode==='playing'?'Ⅱ Menu':'☰ Menu'; }
function start(){state.appliedSteer=state.steerFrom=state.steerTo=state.steerTime=0;void sound.unlock().catch(()=>{}); mode='playing'; settingsOpen=false; input.clear();ui();renderer.domElement.focus({preventScroll:true});}
function pause(){if(l2UI?.feedbackOpen)return;if(mode==='paused'){start();return;}mode='paused';input.clear();sound.pause();ui();if(!mobile())(document.getElementById(brick?(l2||pilot?'l2-play':'brick-play'):'resume') as HTMLElement|null)?.focus();}
function restart(){history.clear();usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};l2UI?.reset();world.car.userData.motion.reset();state=createState();if(brick){state.distance=BRICK_START;state.speed=brick.entrySpeed/3.6;testControls=undefined;brickCompleted=false;}advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading; elapsed=0; initialized=false; start();}
$('drive').onclick=()=>{if(mobile())void immersive.enter();start();};
$('resume').onclick=start; $('pause').onclick=pause; $('restart').onclick=restart;
$('fullscreen').onclick=()=>{input.clear();void immersive.toggle();};
$('rotate-fullscreen').onclick=()=>{input.clear();void immersive.enter();};
$('rotate-pause').onclick=()=>{if(mode==='menu')start();else pause();};
$('sound').onclick=()=>{muted=!muted;void sound.unlock().catch(()=>{});sound.setMuted(muted);$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));};
$('settings').onclick=()=>{if(mode==='playing')mode='paused';settingsOpen=true;input.clear();sound.pause();ui();if(!mobile())$('close-settings').focus();};
$('close-settings').onclick=()=>{settingsOpen=false;ui();if(!mobile())document.getElementById(pilot||l2?'l2-settings':brick?'brick-settings':'settings')?.focus();};
$('swap').onchange=()=>{swapped=($('swap') as HTMLInputElement).checked;saveSwapped(swapped);applyLayout();};
addEventListener('keydown',e=>{
  if(e.isComposing||e.repeat||l2UI?.feedbackOpen)return;
  if(settingsOpen&&e.code==='Escape'){e.preventDefault();$('close-settings').click();return;}
  if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(e.code==='Escape'){e.preventDefault();if(settingsOpen){$('close-settings').click();return;}pause();return;}
  if(settingsOpen)return;
  if((mode==='playing'||brickCompleted)&&l2UI&&(e.code==='KeyG'||e.code==='KeyI')){e.preventDefault();l2UI.openQuick(e.code==='KeyG'?'praise':'issue','keyboard');return;}
  if(mode==='playing'){if(e.code==='KeyP'){e.preventDefault();pause();}else if(e.code==='KeyR'){e.preventDefault();restart();}return;}
  const prefix=pilot||l2?'l2':brick?'brick':'';
  const action:Record<string,string>={KeyP:prefix?`${prefix}-play`:mode==='menu'?'drive':'resume',KeyR:prefix?`${prefix}-replay`:'restart',KeyN:`${prefix}-next`,KeyB:`${prefix}-prev`,KeyC:prefix?`${prefix}-settings`:'settings',KeyM:prefix?`${prefix}-sound`:'sound',KeyF:prefix?`${prefix}-fullscreen`:'fullscreen',KeyE:`${prefix}-export`};
  const vote:Record<string,string>={KeyK:'KEEP',KeyW:'REWORK',KeyX:'REJECT'};
  const button=vote[e.code]?document.querySelector<HTMLButtonElement>(prefix==='l2'?`[data-l2-vote="${vote[e.code]}"]`:`[data-vote="${vote[e.code]}"]`):document.getElementById(action[e.code]);
  if(button&&button.offsetParent!==null){e.preventDefault();button.click();return;}
  if(prefix==='l2'&&/^Digit[1-5]$/.test(e.code)){const difficulty=$('l2-difficulty') as HTMLSelectElement;difficulty.value=e.code.slice(-1);difficulty.dispatchEvent(new Event('change',{bubbles:true}));e.preventDefault();}
});
addEventListener('blur',()=>{input.clear();if(mode==='playing'){mode='paused';sound.pause();ui();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'){mode='paused';input.clear();sound.pause();ui();}});
function resize(){
  const width=$('app').clientWidth, height=$('app').clientHeight;
  camera.aspect=width/height;camera.fov=chaseComposition(camera.aspect).fov;camera.updateProjectionMatrix();renderer.setSize(width,height);
  input.clear();
  if(mobile()&&height>width&&mode==='playing'){mode='paused';sound.pause();ui();}
}
addEventListener('resize',resize);addEventListener('orientationchange',resize);
visualViewport?.addEventListener('resize',resize);
document.addEventListener('fullscreenchange',()=>{input.clear();resize();if(!document.fullscreenElement&&mode==='playing'){mode='paused';sound.pause();ui();}});
function advance(dt:number,override?:InputState){
  input.update(dt);
  if(mode==='playing'&&!settingsOpen){const beforeDistance=state.distance;const external=override??(import.meta.env.DEV?testControls:undefined),controls=external??{...input.snapshot(),rawSteer:input.steeringTarget};lastControls={...controls};usedExternalControls=!!external;if(import.meta.env.DEV&&hardDetents){const q=quantizeSteering(controls.steer,state.effectiveSteer);state.appliedSteer=q;state.steerFrom=q;state.steerTo=q;state.steerTime=1;}const road=world.sample(state.distance);step(state,controls,dt,road.curvature,highSpeedPace,world.halfAt,road.tangent.y/Math.hypot(road.tangent.x,road.tangent.z));world.car.userData.motion.advance(state.distance-beforeDistance,state.appliedSteer,dt);elapsed+=dt;if(l2UI&&history.due(elapsed))history.record(feedbackAnchor());sound.update(state.speed,state.slip,controls.gas&&!controls.brake,dt,state);if(brick&&state.distance>=BRICK_START+brick.length){if(l2UI){const finish=feedbackAnchor();history.record(finish,true);l2UI.complete(finish);}brickCompleted=true;mode='paused';input.clear();testControls=undefined;sound.pause();ui();if(!mobile())(document.getElementById(l2||pilot?'l2-play':'brick-play') as HTMLElement|null)?.focus();}}else sound.pause();
}
function groundHeight(height:number,lateral:number){
  if(brick)return height+(Math.abs(lateral)>world.halfAt(state.distance)?-.1:0);
  if(lateral < -13)return THREE.MathUtils.lerp(height-.1,-5.05,Math.min(1,(-lateral-13)/14));
  if(lateral>13)return height-.12-Math.min(1,(lateral-13)/62)*2.88;
  return height+(Math.abs(lateral)>world.half?-.1:0);
}
function render(dt:number,draw=true){
  const p=world.sample(state.distance);
  world.car.position.copy(p.position).addScaledVector(p.right,state.lateral);
  world.car.position.y=groundHeight(p.position.y,state.lateral)+.04;
  world.car.rotation.set(-Math.atan2(p.tangent.y*Math.cos(state.heading),Math.hypot(p.tangent.x,p.tangent.z)),-p.roadHeading-state.heading,THREE.MathUtils.clamp(-state.slipAngle*.12,-.055,.055));
  const travelHeading=p.roadHeading;
  if(!initialized){cameraHeading=travelHeading;initialized=true;}
  else cameraHeading+=angleDifference(travelHeading-cameraHeading)*(1-Math.exp(-dt*7));
  // Anchor translation to the car. World-position lerp would add v/tau trailing
  // distance and recreate a speed-dependent dolly despite a constant target offset.
  const targets=chaseTargets(world.car.position,cameraHeading,camera.aspect,p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z));
  camera.position.copy(targets.eye);camera.lookAt(targets.look);
  if(import.meta.env.DEV&&inspectionView){
    world.car.updateMatrixWorld(true);
    const offset=inspectionView==='front'?new THREE.Vector3(3,2.7,6):inspectionView==='side'?new THREE.Vector3(6,2.8,0):new THREE.Vector3(0,5.8,-2.3);
    camera.position.copy(world.car.localToWorld(offset));camera.lookAt(world.car.localToWorld(new THREE.Vector3(0,.8,0)));
  }
  world.update(elapsed,state.speed,state.slip,state.distance);if(!draw)return;labUI?.update(mode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(mode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);refreshHints();world.car.userData.motion.render();renderer.render(world.scene,camera);frames++;
  $('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');
  $('speed-needle').setAttribute('transform',`rotate(${needleAngle(state.speed*3.6)} 100 100)`);$('gear').textContent=`G${state.gear}`;
  $('status').textContent=state.offRoad?'OFF ROAD · STEER BACK':state.slip>.2?'CORNERING · HOLD YOUR LINE':mode==='playing'?'STEER YOUR OWN LINE':'READY FOR THE COAST';
}
const pad=new GamepadInput(input,action=>{
 if(l2UI?.feedbackOpen){l2UI.control(action);return;}
 if(action==='issue'){if(mode==='playing'||brickCompleted){l2UI?.openQuick('issue','gamepad');l2UI?.control('issue');}return;}
 if(action==='praise'){if(mode==='playing'||brickCompleted)l2UI?.openQuick('praise','gamepad');return;}
 if(action==='pause'){if(!settingsOpen&&!l2UI?.feedbackOpen)pause();return;}
 if(action==='back'){if(l2UI?.feedbackOpen)document.getElementById('l2-feedback-cancel')?.click();else if(settingsOpen)$('close-settings').click();else if(mode==='playing')pause();return;}
 if(mode==='playing')return;
 const scope=(l2UI?.feedbackOpen?document.getElementById('l2-feedback-dialog'):settingsOpen?$('preferences'):document.getElementById(pilot||l2?'l2-lab':brick?'brick-lab':mode==='menu'?'menu':'paused'));
 if(!scope)return;
 const items=Array.from(scope.querySelectorAll<HTMLElement>('button,a,input,select')).filter(x=>x.offsetParent!==null&&!x.hasAttribute('disabled'));
 if(action==='confirm'){const active=document.activeElement as HTMLElement;if(items.includes(active))active.click();else items[0]?.focus();return;}
 const index=items.indexOf(document.activeElement as HTMLElement),delta=action==='up'?-1:1;items[(index<0?0:(index+delta+items.length)%items.length)]?.focus();
},()=>setInputMode('gamepad'),()=>{if(inputMode==='gamepad')setInputMode(mobile()?'touch':'keyboard');});
let last=performance.now();
function loop(now:number){
  pad.poll(mode==='playing'&&!settingsOpen,!!l2UI?.feedbackOpen,brickCompleted&&!settingsOpen);
  const dt=Math.min((now-last)/1000,.25);last=now;
  // Integrate elapsed time in bounded physics steps; slow rendering must not
  // turn a 65m/s drive into slow motion by discarding every frame above 50ms.
  if(!manual)for(let remaining=dt;remaining>1e-8;){const tick=Math.min(remaining,1/120);advance(tick);remaining-=tick;}
  render(dt);
  if(!manual&&mode==='playing'&&!settingsOpen)speedAudit?.record({wall:now,simulated:elapsed,progress:state.distance,speed:state.speed,position:world.car.position.toArray(),camera:camera.position.toArray(),trackLength:world.length,heading:state.worldHeading,lateral:state.lateral,pace:effectivePace(state.speed,highSpeedPace)});
  else speedAudit?.reset();
  requestAnimationFrame(loop);
}
if(brick&&!l2&&!pilot)labUI=mountBrickLab(brick,{play:()=>{if(mobile())void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile())void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),exportMoments:()=>l2UI?.exportCurrent()});
ui();resize();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{});});
}

function feedbackAnchor():FeedbackAnchor{
 const controls=usedExternalControls?lastControls:input.snapshot(),rawSteer=usedExternalControls?(lastControls.rawSteer??lastControls.steer):input.steeringTarget;
 if(!pilot&&!l2){const p=world.sample(state.distance),weights=world.weightsAt(state.distance);return {id:momentCandidate.id,revision:momentCandidate.revision,seed:momentCandidate.seed,contentFingerprint:momentCandidate.contentFingerprint,generatorVersion:momentCandidate.generatorVersion,handlingVersion:'v0.7D.1',world:(['coast','canyon','city'] as const)[weights.indexOf(Math.max(...weights))],profiles:{course:{id:p.challenge.id,label:p.challenge.label,curvature:p.curvature}},s:brick?state.distance-BRICK_START:state.distance%world.length,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:p.position.y,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),halfWidth:world.halfAt(state.distance),laneCount:brick?brickWidth(brick,state.distance).lanes:3,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};}
 const b=(pilot??l2)!,road=pilot?pilotSample(pilot,state.distance):l2Sample(l2!,state.distance);return {id:b.id,revision:b.revision,seed:b.seed,contentFingerprint:b.contentFingerprint,generatorVersion:b.generatorVersion,handlingVersion:'v0.7D.1',...(stage?{stageCode:stage.stageCode,l2InstanceId:stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats[stage.beats.length-1].id}:{}),world:pilot?(['coast','canyon','city'] as const)[pilotWeights(pilot,state.distance).indexOf(Math.max(...pilotWeights(pilot,state.distance)))]:b.world,profiles:pilot?structuredClone({placements:pilot.placements,activePlacements:pilotSample(pilot,state.distance).active,worldPhases:pilot.worldPhases}):structuredClone(l2!.profiles),s:state.distance-BRICK_START,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:road.height,grade:road.grade,halfWidth:road.halfWidth,laneCount:road.lanes,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};
}
l2UI=mountL2Lab((pilot??l2??momentCandidate)!,{play:()=>{if(mobile())void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile())void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),capture:feedbackAnchor,history,freeze:()=>{mode='paused';input.clear();testControls=undefined;sound.pause();ui();},resume:start},!pilot&&!l2);
$('free-export').onclick=()=>l2UI?.exportCurrent();$('free-export').hidden=!!brick;
if(!mobile())requestAnimationFrame(()=>document.getElementById(pilot||l2?'l2-play':brick?'brick-play':'drive')?.focus());

if(import.meta.env.DEV){(window as any).__drive={
  carView:(view:'front'|'side'|'cockpit')=>{
    manual=true;inspectionView=view;render(1/60);
  },
  acts:()=>ACTS,
  scenery:()=>({...world.scenery,weights:world.weightsAt(state.distance),render:structuredClone(renderer.info.render),memory:structuredClone(renderer.info.memory)}),
  wheels:()=>world.car.userData.motion.inspect(),
  occupants:()=>world.car.userData.motion.occupants(),
  challenges:()=>pilot?pilotCourse(pilot):l2?l2Course(l2):brick?brickCourse(brick):COURSE,
  roadChunks:()=>{const road=world.scene.getObjectByName('driving-surface')!;return {count:road.children.length,cullable:road.children.every(o=>o.frustumCulled)};},
  brick:()=>brick??null,
  sceneFingerprint:()=>{const values:number[]=[];world.scene.getObjectByName('scenery')!.traverse(o=>{if(o instanceof THREE.InstancedMesh)values.push(...o.instanceMatrix.array);});for(const name of ['driving-surface','lane-markings']){const mesh=world.scene.getObjectByName(name)!;mesh.traverse(o=>{const geometry=(o as THREE.Mesh).geometry;if(geometry?.attributes.position)for(const n of geometry.attributes.position.array)values.push(n);});}let hash=2166136261;for(const n of values){hash^=Math.round(n*1000);hash=Math.imul(hash,16777619);}return {hash:hash>>>0,count:values.length};},
  steering:()=>({rawSteer:input.steeringTarget,effectiveSteer:input.effectiveSteer,appliedSteer:state.appliedSteer,requiredSteer:requiredSteering(world.sample(state.distance).curvature,state.speed),roadRelativeX:state.lateral,challenge:world.sample(state.distance).challenge}),
  lookahead:(seconds=2)=>{
    const p=world.sample(state.distance),travel=state.speed*effectivePace(state.speed,highSpeedPace),rows=[];
    for(let t=0;t<=seconds+.001;t+=.1){const q=world.sample(state.distance+travel*t),projected=q.position.clone().project(camera);rows.push({seconds:t,position:q.position.toArray(),screenX:projected.x,screenY:projected.y,headingChange:angleDifference(q.roadHeading-p.roadHeading)});}
    return {curvature:p.curvature,requiredSteer:requiredSteering(p.curvature,state.speed),renderedBodyYaw:state.heading,skidState:state.drifting,rows};
  },
  surfaceProbe:(distance:number,lateral=0)=>{
    world.scene.updateMatrixWorld(true);const p=world.sample(distance).position.addScaledVector(world.sample(distance).right,lateral);
    const ray=new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,200,0)),new THREE.Vector3(0,-1,0));
    const hits=ray.intersectObjects(world.scene.children.filter(o=>['driving-surface','terrain','shoulder','distant-ridge','inland-ridge','inland-ledge'].includes(o.name)),true);
    return {distance,lateral,expected:p.y,hits:hits.slice(0,5).map(h=>({name:h.object.name,y:h.point.y,error:h.point.y-p.y}))};
  },
  paintProbe:(distance:number,lateral:number)=>{world.scene.updateMatrixWorld(true);const p=world.sample(distance).position.addScaledVector(world.sample(distance).right,lateral);const ray=new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,200,0)),new THREE.Vector3(0,-1,0));return ray.intersectObject(world.scene.getObjectByName('lane-markings')!).map(h=>h.point.y-p.y);},
  visibility:()=>{world.scene.updateMatrixWorld(true);const objects=world.scene.children.filter(o=>['driving-surface','terrain','shoulder','distant-ridge','scenery'].includes(o.name));let visible=0;for(let d=10;d<=500;d+=10){const p=world.sample(state.distance+d).position.add(new THREE.Vector3(0,.15,0)),delta=p.clone().sub(camera.position),range=delta.length(),screen=p.clone().project(camera);const ray=new THREE.Raycaster(camera.position,delta.normalize(),0,range-1);if(Math.abs(screen.x)>1||Math.abs(screen.y)>1||ray.intersectObjects(objects,true).length)break;visible=d;}return visible;},
  sceneryProbe:(distance:number,lateral=0)=>{world.scene.updateMatrixWorld(true);const p=world.sample(distance).position.addScaledVector(world.sample(distance).right,lateral);const ray=new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,250,0)),new THREE.Vector3(0,-1,0));return ray.intersectObject(world.scene.getObjectByName('scenery')!,true).filter(h=>h.point.y>=p.y-.05).map(h=>({y:h.point.y,name:h.object.name}));},
  audit:()=>structuredClone(speedAudit!.rows),
  controls:(value?:InputState)=>{testControls=value;},
  hardDetents:(enabled:boolean)=>{hardDetents=enabled;},
  framing:()=>{
    world.car.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const points:THREE.Vector3[]=[];
    world.car.traverse(object=>{const mesh=object as THREE.Mesh;if(!mesh.isMesh||(mesh.material as THREE.Material).transparent)return;const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).project(camera));});
    const xs=points.map(p=>(p.x+1)/2),ys=points.map(p=>(1-p.y)/2);
    return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs)};
  },
  snapshot:()=>({...state,roadHalfWidth:world.halfAt(state.distance),laneCount:pilot?pilotSample(pilot,state.distance).lanes:brick?brickWidth(brick,state.distance).lanes:3,highSpeedPace,effectivePace:effectivePace(state.speed,highSpeedPace),travelSpeed:state.speed*effectivePace(state.speed,highSpeedPace),mode,elapsed,frames,inputs:input.snapshot(),audio:sound.inspect(),trackLength:world.length,position:world.car.position.toArray(),swapped,surfaceError:surfaceError(),camera:{...chaseComposition(camera.aspect),position:camera.position.toArray()},immersive:immersive.snapshot(),rightScreenDelta:world.car.position.clone().add(world.sample(state.distance).right).project(camera).x-world.car.position.clone().project(camera).x}),
  manual:(value:boolean)=>{manual=value;},
  advance:(seconds:number,override?:InputState)=>{for(let i=0;i<Math.ceil(seconds*120);i++){advance(1/120,override);render(1/120,false);}render(1/120);},
  reset:(initial:{distance?:number;speed?:number;lateral?:number;heading?:number})=>{
    inspectionView=undefined;history.clear();usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};world.car.userData.motion.reset();
    speedAudit?.reset();
    state={...createState(),...initial};advancePowertrain(state,state.speed,false,0);state.velocityHeading=state.heading;state.worldHeading=world.sample(state.distance).roadHeading+state.heading;updateFootprint(state,world.halfAt(state.distance));brickCompleted=false;elapsed=0;initialized=false;mode='playing';testControls=undefined;input.clear();ui();render(1/60);
  },
  recentHistory:()=>history.snapshot(),
  sample:(d:number)=>{const p=world.sample(d);return {halfWidth:world.halfAt(d),lanes:pilot?pilotSample(pilot,d).lanes:brick?brickWidth(brick,d).lanes:3,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),position:p.position.toArray(),curvature:p.curvature,roadHeading:p.roadHeading,tangent:p.tangent.toArray(),challenge:p.challenge};}
};}
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('challenge')){
 const id=new URLSearchParams(location.search).get('challenge'),c=COURSE.find(c=>c.id===id);
 if(c){state.distance=Math.max(0,c.start-120);state.speed=230/3.6;}
 const panel=document.createElement('div');panel.id='challenge-readout';panel.style.cssText='position:fixed;z-index:21;top:8px;left:25%;right:25%;color:white;background:#123d;text-align:center;font:12px monospace;padding:6px;pointer-events:none';document.body.append(panel);
 setInterval(()=>{const s=(window as any).__drive.steering();panel.textContent=`DEV ${s.challenge.label} · raw ${s.rawSteer.toFixed(2)} / notch ${s.effectiveSteer.toFixed(2)} / applied ${s.appliedSteer.toFixed(2)} / need ${s.requiredSteer.toFixed(2)} · x ${s.roadRelativeX.toFixed(2)}m`;},100);
}
// Explicit development URL only: reproducible same-segment A/B for human review.
if(import.meta.env.DEV&&(new URLSearchParams(location.search).has('pace')||new URLSearchParams(location.search).has('velocity'))){
 const selector=document.createElement('div');selector.id='pace-selector';
 selector.style.cssText='position:fixed;z-index:21;top:4px;left:24%;right:21%;text-align:center;background:#123e;color:#fff;font:11px system-ui;border-radius:6px;padding:4px';
 selector.innerHTML=`DEV PACE ${[1,1.5,1.75,2].map(p=>`<a style="color:${p===highSpeedPace?'#ffc874':'white'};padding:0 6px" href="?pace=${p}${location.search.includes('velocity')?'&velocity':''}">${p}×</a>`).join('')}<span id="pace-readout"></span>`;
 document.body.append(selector);
 setInterval(()=>{const measured=speedAudit?.rows.at(-1)?.worldMetersPerSecond;$('pace-readout').textContent=` · measured ${measured===undefined?'—':Number(measured).toFixed(1)} m/s (1s)`;},200);
}
// No calibration driver or UI is retained in the production bundle.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('velocity')){
 void import('../tests/driver').then(({scriptedDriver})=>{
  const g=(window as any).__drive;
  const panel=document.createElement('div');panel.id='velocity-calibration';
  panel.style.cssText='position:fixed;z-index:20;top:36px;left:25%;right:20%;text-align:center;font:12px system-ui;color:white;background:#123e;padding:6px;border-radius:8px';
  panel.innerHTML='<div>DEV SPEED COMPARISON · automatic test driver · same start</div><button data-speed="22.22">Low</button> <button data-speed="65">High</button> <button id="velocity-exit">Exit demo</button><div id="velocity-time"></div>';
  document.body.append(panel);
  let target=22.22,driver=scriptedDriver();
  const select=(speed:number)=>{target=speed;driver=scriptedDriver();g.reset({distance:400,speed});void sound.unlock().catch(()=>{});$('speed').style.visibility='hidden';};
  $('pace-readout').hidden=true;
  panel.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button=>button.onclick=()=>select(Number(button.dataset.speed)));
  panel.querySelector<HTMLButtonElement>('#velocity-exit')!.onclick=()=>location.assign(`${location.pathname}?pace=${highSpeedPace}`);
  setInterval(()=>{const s=g.snapshot();if(s.mode!=='playing')return;const controls=driver(s,g.sample(s.distance).curvature,target);controls.gas=s.speed<target;controls.brake=s.speed>target+2;g.controls(controls);$('velocity-time').textContent=`${target<30?'LOW':'HIGH'} · ${s.elapsed.toFixed(1)} s · fixed camera · speed readout hidden`;},50);
 });
}

if(import.meta.env.DEV&&new URLSearchParams(location.search).has('stage')){const id=new URLSearchParams(location.search).get('stage'),act=ACTS.find(a=>a.id===id);if(act)state.distance=act.start+700;}
