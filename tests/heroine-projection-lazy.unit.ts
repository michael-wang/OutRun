import {expect,it,vi} from 'vitest';
import {HeroineOpportunities,type HeroineRival} from '../src/heroine-opportunities';

// Independent eager reference pinned to e1d2277; compare observable actions
// and each decision-state field after every tick, including history mutation.
class OriginalEager {
 previous=new Map<string,number>();armed=new Set<string>();cooldown=0;serial=0;
 reset(){this.previous.clear();this.armed.clear();this.cooldown=0;this.serial=0;}
 update(dt:number,rivals:readonly HeroineRival[],blocked=false){
  if(!Number.isFinite(dt)||dt<=0)return;
  if(dt>.25){this.reset();return;}
  this.cooldown=Math.max(0,this.cooldown-dt);
  const eligible:HeroineRival[]=[],present=new Set(rivals.map(r=>r.id));
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
  return {id:target.id,side,action:kind+(side==='left'?'Left':'Right')};
 }
}
function snapshot(x:unknown){
 const {previous,armed,cooldown,serial}=x as OriginalEager;
 return {previous:[...previous],armed:[...armed],cooldown,serial};
}

it('prunes blocked, invalid or nonclosing rows before resolving, and preserves side and deterministic tie-break',()=>{
 const control=new OriginalEager(),lazy=new HeroineOpportunities();
 const resolve=vi.fn((r:{id:string})=>r.id==='A'?2.6:-2.6);
 const lead=(lead:number)=>[{id:'B',lead,finished:false,localX:-2.6},{id:'A',lead,finished:false,localX:2.6}];
 const run=(dt:number,r:HeroineRival[],blocked=false)=> {
  const expected=control.update(dt,r,blocked);
  const actual=lazy.update(dt,r.map(({localX,...row})=>row),blocked,resolve);
  expect(actual).toEqual(expected);expect(snapshot(lazy)).toEqual(snapshot(control));return actual;
 };
 run(.1,lead(10));run(.1,lead(8),true);run(.1,lead(9));run(.1,lead(3.0));run(.1,lead(3.2));
 expect(resolve).not.toHaveBeenCalled();
 expect(run(.1,lead(2.5))).toEqual({id:'A',side:'left',action:'shoutLeft'});
 expect(resolve.mock.calls.map(([r])=>r.id)).toEqual(['B','A']);
 run(.1,lead(2));run(.3,lead(8));run(NaN,lead(6));
 expect(resolve).toHaveBeenCalledTimes(2);
});

it('matches the original and eager refactor over randomized repeatable trajectories and resets',()=>{
 let n=0x82cf42da;
 const next=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 let events=0,queries=0,baselineQueries=0,ticks=0;
 for(let seed=0;seed<32;seed++){
  const reference=new OriginalEager(),eager=new HeroineOpportunities(),lazy=new HeroineOpportunities();
  let time=0;
  for(let f=0;f<600;f++){
   ticks++;
   const dt=f===291?.4:f===360?0:.013+.018*next();
   time+=dt;
   const rows:HeroineRival[]=Array.from({length:7},(_,i)=>{
    const speed=11+i*.8;
    return {id:'R'+i,lead:36-((time*speed+i*9+seed*2.3)%66)+(next()-.5)*.04,
     finished:next()<.006,localX:(i%2?-1:1)*(i===0?1.4:2+i*.68+next()*.2)};
   }).filter(()=>next()>.004);
   if(f===521)rows.splice(0,1,{...rows[0],lead:NaN});
   if(f===545)rows.reverse();
   const blocked=next()<.009;
   const expected=reference.update(dt,rows,blocked);
   if(expected)events++;
   expect(eager.update(dt,rows,blocked)).toEqual(expected);
   const lazyRows=rows.map(({localX,...r})=>r);
   expect(lazy.update(dt,lazyRows,blocked,(_r,i)=>{queries++;return rows[i].localX;})).toEqual(expected);
   baselineQueries+=rows.length;
   expect(snapshot(lazy)).toEqual(snapshot(reference));
   expect(snapshot(eager)).toEqual(snapshot(reference));
  }
 }
 expect(ticks).toBe(19200);
 expect(events).toBeGreaterThan(30);
 expect(queries).toBeGreaterThanOrEqual(events);
 expect(queries/baselineQueries).toBeLessThan(.01);
});
