import {describe,expect,it} from 'vitest';
import {Line3,Scene,Vector3} from 'three';
import {configureKentingCoast} from '../src/beach-macro';
import {coastBeachX} from '../src/coast-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET,coastBeachHeight} from '../src/scenery-cross-section';
import {WORKING_HARBOUR as h,harbourGround,harbourRockWeight,harbourShoreWidth} from '../src/working-harbour-profile';
import {addWorkingHarbourMacro} from '../src/working-harbour-macro';

configureKentingCoast();
const {track}=coastWorkerRoad();
const shore=(d:number)=>coastBeachX(COAST_SHORE_OFFSET,d);
describe('Working Harbour whitebox uses the existing high road',()=>{
 it('is zero outside the approach/exit and never modifies the banked shoulder',()=>{
  for(const d of [6020,h.rockStart,h.rockEnd,8250,8410]){
   expect(harbourRockWeight(d)).toBe(0);
   expect(harbourShoreWidth(d,31)).toBe(31);
  }
  for(let d=h.entry;d<=h.exit;d+=10){
   const r=track.sample(d);
   expect(r.position.y).toBeGreaterThan(25);
   expect(harbourGround(d,-11,shore(d),COAST_SEA_LEVEL,r.position.y,r.right.y,15)).toBe(15);
   expect(coastBeachHeight(shore(d),r.position.y,r.right.y,d)).toBeCloseTo(COAST_SEA_LEVEL,6);
   expect(coastBeachHeight(shore(d)-4,r.position.y,r.right.y,d)).toBeLessThan(-5.9);
   expect(coastBeachHeight(-15,r.position.y,r.right.y,d)).toBeGreaterThan(10);
  }
 });
 it('extends actual dry ground into two headland lobes around a waterline harbour',()=>{
  const nose=shore(h.entry+130),bay=shore(h.entry+303),exit=shore(h.entry+415);
  expect(nose).toBeLessThan(-110);
  expect(bay).toBeLessThan(-94);
  expect(exit).toBeLessThan(bay-8);
  expect(nose).toBeLessThan(bay-15);
  for(const s of [130,303,415]){
   const d=h.entry+s,r=track.sample(d);
   const ground=(x:number)=>coastBeachHeight(x,r.position.y,r.right.y,d);
   expect(ground(shore(d)+13)).toBeGreaterThan(COAST_SEA_LEVEL+1.8);
   expect(ground(shore(d)+13)).toBeLessThan(r.position.y-12);
   expect(ground(shore(d)-2)).toBeLessThan(COAST_SEA_LEVEL);
  }
  for(let d=h.rockStart;d<=h.rockEnd;d+=2)
   expect(Math.abs(shore(d+.01)-shore(d-.01))).toBeLessThan(.045);
 });
 it('joins the outer arm to the rock, opens downstream, and keeps separate wet berths',()=>{
  expect(h.rockEnd).toBeLessThan(8410);
  const coastalPoint=(s:number,out:number)=>{
   const d=h.entry+s,r=track.sample(d);
   return r.position.clone().addScaledVector(r.right,shore(d)-out).setY(0);
  };
  const wall=h.breakwater.map(([s,x])=>coastalPoint(s,x));
  const lines=wall.slice(1).map((b,i)=>new Line3(wall[i],b));
  expect(h.breakwater[0][1]).toBeLessThan(2);
  expect(h.breakwater.at(-1)![1]).toBeGreaterThan(30);
  for(const [s,out,length] of h.berths){
   for(const z of [s-length/2,s,s+length/2]){
    const d=h.entry+z,r=track.sample(d),x=shore(d)-out;
    const hull=coastalPoint(z,out);
    expect(coastBeachHeight(x,r.position.y,r.right.y,d)).toBeLessThan(COAST_SEA_LEVEL-3);
    const armDistance=Math.min(...lines.map(line=>line.closestPointToPoint(hull,true,new Vector3()).distanceTo(hull)));
    expect(armDistance).toBeGreaterThan(8);
   }
  }
 });
 it('holds the quay and sparse scrub on their respective ground levels and culls the kit',()=>{
  const harbour=addWorkingHarbourMacro(new Scene(),track.sample);
  expect(harbour.root.children).toHaveLength(5);
  expect(harbour.inspect.berths).toBe(3);
  expect(harbour.inspect.quayY).toBeCloseTo(COAST_SEA_LEVEL+1.75);
  expect(harbour.inspect.beacon[1]-COAST_SEA_LEVEL).toBeLessThan(6);
  const bases=harbour.inspect.scrubBases;
  expect(bases.length).toBeGreaterThan(12);
  expect(bases.length).toBeLessThanOrEqual(27);
  for(const [d,f,px,py,pz] of bases){
   const r=track.sample(d),edge=shore(d),x=edge+(-13-edge)*f;
   const projected=r.position.clone().addScaledVector(r.right,x);
   expect(Math.hypot(px-projected.x,pz-projected.z)).toBeLessThan(.005);
   expect(py).toBeCloseTo(coastBeachHeight(x,r.position.y,r.right.y,d),8);
   expect(py).toBeGreaterThan(COAST_SEA_LEVEL+1.4);
  }
  harbour.update(h.entry-1000,0);expect(harbour.root.visible).toBe(false);
  harbour.update(h.entry,0);expect(harbour.root.visible).toBe(true);
  harbour.update(8410,0);expect(harbour.root.visible).toBe(false);
 });
});
