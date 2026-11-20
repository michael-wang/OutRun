import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessConnector} from './check-connector.mjs';

const draft=JSON.parse(readFileSync(new URL('../../docs/route/kenting-ports.json',import.meta.url),'utf8'));
const screen = input => assessConnector(input,draft.calibration);
const flat = z => ({world:{x:0,y:0,z,headingDeg:0,curvaturePerM:0,grade:0,bankDeg:0,widthM:17.5},lanes:5,seaWorldY:-5});
const example = () => ({from:flat(0),to:flat(200),availableM:200,speedKmh:200});
const fixtureReviews = Object.fromEntries(['alignment','collision','terrain','outlook','drive'].map(key=>
  [key,{state:'verified',source:'Synthetic straight-level fixture only'}]));

test('a fully evidenced straight reference can pass; absent evidence stays visible',()=>{
  assert.equal(screen({...example(),reviews:fixtureReviews}).status,'PASS');
  const unknown=screen(example());
  assert.equal(unknown.status,'WARNING');
  assert.equal(unknown.diagnostics.filter(d=>d.reason.includes('UNKNOWN')).length,5);
});
test('a short budget or wrong tangent at full chord cannot be overridden',()=>{
  assert.equal(screen({...example(),availableM:180,reviews:fixtureReviews}).status,'INCOMPATIBLE');
  const ex=example();ex.to.world.headingDeg=12;
  assert.equal(screen(ex).status,'INCOMPATIBLE');
});
test('single sea and measured hard collisions stay hard',()=>{
  const ex=example();ex.to.seaWorldY=-2;
  assert.equal(screen(ex).status,'INCOMPATIBLE');
  assert.equal(screen({...example(),reviews:{...fixtureReviews,collision:{state:'failed',source:'Road/open seam'}}}).status,'INCOMPATIBLE');
});
test('steering budget, crest, taper and crossfall identify different repairs',()=>{
  const ex=example();ex.speedKmh=250;ex.to.world={...ex.to.world,z:100,y:20,headingDeg:75,grade:.1,bankDeg:16,widthM:14};
  ex.to.lanes=4;
  const r=screen({...ex,reviews:fixtureReviews,clearApproachM:40});
  assert.equal(r.status,'WARNING');
  assert.ok(r.metrics.neutralSteerDemand>1);
  for(const text of ['Lane','absGrade','absBankDeg','deltaGradePerM','braking'])assert.ok(r.diagnostics.some(d=>d.reason.includes(text)),text);
});
test('world sun stays fixed when heading changes; wraparound uses the smaller turn',()=>{
  const ex=example();ex.to.world.z=-100;ex.to.world.headingDeg=-179;ex.from.world.headingDeg=179;
  ex.to.sunBearingWindowDeg={worldSun:draft.placement.fixedWorldSun,min:-44,max:-25};
  const r=screen({...ex,reviews:fixtureReviews});
  assert.ok(Math.abs(r.metrics.headingChangeDeg-2)<1e-6);
  assert.ok(r.diagnostics.some(d=>d.area==='art'));
});
test('measured core chord fits only with enough physical length; untested relocation stays pending',()=>{
  const input={from:draft.entry,to:draft.exit,availableM:1400,speedKmh:200};
  assert.equal(screen(input).status,'WARNING');
  assert.equal(screen({...input,availableM:1300}).status,'INCOMPATIBLE');
  assert.equal(screen({...input,availableM:NaN}).status,'INCOMPATIBLE');
});
