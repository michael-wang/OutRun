import {length as finish} from './route.mjs';

// Absolute race seconds. At a gate carry up to six unused seconds into the next sector.
export const gates=[
 {at:1035,seconds:26},{at:3010,seconds:38},{at:4640,seconds:35},
 {at:5715,seconds:20},{at:finish,seconds:30}
];
export function checkpointRace(entry=0){
 const next=gates.findIndex(g=>g.at>entry);
 if(next<0)throw Error('City entry must be before finish');
 const from=gates[next-1]?.at??0,gate=gates[next];
 const budget=Math.max(8,Math.ceil(gate.seconds*(gate.at-entry)/(gate.at-from)));
 return {next,deadline:budget,outcome:'racing',awards:0,won:new Set(),events:[],rank:0};
}
// Interpolate the crossing inside a rendered frame. Equality at the deadline counts.
export function advanceCheckpoints(s,from,to,begin,end,rivals){
 if(s.outcome!=='racing')return;
 const gate=gates[s.next];
 const crossed=to>=gate.at&&from<gate.at;
 const fraction=crossed?(gate.at-from)/(to-from):1;
 const at=begin+(end-begin)*fraction;
 if((crossed&&at>s.deadline+1e-8)||(!crossed&&end>=s.deadline)){
  s.outcome='timeout';return {kind:'timeout',time:s.deadline};
 }
 if(!crossed)return;
 const ahead=rivals.filter(r=>r.from+(r.to-r.from)*fraction<gate.at-1e-6);
 const finish=s.next===gates.length-1;
 let bonus=0;
 if(!finish)for(const r of ahead){if(!s.won.has(r.id)){s.won.add(r.id);bonus+=2;}}
 const event={kind:finish?'finish':'gate',gate:s.next+1,time:at,at:gate.at,bonus,rank:1+rivals.length-ahead.length};
 s.events.push(event);s.awards+=bonus;s.next++;
 if(finish){s.outcome='finish';s.rank=event.rank;}
 else{s.deadline=at+Math.min(6,Math.max(0,s.deadline-at))+gates[s.next].seconds+bonus;}
 return event;
}
