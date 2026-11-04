import {it,expect,vi} from 'vitest';
import {
 acquireSharedFlowerMask,releaseSharedFlowerMask,sharedFlowerMaskStats
} from '../src/vendor/three-stylized/flowerShapes';

it('reuses one flower atlas and only releases it after the final plot',()=>{
 const first=acquireSharedFlowerMask();
 try{
  const second=acquireSharedFlowerMask();
  const dispose=vi.spyOn(first,'dispose');
  expect(first).toBe(second);
  expect(sharedFlowerMaskStats()).toEqual({owners:2,residentAtlases:1});
  releaseSharedFlowerMask(first);
  expect(dispose).not.toHaveBeenCalled();
  expect(sharedFlowerMaskStats()).toEqual({owners:1,residentAtlases:1});
  releaseSharedFlowerMask(second);
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(sharedFlowerMaskStats()).toEqual({owners:0,residentAtlases:0});
  const reloaded=acquireSharedFlowerMask();
  expect(reloaded).not.toBe(first);
  releaseSharedFlowerMask(reloaded);
 }finally{
  // Test must not leak an atlas into subsequent tests if an assertion fails.
  while(sharedFlowerMaskStats().owners>0)releaseSharedFlowerMask(first);
  vi.restoreAllMocks();
 }
});
