import {TRAFFIC_TYPES,type TrafficActor} from './traffic';
const clamp=(n:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export interface PassVoice {id:number;type:number;pan:number;gain:number;cutoff:number;rate:number}
interface Pass {id:number;type:number;direction:number;side:number;started:number;lead:number;trail:number;peak:number}
/** Audio presentation only. Measured relative travel includes the game's arcade pace. */
export class PassBy {
 readonly voices:(PassVoice|undefined)[]=[undefined,undefined];
 private active:(Pass|undefined)[]=[undefined,undefined];private previous=new Map<number,number>();private played=new Set<number>();
 private time?:number;private nextStart=0;private blockedUntil=0;starts=0;crossings=0;private crossed=new Set<number>();
 reset(){this.suspend();this.played.clear();this.crossed.clear();this.starts=this.crossings=this.nextStart=this.blockedUntil=0;}
 suspend(){this.active.fill(undefined);this.voices.fill(undefined);this.previous.clear();this.time=undefined;}
 update(time:number,distance:number,lateral:number,extent:number,actors:readonly TrafficActor[],collisionId?:number){
  if(this.time!==undefined&&time<this.time)this.reset();const dt=this.time===undefined?0:time-this.time;this.time=time;
  if(collisionId!==undefined){this.played.add(collisionId);this.blockedUntil=time+.8;this.active.fill(undefined);this.voices.fill(undefined);}
  const ids=new Set(actors.map(a=>a.id));for(const id of this.previous.keys())if(!ids.has(id))this.previous.delete(id);for(const id of this.played)if(!ids.has(id)){this.played.delete(id);this.crossed.delete(id);}
  let candidate:{actor:TrafficActor;rate:number;z:number;side:number}|undefined;
  for(const a of actors){
   const z=a.distance-distance,old=this.previous.get(a.id),rate=old!==undefined&&dt>0?(z-old)/dt:0,side=a.lateral-lateral;
   this.previous.set(a.id,z);const safe=a.visible&&Math.abs(side)>extent+TRAFFIC_TYPES[a.type].width/2+.3&&Math.abs(side)<7.5;
   const slot=this.active.findIndex(p=>p?.id===a.id),speed=Math.abs(rate);
   if(slot>=0){
    const p=this.active[slot]!,phase=z*p.direction;
    if(!safe||time-p.started>1.4||phase < -p.trail||phase>p.lead*1.3||(!this.crossed.has(a.id)&&rate*p.direction>=0)) {this.active[slot]=undefined;this.voices[slot]=undefined;continue;}
    if(phase<=0&&!this.crossed.has(a.id)){this.crossed.add(a.id);this.crossings++;}
    const near=clamp(1-Math.abs(phase)/(phase>=0?p.lead:p.trail)),front=clamp(.5+phase/(p.lead+p.trail)),heavy=p.type!==0;
    this.voices[slot]={id:a.id,type:a.type,pan:Math.sign(side)*(.70+.27*near),gain:p.peak*near*near,cutoff:heavy?700+front*2700:1300+front*5200,rate:.72+.55*front};
   }else if(safe&&!this.played.has(a.id)&&speed>=9&&z*rate<0&&Math.abs(z)<=Math.min(24,Math.max(3,speed*(.28-.1*clamp(speed/85))))){
    if(time<this.blockedUntil){this.played.add(a.id);continue;}
    if(!candidate||Math.abs(z)<Math.abs(candidate.z))candidate={actor:a,rate,z,side};
   }
  }
  for(let i=0;i<2;i++)if(this.active[i]&&!ids.has(this.active[i]!.id)){this.active[i]=undefined;this.voices[i]=undefined;}
  if(candidate&&time>=this.nextStart){const slot=this.active.findIndex(p=>!p);this.played.add(candidate.actor.id);if(slot>=0){
   const speed=Math.abs(candidate.rate),strength=clamp(speed/85),type=candidate.actor.type;
   this.active[slot]={id:candidate.actor.id,type,direction:-Math.sign(candidate.rate),side:Math.sign(candidate.side),started:time,lead:Math.min(24,Math.max(3,speed*(.28-.1*strength))),trail:Math.min(28,Math.max(4,speed*(.35-.1*strength))),peak:Math.min(1.75,(.65+strength*.95)*(type===1?1.25:type===2?1.15:type===3?1.05:1))};
   this.starts++;this.nextStart=time+.30;
  }}
  return this.voices;
 }
 inspect(){return {starts:this.starts,crossings:this.crossings,active:this.voices.filter(Boolean).map(v=>({...v!})),tracked:this.previous.size,consumed:this.played.size};}
}
