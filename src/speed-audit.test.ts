import { expect,it } from 'vitest';
import { SpeedAudit } from './speed-audit';
import { createState,step } from './handling';
it('measures world displacement, camera travel and stationary marker crossings',()=>{
 const audit=new SpeedAudit();
 for(let i=0;i<=120;i++)audit.record({wall:i*1000/60,simulated:i/60,progress:65*i/60,speed:65,position:[0,0,65*i/60],camera:[0,2.6,65*i/60-8]});
 expect(audit.rows).toHaveLength(2);
 expect(audit.rows[0].worldMetersPerSecond).toBeCloseTo(65);
 expect(audit.rows[0].roadWidthsPerSecond).toBeCloseTo(65/14);
 expect(audit.rows[0].cameraMetersPerSecond).toBeCloseTo(65);
 expect(audit.rows.reduce((sum,r)=>sum+(r.markerPasses as number),0)).toBe(10);
 expect((audit.rows[0].markerPassWallMs as number[])[1]-(audit.rows[0].markerPassWallMs as number[])[0]).toBeCloseTo(12000/65);
 audit.reset();expect(audit.rows).toEqual([]);
});
it('30 and 60fps elapsed-time substeps preserve real driving speed',()=>{
 const results=[30,60].map(fps=>{
  const s=createState();
  for(let frame=0;frame<fps*10;frame++)for(let remaining=1/fps;remaining>1e-8;){const dt=Math.min(remaining,1/120);step(s,{gas:true,brake:false,steer:0},dt,0);remaining-=dt;}
  return s;
 });
 expect(results[0].distance).toBeCloseTo(results[1].distance,8);
 expect(results[0].speed).toBeCloseTo(results[1].speed,8);expect(results[0].speed).toBeGreaterThan(45);
});
it('counts the real landmark at the loop seam even when length is not a multiple of spacing',()=>{
 const audit=new SpeedAudit();
 audit.record({wall:0,simulated:0,progress:26,speed:8,position:[0,0,26],camera:[0,0,18],trackLength:30});
 audit.record({wall:1000,simulated:1,progress:34,speed:8,position:[0,0,34],camera:[0,0,26],trackLength:30});
 expect(audit.rows[0].markerPassWallMs).toEqual([500]);
});
