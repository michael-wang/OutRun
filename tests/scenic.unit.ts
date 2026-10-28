import {it,expect} from 'vitest';
import {ACTS,actWeights} from '../src/acts';
import {createTrack,elevation} from '../src/track';
import {COURSE,TRACK_LENGTH,REFERENCE_TRAVEL,PRESSURE_GAIN,requiredSteering} from '../src/challenges';
it('three distance-based acts span a closed 120-second route with continuous overlaps',()=>{
 expect(TRACK_LENGTH/REFERENCE_TRAVEL).toBeCloseTo(120,8);expect(PRESSURE_GAIN).toBeCloseTo(.6094527155598083,10);
 const track=createTrack();expect(track.closureError).toBeLessThan(.02);expect(Math.abs(track.headingError)).toBeLessThan(.00001);
 for(const act of ACTS){expect((act.end-act.start)/REFERENCE_TRAVEL).toBeCloseTo(40,8);for(const d of [act.start,act.start+300,act.end-300,act.end]){const a=actWeights(d-.01),b=actWeights(d+.01);expect(a.reduce((a,b)=>a+b,0)).toBeCloseTo(1,9);for(let i=0;i<3;i++)expect(Math.abs(a[i]-b[i])).toBeLessThan(.001);}}
 for(const c of COURSE){const d=c.start+c.length/2;expect(requiredSteering(track.sample(d).curvature,230/3.6)).toBeCloseTo(c.targetRequiredSteering,7);}
});
it('road has two real crests plus a long city descent with smooth height and grade at all seams',()=>{
 expect(elevation(TRACK_LENGTH*.18).height).toBe(46);expect(elevation(TRACK_LENGTH*.49).height).toBe(110);expect(elevation(TRACK_LENGTH*2/3).height).toBeCloseTo(65,7);expect(elevation(TRACK_LENGTH*.95).height).toBeLessThan(15);
 for(const f of [0,.18,1/3,.49,2/3,.82,1]){expect(Math.abs(elevation(TRACK_LENGTH*f-.01).height-elevation(TRACK_LENGTH*f+.01).height)).toBeLessThan(.001);expect(Math.abs(elevation(TRACK_LENGTH*f-.01).grade-elevation(TRACK_LENGTH*f+.01).grade)).toBeLessThan(.001);}
});
