import type {InputLatch} from './input';
export type PadAction='confirm'|'back'|'pause'|'up'|'down'|'left'|'right'|'praise'|'issue'|'history';
/** Standard Gamepad mapping only; all actions are edge-triggered. */
export class GamepadInput {
 private previous:boolean[]=[];private needsNeutral=true;private axisActive=false;private meaningfulAxis=0;private readonly status:HTMLElement;
 constructor(private input:InputLatch,private action:(action:PadAction)=>void,private activity:()=>void=()=>{},private disconnected:()=>void=()=>{}){this.status=document.createElement('div');this.status.id='gamepad-status';this.status.setAttribute('role','status');this.status.hidden=true;document.querySelector('#app')!.append(this.status);window.addEventListener('blur',()=>this.release());}
 private releaseDrive(){this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');}
 private release(){this.releaseDrive();this.previous=[];this.axisActive=false;this.meaningfulAxis=0;this.needsNeutral=true;}
 private textUnsupported(){this.status.textContent='Gamepad connected · unsupported mapping';}
 poll(driving:boolean,feedback=false,canPraise=false){let pads:(Gamepad|null)[]=[];try{pads=Array.from(navigator.getGamepads?.()??[]);}catch{this.release();return;}const pad=pads.find(p=>p?.connected);this.status.hidden=!pad;if(!pad||!document.hasFocus()||document.hidden){if(!pad)this.disconnected();this.release();return;}if(pad.mapping!=='standard'){this.textUnsupported();this.disconnected();this.release();return;}
 this.status.textContent='Gamepad standard · L1/R1 評分 · 方向鍵選擇 · ✕ 完成 · ○ 取消';const b=(i:number)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5),pressed=Array.from({length:16},(_,i)=>b(i)),edge=(i:number)=>pressed[i]&&!this.previous[i];
 const axis=pad.axes[0]??0,axisActive=Math.abs(axis)>.25,axisMoved=axisActive&&(!this.axisActive||Math.abs(axis-this.meaningfulAxis)>.2);if(pressed.some((v,i)=>v&&!this.previous[i])||axisMoved)this.activity();if(axisMoved||!axisActive)this.meaningfulAxis=axis;this.axisActive=axisActive;
 if(feedback){this.releaseDrive();this.needsNeutral=true;if(edge(12))this.action('up');if(edge(15))this.action('right');if(edge(13))this.action('down');if(edge(14))this.action('left');if(edge(3))this.action('history');if(edge(2))this.action('issue');if(edge(0))this.action('confirm');if(edge(1))this.action('back');this.previous=pressed;return;}
 if((driving||canPraise)&&(edge(4)||edge(5))){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('praise');return;}
 if((driving||canPraise)&&edge(2)){this.releaseDrive();this.needsNeutral=true;this.previous=pressed;this.action('issue');return;}
 if(edge(9))this.action('pause');
 if(!driving){if(edge(0))this.action('confirm');if(edge(1))this.action('back');if(edge(12)||edge(14))this.action('up');if(edge(13)||edge(15))this.action('down');this.releaseDrive();}
 else{if(this.needsNeutral){if(Math.abs(pad.axes[0]??0)>.16||b(6)||b(7)||b(14)||b(15)){this.previous=pressed;return;}this.needsNeutral=false;}const axis=Math.abs(pad.axes[0]??0)>.16?pad.axes[0]:0,steer=Number(b(15))-Number(b(14))||axis;if(steer)this.input.setAnalog('pad:axis',steer);else this.input.release('pad:axis');if(b(7))this.input.press('pad:gas','gas');else this.input.release('pad:gas');if(b(6))this.input.press('pad:brake','brake');else this.input.release('pad:brake');}
 this.previous=pressed;
 }
}
