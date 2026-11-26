import {menuFaceButtons,PadMenuNavigation} from './pad-menu-navigation';
import type {InputLatch} from './input';
export type PadAction='confirm'|'back'|'pause'|'fullscreen'|'up'|'down'|'left'|'right'|'camera-prev'|'camera-next'|'camera-reset'|'photo'|'qa';
function connectedPad(preferred?:number,stageMenu=false){
 try{
  const pads=Array.from(navigator.getGamepads?.()??[]).filter((p):p is Gamepad=>!!p?.connected);
  const standard=pads.filter(p=>p.mapping==='standard'||(stageMenu&&menuFaceButtons(p)));
  const active=standard.filter(p=>p.buttons.some(b=>b.pressed||b.value>.5)||(stageMenu?[p.axes[0],p.axes[1]]:p.axes).some(a=>Math.abs(a)>.55));
  const pool=active.length?active:standard.length?standard:pads;
  return pool.find(p=>p.index===preferred)??pool[0];
 }
 catch{return undefined;}
}
function stageDirection(pad:Gamepad){
 const [x=0,y=0]=pad.axes;
 return Math.max(Math.abs(x),Math.abs(y))>.55?Math.sign(Math.abs(x)>=Math.abs(y)?x:y):0;
}
function buttonDown(button:GamepadButton){return button.pressed||button.value>.5;}
/** Standard mapping: button actions are edges; orbitAxis is continuous. */
export class GamepadInput {
 orbitAxis=0;
 private preferredIndex:number|undefined;
 private stickDirection=0;
 private menuNavigation=new PadMenuNavigation();
 private resync=false;
 private padIdentity='';
 private readonly onBlur=()=>this.release();
 dispose(){window.removeEventListener('blur',this.onBlur);this.release();this.status.remove();}
 private previous:boolean[]=[];private needsNeutral=true;private axisActive=false;private meaningfulAxis=0;private readonly status:HTMLElement;private lastChanged='none';
 constructor(private input:InputLatch,private action:(action:PadAction)=>void,private activity:()=>void=()=>{},private disconnected:()=>void=()=>{}){this.status=document.createElement('div');this.status.id='gamepad-status';this.status.setAttribute('role','status');this.status.hidden=true;document.querySelector('#app')!.append(this.status);window.addEventListener('blur',this.onBlur);
  // A newly mounted screen inherits physical buttons already held at creation.
  const mounted=connectedPad();this.previous=mounted?.buttons.map(buttonDown)??[];this.menuNavigation.capture(mounted?.axes[0]??0,mounted?.axes[1]??0,this.previous);this.stickDirection=mounted?stageDirection(mounted):0;this.padIdentity=mounted?`${mounted.index}:${mounted.id}`:'';
 }
 private releaseDrive(){this.orbitAxis=0;this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');}
 neutralize(){this.releaseDrive();const pad=connectedPad();this.menuNavigation.capture(pad?.axes[0]??0,pad?.axes[1]??0,pad?.buttons.map(buttonDown)??[]);this.needsNeutral=true;}
 private release(){this.resync=true;this.releaseDrive();this.orbitAxis=0;this.previous=[];this.stickDirection=0;this.axisActive=false;this.meaningfulAxis=0;this.needsNeutral=true;}
 private textUnsupported(){this.status.textContent='Gamepad connected · unsupported mapping';}
 poll(driving:boolean | 'stage-menu',qaAvailable=false){const pad=connectedPad(this.preferredIndex,driving==='stage-menu');this.preferredIndex=pad?.index;this.status.hidden=!pad||driving==='stage-menu';const diagnostic=document.getElementById('gamepad-diagnostic');if(!pad||!document.hasFocus()||document.hidden){if(!pad)this.disconnected();if(diagnostic)diagnostic.textContent='No focused connected gamepad.';this.release();return;}
 const identity=`${pad.index}:${pad.id}`,pressed=pad.buttons.map(buttonDown);
 if(this.resync||(this.padIdentity&&this.padIdentity!==identity)){this.resync=false;this.stickDirection=stageDirection(pad);this.padIdentity=identity;this.previous=pressed;this.menuNavigation.capture(pad.axes[0]??0,pad.axes[1]??0,pressed);this.releaseDrive();this.orbitAxis=Number.isFinite(pad.axes[2])?pad.axes[2]:0;return;}
 this.padIdentity=identity;
 if(driving)this.menuNavigation.capture(pad.axes[0]??0,pad.axes[1]??0,pressed);
 const b=(i:number)=>!!pressed[i],edge=(i:number)=>pressed[i]&&!this.previous[i];const changed=pressed.flatMap((v,i)=>v!==!!this.previous[i]?[`${i}:${v?'down':'up'}`]:[]);if(changed.length)this.lastChanged=changed.join(', ');if(diagnostic)diagnostic.textContent=`${pad.id || 'Gamepad'} · mapping: ${pad.mapping || 'nonstandard'} · ${pad.buttons.length} buttons · changed: ${this.lastChanged}`;
 if(pad.mapping!=='standard'&&driving!=='stage-menu'){this.releaseDrive();this.needsNeutral=true;this.textUnsupported();this.disconnected();this.previous=pressed;return;}
 const cameraKey=pad.buttons.length>17?'TOUCHPAD':'L3';
 const photoButton=document.getElementById('photo-button');
 if(photoButton&&photoButton.dataset.padHint!==cameraKey)photoButton.dataset.padHint=cameraKey;
 this.status.textContent=(driving?`standard · L1/R1 切換對手視角 · ${cameraKey} 截圖 · OPTIONS 暫停`:`standard · L1/R1 切換對手視角 · OPTIONS 開始/繼續 · SHARE 全螢幕 · ${cameraKey} 截圖`)+(qaAvailable?' · △ 場景 QA':'');
 const axis=pad.axes[0]??0,axisActive=Math.abs(axis)>.25,axisMoved=axisActive&&(!this.axisActive||Math.abs(axis-this.meaningfulAxis)>.2);if(pressed.some((v,i)=>v&&!this.previous[i])||axisMoved||(!driving&&Math.abs(pad.axes[1]??0)>.55))this.activity();if(axisMoved||!axisActive)this.meaningfulAxis=axis;this.axisActive=axisActive;
 if(driving==='stage-menu'){
  // The previous button state survives screen changes. A held confirm
  // cannot repeat on entry, while a fresh first press MUST be recognized.
  // One step per tilt, with hysteresis around the dead zone.
  const direction=stageDirection(pad)||(Math.max(Math.abs(axis),Math.abs(pad.axes[1]??0))<.28?0:this.stickDirection);
  if(edge(12)||edge(14)||(direction===-1&&this.stickDirection!==-1))this.action('left');
  else if(edge(13)||edge(15)||(direction===1&&this.stickDirection!==1))this.action('right');
  this.stickDirection=direction;
  const face=menuFaceButtons(pad);
  if(face&&edge(face.confirm))this.action('confirm');else if(face&&edge(face.back))this.action('back');
  this.previous=pressed;return;
 }
 if(edge(8))this.action('fullscreen');
 this.status.textContent+=' · 右搖桿 環視 · R3 追車';
 // Track-praise and issue reporting are retired from live gamepad controls.
 if(qaAvailable&&edge(3)){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('qa');return;}
 if(edge(pad.buttons.length>17?17:10))this.action('photo');
 if(edge(11))this.action('camera-reset');
 // L1/R1 select the previous or next observed racer, without releasing throttle.
 if(edge(4))this.action('camera-prev');
 if(edge(5))this.action('camera-next');
 if(edge(9)){this.releaseDrive();this.previous=pressed;this.action('pause');return;}
 if(!driving){
  // Edge tracking suppresses the held confirm that changed screens,
  // without eating the first NEW press on this screen.
  const direction=this.menuNavigation.poll(pad.axes[0]??0,pad.axes[1]??0,pressed,performance.now());
  if(direction)this.action(direction);if(edge(0))this.action('confirm');if(edge(1))this.action('back');this.releaseDrive();}
 else{// Resume without waiting for GAS/BRAKE/stick to be released.
 // Menu inputs were already released above; held triggers should work
 // on the FIRST drive frame, not after several additional presses.
 this.needsNeutral=false;
 const axis=Math.abs(pad.axes[0]??0)>.16?pad.axes[0]:0,steer=Number(b(15))-Number(b(14))||axis;if(steer)this.input.setAnalog('pad:axis',steer);else this.input.release('pad:axis');if(b(7))this.input.press('pad:gas','gas');else this.input.release('pad:gas');if(b(6))this.input.press('pad:brake','brake');else this.input.release('pad:brake');}
 this.orbitAxis=Number.isFinite(pad.axes[2])?pad.axes[2]:0;
 this.previous=pressed;
 }
}
