import {it,expect} from 'vitest';
import {driveRegionAt,summarizeDriveRegions,type DriveFpsSecond} from '../src/drive-fps-diagnostics';

it('separates coastline approach, first rice, flowers, exit, and later farm visits',()=>{
 expect(driveRegionAt(1750)).toBe('other');
 expect(driveRegionAt(1800)).toBe('approach');
 expect(driveRegionAt(2399)).toBe('approach');
 expect(driveRegionAt(2400)).toBe('main-rice');
 expect(driveRegionAt(2999)).toBe('main-rice');
 expect(driveRegionAt(3099)).toBe('other');
 expect(driveRegionAt(3100)).toBe('main-flowers');
 expect(driveRegionAt(3600)).toBe('exit');
 expect(driveRegionAt(4500)).toBe('other-rice');
 expect(driveRegionAt(4700)).toBe('other-flowers');
});
it('reports region-specific frame drops without mixing in non-farm sections',()=>{
 const cpu={callback:8,physics:1,world:2,ocean:1,boatShadow:0.2,mainScene:3,otherRender:0.8};
 const row=(region:DriveFpsSecond['region'],fps:number,long:number):DriveFpsSecond=>({
  seconds:1,distanceM:2500,region,fps,frames:50,meanFrameGapMs:20,p95FrameGapMs:24,
  worstFrameGapMs:40,over33ms:2,over50ms:long,over100ms:0,
  cpuMeanMs:cpu,drawCalls:210,triangles:90000,geometryCount:100,textureCount:12,extras:{},
 });
 const summary=summarizeDriveRegions([row('approach',58,0),row('main-rice',27,3),row('main-rice',29,1),row('exit',60,0)]);
 expect(summary['main-rice'].meanFps).toBe(28);
 expect(summary['main-rice'].seconds).toBe(2);
 expect(summary['main-rice'].longFramesOver50ms).toBe(4);
 expect(summary.approach.meanFps).toBe(58);
 expect(summary['other-flowers'].seconds).toBe(0);
});
