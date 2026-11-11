import {describe,it,expect} from 'vitest';
import {mobileRivalPlatePlacement,MOBILE_RIVAL_PLATE_HEIGHT_PX} from '../src/rival-tag-layout';

const hud={left:315,right:600,bottom:52};
describe('phone opponent marker collision with race progress HUD',()=>{
 it('moves a centered distant plaque below the HUD by a small capped amount',()=>{
  const anchor=125;
  const placement=mobileRivalPlatePlacement(460,anchor,hud);
  expect(placement.visible).toBe(true);
  expect(placement.downPx).toBeGreaterThan(0);
  expect(placement.downPx).toBeLessThanOrEqual(22);
  const top=anchor-MOBILE_RIVAL_PLATE_HEIGHT_PX*(344-21)/344+placement.downPx;
  expect(top).toBeGreaterThanOrEqual(hud.bottom+6.99);
 });
 it('leaves side-lane and close-up plaques in their original positions',()=>{
  expect(mobileRivalPlatePlacement(100,105,hud)).toEqual({downPx:0,visible:true});
  expect(mobileRivalPlatePlacement(460,220,hud)).toEqual({downPx:0,visible:true});
  expect(mobileRivalPlatePlacement(460,105,null)).toEqual({downPx:0,visible:true});
 });
 it('hides faraway text instead of dragging a plaque into approaching traffic',()=>{
  expect(mobileRivalPlatePlacement(460,90,hud)).toEqual({downPx:0,visible:false});
 });
});
