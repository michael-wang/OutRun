import {it,expect} from 'vitest';
import {SkidFeedback} from '../src/skid-feedback';
import {EngineSound} from '../src/sound';
it('rejects lane changes, persists before activation and releases shared feedback',()=>{
 const s=new SkidFeedback();for(let i=0;i<120;i++)expect(s.update(70,1,1/120,0,1)).toBe(0);
 for(let i=0;i<10;i++)expect(s.update(70,1,1/120,.9,.9)).toBe(0);
 for(let i=0;i<10;i++)s.update(70,1,1/120,.9,.9);expect(s.intensity).toBe(1);
 s.update(70,0,.02,0,0);expect(s.intensity).toBeGreaterThan(0);
 for(let i=0;i<30;i++)s.update(70,0,1/120,0,0);expect(s.intensity).toBe(0);
});
it('has equal shared visual intensity with muted or locked audio',()=>{
 const a=new EngineSound(),b=new EngineSound();b.setMuted(true);
 for(let i=0;i<60;i++){const state={rpm:6000,gear:4,shiftRemaining:0,requiredSteer:.9,appliedSteer:.9};a.update(65,.8,true,1/120,state);b.update(65,.8,true,1/120,state);}
 expect(a.skidFeedback.intensity).toBeGreaterThan(.5);expect(b.skidFeedback.intensity).toBe(a.skidFeedback.intensity);expect(a.inspect().skidLevel).toBeCloseTo(a.skidFeedback.intensity*.12);b.pause();expect(b.skidFeedback.intensity).toBe(0);
});
