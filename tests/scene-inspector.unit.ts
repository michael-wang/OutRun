import {expect,it} from 'vitest';
import {canStepBack,clockAuditPass,INSPECTOR_CATEGORIES} from '../src/scene-inspector';

it('never steps backward into a retired or unprepared road chunk',()=>{
 let queried:number[]=[];
 const present=(d:number)=>{queried.push(d);return d>=900&&d<1100;};
 expect(canStepBack(950,present,69000)).toBe(true);
 expect(canStepBack(899,present,69000)).toBe(false);
 expect(canStepBack(-100,present,69000)).toBe(false);
 expect(canStepBack(69000,present,69000)).toBe(false);
 expect(canStepBack(NaN,present,69000)).toBe(false);
 expect(queried).toEqual([950,899]);
});
it('requires an actual visible clock face and all three physically rendered companions',()=>{
 expect(clockAuditPass({faces:1,companions:3,expected:3})).toBe(true);
 expect(clockAuditPass({faces:1,companions:2,expected:3})).toBe(false);
 expect(clockAuditPass({faces:0,companions:3,expected:3})).toBe(false);
 expect(clockAuditPass({faces:2,companions:3,expected:3})).toBe(false);
});
it('offers only environment and scenery QA categories, not the already-approved red hazard test',()=>{
 expect(INSPECTOR_CATEGORIES.map(x=>x.kind)).toEqual([
  'clock','lighthouse','canyon-arch','city-grade','bridge','breakdown','junction','road-feature','scenic-beat',
 ]);
});
