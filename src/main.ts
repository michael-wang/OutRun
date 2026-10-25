import * as THREE from 'three';
import { createWorld } from './world';
import { createState, step, updateFootprint, angleDifference, type InputState } from './handling';
import { InputController, readSwapped, saveSwapped } from './input';
import { EngineSound } from './sound';
import { Immersive } from './immersive';
import { CHASE, chaseTargets, chaseComposition } from './chase';
import { SpeedAudit } from './speed-audit';
import { DEFAULT_PACE,selectedPace,effectivePace } from './pace';
import {speedometerMarkup,needleAngle} from './speedometer';
import {COURSE,challengeAt,requiredSteering} from './challenges';
import {quantizeSteering} from './steering';
import './style.css';

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<header><span class="wordmark">FIRST DRIVE <small>ARCADE VELOCITY / 03</small></span><nav><button id="pause" aria-label="Pause / Menu">Ⅱ Menu</button></nav></header>
<div id="immersive-note" role="status" hidden></div><aside id="speed" aria-label="Speedometer">${speedometerMarkup()}</aside>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>Take the<br>coast road.</h1><p>Steer through the bends. Lift or brake to find your line.</p><button id="drive" class="primary">Drive <span>↗</span></button><p class="keys">A / D steer &nbsp; Space accelerate<br>Enter brake &nbsp; P / Esc pause &nbsp; R restart</p><small>FIRST DRIVE · LOCAL PLAYTEST · v0.4.3</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Resume ↗</button><div class="menu-actions"><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button><button id="fullscreen">Fullscreen</button></div></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Controls</h2><label class="setting"><input id="swap" type="checkbox"> Steering on the right</label><p>Accelerator stays above brake on either side.</p><button id="close-settings" class="primary">Done</button></section>
<div id="touch"><div id="steering-strip" class="steering" role="slider" tabindex="0" aria-label="Steering position" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><span class="steer-label">← STEER →</span><span class="steer-rail"><i class="steer-center"></i><i class="steer-cursor"></i></span><span class="steer-hint">4 LEVELS · RELEASE TO NEUTRAL</span></div><div class="pedals"><button data-control="gas">GAS</button><button data-control="brake">BRAKE</button></div></div>
<div id="rotate"><span>↻</span>Turn toward the horizon<small>Rotate your phone to landscape to drive.</small><button id="rotate-fullscreen">Try fullscreen</button><button id="rotate-pause">Pause / resume</button></div>`;
const $ = (id:string) => document.getElementById(id)!;
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('view').append(renderer.domElement);
const world=createWorld(); world.car.rotation.order="YXZ"; const camera=new THREE.PerspectiveCamera(CHASE.fov,innerWidth/innerHeight,.1,2200);
const input=new InputController(document,()=>mode==='playing'&&!settingsOpen); const sound=new EngineSound(); let state=createState(); state.worldHeading=world.sample(0).roadHeading;
const mobile=()=>matchMedia("(pointer:coarse)").matches;
let mode:'menu'|'playing'|'paused'='menu'; let settingsOpen=false; let muted=false; let manual=false;
let testControls:InputState|undefined;let hardDetents=false;
const highSpeedPace=import.meta.env.DEV?selectedPace(new URLSearchParams(location.search).get('pace')):DEFAULT_PACE;
let cameraHeading=0; let initialized=false; let elapsed=0; let frames=0;
const speedAudit=import.meta.env.DEV?new SpeedAudit():undefined;
const immersive=new Immersive($('app'),()=>{
  $('fullscreen').textContent=immersive.active?'Exit fullscreen':immersive.installed?'PWA fullscreen':'Fullscreen';
  $('immersive-note').textContent=immersive.message;
  $('immersive-note').hidden=!immersive.message;
});
let swapped=readSwapped();
function applyLayout(){ $('touch').classList.toggle('swapped',swapped); ($('swap') as HTMLInputElement).checked=swapped; }
applyLayout();
function ui(){ $('menu').hidden=mode!=='menu'||settingsOpen; $('paused').hidden=mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',mode==='playing'&&!settingsOpen); $('pause').textContent=mode==='playing'?'Ⅱ Menu':'☰ Menu'; }
function start(){state.appliedSteer=state.steerFrom=state.steerTo=state.steerTime=0;void sound.unlock().catch(()=>{}); mode='playing'; settingsOpen=false; input.clear();(document.activeElement as HTMLElement)?.blur?.();ui();}
function pause(){if(mode==='paused'){start();return;}mode='paused';input.clear();sound.pause();ui();}
function restart(){state=createState();state.worldHeading=world.sample(0).roadHeading; elapsed=0; initialized=false; start();}
$('drive').onclick=()=>{if(mobile())void immersive.enter();start();};
$('resume').onclick=start; $('pause').onclick=pause; $('restart').onclick=restart;
$('fullscreen').onclick=()=>{input.clear();void immersive.toggle();};
$('rotate-fullscreen').onclick=()=>{input.clear();void immersive.enter();};
$('rotate-pause').onclick=()=>{if(mode==='menu')start();else pause();};
$('sound').onclick=()=>{muted=!muted;void sound.unlock().catch(()=>{});sound.setMuted(muted);$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));};
$('settings').onclick=()=>{if(mode==='playing')mode='paused';settingsOpen=true;input.clear();sound.pause();ui();};
$('close-settings').onclick=()=>{settingsOpen=false;ui();};
$('swap').onchange=()=>{swapped=($('swap') as HTMLInputElement).checked;saveSwapped(swapped);applyLayout();};
addEventListener('keydown',e=>{
  if(e.repeat||(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable="true"]')))return;
  if(e.code==='Escape'||e.code==='KeyP')pause();if(e.code==='KeyR')restart();
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
  if(mode==='playing'&&!settingsOpen){const external=override??(import.meta.env.DEV?testControls:undefined),controls=external??{...input.snapshot(),rawSteer:input.steeringTarget};if(import.meta.env.DEV&&hardDetents){const q=quantizeSteering(controls.steer,state.effectiveSteer);state.appliedSteer=q;state.steerFrom=q;state.steerTo=q;state.steerTime=1;}step(state,controls,dt,world.sample(state.distance).curvature,highSpeedPace);elapsed+=dt;sound.update(state.speed*effectivePace(state.speed,highSpeedPace),state.slip,controls.gas&&!controls.brake,dt);}else sound.pause();
}
function groundHeight(height:number,lateral:number){
  if(lateral < -13)return THREE.MathUtils.lerp(height-.1,-5.05,Math.min(1,(-lateral-13)/14));
  if(lateral>13)return height-.12-Math.min(1,(lateral-13)/62)*2.88;
  return height+(Math.abs(lateral)>7?-.1:0);
}
function render(dt:number,draw=true){
  const p=world.sample(state.distance);
  world.car.position.copy(p.position).addScaledVector(p.right,state.lateral);
  world.car.position.y=groundHeight(p.position.y,state.lateral)+.04;
  world.car.rotation.set(-Math.atan2(p.tangent.y*Math.cos(state.heading),Math.hypot(p.tangent.x,p.tangent.z)),-p.roadHeading-state.heading,-state.slipAngle*.16);
  const travelHeading=p.roadHeading;
  if(!initialized){cameraHeading=travelHeading;initialized=true;}
  else cameraHeading+=angleDifference(travelHeading-cameraHeading)*(1-Math.exp(-dt*7));
  // Anchor translation to the car. World-position lerp would add v/tau trailing
  // distance and recreate a speed-dependent dolly despite a constant target offset.
  const targets=chaseTargets(world.car.position,cameraHeading,camera.aspect,p.tangent.y/Math.hypot(p.tangent.x,p.tangent.z));
  camera.position.copy(targets.eye);camera.lookAt(targets.look);
  world.update(elapsed,state.speed,state.slip);if(!draw)return;renderer.render(world.scene,camera);frames++;
  $('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');
  $('speed-needle').setAttribute('transform',`rotate(${needleAngle(state.speed*3.6)} 100 100)`);
  $('status').textContent=state.offRoad?'OFF ROAD · STEER BACK':state.slip>.2?'CORNERING · HOLD YOUR LINE':mode==='playing'?'STEER YOUR OWN LINE':'READY FOR THE COAST';
}
let last=performance.now();
function loop(now:number){
  const dt=Math.min((now-last)/1000,.25);last=now;
  // Integrate elapsed time in bounded physics steps; slow rendering must not
  // turn a 65m/s drive into slow motion by discarding every frame above 50ms.
  if(!manual)for(let remaining=dt;remaining>1e-8;){const tick=Math.min(remaining,1/120);advance(tick);remaining-=tick;}
  render(dt);
  if(!manual&&mode==='playing'&&!settingsOpen)speedAudit?.record({wall:now,simulated:elapsed,progress:state.distance,speed:state.speed,position:world.car.position.toArray(),camera:camera.position.toArray(),trackLength:world.length,heading:state.worldHeading,lateral:state.lateral,pace:effectivePace(state.speed,highSpeedPace)});
  else speedAudit?.reset();
  requestAnimationFrame(loop);
}
ui();resize();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{});});
}
if(import.meta.env.DEV){(window as any).__drive={
  challenges:()=>COURSE,
  steering:()=>({rawSteer:input.steeringTarget,effectiveSteer:input.effectiveSteer,appliedSteer:state.appliedSteer,requiredSteer:requiredSteering(world.sample(state.distance).curvature,state.speed),roadRelativeX:state.lateral,challenge:challengeAt(state.distance)}),
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
  snapshot:()=>({...state,highSpeedPace,effectivePace:effectivePace(state.speed,highSpeedPace),travelSpeed:state.speed*effectivePace(state.speed,highSpeedPace),mode,elapsed,frames,inputs:input.snapshot(),audio:sound.inspect(),trackLength:world.length,position:world.car.position.toArray(),swapped,surfaceError:surfaceError(),camera:{...chaseComposition(camera.aspect),position:camera.position.toArray()},immersive:immersive.snapshot(),rightScreenDelta:world.car.position.clone().add(world.sample(state.distance).right).project(camera).x-world.car.position.clone().project(camera).x}),
  manual:(value:boolean)=>{manual=value;},
  advance:(seconds:number,override?:InputState)=>{for(let i=0;i<Math.ceil(seconds*120);i++){advance(1/120,override);render(1/120,false);}render(1/120);},
  reset:(initial:{distance?:number;speed?:number;lateral?:number;heading?:number})=>{
    speedAudit?.reset();
    state={...createState(),...initial};state.velocityHeading=state.heading;state.worldHeading=world.sample(state.distance).roadHeading+state.heading;updateFootprint(state);elapsed=0;initialized=false;mode='playing';testControls=undefined;input.clear();ui();render(1/60);
  },
  sample:(d:number)=>{const p=world.sample(d);return {position:p.position.toArray(),curvature:p.curvature,roadHeading:p.roadHeading,tangent:p.tangent.toArray(),challenge:p.challenge};}
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
