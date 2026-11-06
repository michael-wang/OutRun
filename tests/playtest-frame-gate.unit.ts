import {it,expect} from 'vitest';
import {PlaytestFrameGate,FRAME_BUDGET} from '../src/playtest-frame-gate';

const second=(fps:number,distanceM:number,gap=16.7)=>({
 fps,seconds:distanceM/90,distanceM,worstFrameGapMs:gap,
 over50ms:gap>50?1:0,over100ms:gap>100?1:0,
});
it('marks a smooth physical-device trace release-ready without inventing FPS',()=>{
 const gate=new PlaytestFrameGate();
 for(let i=0;i<60;i++)gate.ingest(second(54+i%5,i*120));
 expect(gate.report.verdict).toBe('PASS');
 expect(gate.report.oneSecondBucketsBelow30).toBe(0);
 expect(gate.report.minimumFps).toBe(54);
});
it('requires owner review on any second below 30 FPS even if subsequent frames recover',()=>{
 const gate=new PlaytestFrameGate();
 gate.ingest(second(55,350));gate.ingest(second(24.8,2205,64));gate.ingest(second(59,2500));
 expect(gate.report.verdict).toBe('REVIEW_REQUIRED');
 expect(gate.report.oneSecondBucketsBelow30).toBe(1);
 expect(gate.report.incidents[0]).toMatchObject({kind:'below-30-fps',distanceM:2205});
 expect(gate.report.thresholds.blockBelowFps).toBe(FRAME_BUDGET.blockBelowFps);
});
it('warns on isolated long frames, escalates >100ms and bounds retained reports',()=>{
 const gate=new PlaytestFrameGate();
 gate.ingest(second(50,1250,54));
 expect(gate.report.verdict).toBe('WATCH');
 gate.ingest(second(50,1260,125));
 expect(gate.report.verdict).toBe('REVIEW_REQUIRED');
 for(let i=0;i<110;i++)gate.ingest(second(45,i*80,58));
 expect(gate.report.incidents).toHaveLength(64);
 expect(gate.report.framesOver100ms).toBe(1);
});
