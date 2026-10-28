import {it,expect} from 'vitest';
import {BRICKS,BRICK_START,createBrickTrack,brickCourse,brickElevation,brickWidth} from '../src/bricks';
import {readReviews,exportReviews,reviewId} from '../src/brick-reviews';
import {createState,step} from '../src/handling';
import {requiredSteering} from '../src/challenges';
import {mkdirSync,writeFileSync} from 'node:fs';
it('eight deterministic profiles preserve smooth entry/exit and distinct demand/grade/width',()=>{
 expect(BRICKS).toHaveLength(8);expect(new Set(BRICKS.map(b=>JSON.stringify(b.requiredSteerProfile))).size).toBe(8);
 for(const b of BRICKS){expect(b.nominalDuration).toBeGreaterThanOrEqual(15);expect(b.nominalDuration).toBeLessThanOrEqual(40);const a=createBrickTrack(b),other=createBrickTrack(b);
  for(let d=0;d<a.length;d+=7.31){expect(a.sample(d).position.toArray()).toEqual(other.sample(d).position.toArray());expect(Number.isFinite(a.sample(d).curvature)).toBe(true);}
  for(const c of brickCourse(b)){expect(Math.abs(a.sample(c.start-.001).curvature-a.sample(c.start+.001).curvature)).toBeLessThan(1e-6);}
  expect(brickElevation(b,BRICK_START).grade).toBe(0);expect(brickElevation(b,BRICK_START+b.length).grade).toBe(0);
 }
});
it('every brick has a passable four-detent path, no-steer departs, and technical corners require braking',()=>{
 const results=[];
 for(const b of BRICKS)for(const strategy of ['careful','none','full-gas']){
  const track=createBrickTrack(b),s=createState();s.distance=BRICK_START;s.speed=b.entrySpeed/3.6;let off=0,peak=0,min=999;const rows=[];
  while(s.distance<BRICK_START+b.length&&rows.length<6000){const k=track.sample(s.distance).curvature,need=requiredSteering(k,s.speed),upcoming=Math.max(...[0,50,100,200,300].map(d=>Math.abs(requiredSteering(track.sample(s.distance+d).curvature,230/3.6)))),limit=strategy==='careful'&&upcoming>1?180/3.6:65;
   const steer=strategy==='none'?0:Math.max(-1,Math.min(1,Math.round((need-s.lateral*.07)*4)/4));
   for(let j=0;j<6;j++)step(s,{gas:limit===65||s.speed<limit,brake:s.speed>limit+.5,steer},1/120,track.sample(s.distance).curvature,1.75,d=>brickWidth(b,d).halfWidth);
   if(s.offRoad)off++;peak=Math.max(peak,Math.abs(s.lateral));min=Math.min(min,s.speed*3.6);rows.push({d:s.distance,x:s.lateral,v:s.speed*3.6,u:s.appliedSteer,need:s.requiredSteer,y:track.sample(s.distance).position.y});
  }
  results.push({id:b.id,strategy,off,peak,min,seconds:rows.length*.05,rows});
  if(strategy==='careful')expect(off,`${b.id} careful`).toBe(0);
  if(strategy==='none')expect(off,`${b.id} hands off`).toBeGreaterThan(0);
  if(strategy==='full-gas'&&['BRK-04','BRK-08'].includes(b.id))expect(off,b.id).toBeGreaterThan(0);
  if(strategy==='full-gas'&&b.id==='BRK-01'){expect(off).toBe(0);expect(min).toBeGreaterThan(225);}
 }
 mkdirSync('docs/evidence/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c',{recursive:true});writeFileSync('docs/evidence/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/brick-simulation.json',JSON.stringify(results,null,2));
});
it('human review is unreviewed by default, revision scoped, validated, and independent of QA',()=>{
 expect(exportReviews({}).records.every(r=>r.humanVote==='UNREVIEWED')).toBe(true);
 const b=BRICKS[0],r=readReviews(JSON.stringify({[reviewId(b)]:{humanVote:'KEEP',note:'x'.repeat(500)},'BRK-02:r0':{humanVote:'KEEP',note:'stale'},'BRK-03:r2':{humanVote:'AUTO_VERIFIED',note:'invalid'}}));
 expect(r[reviewId(b)].note.length).toBe(240);expect(exportReviews(r).records[1].humanVote).toBe('UNREVIEWED');expect(exportReviews(r).records[2].humanVote).toBe('UNREVIEWED');expect(readReviews('{broken')).toEqual({});expect(exportReviews(r).records[0].autoQA).toBe(b.autoValidation);
});
