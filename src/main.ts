import {journeyChapters} from './scenic-journey';
import {GAME_VERSION} from './build-info';
import {disposeScene,sceneDisposal} from './dispose-scene';
import {attachJourneyLink,highwayExtension,LINK_HALF,LINK_LOAD_START} from './journey-link';
import {loadingStep,loadingProgress,loadingStarted,loadingFinished,loadingFailed,loadingDismissReady} from './loading';
import {startupDiagnostics} from './startup-diagnostics';
import {DriveFpsDiagnostics} from './drive-fps-diagnostics';
import {canonicalGameQuery} from './runtime-query';
import {sharedFlowerMaskStats} from './vendor/three-stylized/flowerShapes';
import {RockContact} from './rocky-shoulder';
import {CoastStoneContact} from './coast-stone-contact';
import {RoadCones} from './road-cones';
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
import { DEFAULT_PACE,effectivePace } from './pace';
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
import {COAST_ULTRA_STAGE} from './coast-ultra-stage';
import {coastDrainRightLimit} from './coast-roadside-layout';
import {CANYON_ROADLOCK_STAGE,CANYON_ROADLOCK_MOMENTS,CANYON_SCENIC_ZONES} from './designer-canyon-roadlock';
import {DriveTelemetry} from './drive-telemetry';
import {PhotoCapture} from './photo-capture';
import {TireEffects,type TireContact} from './tire-effects';
import {CoastDuskShadows} from './coast-dusk-shadows';
import {Traffic,trafficRecipe} from './traffic';
import {newTrafficSessionSeed} from './traffic-flow';
import {FinishStats} from './finish-stats';
import {planJourneyLandmarks,CLOCK_COMPANION_COLOR,CLOCK_DISTRICT_COMPANIONS} from './scenery';
import {SceneInspector,type InspectorStop} from './scene-inspector';
import {ROAD_FEATURE_LABELS} from './road-features';
import {SECTION_LABELS} from './scenery-cross-section';
import {canyonArchInspectionDistance} from './canyon-arch-preview';
import {interchangeCenterOffset} from './road-interchange';
import {TripPauseDock} from './trip-pause-dock';
import {markCoastShadowCaster} from './coast-shadow-layers';
import {coastShadowTechniqueEnabled,coastShadowTechniqueSnapshot,setCoastShadowTechniqueEnabled,type CoastShadowTechnique} from './coast-shadow-techniques';
import type {BrakeLightController} from './car';
import {ExhaustEffects,isHighRevUpshift} from './exhaust-effects';
import roadWorkerUrl from './road-worker.ts?worker&url';
import {StreamHealthHud} from './stream-health-hud';
import type {FeedbackAnchor} from './l2-feedback';
startupDiagnostics.mark('main-module-evaluated');
const params=canonicalGameQuery(new URLSearchParams(location.search));
// Cars and breakdowns reroll independently from the reproducible scenery seed.
// ?trafficSeed=1234 pins a specific traffic scenario for playtest reports.
let trafficSessionVariation=newTrafficSessionSeed(params);
if(params.toString()!==location.search.replace(/^\?/,''))window.history.replaceState(window.history.state,'',location.pathname+(params.size?'?'+params:'')+location.hash);
const l2=undefined as (typeof L2_CANDIDATES)[number]|undefined;
document.documentElement.dataset.qa='false';
const journeyMode=false; // Retired URL journeys: ordinary launch goes to the coast.
const chapters=journeyMode?journeyChapters():undefined;
let chapterIndex=0,journeyElapsed=0,journeyTransition=false;
const chapterStart=()=>chapters?.[chapterIndex].start??BRICK_START;
const chapterEnd=()=>chapters?.[chapterIndex].end??BRICK_START+(brick?.length??0);
let designerMode=false,coastUltraMode=true;
const sunsetShadowsEnabled=true,geometryShadowRequested=true;
const coastGeometryShadows=()=>coastUltraMode&&sunsetShadowsEnabled&&geometryShadowRequested;
let coastUltraWater=true,roadLockMode=false,scenicCameraEnabled=false,blenderMode=false;
await loadingStep(12,'正在規劃路線','安排這趟旅程的道路、彎道與沿途風景。');
const journeyTracks=chapters?.map(c=>createPilotTrack(c.stage));
startupDiagnostics.mark('route-plan-ready');
let trip=COAST_ULTRA_STAGE;
// The game opens the coast directly. ?at enables optional QA positioning.
const playerUi=!!trip;
document.documentElement.dataset.playerUi=String(playerUi);
let stage=trip;
let pilot=stage;
const bankLab=false,banking=undefined;
let brick=pilot;
function momentFingerprint(value:unknown){let h=2166136261;for(const c of JSON.stringify(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const momentCandidate={...L2_CANDIDATES[0],...(brick??{}),id:brick?.id??'FREE-DRIVE',seed:brick?.seed??0,contentFingerprint:brick?momentFingerprint({brick,handling:'ALB2'}):'00000000',generatorVersion:brick?'brick-moments-v0.7D.2':'free-drive-v0.7D.2'};
let labUI:ReturnType<typeof mountBrickLab>|undefined,l2UI:ReturnType<typeof mountL2Lab>|undefined,brickCompleted=false;

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<div id="drive-hud" hidden>0:00 · — FPS</div><div id="route-name" hidden><span id="route-title"></span><small id="release-version">${trip?.generatorVersion??TRIP_VERSION}</small></div>
<div id="drive-readout" hidden><strong id="drive-fps">— FPS</strong><small id="game-version">${GAME_VERSION}</small></div>
<header><span class="wordmark">FIRST DRIVE <small>ARCADE VELOCITY / 03</small></span><nav><button id="pause" aria-label="${playerUi?'暫停／選單':'Pause / Menu'}">Ⅱ Menu</button></nav></header>
<div id="immersive-note" role="status" hidden></div><aside id="speed" aria-label="Speedometer">${speedometerMarkup()}</aside>
<div id="qa-tools" aria-label="測試工具列"><button id="photo-button" aria-label="截圖" data-key-hint="F8" data-pad-hint="TOUCHPAD" hidden>📷 截圖</button></div><div id="photo-status" role="status" hidden>Photo saved locally</div><div id="ready-countdown" role="status" hidden>READY</div>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>${designerMode?'Grand Canyon<br>Designer’s Cut':'Take the<br>coast road.'}</h1><p>${designerMode?'手工設計的峽谷公路。沿著道路親自看見河灣。':'Steer through the bends. Lift or brake to find your line.'}</p><button id="drive" class="primary">Play <span>↗</span></button><p class="keys">A / D steer &nbsp; Space accelerate<br>Enter brake &nbsp; P / Esc pause &nbsp; R restart</p><small>SCENIC JOURNEY · LOCAL PLAYTEST · v0.8</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Play / resume ↗</button><div class="menu-actions"><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button><button id="fullscreen">Fullscreen</button><button id="free-export">Export feedback</button></div><p id="iphone-fullscreen-hint" role="status" hidden>On iPhone, open this site in Safari. Tap Share → Add to Home Screen, then launch the icon to hide Safari browser bars. Rotate the phone to landscape to drive.</p></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">${playerUi?'遊戲設定':'MAKE YOURSELF AT HOME'}</div><h2>${playerUi?'操作設定':'Controls'}</h2><label class="setting"><input id="swap" type="checkbox"> ${playerUi?'方向盤置於右側':'Steering on the right'}</label><p>${playerUi?'油門與煞車維持上下排列，左右手可互換。':'Accelerator stays above brake on either side.'}</p><p>Gamepad button check: <span id="gamepad-diagnostic">No connected gamepad.</span></p><button id="close-settings" class="primary">${playerUi?'完成':'Done'}</button></section>
<div id="touch"><div id="steering-strip" class="steering" role="slider" tabindex="0" aria-label="${playerUi?'方向盤':'Steering position'}" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><span class="steer-rail"><i class="steer-center"></i><i class="steer-cursor"></i></span></div><div class="pedals"><button data-control="gas">${playerUi?'油門':'GAS'}</button><button data-control="brake">${playerUi?'煞車':'BRAKE'}</button></div></div>
<div id="rotate"><span>↻</span>${playerUi?'橫放手機，準備出發！':'Turn toward the horizon'}<small id="rotate-instruction">${playerUi?'請將手機轉為橫向，即可開始駕駛。':'Rotate your phone to landscape to drive.'}</small><small id="rotate-launch-status" role="status" hidden></small><button id="rotate-launch" type="button" hidden>全螢幕出發！</button><small id="rotate-iphone-hint" hidden>iPhone: turn off Portrait Orientation Lock if necessary. For fewer browser bars, open in Safari → Share → Add to Home Screen, then launch from the Home Screen.</small><small id="rotate-immersive-error" role="status" hidden></small><button id="rotate-fullscreen">Try fullscreen</button><button id="rotate-pause">Pause / resume</button></div>
<section id="player-start" aria-label="Start driving" hidden>
  <div id="player-title" class="player-title">極速漫遊</div>
  <p id="player-subtitle">公路冒險</p>
  <dl id="player-finish-stats" aria-label="本次旅程數據" hidden>
   <div><dt>時間</dt><dd id="finish-time">—</dd></div>
   <div><dt>平均速度</dt><dd id="finish-average">—</dd></div>
   <div><dt>最高速度</dt><dd id="finish-max">—</dd></div>
   <div><dt>碰撞</dt><dd id="finish-collisions">—</dd></div>
  </dl>
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
updateChapterTitle();
for(const [id,key] of Object.entries({drive:'P',resume:'P',restart:'R',sound:'M',settings:'C',fullscreen:'F'})){const node=$(id);node.classList.add('shortcut');node.dataset.shortcut=key;node.setAttribute('aria-keyshortcuts',key);}
await loadingStep(25,'正在建立駕駛場景','準備公路、車輛與追尾視角。');
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.localClippingEnabled=true;
renderer.shadowMap.enabled=coastUltraMode?coastGeometryShadows():!matchMedia('(pointer:coarse)').matches;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex=-1;renderer.domElement.setAttribute('aria-label','Driving surface');$('view').append(renderer.domElement);
startupDiagnostics.mark('renderer-created');
let blenderAsset=blenderMode?await (async()=>{
 await loadingStep(30,'正在載入峽谷地形','下載場景模型與岩壁材質，請稍候。');
 const status=document.createElement('p');status.id='blender-art-status';status.setAttribute('role','status');status.style.cssText='position:fixed;top:12px;left:12px;z-index:300;background:#17343d;color:white;padding:12px';status.textContent='Blender 峽谷美術載入中…';document.body.append(status);
 try{const asset=await (await import('./blender-canyon')).loadBlenderCanyon(roadLockMode);status.remove();return asset;}
 catch(error){status.textContent=roadLockMode?'峽谷場景載入失敗，請確認網路連線後重新載入。':'Blender 美術載入失敗：請確認本機 canyon_art_only.glb。';throw error;}
})():undefined;
await loadingStep(38,'正在建立公路','準備道路與沿途景物。');
const initialBrick=brick,initialPilot=pilot;
let world=createWorld(initialBrick?{blenderArt:!!blenderAsset,bank:bankLab?banking:undefined,chunked:!!stage,streamStage:bankLab?initialPilot:stage,track:journeyTracks?journeyTracks[0]:initialPilot?createPilotTrack(initialPilot,bankLab?banking:undefined):l2?createL2Track(l2):createBrickTrack(initialBrick),theme:initialBrick.sceneryAct,seed:initialBrick.seed,trafficVariation:trafficSessionVariation,roadWidth:initialBrick.roadWidth,halfAt:d=>initialPilot?pilotSample(initialPilot,d).halfWidth:brickWidth(initialBrick,d).halfWidth,weightsAt:initialPilot?(d=>pilotWeights(initialPilot,d)):undefined,narrowings:stage?stage.placements.filter(p=>p.channel==='width'&&p.parameters.to<p.parameters.from).map(p=>Math.max(BRICK_START+30,BRICK_START+p.startS-180)):initialBrick.lanes.flatMap((k,i)=>i&&k[1]<initialBrick.lanes[i-1][1]?[Math.max(BRICK_START+30,BRICK_START+initialBrick.lanes[i-1][0]*initialBrick.length/initialBrick.nominalDuration-180)]:[]),course:initialPilot?pilotCourse(initialPilot):l2?l2Course(l2):brickCourse(initialBrick),notice:initialBrick.id==='BRK-03'?{distance:BRICK_START+initialBrick.length*5/initialBrick.nominalDuration,text:'LEFT BEND BEYOND'}:undefined}:{}); world.car.rotation.order="YXZ";startupDiagnostics.mark('world-created'); const camera=new THREE.PerspectiveCamera(CHASE.fov,innerWidth/innerHeight,CHASE_NEAR,matchMedia('(pointer:coarse)').matches?1400:2200);
if(blenderAsset)world.scene.add(blenderAsset.root);
let coastDuskShadows=coastUltraMode&&sunsetShadowsEnabled&&!coastGeometryShadows()
 ?new CoastDuskShadows(world.scene,world.sample,world.length,world.halfAt,trip?.seed??0):undefined;
// Load the FFT code only for the explicit coastal water trial. Everything
// else (main trip, canyon, city) stays on the regular Three.js render path.
await loadingStep(48,coastUltraWater?'正在準備海岸':'正在準備光影',coastUltraWater?'載入已準備好的海岸資料與海浪效果。':'準備場景光線與畫面效果。');
startupDiagnostics.mark('coast-ocean-start');
let ultraOcean=coastUltraWater?await import('./coast-ocean')
 .then(({UltraCoastOcean})=>UltraCoastOcean.create(renderer,world.scene,world,p=>loadingProgress(48+p*30,'正在準備海岸','載入海岸資料，接著準備海浪與夕陽。')))
 .catch(error=>{console.error('Ultra-Water unavailable; using basic sea',error);return null;}):null;
startupDiagnostics.mark('coast-ocean-ready',{active:!!ultraOcean});
if(ultraOcean){
 const originalSea=world.scene.getObjectByName('default-coast-water');
 if(originalSea)originalSea.visible=false;
 ultraOcean.boatShadow.enabled=sunsetShadowsEnabled&&coastShadowTechniqueEnabled('boatDepth');
 ultraOcean.setRockSunShadows(sunsetShadowsEnabled&&coastShadowTechniqueEnabled('rockShader'));
}
startupDiagnostics.mark('coast-boats-start');
let coastBoats=coastUltraMode?await (await import('./coast-boats')).addCoastBoats(world.scene,world.sample,ultraOcean?.boatSurfaceUniforms,ultraOcean?.boatShadow):null;
startupDiagnostics.mark('coast-boats-ready',{active:!!coastBoats});
// Compile even the distance-hidden reflections before departure, not when the
// first nearby vessel enters their fade range. Replay uses chapter prewarming.
startupDiagnostics.mark('boat-shader-compile-start');
if(coastBoats)await renderer.compileAsync(coastBoats.root,camera,world.scene);
if(ultraOcean)await renderer.compileAsync(ultraOcean.boatShadow.scene,camera);
startupDiagnostics.mark('boat-shader-compile-done');
let journeyLink=chapters?attachJourneyLink(world,chapters[0].start,chapters[0].end,chapters[0].id,false,true):undefined;
if(journeyLink)configureLinkDestination(journeyLink,0);
await loadingStep(82,'正在準備出發路段','載入前方公路與沿途景物，剩餘路段會隨旅程準備。');
if(import.meta.env.DEV)world.streamer?.instrumentUploads(renderer);
// ?at jumps to a real playable location, never freezes physics.
const requestedAt=Number(params.get('at'));
const atDistance=params.has('at')&&Number.isFinite(requestedAt)&&requestedAt>=350&&requestedAt<world.length-20?requestedAt:null;
const input=new InputController(document,()=>mode==='playing'&&!settingsOpen); const sound=new EngineSound(); let state=createState();if(brick){state.distance=chapterStart();state.speed=trip?0:brick.entrySpeed/3.6;}
// Autoplay is not a user gesture. Browsers may leave WebAudio suspended until
// the first throttle/steer/tap, so unlock sound on that interaction without
// showing a Play overlay or requiring an extra button.
function unlockSoundOnGesture(){
 void sound.unlock().then(()=>{
  if(sound.inspect().contextState==='running'){
   document.removeEventListener('pointerdown',unlockSoundOnGesture);
   document.removeEventListener('keydown',unlockSoundOnGesture);
  }
 }).catch(()=>{});
}
document.addEventListener('pointerdown',unlockSoundOnGesture,{passive:true});
document.addEventListener('keydown',unlockSoundOnGesture);
if(atDistance!==null){state.distance=atDistance;state.speed=0;}
advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading;
world.streamer?.update(state.distance);
startupDiagnostics.mark('road-streaming-active');
// The expensive diagnostic snapshot runs only once per second when ?fpsdiag=1.
const driveFpsDiagnostics=new DriveFpsDiagnostics(renderer,()=>{
 const stream=world.streamer?.stats,farms=world.streamer?.farmStats??[],warm=world.streamer?.startupDiagnosticState();
 return {
  streamer:{queue:stream?.queued??0,worker:stream?.pending?.kind??null,workerAgeMs:stream?.pending?.ageMs??null,retries:stream?.retries??0,
   chunks:stream?.chunks?.map(c=>({index:c.index,road:c.road,scenery:c.scenery}))??[],
   taskProfile:world.streamer?.sceneTaskProfile??null,
   farmWorker:world.streamer?.farmWorkerStats??null,
   lastSlowTasks:world.streamer?.sceneTaskSpikes.slice(-3)??[]},
  farms:{plots:farms.length,ricePlots:farms.filter(f=>f.kind==='rice').length,flowerPlots:farms.filter(f=>f.kind==='flowers').length,
   riceCanopyTriangles:farms.reduce((n,f)=>n+f.canopyTriangles,0),riceClumps:farms.reduce((n,f)=>n+f.crops.reduce((m,c)=>m+c,0),0),
   grassBlades:farms.reduce((n,f)=>n+f.blades,0),flowers:farms.reduce((n,f)=>n+f.flowers,0),
   backgroundWarmup:warm?.farmWarm??null,backgroundTasks:warm?.backgroundTasks??[],
   sharedFlowerAtlas:sharedFlowerMaskStats()},
  water:ultraOcean?.stats??null,
  lighting:{sunsetShadowsEnabled,geometrySunShadows:coastGeometryShadows(),shadowMapEnabled:renderer.shadowMap.enabled,staticCache:world.shadowCache?.stats??null,shadowTechniques:coastShadowTechniqueSnapshot(),projected:coastDuskShadows?.stats??null},
 };
});
const mobile=()=>matchMedia("(pointer:coarse)").matches;
let inputMode:'keyboard'|'gamepad'|'touch'=mobile()?'touch':'keyboard';
let hintRefreshTicks=0;
document.documentElement.dataset.inputMode=inputMode;
function refreshHints(){
 if(document.documentElement.dataset.inputMode!==inputMode)document.documentElement.dataset.inputMode=inputMode;
 document.querySelectorAll<HTMLElement>('.shortcut').forEach(node=>{
  const key=node.dataset.shortcut;if(!key||node.dataset.keyHint||node.id==='l2-praise'||node.id==='l2-issue')return;
  const first=Array.from(node.childNodes).find(n=>n.nodeType===Node.TEXT_NODE);if(!first)return;
  const raw=(first.textContent??'').replace(/\[([^\]]+)\]/g,'$1');
  if(inputMode==='keyboard'){const i=raw.toUpperCase().indexOf(key);first.textContent=i<0?`[${key}] ${raw}`:raw.slice(0,i)+`[${raw[i]}]`+raw.slice(i+1);}else first.textContent=raw;
 });
 const praise=document.getElementById('l2-praise'),issue=document.getElementById('l2-issue');
 const photo=document.getElementById('photo-button');if(photo&&photo.textContent!=='📷 截圖')photo.textContent='📷 截圖';
 const praiseText=inputMode==='gamepad'?'L1 讚':inputMode==='keyboard'?'[G]讚':'✨ 讚';
 const issueText=inputMode==='gamepad'?'□ 問題':inputMode==='keyboard'?'[I]問題':'⚑ 問題';
 if(praise&&praise.textContent!==praiseText)praise.textContent=praiseText;
 if(issue&&issue.textContent!==issueText)issue.textContent=issueText;
}
function setInputMode(next:typeof inputMode){if(inputMode!==next){inputMode=next;refreshHints();}}
addEventListener('keydown',e=>{if(!e.isComposing)setInputMode('keyboard');},true);
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setInputMode('touch');else if(e.pointerType==='mouse')setInputMode('keyboard');},true);
let mode:'menu'|'playing'|'paused'|'countdown'='menu'; let settingsOpen=false; let muted=false; let manual=false;
let sceneInspector:SceneInspector|undefined;
let tripPauseDock:TripPauseDock|undefined;
// One tap in portrait arms a launch; driving starts only after landscape AND safe road readiness.
let autoLaunchArmed=false,autoLaunchNeedsManual=false;
let streamStartRequested=false;
let preparationSince=performance.now();
const streamStallEvents:{start:number;end?:number;durationMs?:number;distance:number;reason:string}[]=[];
let streamHeld=false,streamHoldSince=0,streamStalls=0,streamWaitMs=0,contextLost=false;
const roadOverlay=document.createElement('div');roadOverlay.id='road-loading';roadOverlay.setAttribute('role','status');roadOverlay.style.cssText='position:fixed;inset:35% 12% auto;z-index:150;padding:22px;background:#102a35ee;color:white;text-align:center;border:2px solid #ffd46b;border-radius:12px;pointer-events:none;font:600 18px system-ui';roadOverlay.hidden=true;document.getElementById('app')!.append(roadOverlay);
function holdRoad(held:boolean){if(held===streamHeld)return;streamHeld=held;if(held){streamStalls++;streamHoldSince=performance.now();if(params.get('fpsdiag')==='1'){streamStallEvents.push({start:streamHoldSince,distance:state.distance,reason:contextLost?'context-lost':world.streamer?.error||'road-coverage'});if(streamStallEvents.length>128)streamStallEvents.shift();}}else{streamWaitMs+=performance.now()-streamHoldSince;const event=streamStallEvents.at(-1);if(event){event.end=performance.now();event.durationMs=event.end-event.start;}}}
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;holdRoad(true);sound.pause();});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;});

let testControls:InputState|undefined;let hardDetents=false;let lastControls:InputState={gas:false,brake:false,steer:0};let usedExternalControls=false;
const highSpeedPace=DEFAULT_PACE;
let bridgeInspection=false;let cameraHeading=0; let scenicDriftBlend=0;let scenicWeight=0;let initialized=false; let elapsed=0; let frames=0;
const history=new RecentDrivingHistory();
const finishStats=new FinishStats();
let telemetry=stage?new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined):undefined;
let inspectionView:'front'|'side'|'cockpit'|undefined;
let wheelContacts:(TireContact & {point:number[]})[]=[];
let tireEffects=new TireEffects(world.scene),dustEffects=new TireEffects(world.scene,'dust'),impactSparks=new ImpactSparks(world.scene);
tireEffects.setDuskSmoke(coastUltraMode);
let carBounds=new THREE.Box3().setFromObject(world.car).getSize(new THREE.Vector3()),guardrail=new GuardrailContact(carBounds.x/2,carBounds.z/2,world.boundaries),sparkOrigin=new THREE.Vector3(),trafficImpact=new TrafficImpact(),trafficSparks=new ImpactSparks(world.scene,true),trafficSparkOrigin=new THREE.Vector3();
let brakeLights=world.car.userData.brakeLights as BrakeLightController;
let exhaustEffects=new ExhaustEffects(world.car);
let pendingExhaustRpm=0;
let rockContact=new RockContact(world.rockSections,world.halfAt,carBounds.x/2,carBounds.z/2,actorRoadReady);
let coastStoneContact=new CoastStoneContact(world.halfAt,carBounds.x/2,carBounds.z/2,d=>world.streamer?.sceneryReady(d)??true);
function trafficRoadReady(d:number){return !!journeyLink?.inHighway(d)||actorRoadReady(d);}
function actorRoadReady(d:number){return (!chapters||d>=chapterStart()&&d<=chapterEnd())&&(world.streamer?.roadReady(d)??true);}
let cones=trip&&!roadLockMode&&trip.revision>=5?new RoadCones(world.sample,world.halfAt,world.scene,trip.seed,world.length,actorRoadReady,undefined,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows(),coastUltraMode):undefined;
let triangles=trip&&!roadLockMode&&trip.revision>=6?new RoadCones(world.sample,world.halfAt,world.scene,trip.seed,world.length,actorRoadReady,world.breakdowns,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows()):undefined;
let traffic=trip&&!roadLockMode?new Traffic(world.scene,world.sample,world.halfAt,world.length,trip.seed,trafficRoadReady,world.breakdowns,world.junction,coastUltraMode,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows(),trafficSessionVariation):undefined;
 traffic?.setContactShadowsEnabled(!coastUltraMode||coastShadowTechniqueEnabled('contactDecals'));
function applyShadowTechnique(technique:CoastShadowTechnique,enabled:boolean){
 if(!setCoastShadowTechniqueEnabled(technique,enabled))return;
 if(technique==='dynamicMap'||technique==='staticMap'){
  world.shadowCache?.refreshLightCasting();
  if(technique==='staticMap'&&enabled)world.shadowCache?.invalidate();
 }else if(technique==='boatDepth'&&ultraOcean){
  ultraOcean.boatShadow.enabled=sunsetShadowsEnabled&&enabled;
 }else if(technique==='rockShader'){
  ultraOcean?.setRockSunShadows(sunsetShadowsEnabled&&enabled);
 }else if(technique==='contactDecals'){
  traffic?.setContactShadowsEnabled(enabled);
 }
 // Keep the existing pause checkboxes accurate if the automatic trial is interrupted.
 const checkbox=tripPauseDock?.element.querySelector<HTMLInputElement>(
  `input[data-shadow-technique="${technique}"]`);
 if(checkbox)checkbox.checked=enabled;
}
if(chapters&&chapterIndex<2)traffic?.enableHighway(chapterEnd());
const contactRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),contactShadows=Array.from({length:4},()=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.34,16),new THREE.MeshBasicMaterial({color:coastUltraMode?0x000000:0x172d28,transparent:true,opacity:.24,depthWrite:false}));m.visible=false;world.scene.add(m);return m;});
function tireBottom(p:THREE.Group){const center=p.getWorldPosition(new THREE.Vector3()),axis=new THREE.Vector3(1,0,0).transformDirection(p.matrixWorld),vertical=new THREE.Vector3(0,1,0).addScaledVector(axis,-axis.y).normalize();return center.addScaledVector(vertical,-.46).addScaledVector(axis,-Math.sign(axis.y)*.135);}
let wheelSurfaces=world.scene.children.filter(o=>o.name==='driving-surface'||o.name==='shoulder');let surfacesReady=false;
function groundWheels(){
 const intersect=()=>world.streamer?world.streamer.raycastContacts(contactRay,state.distance):contactRay.intersectObjects(wheelSurfaces,true);
 const pivots=world.car.userData.wheelPivots as THREE.Group[];for(const p of pivots)p.position.y=.46;
 if(!surfacesReady){world.scene.updateMatrixWorld(true);surfacesReady=true;}else world.car.updateWorldMatrix(true,true);
 wheelContacts=pivots.map((p,index)=>{let bottom=new THREE.Vector3(),hit:THREE.Intersection|undefined;const m=p.parent!.matrixWorld.elements,up=new THREE.Vector3(m[4],m[5],m[6]);
  for(let i=0;i<2;i++){p.updateWorldMatrix(true,false);bottom=tireBottom(p);contactRay.set(bottom.clone().add(new THREE.Vector3(0,4,0)),down);contactRay.far=12;hit=intersect()[0];if(!hit)break;const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)??new THREE.Vector3(0,1,0),denominator=normal.dot(up);if(Math.abs(denominator)<.2)break;const correction=THREE.MathUtils.clamp(normal.dot(hit.point.clone().sub(bottom))/denominator,-.4-(p.position.y-.46),.4-(p.position.y-.46));p.position.y+=correction;if(Math.abs(correction)<.001)break;}
  p.updateWorldMatrix(true,false);bottom=tireBottom(p);contactRay.set(bottom.clone().add(new THREE.Vector3(0,4,0)),down);contactRay.far=12;hit=intersect()[0];const shadow=contactShadows[index];shadow.visible=!!hit&&(!coastUltraMode||coastShadowTechniqueEnabled('contactDecals'));if(hit&&shadow.visible){const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)??new THREE.Vector3(0,1,0);if(normal.y<0)normal.negate();shadow.position.copy(hit.point).addScaledVector(normal,.025);shadow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);}return {name:p.name,gap:hit?bottom.y-hit.point.y:null,point:bottom.toArray(),surface:hit?.point.toArray()??null,normal:hit?.face?.normal.clone().transformDirection(hit.object.matrixWorld).toArray(),onRoad:hit?.object.name==='driving-surface'};});
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
  const subtitle=journeyMode?(brickCompleted?'都市、海岸與峽谷，旅程完成':'黃昏海岸 → 白天都市 → 清晨峽谷'):brickCompleted?'同一條海岸，再玩一次':elapsed>0?'準備好了就繼續出發':'公路冒險';
  if($('player-title').textContent!==title)$('player-title').textContent=title;
  if($('player-subtitle').textContent!==subtitle)$('player-subtitle').textContent=subtitle;
  const play=$('player-play'),label=autoLaunchArmed||streamStartRequested?'即將出發…':brickCompleted?'再玩一次':elapsed>0?'繼續駕駛':'開始駕駛';
  if(play.textContent!==label)play.textContent=label;
  // Completion has exactly ONE replay action. Route/seed selection belongs
  // to the future main menu, not a second or third finish button.
  $('player-restart').hidden=elapsed===0||brickCompleted;
  $('player-new-route').hidden=true;
  const finishPanel=$('player-finish-stats');finishPanel.hidden=!brickCompleted;
  if(brickCompleted){
   const result=finishStats.summary(elapsed);
   for(const [id,value] of [
    ['finish-time',result.time],
    ['finish-average',result.averageKmh+' km/h'],
    ['finish-max',result.maximumKmh+' km/h'],
    ['finish-collisions',String(result.collisions)],
   ]){const node=$(id);if(node.textContent!==value)node.textContent=value;}
  }
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
function ui(){ $('drive-readout').hidden=settingsOpen||mode==='menu'; tripPauseDock?.update(!!trip&&mode==='paused'&&!brickCompleted&&!settingsOpen,muted,l2UI?.reviewExpanded??false);$('preferences').classList.toggle('trip-settings-drawer',!!trip&&mode==='paused'&&settingsOpen); $('drive-hud').hidden=$('route-name').hidden=(mode!=='playing'&&mode!=='countdown')||settingsOpen; const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);$('menu').hidden=!!brick||mode!=='menu'||settingsOpen; $('paused').hidden=!!brick||mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',(mode==='playing'||mode==='countdown')&&!settingsOpen);$('photo-button').hidden=(mode!=='playing'&&!(trip&&params.has('at')&&mode==='paused'))||settingsOpen; $('ready-countdown').hidden=mode!=='countdown';$('pause').textContent=playerUi?(mode==='playing'?'Ⅱ 暫停':'☰ 選單'):(mode==='playing'?'Ⅱ Menu':'☰ Menu');if(mode!=='playing'&&mode!=='countdown'&&!settingsOpen)refreshPhotoFolder(); updatePlayerUi(); }
function start(){if(journeyTransition)return;if(sceneInspector?.isOpen)sceneInspector.close();l2UI?.setReviewExpanded(false);tripPauseDock?.collapse();void sound.unlock().catch(()=>{});if(world.streamer&&!world.streamer.ready){streamStartRequested=true;const status=document.getElementById('stream-status');if(status)status.textContent=world.streamer.error?`Scene preparation failed: ${world.streamer.error}`:'Preparing the road…';return;}streamStartRequested=false;const status=document.getElementById('stream-status');if(status)status.textContent='';state.appliedSteer=state.steerFrom=state.steerTo=state.steerTime=0;// Resume immediately: pause already neutralizes held inputs; no READY countdown.
 mode='playing';settingsOpen=false;input.clear();ui();
  loadingDismissReady();renderer.domElement.focus({preventScroll:true});}
function pause(){if(journeyTransition)return;if(l2UI?.feedbackOpen)return;if(sceneInspector?.isOpen){sceneInspector.close();ui();return;}if(mode==='paused'){start();return;}l2UI?.setReviewExpanded(false);tripPauseDock?.collapse();mode='paused';input.clear();pad.neutralize();sound.pause();ui();if(!mobile())(trip?tripPauseDock?.resumeButton:document.getElementById(playerUi?'player-play':brick?(l2||pilot?'l2-play':'brick-play'):'resume'))?.focus();}
/** Player-facing restart gets fresh moving traffic; QA reset/jumps keep the
 * current traffic seed for reproducible bug reports. Broken-car geometry and
 * warning markers are world-owned and reroll on the next map load. */
function rerollTraffic(){if(!params.has('trafficSeed'))trafficSessionVariation=newTrafficSessionSeed();traffic?.reset(trafficSessionVariation);}
function restart(){finishStats.reset();if(journeyMode){if(mode==='menu'&&elapsed===0){start();return;}void restartJourney();return;}tripPauseDock?.collapse();l2UI?.setReviewExpanded(false);preparationSince=performance.now();sound.pause();sound.resetPassBy();brakeLights.reset();exhaustEffects.reset();pendingExhaustRpm=0;rerollTraffic();cones?.reset();triangles?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();coastStoneContact.reset();history.clear();if(stage)reportArea.hidden=true;if(stage)telemetry=new DriveTelemetry(stage.stageCode,stage.seed,stage.generatorVersion,trip?'outrun-trip-drive-reports-v09':undefined);usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};l2UI?.reset();world.car.userData.motion.reset();state=createState();if(brick){state.distance=BRICK_START;state.speed=trip?0:brick.entrySpeed/3.6;testControls=undefined;brickCompleted=false;}if(atDistance!==null){state.distance=atDistance;state.speed=0;}advancePowertrain(state,state.speed,false,0);state.worldHeading=world.sample(state.distance).roadHeading; elapsed=0; initialized=false;if(world.streamer){mode='paused';input.clear();sound.pause();world.streamer.update(state.distance);ui();}start();}
$('player-retry').onclick=()=>location.reload();
$('player-play').onclick=()=>document.getElementById('l2-play')?.click();
document.getElementById('loading-ready')!.addEventListener('click',()=>$('player-play').click());
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
  if(journeyTransition||e.isComposing||e.repeat||l2UI?.feedbackOpen)return;
  if(settingsOpen&&e.code==='Escape'){e.preventDefault();$('close-settings').click();return;}
  if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(e.code==='KeyQ'&&sceneInspector){e.preventDefault();toggleSceneQa();return;}
  if(e.code==='Escape'&&sceneInspector?.isOpen){e.preventDefault();toggleSceneQa();return;}
  if(e.code==='Escape'&&mode==='paused'&&l2UI?.reviewExpanded){e.preventDefault();l2UI.setReviewExpanded(false);ui();tripPauseDock?.moreButton.focus();return;}
  if(e.code==='Escape'&&mode==='paused'&&tripPauseDock?.isExpanded){e.preventDefault();tripPauseDock.collapse();ui();return;}
  if(e.code==='F8'&&(mode==='playing'||(trip&&params.has('at')&&mode==='paused'))&&!settingsOpen){e.preventDefault();capturePhoto();return;}
  if(e.code==='Escape'){e.preventDefault();if(settingsOpen){$('close-settings').click();return;}pause();return;}
  if(settingsOpen)return;
  if((mode==='playing'||brickCompleted)&&l2UI&&(e.code==='KeyG'||e.code==='KeyI')){e.preventDefault();l2UI.openQuick(e.code==='KeyG'?'praise':'issue','keyboard');return;}
  if(mode==='playing'){if(e.code==='KeyP'){e.preventDefault();pause();}else if(e.code==='KeyR'){e.preventDefault();restart();}return;}
  if(trip&&mode==='paused'){
   const direct:Record<string,()=>void>={KeyP:start,KeyR:restart,KeyN:()=>{if(!playerUi)$('l2-next').click();},KeyV:()=>{if(tripPauseDock&&!tripPauseDock.reviewButton.hidden)tripPauseDock.reviewButton.click();},KeyC:()=>{$('settings').click();},KeyM:()=>{$('sound').click();},KeyF:()=>{$('fullscreen').click();},KeyE:()=>{l2UI?.exportCurrent();}};
   if(direct[e.code]){e.preventDefault();direct[e.code]();return;}
  }
  const prefix=pilot||l2?'l2':brick?'brick':'';
  const action:Record<string,string>={KeyP:playerUi?'player-play':prefix?`${prefix}-play`:mode==='menu'?'drive':'resume',KeyR:playerUi?'player-restart':prefix?`${prefix}-replay`:'restart',KeyN:playerUi?'':`${prefix}-next`,KeyB:`${prefix}-prev`,KeyC:playerUi?'player-options':prefix?`${prefix}-settings`:'settings',KeyM:playerUi?'player-sound':prefix?`${prefix}-sound`:'sound',KeyF:prefix?`${prefix}-fullscreen`:'fullscreen',KeyE:`${prefix}-export`};
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
  if(mode==='playing'&&!settingsOpen){const beforeDistance=state.distance,beforeLateral=state.lateral;const external=override??(import.meta.env.DEV?testControls:undefined),controls=external??{...input.snapshot(),rawSteer:input.steeringTarget};lastControls={...controls};usedExternalControls=!!external;if(import.meta.env.DEV&&hardDetents){const q=quantizeSteering(controls.steer,state.effectiveSteer);state.appliedSteer=q;state.steerFrom=q;state.steerTo=q;state.steerTime=1;}const road=world.sample(state.distance),previousGear=state.gear,previousRpm=state.rpm;step(state,controls,dt,road.curvature,highSpeedPace,world.halfAt,road.tangent.y/Math.hypot(road.tangent.x,road.tangent.z),-Math.atan(road.right.y),coastUltraMode?coastDrainRightLimit:undefined);
 // The selected five-lane merge moves the road frame right; moving the car
 // left by the exact delta keeps the four old lanes physically stationary.
 if(world.junction)state.lateral-=interchangeCenterOffset(world.junction,state.distance)-interchangeCenterOffset(world.junction,beforeDistance);
 if(isHighRevUpshift(previousGear,state.gear,controls.gas,controls.brake,previousRpm))pendingExhaustRpm=Math.max(pendingExhaustRpm,previousRpm);trafficImpact.update(state,dt,world.halfAt(state.distance));if(cones?.update(elapsed+dt,state.distance,state.lateral,state.speed,{distance:beforeDistance,lateral:beforeLateral},carBounds.x/2)){state.speed*=.995;sound.coneHit(state.speed);}if(triangles?.update(elapsed+dt,state.distance,state.lateral,state.speed,{distance:beforeDistance,lateral:beforeLateral},carBounds.x/2)){state.speed*=.995;sound.coneHit(state.speed);}traffic?.update(elapsed+dt,state.distance,state.lateral,state.speed*effectivePace(state.speed,highSpeedPace));const collision=traffic?.hit(elapsed+dt,state,{distance:beforeDistance,lateral:beforeLateral},dt,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw);if(collision){trafficImpact.kick(state,collision);sound.impact(collision.severity,'vehicle');const contact=world.sample(collision.distance);trafficSparkOrigin.copy(contact.position).addScaledVector(contact.right,collision.lateral);trafficSparkOrigin.y+=.65;trafficSparks.burst(elapsed+dt,trafficSparkOrigin,contact.right,contact.tangent,collision.severity);}const impact=guardrail.update(state,beforeDistance,beforeLateral,dt,!!trip&&trip.seed===1);if(impact)sound.impact(impact);const rockHit=rockContact.update(state,{distance:beforeDistance,lateral:beforeLateral},dt);if(rockHit){sound.impact(rockHit.severity,'vehicle');const rockFrame=world.sample(rockHit.distance);sparkOrigin.copy(rockFrame.position).addScaledVector(rockFrame.right,rockHit.lateral);sparkOrigin.y+=.8;impactSparks.burst(elapsed+dt,sparkOrigin,rockFrame.right,rockFrame.tangent,rockHit.severity);}const stoneHit=coastUltraMode?coastStoneContact.update(state,{distance:beforeDistance,lateral:beforeLateral},dt,elapsed+dt):undefined;
 if(stoneHit){
  sound.impact(stoneHit.severity,'vehicle');
  const stoneFrame=world.sample(stoneHit.distance);
  sparkOrigin.copy(stoneFrame.position).addScaledVector(stoneFrame.right,stoneHit.lateral);
  sparkOrigin.y+=.47;
  impactSparks.burst(elapsed+dt,sparkOrigin,stoneFrame.right,stoneFrame.tangent,stoneHit.severity);
 }
 updateFootprint(state,world.halfAt(state.distance));world.car.userData.motion.advance(state.distance-beforeDistance,state.appliedSteer,dt);elapsed+=dt;if(stage&&telemetry)telemetry.observe({t:elapsed,s:state.distance-BRICK_START,brake:controls.brake,gas:controls.gas,offRoad:state.offRoad,steer:state.appliedSteer,gear:state.gear});if(l2UI&&history.due(elapsed))history.record(feedbackAnchor());if(stage&&telemetry?.due(elapsed)){const w=pilotWeights(stage,state.distance),worldName=(['coast','canyon','city'] as const)[w.indexOf(Math.max(...w))],beat=trip?(trip.beats.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.id??`L3-${trip.buffers.find(x=>state.distance-BRICK_START>=x.startS&&state.distance-BRICK_START<x.endS)?.role??'finish'}`):(stage.beats.find(x=>state.distance-BRICK_START<x.endS)?.id??stage.beats.at(-1)!.id);telemetry.record({t:elapsed,s:state.distance-BRICK_START,speed:state.speed*3.6,gear:state.gear,rpm:state.rpm,gas:controls.gas,brake:controls.brake,steer:state.appliedSteer,rawSteer:controls.rawSteer??controls.steer,curvature:road.curvature,requiredSteer:state.requiredSteer,grade:state.grade,halfWidth:world.halfAt(state.distance),lanes:pilotSample(stage,state.distance).lanes,active:pilotSample(stage,state.distance).active.map(p=>p.id),roadX:state.lateral,offRoad:state.offRoad,world:worldName,beat,input:external?'scripted':inputMode});}sound.update(state.speed,state.slip,controls.gas&&!controls.brake,dt,state,trafficImpact.slide,traffic?.skidIntensity??0);sound.passBy(elapsed,state.distance,state.lateral,carBounds.x/2*Math.abs(Math.cos(state.heading))+carBounds.z/2*Math.abs(Math.sin(state.heading)),traffic?.audioActors()??[],collision?.actorId);if(brick&&state.distance>=chapterEnd()&&(!journeyMode||chapterIndex===2)){if(l2UI){const finish=feedbackAnchor();history.record(finish,true);l2UI.complete(finish);}brickCompleted=true;mode='paused';input.clear();testControls=undefined;sound.pause();if(telemetry){telemetry.save();showDriveReport();}ui();if(!mobile())(document.getElementById(l2||pilot?'l2-play':'brick-play') as HTMLElement|null)?.focus();}}else sound.pause();
}
function groundHeight(height:number,lateral:number){
  if(brick)return height+(Math.abs(lateral)>world.halfAt(state.distance)?-.1:0);
  if(lateral < -13)return THREE.MathUtils.lerp(height-.1,-5.05,Math.min(1,(-lateral-13)/14));
  if(lateral>13)return height-.12-Math.min(1,(lateral-13)/62)*2.88;
  return height+(Math.abs(lateral)>world.half?-.1:0);
}
function render(dt:number,draw=true){
  const fpsProfiling=driveFpsDiagnostics.enabled&&mode==='playing';
  blenderAsset?.update(elapsed);coastBoats?.update(elapsed,camera);
  const p=world.sample(state.distance);
  world.car.position.copy(p.position).addScaledVector(p.right,state.lateral);
  world.car.position.y=groundHeight(p.position.y,state.lateral)+p.right.y*state.lateral+.04;
  world.car.rotation.set(-Math.atan2(p.tangent.y*Math.cos(state.heading),Math.hypot(p.tangent.x,p.tangent.z)),-p.roadHeading-state.heading-guardrail.yaw-trafficImpact.yaw-rockContact.yaw-coastStoneContact.yaw,THREE.MathUtils.clamp(-state.slipAngle*.12,-.055,.055)+guardrail.roll+trafficImpact.roll+rockContact.roll+coastStoneContact.roll+state.weightRoll);
  if(p.right.y!==0){
    // Grade remains a handling input from the unchanged centerline. Only pose uses cross-slope.
    const grade=p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),cross=p.right.y;
    const slopeChange=(world.sample(state.distance+.5).right.y-world.sample(state.distance-.5).right.y)*state.lateral;
    world.car.rotation.x=-Math.atan((grade+slopeChange)*Math.cos(state.heading)+cross*Math.sin(state.heading));
    world.car.rotation.z+=Math.atan(-cross*Math.cos(state.heading));
  }
  if(coastDuskShadows)coastDuskShadows.update(
   world.car.position,groundHeight(p.position.y,state.lateral)+p.right.y*state.lateral,state.distance);
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
  const worldStart=perfEnabled||fpsProfiling?performance.now():0;world.update(elapsed,state.speed,state.slip,state.distance);if(perfEnabled)worldTotal+=performance.now()-worldStart;if(fpsProfiling)driveFpsDiagnostics.cpu('world',performance.now()-worldStart);if(!draw)return;
  const remainingRenderStart=fpsProfiling?performance.now():0;
  const activeSmokeBiome=world.weightsAt(state.distance);
  tireEffects.setSceneSmoke(activeSmokeBiome,coastUltraMode);
  traffic?.setSmokeScene(activeSmokeBiome);
  cones?.update(elapsed,state.distance,state.lateral,state.speed);triangles?.update(elapsed,state.distance,state.lateral,state.speed);traffic?.update(elapsed,state.distance,state.lateral,state.speed*effectivePace(state.speed,highSpeedPace),camera,renderer.domElement.height);const displayMode=mode==='countdown'?'playing':mode;labUI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0);l2UI?.update(displayMode,settingsOpen,brickCompleted,brick?(state.distance-BRICK_START)/brick.length:0,elapsed);// The input-mode change handler already refreshes hints immediately.
   // Check newly-mounted QA controls only once every ~60 rendered frames;
   // avoid querying and mutating DOM every game frame on Pixel 8.
   if((hintRefreshTicks++%60)===0)refreshHints();world.car.userData.motion.render();const rayStart=perfEnabled?performance.now():0;groundWheels();sound.surface(state.speed,mode==='playing'?wheelContacts.filter(c=>c.onRoad===false&&c.surface&&c.gap!==null&&Math.abs(c.gap)<.12).length:0,dt);tireEffects.update(elapsed,state.speed,sound.skidFeedback.intensity,wheelContacts,renderer.domElement.height*camera.projectionMatrix.elements[5]/2);if(wheelContacts.some(c=>c.onRoad===false&&!!c.surface))dustEffects.setDustTint(world.weightsAt(state.distance));dustEffects.update(elapsed,state.speed,0,wheelContacts,1);sparkOrigin.copy(p.position).addScaledVector(p.right,world.boundaries?guardrail.contactEdge:CANYON_BEND.railOffset);sparkOrigin.y+=.9;impactSparks.update(elapsed,sparkOrigin,p.right,p.tangent,guardrail.flash>0?guardrail.strength:0);trafficSparks.update(elapsed,trafficSparkOrigin,p.right,p.tangent,trafficImpact.flash>0?(trafficImpact.event?.severity??0):0);brakeLights.set(mode==='playing'&&lastControls.brake);if(pendingExhaustRpm>0&&mode==='playing')exhaustEffects.burst(elapsed,pendingExhaustRpm);pendingExhaustRpm=0;exhaustEffects.update(elapsed,mode==='playing');const renderStart=perfEnabled?performance.now():0;if(perfEnabled)raycastTotal+=renderStart-rayStart;
  if(fpsProfiling){
   driveFpsDiagnostics.cpu('otherRender',performance.now()-remainingRenderStart);
   driveFpsDiagnostics.beginGpu(state.distance);
  }
  const oceanBegin=fpsProfiling?performance.now():0;
  if(ultraOcean?.mesh.visible)ultraOcean.update(camera,dt);
  if(fpsProfiling)driveFpsDiagnostics.cpu('ocean',performance.now()-oceanBegin);
  const boatShadowBegin=fpsProfiling?performance.now():0;
  if(ultraOcean?.mesh.visible)ultraOcean.boatShadow.update(renderer,camera,dt);
  if(fpsProfiling)driveFpsDiagnostics.cpu('boatShadow',performance.now()-boatShadowBegin);
  const sceneDrawBegin=fpsProfiling?performance.now():0;
  renderer.render(world.scene,camera);
  if(fpsProfiling){driveFpsDiagnostics.cpu('mainScene',performance.now()-sceneDrawBegin);driveFpsDiagnostics.endGpu();}
  if(perfEnabled)renderTotal+=performance.now()-renderStart;frames++;
  $('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');
  const speedBand=state.speed*3.6>=300?'redline':state.speed*3.6>=240?'fast':'cruise';if($('speed').dataset.band!==speedBand)$('speed').dataset.band=speedBand;
  $('speed-needle').setAttribute('transform',`rotate(${needleAngle(state.speed*3.6)} 100 100)`);$('gear').textContent=`G${state.gear}`;
  $('status').textContent=playerUi?(state.offRoad?'偏離路面 · 請回正':state.slip>.2?'過彎中 · 穩住方向':mode==='playing'?'保持路線':'準備出發'):(state.offRoad?'OFF ROAD · STEER BACK':state.slip>.2?'CORNERING · HOLD YOUR LINE':mode==='playing'?'STEER YOUR OWN LINE':'READY FOR THE COAST');
}
let photoStatusTimer=0;
const photos=new PhotoCapture(renderer.domElement,()=>render(0),()=>{const p=world.sample(state.distance);return {buildVersion:GAME_VERSION,fps:perf.fps,stageCode:stage?.stageCode??'FREE',seed:stage?.seed??0,capturedAt:new Date().toISOString(),time:elapsed,distance:state.distance,speed:state.speed*3.6,steer:state.appliedSteer,grade:state.grade,roadX:state.lateral,halfWidth:world.halfAt(state.distance),carPosition:world.car.position.toArray(),carRotation:[world.car.rotation.x,world.car.rotation.y,world.car.rotation.z],roadPosition:p.position.toArray(),surfaceGap:surfaceError(),wheels:wheelContacts};},message=>{$('photo-status').textContent=message;$('photo-status').hidden=false;clearTimeout(photoStatusTimer);photoStatusTimer=window.setTimeout(()=>{$('photo-status').hidden=true;},message==='📸 Saved'?2000:7000);});
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
const perfEnabled=false; // retired URL profiler
const perf={fps:0,startupMs:0,raycastMs:0,renderMs:0,worldMs:0,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled};
let perfFrames=0,perfSince=performance.now(),raycastTotal=0,renderTotal=0,worldTotal=0;
const perfPanel=perfEnabled?document.createElement('pre'):undefined;
if(perfPanel){perfPanel.id='perf';perfPanel.style.cssText='position:fixed;left:8px;top:50px;z-index:100;pointer-events:none;background:#102a35dd;color:white;padding:8px;font:12px monospace';document.getElementById('app')!.append(perfPanel);}
const streamHudEnabled=false; // retired URL stream HUD
const streamDiagnosticMode=false; // FPS JSON still available
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

// Prepare only after entering the highway; rebase on a straight after readiness.
type PreparedChapter={index:number;world:ReturnType<typeof createWorld>;ocean:typeof ultraOcean;art:typeof blenderAsset;boats:typeof coastBoats;link:ReturnType<typeof attachJourneyLink>};
let journeyExitAt:number|undefined,journeyLoadHeld=false;
const journeyLoadStarts:{index:number;distance:number}[]=[];
let nextChapter:PreparedChapter|undefined,preparingChapter=false,preparationError='',prepareEpoch=0,retryPreparationAt=0;
const journeyPreparations:{index:number;steps:{name:string;ms:number}[]}[]=[];
const journeyTransitions:{from:number;to:number;ms:number;speedBefore:number;speedAfter:number;headingError:number;rebase:number}[]=[];
function releaseChapter(c:PreparedChapter){const release=sceneDisposal(c.world.scene);c.ocean?.dispose();c.world.streamer?.dispose();release();}
function configureLinkDestination(link:ReturnType<typeof attachJourneyLink>,index:number){
 const next=chapters?.[index+1];if(!next)return;
 // Lighting follows the fixed route, never the completion time of a download.
 const entry=highwayExtension(journeyTracks![index+1].sample,next.start,-1);
 link.setDestination(next.id,entry(next.start-LINK_HALF).roadHeading);
}
async function prepareChapter(index:number,report?:(value:number,title:string,detail:string)=>void):Promise<PreparedChapter>{
 while(import.meta.env.DEV&&index>0&&journeyLoadHeld)await new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const c=chapters![index],candidate=c.stage;let previous=performance.now();const steps:{name:string;ms:number}[]=[];const mark=(name:string)=>{const now=performance.now();steps.push({name,ms:now-previous});previous=now;};
 const art=c.id==='canyon'?await (await import('./blender-canyon')).loadBlenderCanyon(true):undefined;
 mark('asset');
 let preparedWorld:ReturnType<typeof createWorld>|undefined,ocean:typeof ultraOcean=null,boats:typeof coastBoats=null;
 try{
  preparedWorld=createWorld({deferCar:true,track:journeyTracks![index],streamStage:candidate,chunked:true,theme:candidate.sceneryAct,seed:candidate.seed,trafficVariation:trafficSessionVariation,roadWidth:candidate.roadWidth,
   halfAt:d=>pilotSample(candidate,d).halfWidth,weightsAt:d=>pilotWeights(candidate,d),course:pilotCourse(candidate),blenderArt:!!art,dawn:c.id==='canyon',
   narrowings:candidate.placements.filter(p=>p.channel==='width'&&p.parameters.to<p.parameters.from).map(p=>BRICK_START+p.startS-180)});
  preparedWorld.car.rotation.order='YXZ';if(art)preparedWorld.scene.add(art.root);preparedWorld.streamer?.update(c.start);
  report?.(10,'正在準備海岸','整理道路、海灘與沿岸風景。');
  if(c.id==='coast'){
   ocean=await (await import('./coast-ocean')).UltraCoastOcean.create(renderer,preparedWorld.scene,preparedWorld,p=>report?.(12+p*25,'正在準備海岸','讓海浪、船隻與夕陽回到海面。'));
   const sea=preparedWorld.scene.getObjectByName('default-coast-water');if(sea)sea.visible=false;
   boats=await (await import('./coast-boats')).addCoastBoats(preparedWorld.scene,preparedWorld.sample,ocean?.boatSurfaceUniforms,ocean?.boatShadow);
   await renderer.compileAsync(ocean.boatShadow.scene,camera);
  }
  mark('world');await new Promise<void>(r=>requestAnimationFrame(()=>r()));
  const link=attachJourneyLink(preparedWorld,c.start,c.end,c.id,index>0,index<2);configureLinkDestination(link,index);mark('highway');
  while(preparedWorld.streamer&&!preparedWorld.streamer.fullyReady){
   if(preparedWorld.streamer.error)throw Error(preparedWorld.streamer.error);
   if(report){const {desired,chunks}=preparedWorld.streamer.stats,total=desired.length*2,done=chunks.filter(c=>desired.includes(c.index)).reduce((n,c)=>n+Number(c.road==='ready')+Number(c.scenery==='ready'),0);report(40+20*done/Math.max(1,total),'正在準備出發路段',`道路與景物已完成 ${done}／${total} 項。`);}
   preparedWorld.streamer.pump();await new Promise<void>(r=>requestAnimationFrame(()=>r()));
  }
  mark('stream');
  report?.(62,'正在整理田野','準備金色稻田、花海與農舍。');
  await preparedWorld.streamer?.warmFarm(renderer,camera);
  if(preparedWorld.streamer?.error)throw Error(preparedWorld.streamer.error);
  // Warm shaders and upload the entry view before it becomes the active scene.
  const probe=camera.clone(),entry=preparedWorld.sample(c.start+20);
  preparedWorld.car.position.copy(entry.position);preparedWorld.update(0,0,0,c.start+20);
  const pose=chaseTargets(entry.position,entry.roadHeading,probe.aspect,0);probe.position.copy(pose.eye);probe.lookAt(pose.look);
  const uploads:THREE.Object3D[]=[];preparedWorld.car.visible=false;
  preparedWorld.scene.traverseVisible(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.Line)uploads.push(o);});
  const culling=uploads.map(o=>o.frustumCulled);uploads.forEach(o=>{o.visible=false;o.frustumCulled=false;});let worstUpload=0;
  try{
   for(const [uploadIndex,object] of uploads.entries()){
    await new Promise<void>(r=>requestAnimationFrame(()=>r()));
    report?.(70+28*uploadIndex/Math.max(1,uploads.length),'正在完成出發準備',`已整理 ${uploadIndex}／${uploads.length} 組景物，即將重新出發。`);
    // Submit one object's shader work per slice, not a whole chapter in one frame.
    await renderer.compileAsync(object,probe,preparedWorld.scene);
    const began=performance.now(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest(),autoClear=renderer.autoClear,background=preparedWorld.scene.background;
    const material=(object as THREE.Mesh).material,materials=Array.isArray(material)?material:[material],writes=materials.map(m=>[m.colorWrite,m.depthWrite]);
    // Use the real framebuffer's output shader variant and clipping state.
    // A normal offscreen target forces linear output, leaving screen variants cold.
    // Suppress every color/depth write so this tiny draw cannot alter the game view.
    try{
     materials.forEach(m=>{m.colorWrite=false;m.depthWrite=false;});preparedWorld.scene.background=null;renderer.autoClear=false;
     renderer.setViewport(0,0,2,2);renderer.setScissor(0,0,2,2);renderer.setScissorTest(true);object.visible=true;renderer.render(preparedWorld.scene,probe);
    }finally{
     object.visible=false;materials.forEach((m,i)=>{[m.colorWrite,m.depthWrite]=writes[i];});preparedWorld.scene.background=background;renderer.autoClear=autoClear;
     renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
    }
    worstUpload=Math.max(worstUpload,performance.now()-began);
   }
  }finally{uploads.forEach((o,i)=>{o.visible=true;o.frustumCulled=culling[i];});preparedWorld.car.visible=true;}
  steps.push({name:'worstUploadSlice',ms:worstUpload});
  mark('upload');journeyPreparations.push({index,steps});
  return {index,world:preparedWorld,ocean,art,boats,link};
 }catch(error){
  ocean?.dispose();if(preparedWorld){const release=sceneDisposal(preparedWorld.scene);preparedWorld.streamer?.dispose();release();}else if(art){const scene=new THREE.Scene();scene.add(art.root);disposeScene(scene);}throw error;
 }
}
function prefetchNextChapter(){
 if(mode!=='playing'||!chapters||journeyTransition||chapterIndex>=2||preparingChapter||nextChapter||state.distance<chapterEnd()+LINK_LOAD_START||performance.now()<retryPreparationAt)return;
 preparingChapter=true;const epoch=prepareEpoch,index=chapterIndex+1;
 journeyLoadStarts.push({index,distance:state.distance});if(journeyLoadStarts.length>12)journeyLoadStarts.shift();
 void prepareChapter(index).then(c=>{
  if(epoch!==prepareEpoch){releaseChapter(c);return;}
  nextChapter=c;journeyExitAt=journeyLink!.exitAfter(state.distance);preparationError='';
 }).catch(error=>{if(epoch===prepareEpoch){preparationError=String(error);retryPreparationAt=performance.now()+5000;console.error('Highway scene preparation failed',error);}}).finally(()=>{if(epoch===prepareEpoch)preparingChapter=false;});
}
function updateChapterTitle(){
 if(!chapters)return;const c=chapters[chapterIndex];
 $('route-title').textContent=(chapterIndex+1)+' / 3 · '+c.title+' · '+c.time;
 $('release-version').textContent='極速漫遊 · 沿岸到峽谷';
}
function adoptChapter(c:PreparedChapter,replay=false){
 const began=performance.now(),from=chapterIndex,speedBefore=state.speed,oldHeading=world.sample(state.distance).roadHeading;
 const native=chapters![c.index],candidate=native.stage;
 const distance=replay?native.start:native.start-LINK_HALF+Math.max(0,state.distance-(journeyExitAt??chapterEnd()+LINK_HALF));
 const heading=c.world.sample(distance).roadHeading,delta=heading-oldHeading;
 telemetry?.save();
 // Keep the same car, powertrain and input state through the coordinate rebase.
 const unusedCar=c.world.car;unusedCar.removeFromParent();const temp=new THREE.Scene();temp.add(unusedCar);disposeScene(temp);
 c.world.car=world.car;c.world.scene.add(world.car);for(const shadow of contactShadows)c.world.scene.add(shadow);
 const release=sceneDisposal(world.scene),oldOcean=ultraOcean,oldStream=world.streamer;
 coastDuskShadows?.dispose();
 tireEffects.dispose();dustEffects.dispose();impactSparks.dispose();trafficSparks.dispose();traffic?.dispose();cones?.dispose();triangles?.dispose();
 world=c.world;ultraOcean=c.ocean;blenderAsset=c.art;coastBoats=c.boats;journeyLink=c.link;
  if(ultraOcean){
   ultraOcean.boatShadow.enabled=sunsetShadowsEnabled&&coastShadowTechniqueEnabled('boatDepth');
   ultraOcean.setRockSunShadows(sunsetShadowsEnabled&&coastShadowTechniqueEnabled('rockShader'));
  }
 chapterIndex=c.index;journeyExitAt=undefined;trip=candidate;stage=candidate;pilot=candidate;brick=candidate;
 designerMode=native.id==='canyon';coastUltraMode=native.id==='coast';coastUltraWater=coastUltraMode;roadLockMode=designerMode;blenderMode=designerMode;scenicCameraEnabled=false;
  // Keep coast diagnostics out of canyon/city chapters. The reused car still
  // casts normal shadows there, regardless of previous coast checkbox state.
  tripPauseDock?.setShadowAuditVisible(coastUltraMode&&coastGeometryShadows());
  world.car.traverse(o=>{
   if(!(o instanceof THREE.Mesh)||o.userData.coastShadowGroup!=='player')return;
   if(coastUltraMode)markCoastShadowCaster(o,'dynamic','player');else o.castShadow=true;
  });
 renderer.shadowMap.enabled=coastUltraMode?coastGeometryShadows():!matchMedia('(pointer:coarse)').matches;
 coastDuskShadows=coastUltraMode&&sunsetShadowsEnabled&&!coastGeometryShadows()
  ?new CoastDuskShadows(world.scene,world.sample,world.length,world.halfAt,trip?.seed??0):undefined;
 // Reused vehicle and wheel-contact decals must not carry their old teal ink.
 const legacyContact=world.car.getObjectByName('legacy-car-contact-shadow');
 if(legacyContact)legacyContact.visible=!coastUltraMode;
 for(const contact of contactShadows)
  (contact.material as THREE.MeshBasicMaterial).color.set(coastUltraMode?0x000000:0x172d28);
 journeyElapsed=replay?0:journeyElapsed+elapsed;elapsed=0;
 if(replay){state=createState();state.speed=0;initialized=false;input.clear();testControls=undefined;world.car.userData.motion.reset();}
 state.distance=distance;state.worldHeading+=delta;cameraHeading+=delta;
 tireEffects=new TireEffects(world.scene);tireEffects.setDuskSmoke(coastUltraMode);dustEffects=new TireEffects(world.scene,'dust');impactSparks=new ImpactSparks(world.scene);trafficSparks=new ImpactSparks(world.scene,true);
 guardrail=new GuardrailContact(carBounds.x/2,carBounds.z/2,world.boundaries);rockContact=new RockContact(world.rockSections,world.halfAt,carBounds.x/2,carBounds.z/2,actorRoadReady);coastStoneContact=new CoastStoneContact(world.halfAt,carBounds.x/2,carBounds.z/2,d=>world.streamer?.sceneryReady(d)??true);
 const actorRoad=(d:number)=>d>=native.start&&d<=native.end&&(world.streamer?.roadReady(d)??true);
 cones=!roadLockMode?new RoadCones(world.sample,world.halfAt,world.scene,candidate.seed,world.length,actorRoad,undefined,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows()):undefined;
 triangles=!roadLockMode?new RoadCones(world.sample,world.halfAt,world.scene,candidate.seed,world.length,actorRoad,world.breakdowns,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows()):undefined;
 traffic=!roadLockMode?new Traffic(world.scene,world.sample,world.halfAt,world.length,candidate.seed,trafficRoadReady,world.breakdowns,world.junction,coastUltraMode,coastUltraMode&&sunsetShadowsEnabled,coastGeometryShadows(),trafficSessionVariation):undefined;
  traffic?.setContactShadowsEnabled(!coastUltraMode||coastShadowTechniqueEnabled('contactDecals'));
 if(chapterIndex<2)traffic?.enableHighway(native.end);
 pendingExhaustRpm=0;trafficImpact.reset();sound.resetPassBy();history.clear();l2UI?.reset();l2UI?.setCandidate(candidate);reportArea.hidden=true;
 telemetry=new DriveTelemetry(candidate.stageCode,candidate.seed,candidate.generatorVersion,'outrun-trip-drive-reports-v09');
 wheelSurfaces=world.scene.children.filter(o=>o.name==='driving-surface'||o.name==='shoulder');surfacesReady=false;scenicDriftBlend=scenicWeight=0;brickCompleted=false;streamStartRequested=false;holdRoad(false);updateChapterTitle();
 // Retire after the active scene has switched. Never clear controls, pause audio,
 // reset the chase filter or count down at a normal join.
 oldStream?.dispose();oldOcean?.dispose();release();renderer.renderLists.dispose();
 journeyTransitions.push({from,to:c.index,ms:performance.now()-began,speedBefore,speedAfter:state.speed,headingError:(cameraHeading-heading),rebase:delta});
}
function highwayHandoff(){
 if(!chapters||chapterIndex>=2||journeyExitAt===undefined||state.distance<journeyExitAt||!nextChapter)return;
 const c=nextChapter;nextChapter=undefined;adoptChapter(c);
}
async function restartJourney(){
 if(journeyTransition)return;journeyTransition=true;mode='paused';settingsOpen=false;sound.pause();input.clear();prepareEpoch++;preparingChapter=false;roadOverlay.hidden=true;
 tripPauseDock?.collapse();loadingStarted();ui();
 await loadingStep(2,'正在準備重新出發','海岸旅程準備中，完成後會自動出發。');
 if(nextChapter){releaseChapter(nextChapter);nextChapter=undefined;}
 try{const c=await prepareChapter(0,loadingProgress);adoptChapter(c,true);journeyTransition=false;loadingFinished();start();}
 catch(error){journeyTransition=false;loadingFailed('重新出發準備失敗，請重新載入再試一次。');console.error('Journey replay failed',error);ui();}
}

let startupPending=true;
// After the road is ready, the playable coast launches without a second
// Play/Resume click. On portrait phones, begin as soon as landscape is ready.
let autoStartOnReady=playerUi;
let startupDiagnosticSampleAt=0;
let last=performance.now();
function loop(now:number){
  const fpsCallbackStart=driveFpsDiagnostics.enabled?performance.now():0;
  if(startupDiagnostics.enabled&&startupPending){
    startupDiagnostics.frame(now);
    if(now-startupDiagnosticSampleAt>=250){
      startupDiagnosticSampleAt=now;
      const snapshot=world.streamer?.startupDiagnosticState();
      if(snapshot)startupDiagnostics.sample(snapshot);
    }
  }
  if(journeyTransition){last=now;requestAnimationFrame(loop);return;}
  prefetchNextChapter();
  if(mode==='playing')highwayHandoff();
  if(streamStartRequested&&world.streamer){if(world.streamer.ready)start();else if(world.streamer.error){const status=document.getElementById('stream-status');if(status)status.textContent=`Scene preparation failed: ${world.streamer.error}`;streamStartRequested=false;}}
  if(autoLaunchArmed&&(mode==='playing'||mode==='countdown'))autoLaunchArmed=false;
  if(autoLaunchArmed&&!document.hidden&&landscapeReady()&&!settingsOpen&&(!world.streamer||world.streamer.ready)){
    autoLaunchArmed=false;autoLaunchNeedsManual=false;
    // Same start/restart behavior as the existing Play button, minus a second tap.
    if(mode==='menu'||brickCompleted)restart();else start();
  }
  pad.poll(mode==='playing'&&!settingsOpen,!!l2UI?.feedbackOpen,brickCompleted&&!settingsOpen,sceneInspector?.isOpen??false,!!sceneInspector);
  const dt=Math.min((now-last)/1000,.25);last=now;
  // Integrate elapsed time in bounded physics steps; slow rendering must not
  // turn a 65m/s drive into slow motion by discarding every frame above 50ms.
  const fpsPhysicsStart=driveFpsDiagnostics.enabled&&mode==='playing'?performance.now():0;
  if(!manual)for(let remaining=dt;remaining>1e-8;){const tick=Math.min(remaining,1/120);if(advance(tick)===false)break;remaining-=tick;}
  if(fpsPhysicsStart)driveFpsDiagnostics.cpu('physics',performance.now()-fpsPhysicsStart);
  render(dt);
  if(startupDiagnostics.enabled)startupDiagnostics.drivingFrame(now,mode==='playing',state.distance,renderer.info.render.calls);
  void world.streamer?.warmFarm(renderer,camera);
  if(startupPending){
    const stream=world.streamer;
    if(stream?.error){if(startupDiagnostics.enabled)startupDiagnostics.sample(stream.startupDiagnosticState());loadingFailed('前方道路載入失敗，請檢查連線後重新載入。');startupPending=false;}
    else if(!stream||stream.ready){if(startupDiagnostics.enabled&&stream)startupDiagnostics.sample(stream.startupDiagnosticState());loadingFinished(false);startupPending=false;}
    else{
      const {nearby,chunks}=stream.stats;
      const done=chunks.filter(c=>nearby.includes(c.index)).reduce((n,c)=>n+Number(c.road==='ready')+Number(c.scenery==='ready'),0),total=nearby.length*2;
      loadingProgress(82+16*done/Math.max(1,total),'正在準備出發路段',`道路與景物已完成 ${done}／${total} 項。準備好就能出發。`);
    }
  }
  // No initial pause screen: a stationary car awaits the driver's throttle.
  // Preserve portrait rotation assistance and any genuine loading error.
  if(autoStartOnReady&&!startupPending&&mode==='menu'&&!settingsOpen&&!brickCompleted
   &&!document.hidden&&(!mobile()||landscapeReady())){autoStartOnReady=false;start();}
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
  const fpsText=`${perf.fps?Math.round(perf.fps):'—'} FPS`;
  if($('drive-fps').textContent!==fpsText)$('drive-fps').textContent=fpsText;
  const hudText=`${Math.floor((elapsed+journeyElapsed)/60)}:${String(Math.floor((elapsed+journeyElapsed)%60)).padStart(2,'0')}`;
  if($('drive-hud').textContent!==hudText)$('drive-hud').textContent=hudText;

  if(!manual&&mode==='playing'&&!settingsOpen)speedAudit?.record({wall:now,simulated:elapsed,progress:state.distance,speed:state.speed,position:world.car.position.toArray(),camera:camera.position.toArray(),trackLength:world.length,heading:state.worldHeading,lateral:state.lateral,pace:effectivePace(state.speed,highSpeedPace)});
  else speedAudit?.reset();
  if(driveFpsDiagnostics.enabled){
   driveFpsDiagnostics.cpu('callback',performance.now()-fpsCallbackStart);
   driveFpsDiagnostics.frame(now,mode==='playing'&&!settingsOpen,state.distance,
    renderer.info.render.calls,renderer.info.render.triangles);
  }
  requestAnimationFrame(loop);
}
if(brick&&!l2&&!pilot)labUI=mountBrickLab(brick,{play:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();if(mode==='menu'||brickCompleted)restart();else start();},replay:()=>{if(mobile()&&!immersive.isIPhone)void immersive.enter();restart();},settings:()=>$('settings').click(),sound:()=>$('sound').click(),fullscreen:()=>$('fullscreen').click(),exportMoments:()=>l2UI?.exportCurrent()});
ui();resize();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=journeyLink?.inHighway(state.distance)?ray.intersectObjects(journeyLink.contacts)[0]:road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
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
// Public completion/replay is the one primary player button. Legacy L2
// route-selection/replay controls remain internal and must not compete with
// it until the dedicated main menu is built.
if(playerUi)for(const id of ['l2-replay','l2-next']){
 const button=document.getElementById(id);
 if(button)button.hidden=true;
}
if(trip)tripPauseDock=new TripPauseDock($('app'),{
 resume:start,replay:restart,
 settings:()=>{$('settings').click();},sound:()=>{$('sound').click();},
 fullscreen:()=>{$('fullscreen').click();},
 review:()=>{
  const opening=!l2UI?.reviewExpanded;
  l2UI?.setReviewExpanded(opening);tripPauseDock?.collapse();ui();
  if(!mobile())(opening?document.getElementById('l2-play'):tripPauseDock?.moreButton)?.focus();
 },
},!playerUi,coastUltraMode&&coastGeometryShadows()&&params.get('fpsdiag')==='1'?{onChange:applyShadowTechnique}:undefined);
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
  journeyLoadHold:(held:boolean)=>{journeyLoadHeld=held;},
  journey:()=>({enabled:journeyMode,index:chapterIndex,transitioning:journeyTransition,totalElapsed:journeyElapsed+elapsed,memory:{...renderer.info.memory},chapters:chapters?.map(c=>({id:c.id,title:c.title,start:c.start,end:c.end})),transitions:journeyTransitions,preparations:journeyPreparations,exitAt:journeyExitAt,loadStarts:journeyLoadStarts,loadHeld:journeyLoadHeld,preparing:preparingChapter,prepared:nextChapter?.index,error:preparationError,highway:journeyLink?.inHighway(state.distance)}),
  driveState:()=>({...state,elapsed,mode,trackLength:world.length}),
  streamFrame:()=>({elapsed,distance:state.distance,held:streamHeld,road:world.streamer?.roadReady(state.distance)??true,cameraRoad:world.streamer?.roadReady(Math.max(0,state.distance-40))??true,safe:world.streamer?.canDrive(state.distance,state.speed*effectivePace(state.speed,highSpeedPace))??true,contextLost}),
  centerRoad:()=>{const p=world.sample(state.distance),ray=new THREE.Raycaster(p.position.clone().add(new THREE.Vector3(0,10,0)),down,0,20);return world.streamer?.raycastContacts(ray,state.distance).some(h=>Math.abs(h.point.y-p.position.y)<.08)??true;},
  carView:(view:'front'|'side'|'cockpit')=>{
    manual=true;inspectionView=view;render(1/60);
  },
  perf:()=>({...perf}),
  blenderArt:()=>blenderAsset?.stats??{status:'disabled'},
  coastFarm:()=>world.streamer?.farmStats??[],
  coastBoats:()=>coastBoats?.inspect(elapsed)??[],
  coastBoatShadow:(enabled?:boolean)=>{if(enabled!==undefined&&ultraOcean){ultraOcean.boatShadow.enabled=enabled;render(0);}return ultraOcean?.boatShadow.stats;},
  coastWater:()=>({mode:ultraOcean?'ultra':coastUltraMode?'basic':'disabled',...ultraOcean?.stats}),
  coastNature:()=>{let batches=0,visible=0,instances=0,triangles=0;const materials=new Set(),textures=new Set();world.scene.traverse(o=>{if(!(o instanceof THREE.InstancedMesh)||!o.userData.nature)return;batches++;const m=o.material as THREE.MeshStandardMaterial;materials.add(m);if(m.map)textures.add(m.map);if(o.visible){visible++;instances+=o.count;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*o.count;}});return {batches,visible,instances,triangles,materials:materials.size,textures:textures.size};},
  artProbe:(distance:number,lateral=0)=>{if(!blenderAsset)return [];world.scene.updateMatrixWorld(true);const p=world.sample(distance).position.addScaledVector(world.sample(distance).right,lateral);return new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,500,0)),down,0,1000).intersectObject(blenderAsset.root,true).map(h=>({name:h.object.name,gap:h.point.y-p.y}));},
  tireEffects:()=>tireEffects.inspect(),
  railClearance:()=>{const p=world.sample(state.distance),v=new THREE.Vector3();let edge=-Infinity;world.car.updateMatrixWorld(true);world.car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(p.position);edge=Math.max(edge,v.dot(p.right));}});return CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness-edge;},
  surfaceFeedback:()=>({dust:dustEffects.inspect(),guard:guardrail.inspect(state.heading),sparks:impactSparks.inspect()}),
  boundaryClearance:()=>{const p=world.sample(state.distance),right=new THREE.Vector3(p.right.x,0,p.right.z),v=new THREE.Vector3();let lo=Infinity,hi=-Infinity;world.car.updateMatrixWorld(true);world.car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(p.position);const x=v.dot(right);lo=Math.min(lo,x);hi=Math.max(hi,x);}});const b=world.boundaries?.(state.distance);return {left:b?.left===undefined?null:lo-b.left,right:b?.right===undefined?null:b.right-hi};},
  bridgeAudit:()=>{const p=world.sample(state.distance),ray=new THREE.Raycaster(),targets=['terrain','road-detail','road-support','shoulder'].flatMap(n=>world.scene.getObjectByName(n)?.children??[]);world.scene.updateMatrixWorld(true);return [0,25,-25].map(x=>{const origin=p.position.clone().addScaledVector(p.right,x);origin.y-=x===0?2:-5;ray.set(origin,new THREE.Vector3(0,-1,0));return {x,origin:origin.toArray(),hits:ray.intersectObjects(targets,true).slice(0,3).map(h=>({kind:h.object.userData.roadKind,y:h.point.y}))};});},
  bridge:()=>world.bridge,bridgeView:(enabled:boolean)=>{bridgeInspection=enabled;render(1/60);},
  shoulders:()=>world.shoulders?.(state.distance),
  rocks:()=>({sections:world.rockSections,contact:rockContact.inspect()}),
  coastStones:()=>coastStoneContact.inspect(),
  breakdowns:()=>world.breakdowns,
  triangles:()=>triangles?.inspect(),
  cones:()=>cones?.inspect(),
  traffic:()=>traffic?.inspect(),
  trafficClearance:()=>traffic?.clearance(state.distance,state.lateral,carBounds.x/2,carBounds.z/2,state.heading+trafficImpact.yaw+guardrail.yaw),
  trafficImpact:()=>({velocity:trafficImpact.velocity,slide:trafficImpact.slide,yaw:trafficImpact.yaw,roll:trafficImpact.roll,event:trafficImpact.event,sparks:trafficSparks.inspect()}),
  trafficSchedule:()=>trafficRecipe(((trip?.seed??1)^trafficSessionVariation)>>>0,world.length),
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
    inspectionView=undefined;sound.pause();sound.resetPassBy();traffic?.reset();cones?.reset();triangles?.reset();tireEffects.clear();dustEffects.clear();impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();coastStoneContact.reset();history.clear();usedExternalControls=false;lastControls={gas:false,brake:false,steer:0};brakeLights.reset();exhaustEffects.reset();pendingExhaustRpm=0;world.car.userData.motion.reset();
    speedAudit?.reset();
    state={...createState(),...initial};advancePowertrain(state,state.speed,false,0);state.velocityHeading=state.heading;state.worldHeading=world.sample(state.distance).roadHeading+state.heading;updateFootprint(state,world.halfAt(state.distance));brickCompleted=false;elapsed=0;initialized=false;mode='playing';testControls=undefined;input.clear();ui();render(1/60);
  },
  recentHistory:()=>history.snapshot(),
  sample:(d:number)=>{const p=world.sample(d);return {bankDegrees:(-Math.atan(p.right.y)*180/Math.PI)||0,halfWidth:world.halfAt(d),lanes:pilot?pilotSample(pilot,d).lanes:brick?brickWidth(brick,d).lanes:3,grade:p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z),position:p.position.toArray(),curvature:p.curvature,roadHeading:p.roadHeading,tangent:p.tangent.toArray(),challenge:p.challenge};}
};}
// Retired challenge / pace / velocity / stage URL overlays.
/* Opt-in QA Scene Inspector: exact route/biome sites, not a second world generator. */
if(params.has('at')&&trip&&!journeyMode){
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
  impactSparks.clear();trafficSparks.clear();trafficImpact.reset();guardrail.reset();rockContact.reset();coastStoneContact.reset();
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
  roadExists:actorRoadReady,
  ready:()=>!world.streamer||world.streamer.ready,
  clockAudit:auditClock,
  view:view=>{inspectionView=view==='side'?'side':undefined;bridgeInspection=false;},
  drive:()=>{state.speed=170/3.6;advancePowertrain(state,state.speed,false,0);manual=false;start();},
 },trip.seed);
 $('qa-tools').prepend(sceneInspector.toggle);
 // Shareable QA coordinates, including when a particular building is missed.
 // The initial position came from ?at. Do not auto-open a QA overlay.
 
}
