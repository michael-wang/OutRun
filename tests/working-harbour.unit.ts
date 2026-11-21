import {describe,expect,it} from 'vitest';
import {Line3,Scene,Vector3} from 'three';
import {configureKentingCoast} from '../src/beach-macro';
import {coastBeachX} from '../src/coast-layout';
import {COAST_BOATS,coastBoatAdmitted,coastBoatPosition} from '../src/coast-boats';
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
 it('leaves the 8410 cliff gate and independent Sail Bay ships outside the mouth',()=>{
  expect(h.rockEnd).toBeLessThan(8410);
  const coastalPoint=(s:number,out:number)=>{
   const d=h.entry+s,r=track.sample(d);
   return r.position.clone().addScaledVector(r.right,shore(d)-out).setY(0);
  };
  const wall=h.breakwater.map(([s,x])=>coastalPoint(s,x));
  const lines=wall.slice(1).map((b,i)=>new Line3(wall[i],b));
  const directSpur=new Line3(coastalPoint(h.outerWorkS,h.outerWorkOut),coastalPoint(h.outerWorkS,92));
  const spurApron=new Line3(coastalPoint(h.outerWorkS-9,h.outerWorkOut),coastalPoint(h.outerWorkS+7,h.outerWorkOut));
  lines.push(directSpur,spurApron);
  for(const [s,x,l] of h.berths)lines.push(new Line3(coastalPoint(s-l*.5,x),coastalPoint(s+l*.5,x)));
  const ships=COAST_BOATS.filter(b=>b.id.startsWith('bay-sail-'));
  expect(ships).toHaveLength(5);
  for(const ship of ships){
   expect(coastBoatAdmitted(ship)).toBe(true);
   for(let i=0;i<=240;i++){
    const p=coastBoatPosition(ship,2*Math.PI*ship.travel/ship.speed*i/240,track.sample);
    expect(p.position.y).toBe(COAST_SEA_LEVEL);
    // Give the independent craft half its full length in every direction,
    // plus prop/wall radius and another 3 m for bounded wave displacement.
    p.position.y=0;
    const closest=Math.min(...lines.map(line=>line.closestPointToPoint(p.position,true,new Vector3()).distanceTo(p.position)));
    expect(closest).toBeGreaterThan(ship.length/2+9);
   }
  }
  expect(COAST_BOATS.filter(b=>b.id.startsWith('quay-')).filter(coastBoatAdmitted)).toHaveLength(0);
 });
 it('holds the quay at water level and hides the small four-batch kit out of range',()=>{
  const harbour=addWorkingHarbourMacro(new Scene(),track.sample);
  expect(harbour.root.children).toHaveLength(4);
  expect(harbour.inspect.berths).toBe(3);
  expect(harbour.inspect.quayY).toBeCloseTo(COAST_SEA_LEVEL+1.75);
  expect(harbour.inspect.beacon[1]-COAST_SEA_LEVEL).toBeLessThan(6);
  harbour.update(h.entry-1000,0);expect(harbour.root.visible).toBe(false);
  harbour.update(h.entry,0);expect(harbour.root.visible).toBe(true);
  harbour.update(8410,0);expect(harbour.root.visible).toBe(false);
 });
});
