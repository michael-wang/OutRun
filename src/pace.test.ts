import { it,expect } from 'vitest';
import { effectivePace,selectedPace,PACE_VARIANTS } from './pace';
import { createState,step,CORRIDOR_LIMIT } from './handling';
it('ramps smoothly from low speed to selected high pace and validates selectors',()=>{
 expect(selectedPace(null)).toBe(1.75);expect(selectedPace('99')).toBe(1.75);
 for(const pace of PACE_VARIANTS){expect(effectivePace(10,pace)).toBe(1);expect(effectivePace(65,pace)).toBe(pace);expect(effectivePace(80/3.6,pace)).toBeCloseTo(1+(pace-1)*.104);}
});
it('boosts actual longitudinal and lateral travel coherently without input yaw',()=>{
 for(const pace of PACE_VARIANTS){
  const s={...createState(),speed:65,heading:.1,velocityHeading:.1};step(s,{gas:true,brake:false,steer:0},1/120,0,pace);
  expect(Math.hypot(s.distance,s.lateral)).toBeCloseTo(s.speed*pace/120,8);expect(s.worldHeading).toBe(0);
 }
});
it('all pace variants preserve position and steering at 30/60fps substeps',()=>{
 for(const pace of PACE_VARIANTS){const runs=[30,60].map(fps=>{const s=createState();for(let f=0;f<fps*8;f++)for(let r=1/fps;r>1e-8;){const dt=Math.min(r,1/120);step(s,{gas:true,brake:f/fps>=6,steer:f/fps>=4?.25:0},dt,.002,pace);r-=dt;}return s;});expect(runs[0].distance).toBeCloseTo(runs[1].distance,6);expect(runs[0].lateral).toBeCloseTo(runs[1].lateral,6);expect(runs[0].worldHeading).toBeCloseTo(runs[1].worldHeading,6);}
});
it('every pace retains bounded outward contact, speed penalty and inward-only recovery',()=>{
 for(const pace of PACE_VARIANTS)for(const side of [-1,1]){
  const s={...createState(),speed:55};
  for(let i=0;i<1200&&!s.corridorSide;i++)step(s,{gas:true,brake:false,steer:side},1/120,0,pace);
  expect(s.corridorSide).toBe(side);const heading=s.worldHeading,speed=s.speed,start=s.distance;
  for(let i=0;i<1800;i++)step(s,{gas:true,brake:false,steer:side},1/120,0,pace);
  expect(s.lateral).toBe(side*CORRIDOR_LIMIT);expect(s.worldHeading).toBe(heading);expect(s.speed).toBeLessThan(speed);expect(s.distance-start).toBeGreaterThan(100);
  for(let i=0;i<120;i++)step(s,{gas:true,brake:false,steer:0},1/120,0,pace);
  expect(s.offRoad).toBe(true);expect(s.corridorSide).toBe(side);
  for(let i=0;i<720&&s.offRoad;i++)step(s,{gas:true,brake:false,steer:-side},1/120,0,pace);
  expect(s.offRoad).toBe(false);expect(s.corridorSide).toBe(0);
 }
});

