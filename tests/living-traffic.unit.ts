import {it,expect} from 'vitest';
import * as THREE from 'three';
import {TrafficLanes} from '../src/traffic-lanes';
import {Traffic,trafficRecipe,TRAFFIC_LIMIT} from '../src/traffic';
import {mkdirSync,writeFileSync} from 'node:fs';
it('signals precede smooth adjacent moves, unsafe approaches postpone, and reset is deterministic',()=>{
 const run=(blocked=false)=>{const lanes=new TrafficLanes(1),a={id:0,distance:1000,speed:30,lateral:-1.75,signal:0,changing:false,unsignaled:false},rows=[];for(let t=0;t<20;t+=.05){lanes.update(t,[a],()=>7,{distance:blocked?960:880,lateral:-1.75,speed:blocked?60:30},()=>false);rows.push({...a,t});}return rows;};
 const a=run(),moving=a.find(r=>r.changing)!;expect(moving).toBeDefined();expect(a.some(r=>r.t<moving.t&&r.signal!==0)).toBe(true);for(let i=1;i<a.length;i++)expect(Math.abs(a[i].lateral-a[i-1].lateral)).toBeLessThan(.15);expect(run()).toEqual(a);expect(run(true).every(r=>!r.changing&&r.signal===0)).toBe(true);
 const lanes=new TrafficLanes(1);lanes.update(0,[{id:1,distance:100,speed:20,lateral:1.75}],()=>7,{distance:0,lateral:0,speed:0},()=>false);lanes.reset();expect(lanes.inspect()).toEqual([]);
});
it('a ten-minute window encounters varied speeds and both signaled and unsignaled moves without exceeding the pool',()=>{
 const sample=(d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(-1,0,0),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0}),traffic=new Traffic(new THREE.Scene(),sample,()=>7,70000,1),events:any[]=[],seen=new Set<string>(),speeds=new Map<number,number>();
 for(let frame=0;frame<6000;frame++){const t=frame/10;traffic.update(t,350+t*110,0,110);const s=traffic.inspect();expect(s.actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);expect(s.laneChanges.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);for(const a of s.actors){if(a.distance<350+t*110+100)speeds.set(a.id,a.speed*3.6);}for(const m of s.laneChanges){const key=m.id+':'+m.event;if(m.active&&!seen.has(key)){seen.add(key);events.push({...m,time:t,distance:s.actors.find(a=>a.id===m.id)!.distance});}}}
 expect(events.some(e=>e.to>e.from&&!e.silent)).toBe(true);expect(events.some(e=>e.to<e.from&&!e.silent)).toBe(true);expect(events.some(e=>e.silent)).toBe(true);expect([...speeds.values()].some(v=>v<70)).toBe(true);expect([...speeds.values()].some(v=>v>250)).toBe(true);
 mkdirSync('docs/evidence/traffic-continuity',{recursive:true});writeFileSync('docs/evidence/traffic-continuity/events.json',JSON.stringify({events,encounteredSpeeds:[...speeds]},null,2));traffic.dispose();
 for(const seed of [1,2,7]){const recipe=trafficRecipe(seed,69000);expect(recipe.some(a=>a.speed*3.6<70)).toBe(true);expect(recipe.some(a=>a.speed*3.6>250)).toBe(true);}
},20000);
