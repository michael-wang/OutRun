import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {TRIP_BARRIER_INNER_M,TRIP_BARRIER_OUTER_M,TRIP_MARKER_CENTER_M,tripBarrierRawOffset,roadOffset} from '../src/road-profile';
import {prepareRoadChunk} from '../src/road-chunk';
import {createState,CORRIDOR_LIMIT,ROAD_HALF_WIDTH} from '../src/handling';
import {GuardrailContact} from '../src/guardrail-contact';

describe('Goal 1 — visible roadside barriers, original arcade corridor',()=>{
  it('inverts roadOffset exactly for both narrow and wide shoulder profiles',()=>{
    for(const halfWidth of [3.5,7,10.5,14]){
      for(const shoulderWidth of [1.6,2.5,3.6,6,6.8]){
        for(const side of [-1,1] as const){
          const shoulders={left:shoulderWidth,right:7.4-shoulderWidth};
          for(const extra of [TRIP_BARRIER_INNER_M,TRIP_BARRIER_OUTER_M,TRIP_MARKER_CENTER_M]){
            const raw=tripBarrierRawOffset(side,extra,shoulders);
            expect(roadOffset(raw,halfWidth,shoulders)).toBeCloseTo(side*(halfWidth+extra),8);
          }
        }
      }
    }
    expect(CORRIDOR_LIMIT-ROAD_HALF_WIDTH).toBeCloseTo(2.6,8); // ALB corridor unchanged
  });

  it('renders both r7 continuous rails aligned with markers, independent of shoulder width',()=>{
    const sample=(d:number)=>({
      position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
      tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
    }) as any;
    for(const shoulders of [{left:1.6,right:6.8},{left:6.8,right:1.6},{left:6,right:6}]){
      const meshes=prepareRoadChunk(sample,()=>7,()=>[0,1,0],0,100,1000,false,true,[],()=>shoulders);
      const rail=meshes.find(m=>m.kind==='rail')!;
      expect(rail,'r7 double rail exists').toBeDefined();
      const x:number[]=[];
      for(let i=0;i<rail.positions.length;i+=3)x.push(rail.positions[i]);
      expect(Math.min(...x)).toBeCloseTo(-(7+TRIP_BARRIER_OUTER_M),5);
      expect(Math.max(...x)).toBeCloseTo(7+TRIP_BARRIER_OUTER_M,5);
      for(const side of [-1,1] as const){
        const inboard=side*(7+TRIP_BARRIER_INNER_M);
        expect(x.some(v=>Math.abs(v-inboard)<.001)).toBe(true);
      }
      const historical=prepareRoadChunk(sample,()=>7,()=>[0,1,0],0,100,1000,false,true);
      const oldRail=historical.find(m=>m.kind==='rail')!;
      const oldMax=Math.max(...Array.from(oldRail.positions).filter((_,i)=>i%3===0));
      expect(oldMax).toBeLessThan(0); // non-r7 legacy left rail remains unchanged
    }
  });

  it('contacts visible rails from either side before the former invisible corridor limit',()=>{
    const edge=7+TRIP_BARRIER_INNER_M;
    for(const side of [-1,1] as const){
      const contact=new GuardrailContact(1.3,2.8,()=>({left:-edge,right:edge}));
      const state={...createState(),distance:500,lateral:side*(7+2.35),speed:70};
      const hit=contact.update(state,499.2,side*(7+1.9),1/60,true);
      expect(hit).toBeGreaterThan(0);
      expect(contact.impacts).toBe(1);
      expect(Math.abs(state.lateral)).toBeLessThan(7+2.6);
      expect(state.speed).toBeLessThan(70);
      for(let i=0;i<15;i++)contact.update(state,500,state.lateral,1/60,true);
      expect(contact.impacts).toBe(1);
      contact.reset();
      expect(contact.impacts).toBe(0);
    }
  });
});
