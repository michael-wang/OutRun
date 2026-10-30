/** Bounded presentation/traffic state, independent of impact displacement. */
export interface LaneActor {id:number;distance:number;speed:number;lateral:number;signal?:number;changing?:boolean;unsignaled?:boolean}
interface Maneuver {center:number;from:number;to:number;start:number;next:number;event:number;silent:boolean;active:boolean}
export const trafficRandom=(seed:number,id:number)=>{let x=(seed^Math.imul(id+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return ((x^(x>>>16))>>>0)/4294967296;};
const smooth=(t:number)=>t*t*t*(t*(t*6-15)+10),clamp=(v:number,limit:number)=>Math.max(-limit,Math.min(limit,v));
export class TrafficLanes {
 private states=new Map<number,Maneuver>();private activeIds=new Set<number>();
 constructor(private seed:number){}
 reset(){this.states.clear();this.activeIds.clear();}
 update(time:number,actors:LaneActor[],halfAt:(d:number)=>number,player:{distance:number;lateral:number;speed:number},reacting:(id:number)=>boolean){
  this.activeIds=new Set(actors.map(a=>a.id));
  for(const a of actors){let s=this.states.get(a.id);if(!s){const phase=.8+trafficRandom(this.seed^0x98,a.id)*1.2;s={center:a.lateral,from:a.lateral,to:a.lateral,start:0,next:time+phase,event:0,silent:false,active:false};this.states.set(a.id,s);}a.lateral=clamp(s.center,Math.max(1.75,halfAt(a.distance)-1.75));a.signal=0;a.changing=false;a.unsignaled=false;}
  for(const a of actors){const s=this.states.get(a.id)!,limit=Math.max(1.75,Math.min(halfAt(a.distance),halfAt(a.distance+a.speed*3.2))-1.75);
   const safe=(to:number)=>{
    const lo=Math.min(s.center,to)-2.8,hi=Math.max(s.center,to)+2.8;
    const conflict=(distance:number,speed:number,lateral:number,margin:number)=>{if(lateral<lo||lateral>hi)return false;const z=distance-a.distance,end=z+(speed-a.speed)*3.2;return Math.min(z,end)<margin&&Math.max(z,end)>-margin;};
    if(conflict(player.distance,player.speed,player.lateral,23))return false;
    return !actors.some(b=>{if(b.id===a.id)return false;if(reacting(b.id)&&Math.abs(b.distance-a.distance)<60)return true;const other=this.states.get(b.id)!;return conflict(b.distance,b.speed,b.lateral,22)||(other.active&&conflict(b.distance,b.speed,other.to,22));});
   };
   if(reacting(a.id)||Math.abs(s.to)>limit+.01){s.active=false;s.next=Math.max(s.next,time+4);s.center=clamp(s.center,limit);s.from=s.to=s.center;}
   const closing=Math.max(0,player.speed-a.speed),ahead=a.distance-player.distance;
   if(!s.active&&time>=s.next&&ahead>Math.max(80,closing*3.2+25)&&ahead<Math.max(160,closing*3.2+75)){
    const direction=trafficRandom(this.seed^0x159,a.id+s.event*997)<.5?-1:1;
    const nearest=Math.round((s.center-1.75)/3.5)*3.5+1.75;let to=nearest+direction*3.5;if(Math.abs(to)>limit)to=nearest-direction*3.5;
    if(Math.abs(to)<=limit&&Math.abs(to-s.center)>.5&&safe(to)){s.from=s.center;s.to=to;s.start=time;s.silent=trafficRandom(this.seed^0x3ef,a.id+s.event*997)<.1;s.event++;s.active=true;}
    else s.next=time+2;
   }
   if(s.active){const age=time-s.start;
    if(age<.8&&!safe(s.to)){s.active=false;s.next=time+3;}
    else {const t=Math.max(0,Math.min(1,(age-.8)/2.4));s.center=s.from+(s.to-s.from)*smooth(t);a.changing=t>0&&t<1;a.unsignaled=s.silent;a.signal=!s.silent&&Math.floor(age/.3)%2===0?Math.sign(s.to-s.from):0;if(t>=1){s.active=false;s.next=time+24+trafficRandom(this.seed^0x28,a.id+s.event)*20;a.signal=0;a.changing=false;}}
   }
   a.lateral=clamp(s.center,limit);
  }
 }
 inspect(){return [...this.states].filter(([id])=>this.activeIds.has(id)).map(([id,s])=>({id,...s}));}
}
