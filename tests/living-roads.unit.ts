import {it,expect} from 'vitest';
import {createState,step} from '../src/handling';
import {curvatureForDemand} from '../src/challenges';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotWeights} from '../src/pilot-composer';
import {generatedBank} from '../src/banking';
it('preserves straight precision and leaves bounded, controllable momentum on release/reversal',()=>{
 const straight={...createState(),speed:75,lateral:2};for(let i=0;i<600;i++)step(straight,{gas:true,brake:false,steer:0},1/120,0);expect(straight.lateral).toBe(2);expect(straight.lateralRate).toBe(0);
 for(const sign of [-1,1]){const s={...createState(),speed:75};for(let i=0;i<30;i++)step(s,{gas:true,brake:false,steer:sign},1/120,0);const before=s.lateral;step(s,{gas:true,brake:false,steer:-sign},1/120,0);expect(s.lateralRate*sign).toBeGreaterThan(0);for(let i=0;i<40;i++)step(s,{gas:true,brake:false,steer:-sign},1/120,0);expect(s.lateralRate*sign).toBeLessThan(0);for(let i=0;i<240;i++)step(s,{gas:true,brake:false,steer:0},1/120,0);expect(s.lateralRate).toBe(0);expect(Math.abs(s.lateral-before)).toBeLessThan(5);expect(Math.abs(s.weightRoll)).toBeLessThan(.001);}
});
it('inward bank partially relieves pressure without changing throttle or steering authority',()=>{
 const flat={...createState(),speed:65},bank={...flat},k=curvatureForDemand(.8);for(let i=0;i<100;i++){step(flat,{gas:true,brake:false,steer:.5},1/120,k);step(bank,{gas:true,brake:false,steer:.5},1/120,k,1,7,0,10*Math.PI/180);}expect(bank.requiredSteer).toBeLessThan(flat.requiredSteer);expect(Math.abs(bank.lateral)).toBeLessThan(Math.abs(flat.lateral));expect(bank.speed).toBe(flat.speed);expect(bank.appliedSteer).toBe(flat.appliedSteer);
});
it('r2 banking is deterministic, signed, continuous and biome capped; r1 retains flat geometry and codes',()=>{
 for(const seed of [1,2,7]){const a=generateTrip(seed,2),legacy=generateTrip(seed,1),t=createPilotTrack(a),old=createPilotTrack(legacy);expect(a.tripCode).toContain('r2-');expect(a.tripCode).toContain('ALB2');expect(legacy.tripCode).toContain('r1-');expect(a.contentFingerprint).not.toBe(legacy.contentFingerprint);expect(a.placements).toEqual(legacy.placements);let maximum=0;
 for(let d=350;d<a.length;d+=25){const p=t.sample(d),q=old.sample(d),degrees=-Math.atan(p.right.y)*180/Math.PI;expect(p.position).toEqual(q.position);expect(q.right.y).toBe(0);expect(Math.abs(degrees)).toBeLessThanOrEqual(12.001);if(Math.abs(degrees)>.01)expect(Math.sign(degrees)).toBe(Math.sign(p.curvature));expect(Math.abs(t.sample(d+.01).right.y-p.right.y)).toBeLessThan(.001);maximum=Math.max(maximum,Math.abs(degrees));}expect(maximum).toBeGreaterThan(8);expect(createPilotTrack(generateTrip(seed,2)).sample(2500)).toEqual(t.sample(2500));}
 for(const [weights,cap] of [[[1,0,0],8],[[0,1,0],12],[[0,0,1],4]] as const)expect(Math.abs(generatedBank(curvatureForDemand(2),weights))*180/Math.PI).toBeCloseTo(cap);
 expect(generatedBank(curvatureForDemand(.05),[0,1,0])).toBe(0);
});
