import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {rockySections,rockWall} from '../src/rocky-shoulder';
import {boulderLayout,boulderMesh,boulderCorridorExtra,BoulderContact} from '../src/rock-boulders';
import {createState,step} from '../src/handling';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
}) as any;
const sections=()=>rockySections(1,70000,()=>[0,1,0],true,()=>.002);
const boulders=()=>boulderLayout(sections(),()=>7);

describe('discrete boulders replace continuous r7 rock wall',()=>{
 it('scatters independently sized large rocks on outside bends with real gaps',()=>{
  const rocks=sections();
  expect(rocks.length).toBeGreaterThan(0);
  const layout=boulders();
  expect(layout).toEqual(boulders());
  expect(layout.length).toBeGreaterThan(2);
  expect(layout.every(b=>b.side===-1&&b.height>=10&&b.height<=28)).toBe(true);
  const first=layout.filter(b=>b.distance>=rocks[0].start&&b.distance<=rocks[0].end);
  expect(first.length).toBeGreaterThanOrEqual(3);
  expect(new Set(first.map(b=>b.radiusX.toFixed(3))).size).toBeGreaterThan(1);
  expect(new Set(first.map(b=>b.height.toFixed(3))).size).toBeGreaterThan(1);
  expect(first.some((b,i)=>i>0&&b.distance-b.radiusD>(first[i-1].distance+first[i-1].radiusD)+10)).toBe(true);
  expect(first.some(b=>Math.abs(b.lateral)-(7+b.radiusX)<2.5)).toBe(true);
 });
 it('emits geometry for individual rocks, none for gaps, and leaves historic r6 walls intact',()=>{
  const bs=boulders(),rock=sections()[0],first=bs.find(b=>b.distance>=rock.start&&b.distance<rock.end)!;
  const head=boulderMesh(sample,bs,first.distance-2,first.distance+2)!;
  expect(head).toBeDefined();
  expect(head.kind).toBe('grass');
  expect(head.positions.length).toBeGreaterThan(150);
  const next=bs.filter(b=>b.distance>first.distance)[0];
  expect(next).toBeDefined();
  const gapStart=first.distance+2,gapEnd=next.distance-2;
  if(!bs.some(b=>b.distance>=gapStart&&b.distance<gapEnd)){
   expect(boulderMesh(sample,bs,gapStart,gapEnd)).toBeUndefined();
  }
  const maxY=Math.max(...head.positions.filter((_,i)=>i%3===1));
  expect(maxY).toBeGreaterThan(6);
  const old=rockySections(1,70000,()=>[0,1,0])[0];
  expect(rockWall(sample,()=>7,old,old.start,old.end)).toBeDefined();
 });
 it('hit a single visible boulder rather than the entire section; impact normal varies',()=>{
  const bs=boulders(),b=bs[0];
  const collision=(lateralOffset:number)=>{
   const contact=new BoulderContact(bs,1.3,2.8);
   const s={...createState(),distance:b.distance, lateral:b.lateral+lateralOffset,speed:75};
   const previous={distance:b.distance-b.radiusD-12,lateral:s.lateral};
   const event=contact.update(s,previous,1/60);
   return {event,state:s,contact};
  };
  const center=collision(0),offset=collision(-b.radiusX*.53);
  expect(center.event?.boulderId).toBe(b.id);
  expect(offset.event?.boulderId).toBe(b.id);
  expect(center.contact.impacts).toBe(1);
  expect(center.state.speed).toBeLessThan(75);
  expect(Math.abs(center.state.lateralRate)).toBeGreaterThan(0);
  expect(center.event?.normal).not.toEqual(offset.event?.normal);
  expect(center.contact.yaw).not.toBeCloseTo(offset.contact.yaw,2);
  // Passing through the large section between actual boulders does not hit air.
  const section=sections()[0],empty=bs.find((rock,i)=>i>0&&rock.distance-bs[i-1].distance>rock.radiusD+bs[i-1].radiusD+12);
  expect(empty).toBeDefined();
  const prev=bs[bs.indexOf(empty!)-1],d=(prev.distance+empty!.distance)/2;
  const safe=new BoulderContact(bs,1.3,2.8);
  const state={...createState(),distance:d+1,lateral:prev.lateral,speed:70};
  expect(safe.update(state,{distance:d-1,lateral:prev.lateral},1/60)).toBeUndefined();
  expect(safe.impacts).toBe(0);
  expect(section.r7).toBe(true);
 });
 it('outer invisible fail-safe lies behind stones, and only relaxes the corridor inside rock areas',()=>{
  const rock=sections()[0],before=rock.start-150,inside=(rock.start+rock.end)/2;
  expect(boulderCorridorExtra(before,sections())).toBe(0);
  expect(boulderCorridorExtra(inside,sections())).toBeGreaterThan(10);
  const large={...createState(),distance:inside,lateral:7+3.6,speed:0};
  step(large,{gas:false,brake:false,steer:0},1/60,0,1,()=>7,0,0,d=>boulderCorridorExtra(d,sections()));
  expect(large.lateral).toBeGreaterThan(7+3);
  const ordinary={...createState(),distance:before,lateral:7+3.6,speed:0};
  step(ordinary,{gas:false,brake:false,steer:0},1/60,0,1,()=>7);
  expect(ordinary.lateral).toBeLessThanOrEqual(7+2.6);
 });
});
