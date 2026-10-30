import {TrafficImpact} from './traffic-impact';
import {GuardrailContact} from './guardrail-contact';
import {ImpactSparks} from './impact-sparks';
import {CANYON_BEND} from './canyon-identity';
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
import {generateTrip,TRIP_VERSION} from './trip';
import {DriveTelemetry} from './drive-telemetry';
import {PhotoCapture} from './photo-capture';
import {TireEffects,type TireContact} from './tire-effects';
import {Traffic} from './traffic';
import roadWorkerUrl from './road-worker.ts?worker&url';
import type {FeedbackAnchor} from './l2-feedback';
const labMode=new URLSearchParams(location.search).get('lab')==='bricks';
const l2=new URLSearchParams(location.search).get('lab')==='l2'?(L2_CANDIDATES.find(b=>b.id===new URLSearchParams(location.search).get('l2'))??L2_CANDIDATES[0]):undefined;
const params=new URLSearchParams(location.search);
document.documentElement.dataset.qa=String(params.get('qa')==='1');
// Explicit historical and diagnostic routes keep their existing selection.
const defaultTrip=params.get('mode')!=='free'&&!['trip','stage','lab','challenge','pace','velocity'].some(key=>params.has(key));
const trip=(params.get('trip')==='10m'||defaultTrip)?generateTrip(Number(params.get('seed'))||1):undefined;
const stage=trip??(params.get('stage')==='1'?generateStage(Number(params.get('seed'))||1):undefined);
const pilot=stage??(params.get('lab')==='pilots'?(PILOTS.find(b=>b.id===params.get('pilot'))??PILOTS[0]):undefined);
const brick=pilot??l2??(labMode?(BRICKS.find(b=>b.id===new URLSearchParams(location.search).get('brick'))??BRICKS[0]):undefined);
function momentFingerprint(value:unknown){let h=2166136261;for(const c of JSON.stringify(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const momentCandidate={...L2_CANDIDATES[0],...(brick??{}),id:brick?.id??'FREE-DRIVE',seed:brick?.seed??0,contentFingerprint:brick?momentFingerprint({brick,handling:'v0.7D.1'}):'00000000',generatorVersion:brick?'brick-moments-v0.7D.2':'free-drive-v0.7D.2'};
let labUI:ReturnType<typeof mountBrickLab>|undefined,l2UI:ReturnType<typeof mountL2Lab>|undefined,brickCompleted=false;

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<div id="drive-hud" hidden>0:00 · — FPS</div><div id="route-name" hidden><span id="route-title"></span><small id="release-version">${TRIP_VERSION}</small></div>
<header><span class="wordmark">FIRST DRIVE <small>ARCADE VELOCITY / 03</small></span><nav><button id="pause" aria-label="Pause / Menu">Ⅱ Menu</button></nav></header>
<div id="immersive-note" role="status" hidden></div><aside id="speed" aria-label="Speedometer">${speedometerMarkup()}</aside>
<button id="photo-button" aria-label="Capture screenshot" hidden>📷</button><div id="photo-status" role="status" hidden>Photo saved locally</div><div id="ready-countdown" role="status" hidden>READY</div>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>Take the<br>coast road.</h1><p>Steer through the bends. Lift or brake to find your line.</p><button id="drive" class="primary">Play <span>↗</span></button><p class="keys">A / D steer &nbsp; Space accelerate<br>Enter brake &nbsp; P / Esc pause &nbsp; R restart</p><p><a href="/?trip=10m">10-Minute Road Trip ↗</a></p><p><a href="/?stage=1">Stage 01: Pacific Getaway ↗</a></p><small>SCENIC JOURNEY · LOCAL PLAYTEST · v0.8</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Play / resume ↗</button><div class="menu-actions"><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button><button id="fullscreen">Fullscreen</button><button id="free-export">Export feedback</button></div></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Controls</h2><label class="setting"><input id="swap" type="checkbox"> Steering on the right</label><p>Accelerator stays above brake on either side.</p><p>Gamepad button check: <span id="gamepad-diagnostic">No connected gamepad.</span></p><button id="close-settings" class="primary">Done</button></section>
<div id="touch"><div id="steering-strip" class="steering" role="slider" tabindex="0" aria-label="Steering position" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><span class="steer-rail"><i class="steer-center"></i><i class="steer-cursor"></i></span></div><div class="pedals"><button data-control="gas">GAS</button><button data-control="brake">BRAKE</button></div></div>
<div id="rotate"><span>↻</span>Turn toward the horizon<small>Rotate your phone to landscape to drive.</small><button id="rotate-fullscreen">Try fullscreen</button><button id="rotate-pause">Pause / resume</button></div>`;
const $ = (id:string) => document.getElementById(id)!;
$('route-title').textContent=brick?.name??'Coast Road';
for(const [id,key] of Object.entries({drive:'P',resume:'P',restart:'R',sound:'M',settings:'C',fullscreen:'F'})){const node=$(id);node.classList.add('shortcut');node.dataset.shortcut=key;node.setAttribute('aria-keyshortcuts',key);}
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=!matchMedia('(pointer:coarse)').matches; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex=-1;renderer.domElement.setAttribute('aria-label','Driving surface');$('view').append(renderer.domElement);
const world=createWorld(brick?{chunked:!!stage,streamStage:stage&&(trip||import.meta.env.PROD||params.get('stream')!=='0')?stage:undefined,track:pilot?createPilotTrack(pilot):l2?createL2Track(l2):createBrickTrack(brick),theme:brick.sceneryAct,seed:brick.seed,roadWidth:brick.roadWidth,halfAt:d=>pilot?pilotSample(pilot,d).halfWidth:brickWidth(brick,d).halfWidth,weightsAt:pilot?(d=>pilotWeights(pilot,d)):undefined,narrowings:stage?stage.placements.filter(p=>p.channel==='width'&&p.parameters.to<p.parameters.from).map(p=>Math.max(BRICK_START+30,BRICK_START+p.startS-180)):brick.lanes.flatMap((k,i)=>i&&k[1]<brick.lanes[i-1][1]?[Math.max(BRICK_START+30,BRICK_START+brick.lanes[i-1][0]*brick.length/brick.nominalDuration-180)]:[]),course:pilot?pilotCourse(pilot):l2?l2Course(l2):brickCourse(brick),notice:brick.id==='BRK-03'?{distance:BRICK_START+brick.length*5/brick.nominalDuration,text:'LEFT BEND BEYOND'}:undefined}:{}); world.car.rotation.order="YXZ"; const camera=new THREE.PerspectiveCamera(CHASE.fov,innerWidth/innerHeight,.1,matchMedia('(pointer:coarse)').matches?1400:2200);
if(import.meta.env.DEV)world.streamer?.instrumentUploads(renderer);
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
 const photo=document.getElementById('photo-button');if(photo)photo.textContent=inputMode==='keyboard'?'📷 F8':'📷';
 if(praise)praise.textContent=inputMode==='gamepad'?'L1 讚':inputMode==='keyboard'?'[G]讚':'✨ 讚';
 if(issue)issue.textContent=inputMode==='gamepad'?'□ 問題':inputMode==='keyboard'?'[I]問題':'⚑ 問題';
}
function setInputMode(next:typeof inputMode){if(inputMode!==next){inputMode=next;refreshHints();}}
addEventListener('keydown',e=>{if(!e.isComposing)setInputMode('keyboard');},true);
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setInputMode('touch');else if(e.pointerType==='mouse')setInputMode('keyboard');},true);
let mode:'menu'|'playing'|'paused'|'countdown'='menu'; let settingsOpen=false; let muted=false; let manual=false;let readyUntil=0;
let streamStartRequested=false;
let testControls:InputState|undefined;let hardDetents=false;let lastControls:InputState={gas:false,brake:false,steer:0};let usedExternalControls=false;
const highSpeedPace=import.meta.env.DEV?selectedPace(new URLSearchParams(location.search).get('pace')):DEFAULT_PACE;
let cameraHeading=0; let initialized=false; let elapsed=0; let frames=0;
const history=new RecentDrivingHistory();
let telemetry=stage?new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined):undefined;
let inspectionView:'front'|'side'|'cockpit'|undefined;
let wheelContacts:(TireContact & {point:number[]})[]=[];
const tireEffects=new TireEffects(world.scene),dustEffects=new TireEffects(world.scene,'dust'),impactSparks=new ImpactSparks(world.scene);
const carBounds=new THREE.Box3().setFromObject(world.car).getSize(new THREE.Vector3()),guardrail=new GuardrailContact(carBounds.x/2,carBounds.z/2),sparkOrigin=new THREE.Vector3(),trafficImpact=new TrafficImpact(),trafficSparks=new ImpactSparks(world.scene),trafficSparkOrigin=new THREE.Vector3();
const traffic=trip?new Traffic(world.scene,world.sample,world.halfAt,world.length,trip.seed,d=>world.streamer?.roadReady(d)??true):undefined;
const contactRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),contactShadows=Array.from({length:4},()=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.34,16),new THREE.MeshBasicMaterial({color:0x172d28,transparent:true,opacity:.24,depthWrite:false}));m.visible=false;world.scene.add(m);return m;});
function tireBottom(p:THREE.Group){const center=p.getWorldPosition(new THREE.Vector3()),axis=new THREE.Vector3(1,0,0).transformDirection(p.matrixWorld),vertical=new THREE.Vector3(0,1,0).addScaledVector(axis,-axis.y).normalize();return center.addScaledVector(vertical,-.46).addScaledVector(axis,-Math.sign(axis.y)*.135);}
const wheelSurfaces=world.scene.children.filter(o=>o.name==='driving-surface'||o.name==='shoulder');let surfacesReady=false;
function groundWheels(){
 const intersect=()=>world.streamer?world.streamer.raycastContacts(contactRay,state.distance):contactRay.intersectObjects(wheelSurfaces,true);
 const pivots=world.car.userData.wheelPivots as THREE.Group[];for(const p of pivots)p.position.y=.46;
 if(!surfacesReady){world.scene.updateMatrixWorld(true);surfacesReady=true;}else world.car.updateWorldMatrix(true,true);
 wheelContacts=pivots.map((p,index)=>{let bottom=new THREE.Vector3(),hit:THREE.Intersection|undefined;const m=p.parent!.matrixWorld.elements,up=new THREE.Vector3(m[4],m[5],m[6]);
  for(let i=0;i<2;i++){p.updateWorldMatrix(true,false);bottom=tireBottom(p);contactRay.set(bottom.clone().add(new THREE.Vector3(0,4,0)),down);contactRay.far=12;hit=intersect()[0];if(!hit)break;const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)??new THREE.Vector3(0,1,0),denominator=normal.dot(up);if(Math.abs(denominator)<.2)break;const correction=THREE.MathUtils.clamp(normal.dot(hit.point.clone().sub(bottom))/denominator,-.4-(p.position.y-.46),.4-(p.position.y-.46));p.position.y+=correction;if(Math.abs(correction)<.001)break;}
  p.updateWorldMatrix(true,false);bottom=tireBottom(p);contactRay.set(bottom.clone().add(new THREE.Vector3(0,4,0)),down);contactRay.far=12;hit=intersect()[0];const shadow=contactShadows[index];shadow.visible=!!hit;if(hit){const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)??new THREE.Vector3(0,1,0);if(normal.y<0)normal.negate();shadow.position.copy(hit.point).addScaledVector(normal,.025);shadow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);}return {name:p.name,gap:hit?bottom.y-hit.point.y:null,point:bottom.toArray(),surface:hit?.point.toArray()??null,normal:hit?.face?.normal.clone().transformDirection(hit.object.matrixWorld).toArray(),onRoad:hit?.object.name==='driving-surface'};});
}

const speedAudit=import.meta.env.DEV?new SpeedAudit():undefined;
const immersive=new Immersive($('app'),()=>{
  $('fullscreen').textContent=immersive.active?'Exit fullscreen':immersive.installed?'PWA fullscreen':'Fullscreen';
  $('immersive-note').textContent=immersive.message;
  $('immersive-note').hidden=!immersive.message;
});
let swapped=readSwapped();
let refreshPhotoFolder=()=>{};
function applyLayout(){ $('touch').classList.toggle('swapped',swapped); ($('swap') as HTMLInputElement).checked=swapped; }
applyLayout();
function ui(){ $('drive-hud').hidden=$('route-name').hidden=(mode!=='playing'&&mode!=='countdown')||settingsOpen; const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);$('menu').hidden=!!brick||mode!=='menu'||settingsOpen; $('paused').hidden=!!brick||mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',(mode==='playing'||mode==='countdown')&&!settingsOpen);$('photo-button').hidden=mode!=='playing'||settingsOpen; $('ready-countdown').hidden=mode!=='countdown';$('pause').textContent=mode==='playing'?'Ⅱ Menu':'☰ Menu';if(mode!=='playing'&&mode!=='countdown'&&!settingsOpen)refreshPhotoFolder(); }
function start(){void sound.unlock().catch(()=>{});if(world.streamer&&!world.streamer.ready){streamStartRequested=true;const status=document.getElementById('stream-status');if(status)status.textContent=world.streamer.error?`Scene preparation failed: ${world.streamer.error}`:'Preparing the road…';return;}streamStartRequested=false;const status=document.getElementById('stream-status');if(status)status.textContent='';state.appliedSteer=state.steerFrom=state.steerTo=state.steerTime=0;const resume=!!stage&&mode==='paused'&&elapsed>0&&!brickCompleted;mode=resume?'countdown':'playing';if(resume){readyUntil=performance.now()+1000;sound.pause();pad.neutralize();}settingsOpen=false;input.clear();ui();renderer.domElement.focus({preventScroll:true});}
function pause(){if(l2UI?.feedbackOpen)return;if(mode==='paused'){start();return;}mode='paused';input.clear();pad.neutralize();sound.pause();ui();if(!mobile())(document.getElementById(brick?(l2||pilot?'l2-play':'brick-play'):'resume') as HTMLElement|null)?.focus();}
function restart(){sound.pause();traffic?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();history.clear();if(stage)reportArea.hidden=true;if(stage)telemetry=new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined);usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};l2UI?.reset();world.car.userData.motion.reset();state=createState();if(brick){state.distance=BRICK_START;state.speed=brick.entrySpeed/3.6;testControls=undefined;brickCompleted=false;}advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading; elapsed=0; initialized=false;if(world.streamer){mode='paused';input.clear();sound.pause();world.streamer.update(state.distance);ui();}start();}
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
  if(e.code==='F8'&&mode==='playing'&&!settingsOpen){e.preventDefault();capturePhoto();return;}
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
addEventListener('blur',()=>{input.clear();if(mode==='playing'||mode==='countdown'){mode='paused';sound.pause();ui();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='playing'||mode==='countdown')){mode='paused';input.clear();sound.pause();ui();}});
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
  if(mode==='playing'&&!settingsOpen){const beforeDistance=state.distance,beforeLateral=state.lateral;const external=override??(import.meta.env.DEV?testControls:undefined),controls=external??{...input.snapshot(),rawSteer:input.steeringTarget};lastControls={...controls};usedExternalControls=!!external;if(import.meta.env.DEV&&hardDetents){const q=quantizeSteering(controls.steer,state.effectiveSteer);state.appliedSteer=q;state.steerFrom=q;state.steerTo=q;state.steerTime=1;}const road=world.sample(state.distance);step(state,controls,dt,road.curvature,highSpeedPace,world.halfAt,road.tangent.y/Math.hypot(road.tangent.x,road.tangent.z));trafficImpact.update(state,dt,world.halfAt(state.distance));traffic?.update(elapsed+dt,state.distance);const collision=traffic?.hit(elapsed+dt,state,{distance:beforeDistance,lateral:beforeLateral},dt,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw);if(collision){trafficImpact.kick(state,collision);sound.impact(collision.severity);const contact=world.sample(collision.distance);trafficSparkOrigin.copy(contact.position).addScaledVector(contact.right,collision.lateral);trafficSparkOrigin.y+=.65;}const impact=guardrail.update(state,beforeDistance,beforeLateral,dt,!!trip&&trip.seed===1);if(impact)sound.impact(impact);updateFootprint(state,world.halfAt(state.distance));world.car.userData.motion.advance(state.distance-beforeDistance,state.appliedSteer,dt);elapsed+=dt;if(stage&&telemetry)telemetry.observe({t:elapsed,s:state.distance-BRICK_START,brake:controls.brake,gas:controls.gas,offRoad:state.offRoad,steer:state.appliedSteer,gear:state.gear});if(l2UI&&history.due(elapsed))history.record(feedbackAnchor());if(stage&&telemetry?.due(elapsed)){const w=pilotWeights(stage,state.distance),worldName=(['coast','canyon','city'] as const)[w.indexOf(Math.max(...w))],beat=trip?(trip.beats.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.id??`L3-${trip.buffers.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.role??'finish'}`):(stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats.at(-1)!.id);telemetry.record({t:elapsed,s:state.distance-BRICK_START,speed:state.speed*3.6,gear:state.gear,rpm:state.rpm,gas:controls.gas,brake:controls.brake,steer:state.appliedSteer,rawSteer:controls.rawSteer??controls.steer,curvature:road.curvature,requiredSteer:state.requiredSteer,grade:state.grade,halfWidth:world.halfAt(state.distance),lanes:pilotSample(stage,state.distance).lanes,active:pilotSample(stage,state.distance).active.map(p=>p.id),roadX:state.lateral,offRoad:state.offRoad,world:worldName,beat,input:external?'scripted':inputMode});}sound.update(state.speed,state.slip,controls.gas&&!controls.brake,dt,state,trafficImpact.slide,traffic?.skidIntensity??0);if(brick&&state.distance>=BRICK_START+brick.length){if(l2UI){const finish=feedbackAnchor();history.record(finish,true);l2UI.complete(finish);}brickCompleted=true;mode='paused';input.clear();testControls=undefined;sound.pause();if(telemetry){telemetry.save();showDriveReport();}ui();if(!mobile())(document.getElementById(l2||pilot?'l2-play':'brick-play') as HTMLElement|null)?.focus();}}else sound.pause();
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
  world.car.rotation.set(-Math.atan2(p.tangent.y*Math.cos(state.heading),Math.hypot(p.tangent.x,p.tangent.z)),-p.roadHeading-state.heading-guardrail.yaw-trafficImpact.yaw,THREE.MathUtils.clamp(-state.slipAngle*.12,-.055,.055)+guardrail.roll+trafficImpact.roll);
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
  const worldStart=perfEnabled?performance.now():0;world.update(elapsed,state.speed,state.slip,state.distance);if(perfEnabled)worldTotal+=performance.now()-worldStart;if(!draw)return;traffic?.update(elapsed,state.distance);const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);refreshHints();world.car.userData.motion.render();const rayStart=perfEnabled?performance.now():0;groundWheels();tireEffects.update(elapsed,state.speed,sound.skidFeedback.intensity,wheelContacts,renderer.domElement.height*camera.projectionMatrix.elements[5]/2);dustEffects.update(elapsed,state.speed,0,wheelContacts,1);sparkOrigin.copy(p.position).addScaledVector(p.right,CANYON_BEND.railOffset);sparkOrigin.y+=.9;impactSparks.update(elapsed,sparkOrigin,p.right,p.tangent,guardrail.flash>0?guardrail.strength:0);trafficSparks.update(elapsed,trafficSparkOrigin,p.right,p.tangent,trafficImpact.flash>0?(trafficImpact.event?.severity??0):0);const renderStart=perfEnabled?performance.now():0;if(perfEnabled)raycastTotal+=renderStart-rayStart;renderer.render(world.scene,camera);if(perfEnabled)renderTotal+=performance.now()-renderStart;frames++;
  $('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');
  const speedBand=state.speed*3.6>=300?'redline':state.speed*3.6>=240?'fast':'cruise';if($('speed').dataset.band!==speedBand)$('speed').dataset.band=speedBand;
  $('speed-needle').setAttribute('transform',`rotate(${needleAngle(state.speed*3.6)} 100 100)`);$('gear').textContent=`G${state.gear}`;
  $('status').textContent=state.offRoad?'OFF ROAD · STEER BACK':state.slip>.2?'CORNERING · HOLD YOUR LINE':mode==='playing'?'STEER YOUR OWN LINE':'READY FOR THE COAST';
}
let photoStatusTimer=0;
const photos=new PhotoCapture(renderer.domElement,()=>render(0),()=>{const p=world.sample(state.distance);return {stageCode:stage?.stageCode??'FREE',seed:stage?.seed??0,capturedAt:new Date().toISOString(),time:elapsed,distance:state.distance,speed:state.speed*3.6,steer:state.appliedSteer,grade:state.grade,roadX:state.lateral,halfWidth:world.halfAt(state.distance),carPosition:world.car.position.toArray(),carRotation:[world.car.rotation.x,world.car.rotation.y,world.car.rotation.z],roadPosition:p.position.toArray(),surfaceGap:surfaceError(),wheels:wheelContacts};},message=>{$('photo-status').textContent=message;$('photo-status').hidden=false;clearTimeout(photoStatusTimer);photoStatusTimer=window.setTimeout(()=>{$('photo-status').hidden=true;},message==='📸 Saved'?2000:7000);});
function capturePhoto(){if(settingsOpen||l2UI?.feedbackOpen||mode==='countdown')return;const meta=photos.capture();if(meta){telemetry?.mark('photo',elapsed,state.distance-BRICK_START,meta);}}
$('photo-button').onclick=capturePhoto;
const pad=new GamepadInput(input,action=>{
 if(action==='fullscreen'){void immersive.toggle();return;}
 if(l2UI?.feedbackOpen){l2UI.control(action);return;}
 if(action==='photo'){capturePhoto();return;}
 if(action==='issue'){if(mode==='playing'||brickCompleted){l2UI?.openQuick('issue','gamepad');l2UI?.control('issue');}return;}
 if(action==='praise'){if(mode==='playing'||brickCompleted)l2UI?.openQuick('praise','gamepad');return;}
 if(action==='pause'){if(settingsOpen||l2UI?.feedbackOpen||mode==='countdown')return;if(mode==='menu'||brickCompleted)restart();else pause();return;}
 if(action==='back'){if(l2UI?.feedbackOpen)document.getElementById('l2-feedback-cancel')?.click();else if(settingsOpen)$('close-settings').click();else if(mode==='playing')pause();return;}
 if(mode==='playing')return;
 const scope=(l2UI?.feedbackOpen?document.getElementById('l2-feedback-dialog'):settingsOpen?$('preferences'):document.getElementById(pilot||l2?'l2-lab':brick?'brick-lab':mode==='menu'?'menu':'paused'));
 if(!scope)return;
 const items=Array.from(scope.querySelectorAll<HTMLElement>('button,a,input,select')).filter(x=>x.offsetParent!==null&&!x.hasAttribute('disabled'));
 if(action==='confirm'){const active=document.activeElement as HTMLElement;if(items.includes(active))active.click();else items[0]?.focus();return;}
 const index=items.indexOf(document.activeElement as HTMLElement),delta=action==='up'?-1:1;items[(index<0?0:(index+delta+items.length)%items.length)]?.focus();
},()=>setInputMode('gamepad'),()=>{if(inputMode==='gamepad')setInputMode(mobile()?'touch':'keyboard');});
const perfEnabled=import.meta.env.DEV&&params.get('perf')==='1';
const perf={fps:0,startupMs:0,raycastMs:0,renderMs:0,worldMs:0,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled};
let perfFrames=0,perfSince=performance.now(),raycastTotal=0,renderTotal=0,worldTotal=0;
const perfPanel=perfEnabled?document.createElement('pre'):undefined;
if(perfPanel){perfPanel.id='perf';perfPanel.style.cssText='position:fixed;left:8px;top:50px;z-index:100;pointer-events:none;background:#102a35dd;color:white;padding:8px;font:12px monospace';document.getElementById('app')!.append(perfPanel);}
let last=performance.now();
function loop(now:number){
  if(streamStartRequested&&world.streamer){if(world.streamer.ready)start();else if(world.streamer.error){const status=document.getElementById('stream-status');if(status)status.textContent=`Scene preparation failed: ${world.streamer.error}`;streamStartRequested=false;}}
  pad.poll(mode==='playing'&&!settingsOpen,!!l2UI?.feedbackOpen,brickCompleted&&!settingsOpen);
  const dt=Math.min((now-last)/1000,.25);last=now;
  const wasCounting=mode==='countdown';if(wasCounting){$('ready-countdown').textContent=`READY ${Math.max(0,(readyUntil-now)/1000).toFixed(1)}`;if(now>=readyUntil&&!document.hidden&&document.hasFocus()){mode='playing';input.clear();pad.neutralize();ui();}}
  // Integrate elapsed time in bounded physics steps; slow rendering must not
  // turn a 65m/s drive into slow motion by discarding every frame above 50ms.
  if(!manual&&!wasCounting)for(let remaining=dt;remaining>1e-8;){const tick=Math.min(remaining,1/120);advance(tick);remaining-=tick;}
  render(dt);
  // Reuse the existing frame sample for the public FPS readout; expensive diagnostics stay opt-in.
  perfFrames++;const span=now-perfSince;
  if(perfEnabled&&!perf.startupMs&&(!world.streamer||world.streamer.ready))perf.startupMs=performance.now();
  if(span>=1000){perf.fps=perfFrames*1000/span;
   if(perfEnabled){Object.assign(perf,{raycastMs:raycastTotal/perfFrames,renderMs:renderTotal/perfFrames,worldMs:worldTotal/perfFrames});
   const stream=world.streamer?.stats,chunks=stream?.chunks.filter(c=>stream.nearby.includes(c.index))??[];perfPanel!.textContent=`FPS ${perf.fps.toFixed(1)} · ready ${(perf.startupMs/1000).toFixed(2)}s
Near road/scenery ${chunks.map(c=>c.index+':'+(c.road==='ready'?'R':'-')+(c.scenery==='ready'?'S':'-')).join(' ')}
Draws ${renderer.info.render.calls} · ray ${perf.raycastMs.toFixed(1)}ms · render CPU ${perf.renderMs.toFixed(1)}ms`;}
   perfFrames=0;perfSince=now;raycastTotal=renderTotal=worldTotal=0;
  }
  const hudText=`${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')} · ${perf.fps?Math.round(perf.fps):'—'} FPS`;
  if($('drive-hud').textContent!==hudText)$('drive-hud').textContent=hudText;

  if(!manual&&mode==='playing'&&!settingsOpen)speedAudit?.record({wall:now,simulated:elapsed,progress:state.distance,speed:state.speed,position:world.car.position.toArray(),camera:camera.position.toArray(),trackLength:world.length,heading:state.worldHeading,lateral:state.lateral,pace:effectivePace(state.speed,highSpeedPace)});
  else speedAudit?.reset();
  requestAnimationFrame(loop);
}
if(brick&&!l2&&!pilot)labUI=mountBrickLab(brick,{play:()=>{if(mobile())void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile())void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),exportMoments:()=>l2UI?.exportCurrent()});
ui();resize();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').then(async()=>{await navigator.serviceWorker.ready;const cache=await caches.open('coast-drive-v09-mobile-1'),assets=[roadWorkerUrl,...Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),x=>x.src),...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),x=>x.href)];await cache.addAll([...new Set(assets)].filter(url=>new URL(url,location.href).origin===location.origin));}).catch(()=>{});});
}

function feedbackAnchor():FeedbackAnchor{
 const controls=usedExternalControls?lastControls:input.snapshot(),rawSteer=usedExternalControls?(lastControls.rawSteer??lastControls.steer):input.steeringTarget;
 if(!pilot&&!l2){const p=world.sample(state.distance),weights=world.weightsAt(state.distance);return {id:momentCandidate.id,revision:momentCandidate.revision,seed:momentCandidate.seed,contentFingerprint:momentCandidate.contentFingerprint,generatorVersion:momentCandidate.generatorVersion,handlingVersion:'v0.7D.1',world:(['coast','canyon','city'] as const)[weights.indexOf(Math.max(...weights))],profiles:{course:{id:p.challenge.id,label:p.challenge.label,curvature:p.curvature}},s:brick?state.distance-BRICK_START:state.distance%world.length,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:p.position.y,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),halfWidth:world.halfAt(state.distance),laneCount:brick?brickWidth(brick,state.distance).lanes:3,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};}
 const b=(pilot??l2)!,road=pilot?pilotSample(pilot,state.distance):l2Sample(l2!,state.distance);return {id:b.id,revision:b.revision,seed:b.seed,contentFingerprint:b.contentFingerprint,generatorVersion:b.generatorVersion,handlingVersion:'v0.7D.1',...(stage?{stageCode:stage.stageCode,...(trip?{tripCode:trip.tripCode}:{}),l2InstanceId:trip?trip.beats.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.id:(stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats[stage.beats.length-1].id),...(trip?{bufferRole:trip.buffers.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.role}:{})}:{}),world:pilot?(['coast','canyon','city'] as const)[pilotWeights(pilot,state.distance).indexOf(Math.max(...pilotWeights(pilot,state.distance)))]:b.world,profiles:pilot?structuredClone({placements:trip?[]:pilot.placements,activePlacements:pilotSample(pilot,state.distance).active,worldPhases:pilot.worldPhases}):structuredClone(l2!.profiles),s:state.distance-BRICK_START,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:road.height,grade:road.grade,halfWidth:road.halfWidth,laneCount:road.lanes,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};
}
l2UI=mountL2Lab((pilot??l2??momentCandidate)!,{play:()=>{if(mobile())void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile())void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),capture:feedbackAnchor,history,freeze:()=>{mode='paused';input.clear();testControls=undefined;sound.pause();ui();},resume:start,onFeedback:data=>{telemetry?.mark('feedback',elapsed,state.distance-BRICK_START,data);if(brickCompleted&&telemetry){telemetry.save();showDriveReport();}}},!pilot&&!l2);
if(world.streamer){const status=document.createElement('p');status.id='stream-status';status.setAttribute('role','status');document.getElementById('l2-play')!.after(status);}
const reportArea=document.createElement('section');reportArea.id='drive-report';reportArea.hidden=true;
if(stage){document.getElementById('l2-events')!.after(reportArea);const recent=document.createElement('button');recent.id='drive-recent';recent.textContent='Last drive report';recent.onclick=()=>{const saved=DriveTelemetry.recent(trip?'outrun-trip-drive-reports-v09':undefined)[0];if(saved)renderDriveReport(saved);};document.getElementById('l2-export')!.after(recent);}
if(import.meta.env.DEV){
 const row=document.createElement('p');row.id='photo-folder';row.hidden=true;const path=document.createElement('span'),open=document.createElement('button');open.textContent='Open Folder';open.hidden=true;row.append(path,open);if(pilot||l2)document.getElementById('l2-export')!.after(row);else if(brick)document.getElementById('brick-lab')!.append(row);else $('paused').append(row);
 const refreshFolder=async()=>{try{const response=await fetch('/__outrun_photo_info',{cache:'no-store'});if(!response.ok)return;const info=await response.json();if(!info.folder)return;path.textContent=`Screenshots on PC: ${info.folder} `;open.hidden=!info.openAllowed;row.hidden=false;}catch{row.hidden=true;}};
 open.onclick=async()=>{open.disabled=true;try{const response=await fetch('/__outrun_open_photos',{method:'POST'});if(!response.ok)throw Error();}catch{path.textContent+=' (Could not open folder.)';}finally{open.disabled=false;}};
 refreshPhotoFolder=()=>{void refreshFolder();};refreshPhotoFolder();
}
function renderDriveReport(report:ReturnType<DriveTelemetry['report']>){const m=report.metrics;reportArea.hidden=false;reportArea.replaceChildren();const heading=document.createElement('h3');heading.textContent='Drive summary · '+report.stageCode;const summary=document.createElement('p');const pct=(x:number,total:number)=>total?(100*x/total).toFixed(1):'0.0';summary.textContent=`${m.time.toFixed(1)} s · peak ${m.peakSpeed.toFixed(0)} km/h · gas ${pct(m.gasSeconds,m.time)}% · braking ${m.brakePresses} / ${m.brakeSeconds.toFixed(1)} s · off road ${m.offroadEpisodes} / ${m.offroadSeconds.toFixed(1)} s · high steer ${pct(m.highSteerSeconds,m.time)}%`;const thresholds=document.createElement('p');thresholds.textContent=m.thresholds.map(x=>`≥${x.speed}: ${pct(x.time,m.time)}% time, ${pct(x.distance,m.distance)}% distance`).join(' · ')+` · fast unbraked bends ${pct(m.fastUnbrakedBend,m.bendDistance)}%`;const detail=document.createElement('pre');detail.textContent=Object.entries(report.beats).map(([id,b])=>`${id}: avg ${b.averageSpeed.toFixed(0)}, min ${b.minSpeed.toFixed(0)}, max ${b.maxSpeed.toFixed(0)} km/h · curve avg ${b.curveAverageSpeed?.toFixed(0)??"—"} · brakes ${b.brakes} · offroad ${b.offroad.toFixed(1)}s`).join('\n');const button=document.createElement('button');button.textContent='Export Drive Report JSON';button.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`outrun-drive-${report.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};reportArea.append(heading,summary,thresholds,button,detail);}
function showDriveReport(){if(telemetry)renderDriveReport(telemetry.report());}
$('free-export').onclick=()=>l2UI?.exportCurrent();$('free-export').hidden=!!brick;
if(!mobile())requestAnimationFrame(()=>document.getElementById(pilot||l2?'l2-play':brick?'brick-play':'drive')?.focus());

if(import.meta.env.DEV){(window as any).__drive={
  carView:(view:'front'|'side'|'cockpit')=>{
    manual=true;inspectionView=view;render(1/60);
  },
  perf:()=>({...perf}),
  tireEffects:()=>tireEffects.inspect(),
  railClearance:()=>{const p=world.sample(state.distance),v=new THREE.Vector3();let edge=-Infinity;world.car.updateMatrixWorld(true);world.car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(p.position);edge=Math.max(edge,v.dot(p.right));}});return CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-edge;},
  surfaceFeedback:()=>({dust:dustEffects.inspect(),guard:guardrail.inspect(state.heading),sparks:impactSparks.inspect()}),
  traffic:()=>traffic?.inspect(),
  trafficClearance:()=>traffic?.clearance(state.distance,state.lateral,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw+guardrail.yaw),
  trafficImpact:()=>({velocity:trafficImpact.velocity,slide:trafficImpact.slide,yaw:trafficImpact.yaw,roll:trafficImpact.roll,event:trafficImpact.event,sparks:trafficSparks.inspect()}),
  trafficContacts:()=>traffic?.contactPoints().map(c=>{const ray=new THREE.Raycaster(new THREE.Vector3().fromArray(c.point).add(new THREE.Vector3(0,4,0)),down,0,8),hit=world.streamer?.raycastContacts(ray,c.distance)[0];return {...c,gap:hit?c.point[1]-hit.point.y:null};}),
  acts:()=>ACTS,
  streaming:()=>world.streamer?{ready:world.streamer.ready,error:world.streamer.error,...world.streamer.stats}:null,
  scenery:()=>({...world.scenery,weights:world.weightsAt(state.distance),render:structuredClone(renderer.info.render),memory:structuredClone(renderer.info.memory)}),
  wheels:()=>world.car.userData.motion.inspect(),wheelContacts:()=>wheelContacts,
  occupants:()=>world.car.userData.motion.occupants(),
  challenges:()=>pilot?pilotCourse(pilot):l2?l2Course(l2):brick?brickCourse(brick):COURSE,
  supportAudit:()=>{const group=world.scene.getObjectByName('road-support')!,children=(world.streamer?group.children.flatMap(c=>c.children):group.children).filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh).sort((a,b)=>(a.userData.chunkIndex??0)-(b.userData.chunkIndex??0));let maxSeam=0,nonFinite=0,maxTopError=0;for(let i=0;i<children.length;i++){const pos=children[i].geometry.getAttribute('position'),index=children[i].userData.chunkIndex??i,span=world.streamer?.chunkLength??1200,start=index*span,end=Math.min(world.length,start+span),n=pos.count/4-1;for(let row=0;row<=n;row++){const d=start+(end-start)*row/n,p=world.sample(d),width=world.halfAt(d);for(let side=0;side<2;side++){const expected=p.position.clone().addScaledVector(p.right,(side?1:-1)*(width+6));expected.y-=.1;maxTopError=Math.max(maxTopError,expected.distanceTo(new THREE.Vector3().fromBufferAttribute(pos,row*4+side*2)));}} for(let j=0;j<pos.count;j++)if(!Number.isFinite(pos.getX(j)+pos.getY(j)+pos.getZ(j)))nonFinite++;if(i&&(!world.streamer||index===children[i-1].userData.chunkIndex+1)){const prev=children[i-1].geometry.getAttribute('position');for(let j=0;j<4;j++){const a=new THREE.Vector3().fromBufferAttribute(prev,prev.count-4+j),b=new THREE.Vector3().fromBufferAttribute(pos,j);maxSeam=Math.max(maxSeam,a.distanceTo(b));}}}return{chunks:children.length,maxSeam,maxTopError,nonFinite};},
  roadChunks:()=>{const road=world.scene.getObjectByName('driving-surface')!;return {count:road.children.length,cullable:road.children.every(o=>o.frustumCulled)};},
  telemetry:()=>telemetry?.report(),
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
  advance:(seconds:number,override?:InputState,draw=true)=>{for(let i=0;i<Math.ceil(seconds*120);i++){advance(1/120,override);render(1/120,false);}render(1/120,draw);},
  reset:(initial:{distance?:number;speed?:number;lateral?:number;heading?:number})=>{
    inspectionView=undefined;sound.pause();traffic?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();history.clear();usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};world.car.userData.motion.reset();
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
