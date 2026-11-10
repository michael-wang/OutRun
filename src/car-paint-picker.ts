import {CAR_COLORS,type CarColor} from './car-appearance';
export type PaintPickerAction='confirm'|'back'|'up'|'down'|'left'|'right';
/** Cycle a valid predefined paint colour without relying on native select UI. */
export function nextPaint(current:CarColor,step:number):CarColor{
 const index=CAR_COLORS.indexOf(current);
 return CAR_COLORS[(index+step+CAR_COLORS.length)%CAR_COLORS.length];
}
/** Native selector stays for touch/keyboard. Gamepad A uses a tiny DOM list
 * because HTMLSelectElement.click() does not open browser-native options.
 * D-pad navigates, A commits, B closes, focus returns to native selector. */
export class CarPaintPicker{
 private opened=false;
 private buttons:HTMLButtonElement[];
 constructor(private select:HTMLSelectElement,private list:HTMLElement,signal?:AbortSignal){
  this.buttons=Array.from(list.querySelectorAll<HTMLButtonElement>('button[data-paint]'));
  document.body.appendChild(list);list.hidden=true;
  for(const b of this.buttons)b.addEventListener('click',()=>{this.commit(b.dataset.paint as CarColor);this.close();});
  window.addEventListener('resize',()=>{if(this.opened)this.reposition();},{signal});
 }
 dispose(){this.list.remove();}
 get isOpen(){return this.opened;}
 private reposition(){
  const r=this.select.getBoundingClientRect();
  this.list.style.width=Math.max(156,r.width)+'px';
  const width=this.list.offsetWidth,height=this.list.offsetHeight;
  this.list.style.left=Math.max(8,Math.min(r.left,innerWidth-width-8))+'px';
  this.list.style.top=Math.max(8,Math.min(r.bottom+5,innerHeight-height-8))+'px';
 }
 private commit(value:CarColor){
  if(!CAR_COLORS.includes(value))return;
  this.select.value=value;
  this.select.dispatchEvent(new Event('change',{bubbles:true}));
  for(const b of this.buttons)b.setAttribute('aria-selected',String(b.dataset.paint===value));
 }
 private open(){
  this.opened=true;this.list.hidden=false;this.select.setAttribute('aria-expanded','true');
  for(const b of this.buttons)b.setAttribute('aria-selected',String(b.dataset.paint===this.select.value));
  this.reposition();
  this.buttons.find(b=>b.dataset.paint===this.select.value)?.focus({preventScroll:true});
 }
 close(){
  if(!this.opened)return;
  this.opened=false;this.list.hidden=true;this.select.setAttribute('aria-expanded','false');
  this.select.focus({preventScroll:true});
 }
 handle(action:PaintPickerAction):boolean{
  if(this.opened){
   if(action==='back'){this.close();return true;}
   const active=this.buttons.indexOf(document.activeElement as HTMLButtonElement);
   const index=active<0?Math.max(0,CAR_COLORS.indexOf(this.select.value as CarColor)):active;
   if(action==='confirm'){
    const b=this.buttons[index];if(b)this.commit(b.dataset.paint as CarColor);
    this.close();return true;
   }
   const delta=action==='up'||action==='left'?-1:1;
   this.buttons[(index+delta+this.buttons.length)%this.buttons.length]?.focus({preventScroll:true});
   return true;
  }
  if(document.activeElement!==this.select)return false;
  if(action==='confirm'){this.open();return true;}
  if(action==='left'||action==='right'){
   this.commit(nextPaint(this.select.value as CarColor,action==='left'?-1:1));
   return true;
  }
  return false;
 }
}
