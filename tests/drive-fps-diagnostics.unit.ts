import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {driveRegionAt,summarizeDriveRegions,type DriveFpsSecond} from '../src/drive-fps-diagnostics';

it('separates coastline approach, first rice, flowers, exit, and later farm visits',()=>{
 expect(driveRegionAt(0)).toBe('approach');
 expect(driveRegionAt(199)).toBe('approach');
 expect(driveRegionAt(200)).toBe('main-rice');
 expect(driveRegionAt(899)).toBe('main-rice');
 expect(driveRegionAt(999)).toBe('other');
 expect(driveRegionAt(1200)).toBe('main-flowers');
 expect(driveRegionAt(1699)).toBe('main-flowers');
 expect(driveRegionAt(1700)).toBe('exit');
 expect(driveRegionAt(2050)).toBe('exit');
 expect(driveRegionAt(2500)).toBe('other');
 expect(driveRegionAt(4500)).toBe('other-rice');
 expect(driveRegionAt(4750)).toBe('other-flowers');
 expect(driveRegionAt(7500)).toBe('other-rice');
 expect(driveRegionAt(9500)).toBe('other-flowers');
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

it('keeps only the FPS JSON export control visible in opt-in diagnostics',()=>{
 const source=readFileSync(new URL('../src/drive-fps-diagnostics.ts',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const pauseStyles=readFileSync(new URL('../src/trip-pause-dock.css',import.meta.url),'utf8');
 expect(source).toContain("panel.id='drive-fps-diagnostic'");
 expect(source).toContain("button.textContent='匯出 FPS JSON'");
 expect(source).toContain('this.report()'); // Full diagnostics stay in the JSON file.
 expect(source).not.toContain('this.updatePanel(row)');
 expect(source).not.toContain('需人工決定是否發佈 · ');
 expect(styles).toContain('#drive-fps-diagnostic button');
 expect(pauseStyles).toContain('html[data-player-ui="true"] #trip-pause-dock{display:none!important}');
});
