import type { InputState } from './handling';
import {quantizeSteering,STEERING_STEPS} from './steering';
export type Control = 'left' | 'right' | 'gas' | 'brake';
const keyControls: Record<string, Control> = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space:'gas', Enter:'brake', KeyW: 'gas', ArrowUp: 'gas', KeyS: 'brake', ArrowDown: 'brake' };
export const SETTINGS_KEY = 'first-drive-controls-swapped';
export function readSwapped(storage: Pick<Storage, 'getItem'> = localStorage): boolean { try { return storage.getItem(SETTINGS_KEY) === 'true'; } catch { return false; } }
export function saveSwapped(value: boolean, storage: Pick<Storage, 'setItem'> = localStorage): void { try { storage.setItem(SETTINGS_KEY, String(value)); } catch { /* Private browsing can disable persistence. */ } }

/** Separate sources ensure releasing one finger never releases another held input. */
export class InputLatch {
  private sources = new Map<string, Control>();
  private analogSource:string|null=null;
  steeringTarget=0;
  effectiveSteer=0;
  press(source: string, control: Control) { this.sources.set(source, control); }
  setAnalog(source:string,value:number){
    if(this.analogSource!==null&&this.analogSource!==source)return;
    this.analogSource=source;this.steeringTarget=Math.max(-1,Math.min(1,value));this.quantize();
  }
  release(source: string) { this.sources.delete(source);if(source===this.analogSource){this.analogSource=null;this.steeringTarget=0;this.effectiveSteer=0;} }
  clear() { this.sources.clear();this.analogSource=null;this.steeringTarget=0;this.effectiveSteer=0; }
  private quantize(){this.effectiveSteer=quantizeSteering(this.steeringTarget,this.effectiveSteer);}
  update(dt:number){
    if(this.analogSource!==null)return;
    const direction=Number(this.held('right'))-Number(this.held('left'));
    // Keyboard moves the same axis: 400ms to lock, 125ms maximum return time.
    if(direction){
      let remaining=dt;
      // Countersteer unloads the old lock as quickly as release, then builds the new lock.
      if(direction*this.steeringTarget<0){const unload=Math.min(remaining,Math.abs(this.steeringTarget)/8);this.steeringTarget+=direction*8*unload;remaining-=unload;}
      this.steeringTarget=Math.max(-1,Math.min(1,this.steeringTarget+direction*2.5*remaining));
    }
    else this.steeringTarget=(Math.sign(this.steeringTarget)*Math.max(0,Math.abs(this.steeringTarget)-8*dt))||0;
    this.quantize();
  }
  snapshot(): InputState {
    const values = [...this.sources.values()];
    return { gas: values.includes('gas'), brake: values.includes('brake'), steer: this.effectiveSteer };
  }
  held(control: Control) { return [...this.sources.values()].includes(control); }
}

export class InputController extends InputLatch {
  private buttons: HTMLElement[];
  private strip:HTMLElement|null;
  private steeringPointer:number|null=null;
  constructor(root: Document | HTMLElement = document, isDriving:()=>boolean=()=>true) {
    super();
    this.buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-control]'));
    this.strip=root.querySelector<HTMLElement>('#steering-strip');
    const paint = () => this.buttons.forEach(button => button.classList.toggle('pressed', this.held(button.dataset.control as Control)));
    const editing=(target:EventTarget|null)=>target instanceof HTMLElement&&!!target.closest('input,textarea,select,[contenteditable="true"]');
    // A cleared hold must require a fresh press after a pause or feedback dialog.
    window.addEventListener('keydown', event => { const control = keyControls[event.code]; if (control&&isDriving()&&!editing(event.target)) { event.preventDefault(); if(!event.repeat)this.press(`key:${event.code}`, control); paint(); } });
    window.addEventListener('keyup', event => { if(keyControls[event.code]&&isDriving()&&!editing(event.target))event.preventDefault();this.release(`key:${event.code}`); paint(); });
    this.buttons.forEach(button => {
      button.addEventListener('pointerdown', event => { if(!isDriving())return;event.preventDefault(); button.setPointerCapture(event.pointerId); this.press(`pointer:${event.pointerId}`, button.dataset.control as Control); paint(); });
      const release = (event: PointerEvent) => { this.release(`pointer:${event.pointerId}`); paint(); };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', event => event.preventDefault());
      button.addEventListener('selectstart', event => event.preventDefault());
      button.addEventListener('dragstart', event => event.preventDefault());
      // Android's long-press recognizer can run independently of pointer defaults.
      // Cancel native touch behavior here, retaining pointer-ID based game input.
      button.addEventListener('touchstart', event => event.preventDefault(), { passive: false });
    });
    const strip=this.strip;
    if(strip){
      const move=(event:PointerEvent)=>{
        if(event.pointerId!==this.steeringPointer)return;
        const box=strip.getBoundingClientRect(),raw=Math.max(-1,Math.min(1,2*(event.clientX-box.left)/box.width-1));
        this.setAnalog(`steering:${event.pointerId}`,raw);this.paintSteering();
      };
      strip.addEventListener('pointerdown',event=>{
        if(!isDriving()||this.steeringPointer!==null)return;
        event.preventDefault();this.steeringPointer=event.pointerId;strip.setPointerCapture(event.pointerId);move(event);
      });
      strip.addEventListener('pointermove',move);
      const release=(event:PointerEvent)=>{if(event.pointerId!==this.steeringPointer)return;this.release(`steering:${event.pointerId}`);this.steeringPointer=null;this.paintSteering();};
      strip.addEventListener('pointerup',release);strip.addEventListener('pointercancel',release);strip.addEventListener('lostpointercapture',release);
      for(const name of ['contextmenu','selectstart','dragstart','touchstart'])strip.addEventListener(name,event=>event.preventDefault(),{passive:false});
    }
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
  }
  private paintSteering(){
    this.strip?.style.setProperty('--steer',String(this.steeringTarget));this.strip?.style.setProperty('--effective-steer',String(this.effectiveSteer));
    this.strip?.setAttribute('aria-valuenow',String(Math.round(this.steeringTarget*100)));
    const label=this.strip?.querySelector('.steer-label');if(label)label.textContent=this.effectiveSteer?`${this.effectiveSteer<0?'←':'→'} STEER · ${Math.abs(this.effectiveSteer)*STEERING_STEPS}/${STEERING_STEPS}`:'← STEER · NEUTRAL →';
  }
  override update(dt:number){super.update(dt);this.paintSteering();}
  override clear() { super.clear();this.steeringPointer=null;this.paintSteering();this.buttons?.forEach(button => button.classList.remove('pressed')); }
}
