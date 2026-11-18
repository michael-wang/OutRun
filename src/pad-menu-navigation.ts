/** Dominant left-stick/D-pad menu movement, with a neutral gate and bounded repeat. */
export type MenuDirection='up'|'down'|'left'|'right';
export class PadMenuNavigation {
 private held:MenuDirection|null=null;
 private repeatAt=0;
 private blocked=false;
 reset(blockUntilNeutral=false){this.held=null;this.repeatAt=0;this.blocked=blockUntilNeutral;}
 poll(x:number,y:number,buttons:readonly boolean[],now:number):MenuDirection|null{
  const direction:MenuDirection|null=buttons[12]?'up':buttons[13]?'down':buttons[14]?'left':buttons[15]?'right':
   Math.max(Math.abs(x),Math.abs(y))>.55?(Math.abs(y)>=Math.abs(x)?y<0?'up':'down':x<0?'left':'right'):
   Math.max(Math.abs(x),Math.abs(y))<.28?null:this.held;
  if(this.blocked){if(!direction&&Math.max(Math.abs(x),Math.abs(y))<.28)this.blocked=false;return null;}
  if(!direction){this.held=null;return null;}
  if(direction!==this.held){this.held=direction;this.repeatAt=now+420;return direction;}
  if(now>=this.repeatAt){this.repeatAt=now+160;return direction;}
  return null;
 }
}
