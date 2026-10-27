import type {InputLatch} from './input';
export type PadAction='confirm'|'back'|'pause'|'up'|'down';
/** Standard Gamepad mapping only: nonstandard devices are reported, never guessed. */
export class GamepadInput {
 private previous:boolean[]=[];
 private needsNeutral=true;
 private readonly status:HTMLElement;
 constructor(private input:InputLatch,private action:(action:PadAction)=>void){
  this.status=document.createElement('div');this.status.id='gamepad-status';this.status.setAttribute('role','status');this.status.hidden=true;document.querySelector('#app')!.append(this.status);
  window.addEventListener('blur',()=>this.release());
 }
 private release(){this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');this.previous=[];this.needsNeutral=true;}
 poll(driving:boolean){
  let pads:(Gamepad|null)[]=[];try{pads=Array.from(navigator.getGamepads?.()??[]);}catch{this.release();return;}
  const pad=pads.find(p=>p?.connected);this.status.hidden=!pad;
  if(!pad||!document.hasFocus()||document.hidden){this.release();return;}
  if(pad.mapping!=='standard'){this.status.textContent='Gamepad connected · unsupported mapping';this.release();return;}
  this.status.textContent='Gamepad connected · standard mapping';
  const b=(i:number)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5),pressed=Array.from({length:16},(_,i)=>b(i));
  if(this.needsNeutral){if(Math.abs(pad.axes[0]??0)>.16||b(6)||b(7)||b(14)||b(15))return;this.needsNeutral=false;}
  const edge=(i:number)=>pressed[i]&&!this.previous[i];
  if(edge(9))this.action('pause');
  if(!driving){if(edge(0))this.action('confirm');if(edge(1))this.action('back');if(edge(12)||edge(14))this.action('up');if(edge(13)||edge(15))this.action('down');this.input.release('pad:axis');this.input.release('pad:gas');this.input.release('pad:brake');}
  else{const axis=Math.abs(pad.axes[0]??0)>.16?pad.axes[0]:0,steer=Number(b(15))-Number(b(14))||axis;if(steer)this.input.setAnalog('pad:axis',steer);else this.input.release('pad:axis');if(b(7))this.input.press('pad:gas','gas');else this.input.release('pad:gas');if(b(6))this.input.press('pad:brake','brake');else this.input.release('pad:brake');}
  this.previous=pressed;
 }
}
