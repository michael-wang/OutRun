import {RockContact} from './rocky-shoulder';
import {RoadCones} from './road-cones';
import {bankPrototype} from './banking';
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
import { CHASE, CHASE_NEAR, chaseTargets, chaseComposition, applyScenicCamera, scenicDriftTarget, blendScenicDrift } from './chase';
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
import {DESIGNER_CANYON_STAGE} from './designer-canyon';
import {CANYON_ROADLOCK_STAGE,CANYON_ROADLOCK_MOMENTS,CANYON_SCENIC_ZONES} from './designer-canyon-roadlock';
import {DriveTelemetry} from './drive-telemetry';
import {PhotoCapture} from './photo-capture';
import {TireEffects,type TireContact} from './tire-effects';
import {Traffic,trafficRecipe} from './traffic';
import {planJourneyLandmarks,CLOCK_COMPANION_COLOR,CLOCK_DISTRICT_COMPANIONS} from './scenery';
import {SceneInspector,type InspectorStop} from './scene-inspector';
import {ROAD_FEATURE_LABELS} from './road-features';
import {SECTION_LABELS} from './scenery-cross-section';
import {canyonArchInspectionDistance} from './canyon-arch-preview';
import {interchangeCenterOffset} from './road-interchange';
import {TripPauseDock} from './trip-pause-dock';
import type {BrakeLightController} from './car';
import {ExhaustEffects,isHighRevUpshift} from './exhaust-effects';
import roadWorkerUrl from './road-worker.ts?worker&url';
import {StreamHealthHud} from './stream-health-hud';
import type {FeedbackAnchor} from './l2-feedback';
const labMode=new URLSearchParams(location.search).get('lab')==='bricks';
const l2=new URLSearchParams(location.search).get('lab')==='l2'?(L2_CANDIDATES.find(b=>b.id===new URLSearchParams(location.search).get('l2'))??L2_CANDIDATES[0]):undefined;
const params=new URLSearchParams(location.search);
document.documentElement.dataset.qa=String(params.get('qa')==='1');
// Explicit historical and diagnostic routes keep their existing selection.
const designerMode=params.get('showcase')==='canyon';
const roadLockMode=designerMode&&params.get('road')==='lock';
const scenicCameraEnabled=roadLockMode&&params.get('art')==='blender'&&params.get('scenicCamera')==='1';
const blenderMode=designerMode&&params.get('art')==='blender';
const defaultTrip=!designerMode&&params.get('mode')!=='free'&&!['trip','stage','lab','challenge','pace','velocity'].some(key=>params.has(key));
const trip=roadLockMode?CANYON_ROADLOCK_STAGE:designerMode?DESIGNER_CANYON_STAGE:(params.get('trip')==='10m'||defaultTrip)?generateTrip(Number(params.get('seed'))||1,params.get('revision')==='r1'?1:params.get('revision')==='r2'?2:params.get('revision')==='r3'?3:params.get('revision')==='r4'?4:params.get('revision')==='r5'?5:params.get('revision')==='r6'?6:params.get('revision')==='r7'?7:params.get('revision')==='r8'?8:params.get('revision')==='r9'?9:params.get('revision')==='r10'?10:params.get('revision')==='r11'?11:12):undefined;
// Production visitors see the game; internal QA tools remain available through ?qa=1.
const playerUi=!!trip&&params.get('qa')!=='1'&&(import.meta.env.PROD||params.get('playerui')==='1');
document.documentElement.dataset.playerUi=String(playerUi);
const stage=trip??(params.get('stage')==='1'?generateStage(Number(params.get('seed'))||1,params.get('revision')==='r1'?1:2):undefined);
const pilot=stage??(params.get('lab')==='pilots'?(PILOTS.find(b=>b.id===params.get('pilot'))??PILOTS[0]):undefined);
const banking=bankPrototype(params.get('lab'),pilot?.id,params.get('bank'));
const bankLab=params.get('lab')==='pilots'&&pilot?.id==='L2P-B'&&params.has('bank');
const brick=pilot??l2??(labMode?(BRICKS.find(b=>b.id===new URLSearchParams(location.search).get('brick'))??BRICKS[0]):undefined);
function momentFingerprint(value:unknown){let h=2166136261;for(const c of JSON.stringify(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const momentCandidate={...L2_CANDIDATES[0],...(brick??{}),id:brick?.id??'FREE-DRIVE',seed:brick?.seed??0,contentFingerprint:brick?momentFingerprint({brick,handling:'ALB2'}):'00000000',generatorVersion:brick?'brick-moments-v0.7D.2':'free-drive-v0.7D.2'};
let labUI:ReturnType<typeof mountBrickLab>|undefined,l2UI:ReturnType<typeof mountL2Lab>|undefined,brickCompleted=false;

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<div id="drive-hud" hidden>0:00 · — FPS</div><div id="route-name" hidden><span id="route-title"></span><small id="release-version">${trip?.generatorVersion??TRIP_VERSION}</small></div>
<header><span class="wordmark">FIRST DRIVE <small>ARCADE VELOCITY / 03</small></span><nav><button id="pause" aria-label="${playerUi?'暫停／選單':'Pause / Menu'}">Ⅱ Menu</button></nav></header>
<div id="immersive-note" role="status" hidden></div><aside id="speed" aria-label="Speedometer">${speedometerMarkup()}</aside>
<div id="qa-tools" aria-label="測試工具列"><button id="photo-button" aria-label="截圖" data-key-hint="F8" data-pad-hint="TOUCHPAD" hidden>📷 截圖</button></div><div id="photo-status" role="status" hidden>Photo saved locally</div><div id="ready-countdown" role="status" hidden>READY</div>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>${designerMode?'Grand Canyon<br>Designer’s Cut':'Take the<br>coast road.'}</h1><p>${designerMode?'手工設計的峽谷公路。沿著道路親自看見河灣。':'Steer through the bends. Lift or brake to find your line.'}</p><button id="drive" class="primary">Play <span>↗</span></button><p class="keys">A / D steer &nbsp; Space accelerate<br>Enter brake &nbsp; P / Esc pause &nbsp; R restart</p><p><a href="/?showcase=canyon&road=lock">大峽谷 · Cliff Pass R4 試駕 ↗</a></p><p><a href="/?showcase=canyon">大峽谷 · 原導演版 ↗</a></p>${designerMode?`<p><a href="/?showcase=canyon${roadLockMode?'&road=lock':''}${blenderMode?'':'&art=blender'}">${blenderMode?'切換道路原版':roadLockMode?'Cliff Pass R4 · 本機試駕':'Blender v2 · 本機測試'} ↗</a></p>`:''}<p><a href="/?trip=10m">10-Minute Road Trip ↗</a></p><p><a href="/?stage=1">Stage 01: Pacific Getaway ↗</a></p><small>SCENIC JOURNEY · LOCAL PLAYTEST · v0.8</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Play / resume ↗</button><div class="menu-actions"><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button><button id="fullscreen">Fullscreen</button><button id="free-export">Export feedback</button></div><p id="iphone-fullscreen-hint" role="status" hidden>On iPhone, open this site in Safari. Tap Share → Add to Home Screen, then launch the icon to hide Safari browser bars. Rotate the phone to landscape to drive.</p></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">${playerUi?'遊戲設定':'MAKE YOURSELF AT HOME'}</div><h2>${playerUi?'操作設定':'Controls'}</h2><label class="setting"><input id="swap" type="checkbox"> ${playerUi?'方向盤置於右側':'Steering on the right'}</label><p>${playerUi?'油門與煞車維持上下排列，左右手可互換。':'Accelerator stays above brake on either side.'}</p><p>Gamepad button check: <span id="gamepad-diagnostic">No connected gamepad.</span></p><button id="close-settings" class="primary">${playerUi?'完成':'Done'}</button></section>
<div id="touch"><div id="steering-strip" class="steering" role="slider" tabindex="0" aria-label="${playerUi?'方向盤':'Steering position'}" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><span class="steer-rail"><i class="steer-center"></i><i class="steer-cursor"></i></span></div><div class="pedals"><button data-control="gas">${playerUi?'油門':'GAS'}</button><button data-control="brake">${playerUi?'煞車':'BRAKE'}</button></div></div>
<div id="rotate"><span>↻</span>${playerUi?'橫放手機，準備出發！':'Turn toward the horizon'}<small id="rotate-instruction">${playerUi?'請將手機轉為橫向，即可開始駕駛。':'Rotate your phone to landscape to drive.'}</small><small id="rotate-launch-status" role="status" hidden></small><button id="rotate-launch" type="button" hidden>全螢幕出發！</button><small id="rotate-iphone-hint" hidden>iPhone: turn off Portrait Orientation Lock if necessary. For fewer browser bars, open in Safari → Share → Add to Home Screen, then launch from the Home Screen.</small><small id="rotate-immersive-error" role="status" hidden></small><button id="rotate-fullscreen">Try fullscreen</button><button id="rotate-pause">Pause / resume</button></div>
<section id="player-start" aria-label="Start driving" hidden>
  <div id="player-title" class="player-title">極速漫遊</div>
  <p id="player-subtitle">公路冒險</p>
  <button id="player-play" class="primary">開始駕駛</button>
  <p id="player-loading" role="status">道路準備中…</p><button id="player-retry" hidden>重試載入</button>
  <div class="player-secondary"><button id="player-restart" hidden>重新開始</button><button id="player-new-route" hidden>新路線</button><button id="player-options">操作設定</button><button id="player-sound">音效開</button><button id="player-install-guide" hidden>更多畫面空間</button></div>
  <p id="player-install-help" role="status" hidden>iPhone Safari：分享 → 加入主畫面，再從主畫面開啟遊戲，即可減少瀏覽器工具列。</p>
</section>`;
const startupArt=document.getElementById('startup-art')!;
document.getElementById('app')!.prepend(startupArt);
startupArt.hidden=!playerUi;
document.getElementById('startup-fallback')!.hidden=true;
const $ = (id:string) => document.getElementById(id)!;
$('route-title').textContent=blenderMode?(roadLockMode?'Grand Canyon · Cliff Pass R4':'Grand Canyon · Blender v2'):brick?.name??'Coast Road';
for(const [id,key] of Object.entries({drive:'P',resume:'P',restart:'R',sound:'M',settings:'C',fullscreen:'F'})){const node=$(id);node.classList.add('shortcut');node.dataset.shortcut=key;node.setAttribute('aria-keyshortcuts',key);}
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=!matchMedia('(pointer:coarse)').matches; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex=-1;renderer.domElement.setAttribute('aria-label','Driving surface');$('view').append(renderer.domElement);
const blenderAsset=blenderMode?await (async()=>{
 const status=document.createElement('p');status.id='blender-art-status';status.setAttribute('role','status');status.style.cssText='position:fixed;top:12px;left:12px;z-index:300;background:#17343d;color:white;padding:12px';status.textContent='Blender 峽谷美術載入中…';document.body.append(status);
 try{const asset=await (await import('./blender-canyon')).loadBlenderCanyon(roadLockMode);status.remove();return asset;}
 catch(error){status.textContent=roadLockMode?'Blender 地形載入失敗：請確認本機 cliff-pass-r4/canyon_cliff_pass_r4.glb。道路入口：?showcase=canyon&road=lock':'Blender 美術載入失敗：請確認本機 canyon_art_only.glb。原版入口：?showcase=canyon';throw error;}
})():undefined;
const world=createWorld(brick?{blenderArt:!!blenderAsset,bank:bankLab?banking:undefined,chunked:!!stage,streamStage:bankLab?pilot:stage&&(blenderMode||trip||import.meta.env.PROD||params.get('stream')!=='0')?stage:undefined,track:pilot?createPilotTrack(pilot,bankLab?banking:undefined):l2?createL2Track(l2):createBrickTrack(brick),theme:brick.sceneryAct,seed:brick.seed,roadWidth:brick.roadWidth,halfAt:d=>pilot?pilotSample(pilot,d).halfWidth:brickWidth(brick,d).halfWidth,weightsAt:pilot?(d=>pilotWeights(pilot,d)):undefined,narrowings:stage?stage.placements.filter(p=>p.channel==='width'&&p.parameters.to<p.parameters.from).map(p=>Math.max(BRICK_START+30,BRICK_START+p.startS-180)):brick.lanes.flatMap((k,i)=>i&&k[1]<brick.lanes[i-1][1]?[Math.max(BRICK_START+30,BRICK_START+brick.lanes[i-1][0]*brick.length/brick.nominalDuration-180)]:[]),course:pilot?pilotCourse(pilot):l2?l2Course(l2):brickCourse(brick),notice:brick.id==='BRK-03'?{distance:BRICK_START+brick.length*5/brick.nominalDuration,text:'LEFT BEND BEYOND'}:undefined}:{}); world.car.rotation.order="YXZ"; const camera=new THREE.PerspectiveCamera(CHASE.fov,innerWidth/innerHeight,CHASE_NEAR,matchMedia('(pointer:coarse)').matches?1400:2200);
if(blenderAsset)world.scene.add(blenderAsset.root);
if(import.meta.env.DEV)world.streamer?.instrumentUploads(renderer);
const input=new InputController(document,()=>mode==='playing'&&!settingsOpen); const sound=new EngineSound(); let state=createState();if(brick){state.distance=BRICK_START;state.speed=brick.entrySpeed/3.6;} advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading;
const mobile=()=>matchMedia("(pointer:coarse)").matches;
let inputMode:'keyboard'|'gamepad'|'touch'=mobile()?'touch':'keyboard';
document.documentElement.dataset.inputMode=inputMode;
function refreshHints(){
 document.documentElement.dataset.inputMode=inputMode;
 document.querySelectorAll<HTMLElement>('.shortcut').forEach(node=>{
  const key=node.dataset.shortcut;if(!key||node.dataset.keyHint||node.id==='l2-praise'||node.id==='l2-issue')return;
  const first=Array.from(node.childNodes).find(n=>n.nodeType===Node.TEXT_NODE);if(!first)return;
  const raw=(first.textContent??'').replace(/\[([^\]]+)\]/g,'$1');
  if(inputMode==='keyboard'){const i=raw.toUpperCase().indexOf(key);first.textContent=i<0?`[${key}] ${raw}`:raw.slice(0,i)+`[${raw[i]}]`+raw.slice(i+1);}else first.textContent=raw;
 });
 const praise=document.getElementById('l2-praise'),issue=document.getElementById('l2-issue');
 const photo=document.getElementById('photo-button');if(photo)photo.textContent='📷 截圖';
 if(praise)praise.textContent=inputMode==='gamepad'?'L1 讚':inputMode==='keyboard'?'[G]讚':'✨ 讚';
 if(issue)issue.textContent=inputMode==='gamepad'?'□ 問題':inputMode==='keyboard'?'[I]問題':'⚑ 問題';
}
function setInputMode(next:typeof inputMode){if(inputMode!==next){inputMode=next;refreshHints();}}
addEventListener('keydown',e=>{if(!e.isComposing)setInputMode('keyboard');},true);
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setInputMode('touch');else if(e.pointerType==='mouse')setInputMode('keyboard');},true);
let mode:'menu'|'playing'|'paused'|'countdown'='menu'; let settingsOpen=false; let muted=false; let manual=false;let readyUntil=0;
let sceneInspector:SceneInspector|undefined;
let tripPauseDock:TripPauseDock|undefined;
// One tap in portrait arms a launch; driving starts only after landscape AND safe road readiness.
let autoLaunchArmed=false,autoLaunchNeedsManual=false;
let streamStartRequested=false;
let preparationSince=performance.now();
const streamStallEvents:{start:number;end?:number;durationMs?:number;distance:number;reason:string}[]=[];
let streamHeld=false,streamHoldSince=0,streamStalls=0,streamWaitMs=0,contextLost=false;
const roadOverlay=document.createElement('div');roadOverlay.id='road-loading';roadOverlay.setAttribute('role','status');roadOverlay.style.cssText='position:fixed;inset:35% 12% auto;z-index:150;padding:22px;background:#102a35ee;color:white;text-align:center;border:2px solid #ffd46b;border-radius:12px;pointer-events:none;font:600 18px system-ui';roadOverlay.hidden=true;document.getElementById('app')!.append(roadOverlay);
function holdRoad(held:boolean){if(held===streamHeld)return;streamHeld=held;if(held){streamStalls++;streamHoldSince=performance.now();if(params.get('streamdiag')==='1'){streamStallEvents.push({start:streamHoldSince,distance:state.distance,reason:contextLost?'context-lost':world.streamer?.error||'road-coverage'});if(streamStallEvents.length>128)streamStallEvents.shift();}}else{streamWaitMs+=performance.now()-streamHoldSince;const event=streamStallEvents.at(-1);if(event){event.end=performance.now();event.durationMs=event.end-event.start;}}}
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;holdRoad(true);sound.pause();});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;});

let testControls:InputState|undefined;let hardDetents=false;let lastControls:InputState={gas:false,brake:false,steer:0};let usedExternalControls=false;
const highSpeedPace=import.meta.env.DEV?selectedPace(new URLSearchParams(location.search).get('pace')):DEFAULT_PACE;
let bridgeInspection=false;let cameraHeading=0; let scenicDriftBlend=0;let scenicWeight=0;let initialized=false; let elapsed=0; let frames=0;
const history=new RecentDrivingHistory();
let telemetry=stage?new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined):undefined;
let inspectionView:'front'|'side'|'cockpit'|undefined;
let wheelContacts:(TireContact & {point:number[]})[]=[];
const tireEffects=new TireEffects(world.scene),dustEffects=new TireEffects(world.scene,'dust'),impactSparks=new ImpactSparks(world.scene);
const carBounds=new THREE.Box3().setFromObject(world.car).getSize(new THREE.Vector3()),guardrail=new GuardrailContact(carBounds.x/2,carBounds.z/2,world.boundaries),sparkOrigin=new THREE.Vector3(),trafficImpact=new TrafficImpact(),trafficSparks=new ImpactSparks(world.scene,true),trafficSparkOrigin=new THREE.Vector3();
const brakeLights=world.car.userData.brakeLights as BrakeLightController;
const exhaustEffects=new ExhaustEffects(world.car);
let pendingExhaustRpm=0;
const rockContact=new RockContact(world.rockSections,world.halfAt,carBounds.x/2,carBounds.z/2,d=>world.streamer?.roadReady(d)??true);
const cones=trip&&!roadLockMode&&trip.revision>=5?new RoadCones(world.sample,world.halfAt,world.scene,trip.seed,world.length,d=>world.streamer?.roadReady(d)??true):undefined;
const triangles=trip&&!roadLockMode&&trip.revision>=6?new RoadCones(world.sample,world.halfAt,world.scene,trip.seed,world.length,d=>world.streamer?.roadReady(d)??true,world.breakdowns):undefined;
const traffic=trip&&!roadLockMode?new Traffic(world.scene,world.sample,world.halfAt,world.length,trip.seed,d=>world.streamer?.roadReady(d)??true,world.breakdowns,world.junction):undefined;
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
function refreshImmersiveUI(){
  const help=immersive.needsIPhoneHelp,installedIPhone=immersive.isIPhone&&immersive.installed;
  $('fullscreen').textContent=help?'Fullscreen help':immersive.active?'Exit fullscreen':installedIPhone?'App mode':'Fullscreen';
  $('fullscreen').hidden=installedIPhone;
  const labButton=document.getElementById('l2-fullscreen');
  if(labButton){labButton.textContent=help?'Fullscreen help':'Fullscreen';labButton.hidden=installedIPhone;}
  $('rotate-fullscreen').hidden=help||installedIPhone;
  $('rotate-iphone-hint').hidden=!help;
  $('rotate-immersive-error').textContent=immersive.message;
  $('rotate-immersive-error').hidden=!immersive.message||help;
  $('immersive-note').textContent=immersive.message;
  $('immersive-note').hidden=!immersive.message||help;
}
const immersive=new Immersive($('app'),refreshImmersiveUI);
let swapped=readSwapped();
let refreshPhotoFolder=()=>{};
function applyLayout(){ $('touch').classList.toggle('swapped',swapped); ($('swap') as HTMLInputElement).checked=swapped; }
applyLayout();
function landscapeReady(){return matchMedia('(orientation:landscape)').matches;}
function refreshPortraitLaunchUi(){
  if(!playerUi)return;
  const available=immersive.canAutoLandscape;
  const button=$('rotate-launch') as HTMLButtonElement;
  button.hidden=!available||autoLaunchArmed||brickCompleted;
  button.disabled=autoLaunchArmed;
  const instruction=$('rotate-instruction');
  instruction.hidden=autoLaunchArmed;
  const hint=available?'點擊下方按鈕，即可切換橫向並開始駕駛。':'請將手機轉為橫向，即可開始駕駛。';
  if(instruction.textContent!==hint)instruction.textContent=hint;
  const status=$('rotate-launch-status');
  status.hidden=!autoLaunchArmed;
  if(autoLaunchArmed){
    const message=autoLaunchNeedsManual?'無法自動旋轉，請手動橫放手機，準備好就會自動出發。':
      world.streamer&&!world.streamer.ready?'道路準備中，完成後自動出發…':'正在切換成橫向…';
    if(status.textContent!==message)status.textContent=message;
  }
}
function updatePlayerUi(){
  if(!playerUi)return;
  refreshPortraitLaunchUi();
  const panel=$('player-start'),show=mode!=='playing'&&mode!=='countdown'&&!settingsOpen&&!(mode==='paused'&&!brickCompleted);
  document.documentElement.dataset.driveMode=mode;
  panel.hidden=!show;
  startupArt.hidden=mode==='playing'||mode==='countdown'||(mode==='paused'&&!brickCompleted)||(elapsed>0&&world.streamer?.ready!==false);
  if(!show)return;
  const title=brickCompleted?'旅程完成':elapsed>0?'暫停中':'極速漫遊';
  const subtitle=brickCompleted?'下一段旅程，等你出發':elapsed>0?'準備好了就繼續出發':'公路冒險';
  if($('player-title').textContent!==title)$('player-title').textContent=title;
  if($('player-subtitle').textContent!==subtitle)$('player-subtitle').textContent=subtitle;
  const play=$('player-play'),label=autoLaunchArmed||streamStartRequested?'即將出發…':brickCompleted?'再跑一次':elapsed>0?'繼續駕駛':'開始駕駛';
  if(play.textContent!==label)play.textContent=label;
  $('player-restart').hidden=elapsed===0&&!brickCompleted;
  $('player-new-route').hidden=!brickCompleted;
  $('player-install-guide').hidden=true;
  const soundLabel=muted?'音效關':'音效開';
  if($('player-sound').textContent!==soundLabel)$('player-sound').textContent=soundLabel;
  const loading=$('player-loading');
  const preparing=!!world.streamer&&!world.streamer.ready;
  if(!preparing)preparationSince=performance.now();
  const slow=preparing&&performance.now()-preparationSince>45000;
  (play as HTMLButtonElement).disabled=preparing||autoLaunchArmed;
  $('player-retry').hidden=!slow&&!world.streamer?.error;
  loading.hidden=!preparing&&!world.streamer?.error;
  if(!loading.hidden){const message=world.streamer?.error?'道路載入失敗，請重試。':slow?'道路準備時間較長，請稍候或重新載入。':'道路準備中…';if(loading.textContent!==message)loading.textContent=message;}
}
function ui(){ tripPauseDock?.update(!!trip&&mode==='paused'&&!brickCompleted&&!settingsOpen,muted,l2UI?.reviewExpanded??false);$('preferences').classList.toggle('trip-settings-drawer',!!trip&&mode==='paused'&&settingsOpen); $('drive-hud').hidden=$('route-name').hidden=(mode!=='playing'&&mode!=='countdown')||settingsOpen; const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);$('menu').hidden=!!brick||mode!=='menu'||settingsOpen; $('paused').hidden=!!brick||mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',(mode==='playing'||mode==='countdown')&&!settingsOpen);$('photo-button').hidden=(mode!=='playing'&&!(trip&&params.get('qa')==='1'&&mode==='paused'))||settingsOpen; $('ready-countdown').hidden=mode!=='countdown';$('pause').textContent=playerUi?(mode==='playing'?'Ⅱ 暫停':'☰ 選單'):(mode==='playing'?'Ⅱ Menu':'☰ Menu');if(mode!=='playing'&&mode!=='countdown'&&!settingsOpen)refreshPhotoFolder(); updatePlayerUi(); }
function start(){if(sceneInspector?.isOpen)sceneInspector.close();l2UI?.setReviewExpanded(false);tripPauseDock?.collapse();void sound.unlock().catch(()=>{});if(world.streamer&&!world.streamer.ready){streamStartRequested=true;const status=document.getElementById('stream-status');if(status)status.textContent=world.streamer.error?`Scene preparation failed: ${world.streamer.error}`:'Preparing the road…';return;}streamStartRequested=false;const status=document.getElementById('stream-status');if(status)status.textContent='';state.appliedSteer=state.steerFrom=state.steerTo=state.steerTime=0;const resume=!!stage&&mode==='paused'&&elapsed>0&&!brickCompleted;mode=resume?'countdown':'playing';if(resume){readyUntil=performance.now()+1000;sound.pause();pad.neutralize();}settingsOpen=false;input.clear();ui();renderer.domElement.focus({preventScroll:true});}
function pause(){if(l2UI?.feedbackOpen)return;if(sceneInspector?.isOpen){sceneInspector.close();ui();return;}if(mode==='paused'){start();return;}l2UI?.setReviewExpanded(false);tripPauseDock?.collapse();mode='paused';input.clear();pad.neutralize();sound.pause();ui();if(!mobile())(trip?tripPauseDock?.resumeButton:document.getElementById(playerUi?'player-play':brick?(l2||pilot?'l2-play':'brick-play'):'resume'))?.focus();}
function restart(){tripPauseDock?.collapse();l2UI?.setReviewExpanded(false);preparationSince=performance.now();sound.pause();sound.resetPassBy();brakeLights.reset();exhaustEffects.reset();pendingExhaustRpm=0;traffic?.reset();cones?.reset();triangles?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();history.clear();if(stage)reportArea.hidden=true;if(stage)telemetry=new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined);usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};l2UI?.reset();world.car.userData.motion.reset();state=createState();if(brick){state.distance=BRICK_START;state.speed=brick.entrySpeed/3.6;testControls=undefined;brickCompleted=false;}advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading; elapsed=0; initialized=false;if(world.streamer){mode='paused';input.clear();sound.pause();world.streamer.update(state.distance);ui();}start();}
$('player-retry').onclick=()=>location.reload();
$('player-play').onclick=()=>document.getElementById('l2-play')?.click();
$('player-restart').onclick=()=>document.getElementById('l2-replay')?.click();
$('player-new-route').onclick=()=>document.getElementById('l2-next')?.click();
$('player-options').onclick=()=>document.getElementById('l2-settings')?.click();
$('player-sound').onclick=()=>document.getElementById('l2-sound')?.click();
$('player-install-guide').onclick=()=>{$('player-install-help').hidden=!$('player-install-help').hidden;};
$('drive').onclick=()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();start();};
$('resume').onclick=start; $('pause').onclick=pause; $('restart').onclick=restart;
$('fullscreen').onclick=()=>{input.clear();if(immersive.needsIPhoneHelp){const hint=$('iphone-fullscreen-hint'),labHint=document.getElementById('l2-iphone-fullscreen-hint'),show=hint.hidden&&(!labHint||labHint.hidden);hint.hidden=!show;if(labHint)labHint.hidden=!show;return;}void immersive.toggle();};
$('rotate-launch').onclick=()=>{
  if(!playerUi||autoLaunchArmed||!immersive.canAutoLandscape||brickCompleted)return;
  autoLaunchArmed=true;autoLaunchNeedsManual=false;
  // Both calls happen synchronously in the real tap handler, before any await.
  // Fullscreen requires transient user activation; loading finishes separately.
  void sound.unlock().catch(()=>{});
  void immersive.enter().then(()=>{
    if(autoLaunchArmed&&!landscapeReady()){autoLaunchNeedsManual=true;refreshPortraitLaunchUi();}
  }).catch(()=>{
    if(autoLaunchArmed){autoLaunchNeedsManual=true;refreshPortraitLaunchUi();}
  });
  refreshPortraitLaunchUi();
};
$('rotate-fullscreen').onclick=()=>{input.clear();void immersive.enter();};
$('rotate-pause').onclick=()=>{if(mode==='menu')start();else pause();};
$('sound').onclick=()=>{muted=!muted;void sound.unlock().catch(()=>{});sound.setMuted(muted);$('sound').textContent=playerUi?(muted?'音效關':'音效開'):(muted?'Sound off':'Sound on');$('sound').setAttribute('aria-pressed',String(!muted));ui();};
$('settings').onclick=()=>{if(mode==='playing')mode='paused';l2UI?.setReviewExpanded(false);tripPauseDock?.collapse();settingsOpen=true;input.clear();sound.pause();ui();if(!mobile())$('close-settings').focus();};
$('close-settings').onclick=()=>{settingsOpen=false;ui();if(!mobile())(trip&&mode==='paused'?tripPauseDock?.moreButton:document.getElementById(playerUi?'player-options':pilot||l2?'l2-settings':brick?'brick-settings':'settings'))?.focus();};
$('swap').onchange=()=>{swapped=($('swap') as HTMLInputElement).checked;saveSwapped(swapped);applyLayout();};
function toggleSceneQa(){
 if(!sceneInspector||l2UI?.feedbackOpen)return;
 if(sceneInspector.isOpen)sceneInspector.close();
 else{tripPauseDock?.collapse();l2UI?.setReviewExpanded(false);settingsOpen=false;sceneInspector.open();}
 ui();
}
addEventListener('keydown',e=>{
  if(e.isComposing||e.repeat||l2UI?.feedbackOpen)return;
  if(settingsOpen&&e.code==='Escape'){e.preventDefault();$('close-settings').click();return;}
  if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(e.code==='KeyQ'&&sceneInspector){e.preventDefault();toggleSceneQa();return;}
  if(e.code==='Escape'&&sceneInspector?.isOpen){e.preventDefault();toggleSceneQa();return;}
  if(e.code==='Escape'&&mode==='paused'&&l2UI?.reviewExpanded){e.preventDefault();l2UI.setReviewExpanded(false);ui();tripPauseDock?.moreButton.focus();return;}
  if(e.code==='Escape'&&mode==='paused'&&tripPauseDock?.isExpanded){e.preventDefault();tripPauseDock.collapse();ui();return;}
  if(e.code==='F8'&&(mode==='playing'||(trip&&params.get('qa')==='1'&&mode==='paused'))&&!settingsOpen){e.preventDefault();capturePhoto();return;}
  if(e.code==='Escape'){e.preventDefault();if(settingsOpen){$('close-settings').click();return;}pause();return;}
  if(settingsOpen)return;
  if((mode==='playing'||brickCompleted)&&l2UI&&(e.code==='KeyG'||e.code==='KeyI')){e.preventDefault();l2UI.openQuick(e.code==='KeyG'?'praise':'issue','keyboard');return;}
  if(mode==='playing'){if(e.code==='KeyP'){e.preventDefault();pause();}else if(e.code==='KeyR'){e.preventDefault();restart();}return;}
  if(trip&&mode==='paused'){
   const direct:Record<string,()=>void>={KeyP:start,KeyR:restart,KeyN:()=>{$('l2-next').click();},KeyV:()=>{if(tripPauseDock&&!tripPauseDock.reviewButton.hidden)tripPauseDock.reviewButton.click();},KeyC:()=>{$('settings').click();},KeyM:()=>{$('sound').click();},KeyF:()=>{$('fullscreen').click();},KeyE:()=>{l2UI?.exportCurrent();}};
   if(direct[e.code]){e.preventDefault();direct[e.code]();return;}
  }
  const prefix=pilot||l2?'l2':brick?'brick':'';
  const action:Record<string,string>={KeyP:playerUi?'player-play':prefix?`${prefix}-play`:mode==='menu'?'drive':'resume',KeyR:playerUi?'player-restart':prefix?`${prefix}-replay`:'restart',KeyN:playerUi?'player-new-route':`${prefix}-next`,KeyB:`${prefix}-prev`,KeyC:playerUi?'player-options':prefix?`${prefix}-settings`:'settings',KeyM:playerUi?'player-sound':prefix?`${prefix}-sound`:'sound',KeyF:prefix?`${prefix}-fullscreen`:'fullscreen',KeyE:`${prefix}-export`};
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
  if(mode==='playing'&&!settingsOpen){world.streamer?.update(state.distance);if(contextLost||(world.streamer&&!world.streamer.canDrive(state.distance,Math.max(0,state.speed)*effectivePace(state.speed,highSpeedPace)+5,dt))){holdRoad(true);sound.pause();return false;}holdRoad(false);}

  input.update(dt);
  if(mode==='playing'&&!settingsOpen){const beforeDistance=state.distance,beforeLateral=state.lateral;const external=override??(import.meta.env.DEV?testControls:undefined),controls=external??{...input.snapshot(),rawSteer:input.steeringTarget};lastControls={...controls};usedExternalControls=!!external;if(import.meta.env.DEV&&hardDetents){const q=quantizeSteering(controls.steer,state.effectiveSteer);state.appliedSteer=q;state.steerFrom=q;state.steerTo=q;state.steerTime=1;}const road=world.sample(state.distance),previousGear=state.gear,previousRpm=state.rpm;step(state,controls,dt,road.curvature,highSpeedPace,world.halfAt,road.tangent.y/Math.hypot(road.tangent.x,road.tangent.z),-Math.atan(road.right.y));
 // The selected five-lane merge moves the road frame right; moving the car
 // left by the exact delta keeps the four old lanes physically stationary.
 if(world.junction)state.lateral-=interchangeCenterOffset(world.junction,state.distance)-interchangeCenterOffset(world.junction,beforeDistance);
 if(isHighRevUpshift(previousGear,state.gear,controls.gas,controls.brake,previousRpm))pendingExhaustRpm=Math.max(pendingExhaustRpm,previousRpm);trafficImpact.update(state,dt,world.halfAt(state.distance));if(cones?.update(elapsed+dt,state.distance,state.lateral,state.speed,{distance:beforeDistance,lateral:beforeLateral},carBounds.x/2)){state.speed*=.995;sound.coneHit(state.speed);}if(triangles?.update(elapsed+dt,state.distance,state.lateral,state.speed,{distance:beforeDistance,lateral:beforeLateral},carBounds.x/2)){state.speed*=.995;sound.coneHit(state.speed);}traffic?.update(elapsed+dt,state.distance,state.lateral,state.speed*effectivePace(state.speed,highSpeedPace));const collision=traffic?.hit(elapsed+dt,state,{distance:beforeDistance,lateral:beforeLateral},dt,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw);if(collision){trafficImpact.kick(state,collision);sound.impact(collision.severity,'vehicle');const contact=world.sample(collision.distance);trafficSparkOrigin.copy(contact.position).addScaledVector(contact.right,collision.lateral);trafficSparkOrigin.y+=.65;trafficSparks.burst(elapsed+dt,trafficSparkOrigin,contact.right,contact.tangent,collision.severity);}const impact=guardrail.update(state,beforeDistance,beforeLateral,dt,!!trip&&trip.seed===1);if(impact)sound.impact(impact);const rockHit=rockContact.update(state,{distance:beforeDistance,lateral:beforeLateral},dt);if(rockHit){sound.impact(rockHit.severity,'vehicle');const rockFrame=world.sample(rockHit.distance);sparkOrigin.copy(rockFrame.position).addScaledVector(rockFrame.right,rockHit.lateral);sparkOrigin.y+=.8;impactSparks.burst(elapsed+dt,sparkOrigin,rockFrame.right,rockFrame.tangent,rockHit.severity);}updateFootprint(state,world.halfAt(state.distance));world.car.userData.motion.advance(state.distance-beforeDistance,state.appliedSteer,dt);elapsed+=dt;if(stage&&telemetry)telemetry.observe({t:elapsed,s:state.distance-BRICK_START,brake:controls.brake,gas:controls.gas,offRoad:state.offRoad,steer:state.appliedSteer,gear:state.gear});if(l2UI&&history.due(elapsed))history.record(feedbackAnchor());if(stage&&telemetry?.due(elapsed)){const w=pilotWeights(stage,state.distance),worldName=(['coast','canyon','city'] as const)[w.indexOf(Math.max(...w))],beat=trip?(trip.beats.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.id??`L3-${trip.buffers.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.role??'finish'}`):(stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats.at(-1)!.id);telemetry.record({t:elapsed,s:state.distance-BRICK_START,speed:state.speed*3.6,gear:state.gear,rpm:state.rpm,gas:controls.gas,brake:controls.brake,steer:state.appliedSteer,rawSteer:controls.rawSteer??controls.steer,curvature:road.curvature,requiredSteer:state.requiredSteer,grade:state.grade,halfWidth:world.halfAt(state.distance),lanes:pilotSample(stage,state.distance).lanes,active:pilotSample(stage,state.distance).active.map(p=>p.id),roadX:state.lateral,offRoad:state.offRoad,world:worldName,beat,input:external?'scripted':inputMode});}sound.update(state.speed,state.slip,controls.gas&&!controls.brake,dt,state,trafficImpact.slide,traffic?.skidIntensity??0);sound.passBy(elapsed,state.distance,state.lateral,carBounds.x/2*Math.abs(Math.cos(state.heading))+carBounds.z/2*Math.abs(Math.sin(state.heading)),traffic?.audioActors()??[],collision?.actorId);if(brick&&state.distance>=BRICK_START+brick.length){if(l2UI){const finish=feedbackAnchor();history.record(finish,true);l2UI.complete(finish);}brickCompleted=true;mode='paused';input.clear();testControls=undefined;sound.pause();if(telemetry){telemetry.save();showDriveReport();}ui();if(!mobile())(document.getElementById(l2||pilot?'l2-play':'brick-play') as HTMLElement|null)?.focus();}}else sound.pause();
}
function groundHeight(height:number,lateral:number){
  if(brick)return height+(Math.abs(lateral)>world.halfAt(state.distance)?-.1:0);
  if(lateral < -13)return THREE.MathUtils.lerp(height-.1,-5.05,Math.min(1,(-lateral-13)/14));
  if(lateral>13)return height-.12-Math.min(1,(lateral-13)/62)*2.88;
  return height+(Math.abs(lateral)>world.half?-.1:0);
}
function render(dt:number,draw=true){
  blenderAsset?.update(elapsed);
  const p=world.sample(state.distance);
  world.car.position.copy(p.position).addScaledVector(p.right,state.lateral);
  world.car.position.y=groundHeight(p.position.y,state.lateral)+p.right.y*state.lateral+.04;
  world.car.rotation.set(-Math.atan2(p.tangent.y*Math.cos(state.heading),Math.hypot(p.tangent.x,p.tangent.z)),-p.roadHeading-state.heading-guardrail.yaw-trafficImpact.yaw-rockContact.yaw,THREE.MathUtils.clamp(-state.slipAngle*.12,-.055,.055)+guardrail.roll+trafficImpact.roll+rockContact.roll+state.weightRoll);
  if(p.right.y!==0){
    // Grade remains a handling input from the unchanged centerline. Only pose uses cross-slope.
    const grade=p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),cross=p.right.y;
    const slopeChange=(world.sample(state.distance+.5).right.y-world.sample(state.distance-.5).right.y)*state.lateral;
    world.car.rotation.x=-Math.atan((grade+slopeChange)*Math.cos(state.heading)+cross*Math.sin(state.heading));
    world.car.rotation.z+=Math.atan(-cross*Math.cos(state.heading));
  }
  const travelHeading=p.roadHeading;
  if(!initialized){cameraHeading=travelHeading;scenicDriftBlend=0;initialized=true;}
  else cameraHeading+=angleDifference(travelHeading-cameraHeading)*(1-Math.exp(-dt*7));
  // Anchor translation to the car. World-position lerp would add v/tau trailing
  // distance and recreate a speed-dependent dolly despite a constant target offset.
  const targets=chaseTargets(world.car.position,cameraHeading,camera.aspect,p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z));
  scenicWeight=0;
  if(scenicCameraEnabled){
    scenicDriftBlend=blendScenicDrift(scenicDriftBlend,scenicDriftTarget(state),dt);
    scenicWeight=applyScenicCamera(targets,p.right,state.distance,CANYON_SCENIC_ZONES,scenicDriftBlend);
  }
  camera.position.copy(targets.eye);camera.lookAt(targets.look);
  if(import.meta.env.DEV&&inspectionView){
    world.car.updateMatrixWorld(true);
    const offset=inspectionView==='front'?new THREE.Vector3(3,2.7,6):inspectionView==='side'?new THREE.Vector3(6,2.8,0):new THREE.Vector3(0,5.8,-2.3);
    camera.position.copy(world.car.localToWorld(offset));camera.lookAt(world.car.localToWorld(new THREE.Vector3(0,.8,0)));
  }
  if(import.meta.env.DEV&&bridgeInspection){const q=world.sample(state.distance);camera.position.copy(q.position).addScaledVector(q.right,140).addScaledVector(q.tangent,-100).add(new THREE.Vector3(0,18,0));camera.lookAt(q.position.clone().add(new THREE.Vector3(0,-7,0)));}
  const worldStart=perfEnabled?performance.now():0;world.update(elapsed,state.speed,state.slip,state.distance);if(perfEnabled)worldTotal+=performance.now()-worldStart;if(!draw)return;cones?.update(elapsed,state.distance,state.lateral,state.speed);triangles?.update(elapsed,state.distance,state.lateral,state.speed);traffic?.update(elapsed,state.distance,state.lateral,state.speed*effectivePace(state.speed,highSpeedPace),camera,renderer.domElement.height);const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);refreshHints();world.car.userData.motion.render();const rayStart=perfEnabled?performance.now():0;groundWheels();sound.surface(state.speed,mode==='playing'?wheelContacts.filter(c=>c.onRoad===false&&c.surface&&c.gap!==null&&Math.abs(c.gap)<.12).length:0,dt);tireEffects.update(elapsed,state.speed,sound.skidFeedback.intensity,wheelContacts,renderer.domElement.height*camera.projectionMatrix.elements[5]/2);if(wheelContacts.some(c=>c.onRoad===false&&!!c.surface))dustEffects.setDustTint(world.weightsAt(state.distance));dustEffects.update(elapsed,state.speed,0,wheelContacts,1);sparkOrigin.copy(p.position).addScaledVector(p.right,world.boundaries?guardrail.contactEdge:CANYON_BEND.railOffset);sparkOrigin.y+=.9;impactSparks.update(elapsed,sparkOrigin,p.right,p.tangent,guardrail.flash>0?guardrail.strength:0);trafficSparks.update(elapsed,trafficSparkOrigin,p.right,p.tangent,trafficImpact.flash>0?(trafficImpact.event?.severity??0):0);brakeLights.set(mode==='playing'&&lastControls.brake);if(pendingExhaustRpm>0&&mode==='playing')exhaustEffects.burst(elapsed,pendingExhaustRpm);pendingExhaustRpm=0;exhaustEffects.update(elapsed,mode==='playing');const renderStart=perfEnabled?performance.now():0;if(perfEnabled)raycastTotal+=renderStart-rayStart;renderer.render(world.scene,camera);if(perfEnabled)renderTotal+=performance.now()-renderStart;frames++;
  $('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');
  const speedBand=state.speed*3.6>=300?'redline':state.speed*3.6>=240?'fast':'cruise';if($('speed').dataset.band!==speedBand)$('speed').dataset.band=speedBand;
  $('speed-needle').setAttribute('transform',`rotate(${needleAngle(state.speed*3.6)} 100 100)`);$('gear').textContent=`G${state.gear}`;
  $('status').textContent=playerUi?(state.offRoad?'偏離路面 · 請回正':state.slip>.2?'過彎中 · 穩住方向':mode==='playing'?'保持路線':'準備出發'):(state.offRoad?'OFF ROAD · STEER BACK':state.slip>.2?'CORNERING · HOLD YOUR LINE':mode==='playing'?'STEER YOUR OWN LINE':'READY FOR THE COAST');
}
let photoStatusTimer=0;
const photos=new PhotoCapture(renderer.domElement,()=>render(0),()=>{const p=world.sample(state.distance);return {stageCode:stage?.stageCode??'FREE',seed:stage?.seed??0,capturedAt:new Date().toISOString(),time:elapsed,distance:state.distance,speed:state.speed*3.6,steer:state.appliedSteer,grade:state.grade,roadX:state.lateral,halfWidth:world.halfAt(state.distance),carPosition:world.car.position.toArray(),carRotation:[world.car.rotation.x,world.car.rotation.y,world.car.rotation.z],roadPosition:p.position.toArray(),surfaceGap:surfaceError(),wheels:wheelContacts};},message=>{$('photo-status').textContent=message;$('photo-status').hidden=false;clearTimeout(photoStatusTimer);photoStatusTimer=window.setTimeout(()=>{$('photo-status').hidden=true;},message==='📸 Saved'?2000:7000);});
function capturePhoto(){if(settingsOpen||l2UI?.feedbackOpen||mode==='countdown')return;const meta=photos.capture();if(meta){telemetry?.mark('photo',elapsed,state.distance-BRICK_START,meta);}}
$('photo-button').onclick=capturePhoto;
const pad=new GamepadInput(input,action=>{
 if(action==='qa'){toggleSceneQa();return;}
 if(trip&&mode==='paused'&&l2UI?.reviewExpanded&&action==='back'){l2UI.setReviewExpanded(false);ui();tripPauseDock?.moreButton.focus();return;}
 if(trip&&mode==='paused'&&tripPauseDock?.isExpanded&&action==='back'){tripPauseDock.collapse();ui();tripPauseDock.moreButton.focus();return;}
 if(sceneInspector?.isOpen&&['confirm','back','pause','up','down','left','right'].includes(action)&&sceneInspector.control(action as 'confirm'|'back'|'pause'|'up'|'down'|'left'|'right'))return;
 if(action==='fullscreen'){void immersive.toggle();return;}
 if(l2UI?.feedbackOpen){l2UI.control(action);return;}
 if(action==='photo'){capturePhoto();return;}
 if(action==='issue'){if(mode==='playing'||brickCompleted){l2UI?.openQuick('issue','gamepad');l2UI?.control('issue');}return;}
 if(action==='praise'){if(mode==='playing'||brickCompleted)l2UI?.openQuick('praise','gamepad');return;}
 if(action==='pause'){if(settingsOpen||l2UI?.feedbackOpen||mode==='countdown')return;if(mode==='menu'||brickCompleted)restart();else {const wasDriving=mode==='playing';pause();if(wasDriving&&sceneInspector)sceneInspector.toggle.focus();}return;}
 if(action==='back'){if(l2UI?.feedbackOpen)document.getElementById('l2-feedback-cancel')?.click();else if(settingsOpen)$('close-settings').click();else if(mode==='playing')pause();return;}
 if(mode==='playing')return;
 const scope=(l2UI?.feedbackOpen?document.getElementById('l2-feedback-dialog'):settingsOpen?$('preferences'):trip&&mode==='paused'&&!brickCompleted?(l2UI?.reviewExpanded?document.getElementById('l2-lab'):tripPauseDock?.element):playerUi?$('player-start'):document.getElementById(pilot||l2?'l2-lab':brick?'brick-lab':mode==='menu'?'menu':'paused'));
 if(!scope)return;
 const items=Array.from(scope.querySelectorAll<HTMLElement>('button,a,input,select')).filter(x=>x.offsetParent!==null&&!x.hasAttribute('disabled'));
 if(sceneInspector&&!settingsOpen)items.unshift(sceneInspector.toggle);
 if(action==='confirm'){const active=document.activeElement as HTMLElement;if(items.includes(active))active.click();else items[0]?.focus();return;}
 const index=items.indexOf(document.activeElement as HTMLElement),delta=action==='up'?-1:1;items[(index<0?0:(index+delta+items.length)%items.length)]?.focus();
},()=>setInputMode('gamepad'),()=>{if(inputMode==='gamepad')setInputMode(mobile()?'touch':'keyboard');});
const perfEnabled=import.meta.env.DEV&&params.get('perf')==='1'&&!playerUi;
const perf={fps:0,startupMs:0,raycastMs:0,renderMs:0,worldMs:0,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled};
let perfFrames=0,perfSince=performance.now(),raycastTotal=0,renderTotal=0,worldTotal=0;
const perfPanel=perfEnabled?document.createElement('pre'):undefined;
if(perfPanel){perfPanel.id='perf';perfPanel.style.cssText='position:fixed;left:8px;top:50px;z-index:100;pointer-events:none;background:#102a35dd;color:white;padding:8px;font:12px monospace';document.getElementById('app')!.append(perfPanel);}
const streamHudEnabled=params.get('streamhud')==='1'&&!playerUi&&(import.meta.env.DEV||params.get('qa')==='1');
const streamDiagnosticMode=(params.get('streamdiag')==='1'||streamHudEnabled)&&!playerUi;
const streamLog:unknown[]=[];
let streamSampleAt=0,streamSampleDistance=state.distance;let observedWorldTravelSpeedMps:number|null=null;
const diagnosticSnapshot=()=>{const started=performance.now(),stream=world.streamer?.stats;const row={build:'S1-stream-diagnostics',schemaVersion:2,observedWorldTravelSpeedMps,travelSampleAt:streamSampleAt,unheldTravelSpeedMps:state.speed*effectivePace(state.speed,highSpeedPace),trip:trip?.tripCode,wall:performance.now(),elapsed,distance:state.distance,speed:state.speed,fps:perf.fps,held:streamHeld,stalls:streamStalls,waitMs:streamWaitMs+(streamHeld?performance.now()-streamHoldSince:0),contextLost,stallEvents:streamStallEvents.map(e=>({...e,durationMs:e.durationMs??performance.now()-e.start})),lifecycle:world.streamer?.diagnosticsSnapshot(state.speed*effectivePace(state.speed,highSpeedPace)),draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,programs:renderer.info.programs?.length??null,gpuMemoryBytes:null,memory:{...renderer.info.memory,heap:(performance as any).memory?.usedJSHeapSize??null,heapLimit:(performance as any).memory?.jsHeapSizeLimit??null},stream:stream?{...stream,history:[...stream.history.filter(h=>h.kind.endsWith('-cpu')||h.kind==='worker-wall').slice(-12),...stream.history.filter(h=>!h.kind.endsWith('-cpu')&&h.kind!=='worker-wall').slice(-18)]}:null};return {...row,snapshotCpuMs:performance.now()-started};};
const exportStreamLog=()=>{
  const payload={samples:streamLog,latest:diagnosticSnapshot(),workerHistory:world.streamer?.stats.history};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='outrun-stream-diagnostics.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const streamPanel=streamDiagnosticMode&&!streamHudEnabled?document.createElement('div'):undefined;
if(streamPanel){
  streamPanel.id='stream-diagnostics';
  streamPanel.style.cssText='position:fixed;top:48px;left:8px;z-index:151;background:#102a35dd;color:white;padding:6px;font:11px monospace;max-width:70vw';
  const text=document.createElement('pre'),button=document.createElement('button');
  text.id='stream-diagnostic-text';button.textContent='Export stream log';button.onclick=exportStreamLog;
  streamPanel.append(text,button);document.getElementById('app')!.append(streamPanel);
}
const streamHud=streamHudEnabled?new StreamHealthHud($('app'),exportStreamLog):undefined;
if(streamDiagnosticMode)(window as any).__streamDiagnostics={snapshot:diagnosticSnapshot,exportJson:exportStreamLog};
function recordStreamDiagnostics(now:number){if(!streamDiagnosticMode||now-streamSampleAt<1000)return;observedWorldTravelSpeedMps=streamSampleAt&&state.distance>=streamSampleDistance?(state.distance-streamSampleDistance)*1000/(now-streamSampleAt):null;streamSampleAt=now;streamSampleDistance=state.distance;const row=diagnosticSnapshot();const {records:omittedRecords,...sampleLifecycle}=row.lifecycle??{};streamLog.push({...row,lifecycle:sampleLifecycle});if(streamLog.length>900)streamLog.shift();const c=row.stream;
  if(streamPanel)$('stream-diagnostic-text').textContent='S1 · '+Math.round(row.distance)+'m · '+Math.round(row.elapsed)+'s\nRoad '+c?.currentRoad+' / next '+c?.nextRoad+' · stalls '+row.stalls+'\nqueue '+c?.queued+' / retire '+c?.retiring+' · retries '+c?.retries+'\n'+(c?.fatal||c?.pending?.kind||'ready');
  if(streamHud){
    const lifecycle=row.lifecycle,desired=new Set(c?.desired??[]),near=lifecycle?.nearby??[];
    streamHud.update({
      roadReady:c?.chunks.filter(chunk=>desired.has(chunk.index)&&chunk.road==='ready').length??0,
      roadDesired:desired.size,
      sceneryReady:near.filter(chunk=>chunk.scenery==='ready').length,
      sceneryNearby:near.length,
      roadAheadM:lifecycle?.roadAheadM??0,
      roadHeadroomSeconds:lifecycle?.roadHeadroomSeconds??null,
      atRouteEnd:world.length-row.distance<=(lifecycle?.roadAheadM??0)+1,
      roadP95Ms:lifecycle?.distributions?.road?.workerCpuMs?.p95??null,
      roadSampleCount:lifecycle?.distributions?.road?.workerCpuMs?.count??0,
      workerPending:c?.pending?.kind??null,
      workerAgeMs:c?.pending?.ageMs??null,
      roadsUnrequested:lifecycle?.queues?.roadUnrequested??0,
      sceneryUnrequested:lifecycle?.queues?.sceneryUnrequested??0,
      commitQueue:(lifecycle?.queues?.road??0)+(lifecycle?.queues?.scenery??0),
      retireQueue:lifecycle?.queues?.retirement??0,
      heapUsedBytes:row.memory.heap,heapLimitBytes:row.memory.heapLimit,
      geometries:row.memory.geometries,textures:row.memory.textures,
      fps:row.fps,stalls:row.stalls,
    });
  }
}
let last=performance.now();
function loop(now:number){
  if(streamStartRequested&&world.streamer){if(world.streamer.ready)start();else if(world.streamer.error){const status=document.getElementById('stream-status');if(status)status.textContent=`Scene preparation failed: ${world.streamer.error}`;streamStartRequested=false;}}
  if(autoLaunchArmed&&(mode==='playing'||mode==='countdown'))autoLaunchArmed=false;
  if(autoLaunchArmed&&!document.hidden&&landscapeReady()&&!settingsOpen&&(!world.streamer||world.streamer.ready)){
    autoLaunchArmed=false;autoLaunchNeedsManual=false;
    // Same start/restart behavior as the existing Play button, minus a second tap.
    if(mode==='menu'||brickCompleted)restart();else start();
  }
  pad.poll(mode==='playing'&&!settingsOpen,!!l2UI?.feedbackOpen,brickCompleted&&!settingsOpen,sceneInspector?.isOpen??false,!!sceneInspector);
  const dt=Math.min((now-last)/1000,.25);last=now;
  const wasCounting=mode==='countdown';if(wasCounting){$('ready-countdown').textContent=`${playerUi?'準備':'READY'} ${Math.max(0,(readyUntil-now)/1000).toFixed(1)}`;if(now>=readyUntil&&!document.hidden&&document.hasFocus()){mode='playing';input.clear();pad.neutralize();ui();}}
  // Integrate elapsed time in bounded physics steps; slow rendering must not
  // turn a 65m/s drive into slow motion by discarding every frame above 50ms.
  if(!manual&&!wasCounting)for(let remaining=dt;remaining>1e-8;){const tick=Math.min(remaining,1/120);if(advance(tick)===false)break;remaining-=tick;}
  render(dt);
  sceneInspector?.refresh();
  updatePlayerUi();
  roadOverlay.hidden=(playerUi&&mode!=='playing')||!(streamHeld&&mode==='playing')&&!world.streamer?.error&&!contextLost;
  roadOverlay.textContent=playerUi?(contextLost?'畫面暫時中斷，正在恢復…':world.streamer?.error?'道路載入失敗，請重新載入。':'道路載入中…'):(contextLost?'Graphics interrupted — restoring…':world.streamer?.error?'Road loading failed. Reload to retry. '+world.streamer.error:'Preparing road…');
  recordStreamDiagnostics(now);

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
  const hudText=playerUi?`${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`:`${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')} · ${perf.fps?Math.round(perf.fps):'—'} FPS`;
  if($('drive-hud').textContent!==hudText)$('drive-hud').textContent=hudText;

  if(!manual&&mode==='playing'&&!settingsOpen)speedAudit?.record({wall:now,simulated:elapsed,progress:state.distance,speed:state.speed,position:world.car.position.toArray(),camera:camera.position.toArray(),trackLength:world.length,heading:state.worldHeading,lateral:state.lateral,pace:effectivePace(state.speed,highSpeedPace)});
  else speedAudit?.reset();
  requestAnimationFrame(loop);
}
if(brick&&!l2&&!pilot)labUI=mountBrickLab(brick,{play:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),exportMoments:()=>l2UI?.exportCurrent()});
ui();resize();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  const registerOffline=()=>{void navigator.serviceWorker.register('/sw.js').then(async()=>{await navigator.serviceWorker.ready;const cache=await caches.open('coast-drive-v09-mobile-1'),assets=[import.meta.url,roadWorkerUrl,...Array.from(startupArt.querySelectorAll<HTMLImageElement>('img'),x=>x.currentSrc||x.src),...Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),x=>x.src),...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),x=>x.href)];await cache.addAll([...new Set(assets)].filter(url=>new URL(url,location.href).origin===location.origin));}).catch(()=>{});};
  if(document.readyState==='complete')registerOffline();else addEventListener('load',registerOffline,{once:true});
}

function feedbackAnchor():FeedbackAnchor{
 const controls=usedExternalControls?lastControls:input.snapshot(),rawSteer=usedExternalControls?(lastControls.rawSteer??lastControls.steer):input.steeringTarget;
 if(!pilot&&!l2){const p=world.sample(state.distance),weights=world.weightsAt(state.distance);return {id:momentCandidate.id,revision:momentCandidate.revision,seed:momentCandidate.seed,contentFingerprint:momentCandidate.contentFingerprint,generatorVersion:momentCandidate.generatorVersion,handlingVersion:'ALB2',world:(['coast','canyon','city'] as const)[weights.indexOf(Math.max(...weights))],profiles:{course:{id:p.challenge.id,label:p.challenge.label,curvature:p.curvature}},s:brick?state.distance-BRICK_START:state.distance%world.length,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:p.position.y,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),halfWidth:world.halfAt(state.distance),laneCount:brick?brickWidth(brick,state.distance).lanes:3,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};}
 const b=(pilot??l2)!,road=pilot?pilotSample(pilot,state.distance):l2Sample(l2!,state.distance);return {id:b.id,revision:b.revision,seed:b.seed,contentFingerprint:b.contentFingerprint,generatorVersion:b.generatorVersion,handlingVersion:'ALB2',...(stage?{stageCode:stage.stageCode,...(trip?{tripCode:trip.tripCode}:{}),l2InstanceId:trip?trip.beats.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.id:(stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats[stage.beats.length-1].id),...(trip?{bufferRole:trip.buffers.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.role}:{})}:{}),world:pilot?(['coast','canyon','city'] as const)[pilotWeights(pilot,state.distance).indexOf(Math.max(...pilotWeights(pilot,state.distance)))]:b.world,profiles:pilot?structuredClone({placements:trip?[]:pilot.placements,activePlacements:pilotSample(pilot,state.distance).active,worldPhases:pilot.worldPhases}):structuredClone(l2!.profiles),s:state.distance-BRICK_START,trackDistance:state.distance,elapsedSeconds:elapsed,timestampMs:Date.now(),source:'drive',drive:{speedKmh:state.speed*3.6,steerRaw:rawSteer,steerApplied:state.appliedSteer,roadX:state.lateral,height:road.height,grade:road.grade,halfWidth:road.halfWidth,laneCount:road.lanes,offRoad:state.offRoad,gas:controls.gas,brake:controls.brake}};
}
l2UI=mountL2Lab((pilot??l2??momentCandidate)!,{play:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),capture:feedbackAnchor,history,freeze:()=>{mode='paused';input.clear();testControls=undefined;sound.pause();ui();},resume:start,onFeedback:data=>{telemetry?.mark('feedback',elapsed,state.distance-BRICK_START,data);if(brickCompleted&&telemetry){telemetry.save();showDriveReport();}}},!pilot&&!l2);
if(trip)tripPauseDock=new TripPauseDock($('app'),{
 resume:start,replay:restart,newRoute:()=>{$('l2-next').click();},
 settings:()=>{$('settings').click();},sound:()=>{$('sound').click();},
 fullscreen:()=>{$('fullscreen').click();},
 review:()=>{
  const opening=!l2UI?.reviewExpanded;
  l2UI?.setReviewExpanded(opening);tripPauseDock?.collapse();ui();
  if(!mobile())(opening?document.getElementById('l2-play'):tripPauseDock?.moreButton)?.focus();
 },
},!playerUi);
// Render a legible keycap on the action itself, following the last active input mode.
// Existing L2 shortcut text is replaced by the same badge rather than doubled.
for(const [id,key,pad] of [
 ['pause','P','OPTIONS'],['player-play','P','OPTIONS'],
 ['player-restart','R','✕'],['player-new-route','N','✕'],
 ['player-options','C','✕'],['player-sound','M','✕'],
 ['l2-play','P','OPTIONS'],['l2-replay','R','✕'],
 ['l2-next','N','✕'],['l2-settings','C','✕'],
 ['l2-sound','M','✕'],['l2-fullscreen','F','SHARE'],
 ['l2-export','E','✕'],['close-settings','Esc','○'],
]){
 const node=document.getElementById(id);
 if(node){node.dataset.keyHint=key;node.dataset.padHint=pad;}
}
for(const vote of Array.from(document.querySelectorAll<HTMLButtonElement>('#l2-lab [data-l2-vote]'))){
 vote.dataset.keyHint=({KEEP:'K',REWORK:'W',REJECT:'X'} as Record<string,string>)[vote.dataset.l2Vote!]??'';
 vote.dataset.padHint='✕';
}
const labFullscreen=document.getElementById('l2-fullscreen');
if(labFullscreen){const hint=document.createElement('p');hint.id='l2-iphone-fullscreen-hint';hint.setAttribute('role','status');hint.textContent=$('iphone-fullscreen-hint').textContent;hint.hidden=true;labFullscreen.closest('.l2-actions')?.after(hint);}
refreshImmersiveUI();
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
if(!mobile())requestAnimationFrame(()=>document.getElementById(playerUi?'player-play':pilot||l2?'l2-play':brick?'brick-play':'drive')?.focus());

if(import.meta.env.DEV){(window as any).__drive={
  driveState:()=>({...state,elapsed,mode,trackLength:world.length}),
  streamFrame:()=>({elapsed,distance:state.distance,held:streamHeld,road:world.streamer?.roadReady(state.distance)??true,cameraRoad:world.streamer?.roadReady(Math.max(0,state.distance-40))??true,safe:world.streamer?.canDrive(state.distance,state.speed*effectivePace(state.speed,highSpeedPace))??true,contextLost}),
  centerRoad:()=>{const p=world.sample(state.distance),ray=new THREE.Raycaster(p.position.clone().add(new THREE.Vector3(0,10,0)),down,0,20);return world.streamer?.raycastContacts(ray,state.distance).some(h=>Math.abs(h.point.y-p.position.y)<.08)??true;},
  carView:(view:'front'|'side'|'cockpit')=>{
    manual=true;inspectionView=view;render(1/60);
  },
  perf:()=>({...perf}),
  blenderArt:()=>blenderAsset?.stats??{status:'disabled'},
  artProbe:(distance:number,lateral=0)=>{if(!blenderAsset)return [];world.scene.updateMatrixWorld(true);const p=world.sample(distance).position.addScaledVector(world.sample(distance).right,lateral);return new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,500,0)),down,0,1000).intersectObject(blenderAsset.root,true).map(h=>({name:h.object.name,gap:h.point.y-p.y}));},
  tireEffects:()=>tireEffects.inspect(),
  railClearance:()=>{const p=world.sample(state.distance),v=new THREE.Vector3();let edge=-Infinity;world.car.updateMatrixWorld(true);world.car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(p.position);edge=Math.max(edge,v.dot(p.right));}});return CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-edge;},
  surfaceFeedback:()=>({dust:dustEffects.inspect(),guard:guardrail.inspect(state.heading),sparks:impactSparks.inspect()}),
  boundaryClearance:()=>{const p=world.sample(state.distance),right=new THREE.Vector3(p.right.x,0,p.right.z),v=new THREE.Vector3();let lo=Infinity,hi=-Infinity;world.car.updateMatrixWorld(true);world.car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(p.position);const x=v.dot(right);lo=Math.min(lo,x);hi=Math.max(hi,x);}});const b=world.boundaries?.(state.distance);return {left:b?.left===undefined?null:lo-b.left,right:b?.right===undefined?null:b.right-hi};},
  bridgeAudit:()=>{const p=world.sample(state.distance),ray=new THREE.Raycaster(),targets=['terrain','road-detail','road-support','shoulder'].flatMap(n=>world.scene.getObjectByName(n)?.children??[]);world.scene.updateMatrixWorld(true);return [0,25,-25].map(x=>{const origin=p.position.clone().addScaledVector(p.right,x);origin.y-=x===0?2:-5;ray.set(origin,new THREE.Vector3(0,-1,0));return {x,origin:origin.toArray(),hits:ray.intersectObjects(targets,true).slice(0,3).map(h=>({kind:h.object.userData.roadKind,y:h.point.y}))};});},
  bridge:()=>world.bridge,bridgeView:(enabled:boolean)=>{bridgeInspection=enabled;render(1/60);},
  shoulders:()=>world.shoulders?.(state.distance),
  rocks:()=>({sections:world.rockSections,contact:rockContact.inspect()}),
  breakdowns:()=>world.breakdowns,
  triangles:()=>triangles?.inspect(),
  cones:()=>cones?.inspect(),
  traffic:()=>traffic?.inspect(),
  trafficClearance:()=>traffic?.clearance(state.distance,state.lateral,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw+guardrail.yaw),
  trafficImpact:()=>({velocity:trafficImpact.velocity,slide:trafficImpact.slide,yaw:trafficImpact.yaw,roll:trafficImpact.roll,event:trafficImpact.event,sparks:trafficSparks.inspect()}),
  trafficSchedule:()=>trafficRecipe(trip?.seed??1,world.length),
  trafficContacts:()=>traffic?.contactPoints().map(c=>{const ray=new THREE.Raycaster(new THREE.Vector3().fromArray(c.point).add(new THREE.Vector3(0,4,0)),down,0,8),hit=world.streamer?.raycastContacts(ray,c.distance)[0];return {...c,gap:hit?c.point[1]-hit.point.y:null};}),
  acts:()=>ACTS,
  streamFaults:(faults:{delayMs:number;fromIndex:number;fail:boolean})=>world.streamer?.debugFaults(faults),
  streamSafety:()=>({held:streamHeld,stalls:streamStalls,waitMs:streamWaitMs+(streamHeld?performance.now()-streamHoldSince:0),safe:!world.streamer||world.streamer.canDrive(state.distance,state.speed*effectivePace(state.speed,highSpeedPace)),contextLost}),
  streaming:()=>world.streamer?{ready:world.streamer.ready,error:world.streamer.error,...world.streamer.stats}:null,
  scenery:()=>({...world.scenery,weights:world.weightsAt(state.distance),render:structuredClone(renderer.info.render),memory:structuredClone(renderer.info.memory)}),
  wheels:()=>world.car.userData.motion.inspect(),wheelContacts:()=>wheelContacts,
  occupants:()=>world.car.userData.motion.occupants(),
  brakeLights:()=>brakeLights.inspect(),
  exhaust:()=>exhaustEffects.inspect(),
  challenges:()=>pilot?pilotCourse(pilot):l2?l2Course(l2):brick?brickCourse(brick):COURSE,
  supportAudit:()=>{const group=world.scene.getObjectByName('road-support')!,children=(world.streamer?group.children.flatMap(c=>c.children):group.children).filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh).sort((a,b)=>(a.userData.chunkIndex??0)-(b.userData.chunkIndex??0));let maxSeam=0,nonFinite=0,maxTopError=0;for(let i=0;i<children.length;i++){const pos=children[i].geometry.getAttribute('position'),index=children[i].userData.chunkIndex??i,span=world.streamer?.chunkLength??1200,start=index*span,end=Math.min(world.length,start+span),n=pos.count/4-1;for(let row=0;row<=n;row++){const d=start+(end-start)*row/n,p=world.sample(d),width=world.halfAt(d);for(let side=0;side<2;side++){const expected=p.position.clone().addScaledVector(p.right,(side?1:-1)*(width+(world.shoulders?(side?world.shoulders(d).right:world.shoulders(d).left):6)));expected.y-=.1;maxTopError=Math.max(maxTopError,expected.distanceTo(new THREE.Vector3().fromBufferAttribute(pos,row*4+side*2)));}} for(let j=0;j<pos.count;j++)if(!Number.isFinite(pos.getX(j)+pos.getY(j)+pos.getZ(j)))nonFinite++;if(i&&(!world.streamer||index===children[i-1].userData.chunkIndex+1)){const prev=children[i-1].geometry.getAttribute('position');for(let j=0;j<4;j++){const a=new THREE.Vector3().fromBufferAttribute(prev,prev.count-4+j),b=new THREE.Vector3().fromBufferAttribute(pos,j);maxSeam=Math.max(maxSeam,a.distanceTo(b));}}}return{chunks:children.length,maxSeam,maxTopError,nonFinite};},
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
  snapshot:()=>({...state,bankDegrees:(-Math.atan(world.sample(state.distance).right.y)*180/Math.PI)||0,roadHalfWidth:world.halfAt(state.distance),laneCount:pilot?pilotSample(pilot,state.distance).lanes:brick?brickWidth(brick,state.distance).lanes:3,highSpeedPace,effectivePace:effectivePace(state.speed,highSpeedPace),travelSpeed:state.speed*effectivePace(state.speed,highSpeedPace),mode,elapsed,frames,inputs:input.snapshot(),audio:sound.inspect(),trackLength:world.length,position:world.car.position.toArray(),swapped,surfaceError:surfaceError(),camera:{...chaseComposition(camera.aspect),position:camera.position.toArray(),direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),scenicEnabled:scenicCameraEnabled,scenicWeight},immersive:immersive.snapshot(),rightScreenDelta:world.car.position.clone().add(world.sample(state.distance).right).project(camera).x-world.car.position.clone().project(camera).x}),
  manual:(value:boolean)=>{manual=value;},
  advance:(seconds:number,override?:InputState,draw=true)=>{for(let i=0;i<Math.ceil(seconds*120);i++){advance(1/120,override);render(1/120,false);}render(1/120,draw);},
  reset:(initial:{distance?:number;speed?:number;lateral?:number;heading?:number})=>{
    inspectionView=undefined;sound.pause();sound.resetPassBy();traffic?.reset();cones?.reset();triangles?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();history.clear();usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};brakeLights.reset();exhaustEffects.reset();pendingExhaustRpm=0;world.car.userData.motion.reset();
    speedAudit?.reset();
    state={...createState(),...initial};advancePowertrain(state,state.speed,false,0);state.velocityHeading=state.heading;state.worldHeading=world.sample(state.distance).roadHeading+state.heading;updateFootprint(state,world.halfAt(state.distance));brickCompleted=false;elapsed=0;initialized=false;mode='playing';testControls=undefined;input.clear();ui();render(1/60);
  },
  recentHistory:()=>history.snapshot(),
  sample:(d:number)=>{const p=world.sample(d);return {bankDegrees:(-Math.atan(p.right.y)*180/Math.PI)||0,halfWidth:world.halfAt(d),lanes:pilot?pilotSample(pilot,d).lanes:brick?brickWidth(brick,d).lanes:3,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),position:p.position.toArray(),curvature:p.curvature,roadHeading:p.roadHeading,tangent:p.tangent.toArray(),challenge:p.challenge};}
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

/* Opt-in QA Scene Inspector: exact route/biome sites, not a second world generator. */
if(params.get('qa')==='1'&&trip){
 const stops:InspectorStop[]=[];
 if(roadLockMode)for(const moment of CANYON_ROADLOCK_MOMENTS){
  stops.push({id:'roadlock-'+moment.id,kind:'road-lock',
   label:moment.name+' · '+(350+moment.startS)+'–'+(350+moment.endS)+'m',
   distance:Math.max(350,350+moment.startS-125),
   landmarkDistance:350+moment.startS,roadLockMoment:moment});
 }
 if(trip.canyonPrototype){
  const scene=trip.canyonPrototype;
  stops.push({id:scene.id,kind:'canyon-prototype',label:scene.title+' · '+Math.round(scene.start)+'–'+Math.round(scene.end)+'m',
   distance:Math.max(350,scene.vista?.approachDistance??scene.start-200),
   landmarkDistance:scene.vista?.revealDistance??scene.start,canyonPrototype:scene});
 }
 for(const section of trip.scenerySections??[]){
  stops.push({id:section.id,kind:'scenery-section',
   label:SECTION_LABELS[section.kind]+' · '+Math.round(section.start)+'–'+Math.round(section.end)+'m',
   distance:Math.max(350,section.start-120),landmarkDistance:section.start,scenerySection:section});
 }
 for(const cue of trip.scenicCues??[]){
  stops.push({id:cue.id,kind:'scenic-beat',
   label:cue.title+' · 張力 '+cue.intensity+'/10 · '+Math.round(cue.start)+'–'+Math.round(cue.end)+'m',
   distance:Math.max(350,cue.start-140),landmarkDistance:cue.start,scenicCue:cue});
 }
 // Road Feature Analysis is already complete in generateTrip(). Only turn
 // immutable recipe metadata into opt-in QA destinations; no per-frame
 // classification, no Worker changes and no new scenery generation.
 for(const feature of trip.roadFeatures??[]){
  const lead=feature.kind==='merge'||feature.kind==='exit'?220:
   feature.kind==='u-turn'?230:feature.kind==='long-straight'?80:160;
  stops.push({id:feature.id,kind:'road-feature',
   label:`${ROAD_FEATURE_LABELS[feature.kind]} · 張力 ${feature.intensity}/10 · ${Math.round(feature.start)}–${Math.round(feature.end)}m`,
   distance:Math.max(350,feature.start-lead),landmarkDistance:feature.start,
   roadFeature:feature});
 }
 const landmarks=trip.scenicLandmarks??planJourneyLandmarks(world.length,d=>world.weightsAt(d),world.bridge);
 for(const site of landmarks){
  const name=site.kind==='clock'?'鐘塔街區':site.kind==='lighthouse'?'海岸燈塔':'右側巨型砂岩拱門';
  // The route may crest or turn sharply. Choose an actual chase-camera view
  // for each giant arch rather than blindly stopping a fixed distance away.
  const inspectionDistance=site.kind==='canyon-arch'?
   canyonArchInspectionDistance(world.sample,site.distance):Math.max(350,site.distance-140);
  stops.push({id:`${site.kind}-${site.distance}`,kind:site.kind,label:`${name} · ${site.distance}m`,
   distance:inspectionDistance,landmarkDistance:site.distance,companions:site.companions});
 }
 // Sample grade inside actual city beats, avoiding a list of authored but invisible hills.
 for(const beat of trip.beats.filter(b=>b.world==='city')){
  let best=BRICK_START+beat.startS+100,maxGrade=0;
  for(let d=beat.startS+50;d<beat.endS-50;d+=30){
   const grade=Math.abs(pilotSample(trip,BRICK_START+d).grade);
   if(grade>maxGrade){maxGrade=grade;best=BRICK_START+d;}
  }
  stops.push({id:`grade-${beat.id}`,kind:'city-grade',label:`${beat.id} · 坡度 ${(maxGrade*100).toFixed(1)}%`,
   distance:Math.max(350,best-100)});
 }
 if(world.junction){
  const j=world.junction;
  stops.push({id:'junction-entry',kind:'junction',label:'右側匯入道路 · 4→5 車道',distance:Math.max(350,j.entry.start-220),landmarkDistance:j.entry.start});
  stops.push({id:'junction-exit',kind:'junction',label:'右側出口分岔 · 5→4 車道',distance:Math.max(350,j.exit.start-220),landmarkDistance:j.exit.start});
 }
 if(world.bridge){
  const b=world.bridge;
  for(const [name,d] of [['橋頭',b.start-180],['橋尾',b.end-160],['橋後 300m',b.end+300],['橋後 750m',b.end+750]] as [string,number][])
   stops.push({id:`bridge-${name}`,kind:'bridge',label:name,distance:Math.min(world.length-30,Math.max(350,d))});
 }
 for(const vehicle of world.breakdowns){
  stops.push({id:`broken-${vehicle.id}`,kind:'breakdown',label:`故障車 · ${Math.round(vehicle.distance)}m`,
   distance:Math.max(350,vehicle.distance-120)});
 }
 const pauseForQa=()=>{
  mode='paused';settingsOpen=false;tripPauseDock?.collapse();l2UI?.setReviewExpanded(false);input.clear();pad.neutralize();sound.pause();ui();
 };
 const jumpForQa=(distance:number)=>{
  pauseForQa();
  inspectionView=undefined;bridgeInspection=false;streamStartRequested=false;
  sound.resetPassBy();traffic?.reset();cones?.reset();triangles?.reset();tireEffects.clear();dustEffects.clear();
  impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();
  history.clear();brakeLights.reset();exhaustEffects.reset();pendingExhaustRpm=0;world.car.userData.motion.reset();
  state={...createState(),distance,speed:0,lateral:0};
  state.worldHeading=world.sample(distance).roadHeading;state.velocityHeading=state.worldHeading;
  advancePowertrain(state,0,false,0);updateFootprint(state,world.halfAt(distance));
  elapsed=0;initialized=false;brickCompleted=false;testControls=undefined;manual=false;
  world.streamer?.update(distance);ui();
 };
 const auditClock=(stop:InspectorStop)=>{
  const target=world.sample(stop.landmarkDistance??stop.distance).position;
  let faces=0,companions=0;
  world.scene.getObjectByName('scenery')?.traverse(object=>{
   if(!(object instanceof THREE.InstancedMesh))return;
   const color=(object.material as THREE.MeshStandardMaterial).color?.getHexString();
   if(color!=='eee6ce'&&color!==CLOCK_COMPANION_COLOR.slice(1))return;
   const matrices=object.instanceMatrix.array;
   for(let i=0;i<object.count;i++){
    const start=i*16,dx=matrices[start+12]-target.x,dz=matrices[start+14]-target.z;
    if(dx*dx+dz*dz>160*160)continue;
    if(color==='eee6ce')faces++;else companions++;
   }
  });
  return {faces,companions,expected:stop.companions??CLOCK_DISTRICT_COMPANIONS};
 };
 sceneInspector=new SceneInspector($('app'),stops,world.length,{
  pause:pauseForQa,jump:jumpForQa,
  current:()=>state.distance,
  roadExists:d=>world.streamer?.roadReady(d)??true,
  ready:()=>!world.streamer||world.streamer.ready,
  clockAudit:auditClock,
  view:view=>{inspectionView=view==='side'?'side':undefined;bridgeInspection=false;},
  drive:()=>{state.speed=170/3.6;advancePowertrain(state,state.speed,false,0);manual=false;start();},
 },trip.seed);
 $('qa-tools').prepend(sceneInspector.toggle);
 // Shareable QA coordinates, including when a particular building is missed.
 const target=Number(params.get('at'));
 if(params.has('at')&&Number.isFinite(target)&&target>=350&&target<world.length-20){
  sceneInspector.open();sceneInspector.jumpTo(target);
 }
}
