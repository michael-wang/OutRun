import type {InputLatch} from './input';
export type PadAction='confirm'|'back'|'pause'|'fullscreen'|'up'|'down'|'left'|'right'|'praise'|'issue'|'history'|'photo';
/** Standard Gamepad mapping only; all actions are edge-triggered. */
export class GamepadInput {
 private previous:boolean[]=[];private needsNeutral=true;private axisActive=false;private meaningfulAxis=0;private readonly status:HTMLElement;private lastChanged='none';
 constructor(private input:InputLatch,private action:(action:PadAction)=>void,private activity:()=>void=()=>{},private disconnected:()=>void=()=>{}){this.status=document.createElement('div');this.status.id='gamepad-status';this.status.setAttribute('role','status');this.status.hidden=true;document.querySelector('#app')!.append(this.status);window.addEventListener('blur',()=>this.release());}
 private releaseDrive(){this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');}
 neutralize(){this.releaseDrive();this.needsNeutral=true;}
 private release(){this.releaseDrive();this.previous=[];this.axisActive=false;this.meaningfulAxis=0;this.needsNeutral=true;}
 private textUnsupported(){this.status.textContent='Gamepad connected · unsupported mapping';}
 poll(driving:boolean,feedback=false,canPraise=false){let pads:(Gamepad|null)[]=[];try{pads=Array.from(navigator.getGamepads?.()??[]);}catch{this.release();return;}const pad=pads.find(p=>p?.connected);this.status.hidden=!pad;const diagnostic=document.getElementById('gamepad-diagnostic');if(!pad||!document.hasFocus()||document.hidden){if(!pad)this.disconnected();if(diagnostic)diagnostic.textContent='No focused connected gamepad.';this.release();return;}
 const b=(i:number)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5),pressed=Array.from({length:pad.buttons.length},(_,i)=>b(i)),edge=(i:number)=>pressed[i]&&!this.previous[i];const changed=pressed.flatMap((v,i)=>v!==!!this.previous[i]?[`${i}:${v?'down':'up'}`]:[]);if(changed.length)this.lastChanged=changed.join(', ');if(diagnostic)diagnostic.textContent=`${pad.id || 'Gamepad'} · mapping: ${pad.mapping || 'nonstandard'} · ${pad.buttons.length} buttons · changed: ${this.lastChanged}`;
 if(pad.mapping!=='standard'){this.releaseDrive();this.needsNeutral=true;this.textUnsupported();this.disconnected();this.previous=pressed;return;}
 const cameraKey=pad.buttons.length>17?'TOUCHPAD':'R3';this.status.textContent=driving?`standard · L1 讚 · □ 問題 · ${cameraKey} 截圖 · OPTIONS 暫停`:`standard · OPTIONS 開始/繼續 · SHARE 全螢幕 · ${cameraKey} 截圖`;
 const axis=pad.axes[0]??0,axisActive=Math.abs(axis)>.25,axisMoved=axisActive&&(!this.axisActive||Math.abs(axis-this.meaningfulAxis)>.2);if(pressed.some((v,i)=>v&&!this.previous[i])||axisMoved)this.activity();if(axisMoved||!axisActive)this.meaningfulAxis=axis;this.axisActive=axisActive;
 if(edge(8))this.action('fullscreen');
 if(feedback){this.releaseDrive();this.needsNeutral=true;if(edge(12))this.action('up');if(edge(15))this.action('right');if(edge(13))this.action('down');if(edge(14))this.action('left');if(edge(3))this.action('history');if(edge(2))this.action('issue');if(edge(0))this.action('confirm');if(edge(1))this.action('back');this.previous=pressed;return;}
 if(edge(pad.buttons.length>17?17:11))this.action('photo');
 if((driving||canPraise)&&(edge(4)||edge(5))){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('praise');return;}
 if((driving||canPraise)&&edge(2)){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('issue');return;}
 if(edge(9))this.action('pause');
 if(!driving){if(edge(0))this.action('confirm');if(edge(1))this.action('back');if(edge(12)||edge(14))this.action('up');if(edge(13)||edge(15))this.action('down');this.releaseDrive();}
 else{if(this.needsNeutral){if(Math.abs(pad.axes[0]??0)>.16||b(6)||b(7)||b(14)||b(15)){this.previous=pressed;return;}this.needsNeutral=false;}const axis=Math.abs(pad.axes[0]??0)>.16?pad.axes[0]:0,steer=Number(b(15))-Number(b(14))||axis;if(steer)this.input.setAnalog('pad:axis',steer);else this.input.release('pad:axis');if(b(7))this.input.press('pad:gas','gas');else this.input.release('pad:gas');if(b(6))this.input.press('pad:brake','brake');else this.input.release('pad:brake');}
 this.previous=pressed;
 }
}
