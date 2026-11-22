import {it,expect,vi} from 'vitest';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {configureKentingCoast} from '../src/beach-macro';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';
import {KENTING_TERRAIN_DEMO,terrainDemoRibbon,terrainDemoVisibleIndex} from '../src/kenting-terrain-demo';
import {canonicalGameQuery,isDevelopmentRace} from '../src/runtime-query';

it('retains only the exact terrain demo query in development, without bypassing START',()=>{
 const options=(value:string)=>canonicalGameQuery(new URLSearchParams(value));
 expect(options('terrainDemo=1').get('terrainDemo')).toBe('1');
 expect(options('terrainDemo=true').has('terrainDemo')).toBe(false);
 expect(isDevelopmentRace(options('terrainDemo=1&hero3d=1'))).toBe(false);
 expect(isDevelopmentRace(options('at=4050&trafficSeed=8&terrainDemo=1'))).toBe(true);
 vi.stubEnv('DEV',false);
 try{expect(options('at=4050&terrainDemo=1').toString()).toBe('at=4050');}
 finally{vi.unstubAllEnvs();}
});

it('rejects non-native row boundaries and trims only complete footprint triangles',()=>{
 expect(terrainDemoRibbon(4501,5001,29,36,100)).toBeUndefined();
 expect(terrainDemoRibbon(4000,5000,23,29,200)).toBeUndefined();
 expect(terrainDemoRibbon(4000,5000,104,125,200)).toBeUndefined();
 expect(terrainDemoRibbon(4000,5000,29,36,200)).toMatchObject({firstIndex:660,lastIndex:948});
 const shared=Uint32Array.from([0,2,1,1,2,3,3,4,5,5,4,6]);
 expect([...terrainDemoVisibleIndex(shared,[{firstIndex:3,lastIndex:9}])]).toEqual([0,2,1,5,4,6]);
 expect([...shared]).toEqual([0,2,1,1,2,3,3,4,5,5,4,6]);
});

it('leaves every original road and contact array unchanged; one merged grass visual cut has a complete seam',()=>{
 configureKentingCoast();
 const {track,halfAt,weightsAt,stage}=coastWorkerRoad();
 const build=(from:number,to:number,active:boolean)=>prepareRoadChunk(track.sample,halfAt,weightsAt,from,to,track.length,false,true,[],
   d=>shoulderProfile(d,stage.seed),undefined,true,undefined,stage.scenerySections,undefined,false,false,active);
 const stock=build(4000,5000,false),demo=build(4000,5000,true);
 const compare=(stock:ReturnType<typeof build>,demo:ReturnType<typeof build>)=>{
  expect(demo.map(m=>m.kind)).toEqual(stock.map(m=>m.kind));
  for(const [i,m] of stock.entries()){
   const candidate=demo[i];
   expect(candidate.rayRanges).toEqual(m.rayRanges);
   for(const key of ['positions','colors','uvs','indices','normals'] as const){
    const a=m[key],b=candidate[key];
    if(a&&b)expect(Buffer.from(a.buffer,a.byteOffset,a.byteLength).equals(Buffer.from(b.buffer,b.byteOffset,b.byteLength))).toBe(true);
    else expect(a).toBe(b);
   }
  }
 };
 compare(stock,demo);
 const affected=demo.filter(m=>m.terrainDemoCuts);
 expect(affected).toHaveLength(1);
 const grass=affected[0],cuts=grass.terrainDemoCuts!;
 expect(grass.kind).toBe('grass');
 expect(grass.rayRanges).toBeUndefined();
 expect(cuts).toHaveLength(13);
 expect(cuts.every(c=>c.perimeter.every(i=>i*3<grass.positions.length))).toBe(true);
 const seam=new Set(cuts.flatMap(c=>c.perimeter.map(i=>Array.from(grass.positions.subarray(i*3,i*3+3)).join(','))));
 expect(seam.size).toBe(122);
 expect(terrainDemoVisibleIndex(grass.indices,cuts).length).toBe(grass.indices.length-1248*3);
 expect(KENTING_TERRAIN_DEMO.end).toBe(4790);
 compare(build(5000,6000,false),build(5000,6000,true));
},15000);
