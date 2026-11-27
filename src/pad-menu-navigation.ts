/** Left stick and D-pad menu movement, with hysteresis and bounded repeat. */
export type MenuDirection = 'up' | 'down' | 'left' | 'right';

const neutral = .28;
const activate = .55;
const directions: readonly MenuDirection[] = ['up', 'down', 'left', 'right'];

function dpadMask(buttons: readonly boolean[]) {
  let mask = 0;
  for (let i = 0; i < directions.length; i++) {
    if (buttons[12 + i]) mask |= 1 << i;
  }
  return mask;
}

function axisSign(value: number) {
  return Math.abs(value) < neutral ? 0 : Math.sign(value);
}

export class PadMenuNavigation {
  private held: MenuDirection | null = null;
  private repeatAt = 0;
  private inheritedX = 0;
  private inheritedY = 0;
  private inheritedDpad = 0;

  /** Inputs held outside the menu must not move its focus on entry. */
  capture(x: number, y: number, buttons: readonly boolean[]) {
    this.inheritedX = axisSign(x);
    this.inheritedY = axisSign(y);
    this.inheritedDpad = dpadMask(buttons);
    this.held = null;
  }

  poll(x: number, y: number, buttons: readonly boolean[], now: number): MenuDirection | null {
    if (axisSign(x) !== this.inheritedX) this.inheritedX = 0;
    if (axisSign(y) !== this.inheritedY) this.inheritedY = 0;
    if (this.inheritedX) x = 0;
    if (this.inheritedY) y = 0;

    const dpad = dpadMask(buttons);
    this.inheritedDpad &= dpad;
    const freshDpad = dpad & ~this.inheritedDpad;
    let direction: MenuDirection | null = null;
    if (freshDpad) {
      direction = directions.find((_, i) => (freshDpad & (1 << i)) !== 0) ?? null;
    } else if (Math.max(Math.abs(x), Math.abs(y)) > activate) {
      direction = Math.abs(y) >= Math.abs(x) ? (y < 0 ? 'up' : 'down') : (x < 0 ? 'left' : 'right');
    } else if (Math.max(Math.abs(x), Math.abs(y)) >= neutral) {
      direction = this.held;
    }

    if (direction !== this.held) {
      this.held = direction;
      this.repeatAt = now + 420;
      return direction;
    }
    if (direction && now >= this.repeatAt) {
      this.repeatAt = now + 160;
      return direction;
    }
    return null;
  }
}

const standardFaces={confirm:0,back:1} as const;
const sonyRawFaces={confirm:1,back:2} as const;

/** Some Windows drivers expose the original Sony face-button order. */
export function menuFaceButtons(pad: Pick<Gamepad,'mapping'|'id'>) {
  if(pad.mapping==='standard')return standardFaces;
  if(/054c.*(?:05c4|09cc)|dualshock.?4/i.test(pad.id))return sonyRawFaces;
  return null;
}

/** Only carry controls that were already down when the previous screen closed.
 * Poll during asynchronous loading so release-then-press is a fresh input. */
export interface MenuHandoff {id:string;x:number;y:number;buttons:boolean[]}
let pending:MenuHandoff|null=null, watch=0;
function pads(){try{return Array.from(navigator.getGamepads?.()??[]).filter((p):p is Gamepad=>!!p?.connected);}catch{return [];}}
export function prepareMenuHandoff(){
 cancelAnimationFrame(watch);pending=null;
 const p=pads().find(p=>menuFaceButtons(p)&&(p.buttons.some(b=>b.pressed||b.value>.5)||p.axes.slice(0,2).some(n=>Math.abs(n)>.28)));
 if(!p)return;
 pending={id:p.index+':'+p.id,x:p.axes[0]||0,y:p.axes[1]||0,buttons:p.buttons.map(b=>b.pressed||b.value>.5)};
 const check=()=>{
  if(!pending)return;
  const current=pads().find(p=>p.index+':'+p.id===pending?.id);
  if(!current){pending=null;return;}
  pending.buttons=pending.buttons.map((held,i)=>held&&(current.buttons[i]?.pressed||current.buttons[i]?.value>.5));
  if(axisSign(current.axes[0]||0)!==axisSign(pending.x))pending.x=0;
  if(axisSign(current.axes[1]||0)!==axisSign(pending.y))pending.y=0;
  if(pending.x||pending.y||pending.buttons.some(Boolean))watch=requestAnimationFrame(check);
 };
 watch=requestAnimationFrame(check);
}
export function takeMenuHandoff(){cancelAnimationFrame(watch);const inherited=pending;pending=null;return inherited;}
