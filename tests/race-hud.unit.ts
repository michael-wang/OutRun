import {describe,it,expect} from 'vitest';
import {layoutRearRivalTags,formatRaceTime,REAR_RIVAL_RANGE_METERS,type RearRivalCandidate} from '../src/race-hud';

const rival=(id:string,distance:number,lateral:number,finishTime:number|null=null):RearRivalCandidate=>({
 id,name:id,distance,lateral,finishTime,
});

describe('racing HUD',()=>{
 it('shows only unfinished opponents within 200 route metres behind the player',()=>{
  const player={distance:1000,lateral:0};
  const rows=[
   rival('左後',800,-7),rival('右後',930,7),rival('太遠',799,-3),
   rival('前方',1010,-7),rival('已完賽',970,7,71),
  ];
  const marks=layoutRearRivalTags(player,rows,8.75);
  expect(REAR_RIVAL_RANGE_METERS).toBe(200);
  expect(marks.map(m=>m.id)).toEqual(['右後','左後']);
  expect(marks.find(m=>m.id==='左後')).toMatchObject({distanceMeters:200,row:0});
  expect(marks.find(m=>m.id==='右後')).toMatchObject({distanceMeters:70,row:0});
  expect(marks.find(m=>m.id==='左後')!.leftPercent).toBeLessThan(50);
  expect(marks.find(m=>m.id==='右後')!.leftPercent).toBeGreaterThan(50);
 });
 it('stacks nearby labels instead of overlapping, while retaining relative side',()=>{
  const marks=layoutRearRivalTags({distance:800,lateral:3.5},[
   rival('一',790,-7),rival('二',780,-7),rival('三',770,-3.5),
  ],8.75);
  expect(marks).toHaveLength(3);
  expect(marks[0].leftPercent).toBeLessThan(50);
  expect(marks[1].row).toBe(1);
  expect(marks[2].leftPercent).toBeGreaterThan(marks[1].leftPercent);
 });
 it('uses actual recorded crossing time, not an estimate',()=>{
  expect(formatRaceTime(null)).toBe('競賽中');
  expect(formatRaceTime(76.46)).toBe('1:16.4');
  expect(formatRaceTime(3.3)).toBe('0:03.3');
 });
});
