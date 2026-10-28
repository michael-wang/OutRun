import {it,expect} from 'vitest';
import {createCar} from '../src/car';
it('occupants and hair respond to observed motion without moving the car or wheel centers',()=>{
 const car=createCar(),m=car.userData.motion;
 const centers=m.inspect().map((w:any)=>w.center);
 m.reset();const stopped=m.occupants();expect(stopped.wind).toBe(0);
 for(let i=0;i<120;i++)m.advance(113.75/60,1,1/60);
 const fast=m.occupants();expect(fast.wind).toBeGreaterThan(.99);expect(fast.people.every((p:any)=>p.lean>.07)).toBe(true);
 expect(fast.people[1].hair.every((h:any)=>h.back>1.1)).toBe(true);
 const phase=fast.people[1].hair[0].side;m.advance(113.75/60,0,1/60);expect(m.occupants().people[1].hair[0].side).not.toBe(phase);
 for(let i=0;i<120;i++)m.advance(113.75/60,-1,1/60);
 expect(m.occupants().people.every((p:any)=>p.lean<-.07)).toBe(true);
 expect(car.position.toArray()).toEqual([0,0,0]);expect(m.inspect().map((w:any)=>w.center)).toEqual(centers);
 for(let i=0;i<240;i++)m.advance(0,0,1/60);
 expect(m.occupants().wind).toBeLessThan(.0001);m.reset();expect(m.occupants().phase).toBe(0);
});
