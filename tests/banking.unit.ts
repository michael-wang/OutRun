import {it,expect} from 'vitest';
import {bankAngle,bankPrototype,BANK_SECTION} from '../src/banking';
import {PILOTS,createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
const b=PILOTS[1];
it('opts in only L2P-B, smooth flat-entry-hold-exit with inward signs',()=>{
 expect(bankPrototype('pilots','L2P-B','10')).toBe(10);expect(bankPrototype(null,'ROAD-TRIP-10M','10')).toBe(0);expect(bankPrototype('pilots','L2P-A','10')).toBe(0);
 for(const strength of [0,4,10] as const){expect(bankAngle(1000,strength)*180/Math.PI).toBeCloseTo(strength);expect(bankAngle(1000,strength,-1)).toBe(-bankAngle(1000,strength));for(const d of [0,699,1350,2000])expect(bankAngle(d,strength)).toBe(0);for(const d of Object.values(BANK_SECTION))expect(Math.abs(bankAngle(d+.01,strength)-bankAngle(d-.01,strength))).toBeLessThan(1e-8);}
});
it('retains centerline, horizontal width, curvature, elevation and seed data',()=>{
 const flat=createPilotTrack(b,0),bank=createPilotTrack(b,10);for(let d=0;d<flat.length;d+=13){const a=flat.sample(d),c=bank.sample(d);expect(c.position).toEqual(a.position);expect(c.tangent).toEqual(a.tangent);expect(c.curvature).toBe(a.curvature);expect(c.roadHeading).toBe(a.roadHeading);expect(c.right.x).toBe(a.right.x);expect(c.right.z).toBe(a.right.z);if(d<700||d>=1350)expect(c).toEqual(a);else expect(c.right.y).toBeLessThanOrEqual(0);}
 expect(createPilotTrack(PILOTS[0],10).sample(1000)).toEqual(createPilotTrack(PILOTS[0],0).sample(1000));
});
it('banks actual triangles and paint with seamless chunk endpoints',()=>{
 const track=createPilotTrack(b,10),half=(d:number)=>pilotSample(b,d).halfWidth,weights=(d:number)=>pilotWeights(b,d),a=prepareRoadChunk(track.sample,half,weights,0,1000,track.length),z=prepareRoadChunk(track.sample,half,weights,1000,2000,track.length);
 for(const kind of ['asphalt','support'] as const){const x=a.find(m=>m.kind===kind)!,y=z.find(m=>m.kind===kind)!;const count=kind==='support'?12:6;expect(Array.from(x.positions.slice(-count))).toEqual(Array.from(y.positions.slice(0,count)));}
 const sandA=a.find(m=>m.kind==='sand')!,sandZ=z.find(m=>m.kind==='sand')!;
 for(let i=0;i<sandA.rayRanges!.length;i++){const r=sandA.rayRanges![i],t=sandZ.rayRanges![i];for(let side=0;side<2;side++){const x=sandA.indices[r.offset+r.count-1-side]*3,y=sandZ.indices[t.offset+side]*3;expect(Array.from(sandA.positions.slice(x,x+3))).toEqual(Array.from(sandZ.positions.slice(y,y+3)));}}
 const asphalt=z.find(m=>m.kind==='asphalt')!.positions;expect(asphalt[1]-asphalt[4]).toBeCloseTo(2*half(1000)*Math.tan(Math.PI/18),4);
 for(const mesh of z.filter(m=>['line','asphalt'].includes(m.kind)))expect(Array.from(mesh.positions).every(Number.isFinite)).toBe(true);
});
