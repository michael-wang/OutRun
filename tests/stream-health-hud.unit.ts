import {describe,it,expect} from 'vitest';
import {summarizeStreamHealth,type StreamHealthSample} from '../src/stream-health-hud';

const sample:StreamHealthSample={
  roadReady:5,roadDesired:7,sceneryReady:2,sceneryNearby:3,
  roadAheadM:2000,roadHeadroomSeconds:14,atRouteEnd:false,
  roadP95Ms:1100,roadSampleCount:24,workerPending:'prepare',workerAgeMs:800,
  roadsUnrequested:1,sceneryUnrequested:2,commitQueue:0,retireQueue:0,
  heapUsedBytes:30*1048576,heapLimitBytes:120*1048576,
  geometries:124,textures:6,fps:57,stalls:0,
};
describe('R/S/M opt-in streaming health interpretation',()=>{
 it('only treats measured chunk states as R/S progress',()=>{
  const x=summarizeStreamHealth(sample);
  expect(x.roadRatio).toBeCloseTo(5/7);
  expect(x.sceneryRatio).toBeCloseTo(2/3);
  expect(x.roadLevel).toBe('warn');
  expect(x.sceneryLevel).toBe('warn');
  expect(x.memoryRatio).toBeCloseTo(.25);
 });
 it('flags low continuous road headroom even with a full desired window',()=>{
  const x=summarizeStreamHealth({...sample,roadReady:7,roadDesired:7,roadHeadroomSeconds:3});
  expect(x.roadRatio).toBe(1);
  expect(x.roadLevel).toBe('bad');
  expect(summarizeStreamHealth({...sample,roadReady:7,roadDesired:7,roadHeadroomSeconds:24}).roadLevel).toBe('ok');
 });
 it('does not confuse route-end headroom with a road streaming failure',()=>{
  const x=summarizeStreamHealth({...sample,roadReady:7,roadDesired:7,roadHeadroomSeconds:.2,atRouteEnd:true});
  expect(x.roadLevel).toBe('ok');
 });
 it('reports unavailable JS heap without inventing RAM or GPU values',()=>{
  const x=summarizeStreamHealth({...sample,heapUsedBytes:null,heapLimitBytes:null});
  expect(x.memoryRatio).toBeNull();
 });
});
