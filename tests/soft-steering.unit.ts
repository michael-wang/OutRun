import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {actuateSteering} from '../src/steering';
import {createState,step,updateFootprint} from '../src/handling';
import {COURSE,curvatureForDemand,REFERENCE_SPEED,REFERENCE_TRAVEL} from '../src/challenges';
import {createTrack} from '../src/track';
const root='docs/evidence/v0.7a';mkdirSync(root,{recursive:true});
it('finite soft detents settle in 100ms, release in 60ms, and integrate identically at 30/60/120Hz',()=>{
 const runs=[];
 for(const hz of [30,60,120]){
  const s=createState(),rows=[];let x=0;
  for(let i=0;i<hz;i++){const t=i/hz,target=t<.4?.75:0,mean=actuateSteering(s,target,1/hz);x+=mean/hz;rows.push({time:(i+1)/hz,target,applied:s.appliedSteer,x});}
  expect(rows.find(r=>r.time>=.1)!.applied).toBe(.75);expect(rows.find(r=>r.time>=.47)!.applied).toBe(0);
  expect(rows[0].applied).toBeGreaterThan(0);expect(rows[0].applied).toBeLessThan(.75);expect(x).toBeCloseTo(.285,8);runs.push({hz,rows});
 }
 writeFileSync(`${root}/actuator-response.json`,JSON.stringify(runs,null,2));
});
it('mirrored release has bounded residual correction and freezes a nonzero offset without centering',()=>{
 for(const sign of [-1,1]){const s={...createState(),speed:REFERENCE_SPEED,lateral:sign*2};for(let i=0;i<20;i++)step(s,{gas:true,brake:false,steer:sign},1/120,0,1.75);
  const before=s.lateral;for(let i=0;i<12;i++)step(s,{gas:true,brake:false,steer:0},1/120,0,1.75);
  expect(Math.abs(s.lateral-before)).toBeLessThan(.37);const settled=s.lateral;for(let i=0;i<120;i++)step(s,{gas:true,brake:false,steer:0},1/120,0,1.75);expect(s.lateral).toBe(settled);expect(s.appliedSteer).toBe(0);
 }
});
it('a 20ms tap releases promptly and pose reversal is continuous without physical inertia',()=>{
 const tap=createState();actuateSteering(tap,1,.02);expect(tap.appliedSteer).toBeCloseTo(.104,8);actuateSteering(tap,0,.06);expect(tap.appliedSteer).toBe(0);
 const s={...createState(),speed:REFERENCE_SPEED};for(let i=0;i<120;i++)step(s,{gas:true,brake:false,steer:.75},1/120,curvatureForDemand(.75),1.75);
 const before=s.heading;step(s,{gas:true,brake:false,steer:-.75},1/120,curvatureForDemand(-.75),1.75);expect(Math.abs(s.heading-before)).toBeLessThan(.1);
 for(let i=0;i<60;i++)step(s,{gas:true,brake:false,steer:-.75},1/120,curvatureForDemand(-.75),1.75);expect(s.heading).toBeLessThan(-.5);
 for(let i=0;i<40;i++)step(s,{gas:true,brake:false,steer:0},1/120,0,1.75);expect(Math.abs(s.heading)).toBeLessThan(.005);expect(s.appliedSteer).toBe(0);expect(s.lateralRate).toBe(0);
});
it('quiet mild pose and dramatic loaded pose do not affect path, speed or collision',()=>{
 const poses=[];
 for(const u of [.25,.5,.75,1]){const a={...createState(),speed:REFERENCE_SPEED},b={...a},k=curvatureForDemand(u===1?1.2:u);
  for(let i=0;i<120;i++){b.heading=-2;updateFootprint(b);for(const s of [a,b])step(s,{gas:true,brake:false,steer:u},1/120,k,1.75);}
  expect(a.distance).toBe(b.distance);expect(a.lateral).toBe(b.lateral);expect(a.speed).toBe(b.speed);expect(a.offRoad).toBe(b.offRoad);
  const degrees=a.heading*180/Math.PI;if(u===.25){expect(degrees).toBeGreaterThan(3);expect(degrees).toBeLessThan(8);expect(a.slip).toBe(0);}if(u>=.75){expect(degrees).toBeGreaterThan(25);expect(degrees).toBeLessThan(60);if(u===1)expect(degrees).toBeGreaterThan(50);expect(a.slip).toBeGreaterThan(.45);}poses.push({u,degrees,slip:a.slip});
 }
 writeFileSync(`${root}/body-pose.json`,JSON.stringify(poses,null,2));
});
it('inverse geometry is stronger, severity monotonic and distance joins have continuous heading and curvature',()=>{
 const track=createTrack(),rows=[];
 for(const id of ['low','medium','high','extreme']){const c=COURSE.find(c=>c.id===id)!,k=curvatureForDemand(c.targetRequiredSteering);rows.push({id,k,radius:1/Math.abs(k),coreTwoSecondHeading:Math.abs(k)*REFERENCE_TRAVEL*2*180/Math.PI,segmentHeading:k*(c.length-c.transitionLength)*180/Math.PI});}
 for(let i=1;i<rows.length;i++)expect(rows[i].coreTwoSecondHeading).toBeGreaterThan(rows[i-1].coreTwoSecondHeading);
 expect(rows[3].coreTwoSecondHeading).toBeGreaterThan(70);
 for(const c of COURSE)for(const d of [c.start,c.start+c.transitionLength,c.end-c.transitionLength,c.end]){const a=track.sample(d-.001),b=track.sample(d+.001);expect(Math.abs(a.curvature-b.curvature)).toBeLessThan(1e-6);expect(Math.abs(Math.atan2(Math.sin(a.roadHeading-b.roadHeading),Math.cos(a.roadHeading-b.roadHeading)))).toBeLessThan(.00002);}
 writeFileSync(`${root}/curve-calibration.json`,JSON.stringify(rows,null,2));
});
