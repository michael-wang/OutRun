import {describe,expect,it} from 'vitest';
import {CityTraffic,civilianCount,rivalStart,incidents,cityLanesAt} from '../src/city/city-traffic.mjs';
import {edge} from '../src/city/route.mjs';

const dt=1/60;
const away=()=>({d:-100,oldD:-100,x:0,oldX:0,speed:0,vel:0,kick:0});
function fixture(ids:number[]){
 const t=new CityTraffic(5390);for(const c of t.actors)c.finished=!ids.includes(c.id);return t;
}
function place(c:any,d:number,x:number,speed:number){
 Object.assign(c,{distance:d,lateral:x,targetLateral:x,speed,cruiseSpeed:speed,targetSpeed:speed,sideVelocity:0});
}
describe('City physical traffic and seeded incident approaches',()=>{
 it('replays a seed and leaves two through lanes at every stopped vehicle',()=>{
  const digest=(seed:number)=>new CityTraffic(seed).actors.map((c:any)=>[c.distance,c.lateral,c.speed]);
  expect(digest(5390)).toEqual(digest(5390));expect(digest(1)).not.toEqual(digest(2));
  const t=new CityTraffic();expect(t.actors.filter((c:any)=>!c.stationary&&c.id<rivalStart)).toHaveLength(40);
  for(const [i,s] of incidents.entries()){
   const c=t.actors[civilianCount+i];
   for(let d=s.distance-115;d<=s.distance+30;d+=5){
    expect(cityLanesAt(d).filter((x:number)=>Math.abs(x-c.lateral)>3.5).length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(c.lateral)+c.width/2).toBeLessThan(edge(d,s.side));
   }
  }
 });
 for(const other of [0,rivalStart,civilianCount]){
  it('resolves player contact once with recovery, actor '+other,()=>{
   const t=fixture([other]),c=t.actors[other];place(c,800,2.4,c.stationary?0:24);
   const p={d:796.8,oldD:794.5,x:2.50,oldX:2.50,speed:68,vel:0,kick:0};
   const hit=t.step(dt,p);expect(hit?.kind).toBe('rear');expect(p.speed).toBeLessThan(68);
   expect(Math.abs(p.kick)).toBeGreaterThan(1);
   for(let j=0;j<15;j++){p.oldD=p.d;p.oldX=p.x;p.d+=p.speed*dt;t.step(dt,p);}
   expect(t.contacts.filter((e:any)=>e.a==='player')).toHaveLength(1);
   if(c.stationary)expect(c.incidentMotion.hits).toBe(1);
   for(let j=0;j<70;j++)t.step(dt,away());
   expect(t.latched.size).toBe(0);
  });
 }
 for(const pursuer of [0,rivalStart]){
  it('brakes or changes lane and clears the stopped car for actor '+pursuer,()=>{
   const t=fixture([pursuer,civilianCount]),c=t.actors[pursuer],stop=t.actors[civilianCount];
   place(c,stop.distance-148,stop.lateral,38);let reverse=0, closest=100, last=c.distance;
   for(let i=0;i<1000;i++){t.step(dt,away());reverse+=Math.max(0,last-c.distance);last=c.distance;
    if(Math.abs(c.distance-stop.distance)<4.4)closest=Math.min(closest,Math.abs(c.lateral-stop.lateral));}
   expect(c.distance).toBeGreaterThan(stop.distance+150);expect(closest).toBeGreaterThan(1.95);expect(reverse).toBe(0);
  });
 }
 it('serializes following cars and recovers when a blocked passing lane reopens',()=>{
  const t=fixture([0,1,2,3,4,civilianCount]),stop=t.actors[civilianCount],at=stop.distance;
  place(t.actors[0],at-28,stop.lateral,4);place(t.actors[1],at-52,stop.lateral,8);
  for(const [i,x] of [[2,7.2],[3,2.4],[4,-2.4]]){const a=t.actors[i];place(a,at-25,x,0);a.stationary=true;}
  for(let i=0;i<105;i++)t.step(dt,away());
  expect(t.actors[0].distance).toBeLessThan(at-4);expect(t.actors[0].distance-t.actors[1].distance).toBeGreaterThan(4);
  for(const c of t.actors.slice(2,5))c.finished=true;
  t.actors[0].cruiseSpeed=36;t.actors[1].cruiseSpeed=36;
  for(let i=0;i<1800;i++)t.step(dt,away());
  expect(t.actors[1].distance).toBeGreaterThan(at+75);
 });
 for(const [a,b] of [[1,0],[rivalStart,0],[rivalStart+1,rivalStart]]){
  it('resolves exceptional AI side contact once for '+a+'/'+b,()=>{
   const t=fixture([a,b]),left=t.actors[a],right=t.actors[b];
   place(right,750,2.4,30);place(left,750,.39,30);left.sideVelocity=8;right.sideVelocity=-4;
   for(let i=0;i<18;i++)t.step(dt,away());
   const events=t.contacts.filter((e:any)=>e.a===a&&e.b===b);
   expect(events).toHaveLength(1);expect(events[0].kind).toBe('side');expect(events[0].before).toBeGreaterThan(events[0].after);
  });
 }

 it('transfers a forced AI rear contact to the authoritative incident only once',()=>{
  const t=fixture([0,civilianCount]),c=t.actors[0],stop=t.actors[civilianCount];
  place(c,stop.distance-4.92,stop.lateral,46);
  for(let i=0;i<12;i++)t.step(dt,away());
  expect(stop.incidentMotion.hits).toBe(1);expect(stop.distance).toBeGreaterThan(incidents[0].distance);
  expect(c.speed).toBeLessThan(46);
 });

 for(const seed of [5390,17,80]){
  it('clears both incidents over a full seeded traffic session '+seed,()=>{
   const t=new CityTraffic(seed),hold=t.actors.map(()=>0);
   let maxWait=0;
   for(let i=0;i<30*235;i++){
    t.step(1/30,away());
    for(const c of t.actors){
     if(c.stationary||c.finished)continue;
     const atWreck=incidents.some((s:{distance:number})=>Math.abs(c.distance-s.distance)<65);
     hold[c.id]=atWreck&&c.speed<1?hold[c.id]+1/30:0;
     maxWait=Math.max(maxWait,hold[c.id]);
    }
   }
   expect(maxWait).toBeLessThan(12);
   expect(t.actors.filter((c:any)=>!c.stationary).every((c:any)=>c.distance>incidents[1].distance+100)).toBe(true);
  });
 }
});
