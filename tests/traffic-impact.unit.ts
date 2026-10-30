import {it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,TRAFFIC_TYPES,trafficRecipe} from '../src/traffic';
import {TrafficImpact,sweptContact} from '../src/traffic-impact';
import {createState} from '../src/handling';
import {SkidFeedback} from '../src/skid-feedback';
const sample=(d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0});
it('sweeps fast crossings and rejects clean overtakes',()=>{
 expect(sweptContact(0,-20,0,20,3,6)?.kind).toBe('rear');expect(sweptContact(4,0,2,0,3,6)?.kind).toBe('side');expect(sweptContact(4,-20,4,20,3,6)).toBeUndefined();
});
it('all four vehicle types keep real displacement, separate contact, recover and reset',()=>{
 for(let type=0;type<4;type++)for(const kind of ['side','rear']){
  const scene=new THREE.Scene(),traffic=new Traffic(scene,sample,()=>7,69000,1),motion=new TrafficImpact();
  traffic.update(0,trafficRecipe(1,69000).find(a=>a.type===type)!.distance-100);traffic.update(.001,trafficRecipe(1,69000).find(a=>a.type===type)!.distance-100);const a=traffic.inspect().actors.find(a=>a.type===type)!;expect(a).toBeDefined();
  const spec=TRAFFIC_TYPES[type],s={...createState(),speed:75,lateral:a.lateral+(kind==='side'?2:0),distance:a.distance-(kind==='side'?0:spec.length/2+2)};
  const event=traffic.hit(0,s,{distance:s.distance-(kind==='rear'?8:0),lateral:s.lateral+(kind==='side'?2:0)},.05)!;expect(event.kind).toBe(kind);motion.kick(s,event);const initialSpeed=s.speed;
  const events=[event];let maxOffset=0,maxYaw=0,skid=false;const feedback=new SkidFeedback();
  for(let i=1;i<=120;i++){
   const previous={distance:s.distance,lateral:s.lateral};s.distance+=s.speed/60;motion.update(s,1/60,7);traffic.update(i/60,s.distance);const next=traffic.hit(i/60,s,previous,1/60,1.55,2.8,motion.yaw);if(next){events.push(next);motion.kick(s,next);}
   const r=traffic.inspect().reactions.find(r=>r.id===a.id);if(r){maxOffset=Math.max(maxOffset,Math.abs(r.offset));maxYaw=Math.max(maxYaw,Math.abs(r.yaw));}
   skid ||= feedback.update(s.speed,0,1/60,0,0,motion.slide)>0;
  }
  expect(initialSpeed).toBeLessThan(75);expect(maxOffset).toBeGreaterThan(.2);expect(maxYaw).toBeGreaterThan(.02);expect(events.filter(e=>e.actorId===a.id).length,JSON.stringify(events)).toBe(1);if(kind==='rear')expect(skid).toBe(true);
  for(let i=121;i<900;i++)traffic.update(i/60,s.distance);
  expect(traffic.inspect().reactions.every(r=>Math.abs(r.offset)<.01)).toBe(true);
  traffic.update(20,12000);expect(traffic.inspect().reactions).toHaveLength(0);traffic.reset();motion.reset();expect(motion.velocity).toBe(0);expect(traffic.inspect().impacts).toBe(0);traffic.dispose();expect(scene.children).toHaveLength(0);
 }
});
it('shared feedback requires sustained actual slide, including a straight road',()=>{
 const s=new SkidFeedback();for(let i=0;i<120;i++)expect(s.update(70,1,1/60,0,1,0)).toBe(0);
 for(let i=0;i<5;i++)expect(s.update(45,0,1/60,0,0,5)).toBe(0);
 for(let i=0;i<10;i++)s.update(45,0,1/60,0,0,5);expect(s.intensity).toBeGreaterThan(.5);
 for(let i=0;i<30;i++)s.update(45,0,1/60,0,0,0);expect(s.intensity).toBe(0);
});

it('tiny integration remainders do not interrupt collision skid persistence',()=>{const m=new TrafficImpact(),s={...createState(),speed:60},skid=new SkidFeedback();m.kick(s,{actorId:0,type:0,kind:'rear',side:1,distance:0,lateral:0,severity:1});for(let i=0;i<12;i++)for(const dt of [1/120,0.00003]){m.update(s,dt,7);skid.update(60,0,dt,0,0,m.slide);}expect(skid.intensity).toBeGreaterThan(.5);});
