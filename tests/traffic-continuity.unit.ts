import {it,expect} from 'vitest';
import * as THREE from 'three';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Traffic,trafficRecipe} from '../src/traffic';
import {createState} from '../src/handling';
const sample=(d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(-1,0,0),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0});
it('tracks actual identities through slowing, overtaking and streaming re-entry',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1),recipe=trafficRecipe(1,70000),last=new Map<number,{distance:number;time:number;speed:number}>(),jumps:any[]=[],transitions:any[]=[];let ids=new Set<number>();
 for(let i=0;i<6000;i++){
  const time=i/10,player=350+time*110;traffic.update(time,player,1.75,110);const now=traffic.inspect();expect(now.actors.length).toBeLessThanOrEqual(12);expect(now.historySize??0).toBeLessThanOrEqual(recipe.length);const next=new Set(now.actors.map(a=>a.id));
  for(const a of now.actors){const old=last.get(a.id),nominal=recipe.find(r=>r.id===a.id)!;const row={id:a.id,time,actual:a.distance,nominal:nominal.distance+nominal.speed*time,speed:a.speed,visible:a.visible,player};if(old&&Math.abs(a.distance-old.distance)>110*(time-old.time)+3)jumps.push({...row,previous:old});if(!ids.has(a.id))transitions.push({...row,event:old?'reenter':'enter'});last.set(a.id,{distance:a.distance,time,speed:a.speed});}
  for(const id of ids)if(!next.has(id))transitions.push({id,time,event:'leave',...last.get(id)});ids=next;
 }
 traffic.dispose();mkdirSync('docs/evidence/traffic-continuity',{recursive:true});writeFileSync(`docs/evidence/traffic-continuity/${process.env.TRAFFIC_BASELINE?'before':'after'}.json`,JSON.stringify({jumps,transitions},null,2));
 if(process.env.TRAFFIC_BASELINE)expect(jumps.length).toBeGreaterThan(0);else expect(jumps).toEqual([]);
},20000);
it('collision sweeps use actual endpoints and require previously visible traffic',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1);traffic.update(0,350);let a=traffic.inspect().actors.find(a=>a.id===0)!;
 const state={...createState(),distance:a.distance,lateral:a.lateral,speed:70};expect(traffic.hit(0,state,{distance:a.distance-20,lateral:a.lateral},.1)).toBeUndefined();
 traffic.update(.1,350);const next=traffic.inspect().actors.find(a=>a.id===0)!;expect(next.previousDistance).toBe(a.distance);expect(next.previousLateral).toBe(a.lateral);expect(next.previousVisible).toBe(true);
 state.distance=next.distance;const event=traffic.hit(.1,state,{distance:a.distance-20,lateral:a.lateral},.1);expect(event?.actorId).toBe(0);
 writeFileSync('docs/evidence/traffic-continuity/contact.json',JSON.stringify({before:a,after:next,event},null,2));traffic.reset();expect(traffic.inspect().historySize).toBe(0);traffic.dispose();
});
it('fully overtaken traffic retires permanently and cannot reappear from behind when the player stops',()=>{
 const traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1),seen=new Map<number,{distance:number;type:number}>(),retired=new Set<number>();
 let previous=new Set<number>();
 for(let i=0;i<1300;i++){
  const time=i/10,player=350+Math.min(time,80)*110;
  traffic.update(time,player,1.75,time<80?110:0);
  const actors=traffic.inspect().actors,next=new Set(actors.map(a=>a.id));
  for(const id of retired)expect(next.has(id),`retired car ${id} must not chase the player`).toBe(false);
  for(const a of actors){
   expect(a.distance+a.speed*.2).toBeGreaterThan(player-250);
   seen.set(a.id,{distance:a.distance,type:a.type});
  }
  for(const id of previous)if(!next.has(id)){
   const old=seen.get(id);
   if(old&&old.distance+5<player)retired.add(id);
  }
  previous=next;
 }
 expect(retired.size).toBeGreaterThan(0);
 // Long stationary wait: no previously passed car can return from the rear.
 for(let t=130;t<155;t+=.1){
  traffic.update(t,350+80*110,1.75,0);
  expect(traffic.inspect().actors.some(a=>retired.has(a.id))).toBe(false);
 }
 traffic.reset();expect(traffic.inspect().passedCount).toBe(0);
 traffic.dispose();
},20000);
it('streaming readiness cannot reveal a collidable actor inside the player envelope',()=>{
 let ready=false;const traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1,()=>ready);traffic.update(0,350);const first=traffic.inspect().actors.find(a=>a.id===0)!;expect(first.visible).toBe(false);
 ready=true;traffic.update(.1,first.distance);const near=traffic.inspect().actors.find(a=>a.id===0)!;expect(near.visible).toBe(false);const state={...createState(),distance:near.distance,lateral:near.lateral,speed:60};expect(traffic.hit(.1,state,{distance:state.distance-20,lateral:state.lateral},.1)).toBeUndefined();
 traffic.update(.2,first.distance-200);const far=traffic.inspect().actors.find(a=>a.id===0)!;expect(far.visible).toBe(true);expect(far.previousVisible).toBe(false);traffic.dispose();
});
