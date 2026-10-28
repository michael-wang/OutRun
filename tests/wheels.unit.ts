import {it,expect} from 'vitest';
import {createRoadWheel,wheelRoll,TIRE_RADIUS} from '../src/wheels';
it('roll tracks real travel, independent of timestep, and zero travel stops every wheel',()=>{
 let angle=0;for(let i=0;i<120;i++)angle=wheelRoll(angle,100/120);expect(angle).toBeCloseTo(100/TIRE_RADIUS,9);expect(wheelRoll(angle,0)).toBe(angle);
 for(const side of [-1,1])for(const front of [false,true]){const w=createRoadWheel(side,front);for(let i=0;i<60;i++)w.advance(100/60,1,1/60);w.render();expect(w.inspect().angle).toBeCloseTo(angle,9);expect(w.inspect().steer).toBeCloseTo(front?-.3:0,5);const before=w.inspect().angle;w.advance(0,0,1);w.render();expect(w.inspect().angle).toBe(before);expect(w.inspect().steer).toBeCloseTo(0,5);w.reset();expect(w.inspect().angle).toBe(0);}
});
it('steering and spin have separate pivots and retain wheel center through full steering',()=>{
 const w=createRoadWheel(1,true);w.pivot.position.set(1.055,.46,1.38);const center=w.pivot.position.clone();w.advance(20,-1,1);w.render();expect(w.pivot.position.equals(center)).toBe(true);expect(w.pivot.rotation.y).toBeCloseTo(.3,5);expect(w.pivot.getObjectByName('rolling-axle')!.rotation.x).not.toBe(0);expect(w.pivot.rotation.x).toBe(0);
});

it('blur highlight remains animated at an exactly aliased full revolution per 30Hz frame',()=>{const w=createRoadWheel(1,true);const phases=[];for(let i=0;i<4;i++){w.advance(2*Math.PI*TIRE_RADIUS,0,1/30);w.render();phases.push(w.inspect());}expect(phases.every(p=>p.blurAmount===1)).toBe(true);expect(phases[3].blurAngle-phases[0].blurAngle).toBeCloseTo(1.4,8);expect(phases[3].angle).toBeCloseTo(8*Math.PI,8);});
