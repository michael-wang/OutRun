import type {HeroineAction} from './heroine-performance';
export interface HeroineRival {id:string;lead:number;localX:number;finished:boolean}
/** Side-by-side presentation only. Completed-pass scoring remains independent. */
export class HeroineOpportunities {
 private previous=new Map<string,number>();private armed=new Set<string>();private cooldown=0;private serial=0;
 reset(){this.previous.clear();this.armed.clear();this.cooldown=0;this.serial=0;}
 update(dt:number,rivals:readonly HeroineRival[],blocked=false):{id:string;side:'left'|'right';action:HeroineAction}|undefined{
  if(!Number.isFinite(dt)||dt<=0)return;
  if(dt>.25){this.reset();return;}
  this.cooldown=Math.max(0,this.cooldown-dt);
  const eligible:HeroineRival[]=[];const present=new Set(rivals.map(r=>r.id));
  for(const id of this.previous.keys())if(!present.has(id)){this.previous.delete(id);this.armed.delete(id);}
  for(const r of rivals){
   const before=this.previous.get(r.id);this.previous.set(r.id,r.lead);
   if(r.finished){this.armed.delete(r.id);continue;}
   if(r.lead>6)this.armed.add(r.id);
   if(blocked){this.armed.delete(r.id);continue;}
   if(before===undefined||!this.armed.has(r.id)||this.cooldown>0)continue;
   const closing=(before-r.lead)/dt;
   if(Math.abs(r.lead)<=2.7&&closing>1&&closing<180&&Math.abs(r.localX)>1.6&&Math.abs(r.localX)<10)eligible.push(r);
  }
  eligible.sort((a,b)=>Math.abs(a.lead)-Math.abs(b.lead)||Math.abs(a.localX)-Math.abs(b.localX)||a.id.localeCompare(b.id));
  const target=eligible[0];if(!target)return;
  this.armed.delete(target.id);this.cooldown=4;
  const side=target.localX>0?'left':'right',kind=this.serial++%2?'kiss':'shout';
  return {id:target.id,side,action:(kind+(side==='left'?'Left':'Right')) as HeroineAction};
 }
}
