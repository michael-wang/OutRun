import * as THREE from 'three';
import { createWorld } from './world';
import { createState, step } from './handling';
import { InputController, readSwapped, saveSwapped } from './input';
import { EngineSound } from './sound';
import './style.css';

document.querySelector('#app')!.innerHTML = `
<div id="view"></div><div class="vignette"></div>
<header><span class="wordmark">FIRST DRIVE <small>COASTAL STUDY / 01</small></span><nav><button id="pause" aria-label="Pause">Pause</button><button id="restart">Restart</button><button id="sound" aria-pressed="true">Sound on</button><button id="settings">Settings</button></nav></header>
<aside id="speed"><strong>000</strong><span>KM/H · ARCADE</span><em id="status">READY FOR THE COAST</em></aside>
<section id="menu" class="panel"><div class="eyebrow">A LITTLE SUN. A LONG WAY HOME.</div><h1>Take the<br>coast road.</h1><p>A sunlit drive. Open bends. Nothing to chase.</p><button id="drive" class="primary">Drive <span>↗</span></button><p class="keys">W / ↑ accelerate &nbsp; A D / ← → steer<br>S / ↓ brake &nbsp; P / Esc pause &nbsp; R restart</p><small>FIRST DRIVE · LOCAL PLAYTEST · v0.1</small></section>
<section id="paused" class="panel" hidden><div class="eyebrow">TAKE A BREATHER</div><h1>Coast is clear.</h1><button id="resume" class="primary">Resume ↗</button></section>
<section id="preferences" class="panel" hidden><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Controls</h2><label class="setting"><input id="swap" type="checkbox"> Steering on the right</label><p>Accelerator stays above brake on either side.</p><button id="close-settings" class="primary">Done</button></section>
<div id="touch"><div class="steering"><button data-control="left" aria-label="Steer left">←</button><button data-control="right" aria-label="Steer right">→</button></div><div class="pedals"><button data-control="gas">GAS</button><button data-control="brake">BRAKE</button></div></div>
<div id="rotate"><span>↻</span>Turn toward the horizon<small>Rotate your phone to landscape to drive.</small></div>`;
const $ = (id:string) => document.getElementById(id)!;
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.75));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('view').append(renderer.domElement);
const world=createWorld(); world.car.rotation.order="YXZ"; const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,2200);
const input=new InputController(); const sound=new EngineSound(); let state=createState();
let mode:'menu'|'playing'|'paused'='menu'; let settingsOpen=false; let muted=false; let manual=false;
const cameraTarget=new THREE.Vector3(); let initialized=false; let elapsed=0; let frames=0;
let swapped=readSwapped();
function applyLayout(){ $('touch').classList.toggle('swapped',swapped); ($('swap') as HTMLInputElement).checked=swapped; }
applyLayout();
function ui(){ $('menu').hidden=mode!=='menu'||settingsOpen; $('paused').hidden=mode!=='paused'||settingsOpen; $('preferences').hidden=!settingsOpen; $('touch').classList.toggle('active',mode==='playing'&&!settingsOpen); $('pause').textContent=mode==='playing'?'Pause':'Resume'; }
function start(){sound.unlock(); mode='playing'; settingsOpen=false; input.clear(); ui();}
function pause(){if(mode==='menu')return; mode=mode==='playing'?'paused':'playing'; input.clear(); if(mode==='paused')sound.pause();ui();}
function restart(){state=createState(); elapsed=0; initialized=false; start();}
$('drive').onclick=start; $('resume').onclick=start; $('pause').onclick=pause; $('restart').onclick=restart;
$('sound').onclick=()=>{muted=!muted;sound.unlock();sound.setMuted(muted);$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));};
$('settings').onclick=()=>{if(mode==='playing')mode='paused';settingsOpen=true;input.clear();sound.pause();ui();};
$('close-settings').onclick=()=>{settingsOpen=false;ui();};
$('swap').onchange=()=>{swapped=($('swap') as HTMLInputElement).checked;saveSwapped(swapped);applyLayout();};
addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape'||e.code==='KeyP')pause();if(e.code==='KeyR')restart();});
addEventListener('blur',()=>{input.clear();if(mode==='playing'){mode='paused';sound.pause();ui();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'){mode='paused';input.clear();sound.pause();ui();}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function advance(dt:number){if(mode==='playing'&&!settingsOpen){step(state,input.snapshot(),dt,world.sample(state.distance).curvature);elapsed+=dt;sound.update(state.speed,state.slip,input.snapshot().gas);}else sound.pause();}
function render(dt:number,draw=true){const p=world.sample(state.distance);world.car.position.copy(p.position).addScaledVector(p.right,state.lateral);world.car.position.y+=.04;
const direction=p.tangent.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-state.heading);world.car.rotation.set(-Math.asin(p.tangent.y),Math.atan2(direction.x,direction.z),-state.slip*state.heading*.15);
const desired=p.position.clone().addScaledVector(p.right,state.lateral*.65).addScaledVector(p.tangent,-11.8-state.speed*.035).add(new THREE.Vector3(0,5.7,0));
const look=world.sample(state.distance+22+state.speed*.23).position.clone().addScaledVector(p.right,state.lateral*.3);look.y+=1.8;
if(!initialized){camera.position.copy(desired);cameraTarget.copy(look);initialized=true;}else{camera.position.lerp(desired,1-Math.exp(-dt*5));cameraTarget.lerp(look,1-Math.exp(-dt*6));}camera.lookAt(cameraTarget);
world.update(elapsed,state.speed,state.slip);if(!draw)return;renderer.render(world.scene,camera);frames++;
$('speed').querySelector('strong')!.textContent=Math.round(state.speed*3.6).toString().padStart(3,'0');$('status').textContent=state.slip>.12?'SLIDING · FIND YOUR LINE':Math.abs(state.lateral)>7?'SHOULDER · EASE BACK':mode==='playing'?'THE COAST IS YOURS':'READY FOR THE COAST';}
let last=performance.now();function loop(now:number){const dt=Math.min((now-last)/1000,.05);last=now;if(!manual)advance(dt);render(dt);requestAnimationFrame(loop);}ui();requestAnimationFrame(loop);
function surfaceError(){const ray=new THREE.Raycaster(world.car.position.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));const road=world.scene.getObjectByName('driving-surface');const hit=road?ray.intersectObject(road)[0]:undefined;return hit?world.car.position.y-.04-hit.point.y:null;}
if(import.meta.env.DEV){(window as any).__drive={snapshot:()=>({...state,mode,elapsed,frames,inputs:input.snapshot(),audio:sound.inspect(),trackLength:world.length,position:world.car.position.toArray(),swapped,surfaceError:surfaceError(),rightScreenDelta:world.car.position.clone().add(world.sample(state.distance).right).project(camera).x-world.car.position.clone().project(camera).x}),manual:(value:boolean)=>{manual=value;},advance:(seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++){advance(1/60);render(1/60,false);}render(1/60);},sample:(d:number)=>{const p=world.sample(d);return {position:p.position.toArray(),curvature:p.curvature};}};}




