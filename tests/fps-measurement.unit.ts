import {expect,it} from 'vitest';
import {emptyCpu,FpsMeasurement} from '../src/fps-measurement';

it('measures only complete playing-frame intervals after warmup, including long stalls',()=>{
 let snapshots=0;
 const run=new FpsMeasurement(()=>({id:++snapshots}));
 const cpu=emptyCpu();
 const frame=(now:number,calls=8)=>run.frame(now,5200,0,cpu,calls,calls*3);
 cpu.callback=900;cpu.effects=800;
 frame(10,900);frame(80,900);frame(10020,900);
 cpu.callback=7;cpu.effects=2;
 let now=10020;
 const gaps=[...Array<number>(180).fill(50),...Array<number>(80).fill(100),1500,1500];
 for(const gap of gaps.slice(0,-1)){now+=gap;expect(frame(now)).toBeUndefined();}
 const result=frame(now+1500)!;
 expect(result.durationMs).toBe(20000);
 expect(result.warmupMs).toBe(10010);
 expect(Date.parse(result.endedAt)-Date.parse(result.startedAt)).toBe(20000);
 expect(result.frames).toBe(262);
 expect(result.seconds.reduce((n,b)=>n+b.frames,0)).toBe(262);
 expect(result.start.id).toBe(1);expect(result.end.id).toBe(2);
 expect(result.fps).toEqual({mean:13.1,median:20,p05:10,p01:10});
 expect(result.frameGapMs).toEqual({p95:100,p99:100,max:1500,over33_3:262,over50:82,over100:2});
 expect(result.cpuMeanMs.callbackTotal).toBe(7);expect(result.cpuMeanMs.phases.effects).toBe(2);
 expect(result.meanDrawCalls).toBe(8);expect(result.meanTriangles).toBe(24);
});
