import type {InputLatch} from './input';
export type PadAction='confirm'|'back'|'pause'|'fullscreen'|'up'|'down'|'left'|'right'|'camera-prev'|'camera-next'|'photo'|'qa';
function connectedPad(){
 try{return Array.from(navigator.getGamepads?.()??[]).find(p=>p?.connected);}
 catch{return undefined;}
}
function buttonDown(button:GamepadButton){return button.pressed||button.value>.5;}
/** Standard Gamepad mapping only; all actions are edge-triggered. */
export class GamepadInput {
 private stickDirection=0;
 private readonly onBlur=()=>this.release();
 dispose(){window.removeEventListener('blur',this.onBlur);this.release();this.status.remove();}
 private previous:boolean[]=[];private needsNeutral=true;private axisActive=false;private meaningfulAxis=0;private readonly status:HTMLElement;private lastChanged='none';
 constructor(private input:InputLatch,private action:(action:PadAction)=>void,private activity:()=>void=()=>{},private disconnected:()=>void=()=>{}){this.status=document.createElement('div');this.status.id='gamepad-status';this.status.setAttribute('role','status');this.status.hidden=true;document.querySelector('#app')!.append(this.status);window.addEventListener('blur',this.onBlur);
  // A newly mounted screen inherits physical buttons already held at creation.
  this.previous=connectedPad()?.buttons.map(buttonDown)??[];
 }
 private releaseDrive(){this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');}
 neutralize(){this.releaseDrive();this.needsNeutral=true;}
 private release(){this.releaseDrive();this.previous=[];this.stickDirection=0;this.axisActive=false;this.meaningfulAxis=0;this.needsNeutral=true;}
 private textUnsupported(){this.status.textContent='Gamepad connected · unsupported mapping';}
 poll(driving:boolean | 'stage-menu',qaAvailable=false){const pad=connectedPad();this.status.hidden=!pad||driving==='stage-menu';const diagnostic=document.getElementById('gamepad-diagnostic');if(!pad||!document.hasFocus()||document.hidden){if(!pad)this.disconnected();if(diagnostic)diagnostic.textContent='No focused connected gamepad.';this.release();return;}
 const pressed=pad.buttons.map(buttonDown),b=(i:number)=>!!pressed[i],edge=(i:number)=>pressed[i]&&!this.previous[i];const changed=pressed.flatMap((v,i)=>v!==!!this.previous[i]?[`${i}:${v?'down':'up'}`]:[]);if(changed.length)this.lastChanged=changed.join(', ');if(diagnostic)diagnostic.textContent=`${pad.id || 'Gamepad'} · mapping: ${pad.mapping || 'nonstandard'} · ${pad.buttons.length} buttons · changed: ${this.lastChanged}`;
 if(pad.mapping!=='standard'){this.releaseDrive();this.needsNeutral=true;this.textUnsupported();this.disconnected();this.previous=pressed;return;}
 const cameraKey=pad.buttons.length>17?'TOUCHPAD':'R3';this.status.textContent=(driving?`standard · L1/R1 切換對手視角 · ${cameraKey} 截圖 · OPTIONS 暫停`:`standard · L1/R1 切換對手視角 · OPTIONS 開始/繼續 · SHARE 全螢幕 · ${cameraKey} 截圖`)+(qaAvailable?' · △ 場景 QA':'');
 const axis=pad.axes[0]??0,axisActive=Math.abs(axis)>.25,axisMoved=axisActive&&(!this.axisActive||Math.abs(axis-this.meaningfulAxis)>.2);if(pressed.some((v,i)=>v&&!this.previous[i])||axisMoved)this.activity();if(axisMoved||!axisActive)this.meaningfulAxis=axis;this.axisActive=axisActive;
 if(driving==='stage-menu'){
  // The previous button state survives screen changes. A held confirm
  // cannot repeat on entry, while a fresh first press MUST be recognized.
  // One step per tilt, with hysteresis around the dead zone.
  const direction=Math.abs(axis)>.55?Math.sign(axis):Math.abs(axis)<.28?0:this.stickDirection;
  if(edge(14)||(direction===-1&&this.stickDirection!==-1))this.action('left');
  else if(edge(15)||(direction===1&&this.stickDirection!==1))this.action('right');
  this.stickDirection=direction;
  if(edge(0))this.action('confirm');
  this.previous=pressed;return;
 }
 if(edge(8))this.action('fullscreen');
 // Track-praise and issue reporting are retired from live gamepad controls.
 if(qaAvailable&&edge(3)){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('qa');return;}
 if(edge(pad.buttons.length>17?17:11))this.action('photo');
 // L1/R1 select the previous or next observed racer, without releasing throttle.
 if(edge(4))this.action('camera-prev');
 if(edge(5))this.action('camera-next');
 if(edge(9))this.action('pause');
 if(!driving){
  // Edge tracking suppresses the held confirm that changed screens,
  // without eating the first NEW press on this screen.
  if(edge(0))this.action('confirm');if(edge(1))this.action('back');if(edge(12))this.action('up');if(edge(13))this.action('down');if(edge(14))this.action('left');if(edge(15))this.action('right');this.releaseDrive();}
 else{// Resume without waiting for GAS/BRAKE/stick to be released.
 // Menu inputs were already released above; held triggers should work
 // on the FIRST drive frame, not after several additional presses.
 this.needsNeutral=false;
 const axis=Math.abs(pad.axes[0]??0)>.16?pad.axes[0]:0,steer=Number(b(15))-Number(b(14))||axis;if(steer)this.input.setAnalog('pad:axis',steer);else this.input.release('pad:axis');if(b(7))this.input.press('pad:gas','gas');else this.input.release('pad:gas');if(b(6))this.input.press('pad:brake','brake');else this.input.release('pad:brake');}
 this.previous=pressed;
 }
}
