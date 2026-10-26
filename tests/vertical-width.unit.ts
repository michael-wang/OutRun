import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {it,expect} from 'vitest';
import {BRICKS,BRICK_START,brickWidth,brickElevation,createBrickTrack} from '../src/bricks';
import {roadOffset,LANE_WIDTH} from '../src/road-profile';
import {createState,step,updateFootprint} from '../src/handling';
import {readReviews,exportReviews} from '../src/brick-reviews';
import archive from '../docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json';
it('genuine lane anchors, continuous tapers and substantially stronger elevation',()=>{
 const lanes=new Set<number>();
 for(const b of BRICKS){for(const [t,n] of b.lanes){lanes.add(n);const d=BRICK_START+t*b.length/b.nominalDuration;expect(brickWidth(b,d).halfWidth).toBeCloseTo(n*LANE_WIDTH/2,7);}
  for(let d=BRICK_START;d<BRICK_START+b.length;d+=2){const a=brickWidth(b,d).halfWidth,z=brickWidth(b,d+.01).halfWidth;expect(Math.abs(z-a)).toBeLessThan(.001);expect(roadOffset(7,a)).toBeCloseTo(a,10);expect(roadOffset(12.4,a)-a).toBeCloseTo(5.4,8);}
  for(const [t] of b.elevation){const d=BRICK_START+t*b.length/b.nominalDuration;expect(Math.abs(brickElevation(b,d-.001).height-brickElevation(b,d+.001).height)).toBeLessThan(.001);expect(Math.abs(brickElevation(b,d-.001).grade-brickElevation(b,d+.001).grade)).toBeLessThan(.0001);}
 }
 expect([...lanes].sort()).toEqual([2,4,6,8]);
 expect(Math.max(...BRICKS[2].elevation.map(k=>k[1]))-Math.min(...BRICKS[2].elevation.map(k=>k[1]))).toBe(160);
 expect(BRICKS[4].elevation[0][1]-BRICKS[4].elevation.at(-1)![1]).toBe(198);
});
it('same x differs only by genuine asphalt width; width does not change steering or add centering',()=>{
 for(const side of [-1,1]){const narrow={...createState(),lateral:side*5,speed:60},wide={...narrow};updateFootprint(narrow,3.5);updateFootprint(wide,14);expect(narrow.offRoad).toBe(true);expect(wide.offRoad).toBe(false);step(narrow,{gas:true,brake:false,steer:0},.05,0,1.75,3.5);step(wide,{gas:true,brake:false,steer:0},.05,0,1.75,14);expect(narrow.speed).toBeLessThan(wide.speed);expect(narrow.lateral).toBe(side*5);expect(wide.lateral).toBe(side*5);}
 const a=createState(),b=createState();a.speed=b.speed=60;
 for(let i=0;i<50;i++){step(a,{gas:true,brake:false,steer:.5},1/120,.001,1.75,3.5);step(b,{gas:true,brake:false,steer:.5},1/120,.001,1.75,14);expect(a.lateral).toBe(b.lateral);expect(a.heading).toBe(b.heading);}
});
it('R1 archive and stored history survive R2 edits without manufacturing new approvals',()=>{
 expect(archive.records.filter(r=>r.humanVote==='KEEP')).toHaveLength(6);expect(archive.records.filter(r=>r.humanVote==='REWORK').map(r=>r.id)).toEqual(['BRK-03','BRK-05']);
 const old=Object.fromEntries(archive.records.map(r=>[`${r.id}:r${r.revision}`,{humanVote:r.humanVote,note:r.note}]));
 const read=readReviews(JSON.stringify(old));expect(read).toEqual(old);expect(exportReviews(read).records.every(r=>r.revision===2&&r.humanVote==='UNREVIEWED')).toBe(true);
 read['BRK-03:r2']={humanVote:'REWORK',note:'test only'};expect(readReviews(JSON.stringify(read))['BRK-03:r1']).toEqual(old['BRK-03:r1']);
});
it('changing width keeps the corridor bounded without dragging a car into newly opened space',()=>{
 for(const side of [-1,1]){
  const s=createState();s.speed=40;s.lateral=side*30;
  step(s,{gas:true,brake:false,steer:side},.05,0,1.75,3.5);
  const narrowEdge=s.lateral;expect(s.corridorSide).toBe(side);expect(Math.abs(narrowEdge)).toBeLessThan(7);
  step(s,{gas:true,brake:false,steer:0},.05,0,1.75,14);
  expect(s.corridorSide).toBe(0);expect(Math.abs(s.lateral-narrowEdge)).toBeLessThan(1);
  const b=BRICKS[5],start=BRICK_START+2*b.length/b.nominalDuration;s.distance=start;s.lateral=side*9;
  for(let i=0;i<600;i++){step(s,{gas:true,brake:false,steer:side},1/60,0,1.75,d=>brickWidth(b,d).halfWidth);expect(Math.abs(s.lateral)).toBeLessThanOrEqual(brickWidth(b,s.distance).halfWidth+3);}
 }
});
it('accepted R1 steering patterns, lengths and seeds remain unchanged',()=>{
 const prior=JSON.parse(readFileSync('docs/evidence/v0.7a/capture-index.json','utf8'));
 for(const b of BRICKS){const old=prior.runs.find((r:any)=>r.brick.id===b.id).brick;expect(b.requiredSteerProfile).toEqual(old.requiredSteerProfile);expect(b.seed).toBe(old.seed);expect(b.length).toBe(old.length);expect(b.revision).toBe(2);}
});

it('records authoritative old/new elevation and lane profiles for visual comparison',()=>{
 const prior=JSON.parse(readFileSync('docs/evidence/v0.7a/capture-index.json','utf8')),profiles=[];
 for(const b of BRICKS){const old=prior.runs.find((r:any)=>r.brick.id===b.id).brick,track=createBrickTrack(b),rows=[];
  for(let t=0;t<=b.nominalDuration+.001;t+=.05){const d=350+t*b.length/b.nominalDuration,p=track.sample(d),r=brickElevation(b,d),previous=brickElevation({...b,elevation:old.elevation},d);expect(p.position.y).toBe(r.height);rows.push({t,d,height:r.height,grade:r.grade,oldHeight:previous.height,oldGrade:previous.grade,...brickWidth(b,d)});}
  profiles.push({id:b.id,revision:b.revision,seed:b.seed,lanes:b.lanes,rows});
 }
 mkdirSync('docs/evidence/v0.7c',{recursive:true});writeFileSync('docs/evidence/v0.7c/profile-comparison.json',JSON.stringify(profiles,null,2));
});
